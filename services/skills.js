/**
 * services/skills.js
 *
 * Skill catalog reader and GraphQL executor for the 63 Shopify Admin Skills
 * loaded from the shopify-admin-skills submodule.
 *
 * Exports:
 *   loadSkillCatalog()          → full catalog keyed by category
 *   getSkill(category, name)    → single skill details + raw SKILL.md content
 *   executeSkillGraphQL(session, opts) → execute a GraphQL op with audit logging
 */

import { readdirSync, readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { shopify } from "./shopify.js";
import { logWrite } from "./audit.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_ROOT = path.join(__dirname, "..", "shopify-admin-skills", "skills");

// ─── Frontmatter parser ───────────────────────────────────────────────────────
// Parses the YAML front-matter block between the opening and closing --- delimiters.
// Handles scalar values, quoted strings, and simple list items (  - value).

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fm = {};
  let currentKey = null;

  for (const line of match[1].split("\n")) {
    const listItem = line.match(/^  - (.+)$/);
    if (listItem && currentKey && Array.isArray(fm[currentKey])) {
      fm[currentKey].push(listItem[1].trim());
      continue;
    }

    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const raw = kv[2].trim().replace(/^["']|["']$/g, "");
      // Empty value after colon → start of a list
      fm[currentKey] = raw === "" ? [] : raw;
    }
  }

  return fm;
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

/**
 * Load the full skill catalog from the submodule.
 * Returns an object keyed by category, each value an array of skill summaries.
 *
 * @returns {{ [category: string]: SkillSummary[] }}
 */
export function loadSkillCatalog() {
  if (!existsSync(SKILLS_ROOT)) return {};

  const catalog = {};

  for (const category of readdirSync(SKILLS_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)) {
    const categoryPath = path.join(SKILLS_ROOT, category);
    catalog[category] = [];

    for (const skillDir of readdirSync(categoryPath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)) {
      const skillPath = path.join(categoryPath, skillDir, "SKILL.md");
      if (!existsSync(skillPath)) continue;

      const fm = parseFrontmatter(readFileSync(skillPath, "utf8"));
      catalog[category].push({
        name: fm.name || skillDir,
        slug: skillDir,
        category,
        description: fm.description || "",
        graphql_operations: Array.isArray(fm.graphql_operations) ? fm.graphql_operations : [],
        api_version: fm.api_version || "2025-01",
        status: fm.status || "stable",
        skill_url: `/plugin/skills/${category}/${skillDir}`,
        run_url: `/plugin/skills/${category}/${skillDir}/graphql`,
      });
    }
  }

  return catalog;
}

/**
 * Retrieve a single skill's full details including the raw SKILL.md content.
 *
 * @param {string} category
 * @param {string} skillName  - the directory slug (e.g. "shopify-admin-bulk-price-adjustment")
 * @returns {object|null}
 */
export function getSkill(category, skillName) {
  const skillPath = path.join(SKILLS_ROOT, category, skillName, "SKILL.md");
  if (!existsSync(skillPath)) return null;

  const content = readFileSync(skillPath, "utf8");
  const fm = parseFrontmatter(content);

  return {
    name: fm.name || skillName,
    slug: skillName,
    category,
    description: fm.description || "",
    graphql_operations: Array.isArray(fm.graphql_operations) ? fm.graphql_operations : [],
    api_version: fm.api_version || "2025-01",
    status: fm.status || "stable",
    content,
    graphql_url: `/plugin/skills/${category}/${skillName}/graphql`,
  };
}

// ─── GraphQL executor ─────────────────────────────────────────────────────────

// Mutations whose names match these patterns are treated as destructive and
// require a confirmation token before executing.
const DESTRUCTIVE_RE = /\b(cancel|delete|destroy|remove|drop|refund|revert)\b/i;

/**
 * Returns true if the query string is a mutation AND contains a destructive
 * operation name (cancel, delete, destroy, remove, drop, refund, revert).
 */
export function isDestructiveMutation(query) {
  return /^\s*mutation\b/i.test(query.trim()) && DESTRUCTIVE_RE.test(query);
}

/**
 * Execute a GraphQL operation against the Shopify Admin API.
 * Applies dry-run interception and audit logging automatically.
 *
 * @param {object} session   - Shopify session from res.locals.shopify.session
 * @param {object} opts
 * @param {string} opts.query           - GraphQL document string
 * @param {object} [opts.variables={}]  - GraphQL variables
 * @param {string} [opts.operationName] - optional operation name (for audit)
 * @param {boolean} [opts.dry_run]      - if true, preview only — nothing sent to Shopify
 * @param {string} [opts.skill]         - skill slug (for audit)
 * @param {string} [opts.category]      - skill category (for audit)
 * @returns {object}
 */
export async function executeSkillGraphQL(session, {
  query,
  variables = {},
  operationName,
  dry_run = false,
  skill = "unknown",
  category = "unknown",
}) {
  const isMutation = /^\s*mutation\b/i.test(query.trim());
  const resourcePath = `/plugin/skills/${category}/${skill}`;

  if (dry_run) {
    logWrite({
      shop: session.shop,
      session_id: session.id,
      method: isMutation ? "MUTATION" : "QUERY",
      path: resourcePath,
      resource: `skill:${skill}`,
      payload: { operationName, variables },
      dry_run: true,
    });

    return {
      dry_run: true,
      skill,
      category,
      operation: operationName || (isMutation ? "mutation" : "query"),
      would_execute: {
        query,
        variables,
      },
    };
  }

  const client = new shopify.api.clients.Graphql({ session });
  const response = await client.request(query, { variables });

  logWrite({
    shop: session.shop,
    session_id: session.id,
    method: isMutation ? "MUTATION" : "QUERY",
    path: resourcePath,
    resource: `skill:${skill}`,
    payload: { operationName, variables },
    dry_run: false,
  });

  return response;
}
