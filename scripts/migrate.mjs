import fs from "node:fs";
import path from "node:path";
import { valueOf } from "./lib/args.mjs";

const args = process.argv.slice(2);
const targetRaw = valueOf(args, "--target");
const manifestRaw = valueOf(args, "--manifest");
const target = targetRaw ? path.resolve(targetRaw) : null;
const manifestPath = manifestRaw ? path.resolve(manifestRaw) : null;
const apply = args.includes("--apply");

if (!target || !manifestPath) {
  console.error("Uso: node scripts/migrate.mjs --target <proyecto> --manifest <archivo> [--apply]");
  process.exit(2);
}
if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
  console.error(`El destino no existe o no es un directorio: ${target}`);
  process.exit(2);
}
if (!fs.existsSync(manifestPath)) {
  console.error(`No existe el manifiesto: ${manifestPath}`);
  process.exit(2);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch (error) {
  console.error(`Manifiesto JSON inválido: ${error.message}`);
  process.exit(2);
}

const archiveDir = manifest.archiveDir ?? ".harness-archive";
if (!Array.isArray(manifest.paths) || !manifest.paths.length) {
  console.error("MIGRATE: FAIL");
  console.error("- El manifiesto debe incluir un array no vacío en paths");
  process.exit(1);
}
if (!Array.isArray(manifest.protectedSegments)) {
  console.error("MIGRATE: FAIL");
  console.error("- protectedSegments debe ser un array");
  process.exit(1);
}
const protectedSegments = new Set(manifest.protectedSegments.map((segment) => String(segment).toLowerCase()));
const entries = manifest.paths;
const errors = [];
const plan = [];
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

function safeRelative(relative) {
  if (typeof relative !== "string" || !relative.trim()) return false;
  if (path.isAbsolute(relative)) return false;
  const normalized = path.normalize(relative);
  if (normalized === "." || normalized === ".." || normalized.startsWith(`..${path.sep}`)) return false;
  return true;
}

if (!safeRelative(archiveDir)) {
  console.error("MIGRATE: FAIL");
  console.error(`- archiveDir inseguro: ${archiveDir}`);
  process.exit(1);
}

for (const entry of entries) {
  if (!entry || entry.kind !== "harness") {
    errors.push("Cada entrada debe tener kind: harness");
    continue;
  }
  if (!safeRelative(entry.path)) {
    errors.push(`Ruta insegura: ${entry.path}`);
    continue;
  }
  if (!entry.reason || typeof entry.reason !== "string") {
    errors.push(`Falta reason para: ${entry.path}`);
    continue;
  }
  const segments = entry.path.split(/[\\/]+/).map((segment) => segment.toLowerCase());
  const protectedSegment = segments.find((segment) => protectedSegments.has(segment));
  if (protectedSegment) {
    errors.push(`Ruta protegida: ${entry.path} contiene ${protectedSegment}`);
    continue;
  }
  const source = path.resolve(target, entry.path);
  const destination = path.resolve(target, archiveDir, timestamp, entry.path);
  const relativeToTarget = path.relative(target, source);
  if (relativeToTarget.startsWith(`..${path.sep}`) || path.isAbsolute(relativeToTarget)) {
    errors.push(`Ruta fuera del proyecto: ${entry.path}`);
    continue;
  }
  if (!fs.existsSync(source)) {
    console.log(`- omitida (no existe): ${entry.path}`);
    continue;
  }
  if (fs.existsSync(destination)) {
    errors.push(`El destino ya existe: ${destination}`);
    continue;
  }
  plan.push({ entry, source, destination });
}

if (errors.length) {
  console.error("MIGRATE: FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(apply ? "MIGRATE: APPLY" : "MIGRATE: DRY-RUN");
console.log(`Archivo: ${path.resolve(target, archiveDir, timestamp)}`);
for (const { entry, source, destination } of plan) {
  console.log(`- mover ${entry.path}`);
  console.log(`  de: ${source}`);
  console.log(`  a:  ${destination}`);
  console.log(`  motivo: ${entry.reason}`);
}

if (!apply) {
  console.log("Vista previa solamente. Repite con --apply para mover las rutas listadas.");
  process.exit(0);
}

for (const { source, destination } of plan) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.renameSync(source, destination);
}
console.log(`Archivadas ${plan.length} rutas.`);
