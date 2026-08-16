import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectProject } from "./stack-detect.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templateRoot = path.join(sourceRoot, "templates", "project");
const args = process.argv.slice(2);
const targetIndex = args.indexOf("--target");
const target = targetIndex >= 0 && args[targetIndex + 1]
  ? path.resolve(args[targetIndex + 1])
  : null;
const apply = args.includes("--apply");

if (!target) {
  console.error("Uso: node scripts/install.mjs --target <proyecto> [--apply]");
  process.exit(2);
}
if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
  console.error(`El destino no existe o no es un directorio: ${target}`);
  process.exit(2);
}

function walk(directory, prefix = "") {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walk(absolute, relative));
    else if (entry.isFile()) result.push(relative);
  }
  return result;
}

const files = walk(templateRoot);
const conflicts = files.filter((relative) => fs.existsSync(path.join(target, relative)));

console.log(apply ? "INSTALL: APPLY" : "INSTALL: DRY-RUN");
console.log(`Destino: ${target}`);
for (const relative of files) {
  const status = conflicts.includes(relative) ? "conflicto" : "nuevo";
  console.log(`- ${status}: ${relative}`);
}

if (conflicts.length) {
  console.error("No se instalaron archivos: existen destinos que no se sobrescribirán.");
  console.error("Archiva o resuelve esos archivos y vuelve a ejecutar el instalador.");
  process.exitCode = 1;
} else if (apply) {
  for (const relative of files) {
    const destination = path.join(target, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(templateRoot, relative), destination);
  }
  console.log(`Instalados ${files.length} archivos.`);
} else {
  console.log("Vista previa solamente. Repite con --apply para escribir.");
}

const detection = detectProject(target);
console.log("\nSKILLS: SUGGEST");
if (!detection.suggestions.length) {
  console.log("No se detectó un stack con un perfil registrado.");
} else {
  console.log("Perfiles sugeridos según los archivos del proyecto:");
  for (const suggestion of detection.suggestions) {
    console.log(`- ${suggestion.profile}: ${suggestion.reason}`);
    console.log(`  evidencia: ${suggestion.evidence.join(", ")}`);
  }
  const profileFlags = detection.suggestions.map(({ profile }) => `--profile ${profile}`).join(" ");
  console.log(`Instalación explícita: node scripts/skills.mjs install ${profileFlags} --target "${target}" --apply`);
}
