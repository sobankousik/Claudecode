/**
 * routes/plugin.js
 *
 * Core /plugin router — all routes are session-guarded by the
 * shopify.validateAuthenticatedSession() middleware in server.js.
 *
 * Guardrails applied here:
 *   • dryRun(resource)          — ?dry_run=true returns a preview, no write
 *   • requireConfirmation(label) — destructive actions return a token first
 *   • saveSnapshot (in services) — state captured before every write
 *   • logWrite     (in services) — every write recorded in audit_log
 *
 * Endpoints
 * ─────────────────────────────────────────────────────────────────────────────
 *  GET    /plugin                         → plugin status + shop summary
 *  GET    /plugin/shop                    → connected store metadata
 *
 *  GET    /plugin/products                → list (search + pagination)
 *  GET    /plugin/products/:id            → single product
 *  POST   /plugin/products                → create  [dry_run supported]
 *  PUT    /plugin/products/:id            → update  [dry_run + snapshot]
 *  DELETE /plugin/products/:id            → delete  [confirmation required]
 *
 *  GET    /plugin/orders                  → list orders
 *  GET    /plugin/orders/:id              → single order
 *  POST   /plugin/orders/:id/cancel       → cancel  [confirmation required]
 *
 *  GET    /plugin/skills                         → catalog of all 63 skills
 *  GET    /plugin/skills/:category               → skills in one category
 *  GET    /plugin/skills/:category/:name         → full skill detail + SKILL.md
 *  POST   /plugin/skills/:category/:name/graphql → run a skill GraphQL op  [dry_run + confirmation]
 *
 *  GET    /plugin/marketplace             → toolkit + app store info
 *  GET    /plugin/marketplace/search      → search Shopify App Store
 *
 *  GET    /plugin/audit                   → paginated write history
 *  GET    /plugin/snapshots               → list available restore points
 *  POST   /plugin/restore/:snapshotId     → undo — restore to saved state
 *  POST   /plugin/confirm/:token          → execute a pending confirmation
 */

import { Router } from "express";
import { dryRun } from "../middleware/dryRun.js";
import { requireConfirmation } from "../middleware/requireConfirmation.js";
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from "../services/products.js";
import { listOrders, getOrder, cancelOrder } from "../services/orders.js";
import { getMarketplaceInfo, searchMarketplace } from "../services/marketplace.js";
import { getShopInfo } from "../services/shop.js";
import { getAuditLog } from "../services/audit.js";
import { listSnapshots, restoreSnapshot } from "../services/snapshots.js";
import { stmts } from "../services/db.js";
import skillsRouter from "./skills.js";

const router = Router();

// ─── Skills (63 Shopify Admin Skills with guardrails) ─────────────────────────
// Mounted before other routes so /plugin/confirm re-dispatch covers skill mutations.
router.use("/skills", skillsRouter);

// ─── Plugin root ──────────────────────────────────────────────────────────────

router.get("/", async (_req, res) => {
  const session = res.locals.shopify.session;
  res.json({
    plugin: "Shopify Plugin Integration",
    version: "1.0.0",
    status: "connected",
    shop: session.shop,
    scopes: session.scope,
    guardrails: {
      dry_run: "Add ?dry_run=true to any write request to preview without executing",
      confirmation: "Destructive actions return a confirmation_token — POST /plugin/confirm/:token to proceed",
      snapshots: "State is snapshotted before every write — GET /plugin/snapshots to list restore points",
      audit_log: "Every write is logged — GET /plugin/audit to review history",
    },
    endpoints: {
      shop: "/plugin/shop",
      products: "/plugin/products",
      orders: "/plugin/orders",
      skills: "/plugin/skills",
      marketplace: "/plugin/marketplace",
      audit: "/plugin/audit",
      snapshots: "/plugin/snapshots",
    },
  });
});

// ─── Shop ─────────────────────────────────────────────────────────────────────

router.get("/shop", async (_req, res) => {
  const session = res.locals.shopify.session;
  const shop = await getShopInfo(session);
  res.json({ shop });
});

// ─── Products ─────────────────────────────────────────────────────────────────

router.get("/products", async (req, res) => {
  const session = res.locals.shopify.session;
  const { limit = 50, page_info, title, vendor, product_type, status } = req.query;
  const result = await listProducts(session, {
    limit: Math.min(Number(limit), 250),
    page_info, title, vendor, product_type, status,
  });
  res.json(result);
});

router.get("/products/:id", async (req, res) => {
  const session = res.locals.shopify.session;
  const product = await getProduct(session, req.params.id);
  res.json({ product });
});

router.post(
  "/products",
  dryRun("product"),              // ?dry_run=true → preview only
  async (req, res) => {
    const session = res.locals.shopify.session;
    const product = await createProduct(session, req.body);
    res.status(201).json({ product });
  }
);

router.put(
  "/products/:id",
  dryRun("product"),              // ?dry_run=true → preview only
  async (req, res) => {
    const session = res.locals.shopify.session;
    const product = await updateProduct(session, req.params.id, req.body);
    res.json({ product });
  }
);

router.delete(
  "/products/:id",
  requireConfirmation("Delete product"),   // returns 202 + token
  async (req, res) => {
    const session = res.locals.shopify.session;
    await deleteProduct(session, req.params.id);
    res.json({ deleted: true, id: req.params.id });
  }
);

// ─── Orders ───────────────────────────────────────────────────────────────────

router.get("/orders", async (req, res) => {
  const session = res.locals.shopify.session;
  const {
    limit = 50, page_info, status = "any",
    financial_status, fulfillment_status,
    created_at_min, created_at_max,
  } = req.query;
  const result = await listOrders(session, {
    limit: Math.min(Number(limit), 250),
    page_info, status, financial_status,
    fulfillment_status, created_at_min, created_at_max,
  });
  res.json(result);
});

router.get("/orders/:id", async (req, res) => {
  const session = res.locals.shopify.session;
  const order = await getOrder(session, req.params.id);
  res.json({ order });
});

router.post(
  "/orders/:id/cancel",
  requireConfirmation("Cancel order"),     // returns 202 + token
  async (req, res) => {
    const session = res.locals.shopify.session;
    const order = await cancelOrder(session, req.params.id, req.body.reason);
    res.json({ order });
  }
);

// ─── Marketplace ──────────────────────────────────────────────────────────────

router.get("/marketplace", async (_req, res) => {
  const info = await getMarketplaceInfo();
  res.json(info);
});

router.get("/marketplace/search", async (req, res) => {
  const { q, type = "apps", page = 1 } = req.query;
  if (!q) return res.status(400).json({ error: "Missing required query param: q" });
  const results = await searchMarketplace({ q, type, page: Number(page) });
  res.json(results);
});

// ─── Audit log ────────────────────────────────────────────────────────────────

/**
 * GET /plugin/audit
 * Query: limit (default 50), offset (default 0)
 */
router.get("/audit", (req, res) => {
  const session = res.locals.shopify.session;
  const limit = Math.min(Number(req.query.limit ?? 50), 250);
  const offset = Number(req.query.offset ?? 0);
  const entries = getAuditLog(session.shop, limit, offset);
  res.json({ entries, limit, offset });
});

// ─── Snapshots / Undo ─────────────────────────────────────────────────────────

/**
 * GET /plugin/snapshots
 * Lists available restore points for this shop.
 */
router.get("/snapshots", (req, res) => {
  const session = res.locals.shopify.session;
  const limit = Math.min(Number(req.query.limit ?? 50), 250);
  const snapshots = listSnapshots(session.shop, limit);
  res.json({ snapshots });
});

/**
 * POST /plugin/restore/:snapshotId
 *
 * Undo / restore to previous version.
 * Requires confirmation like any other destructive action.
 */
router.post(
  "/restore/:snapshotId",
  requireConfirmation("Restore to snapshot"),
  async (req, res) => {
    const session = res.locals.shopify.session;
    const result = await restoreSnapshot(req.params.snapshotId, session);
    res.json({ restored: true, snapshot_id: req.params.snapshotId, result });
  }
);

// ─── Confirmation executor ────────────────────────────────────────────────────

/**
 * POST /plugin/confirm/:token
 *
 * Executes a pending confirmation.  The original request method + path + body
 * are re-dispatched internally.
 */
router.post("/confirm/:token", async (req, res) => {
  const session = res.locals.shopify.session;

  stmts.purgeExpired.run();
  const pending = stmts.getConfirmation.get({ token: req.params.token });

  if (!pending) {
    return res.status(404).json({ error: "Confirmation token not found or expired" });
  }
  if (pending.shop !== session.shop) {
    return res.status(403).json({ error: "Token does not belong to this shop" });
  }

  // Delete the token first (one-time use)
  stmts.deleteConfirmation.run({ token: req.params.token });

  // Re-dispatch internally by injecting the confirmed action's body
  // and forwarding to the correct route via a synthetic sub-request
  const body = pending.body ? JSON.parse(pending.body) : {};
  const method = pending.method.toLowerCase();
  const targetPath = pending.path.replace(/^\/plugin/, "").split("?")[0];

  // Execute the original action via the router
  req.method = pending.method;
  req.url = targetPath;
  req.body = body;
  // Set header so requireConfirmation knows this is already confirmed
  req.headers["x-confirm-token"] = req.params.token;

  router.handle(req, res, (err) => {
    if (err) {
      res.status(err.status ?? 500).json({ error: err.message });
    }
  });
});

export default router;
