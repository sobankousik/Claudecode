/**
 * routes/skills.js
 *
 * Skills router — mounted at /plugin/skills by routes/plugin.js.
 * Because it lives inside the pluginRouter, the /plugin/confirm/:token
 * re-dispatch mechanism automatically covers destructive skill mutations.
 *
 * Guardrails applied:
 *   • dryRun          — ?dry_run=true or body.dry_run:true → preview, no Shopify call
 *   • Audit log       — every execution (query + mutation) written to guardrails.db
 *   • Confirmation    — destructive mutations (cancel/delete/destroy/refund …) return
 *                       a confirmation_token; caller must POST /plugin/confirm/:token
 *
 * Endpoints
 * ─────────────────────────────────────────────────────────────────────────────
 *  GET  /plugin/skills                       → full catalog (all 63 skills)
 *  GET  /plugin/skills/:category             → skills in one category
 *  GET  /plugin/skills/:category/:name       → full skill detail + SKILL.md content
 *  POST /plugin/skills/:category/:name/graphql → execute a GraphQL op with guardrails
 */

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { loadSkillCatalog, getSkill, executeSkillGraphQL, isDestructiveMutation } from "../services/skills.js";
import { stmts } from "../services/db.js";

const router = Router();
const TTL_MINUTES = Number(process.env.CONFIRMATION_TTL_MINUTES ?? 5);

// ─── Catalog ──────────────────────────────────────────────────────────────────

/**
 * GET /plugin/skills
 * Returns the full catalog of all 63 skills grouped by category.
 */
router.get("/", (_req, res) => {
  const catalog = loadSkillCatalog();
  const categories = Object.keys(catalog);
  const total = categories.reduce((n, c) => n + catalog[c].length, 0);

  res.json({
    total,
    categories: categories.length,
    catalog,
    guardrails: {
      dry_run:      "Add ?dry_run=true to any /graphql call to preview without executing",
      confirmation: "Destructive mutations return a confirmation_token — POST /plugin/confirm/:token to proceed",
      audit_log:    "Every execution is logged — GET /plugin/audit to review history",
    },
  });
});

// ─── Category listing ─────────────────────────────────────────────────────────

/**
 * GET /plugin/skills/:category
 * Returns skills in a single category.
 */
router.get("/:category", (req, res) => {
  const catalog = loadSkillCatalog();
  const skills = catalog[req.params.category];
  if (!skills) {
    return res.status(404).json({ error: `Category '${req.params.category}' not found` });
  }
  res.json({ category: req.params.category, count: skills.length, skills });
});

// ─── Skill detail ─────────────────────────────────────────────────────────────

/**
 * GET /plugin/skills/:category/:name
 * Returns full skill details including the raw SKILL.md content and all
 * GraphQL operations — everything Claude needs to run the skill.
 */
router.get("/:category/:name", (req, res) => {
  const skill = getSkill(req.params.category, req.params.name);
  if (!skill) {
    return res.status(404).json({
      error: `Skill '${req.params.name}' not found in category '${req.params.category}'`,
    });
  }
  res.json(skill);
});

// ─── GraphQL executor ─────────────────────────────────────────────────────────

/**
 * POST /plugin/skills/:category/:name/graphql
 *
 * Execute a single GraphQL operation (query or mutation) from a skill workflow.
 * Guardrails applied:
 *   - dry_run: true  → preview only, audited, nothing sent to Shopify
 *   - destructive mutation (cancel/delete/destroy …) → confirmation token required
 *   - all executions → written to audit_log
 *
 * Request body:
 * {
 *   "query":          string   — GraphQL document (required)
 *   "variables":      object   — GraphQL variables (optional)
 *   "operation_name": string   — operation name for audit (optional)
 *   "dry_run":        boolean  — also accepts ?dry_run=true query param (optional)
 * }
 */
router.post("/:category/:name/graphql", async (req, res) => {
  const { category, name } = req.params;
  const { query, variables = {}, operation_name, dry_run: bodyDryRun } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Missing required field: query" });
  }

  const session = res.locals.shopify.session;
  const isDryRun = bodyDryRun === true || req.query.dry_run === "true";

  // ── Destructive mutation guard ──────────────────────────────────────────────
  // Bypass if: dry_run is active, or request already carries a confirm token.
  if (isDestructiveMutation(query) && !isDryRun && !req.headers["x-confirm-token"]) {
    stmts.purgeExpired.run();

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000)
      .toISOString()
      .replace("T", " ")
      .split(".")[0];

    stmts.insertConfirmation.run({
      token,
      shop: session.shop,
      method: "POST",
      path: req.originalUrl,
      body: JSON.stringify(req.body),
      expires_at: expiresAt,
    });

    return res.status(202).json({
      pending: true,
      action: `Execute destructive mutation${operation_name ? `: ${operation_name}` : ""}`,
      skill: name,
      category,
      confirmation_token: token,
      expires_in_minutes: TTL_MINUTES,
      confirm_url: `/plugin/confirm/${token}`,
      message: `Send POST /plugin/confirm/${token} to execute this mutation.`,
    });
  }

  // ── Execute (or dry-run) ────────────────────────────────────────────────────
  const result = await executeSkillGraphQL(session, {
    query,
    variables,
    operationName: operation_name,
    dry_run: isDryRun,
    skill: name,
    category,
  });

  res.json(result);
});

export default router;
