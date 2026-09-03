import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INTERNAL_SKILLS, VALID_AGENTS, isValidAgent, valueOf, valuesOfLower } from "./lib/args.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

const projectRaw = valueOf(args, "--project");
const projectRoot = projectRaw ? path.resolve(projectRaw) : null;
if (projectRaw && (!fs.existsSync(projectRoot) || !fs.statSync(projectRoot).isDirectory())) {
  console.error(`El proyecto no existe o no es un directorio: ${projectRoot}`);
  process.exit(2);
}
const requestedAgents = valuesOfLower(args, "--agent");
const validAgents = new Set(VALID_AGENTS);

for (const agent of requestedAgents) {
  if (!isValidAgent(agent)) {
    console.error(`Agente no soportado: ${agent} (soportados: opencode, codex, antigravity)`);
    process.exit(2);
  }
}

const useCore = fs.existsSync(path.join(sourceRoot, "templates", "core"));
const root = projectRoot ?? (useCore
  ? path.join(sourceRoot, "templates", "core")
  : path.join(sourceRoot, "templates", "project"));

const errors = [];
const warnings = [];

function exists(relativePath, base = root) {
  return fs.existsSync(path.join(base, relativePath));
}

function read(relativePath, base = root) {
  return fs.readFileSync(path.join(base, relativePath), "utf8");
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

function checkNoTuiMentions(relativePath) {
  if (!exists(relativePath)) return;
  const content = read(relativePath);
  const forbidden = [
    [".opencode", "mención a .opencode en el núcleo"],
    ["$ARGUMENTS", "mención a $ARGUMENTS en el núcleo"],
    ["opencode.json", "mención a opencode.json en el núcleo"]
  ];
  for (const [token, message] of forbidden) {
    if (content.includes(token)) errors.push(`${relativePath}: ${message} (${token})`);
  }
  if (/^mode:/m.test(content.split("---")[0] ?? "")) {
    errors.push(`${relativePath}: frontmatter de TUI (mode:) en el núcleo`);
  }
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
      `.opencode/skills/${skill.name}/SKILL.md`,
      `.codex/skills/${skill.name}/SKILL.md`,
      `.gemini/skills/${skill.name}/SKILL.md`
    ];
    if (!candidates.some((candidate) => exists(candidate))) {
      errors.push(`${relativePath}: falta la copia local de ${skill.name}`);
    }
  }
}

if (!projectRoot && useCore) {
  // Validación de fuente: núcleo agnóstico + adapters.
  const coreRequired = [
    "AGENTS.md",
    "permisos.md",
    "planes-formato.md",
    "memoria-formato.md",
    "skills-recomendadas.md",
    ".harness/plans",
    ".harness/memory/decisions.md",
    ".harness/memory/fixes.md",
    "skills-internas/minimal-change/SKILL.md",
    "skills-internas/git-commit/SKILL.md",
    "skills-internas/frontend/SKILL.md",
    "skills-internas/backend/SKILL.md",
    "skills-internas/mobile/SKILL.md"
  ];
  for (const relativePath of coreRequired) {
    if (!exists(relativePath, path.join(sourceRoot, "templates", "core"))) {
      errors.push(`falta templates/core/${relativePath}`);
    }
  }
  const coreBase = path.join(sourceRoot, "templates", "core");
  const coreCheck = (rel) => {
    const full = path.join(coreBase, rel);
    if (!fs.existsSync(full)) return;
    const content = fs.readFileSync(full, "utf8");
    for (const token of [".opencode", "$ARGUMENTS", "opencode.json"]) {
      if (content.includes(token)) errors.push(`templates/core/${rel}: mención TUI prohibida (${token})`);
    }
  };
  coreCheck("AGENTS.md");
  coreCheck("permisos.md");
  coreCheck("planes-formato.md");
  coreCheck("memoria-formato.md");

  const adaptersBase = path.join(sourceRoot, "templates", "adapters");
  const adapterRequired = [
    "opencode/opencode.json",
    "opencode/agents/planner.md",
    "opencode/agents/executor.md",
    "opencode/agents/reviewer.md",
    "opencode/commands/pre-plan.md",
    "opencode/commands/plan.md",
    "opencode/commands/execute-plan.md",
    "opencode/commands/verify.md",
    "opencode/commands/review.md",
    "codex/AGENTS.fragment.md",
    "codex/prompts/pre-plan.md",
    "codex/prompts/plan.md",
    "codex/prompts/execute-plan.md",
    "codex/prompts/verify.md",
    "codex/prompts/review.md",
    "antigravity/GEMINI.fragment.md",
    "antigravity/workflows/sdd-lite.md"
  ];
  for (const relativePath of adapterRequired) {
    if (!fs.existsSync(path.join(adaptersBase, relativePath))) {
      errors.push(`falta templates/adapters/${relativePath}`);
    }
  }
  try {
    const config = JSON.parse(fs.readFileSync(path.join(adaptersBase, "opencode", "opencode.json"), "utf8"));
    if (config.default_agent !== "executor") errors.push("templates/adapters/opencode/opencode.json: default_agent debe ser executor");
    if (containsKey(config, "model")) errors.push("templates/adapters/opencode/opencode.json: no debe fijar modelos");
    if (config.permission?.external_directory !== "ask") errors.push("templates/adapters/opencode/opencode.json: external_directory debe ser ask");
  } catch (error) {
    errors.push(`templates/adapters/opencode/opencode.json: JSON inválido (${error.message})`);
  }
} else if (!projectRoot) {
  // Fuente legacy V5.
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
  for (const relativePath of required) {
    if (!exists(relativePath)) errors.push(`falta ${relativePath}`);
  }
}

if (projectRoot) {
  // Proyecto V6: núcleo + adapters solicitados (por defecto, los presentes).
  const presentAgents = ["opencode", "codex", "antigravity"].filter((agent) => {
    if (agent === "opencode") return exists(".opencode/opencode.json");
    if (agent === "codex") return exists(".codex/prompts/plan.md") || exists(".codex/AGENTS.fragment.md");
    return exists("GEMINI.md") || exists(".gemini/workflows/sdd-lite.md");
  });
  const agents = requestedAgents.length ? requestedAgents : presentAgents.length ? presentAgents : ["opencode"];

  if (!exists("AGENTS.md")) errors.push("falta AGENTS.md (núcleo)");
  else checkNoTuiMentions("AGENTS.md");
  if (!exists(".harness/plans")) errors.push("falta .harness/plans (los planes viven en el núcleo, no en .opencode/plans)");
  if (exists(".opencode/plans") && !exists(".harness/plans")) {
    errors.push(".opencode/plans es legacy V5: migrar a .harness/plans/");
  }
  if (!exists(".harness/memory/decisions.md")) warnings.push("falta .harness/memory/decisions.md (memoria file-based)");
  if (!exists(".harness/memory/fixes.md")) warnings.push("falta .harness/memory/fixes.md (memoria file-based)");
  const internalSkills = [...INTERNAL_SKILLS];
  for (const skill of internalSkills) {
    const candidates = [
      `.agents/skills/${skill}/SKILL.md`,
      `.opencode/skills/${skill}/SKILL.md`,
      `.codex/skills/${skill}/SKILL.md`,
      `.gemini/skills/${skill}/SKILL.md`
    ];
    if (!candidates.some((c) => exists(c))) errors.push(`falta skill interna ${skill} en .agents/skills/ o espejo del adapter`);
  }

  if (agents.includes("opencode")) {
    if (!exists(".opencode/opencode.json")) errors.push("falta .opencode/opencode.json (--agent opencode)");
    else {
      try {
        const config = JSON.parse(read(".opencode/opencode.json"));
        if (config.default_agent !== "executor") errors.push(".opencode/opencode.json: default_agent debe ser executor");
        if (containsKey(config, "model")) errors.push(".opencode/opencode.json: no debe fijar modelos");
        if (config.permission?.external_directory !== "ask") errors.push(".opencode/opencode.json: external_directory debe ser ask");
      } catch (error) {
        errors.push(`.opencode/opencode.json: JSON inválido (${error.message})`);
      }
    }
    for (const agent of ["planner", "executor", "reviewer"]) {
      checkFrontmatter(`.opencode/agents/${agent}.md`, ["description", "mode", "permission"]);
    }
    for (const command of ["pre-plan", "plan", "execute-plan", "verify", "review"]) {
      if (!exists(`.opencode/commands/${command}.md`)) errors.push(`falta .opencode/commands/${command}.md`);
    }
    if (exists(".opencode/agents/planner.md") && read(".opencode/agents/planner.md").includes(".opencode/plans/")) {
      errors.push(".opencode/agents/planner.md: debe apuntar a .harness/plans/, no a .opencode/plans/");
    }
  }
  if (agents.includes("codex")) {
    for (const prompt of ["pre-plan", "plan", "execute-plan", "verify", "review"]) {
      if (!exists(`.codex/prompts/${prompt}.md`)) errors.push(`falta .codex/prompts/${prompt}.md (--agent codex)`);
    }
    if (exists(".codex/prompts/plan.md") && read(".codex/prompts/plan.md").includes(".opencode/plans/")) {
      errors.push(".codex/prompts/plan.md: debe apuntar a .harness/plans/");
    }
  }
  if (agents.includes("antigravity")) {
    if (!exists("GEMINI.md") && !exists(".gemini/workflows/sdd-lite.md")) {
      errors.push("falta GEMINI.md o .gemini/workflows/sdd-lite.md (--agent antigravity)");
    }
  }
  checkSkillsLock();
  if (!exists(".opencode/opencode.json") && !exists(".codex/prompts/plan.md") && !exists("GEMINI.md")) {
    warnings.push("El proyecto no parece tener todavía el harness instalado");
  }
}

if (errors.length) {
  console.error("DOCTOR: FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`DOCTOR: OK (${projectRoot ? "proyecto" : "fuente"}: ${root})`);
}
for (const warning of warnings) console.warn(`WARN: ${warning}`);
