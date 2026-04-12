/**
 * services/snapshots.js
 *
 * Snapshot & restore — the "undo button".
 *
 * Before any write that modifies an existing resource, the caller should
 * invoke saveSnapshot() to capture the current state.  The snapshot is
 * stored in SQLite and can later be restored via restoreSnapshot().
 *
 * Endpoints (wired in routes/plugin.js):
 *   GET  /plugin/snapshots              → list recent snapshots for the shop
 *   POST /plugin/restore/:snapshotId    → restore a resource to snapshotted state
 */

import { v4 as uuidv4 } from "uuid";
import { stmts } from "./db.js";
import { shopify } from "../server.js";

/**
 * Save a snapshot of a resource before it is modified.
 *
 * @param {object} opts
 * @param {string} opts.shop
 * @param {string} opts.resource    - "product" | "order" | …
 * @param {string} opts.resource_id
 * @param {object} opts.data        - current state fetched from Shopify
 * @returns {string} snapshot ID
 */
export function saveSnapshot({ shop, resource, resource_id, data }) {
  const id = uuidv4();
  stmts.insertSnapshot.run({
    id,
    shop,
    resource,
    resource_id: String(resource_id),
    data: JSON.stringify(data),
  });
  return id;
}

/**
 * List recent snapshots for a shop (metadata only, no full data).
 */
export function listSnapshots(shop, limit = 50) {
  return stmts.listSnapshots.all({ shop, limit });
}

/**
 * Restore a resource to its snapshotted state by replaying the saved
 * payload back to Shopify via a PUT request.
 *
 * @param {string} snapshotId
 * @param {object} session - Shopify session
 * @returns {object} restored resource data
 */
export async function restoreSnapshot(snapshotId, session) {
  const row = stmts.getSnapshot.get({ id: snapshotId });
  if (!row) throw Object.assign(new Error("Snapshot not found"), { status: 404 });
  if (row.shop !== session.shop) {
    throw Object.assign(new Error("Snapshot does not belong to this shop"), { status: 403 });
  }

  const data = JSON.parse(row.data);
  const client = new shopify.api.clients.Rest({ session });

  // PUT the snapshot back — works for products, orders, and most REST resources
  const response = await client.put({
    path: `${row.resource}s/${row.resource_id}`,
    data: { [row.resource]: data },
  });

  return response.body;
}
