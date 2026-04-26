# ShopOps

AI-powered Shopify operations platform built for Claude Code.  
Connect Claude directly to a Shopify store and run store tasks in plain English — with full safety guardrails.

---

## What It Does

- **63 store operation skills** — pricing, inventory, orders, refunds, fraud, marketing, fulfillment
- **Safety guardrails** — dry-run preview, audit log, undo/restore, confirmation on destructive actions
- **Shopify AI Toolkit** — 16 dev skills for writing and validating Shopify code
- **Auto-sync** — skills update automatically when the skills repo updates

## Quick Start

See [ONBOARDING.md](./ONBOARDING.md) for full setup instructions.

**Short version:**
1. Create a Shopify app at partners.shopify.com → get API key + secret
2. Deploy this repo to Railway (free tier)
3. Set environment variables
4. Visit `yourserver.com/api/auth/install?shop=yourstore.myshopify.com`
5. Done — all 63 skills are live on your store

## Skills (63 across 10 categories)

| Category | Skills |
|---|---|
| Marketing | Abandoned cart recovery, win-back, loyalty exports |
| Merchandising | Bulk pricing, inventory audits, SEO, dead stock, metafields |
| Customer Support | Order lookup, refunds, returns, address correction, WISMO |
| Customer Ops | Duplicate finder, spend tiers, cohort analysis, B2B |
| Conversion | Discount A/B, abandonment reports, gift cards |
| Fulfillment Ops | Bulk fulfillment, order holds, routing, tracking updates |
| Finance | Revenue reports, refund rates, AOV, tax liability |
| Order Intelligence | Fraud risk, high-risk tagging, repeat purchase rate |
| Returns | Return reasons, exchange vs refund ratios, SLA |
| Store Management | Discount cleanup, draft orders, page audit, URL redirects |

## Key Endpoints

```
GET  /plugin/skills                   → browse all 63 skills
GET  /plugin/skills/:category/:id     → full skill instructions
POST /plugin/skills/graphql           → execute a skill [dry_run supported]
GET  /plugin/audit                    → full write history
POST /plugin/restore/:id              → undo any change
```

## Stack

- **Runtime:** Node.js 18+ with ES Modules
- **Framework:** Express + `@shopify/shopify-app-express`
- **Auth:** Shopify OAuth
- **DB:** SQLite via `better-sqlite3`
- **Skills:** `shopify-admin-skills/` submodule (auto-synced)
