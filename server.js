import "express-async-errors";
import "dotenv/config";
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { shopifyApp } from "@shopify/shopify-app-express";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import { ApiVersion } from "@shopify/shopify-api";

import authRouter from "./routes/auth.js";
import pluginRouter from "./routes/plugin.js";
import webhookRouter from "./routes/webhooks.js";

// ─── Shopify app initialisation ───────────────────────────────────────────────
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

// ─── Express setup ────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cookieParser());

// Raw body needed for Shopify webhook HMAC verification — must come BEFORE
// the json middleware on the webhooks path.
app.use("/api/webhooks", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Shopify OAuth middleware ─────────────────────────────────────────────────
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);

// ─── Routes ───────────────────────────────────────────────────────────────────
// Auth helper (install link + session info)
app.use("/api/auth", authRouter);

// Webhooks (raw body, no session guard)
app.use("/api/webhooks", webhookRouter);

// /plugin — all plugin endpoints (session-guarded)
app.use("/plugin", shopify.validateAuthenticatedSession(), pluginRouter);

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status ?? err.statusCode ?? 500;
  res.status(status).json({
    error: err.message ?? "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`Shopify plugin server running on port ${PORT}`);
  console.log(`Install URL: ${process.env.SHOPIFY_APP_URL}/api/auth?shop=<your-store>.myshopify.com`);
});

export default app;
