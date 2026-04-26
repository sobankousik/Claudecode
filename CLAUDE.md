# ShopOps

AI-powered Shopify operations platform built for Claude Code.  
Connects directly to a Shopify store and lets an e-commerce operations manager run store tasks in plain English with full safety guardrails.

## What This Project Does

- **`/plugin`** — Core API gateway to a connected Shopify store
- **63 Admin Skills** — Store operation workflows at `shopify-admin-skills/` (git submodule, auto-synced)
- **Shopify AI Toolkit** — 16 dev skill modules at `shopify-ai-toolkit/` (Admin, Storefront, Liquid, GraphQL, Polaris, Hydrogen, and more)
- **MCP Server** — Shopify Dev MCP wired in `.mcp.json` for live doc search and API schema access

## How to Run a Skill

1. Browse the catalog: `GET /plugin/skills`
2. Read the full skill: `GET /plugin/skills/:category/:id`
3. Execute GraphQL from the skill: `POST /plugin/skills/graphql` with `{ query, variables, skill_id }`
4. Add `?dry_run=true` to preview mutations without executing them

Example — run abandoned cart recovery:
```
GET  /plugin/skills/marketing/shopify-admin-abandoned-cart-recovery
POST /plugin/skills/graphql   { "query": "<from skill>", "variables": {...}, "dry_run": true }
```

## Skills Catalog (63 skills across 10 categories)

| Category | Skills |
|---|---|
| `marketing` | abandoned-cart-recovery, customer-win-back, loyalty-segment-export |
| `merchandising` | bulk-price-adjustment, inventory-audit, dead-stock, SEO, metafields, + 13 more |
| `customer-support` | order-lookup, refund-and-reorder, return-initiation, WISMO, address-correction |
| `customer-ops` | duplicate-finder, spend-tier-tagger, cohort-analysis, B2B, + 2 more |
| `conversion-optimization` | discount-ab-analysis, abandonment-report, gift-card-issuance, top-products |
| `fulfillment-ops` | fulfillment-digest, order-hold, routing, tracking-bulk, + 4 more |
| `finance` | revenue-by-location, refund-rate, AOV-trends, tax-liability, + 3 more |
| `order-intelligence` | fraud-risk-report, high-risk-tagger, repeat-purchase-rate, order-notes |
| `returns` | return-reason-analysis, exchange-vs-refund-ratio, return-SLA |
| `store-management` | discount-hygiene, draft-order-cleanup, page-audit, URL-redirects, channel-audit |

## Guardrails

| Guardrail | How it works |
|---|---|
| Dry-run | `?dry_run=true` on any write → preview only, no mutations sent to Shopify |
| Confirmation | DELETE / cancel → returns a token, requires `POST /plugin/confirm/:token` |
| Audit log | Every write logged to SQLite with timestamp + shop + payload |
| Undo / Restore | State snapshotted before every write → `POST /plugin/restore/:snapshotId` |

## Key Endpoints

```
GET  /plugin                          → status + shop summary
GET  /plugin/shop                     → store metadata
GET  /plugin/products                 → list products
POST /plugin/products                 → create product  [dry_run supported]
PUT  /plugin/products/:id             → update product  [dry_run + snapshot]
DELETE /plugin/products/:id           → delete product  [confirmation required]
GET  /plugin/orders                   → list orders
POST /plugin/orders/:id/cancel        → cancel order    [confirmation required]
GET  /plugin/marketplace              → toolkit + app store info
GET  /plugin/audit                    → full write history
GET  /plugin/snapshots                → list restore points
POST /plugin/restore/:id              → undo — restore to previous version
POST /plugin/confirm/:token           → execute a pending confirmation

GET  /plugin/skills                   → all 63 skills with metadata
GET  /plugin/skills/categories        → skills grouped by category
GET  /plugin/skills/:category         → skills in one category
GET  /plugin/skills/:category/:id     → full SKILL.md content for a skill
POST /plugin/skills/graphql           → execute a GraphQL query/mutation [dry_run supported]
```

## Stack

- **Runtime:** Node.js 18+ with ES Modules
- **Framework:** Express + `@shopify/shopify-app-express`
- **Auth:** Shopify OAuth (session stored in `sessions.db`)
- **Guardrails DB:** SQLite (`guardrails.db`) via `better-sqlite3`
- **Admin Skills:** `shopify-admin-skills/` (git submodule → sobankousik/shopify-admin-skills, auto-synced via GitHub Actions)
- **Dev Toolkit:** `shopify-ai-toolkit/` (git submodule → sobankousik/Shopify-AI-Toolkit)

## Setup

1. Copy `.env.example` → `.env` and fill in Shopify API credentials
2. `npm install`
3. `git submodule update --init --recursive`
4. `npm run dev`
5. Install on a store: `/api/auth/install?shop=<store>.myshopify.com`

## Branch

`claude/resume-previous-work-hnAKy`
