import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const projectIndex = args.indexOf("--project");
const projectRoot = projectIndex >= 0 && args[projectIndex + 1]
  ? path.resolve(args[projectIndex + 1])
  : null;
const root = projectRoot ?? path.join(sourceRoot, "templates", "project");

const required = [
  "AGENTS.md",
  ".opencode/opencode.json",
  ".opencode/agents/planner.md",
  ".opencode/agents/executor.md",
  ".opencode/agents/reviewer.md",
  ".opencode/commands/pre-plan.md",
  ".opencode/commands/plan.md",
  ".opencode/commands/verify.md",
  ".opencode/commands/review.md",
  ".opencode/skills/minimal-change/SKILL.md",
  ".opencode/skills/git-commit/SKILL.md",
  ".opencode/skills/frontend/SKILL.md",
  ".opencode/skills/backend/SKILL.md",
  ".opencode/skills/mobile/SKILL.md"
];

const errors = [];
const warnings = [];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function checkFrontmatter(relativePath, keys) {
  if (!exists(relativePath)) return;
  const content = read(relativePath);
  if (!content.startsWith("---")) {
    errors.push(`${relativePath}: falta frontmatter YAML`);
    return;
  }
  const header = content.slice(0, content.indexOf("\n---", 3));
  for (const key of keys) {
    if (!new RegExp(`^${key}:`, "m").test(header)) {
      errors.push(`${relativePath}: falta ${key} en frontmatter`);
    }
  }
}

function containsKey(value, key) {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  return Object.values(value).some((child) => containsKey(child, key));
}

for (const relativePath of required) {
  if (!exists(relativePath)) errors.push(`falta ${relativePath}`);
}

if (exists(".opencode/opencode.json")) {
  try {
    const config = JSON.parse(read(".opencode/opencode.json"));
    if (config.default_agent !== "executor") {
      errors.push(".opencode/opencode.json: default_agent debe ser executor");
    }
    if (containsKey(config, "model")) {
      errors.push(".opencode/opencode.json: no debe fijar modelos");
    }
  } catch (error) {
    errors.push(`.opencode/opencode.json: JSON inválido (${error.message})`);
  }
}

for (const agent of ["planner", "executor", "reviewer"]) {
  checkFrontmatter(`.opencode/agents/${agent}.md`, ["description", "mode", "permission"]);
}
for (const command of ["pre-plan", "plan", "verify", "review"]) {
  checkFrontmatter(`.opencode/commands/${command}.md`, ["description"]);
}
for (const skill of ["minimal-change", "git-commit", "frontend", "backend", "mobile"]) {
  const relativePath = `.opencode/skills/${skill}/SKILL.md`;
  checkFrontmatter(relativePath, ["name", "description"]);
  if (exists(relativePath)) {
    const header = read(relativePath).slice(0, read(relativePath).indexOf("\n---", 3));
    if (!new RegExp(`^name: ${skill}$`, "m").test(header)) {
      errors.push(`${relativePath}: name no coincide con el directorio`);
    }
  }
}

if (projectRoot && !exists(".opencode/opencode.json")) {
  warnings.push("El proyecto no parece tener todavía el harness instalado");
}

if (errors.length) {
  console.error("DOCTOR: FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`DOCTOR: OK (${projectRoot ? "proyecto" : "fuente"}: ${root})`);
}
for (const warning of warnings) console.warn(`WARN: ${warning}`);
