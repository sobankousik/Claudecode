# ShopOps AI Agent — Standard Operating Procedure
**For: Employers, Clients, and Store Managers**
**Prepared by: Soban | boco.agency**
**Version: 1.0 | April 2026**

---

## What Is This?

ShopOps is an AI-powered operations system built on top of your Shopify store. Instead of clicking through the Shopify admin for every task, you talk to an AI agent in plain English — and it does the work for you.

It is connected directly to your Shopify store and can handle 79 tasks across products, orders, inventory, customers, discounts, and more.

**You do not need to be technical to use it.**

---

## The Two Things You Need

| What | Why |
|---|---|
| **Claude** (claude.ai or Claude Code) | This is the AI you talk to |
| **ShopOps Plugin connected to your store** | This gives Claude the ability to act on your Shopify store |

Your agency (boco.agency) handles the setup and connection. You just need a Claude account.

---

## How It Works — The Simple Version

```
You type a request in Claude
        ↓
Claude reads the right skill from ShopOps
        ↓
ShopOps talks to your Shopify store
        ↓
The task is done — Claude reports back to you
```

Think of ShopOps as Claude's hands inside your store.

---

## Step 1 — Getting Access

Your agency will give you:

- [ ] The ShopOps URL for your store (e.g. `https://your-store-shopops.duckdns.org`)
- [ ] A Claude account or seat (claude.ai)
- [ ] Confirmation that your store is connected

**You do not need to install anything on your computer.**

---

## Step 2 — Your First Conversation

Open Claude and start with:

> *"You are connected to my Shopify store via ShopOps. What can you help me with?"*

Claude will list what it can do for your store.

---

## Step 3 — How to Ask for Things

You do not need to learn commands. Just describe what you want in plain English.

### Examples of What You Can Say

**Products**
> "Show me all products that are out of stock"
> "Update the price of [Product Name] to $49.99"
> "Create a new product called Linen Tote Bag, price $35, in the Bags collection"

**Orders**
> "Show me all unfulfilled orders from today"
> "How many orders came in this week?"
> "Flag order #1042 — customer says item arrived damaged"

**Inventory**
> "Which products have less than 5 units left?"
> "Set stock for [Product Name] to 50 units"
> "Give me a low stock report for all variants"

**Customers**
> "Find customer with email john@example.com"
> "How many new customers signed up this month?"
> "Tag all customers who spent over $500 as VIP"

**Discounts**
> "Create a 20% off discount code called WELCOME20"
> "Turn off all expired discount codes"
> "What discount codes are currently active?"

**Collections**
> "Add [Product Name] to the Summer Sale collection"
> "Show me everything in the New Arrivals collection"

---

## Step 4 — The Safety Rules (Important)

ShopOps has guardrails built in to protect your store. You do not have to manage these — they are automatic.

### Preview Before You Change Anything

For any action that modifies your store, you can add **"preview this first"** and Claude will show you exactly what will change before doing it.

> "Preview deleting all draft products" → Claude shows the list first, you confirm to proceed.

### Deletes and Cancellations Require Confirmation

If you ask to delete or cancel something, Claude will show you a summary and ask you to confirm. It will not execute until you say yes.

### Every Change Is Logged

Every write action (price change, product update, order edit) is recorded in an audit log. If something goes wrong, your agency can see exactly what happened and when.

### Undo Is Available

If Claude makes a change you didn't intend, tell your agency. Every change creates a snapshot that can be reverted.

---

## Step 5 — The 79 Skills at a Glance

ShopOps covers these areas. You do not need to memorise them — just ask Claude in plain English and it will pick the right one.

### Store Operations (63 Skills)
| Category | What It Handles |
|---|---|
| Products | Create, update, delete, bulk edit, price changes |
| Orders | View, fulfil, cancel, flag, bulk updates |
| Inventory | Stock levels, low stock alerts, bulk adjustments |
| Customers | Search, tag, segment, VIP management |
| Collections | Add/remove products, sort, create collections |
| Discounts | Create codes, bulk disable, expiry management |
| Fulfillment | Tracking, shipping updates, fulfilment status |
| Analytics | Sales reports, conversion summaries, top products |
| Abandoned Carts | View, trigger recovery, segment by value |
| Metafields | Custom data on products, variants, orders |

### Developer Skills (16 Skills)
*These are used by your agency's technical team — not for day-to-day store management.*

| Category | What It Handles |
|---|---|
| Liquid | Theme code, section building, logic |
| GraphQL | Advanced Shopify API queries |
| Polaris | Admin UI components |
| Theme Architecture | Section schemas, settings, blocks |

---

## Step 6 — Common Workflows

### Weekly Inventory Check
1. Open Claude
2. Say: *"Run a low stock report for all products with less than 10 units"*
3. Claude returns a list
4. Say: *"Export this as a table I can share with my supplier"*

### Launch a Sale
1. Say: *"Create a 15% off discount code called FLASH15, valid for 48 hours"*
2. Claude confirms details — you say yes
3. Say: *"Show me all products not currently in a collection — I want to add the best sellers to Summer Sale"*

### Order Issue Management
1. Say: *"Show me all orders flagged with shipping issues in the last 7 days"*
2. Say: *"Draft a refund note for order #1089"*

### End of Month Report
1. Say: *"Give me a sales summary for April — total revenue, top 5 products, and new customer count"*

---

## Step 7 — What Not to Do

- **Do not share your ShopOps URL publicly** — it is connected to your live store
- **Do not ask Claude to bulk delete without previewing first** — always say "preview first"
- **Do not use this on a live store for the first time without testing** — ask your agency to test on a dev store first
- **Do not bypass the confirmation step** — if Claude asks you to confirm before deleting, that is intentional

---

## Roles & Responsibilities

| Role | Responsibility |
|---|---|
| **Store Manager / Client** | Day-to-day use — products, orders, customers, discounts |
| **Agency (boco.agency)** | Setup, maintenance, new skill deployment, troubleshooting |
| **Claude** | Interprets your request and executes via ShopOps |
| **ShopOps** | Connects Claude to Shopify — the engine underneath |

---

## Troubleshooting

| Problem | What to Do |
|---|---|
| Claude says it can't connect to the store | Contact your agency — the connection may need refreshing |
| A skill ran but nothing changed on the store | Check the audit log — ask your agency to review |
| Claude doesn't understand what you're asking | Rephrase more specifically, e.g. "Update price of SKU-001 to $29" |
| You want to undo a change | Stop using the store for that item and contact your agency immediately |
| You're not sure if an action is safe | Add "preview first" or "dry run" to your message before confirming |

---

## Quick Reference Card

**Your ShopOps URL:** `https://trunk-petti-shopops.duckdns.org`
**Your Store:** `trunk-petti.myshopify.com`
**Agency Contact:** soban@boco.agency

**Useful phrases to remember:**
- `"Preview this first"` → shows what will change before doing it
- `"Dry run"` → same as preview, no changes made
- `"Audit log"` → see everything that's been changed
- `"Undo the last change"` → signals your agency to restore

---

*This document is prepared by boco.agency. For onboarding support, contact soban@boco.agency.*
