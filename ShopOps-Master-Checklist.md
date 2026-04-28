# ShopOps — Master Setup Checklist
**Compiled: April 28, 2026 | Store: trunk-petti.myshopify.com**

---

## ✅ What We Built in the Last 12 Hours

### Infrastructure (AWS EC2)
- [x] Launched AWS EC2 t3.micro (Ubuntu 24.04) — IP: 54.161.0.222
- [x] Installed Node.js 22, Git, PM2, nginx, build-essential
- [x] Cloned ShopOps repo: `github.com/sobankousik/Claudecode` → branch `claude/shopify-plugin-integration-0i4sR`
- [x] Pulled git submodules: `shopify-admin-skills` (63 skills) + `shopify-ai-toolkit` (16 dev skills)
- [x] Installed npm dependencies (`npm install`)
- [x] Configured `.env` with Shopify credentials and app URL
- [x] ShopOps running 24/7 via PM2 on port 3000

### DNS + SSL (Permanent HTTPS)
- [x] Registered free domain: `trunk-petti-shopops.duckdns.org` via DuckDNS
- [x] DuckDNS token pointing to EC2 IP: 54.161.0.222
- [x] Free SSL certificate via Let's Encrypt / Certbot
- [x] nginx configured as reverse proxy → routes HTTPS → port 3000
- [x] Permanent public URL: `https://trunk-petti-shopops.duckdns.org`

### Shopify App (OAuth)
- [x] ShopOps app registered in Shopify Partners Dashboard (Client ID: `cda8065c...`)
- [x] OAuth completed for `trunk-petti.myshopify.com`
- [x] Offline session stored in SQLite (`sessions.db`)
- [x] Custom `requireOfflineSession` middleware built for API-first access
- [x] App URL and redirect URL set in Partners Dashboard

### Skills API (All 79 Skills Live)
- [x] `GET /plugin` → store connection status ✅
- [x] `GET /plugin/skills` → all 63 store operation skills ✅
- [x] `GET /plugin/skills/:category/:id` → individual skill details ✅
- [x] `GET /plugin/dev-skills` → all 16 developer skills ✅
- [x] `GET /plugin/dev-skills/:category/:id` → individual dev skill ✅

### Theme Development (Local Mac)
- [x] Shopify CLI 3.94.1 installed via Homebrew
- [x] Logged into `trunk-petti.myshopify.com` via Shopify CLI
- [x] Horizon theme pulled locally to `~/Desktop/trunk-petti-theme`
- [x] Local dev server running: `http://127.0.0.1:9292`
- [x] Development theme visible in Shopify admin (scroll to bottom of Themes page)

---

## 🔁 Pre-Requisite Checklist — Reuse on Any New Store

Use this to spin up the exact same setup on a different Shopify store or environment from scratch.

### Part 1 — Shopify Store & Partners Setup
- [ ] Create/access Shopify Partners account → partners.shopify.com
- [ ] Create a dev store OR get access to a client store
- [ ] Create a new Custom App in Partners Dashboard → Apps → Create app manually
- [ ] Set App name (e.g. `ShopOps`)
- [ ] Set placeholder App URL (update after deploy)
- [ ] Copy **API Key** and **API Secret Key**

### Part 2 — AWS EC2 Server
- [ ] Launch EC2 t3.micro (Ubuntu 24.04) — free tier eligible
- [ ] Download `.pem` key file during launch
- [ ] Note the Public IPv4 address
- [ ] Open inbound ports: 22 (SSH), 80 (HTTP), 443 (HTTPS) in Security Groups
- [ ] SSH in: `ssh -i your-key.pem ubuntu@YOUR-EC2-IP`

### Part 3 — Server Setup (run on EC2)
- [ ] `sudo apt update && sudo apt upgrade -y`
- [ ] Install Node.js 22 via NodeSource
- [ ] `sudo apt install -y git build-essential`
- [ ] `sudo npm install -g pm2`
- [ ] Install nginx: `sudo apt install -y nginx`
- [ ] Clone the ShopOps repo: `git clone https://github.com/sobankousik/Claudecode.git shopops`
- [ ] Checkout the plugin branch: `git checkout claude/shopify-plugin-integration-0i4sR`
- [ ] Pull submodules: `git submodule update --init --recursive`
- [ ] `cd shopops && npm install`

### Part 4 — DNS + SSL
- [ ] Register a free subdomain at duckdns.org (or use your own domain)
- [ ] Point the DuckDNS subdomain to your EC2 Public IP
- [ ] Install certbot: `sudo apt install -y certbot python3-certbot-nginx`
- [ ] Get SSL cert: `sudo certbot --standalone -d YOUR-DOMAIN.duckdns.org`
- [ ] Configure nginx to proxy HTTPS → port 3000
- [ ] Remove default nginx site: `sudo rm /etc/nginx/sites-enabled/default`
- [ ] Enable your config and reload nginx

### Part 5 — App Configuration (.env)
- [ ] Create `.env` in `/home/ubuntu/shopops/` with:
  - [ ] `SHOPIFY_API_KEY` = from Partners Dashboard
  - [ ] `SHOPIFY_API_SECRET` = from Partners Dashboard
  - [ ] `SHOPIFY_WEBHOOK_SECRET` = same as API secret
  - [ ] `SHOPIFY_APP_URL` = https://YOUR-DOMAIN.duckdns.org
  - [ ] `SHOPIFY_SCOPES` = read/write products, orders, customers, inventory, fulfillments
  - [ ] `PORT=3000`
  - [ ] `NODE_ENV=production`
  - [ ] `SESSION_DB_PATH=sessions.db`

### Part 6 — Update Partners Dashboard
- [ ] Go back to Partners Dashboard → App Setup → URLs
- [ ] Set **App URL**: `https://YOUR-DOMAIN.duckdns.org`
- [ ] Set **Redirect URL**: `https://YOUR-DOMAIN.duckdns.org/api/auth/callback`

### Part 7 — Start the App & Complete OAuth
- [ ] Start app: `pm2 start server.js --name shopops && pm2 save`
- [ ] Set PM2 to auto-start on reboot: `pm2 startup | tail -1 | sudo bash`
- [ ] Complete OAuth (installs app on store):
  ```
  Visit: https://YOUR-DOMAIN.duckdns.org/api/auth?shop=YOUR-STORE.myshopify.com
  ```
- [ ] Approve the app install in Shopify
- [ ] Verify: `GET https://YOUR-DOMAIN.duckdns.org/plugin` → should return store name + status

### Part 8 — Verify All 79 Skills
- [ ] `GET /plugin/skills` → 63 store skills listed
- [ ] `GET /plugin/dev-skills` → 16 developer skills listed
- [ ] Test one skill with `?dry_run=true` (no changes to store)
- [ ] Check audit log: `GET /plugin/audit`

### Part 9 — Theme Development (Mac)
- [ ] Install Homebrew (if not already): `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- [ ] Install Shopify CLI: `brew tap shopify/shopify && brew install shopify-cli`
- [ ] Login: `shopify auth login --store YOUR-STORE.myshopify.com`
- [ ] Create theme folder: `mkdir ~/Desktop/store-theme && cd ~/Desktop/store-theme`
- [ ] Pull the live theme: `shopify theme pull --store YOUR-STORE.myshopify.com` → select active theme
- [ ] Open in VS Code: `code .`
- [ ] Start dev server: `shopify theme dev --store YOUR-STORE.myshopify.com`
- [ ] Confirm development theme appears in Shopify admin → Themes → scroll to bottom

---

## 🧭 If You Start as an Ecommerce Manager on a New Brand

These are the things to lock in on Day 1 before touching anything else.

### Store Access & Credentials
- [ ] Get added as **Staff** with full permissions (or Owner access)
- [ ] Get Shopify Partners access if the store is via an agency
- [ ] Save all API keys, secrets, and app credentials in a password manager (1Password, Bitwarden)
- [ ] Confirm you have access to: DNS provider, hosting/email, payment gateway dashboard

### Store Audit (Before You Change Anything)
- [ ] List all installed apps (remove unused ones — each one slows the store)
- [ ] Note the current live theme name and version
- [ ] Check Google Analytics / GA4 is connected and firing correctly
- [ ] Check Meta Pixel is firing on all key events (ViewContent, AddToCart, Purchase)
- [ ] Review current Shopify plan (features vary by plan)
- [ ] Export current product catalog as a backup CSV

### Technical Health Check
- [ ] Run store speed test: `pagespeed.web.dev`
- [ ] Check mobile vs desktop scores
- [ ] Verify checkout flow end to end (place a test order)
- [ ] Check all payment methods are working (Stripe, PayPal, BNPL)
- [ ] Confirm shipping rates and zones are correct
- [ ] Confirm tax settings match the store's regions

### ShopOps AI Setup (your toolkit)
- [ ] Spin up EC2 + ShopOps using checklist above (Parts 1–8)
- [ ] Install ShopOps on the new store via OAuth
- [ ] Connect to Claude via the plugin URL
- [ ] Confirm all 63 skills are accessible
- [ ] Run your first skill with `?dry_run=true` to preview before executing

### Theme & Design
- [ ] Pull the live theme locally via Shopify CLI
- [ ] Set up local dev environment
- [ ] Get the Figma design files from the designer/brand
- [ ] Map Figma sections to Liquid sections that need to be built

---

## 🔗 Quick Reference — Your Current Setup

| Item | Value |
|---|---|
| Store | trunk-petti.myshopify.com |
| EC2 IP | 54.161.0.222 |
| ShopOps URL | https://trunk-petti-shopops.duckdns.org |
| Skills endpoint | /plugin/skills |
| Dev skills endpoint | /plugin/dev-skills |
| Health check | /plugin |
| Theme folder (Mac) | ~/Desktop/trunk-petti-theme |
| Local dev URL | http://127.0.0.1:9292 |
| GitHub repo | github.com/sobankousik/Claudecode |
| Branch | claude/shopify-plugin-integration-0i4sR |

---

## ⏳ Still To Do (This Store)

- [ ] Figma design received → build Liquid sections in Horizon theme
- [ ] Connect ShopOps to Claude and test individual skills live
- [ ] Push theme changes once Figma sections are built
- [ ] Set up abandoned cart / inventory skills to run automatically
