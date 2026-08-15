import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(sourceRoot, "skills", "registry.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const args = process.argv.slice(2);
const command = args[0] ?? "list";

function valueOf(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
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

if (command !== "install") {
  throw new Error("Uso: list | show --profile <perfil> | install --profile <perfil> --target <proyecto> [--apply]");
}

const profile = valueOf("--profile");
const target = valueOf("--target") ? path.resolve(valueOf("--target")) : process.cwd();
const apply = args.includes("--apply");
const allowReviewRequired = args.includes("--allow-review-required");

if (!profile) throw new Error("Falta --profile");
if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
  throw new Error(`El destino no existe o no es un directorio: ${target}`);
}

const skills = profileSkills(profile);
const blocked = skills.filter((skill) => skill.status === "review-required");
if (blocked.length && !allowReviewRequired) {
  console.error("El perfil contiene skills que requieren revisión explícita:");
  for (const skill of blocked) console.error(`- ${skill.name}: ${skill.note ?? "sin nota"}`);
  console.error("Repite con --allow-review-required después de revisar la skill.");
  process.exit(1);
}

console.log(apply ? "SKILLS: APPLY" : "SKILLS: DRY-RUN");
console.log(`Perfil: ${profile}`);
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
console.log(`Instaladas ${skills.length} skills del perfil ${profile}.`);
