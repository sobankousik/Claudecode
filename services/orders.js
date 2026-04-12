/**
 * services/orders.js
 *
 * Shopify Orders REST API wrapper (read + cancel).
 * Cancel is treated as a destructive action — it snapshots before executing.
 */

import { shopify } from "../server.js";
import { saveSnapshot } from "./snapshots.js";
import { logWrite } from "./audit.js";

function client(session) {
  return new shopify.api.clients.Rest({ session });
}

export async function listOrders(session, params = {}) {
  const { body } = await client(session).get({
    path: "orders",
    query: Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined)
    ),
  });
  return body;
}

export async function getOrder(session, id) {
  const { body } = await client(session).get({ path: `orders/${id}` });
  return body.order;
}

export async function cancelOrder(session, id, reason = "other") {
  const current = await getOrder(session, id);
  saveSnapshot({ shop: session.shop, resource: "order", resource_id: id, data: current });

  const { body } = await client(session).post({
    path: `orders/${id}/cancel`,
    data: { reason },
  });
  logWrite({
    shop: session.shop,
    session_id: session.id,
    method: "POST",
    path: `orders/${id}/cancel`,
    resource: "order",
    resource_id: id,
    payload: { reason },
  });
  return body.order;
}
