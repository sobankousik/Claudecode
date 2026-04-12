/**
 * middleware/dryRun.js
 *
 * Dry-run guard — when ?dry_run=true is present on a write request,
 * intercept before the route handler executes and return a preview of
 * what WOULD be sent to Shopify without actually calling the API.
 *
 * Usage: apply before any write route handler.
 *
 * Response shape:
 * {
 *   dry_run: true,
 *   method:  "POST",
 *   path:    "/plugin/products",
 *   shop:    "my-store.myshopify.com",
 *   would_send: { <request body> }
 * }
 */

import { logWrite } from "../services/audit.js";

export function dryRun(resource) {
  return (req, res, next) => {
    if (req.query.dry_run !== "true") return next();

    const session = res.locals.shopify?.session;
    logWrite({
      shop: session?.shop ?? "unknown",
      session_id: session?.id,
      method: req.method,
      path: req.path,
      resource,
      resource_id: req.params.id ?? null,
      payload: req.body,
      dry_run: true,
    });

    return res.json({
      dry_run: true,
      method: req.method,
      path: req.originalUrl,
      shop: session?.shop ?? null,
      would_send: req.body,
    });
  };
}
