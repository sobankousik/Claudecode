import { Router } from "express";
import { dryRun } from "../middleware/dryRun.js";
import { getAllSkills, getSkillsByCategory, getSkill, getSkillContent, getCategories } from "../services/skills.js";
import { runGraphQL } from "../services/graphql.js";

const router = Router();

// GET /plugin/skills
// Full catalog — all 63 skills with metadata
router.get("/", (_req, res) => {
  const skills = getAllSkills();
  const categories = getCategories();
  res.json({
    total: skills.length,
    categories: categories.map((cat) => ({
      name: cat,
      count: skills.filter((s) => s.category === cat).length,
    })),
    skills: skills.map(({ path: _path, ...s }) => s),
  });
});

// GET /plugin/skills/categories
router.get("/categories", (_req, res) => {
  const skills = getAllSkills();
  const categories = getCategories();
  res.json(
    categories.map((cat) => ({
      name: cat,
      skills: getSkillsByCategory(cat).map(({ path: _path, ...s }) => s),
    }))
  );
});

// GET /plugin/skills/:category
router.get("/:category", (req, res) => {
  const { category } = req.params;
  const skills = getSkillsByCategory(category);
  if (!skills.length) {
    return res.status(404).json({ error: `No skills found for category: ${category}` });
  }
  res.json({ category, count: skills.length, skills: skills.map(({ path: _path, ...s }) => s) });
});

// GET /plugin/skills/:category/:id
// Returns full SKILL.md content for Claude to read and execute
router.get("/:category/:id", (req, res) => {
  const { category, id } = req.params;
  const skill = getSkill(category, id);
  if (!skill) {
    return res.status(404).json({ error: `Skill not found: ${category}/${id}` });
  }
  const content = getSkillContent(category, id);
  const { path: _path, ...meta } = skill;
  res.json({ ...meta, content });
});

// POST /plugin/graphql
// Execute a GraphQL query or mutation from a skill
// Body: { query, variables, skill_id }
// Supports ?dry_run=true — mutations are skipped, queries always run
router.post("/graphql", dryRun("graphql"), async (req, res) => {
  const session = res.locals.shopify.session;
  const { query, variables, skill_id } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Missing required field: query" });
  }

  const dry_run = req.query.dry_run === "true" || req.body.dry_run === true;
  const result = await runGraphQL(session, { query, variables, dry_run, skill_id });
  res.json(result);
});

export default router;
