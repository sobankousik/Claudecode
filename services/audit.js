/**
 * services/audit.js
 *
 * Records every write operation (POST / PUT / PATCH / DELETE) to the
 * audit_log table.  Called automatically by the auditLog middleware and
 * by the snapshot/restore service.
 *
 * GET /plugin/audit  returns paginated entries for a shop.
 */

import { stmts } from "./db.js";

/**
 * Log a write operation.
 *
 * @param {object} opts
 * @param {string} opts.shop         - mystore.myshopify.com
 * @param {string} [opts.session_id] - Shopify session ID
 * @param {string} opts.method       - HTTP method (POST, PUT, DELETE …)
 * @param {string} opts.path         - request path
 * @param {string} opts.resource     - resource type  (product, order …)
 * @param {string} [opts.resource_id]
 * @param {object} [opts.payload]    - request body
 * @param {boolean} [opts.dry_run]
 */
export function logWrite({ shop, session_id, method, path, resource, resource_id, payload, dry_run = false }) {
  stmts.insertAudit.run({
    shop,
    session_id: session_id ?? null,
    method,
    path,
    resource,
    resource_id: resource_id ?? null,
    payload: payload ? JSON.stringify(payload) : null,
    dry_run: dry_run ? 1 : 0,
  });
}

/**
 * Fetch paginated audit log entries for a shop.
 *
 * @param {string} shop
 * @param {number} [limit=50]
 * @param {number} [offset=0]
 * @returns {object[]}
 */
export function getAuditLog(shop, limit = 50, offset = 0) {
  const rows = stmts.listAudit.all({ shop, limit, offset });
  return rows.map((r) => ({
    ...r,
    payload: r.payload ? JSON.parse(r.payload) : null,
    dry_run: Boolean(r.dry_run),
  }));
}
