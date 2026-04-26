import "express-async-errors";
import "dotenv/config";
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { shopify } from "./services/shopify.js";
import authRouter from "./routes/auth.js";
import pluginRouter from "./routes/plugin.js";
import skillsRouter from "./routes/skills.js";
import webhookRouter from "./routes/webhooks.js";

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
app.use("/api/auth", authRouter);
app.use("/api/webhooks", webhookRouter);
app.use("/plugin", shopify.validateAuthenticatedSession(), pluginRouter);
app.use("/plugin/skills", shopify.validateAuthenticatedSession(), skillsRouter);
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
  console.log(`ShopOps running on port ${PORT}`);
  console.log(`Install URL: ${process.env.SHOPIFY_APP_URL}/api/auth?shop=<your-store>.myshopify.com`);
});

export default app;
