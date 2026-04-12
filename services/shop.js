/**
 * services/shop.js
 * Returns metadata about the connected Shopify store.
 */

import { shopify } from "./shopify.js";

export async function getShopInfo(session) {
  const { body } = await new shopify.api.clients.Rest({ session }).get({
    path: "shop",
  });
  return body.shop;
}
