import { readFileSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_ROOT = join(__dirname, "..", "shopify-admin-skills", "skills");

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const meta = {};
  for (const line of match[1].split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, "");
    if (!key) continue;
    meta[key] = val;
  }
  return meta;
}

function loadSkills() {
  const skills = [];
  let categories;
  try {
    categories = readdirSync(SKILLS_ROOT).filter((d) =>
      statSync(join(SKILLS_ROOT, d)).isDirectory()
    );
  } catch {
    return skills;
  }

  for (const category of categories) {
    const catPath = join(SKILLS_ROOT, category);
    const skillDirs = readdirSync(catPath).filter((d) =>
      statSync(join(catPath, d)).isDirectory()
    );
    for (const skillDir of skillDirs) {
      const skillPath = join(catPath, skillDir, "SKILL.md");
      let raw;
      try {
        raw = readFileSync(skillPath, "utf8");
      } catch {
        continue;
      }
      const meta = parseFrontmatter(raw);
      skills.push({
        id: skillDir,
        category,
        name: meta.name ?? skillDir,
        description: meta.description ?? "",
        toolkit: meta.toolkit ?? "",
        api_version: meta.api_version ?? "",
        status: meta.status ?? "unknown",
        compatibility: meta.compatibility ?? "",
        graphql_operations: meta.graphql_operations ?? "",
        path: skillPath,
      });
    }
  }
  return skills;
}

let _cache = null;

export function getAllSkills() {
  if (!_cache) _cache = loadSkills();
  return _cache;
}

export function getSkillsByCategory(category) {
  return getAllSkills().filter((s) => s.category === category);
}

export function getSkill(category, id) {
  return getAllSkills().find((s) => s.category === category && s.id === id) ?? null;
}

export function getSkillContent(category, id) {
  const skill = getSkill(category, id);
  if (!skill) return null;
  return readFileSync(skill.path, "utf8");
}

export function getCategories() {
  return [...new Set(getAllSkills().map((s) => s.category))].sort();
}
