/**
 * services/products.js
 *
 * Shopify Products REST API wrapper.
 * All write methods (create / update / delete) automatically:
 *   - save a snapshot of the previous state before modifying
 *   - write an audit log entry after the operation
 */

import { shopify } from "./shopify.js";
import { saveSnapshot } from "./snapshots.js";
import { logWrite } from "./audit.js";

function client(session) {
  return new shopify.api.clients.Rest({ session });
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function listProducts(session, params = {}) {
  const { body } = await client(session).get({
    path: "products",
    query: Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined)
    ),
  });
  return body;
}

export async function getProduct(session, id) {
  const { body } = await client(session).get({ path: `products/${id}` });
  return body.product;
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createProduct(session, data) {
  const { body } = await client(session).post({
    path: "products",
    data: { product: data },
  });
  logWrite({
    shop: session.shop,
    session_id: session.id,
    method: "POST",
    path: "products",
    resource: "product",
    resource_id: body.product?.id,
    payload: data,
  });
  return body.product;
}

export async function updateProduct(session, id, data) {
  // Snapshot current state before modifying
  const current = await getProduct(session, id);
  saveSnapshot({ shop: session.shop, resource: "product", resource_id: id, data: current });

  const { body } = await client(session).put({
    path: `products/${id}`,
    data: { product: data },
  });
  logWrite({
    shop: session.shop,
    session_id: session.id,
    method: "PUT",
    path: `products/${id}`,
    resource: "product",
    resource_id: id,
    payload: data,
  });
  return body.product;
}

export async function deleteProduct(session, id) {
  // Snapshot before deletion so it can be restored
  const current = await getProduct(session, id);
  saveSnapshot({ shop: session.shop, resource: "product", resource_id: id, data: current });

  await client(session).delete({ path: `products/${id}` });
  logWrite({
    shop: session.shop,
    session_id: session.id,
    method: "DELETE",
    path: `products/${id}`,
    resource: "product",
    resource_id: id,
  });
}
