import fs from "node:fs";
import path from "node:path";
import { valueOf } from "./lib/args.mjs";

function readSafe(absolute) {
  try {
    return fs.readFileSync(absolute, "utf8");
  } catch {
    return "";
  }
}

function isHarnessAgents(content) {
  return /harness\s*V\d|pre-plan|execute-plan|\.opencode\/plans/i.test(content);
}

function walkFiles(directory, result = []) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return result;
  }
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walkFiles(absolute, result);
    else if (entry.isFile() && entry.name.endsWith(".md")) result.push(absolute);
  }
  return result;
}

export function detectLegacy(target) {
  const root = path.resolve(target);
  const traces = [];
  const has = (relative) => fs.existsSync(path.join(root, relative));
  const isV6 = has(".harness/plans") && has(".harness/memory/decisions.md");

  // .opencode es legacy si guarda planes V5 o referencia la ruta vieja.
  if (has(".opencode") && !isV6) {
    const oldPlans = path.join(root, ".opencode", "plans");
    const hasOldPlans = fs.existsSync(oldPlans) && fs.statSync(oldPlans).isDirectory()
      && fs.readdirSync(oldPlans).some((f) => f.endsWith(".md"));
    const referencesOldPath = walkFiles(path.join(root, ".opencode"))
      .some((file) => readSafe(file).includes(".opencode/plans/"));
    if (hasOldPlans || referencesOldPath || !has(".harness")) {
      traces.push({ path: ".opencode", kind: "harness", reason: "Configuración y agentes del harness anterior" });
    }
  }

  // .agents/.codex/.gemini solo son legacy si no hay init V6 que los explique.
  for (const dir of [".agents", ".codex", ".gemini"]) {
    if (has(dir) && !isV6) {
      traces.push({ path: dir, kind: "harness", reason: "Skills/prompts del harness anterior" });
    }
  }

  // .harness es legacy si no tiene la estructura V6 (V5 solo guardaba skills-lock.json).
  if (has(".harness") && !isV6) {
    traces.push({ path: ".harness", kind: "harness", reason: "Planes/memoria/lock del harness anterior" });
  }

  for (const file of ["AGENTS.md", "GEMINI.md"]) {
    if (!has(file) || isV6) continue;
    if (isHarnessAgents(readSafe(path.join(root, file)))) {
      traces.push({ path: file, kind: "harness", reason: "Reglas del harness anterior (respaldar antes de regenerar)" });
    }
  }

  const oldPlans = path.join(root, ".opencode", "plans");
  const hasOldPlans = fs.existsSync(oldPlans) && fs.statSync(oldPlans).isDirectory()
    && fs.readdirSync(oldPlans).some((f) => f.endsWith(".md"));
  return { root, traces, hasOldPlans };
}

const args = process.argv.slice(2);

if (process.argv[1]?.endsWith("detect-legacy.mjs")) {
  const targetRaw = valueOf(args, "--target");
  const target = targetRaw ? path.resolve(targetRaw) : process.cwd();
  const json = args.includes("--json");
  const result = detectLegacy(target);
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log("LEGACY: SCAN");
    console.log(`Proyecto: ${result.root}`);
    if (!result.traces.length) {
      console.log("Sin rastros de harness anterior.");
    } else {
      for (const trace of result.traces) console.log(`- ${trace.path}: ${trace.reason}`);
      if (result.hasOldPlans) console.log("Aviso: hay planes en .opencode/plans/ (V5). Migrar a .harness/plans/.");
      console.log("Genera un manifiesto desde migrations/manifest.v5-v6.example.json y archiva con migrate.mjs antes del init fresco.");
    }
  }
}
