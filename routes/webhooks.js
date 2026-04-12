/**
 * routes/webhooks.js
 *
 * Shopify webhook receiver.  All routes receive raw bodies (set in server.js)
 * so HMAC verification works correctly.
 *
 * Shopify calls these endpoints automatically when subscribed events fire.
 * Register webhooks in your Partner Dashboard or via the Admin API.
 */

import { Router } from "express";
import { shopify } from "../server.js";
import { logWrite } from "../services/audit.js";

const router = Router();

// Let the Shopify SDK verify HMAC and dispatch to registered handlers.
// Handlers are registered below using shopify.api.webhooks.addHandlers().
router.post("/", shopify.processWebhooks({
  webhookHandlers: {
    // ── Products ────────────────────────────────────────────────────────────
    PRODUCTS_CREATE: {
      deliveryMethod: "http",
      callbackUrl: "/api/webhooks",
      callback: async (topic, shop, body) => {
        const product = JSON.parse(body);
        logWrite({ shop, method: "WEBHOOK", path: topic, resource: "product", resource_id: product.id, payload: product });
        console.log(`[webhook] ${topic} shop=${shop} product=${product.id}`);
      },
    },
    PRODUCTS_UPDATE: {
      deliveryMethod: "http",
      callbackUrl: "/api/webhooks",
      callback: async (topic, shop, body) => {
        const product = JSON.parse(body);
        logWrite({ shop, method: "WEBHOOK", path: topic, resource: "product", resource_id: product.id, payload: product });
        console.log(`[webhook] ${topic} shop=${shop} product=${product.id}`);
      },
    },
    PRODUCTS_DELETE: {
      deliveryMethod: "http",
      callbackUrl: "/api/webhooks",
      callback: async (topic, shop, body) => {
        const data = JSON.parse(body);
        logWrite({ shop, method: "WEBHOOK", path: topic, resource: "product", resource_id: data.id });
        console.log(`[webhook] ${topic} shop=${shop} product=${data.id}`);
      },
    },

    // ── Orders ──────────────────────────────────────────────────────────────
    ORDERS_CREATE: {
      deliveryMethod: "http",
      callbackUrl: "/api/webhooks",
      callback: async (topic, shop, body) => {
        const order = JSON.parse(body);
        logWrite({ shop, method: "WEBHOOK", path: topic, resource: "order", resource_id: order.id, payload: order });
        console.log(`[webhook] ${topic} shop=${shop} order=${order.id}`);
      },
    },
    ORDERS_UPDATED: {
      deliveryMethod: "http",
      callbackUrl: "/api/webhooks",
      callback: async (topic, shop, body) => {
        const order = JSON.parse(body);
        logWrite({ shop, method: "WEBHOOK", path: topic, resource: "order", resource_id: order.id, payload: order });
        console.log(`[webhook] ${topic} shop=${shop} order=${order.id}`);
      },
    },
    ORDERS_CANCELLED: {
      deliveryMethod: "http",
      callbackUrl: "/api/webhooks",
      callback: async (topic, shop, body) => {
        const order = JSON.parse(body);
        logWrite({ shop, method: "WEBHOOK", path: topic, resource: "order", resource_id: order.id });
        console.log(`[webhook] ${topic} shop=${shop} order=${order.id}`);
      },
    },

    // ── App lifecycle ────────────────────────────────────────────────────────
    APP_UNINSTALLED: {
      deliveryMethod: "http",
      callbackUrl: "/api/webhooks",
      callback: async (_topic, shop) => {
        console.log(`[webhook] APP_UNINSTALLED shop=${shop}`);
      },
    },
  },
}));

export default router;
