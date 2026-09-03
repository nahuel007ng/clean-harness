import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectProject } from "./stack-detect.mjs";
import { detectLegacy } from "./detect-legacy.mjs";
import { INTERNAL_SKILLS, VALID_AGENTS, isValidAgent, valueOf, valuesOfLower } from "./lib/args.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const coreRoot = path.join(sourceRoot, "templates", "core");
const adaptersRoot = path.join(sourceRoot, "templates", "adapters");
const legacyRoot = path.join(sourceRoot, "templates", "project");
const args = process.argv.slice(2);

const targetRaw = valueOf(args, "--target");
const target = targetRaw ? path.resolve(targetRaw) : null;
const apply = args.includes("--apply");
const requestedAgents = valuesOfLower(args, "--agent");
const agents = [...new Set(requestedAgents.length ? requestedAgents : [...VALID_AGENTS])];
const validAgents = new Set(VALID_AGENTS);

if (!target) {
  console.error("Uso: node scripts/install.mjs --target <proyecto> [--agent opencode,codex,antigravity] [--apply]");
  process.exit(2);
}
if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
  console.error(`El destino no existe o no es un directorio: ${target}`);
  process.exit(2);
}
for (const agent of agents) {
  if (!isValidAgent(agent)) {
    console.error(`Agente no soportado: ${agent} (soportados: opencode, codex, antigravity)`);
    process.exit(2);
  }
}

const useCore = fs.existsSync(coreRoot);
const baseRoot = useCore ? null : legacyRoot;
if (!useCore && !fs.existsSync(legacyRoot)) {
  console.error("No existe templates/core ni templates/project");
  process.exit(2);
}

const internalSkills = [...INTERNAL_SKILLS];

// Mapa destino -> origen absoluto (solo proyecto, nunca global).
function buildFileMap() {
  const entries = [];
  if (useCore) {
    entries.push(["AGENTS.md", path.join(coreRoot, "AGENTS.md")]);
    entries.push([".harness/plans/.gitkeep", path.join(coreRoot, ".harness", "plans", ".gitkeep")]);
    entries.push([".harness/memory/decisions.md", path.join(coreRoot, ".harness", "memory", "decisions.md")]);
    entries.push([".harness/memory/fixes.md", path.join(coreRoot, ".harness", "memory", "fixes.md")]);
    for (const skill of internalSkills) {
      const src = path.join(coreRoot, "skills-internas", skill, "SKILL.md");
      entries.push([`.agents/skills/${skill}/SKILL.md`, src]);
    }
    if (agents.includes("opencode")) {
      const root = path.join(adaptersRoot, "opencode");
      entries.push([".opencode/opencode.json", path.join(root, "opencode.json")]);
      for (const agent of ["planner", "executor", "reviewer"]) {
        entries.push([`.opencode/agents/${agent}.md`, path.join(root, "agents", `${agent}.md`)]);
      }
      for (const command of ["pre-plan", "plan", "execute-plan", "verify", "review"]) {
        entries.push([`.opencode/commands/${command}.md`, path.join(root, "commands", `${command}.md`)]);
      }
      for (const skill of internalSkills) {
        entries.push([`.opencode/skills/${skill}/SKILL.md`, path.join(coreRoot, "skills-internas", skill, "SKILL.md")]);
      }
    }
    if (agents.includes("codex")) {
      const root = path.join(adaptersRoot, "codex");
      entries.push([".codex/AGENTS.fragment.md", path.join(root, "AGENTS.fragment.md")]);
      for (const prompt of ["pre-plan", "plan", "execute-plan", "verify", "review"]) {
        entries.push([`.codex/prompts/${prompt}.md`, path.join(root, "prompts", `${prompt}.md`)]);
      }
      for (const skill of internalSkills) {
        entries.push([`.codex/skills/${skill}/SKILL.md`, path.join(coreRoot, "skills-internas", skill, "SKILL.md")]);
      }
    }
    if (agents.includes("antigravity")) {
      const root = path.join(adaptersRoot, "antigravity");
      entries.push(["GEMINI.md", path.join(root, "GEMINI.fragment.md")]);
      entries.push([".gemini/workflows/sdd-lite.md", path.join(root, "workflows", "sdd-lite.md")]);
      for (const skill of internalSkills) {
        entries.push([`.gemini/skills/${skill}/SKILL.md`, path.join(coreRoot, "skills-internas", skill, "SKILL.md")]);
      }
    }
  } else {
    const walk = (directory, prefix = "") => {
      const result = [];
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const relative = path.join(prefix, entry.name);
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) result.push(...walk(absolute, relative));
        else if (entry.isFile()) result.push([relative, absolute]);
      }
      return result;
    };
    entries.push(...walk(baseRoot));
  }
  return entries;
}

const files = buildFileMap();
const missing = files.filter(([, src]) => !fs.existsSync(src));
if (missing.length) {
  console.error("Faltan plantillas de origen:");
  for (const [dest, src] of missing) console.error(`- ${dest} <- ${src}`);
  process.exit(2);
}

const conflicts = files.filter(([relative]) => fs.existsSync(path.join(target, relative)));

console.log(apply ? "INSTALL: APPLY" : "INSTALL: DRY-RUN");
console.log(`Destino: ${target}`);
console.log(`Agentes: ${agents.join(", ")}`);
for (const [relative] of files) {
  const status = conflicts.some(([c]) => c === relative) ? "conflicto" : "nuevo";
  console.log(`- ${status}: ${relative}`);
}

if (conflicts.length) {
  console.error("No se instalaron archivos: existen destinos que no se sobrescribirán.");
  console.error("Archiva o resuelve esos archivos y vuelve a ejecutar el instalador.");
  process.exit(1);
} else if (apply) {
  for (const [relative, src] of files) {
    const destination = path.join(target, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(src, destination);
  }
  console.log(`Instalados ${files.length} archivos.`);
} else {
  console.log("Vista previa solamente. Repite con --apply para escribir.");
}

const legacy = detectLegacy(target);
if (legacy.traces.length) {
  console.log("\nLEGACY: DETECTADO");
  for (const trace of legacy.traces) console.log(`- ${trace.path}: ${trace.reason}`);
  if (legacy.hasOldPlans) console.log("Aviso: hay planes en .opencode/plans/ (V5). Migrar a .harness/plans/ tras archivar.");
  console.log("Archiva con migrate.mjs + migrations/manifest.v5-v6.example.json antes del init fresco. Import selectivo posterior (build/test/lint, memoria, skills-lock).");
}

const detection = detectProject(target);
console.log("\nSKILLS: SUGGEST");
if (!detection.suggestions.length) {
  console.log("No se detectó un stack con un perfil registrado.");
} else {
  console.log("Perfiles sugeridos según los archivos del proyecto (informativo, cero descargas):");
  for (const suggestion of detection.suggestions) {
    console.log(`- ${suggestion.profile}: ${suggestion.reason}`);
    console.log(`  evidencia: ${suggestion.evidence.join(", ")}`);
  }
  const profileFlags = detection.suggestions.map(({ profile }) => `--profile ${profile}`).join(" ");
  console.log(`Sugerencia explícita: node scripts/skills.mjs suggest --target "${target}"`);
  console.log(`Registro tras instalación manual: node scripts/skills.mjs install ${profileFlags} --target "${target}" --apply`);
}
