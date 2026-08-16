import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { detectProject } from "./stack-detect.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(sourceRoot, "skills", "registry.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const args = process.argv.slice(2);
const command = args[0] ?? "list";

function valueOf(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function valuesOf(flag) {
  return args
    .map((value, index) => value === flag ? args[index + 1] : null)
    .filter(Boolean)
    .flatMap((value) => value.split(",").map((item) => item.trim()).filter(Boolean));
}

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
  return valuesOf("--profile");
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
      status: skill.status,
      reviewedOn: skill.reviewedOn,
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

function installCommand(skill) {
  return [
    "skills", "add", skill.source,
    "--skill", skill.name,
    "--agent", registry.policy.agent,
    "--copy",
    "--yes"
  ];
}

function printSkill(skill) {
  console.log(`${skill.name} [${skill.status}]`);
  console.log(`  fuente: ${skill.source}`);
  console.log(`  motivo: ${skill.why}`);
  if (skill.note) console.log(`  nota: ${skill.note}`);
  console.log(`  auditorías: ${Object.entries(skill.audits).map(([name, status]) => `${name}=${status}`).join(", ")}`);
  console.log(`  comando: npx ${installCommand(skill).join(" ")}`);
}

if (command === "list") {
  for (const [name, skills] of Object.entries(registry.profiles)) {
    console.log(`${name}: ${skills.join(", ")}`);
  }
  process.exit(0);
}

if (command === "show") {
  const profile = valueOf("--profile") ?? args[1];
  if (!profile) throw new Error("Uso: node scripts/skills.mjs show --profile <perfil>");
  for (const skill of profileSkills(profile)) printSkill(skill);
  process.exit(0);
}

if (command === "suggest") {
  const target = valueOf("--target") ? path.resolve(valueOf("--target")) : process.cwd();
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
    console.log("La sugerencia es informativa. No se descarga nada automáticamente.");
    console.log("Para instalar, repite con uno o más --profile y --apply.");
  }
  process.exit(0);
}

if (command !== "install") {
  throw new Error("Uso: list | show --profile <perfil> | suggest --target <proyecto> | install --profile <perfil> [--profile <perfil>] --target <proyecto> [--apply]");
}

const profiles = selectedProfiles();
const target = valueOf("--target") ? path.resolve(valueOf("--target")) : process.cwd();
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

console.log(apply ? "SKILLS: APPLY" : "SKILLS: DRY-RUN");
console.log(`Perfiles: ${profiles.join(", ")}`);
console.log(`Proyecto: ${target}`);
for (const skill of skills) {
  console.log(`- ${skill.name}: npx ${installCommand(skill).join(" ")}`);
}

if (!apply) {
  console.log("Vista previa solamente. Repite con --apply para descargar e instalar.");
  process.exit(0);
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
for (const skill of skills) {
  const env = {
    ...process.env,
    DISABLE_TELEMETRY: process.env.DISABLE_TELEMETRY ?? "1"
  };
  const result = spawnSync(npx, installCommand(skill).slice(1), {
    cwd: target,
    env,
    stdio: "inherit"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`Falló la instalación de ${skill.name} con código ${result.status}`);
    process.exit(result.status ?? 1);
  }
}
const lock = writeLock(target, profiles, skills);
console.log(`Instaladas ${skills.length} skills.`);
console.log(`Lockfile: ${lock}`);
