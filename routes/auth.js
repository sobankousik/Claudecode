/**
 * routes/auth.js
 *
 * Helper endpoints for authentication & session information.
 * The actual OAuth begin/callback is handled by the Shopify middleware
 * registered in server.js; these endpoints are supplementary.
 */

import { Router } from "express";
import { shopify } from "../services/shopify.js";

const router = Router();

/**
 * GET /api/auth/status
 *
 * Returns the current session information for the authenticated shop.
 * Useful for frontends to check whether the session is still valid.
 */
router.get("/status", shopify.validateAuthenticatedSession(), async (req, res) => {
  const session = res.locals.shopify.session;
  res.json({
    authenticated: true,
    shop: session.shop,
    scope: session.scope,
    isOnline: session.isOnline,
    expires: session.expires ?? null,
  });
});

/**
 * GET /api/auth/install
 *
 * Convenience redirect — sends the merchant through the OAuth install flow.
 * Query param: shop  (e.g. my-store.myshopify.com)
 *
 * Usage: redirect merchants to  /api/auth/install?shop=<store>.myshopify.com
 */
router.get("/install", (req, res) => {
  const { shop } = req.query;
  if (!shop) {
    return res.status(400).json({ error: "Missing required query param: shop" });
  }
  // Redirect into Shopify OAuth begin
  res.redirect(`/api/auth?shop=${encodeURIComponent(shop)}`);
});

export default router;
