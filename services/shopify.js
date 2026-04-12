/**
 * services/shopify.js
 *
 * Initialises the Shopify app instance once and exports it.
 * Both server.js and route files import from here — avoids circular deps.
 */

import { shopifyApp } from "@shopify/shopify-app-express";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import { ApiVersion } from "@shopify/shopify-api";

export const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SHOPIFY_SCOPES?.split(",").map((s) => s.trim()),
    hostName: process.env.SHOPIFY_APP_URL?.replace(/^https?:\/\//, ""),
    apiVersion: ApiVersion.January25,
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage: new SQLiteSessionStorage(
    process.env.SESSION_DB_PATH ?? "sessions.db"
  ),
});
