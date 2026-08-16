import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { detectProject } from "../scripts/stack-detect.mjs";

async function createFixture() {
  return fs.mkdtemp(path.join(os.tmpdir(), "clean-harness-"));
}

async function writeFixture(root, relative, content) {
  const destination = path.join(root, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, content, "utf8");
}

test("detecta Android Compose y pruebas instrumentadas", async () => {
  const root = await createFixture();
  try {
    await writeFixture(root, "settings.gradle.kts", 'pluginManagement { }\n');
    await writeFixture(root, "app/build.gradle.kts", [
      'plugins { id("com.android.application") }',
      'android { buildFeatures { compose = true } }',
      'dependencies { androidTestImplementation("androidx.test.espresso:espresso-core:3.6.0") }'
    ].join("\n"));
    await writeFixture(root, "app/src/main/AndroidManifest.xml", "<manifest />");
    await writeFixture(root, "app/src/main/MainActivity.kt", "@Composable fun MainScreen() = Unit");
    await writeFixture(root, "app/src/androidTest/MainTest.kt", "class MainTest");

    const result = detectProject(root);
    assert.equal(result.signals.android, true);
    assert.equal(result.signals.compose, true);
    assert.equal(result.signals.androidTests, true);
    assert.deepEqual(
      result.suggestions.map(({ profile }) => profile),
      ["android", "android-compose", "android-device"]
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("ignora referencias de documentación y scripts del harness", async () => {
  const root = await createFixture();
  try {
    await writeFixture(root, "scripts/example.mjs", "com.android.application @Composable postgresql://");
    await writeFixture(root, "docs/architecture.yaml", "androidx.compose espresso");

    const result = detectProject(root);
    assert.deepEqual(result.suggestions, []);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
