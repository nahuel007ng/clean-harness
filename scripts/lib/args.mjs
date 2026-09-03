export const VALID_AGENTS = ["opencode", "codex", "antigravity"];

export const INTERNAL_SKILLS = ["minimal-change", "git-commit", "frontend", "backend", "mobile"];

function splitList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function valuesOf(args, flag) {
  return args
    .map((value, index) => value === flag ? args[index + 1] : null)
    .filter((value) => typeof value === "string" && value.trim() !== "" && !value.trim().startsWith("--"))
    .flatMap(splitList);
}

export function valuesOfLower(args, flag) {
  return valuesOf(args, flag).map((value) => value.toLowerCase());
}

export function valueOf(args, flag) {
  const index = args.indexOf(flag);
  if (index < 0) return null;
  const next = args[index + 1];
  if (typeof next !== "string" || next.trim() === "" || next.trim().startsWith("--")) return null;
  return next;
}

export function isValidAgent(agent) {
  return VALID_AGENTS.includes(agent);
}
