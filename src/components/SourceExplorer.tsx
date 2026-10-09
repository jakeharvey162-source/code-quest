import { useState, useEffect } from "react";
import { classFile, validSourceFiles } from "../lib/source-files.mjs";
import { readText, writeText } from "../lib/local-data";
import { requestQuest } from "../lib/workshop-quests.mjs";
export type SourceFile = { path: string; text: string };
export function loadSourceFiles(): SourceFile[] {
  try {
    const files = JSON.parse(readText("cq-source-files", "[]"));
    return validSourceFiles(files) ? files : [];
  } catch {
    return [];
  }
}
export function saveSourceFiles(files: SourceFile[]) {
  if (
    !validSourceFiles(files) ||
    !writeText("cq-source-files", JSON.stringify(files))
  )
    throw new Error(
      "Your source files could not be saved. Export the project to keep a copy.",
    );
}
export default function SourceExplorer({
  files,
  onChange,
  active,
  onSelect,
  main = "Program.cs",
  disabled = false,
}: {
  files: SourceFile[];
  onChange: (files: SourceFile[]) => void;
  active: string;
  onSelect: (path: string) => void;
  main?: string;
  disabled?: boolean;
}) {
  const [adding, setAdding] = useState(false),
    [name, setName] = useState(""),
    [kind, setKind] = useState("class"),
    [error, setError] = useState("");
  useEffect(() => {
    const add = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a" && !disabled) {
        e.preventDefault();
        setAdding(true);
      }
    };
    window.addEventListener("keydown", add);
    return () => window.removeEventListener("keydown", add);
  }, [disabled]);
  return (
    <section className="source-explorer" aria-label="C# solution files">
      <strong>Solution Explorer · {files.length + 1} C# files</strong>
      <label>
        Active C# file
        <select
          aria-label="Active C# file"
          value={active}
          disabled={disabled}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option>{main}</option>
          {files.map((f) => (
            <option key={f.path}>{f.path}</option>
          ))}
        </select>
      </label>
      <button
        disabled={disabled || files.length >= 20}
        onClick={() => setAdding(!adding)}
      >
        Add class / C# item
      </button>
      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const file = classFile(name, kind);
              if (
                files.some(
                  (f) => f.path.toLowerCase() === file.path.toLowerCase(),
                )
              )
                throw new Error(
                  "That file already exists. Choose another class name.",
                );
              onChange([...files, file]);
              onSelect(file.path);
              setAdding(false);
              setName("");
              setError("");
              requestQuest("class-builder");
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Could not create this file.",
              );
            }
          }}
        >
          <label>
            Class name
            <input
              aria-label="Class name"
              autoFocus
              required
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={disabled}
              placeholder="Account"
            />
          </label>
          <label>
            Item type
            <select
              aria-label="C# item type"
              value={kind}
              disabled={disabled}
              onChange={(e) => setKind(e.target.value)}
            >
              {["class", "interface", "abstract class", "enum"].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={disabled}>
            Create C# file
          </button>
          <button type="button" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
      <p className="muted">
        These files compile together and travel with your ZIP export. Write{" "}
        <code>new Account()</code> in your main code to use your class.
      </p>
    </section>
  );
}
