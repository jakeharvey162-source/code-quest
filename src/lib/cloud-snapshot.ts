import { readText, writeText, readBrief } from "./local-data";
import { normalizeControls } from "./form-storage";
import { migrateProgress, type Progress } from "./progress";
import { validSourceFiles } from "./source-files.mjs";
const terminalKeys = [
  "cq-terminal-language",
  "cq-terminal-input",
  ...[
    "javascript",
    "typescript",
    "html",
    "css",
    "python",
    "python-turtle",
    "csharp",
  ].map((language) => "cq-terminal-source-" + language),
];
export function currentSnapshot(progress: Progress) {
  return {
    format: "codequest-backup-v1",
    progress,
    controls: normalizeControls(JSON.parse(readText("cq-form", "[]"))) || [],
    terminal: Object.fromEntries(
      terminalKeys.map((key) => [key, readText(key)]),
    ),
    sourceFiles: JSON.parse(readText("cq-source-files", "[]")),
    practicalCode: readText("cq-practical-code"),
    practicalBrief: readBrief(),
  };
}
export function restoreSnapshot(value: any) {
  const progress = migrateProgress(value?.progress),
    controls = normalizeControls(value?.controls);
  if (
    value?.format !== "codequest-backup-v1" ||
    !progress ||
    !controls ||
    typeof value.practicalCode !== "string" ||
    value.practicalCode.length > 50000 ||
    (value.sourceFiles !== undefined && !validSourceFiles(value.sourceFiles))
  )
    throw Error("Invalid cloud save. Local work was kept.");
  if (
    value.terminal !== undefined &&
    (!value.terminal ||
      typeof value.terminal !== "object" ||
      Array.isArray(value.terminal) ||
      Object.entries(value.terminal).some(
        ([key, text]) =>
          !terminalKeys.includes(key) ||
          typeof text !== "string" ||
          text.length > 200000,
      ))
  )
    throw Error("Invalid terminal save. Local work was kept.");
  // Validate every field before changing any local data.
  const writes: [string, string][] = [
    ["cq-form", JSON.stringify(controls)],
    ["cq-practical-code", value.practicalCode],
    ["cq-practical-brief", JSON.stringify(value.practicalBrief || null)],
    ["cq-source-files", JSON.stringify(value.sourceFiles || [])],
  ];
  if (value.terminal)
    writes.push(...(Object.entries(value.terminal) as [string, string][]));
  const previous = writes.map(
    ([key]) => [key, readText(key)] as [string, string],
  );
  if (writes.some(([key, text]) => !writeText(key, text))) {
    previous.forEach(([key, text]) => writeText(key, text));
    throw Error(
      "This browser could not restore your saved work. Free device storage and try again.",
    );
  }
  window.dispatchEvent(new Event("cq-cloud-restored"));
  return progress;
}
export function hasLocalWork(p: Progress) {
  return !!(
    p.completed.length ||
    p.assessments.length ||
    Object.keys(p.drafts).length ||
    Object.keys(p.steps).length ||
    readText("cq-practical-code") ||
    readText("cq-form", "[]") !== "[]" ||
    readText("cq-source-files", "[]") !== "[]" ||
    terminalKeys.some((key) => key !== "cq-terminal-language" && readText(key))
  );
}

export function snapshotText(value: any): string {
  const ordered = (v: any): any =>
    Array.isArray(v)
      ? v.map(ordered)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map((k) => [k, ordered(v[k])]),
          )
        : v;
  return JSON.stringify(ordered(value));
}
