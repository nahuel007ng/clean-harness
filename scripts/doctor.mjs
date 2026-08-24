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
  ".opencode/plans",
  ".opencode/commands/pre-plan.md",
  ".opencode/commands/plan.md",
  ".opencode/commands/execute-plan.md",
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

function checkFrontmatterPermission(relativePath, key, expected) {
  if (!exists(relativePath)) return;
  const content = read(relativePath);
  const headerEnd = content.indexOf("\n---", 3);
  if (headerEnd < 0) return;
  const header = content.slice(0, headerEnd);
  const pattern = new RegExp(`^  ${key}:\\s*([^\\s#]+)\\s*$`, "m");
  const match = header.match(pattern);
  if (!match) {
    errors.push(`${relativePath}: falta permiso ${key}`);
  } else if (match[1] !== expected) {
    errors.push(`${relativePath}: permiso ${key} debe ser ${expected}`);
  }
}

function checkFrontmatterPermissionRule(relativePath, key, pattern, expected) {
  if (!exists(relativePath)) return;
  const content = read(relativePath);
  const headerEnd = content.indexOf("\n---", 3);
  if (headerEnd < 0) return;
  const header = content.slice(0, headerEnd);
  const keyPattern = new RegExp(`^  ${key}:\\s*$`, "m");
  const expectedRule = `    "${pattern}": ${expected}`;
  const hasRule = header.split(/\r?\n/).some((line) => line === expectedRule);
  if (!keyPattern.test(header) || !hasRule) {
    errors.push(`${relativePath}: permiso ${key} para ${pattern} debe ser ${expected}`);
  }
}

function containsKey(value, key) {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  return Object.values(value).some((child) => containsKey(child, key));
}

function checkSkillsLock() {
  const relativePath = ".harness/skills-lock.json";
  if (!exists(relativePath)) return;
  let lock;
  try {
    lock = JSON.parse(read(relativePath));
  } catch (error) {
    errors.push(`${relativePath}: JSON inválido (${error.message})`);
    return;
  }
  if (lock.version !== 1) errors.push(`${relativePath}: version debe ser 1`);
  if (!Array.isArray(lock.skills)) {
    errors.push(`${relativePath}: skills debe ser un array`);
    return;
  }
  for (const skill of lock.skills) {
    if (!skill?.name || !skill?.source) {
      errors.push(`${relativePath}: cada skill requiere name y source`);
      continue;
    }
    const candidates = [
      `.agents/skills/${skill.name}/SKILL.md`,
      `.opencode/skills/${skill.name}/SKILL.md`
    ];
    if (!candidates.some((candidate) => exists(candidate))) {
      errors.push(`${relativePath}: falta la copia local de ${skill.name}`);
    }
  }
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
    if (config.permission?.read !== "allow") {
      errors.push(".opencode/opencode.json: read debe ser allow");
    }
    if (config.permission?.external_directory !== "ask") {
      errors.push(".opencode/opencode.json: external_directory debe ser ask");
    }
  } catch (error) {
    errors.push(`.opencode/opencode.json: JSON inválido (${error.message})`);
  }
}

for (const agent of ["planner", "executor", "reviewer"]) {
  checkFrontmatter(`.opencode/agents/${agent}.md`, ["description", "mode", "permission"]);
}
checkFrontmatterPermission(".opencode/agents/planner.md", "external_directory", "allow");
checkFrontmatterPermission(".opencode/agents/executor.md", "external_directory", "ask");
checkFrontmatterPermissionRule(".opencode/agents/planner.md", "edit", "*", "deny");
checkFrontmatterPermissionRule(".opencode/agents/planner.md", "edit", ".opencode/plans/*.md", "allow");
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
if (projectRoot) checkSkillsLock();

if (errors.length) {
  console.error("DOCTOR: FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`DOCTOR: OK (${projectRoot ? "proyecto" : "fuente"}: ${root})`);
}
for (const warning of warnings) console.warn(`WARN: ${warning}`);
