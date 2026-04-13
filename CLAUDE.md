# ShopOps

AI-powered Shopify operations platform built for Claude Code.  
Connects directly to a Shopify store and the Shopify AI Toolkit — letting an e-commerce operations manager run store tasks in plain English with full safety guardrails.

## What This Project Does

- **`/plugin`** — Core API gateway to a connected Shopify store
- **Shopify AI Toolkit** — 16 skill modules (Admin, Storefront, Orders, Liquid, GraphQL, Polaris, Hydrogen, and more) connected via git submodule at `shopify-ai-toolkit/`
- **Shopify Admin Skills** — 63 operational skills (cart recovery, pricing, inventory, orders, returns, finance, and more) connected via git submodule at `shopify-admin-skills/`
- **MCP Server** — Shopify Dev MCP wired in `.mcp.json` for live doc search and API schema access inside Claude Code

## Guardrails

| Guardrail | How it works |
|---|---|
| Dry-run | `?dry_run=true` on any write → preview only, nothing sent to Shopify |
| Confirmation | DELETE / cancel → returns a token, requires `POST /plugin/confirm/:token` |
| Audit log | Every write logged to SQLite with timestamp + shop + payload |
| Undo / Restore | State snapshotted before every write → `POST /plugin/restore/:snapshotId` |

## Key Endpoints

```
GET  /plugin                    → status + shop summary
GET  /plugin/shop               → store metadata
GET  /plugin/products           → list products
POST /plugin/products           → create product  [dry_run supported]
PUT  /plugin/products/:id       → update product  [dry_run + snapshot]
DELETE /plugin/products/:id     → delete product  [confirmation required]
GET  /plugin/orders             → list orders
POST /plugin/orders/:id/cancel  → cancel order    [confirmation required]
GET  /plugin/marketplace        → toolkit + app store info
GET  /plugin/audit              → full write history
GET  /plugin/snapshots          → list restore points
POST /plugin/restore/:id        → undo — restore to previous version
POST /plugin/confirm/:token     → execute a pending confirmation
```

## Stack

- **Runtime:** Node.js 18+ with ES Modules
- **Framework:** Express + `@shopify/shopify-app-express`
- **Auth:** Shopify OAuth (session stored in `sessions.db`)
- **Guardrails DB:** SQLite (`guardrails.db`) via `better-sqlite3`
- **Plugin Toolkit:** `shopify-ai-toolkit/` (git submodule → sobankousik/Shopify-AI-Toolkit)
- **Admin Skills:** `shopify-admin-skills/` (git submodule → sobankousik/shopify-admin-skills, 63 skills across 10 categories)

## Setup

1. Copy `.env.example` → `.env` and fill in Shopify API credentials
2. `npm install`
3. `npm run dev`
4. Install on a store: `/api/auth/install?shop=<store>.myshopify.com`

## Branch

`claude/shopify-plugin-integration-0i4sR`
