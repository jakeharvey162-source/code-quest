import { useState, useEffect, useRef } from "react";
import {
  classFile,
  validSourceFiles,
  sourceTree,
  renameSourceFile,
  removeSourceFile,
  validSourcePath,
} from "../lib/source-files.mjs";
import { readText, writeText } from "../lib/local-data";
import { requestQuest } from "../lib/workshop-quests.mjs";
export type SourceFile = { path: string; text: string };
type TreeNode = {
  type: string;
  name: string;
  path: string;
  children?: TreeNode[];
};
type TreeRow = TreeNode & {
  level: number;
  parent?: string;
  position: number;
  siblings: number;
};
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
  onChange: (files: SourceFile[]) => boolean | void;
  active: string;
  onSelect: (path: string) => void;
  main?: string;
  disabled?: boolean;
}) {
  const [action, setAction] = useState<"add" | "rename" | "delete" | "">(""),
    [name, setName] = useState(""),
    [folder, setFolder] = useState(""),
    [kind, setKind] = useState("class"),
    [newPath, setNewPath] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [collapsed, setCollapsed] = useState<Set<string>>(() => new Set()),
    [focused, setFocused] = useState("@solution");
  const tree = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef(false);
  const current = files.find((f) => f.path === active);
  const project = main === "Form1.cs" ? "CodeQuestForms" : "CodeQuestConsole";
  const nodes: TreeNode[] = [
    {
      type: "solution",
      name: "Solution · CodeQuest",
      path: "@solution",
      children: [
        {
          type: "project",
          name: `Project · ${project}`,
          path: "@project",
          children: sourceTree(files, main) as TreeNode[],
        },
      ],
    },
  ];
  const rows: TreeRow[] = [];
  function flatten(list: TreeNode[], level = 1, parent?: string) {
    for (const [index, node] of list.entries()) {
      rows.push({
        ...node,
        level,
        parent,
        position: index + 1,
        siblings: list.length,
      });
      if (node.children && !collapsed.has(node.path))
        flatten(node.children, level + 1, node.path);
    }
  }
  flatten(nodes);
  // Opening a document through the quick selector also reveals its ancestors.
  useEffect(() => {
    setAction("");
    setError("");
    setCollapsed(
      (previous) =>
        new Set(
          [...previous].filter(
            (path) =>
              path !== "@solution" &&
              path !== "@project" &&
              !active.toLowerCase().startsWith(path.toLowerCase() + "/"),
          ),
        ),
    );
  }, [active]);
  useEffect(() => {
    if (!restoreFocus.current) return;
    // The reveal effect above can add collapsed ancestors on the next render.
    const item = [
      ...(tree.current?.querySelectorAll<HTMLElement>('[role="treeitem"]') ||
        []),
    ].find((element) => element.dataset.path === active);
    if (item) {
      item.focus();
      restoreFocus.current = false;
    }
  });
  useEffect(() => {
    const add = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a" && !disabled) {
        e.preventDefault();
        setAction("add");
        setError("");
      }
    };
    window.addEventListener("keydown", add);
    return () => window.removeEventListener("keydown", add);
  }, [disabled]);
  function focus(path: string) {
    setFocused(path);
    tree.current
      ?.querySelectorAll<HTMLElement>('[role="treeitem"]')
      .forEach((item) => {
        if (item.dataset.path === path) item.focus();
      });
  }
  function toggle(path: string) {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }
  function persist(next: SourceFile[], selected: string, message: string) {
    if (onChange(next) === false)
      throw new Error(
        "Your source files could not be saved. Export the project to keep a copy.",
      );
    onSelect(selected);
    restoreFocus.current = true;
    setFocused(selected);
    setAction("");
    setError("");
    setNotice(message);
  }
  function attempt(operation: () => void) {
    try {
      operation();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not update the project.",
      );
    }
  }
  const tabStop = rows.some((row) => row.path === focused)
    ? focused
    : "@solution";
  return (
    <section className="source-explorer" aria-label="C# solution files">
      <strong>Solution Explorer · {files.length + 1} C# files</strong>
      <div
        ref={tree}
        role="tree"
        aria-label="Solution Explorer"
        aria-disabled={disabled}
        className="solution-tree"
      >
        {rows.map((row, index) => (
          <div
            key={row.path}
            role="treeitem"
            aria-label={row.name}
            aria-level={row.level}
            aria-posinset={row.position}
            aria-setsize={row.siblings}
            aria-expanded={row.children ? !collapsed.has(row.path) : undefined}
            aria-selected={
              row.type === "file" ? active === row.path : undefined
            }
            aria-disabled={disabled}
            data-path={row.path}
            title={row.path.startsWith("@") ? row.name : row.path}
            tabIndex={tabStop === row.path ? 0 : -1}
            style={{ paddingInlineStart: `${(row.level - 1) * 14 + 8}px` }}
            onFocus={() => setFocused(row.path)}
            onClick={() => {
              if (!disabled) {
                focus(row.path);
                if (row.children) toggle(row.path);
                else onSelect(row.path);
              }
            }}
            onKeyDown={(e) => {
              if (disabled) return;
              const keys = [
                "ArrowDown",
                "ArrowUp",
                "ArrowRight",
                "ArrowLeft",
                "Home",
                "End",
                "Enter",
                " ",
              ];
              if (!keys.includes(e.key)) return;
              e.preventDefault();
              if (e.key === "Home") focus(rows[0].path);
              else if (e.key === "End") focus(rows[rows.length - 1].path);
              else if (e.key === "ArrowDown")
                focus(rows[Math.min(index + 1, rows.length - 1)].path);
              else if (e.key === "ArrowUp")
                focus(rows[Math.max(index - 1, 0)].path);
              else if (e.key === "ArrowRight" && row.children) {
                if (collapsed.has(row.path)) toggle(row.path);
                else if (rows[index + 1]?.parent === row.path)
                  focus(rows[index + 1].path);
              } else if (e.key === "ArrowLeft") {
                if (row.children && !collapsed.has(row.path)) toggle(row.path);
                else if (row.parent) focus(row.parent);
              } else if (e.key === "Enter" || e.key === " ") {
                if (row.children) toggle(row.path);
                else onSelect(row.path);
              }
            }}
          >
            <span aria-hidden="true" className="solution-tree-icon">
              {row.children ? (collapsed.has(row.path) ? "▸" : "▾") : "#"}
            </span>
            <span>{row.name}</span>
          </div>
        ))}
      </div>
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
      <div className="source-file-actions">
        <button
          disabled={disabled || files.length >= 20}
          onClick={() => {
            setAction(action === "add" ? "" : "add");
            setError("");
          }}
        >
          Add class / C# item
        </button>
        <button
          disabled={disabled || !current}
          onClick={() => {
            setAction("rename");
            setNewPath(active);
            setError("");
          }}
        >
          Rename / move file
        </button>
        <button
          disabled={disabled || !current}
          onClick={() => {
            setAction("delete");
            setError("");
          }}
        >
          Delete file
        </button>
      </div>
      {action === "add" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            attempt(() => {
              const file = classFile(name, kind, folder);
              if (!validSourceFiles([...files, file]))
                throw new Error(
                  "That file already exists or the 20-file limit was reached. Choose another path.",
                );
              persist([...files, file], file.path, `${file.path} created.`);
              setName("");
              setFolder("");
              requestQuest("class-builder");
            });
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
            Folder path
            <input
              aria-label="Folder path"
              maxLength={180}
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              disabled={disabled}
              placeholder="Models/Bank (optional)"
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
          <button type="button" onClick={() => setAction("")}>
            Cancel
          </button>
        </form>
      )}
      {action === "rename" && current && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            attempt(() =>
              persist(
                renameSourceFile(files, active, newPath),
                newPath,
                `File moved to ${newPath}. C# names were preserved.`,
              ),
            );
          }}
        >
          <label>
            New file path
            <input
              aria-label="New file path"
              autoFocus
              required
              maxLength={240}
              value={newPath}
              disabled={disabled}
              onChange={(e) => setNewPath(e.target.value)}
            />
          </label>
          <p>
            Renaming or moving a file preserves its code. Class names,
            namespaces and references are not renamed.
          </p>
          <button type="submit" disabled={disabled}>
            Save file path
          </button>
          <button type="button" onClick={() => setAction("")}>
            Cancel
          </button>
        </form>
      )}
      {action === "delete" && current && (
        <div className="source-delete-confirm">
          <p>
            Remove {active} and its code from this project? Export a ZIP first
            if you need a backup. References in other files will remain.
          </p>
          <button
            disabled={disabled}
            onClick={() =>
              attempt(() =>
                persist(
                  removeSourceFile(files, active),
                  main,
                  `${active} removed.`,
                ),
              )
            }
          >
            Remove file
          </button>
          <button onClick={() => setAction("")}>Cancel</button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {files.some((file) => !validSourcePath(file.path)) && (
        <p role="note">
          Some older filenames are not portable to Windows. Your code is
          preserved. Rename those files before extracting a native project on
          Windows.
        </p>
      )}
      <p role="status">{notice}</p>
      <p className="muted">
        One local C# project. Files compile together and keep their folders in
        ZIP exports. Empty folders are not stored. This browser workspace does
        not run MSBuild or project references.
      </p>
    </section>
  );
}
