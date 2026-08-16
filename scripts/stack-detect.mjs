import fs from "node:fs";
import path from "node:path";

const ignoredDirectories = new Set([
  ".git",
  ".agents",
  ".opencode",
  ".next",
  ".gradle",
  "build",
  "dist",
  "node_modules",
  "vendor"
]);

const readableExtensions = new Set([
  ".gradle",
  ".json",
  ".js",
  ".jsx",
  ".kts",
  ".kt",
  ".mjs",
  ".ts",
  ".tsx",
  ".toml",
  ".xml",
  ".yml",
  ".yaml"
]);

const nonProjectContentDirectories = new Set([
  ".agents",
  ".codex",
  ".harness",
  ".opencode",
  "docs",
  "documentation",
  "migrations",
  "outputs",
  "scripts",
  "skills",
  "test",
  "tests",
  "templates",
  "wiki"
]);

function walk(root, current = "", result = []) {
  const directory = path.join(root, current);
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const relative = path.join(current, entry.name);
    if (entry.isDirectory()) {
      walk(root, relative, result);
    } else if (entry.isFile()) {
      result.push(relative);
    }
    if (result.length >= 5000) return result;
  }
  return result;
}

function readText(root, relative) {
  const absolute = path.join(root, relative);
  try {
    const stat = fs.statSync(absolute);
    if (stat.size > 1024 * 1024) return "";
    return fs.readFileSync(absolute, "utf8");
  } catch {
    return "";
  }
}

function packageData(root, files) {
  const packageFile = files.find((file) => file.toLowerCase() === "package.json");
  if (!packageFile) return {};
  try {
    return JSON.parse(readText(root, packageFile));
  } catch {
    return {};
  }
}

function dependencyNames(packageJson) {
  return new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {})
  ].map((name) => name.toLowerCase()));
}

function hasAny(values, candidates) {
  return candidates.some((candidate) => values.has(candidate));
}

function isProjectContent(relative) {
  return relative
    .replaceAll("\\", "/")
    .split("/")
    .slice(0, -1)
    .some((segment) => nonProjectContentDirectories.has(segment.toLowerCase())) === false;
}

function addSuggestion(suggestions, profile, reason, evidence) {
  suggestions.push({ profile, reason, evidence: [...new Set(evidence)] });
}

export function detectProject(root) {
  const projectRoot = path.resolve(root);
  if (!fs.existsSync(projectRoot) || !fs.statSync(projectRoot).isDirectory()) {
    throw new Error(`El destino no existe o no es un directorio: ${projectRoot}`);
  }

  const files = walk(projectRoot);
  const normalizedFiles = files.map((file) => file.replaceAll("\\", "/").toLowerCase());
  const fileSet = new Set(normalizedFiles);
  const contents = files
    .filter((file) => isProjectContent(file))
    .filter((file) => readableExtensions.has(path.extname(file).toLowerCase()))
    .map((file) => readText(projectRoot, file))
    .join("\n")
    .toLowerCase();
  const androidContents = files
    .filter((file) => isProjectContent(file))
    .filter((file) => {
      const name = path.basename(file).toLowerCase();
      const extension = path.extname(file).toLowerCase();
      return ["build.gradle", "build.gradle.kts", "settings.gradle", "settings.gradle.kts", "gradle.properties", "libs.versions.toml", "androidmanifest.xml"].includes(name)
        || [".kt", ".kts"].includes(extension);
    })
    .map((file) => readText(projectRoot, file))
    .join("\n")
    .toLowerCase();
  const packageJson = packageData(projectRoot, files);
  const dependencies = dependencyNames(packageJson);
  const suggestions = [];

  const androidEvidence = [];
  if (fileSet.has("androidmanifest.xml") || normalizedFiles.some((file) => file.endsWith("/androidmanifest.xml"))) {
    androidEvidence.push("AndroidManifest.xml");
  }
  if (androidContents.includes("com.android.application") || androidContents.includes("com.android.library")) {
    androidEvidence.push("plugin Android de Gradle");
  }
  if (normalizedFiles.some((file) => file.includes("/src/main/"))) {
    androidEvidence.push("src/main");
  }
  const isAndroid = androidEvidence.length > 0;
  const hasKotlin = files.some((file) => [".kt", ".kts"].includes(path.extname(file).toLowerCase()))
    || androidContents.includes("kotlin(")
    || androidContents.includes("org.jetbrains.kotlin");
  const isCompose = androidContents.includes("androidx.compose")
    || androidContents.includes("@composable")
    || androidContents.includes("buildfeatures") && androidContents.includes("compose");
  const hasAndroidTests = normalizedFiles.some((file) => file.includes("/androidtest/"))
    || androidContents.includes("androidtestimplementation")
    || androidContents.includes("espresso")
    || androidContents.includes("uiautomator")
    || androidContents.includes("compose.ui.test");
  const usesCameraX = androidContents.includes("androidx.camera") || androidContents.includes("camerax");

  if (isAndroid) {
    const evidence = [...androidEvidence];
    if (hasKotlin) evidence.push("Kotlin/Gradle Kotlin DSL");
    addSuggestion(
      suggestions,
      "android",
      "Proyecto Android detectado; propone una guía Kotlin y una base de verificación Android.",
      evidence
    );
  }
  if (isAndroid && isCompose) {
    addSuggestion(
      suggestions,
      "android-compose",
      "Compose detectado; propone diseño Material/adaptativo y manejo de edge-to-edge.",
      ["androidx.compose", "@Composable"]
    );
  }
  if (isAndroid && hasAndroidTests) {
    addSuggestion(
      suggestions,
      "android-device",
      "Se detectaron pruebas instrumentadas o APIs de automatización; propone QA con emulador/dispositivo.",
      ["androidTest", "Espresso/UIAutomator/Compose UI test"]
    );
  }
  if (isAndroid && usesCameraX) {
    addSuggestion(
      suggestions,
      "android-camera",
      "Se detectó CameraX; conviene añadir la skill específica solo para ese subsistema.",
      ["androidx.camera/CameraX"]
    );
  }

  const isExpo = dependencies.has("expo");
  const isReactNative = isExpo || dependencies.has("react-native");
  const isWeb = dependencies.has("next") || dependencies.has("react") || dependencies.has("vue")
    || dependencies.has("svelte");
  const usesPlaywright = dependencies.has("@playwright/test") || dependencies.has("playwright")
    || fileSet.has("playwright.config.ts") || fileSet.has("playwright.config.js");
  const isBackend = hasAny(dependencies, ["express", "fastify", "@nestjs/core", "hono", "koa"])
    || fileSet.has("go.mod") || fileSet.has("pyproject.toml") || fileSet.has("requirements.txt");
  const usesPostgres = hasAny(dependencies, ["pg", "postgres", "@supabase/supabase-js", "prisma", "drizzle-orm"])
    || contents.includes("postgresql://")
    || contents.includes("postgres://");

  if (isExpo) {
    addSuggestion(suggestions, "expo", "Expo detectado en las dependencias del proyecto.", ["package.json: expo"]);
  } else if (isReactNative) {
    addSuggestion(suggestions, "react-native", "React Native detectado en las dependencias del proyecto.", ["package.json: react-native"]);
  } else if (isWeb) {
    addSuggestion(suggestions, "web", "Framework o librería web detectada en las dependencias del proyecto.", ["package.json: React/Next/Vue/Svelte"]);
  }
  if (isBackend) {
    addSuggestion(suggestions, "backend", "Se detectó una tecnología de backend o un proyecto servidor.", ["dependencias/manifest de backend"]);
  }
  if (usesPostgres) {
    addSuggestion(suggestions, "postgres", "Se detectó PostgreSQL o una herramienta habitual de acceso a PostgreSQL.", ["dependencias/configuración PostgreSQL"]);
  }
  if (usesPlaywright) {
    addSuggestion(suggestions, "testing", "Playwright detectado; propone prácticas de pruebas y verificación web.", ["Playwright"]);
  }

  return {
    root: projectRoot,
    filesScanned: files.length,
    signals: {
      android: isAndroid,
      kotlin: hasKotlin,
      compose: isCompose,
      androidTests: hasAndroidTests,
      cameraX: usesCameraX,
      expo: isExpo,
      reactNative: isReactNative,
      web: isWeb,
      backend: isBackend,
      postgres: usesPostgres,
      playwright: usesPlaywright
    },
    suggestions
  };
}
