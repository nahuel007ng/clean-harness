import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectProject } from "./stack-detect.mjs";
import { valueOf, valuesOfLower } from "./lib/args.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(sourceRoot, "skills", "registry.json");
let registry;
try {
  registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
} catch (error) {
  console.error(`No se pudo leer skills/registry.json: ${error.message}`);
  process.exit(2);
}
const args = process.argv.slice(2);
const command = args[0] ?? "list";

function getSkill(name) {
  const skill = registry.skills.find((candidate) => candidate.name === name);
  if (!skill) throw new Error(`Skill no registrada: ${name}`);
  return skill;
}

function profileSkills(profile) {
  const names = registry.profiles[profile];
  if (!names) throw new Error(`Perfil no registrado: ${profile}`);
  return names.map(getSkill);
}

function selectedProfiles() {
  return valuesOfLower(args, "--profile");
}

function selectedSkills(profiles) {
  const names = [...new Set(profiles.flatMap((profile) => registry.profiles[profile] ?? []))];
  return names.map(getSkill);
}

function lockPath(target) {
  return path.join(target, ".harness", "skills-lock.json");
}

function writeLock(target, profiles, skills) {
  const destination = lockPath(target);
  let previous = {};
  if (fs.existsSync(destination)) {
    try {
      previous = JSON.parse(fs.readFileSync(destination, "utf8"));
    } catch {
      previous = {};
    }
  }

  const now = new Date().toISOString();
  const entries = new Map((previous.skills ?? []).map((skill) => [skill.name, skill]));
  for (const skill of skills) {
    entries.set(skill.name, {
      name: skill.name,
      source: skill.source,
      status: skill.status ?? "recommended",
      reviewedOn: skill.reviewedOn ?? now.slice(0, 10),
      installedAt: now
    });
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify({
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    version: 1,
    generatedBy: "clean-harness",
    agent: registry.policy.agent,
    updatedAt: now,
    profiles: [...new Set([...(previous.profiles ?? []), ...profiles])],
    skills: [...entries.values()].sort((left, right) => left.name.localeCompare(right.name))
  }, null, 2)}\n`);
  return destination;
}

function manualCommand(skill) {
  return `DISABLE_TELEMETRY=1 DO_NOT_TRACK=1 npx skills add ${skill.source} --skill ${skill.name} --copy --yes`;
}

function printSkill(skill) {
  console.log(`${skill.name} [${skill.status}]`);
  console.log(`  fuente: ${skill.source}`);
  console.log(`  motivo: ${skill.why}`);
  if (skill.note) console.log(`  nota: ${skill.note}`);
  console.log(`  auditorías: ${Object.entries(skill.audits ?? {}).map(([name, status]) => `${name}=${status}`).join(", ") || "ver skills.sh"}`);
  console.log(`  manual: ${manualCommand(skill)}`);
  console.log(`  destino: .agents/skills/${skill.name}/ (+ espejo del adapter activo)`);
}

if (command === "list") {
  for (const [name, skills] of Object.entries(registry.profiles)) {
    console.log(`${name}: ${skills.join(", ")}`);
  }
  process.exit(0);
}

if (command === "show") {
  const rawProfile = valueOf(args, "--profile") ?? args[1];
  const profile = rawProfile?.toLowerCase();
  if (!profile) throw new Error("Uso: node scripts/skills.mjs show --profile <perfil>");
  for (const skill of profileSkills(profile)) printSkill(skill);
  process.exit(0);
}

if (command === "suggest") {
  const targetRaw = valueOf(args, "--target");
  const target = targetRaw ? path.resolve(targetRaw) : process.cwd();
  const result = detectProject(target);
  if (args.includes("--json")) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  console.log("SKILLS: SUGGEST");
  console.log(`Proyecto: ${result.root}`);
  console.log(`Archivos inspeccionados: ${result.filesScanned}`);
  if (!result.suggestions.length) {
    console.log("No se detectó un stack con un perfil registrado.");
  } else {
    for (const suggestion of result.suggestions) {
      console.log(`- ${suggestion.profile}: ${suggestion.reason}`);
      console.log(`  evidencia: ${suggestion.evidence.join(", ")}`);
      for (const skill of profileSkills(suggestion.profile)) {
        console.log(`  · ${skill.name} [${skill.status}]`);
      }
    }
    console.log("La sugerencia es informativa. Cero descargas. Instala manualmente tras aprobar y registra con install/record --apply.");
  }
  process.exit(0);
}

if (command === "record") {
  const targetRaw = valueOf(args, "--target");
  const target = targetRaw ? path.resolve(targetRaw) : process.cwd();
  const name = valueOf(args, "--skill");
  const source = valueOf(args, "--source");
  const apply = args.includes("--apply");
  if (!name || !source) throw new Error("Uso: node scripts/skills.mjs record --skill <nombre> --source <url> [--profile <perfil>] --target <proyecto> [--apply]");
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    throw new Error(`El destino no existe o no es un directorio: ${target}`);
  }
  const profiles = selectedProfiles();
  const skill = { name, source, status: "recommended", reviewedOn: new Date().toISOString().slice(0, 10) };
  console.log(apply ? "SKILLS: RECORD-APPLY" : "SKILLS: RECORD-DRY-RUN");
  console.log(`Skill: ${name}`);
  console.log(`Fuente: ${source}`);
  console.log(`Copia local esperada: .agents/skills/${name}/SKILL.md (o espejo del adapter)`);
  if (!apply) {
    console.log("Vista previa solamente. Instala manualmente la skill y repite con --apply para registrar.");
    process.exit(0);
  }
  const lock = writeLock(target, profiles, [skill]);
  console.log(`Registrada ${name}.`);
  console.log(`Lockfile: ${lock}`);
  process.exit(0);
}

if (command !== "install") {
  throw new Error("Uso: list | show --profile <perfil> | suggest --target <proyecto> | install --profile <perfil> [--profile <perfil>] --target <proyecto> [--apply] | record --skill <nombre> --source <url> --target <proyecto> [--apply]");
}

const profiles = selectedProfiles();
const targetRaw = valueOf(args, "--target");
const target = targetRaw ? path.resolve(targetRaw) : process.cwd();
const apply = args.includes("--apply");
const allowReviewRequired = args.includes("--allow-review-required");

if (!profiles.length) throw new Error("Falta --profile");
if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
  throw new Error(`El destino no existe o no es un directorio: ${target}`);
}

for (const profile of profiles) {
  if (!registry.profiles[profile]) throw new Error(`Perfil no registrado: ${profile}`);
}
const skills = selectedSkills(profiles);
const blocked = skills.filter((skill) => skill.status === "review-required");
if (blocked.length && !allowReviewRequired) {
  console.error("El perfil contiene skills que requieren revisión explícita:");
  for (const skill of blocked) console.error(`- ${skill.name}: ${skill.note ?? "sin nota"}`);
  console.error("Repite con --allow-review-required después de revisar la skill.");
  process.exit(1);
}

console.log(apply ? "SKILLS: RECORD-APPLY" : "SKILLS: DRY-RUN");
console.log(`Perfiles: ${profiles.join(", ")}`);
console.log(`Proyecto: ${target}`);
console.log("V6 no descarga automáticamente. Instala manualmente cada skill y este comando solo registra el lock:");
for (const skill of skills) {
  console.log(`- ${skill.name}: ${manualCommand(skill)}`);
}

if (!apply) {
  console.log("Vista previa solamente. Tras instalar manualmente, repite con --apply para registrar.");
  process.exit(0);
}

const lock = writeLock(target, profiles, skills);
console.log(`Registradas ${skills.length} skills (sin descargas).`);
console.log(`Lockfile: ${lock}`);
