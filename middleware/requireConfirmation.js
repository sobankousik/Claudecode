/**
 * middleware/requireConfirmation.js
 *
 * Confirmation layer — destructive actions (DELETE, order cancellation, etc.)
 * are NOT executed immediately.  Instead they are stored as a "pending"
 * operation and the caller receives a confirmation_token.
 *
 * To execute: POST /plugin/confirm/:token
 * Tokens expire after CONFIRMATION_TTL_MINUTES (default 5 min).
 *
 * Flow:
 *   1. Client calls DELETE /plugin/products/123
 *   2. This middleware intercepts → saves pending op → returns 202 + token
 *   3. Client POSTs to /plugin/confirm/<token>
 *   4. The pending op is re-executed and the token is deleted
 */

import { v4 as uuidv4 } from "uuid";
import { stmts } from "../services/db.js";

const TTL_MINUTES = Number(process.env.CONFIRMATION_TTL_MINUTES ?? 5);

/**
 * requireConfirmation(label)
 *
 * @param {string} label  - human-readable description, e.g. "Delete product"
 */
export function requireConfirmation(label) {
  return (req, res, next) => {
    // If this request already carries the confirmation header, skip gating
    if (req.headers["x-confirm-token"]) return next();

    const session = res.locals.shopify?.session;
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000)
      .toISOString()
      .replace("T", " ")
      .split(".")[0];

    // Purge stale tokens opportunistically
    stmts.purgeExpired.run();

    stmts.insertConfirmation.run({
      token,
      shop: session?.shop ?? "unknown",
      method: req.method,
      path: req.originalUrl,
      body: req.body ? JSON.stringify(req.body) : null,
      expires_at: expiresAt,
    });

    return res.status(202).json({
      pending: true,
      action: label,
      method: req.method,
      path: req.originalUrl,
      confirmation_token: token,
      expires_in_minutes: TTL_MINUTES,
      confirm_url: `/plugin/confirm/${token}`,
      message: `Send POST /plugin/confirm/${token} to execute this action.`,
    });
  };
}
