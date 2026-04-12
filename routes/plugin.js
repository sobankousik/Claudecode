/**
 * routes/plugin.js
 *
 * Core /plugin router — all endpoints are session-guarded by the
 * shopify.validateAuthenticatedSession() middleware applied in server.js.
 *
 * Endpoints:
 *   GET  /plugin                   → plugin info + connected shop summary
 *   GET  /plugin/products          → list products (with search & pagination)
 *   GET  /plugin/products/:id      → single product detail
 *   POST /plugin/products          → create a product
 *   PUT  /plugin/products/:id      → update a product
 *   DELETE /plugin/products/:id    → delete a product
 *   GET  /plugin/orders            → list orders
 *   GET  /plugin/orders/:id        → single order detail
 *   GET  /plugin/marketplace       → Shopify marketplace / app listing data
 *   GET  /plugin/marketplace/search → search Shopify marketplace apps/themes
 *   GET  /plugin/shop              → connected shop metadata
 */

import { Router } from "express";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/products.js";
import { listOrders, getOrder } from "../services/orders.js";
import {
  getMarketplaceInfo,
  searchMarketplace,
} from "../services/marketplace.js";
import { getShopInfo } from "../services/shop.js";

const router = Router();

// ─── Plugin root ──────────────────────────────────────────────────────────────

/**
 * GET /plugin
 * Returns a summary of the plugin status and the connected shop.
 */
router.get("/", async (_req, res) => {
  const session = res.locals.shopify.session;
  res.json({
    plugin: "Shopify Plugin Integration",
    version: "1.0.0",
    status: "connected",
    shop: session.shop,
    scopes: session.scope,
    endpoints: {
      shop: "/plugin/shop",
      products: "/plugin/products",
      orders: "/plugin/orders",
      marketplace: "/plugin/marketplace",
    },
  });
});

// ─── Shop ─────────────────────────────────────────────────────────────────────

/**
 * GET /plugin/shop
 * Returns metadata about the connected Shopify store.
 */
router.get("/shop", async (_req, res) => {
  const session = res.locals.shopify.session;
  const shop = await getShopInfo(session);
  res.json({ shop });
});

// ─── Products ─────────────────────────────────────────────────────────────────

/**
 * GET /plugin/products
 * Query params:
 *   limit      (default 50, max 250)
 *   page_info  (cursor from previous response for pagination)
 *   title      (partial title search)
 *   vendor     filter by vendor
 *   product_type filter by type
 *   status     active | archived | draft
 */
router.get("/products", async (req, res) => {
  const session = res.locals.shopify.session;
  const { limit = 50, page_info, title, vendor, product_type, status } = req.query;

  const result = await listProducts(session, {
    limit: Math.min(Number(limit), 250),
    page_info,
    title,
    vendor,
    product_type,
    status,
  });
  res.json(result);
});

/**
 * GET /plugin/products/:id
 */
router.get("/products/:id", async (req, res) => {
  const session = res.locals.shopify.session;
  const product = await getProduct(session, req.params.id);
  res.json({ product });
});

/**
 * POST /plugin/products
 * Body: Shopify product object (title, body_html, vendor, variants, images, …)
 */
router.post("/products", async (req, res) => {
  const session = res.locals.shopify.session;
  const product = await createProduct(session, req.body);
  res.status(201).json({ product });
});

/**
 * PUT /plugin/products/:id
 * Body: partial product fields to update
 */
router.put("/products/:id", async (req, res) => {
  const session = res.locals.shopify.session;
  const product = await updateProduct(session, req.params.id, req.body);
  res.json({ product });
});

/**
 * DELETE /plugin/products/:id
 */
router.delete("/products/:id", async (req, res) => {
  const session = res.locals.shopify.session;
  await deleteProduct(session, req.params.id);
  res.json({ deleted: true, id: req.params.id });
});

// ─── Orders ───────────────────────────────────────────────────────────────────

/**
 * GET /plugin/orders
 * Query params:
 *   limit         (default 50, max 250)
 *   page_info     cursor pagination
 *   status        open | closed | cancelled | any  (default: any)
 *   financial_status  pending | authorized | paid | refunded | voided | any
 *   fulfillment_status  shipped | partial | unshipped | any
 *   created_at_min / created_at_max  ISO 8601 date filters
 */
router.get("/orders", async (req, res) => {
  const session = res.locals.shopify.session;
  const {
    limit = 50,
    page_info,
    status = "any",
    financial_status,
    fulfillment_status,
    created_at_min,
    created_at_max,
  } = req.query;

  const result = await listOrders(session, {
    limit: Math.min(Number(limit), 250),
    page_info,
    status,
    financial_status,
    fulfillment_status,
    created_at_min,
    created_at_max,
  });
  res.json(result);
});

/**
 * GET /plugin/orders/:id
 */
router.get("/orders/:id", async (req, res) => {
  const session = res.locals.shopify.session;
  const order = await getOrder(session, req.params.id);
  res.json({ order });
});

// ─── Marketplace ──────────────────────────────────────────────────────────────

/**
 * GET /plugin/marketplace
 * Returns information about this app's Shopify App Store listing and partner
 * account details (public data only).
 */
router.get("/marketplace", async (_req, res) => {
  const info = await getMarketplaceInfo();
  res.json(info);
});

/**
 * GET /plugin/marketplace/search
 * Query params:
 *   q      search query string
 *   type   apps | themes  (default: apps)
 *   page   page number (default 1)
 */
router.get("/marketplace/search", async (req, res) => {
  const { q, type = "apps", page = 1 } = req.query;
  if (!q) {
    return res.status(400).json({ error: "Missing required query param: q" });
  }
  const results = await searchMarketplace({ q, type, page: Number(page) });
  res.json(results);
});

export default router;
