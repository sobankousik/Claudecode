# ShopOps Onboarding Guide

Get ShopOps running on your Shopify store in under 30 minutes.

---

## What You Need Before Starting

- A Shopify store
- A Shopify Partners account (free at partners.shopify.com)
- A server to host ShopOps (Railway recommended — free tier works)
- This repo cloned to your machine or deployed

---

## Step 1 — Create a Shopify App

1. Go to **partners.shopify.com** → Log in
2. Click **Apps → Create app → Create app manually**
3. Give it a name: `ShopOps`
4. Under **App setup → URLs**, set:
   - App URL: `https://yourserver.up.railway.app`
   - Allowed redirect URLs: `https://yourserver.up.railway.app/api/auth/callback`
5. Copy your **API key** and **API secret key** — you'll need these in Step 3

---

## Step 2 — Deploy to Railway

1. Go to **railway.app** → Sign up with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select the `Claudecode` repo
4. Wait for the first deploy (it will fail — that's fine, you haven't added credentials yet)
5. Copy the Railway URL shown (e.g. `yourapp.up.railway.app`)

---

## Step 3 — Set Environment Variables

In Railway → your project → **Variables**, add these:

```
SHOPIFY_API_KEY=          ← from Step 1
SHOPIFY_API_SECRET=       ← from Step 1
SHOPIFY_APP_URL=          ← your Railway URL (https://yourapp.up.railway.app)
SCOPES=read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_checkouts,write_checkouts,read_price_rules,write_price_rules,read_inventory,write_inventory,read_fulfillments,write_fulfillments
NODE_ENV=production
```

Railway will redeploy automatically after you save.

---

## Step 4 — Install on Your Store

1. In your browser, go to:
   ```
   https://yourapp.up.railway.app/api/auth/install?shop=yourstore.myshopify.com
   ```
2. You'll be redirected to Shopify to approve the app
3. Click **Install**
4. You're connected

---

## Step 5 — Verify It's Working

Open your browser and visit:
```
https://yourapp.up.railway.app/plugin
```

You should see your store name, status, and a summary. If you do — everything is live.

---

## What You Can Do Now

**Browse the 63 skills:**
```
GET /plugin/skills
```

**Run a specific skill (example — abandoned cart recovery):**
```
GET  /plugin/skills/marketing/shopify-admin-abandoned-cart-recovery
POST /plugin/skills/graphql   { "query": "...", "dry_run": true }
```

**Always use `dry_run: true` first** — it previews the operation without touching your store.

**When you're happy with the preview**, remove `dry_run` and run it for real.

---

## Skills Available (63 total)

| Category | What it covers |
|---|---|
| Marketing | Abandoned cart recovery, win-back campaigns, loyalty exports |
| Merchandising | Bulk pricing, inventory audits, SEO, dead stock, metafields |
| Customer Support | Order lookup, refunds, returns, address correction, WISMO |
| Customer Ops | Duplicate customers, spend tiers, cohort analysis, B2B |
| Conversion | Discount A/B, abandonment reports, gift cards |
| Fulfillment Ops | Bulk fulfillment, order holds, routing, tracking updates |
| Finance | Revenue reports, refund rates, AOV, tax liability, shipping costs |
| Order Intelligence | Fraud risk, high-risk tagging, repeat purchase rate |
| Returns | Return reasons, exchange vs refund ratios, SLA tracking |
| Store Management | Discount cleanup, draft orders, page audit, URL redirects |

---

## Safety Guardrails

Every write operation has protection built in:

| Guardrail | How it works |
|---|---|
| Dry-run | Add `?dry_run=true` — previews everything, nothing sent to Shopify |
| Confirmation | Delete/cancel operations return a token — must confirm before executing |
| Audit log | Every write is logged: `GET /plugin/audit` |
| Undo | State is saved before every write: `POST /plugin/restore/:id` |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `/plugin` returns 401 | The app isn't installed on the store — redo Step 4 |
| Railway deploy fails | Check the Variables tab — missing or wrong credentials |
| Skills return empty | Run `git submodule update --init --recursive` and redeploy |
| Mutations not working | Check API scopes in Step 3 match what the skill requires |

---

## Need Help?

- Skill instructions: `GET /plugin/skills/:category/:id`
- Full write history: `GET /plugin/audit`
- Restore a previous state: `POST /plugin/restore/:snapshotId`
- List restore points: `GET /plugin/snapshots`
