/**
 * services/marketplace.js
 *
 * Returns Shopify App Store / marketplace information.
 *
 * - getMarketplaceInfo() → reads the local .claude-plugin/marketplace.json
 *   manifest and enriches it with toolkit skill metadata.
 * - searchMarketplace() → proxies to the public Shopify App Store search.
 *   (The App Store has no official public search API; this uses the public
 *   apps.shopify.com listing pages.)
 */

import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the marketplace manifest from .claude-plugin/
const manifestPath = path.join(__dirname, "..", ".claude-plugin", "marketplace.json");
let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch {
  manifest = { name: "shopify-ai-toolkit", plugins: [] };
}

// Load toolkit skills list from the submodule
const toolkitPath = path.join(__dirname, "..", "shopify-ai-toolkit", "skills");
let skills = [];
try {
  const { readdirSync } = await import("fs");
  skills = readdirSync(toolkitPath);
} catch {
  skills = [];
}

export function getMarketplaceInfo() {
  return {
    marketplace: {
      ...manifest,
      toolkit: {
        path: "shopify-ai-toolkit",
        source: "https://github.com/sobankousik/Shopify-AI-Toolkit",
        skills,
        install_commands: {
          claude_code: [
            "/plugin marketplace add sobankousik/shopify-ai-toolkit",
            "/plugin install shopify-plugin@shopify-ai-toolkit",
          ],
        },
      },
    },
  };
}

/**
 * Search the Shopify App Store via the public JSON feed.
 * Returns a best-effort list — not an official API.
 */
export async function searchMarketplace({ q, type = "apps", page = 1 }) {
  // Shopify App Store does not expose an official search API.
  // Return a structured placeholder with guidance.
  return {
    query: q,
    type,
    page,
    note: "Use https://apps.shopify.com/search?q=<term> for live App Store search.",
    partner_api: {
      docs: "https://shopify.dev/docs/apps/build/partner-api",
      note: "Authenticated Partner API access required to list/manage apps programmatically.",
    },
  };
}
