import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;

function run(script, args = []) {
  return execFileSync(node, [path.join(repoRoot, "scripts", script), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function makeTemp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "harness-v6-"));
}

test("doctor de fuente valida core agnostico y adapters", () => {
  const out = run("doctor.mjs");
  assert.match(out, /DOCTOR: OK/);
});

test("core no menciona TUIs", () => {
  const coreFiles = [
    "templates/core/AGENTS.md",
    "templates/core/permisos.md",
    "templates/core/planes-formato.md",
    "templates/core/memoria-formato.md"
  ];
  for (const relative of coreFiles) {
    const content = fs.readFileSync(path.join(repoRoot, relative), "utf8");
    assert.ok(!content.includes(".opencode"), `${relative} menciona .opencode`);
    assert.ok(!content.includes("$ARGUMENTS"), `${relative} menciona $ARGUMENTS`);
    assert.ok(!content.includes("opencode.json"), `${relative} menciona opencode.json`);
  }
});

test("install dry-run multi-adapter no escribe y apply instala", () => {
  const target = makeTemp();
  try {
    const dry = run("install.mjs", ["--target", target]);
    assert.match(dry, /DRY-RUN/);
    assert.ok(!fs.existsSync(path.join(target, "AGENTS.md")));
    run("install.mjs", ["--target", target, "--apply"]);
    assert.ok(fs.existsSync(path.join(target, "AGENTS.md")));
    assert.ok(fs.existsSync(path.join(target, ".harness", "plans", ".gitkeep")));
    assert.ok(fs.existsSync(path.join(target, ".harness", "memory", "decisions.md")));
    assert.ok(fs.existsSync(path.join(target, ".opencode", "opencode.json")));
    assert.ok(fs.existsSync(path.join(target, ".codex", "prompts", "plan.md")));
    assert.ok(fs.existsSync(path.join(target, "GEMINI.md")));
    assert.ok(fs.existsSync(path.join(target, ".agents", "skills", "minimal-change", "SKILL.md")));
    const out = run("doctor.mjs", ["--project", target]);
    assert.match(out, /DOCTOR: OK/);
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
});

test("install --agent subset solo instala lo pedido", () => {
  const target = makeTemp();
  try {
    run("install.mjs", ["--agent", "codex", "--target", target, "--apply"]);
    assert.ok(fs.existsSync(path.join(target, ".codex", "prompts", "plan.md")));
    assert.ok(!fs.existsSync(path.join(target, ".opencode", "opencode.json")));
    assert.ok(!fs.existsSync(path.join(target, "GEMINI.md")));
    const out = run("doctor.mjs", ["--project", target, "--agent", "codex"]);
    assert.match(out, /DOCTOR: OK/);
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
});

test("install no sobrescribe y reporta conflicto", () => {
  const target = makeTemp();
  try {
    run("install.mjs", ["--target", target, "--apply"]);
    let failed = false;
    try {
      run("install.mjs", ["--target", target]);
    } catch (error) {
      failed = true;
      assert.match(String(error.status), /1/);
    }
    assert.ok(failed);
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
});

test("skills record escribe lock sin descargas", () => {
  const target = makeTemp();
  try {
    run("install.mjs", ["--target", target, "--apply"]);
    fs.mkdirSync(path.join(target, ".agents", "skills", "demo-skill"), { recursive: true });
    fs.writeFileSync(path.join(target, ".agents", "skills", "demo-skill", "SKILL.md"), "# demo\n", "utf8");
    const out = run("skills.mjs", ["record", "--skill", "demo-skill", "--source", "https://example.com/skills", "--target", target, "--apply"]);
    assert.match(out, /Registrada demo-skill/);
    const lock = JSON.parse(fs.readFileSync(path.join(target, ".harness", "skills-lock.json"), "utf8"));
    assert.ok(lock.skills.some((s) => s.name === "demo-skill"));
    const doctor = run("doctor.mjs", ["--project", target]);
    assert.match(doctor, /DOCTOR: OK/);
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
});

test("detect-legacy encuentra rastros V5", () => {
  const target = makeTemp();
  try {
    fs.mkdirSync(path.join(target, ".opencode", "plans"), { recursive: true });
    fs.writeFileSync(path.join(target, ".opencode", "plans", "2026-01-01-demo.md"), "---\nestado: concluido\n---\n", "utf8");
    fs.writeFileSync(path.join(target, "AGENTS.md"), "# harness V5\n/pre-plan\n", "utf8");
    const out = run("detect-legacy.mjs", ["--target", target]);
    assert.match(out, /.opencode/);
    assert.match(out, /AGENTS.md/);
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
});

test("detect-legacy no reporta un init V6 fresco como legacy", () => {
  const target = makeTemp();
  try {
    run("install.mjs", ["--target", target, "--apply"]);
    const out = run("detect-legacy.mjs", ["--target", target]);
    assert.match(out, /Sin rastros/);
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
});
