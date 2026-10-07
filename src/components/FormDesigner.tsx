import { useEffect, useRef, useState } from "react";
import {
  Download,
  Play,
  Plus,
  Trash2,
  Undo2,
  Redo2,
  MousePointer2,
  Code2,
  CheckCircle2,
} from "lucide-react";
import {
  toolbox,
  addControl,
  updateControl,
  removeControl,
  designerCode,
  validateForm,
} from "../designer-engine.mjs";
import { projectZip } from "../lib/project-export.mjs";
import { download } from "../lib/download";
import { readText, writeText, readBrief } from "../lib/local-data";
import CodeEditor from "./CodeEditor";
import { reviewSource } from "../lib/assessment-engine.mjs";
export type Control = {
  id: string;
  type: string;
  name: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  font: string;
  foreColor: string;
  backColor: string;
  enabled: boolean;
  visible: boolean;
  tabIndex: number;
  anchor: string;
  dock: string;
  accessibleName: string;
  eventClick: string;
  eventTextChanged: string;
  eventSelectedIndexChanged: string;
  eventCheckedChanged: string;
  items: string;
  checked: boolean;
  password: boolean;
  minimum: number;
  maximum: number;
  value: number;
};
export function validControls(value: unknown): value is Control[] {
  return (
    Array.isArray(value) &&
    value.length <= 100 &&
    value.every(
      (c) =>
        c &&
        toolbox.includes(c.type) &&
        [
          "id",
          "name",
          "text",
          "font",
          "foreColor",
          "backColor",
          "anchor",
          "dock",
          "accessibleName",
          "eventClick",
          "eventTextChanged",
          "eventSelectedIndexChanged",
          "eventCheckedChanged",
          "items",
        ].every((k) => typeof c[k] === "string" && c[k].length < 10000) &&
        [
          "x",
          "y",
          "width",
          "height",
          "tabIndex",
          "minimum",
          "maximum",
          "value",
        ].every((k) => Number.isFinite(c[k])) &&
        ["x", "y", "width", "height", "tabIndex"].every(
          (k) => Number.isSafeInteger(c[k]) && c[k] >= 0 && c[k] <= 10000,
        ) &&
        c.width >= 24 &&
        c.height >= 20 &&
        ["enabled", "visible", "checked", "password"].every(
          (k) => typeof c[k] === "boolean",
        ) &&
        /^#[0-9a-f]{6}$/i.test(c.foreColor) &&
        /^#[0-9a-f]{6}$/i.test(c.backColor) &&
        ["None", "Top", "Bottom", "Left", "Right", "Fill"].includes(c.dock) &&
        c.anchor
          .split(",")
          .every((s: string) =>
            ["Top", "Bottom", "Left", "Right"].includes(s.trim()),
          ),
    ) &&
    new Set(value.map((c) => c.id)).size === value.length
  );
}
export function normalizeControls(value: unknown): Control[] | null {
  if (!Array.isArray(value)) return null;
  const migrated = value.map((c) =>
    c && typeof c === "object"
      ? { eventSelectedIndexChanged: "", eventCheckedChanged: "", ...c }
      : c,
  );
  return validControls(migrated) ? migrated : null;
}
function initialControls() {
  try {
    return normalizeControls(JSON.parse(readText("cq-form", "[]"))) || [];
  } catch {
    return [];
  }
}
export function ControlView({
  c,
  preview = false,
  onEvent,
}: {
  c: Control;
  preview?: boolean;
  onEvent?: (name: string) => void;
}) {
  const font = /^(.+),\s*(\d+(?:\.\d+)?)pt$/.exec(c.font);
  const style = {
    color: c.foreColor,
    background: c.backColor,
    fontFamily: font?.[1] || "Segoe UI",
    fontSize: font ? `${font[2]}pt` : "9pt",
  };
  const opts = (c.items || "").split("\n").filter(Boolean);
  switch (c.type) {
    case "TextBox":
      return (
        <input
          style={style}
          aria-label={c.accessibleName || c.name}
          type={c.password ? "password" : "text"}
          defaultValue={c.text === "TextBox" ? "" : c.text}
          readOnly={!preview}
          disabled={!preview || !c.enabled}
          onChange={() => onEvent?.(c.eventTextChanged)}
        />
      );
    case "Label":
      return <span style={style}>{c.text}</span>;
    case "ComboBox":
      return (
        <select
          style={style}
          aria-label={c.accessibleName || c.name}
          disabled={!preview || !c.enabled}
          onChange={() => onEvent?.(c.eventSelectedIndexChanged)}
        >
          {opts.length ? (
            opts.map((item, i) => <option key={i}>{item}</option>)
          ) : (
            <option>{c.text}</option>
          )}
        </select>
      );
    case "ListBox":
      return (
        <select
          style={style}
          size={4}
          aria-label={c.accessibleName || c.name}
          disabled={!preview || !c.enabled}
          onChange={() => onEvent?.(c.eventSelectedIndexChanged)}
        >
          {opts.map((item, i) => (
            <option key={i}>{item}</option>
          ))}
        </select>
      );
    case "RadioButton":
    case "CheckBox":
      return (
        <label style={style}>
          <input
            type={c.type === "RadioButton" ? "radio" : "checkbox"}
            name={c.type === "RadioButton" ? "preview-radio" : c.name}
            defaultChecked={c.checked}
            disabled={!preview || !c.enabled}
            onChange={() => onEvent?.(c.eventCheckedChanged)}
          />
          {c.text}
        </label>
      );
    case "NumericUpDown":
      return (
        <input
          style={style}
          type="number"
          aria-label={c.accessibleName || c.name}
          min={c.minimum}
          max={c.maximum}
          defaultValue={c.value}
          readOnly={!preview}
          disabled={!preview || !c.enabled}
        />
      );
    default:
      return (
        <button
          style={style}
          disabled={!preview || !c.enabled}
          onClick={() => onEvent?.(c.eventClick)}
        >
          {c.text}
        </button>
      );
  }
}
export default function FormDesigner() {
  const [practicalCode, setPracticalCode] = useState(
      () =>
        readText("cq-practical-code") ||
        "private void btnRegister_Click(object sender, EventArgs e) {\n    // Validate the form here\n}",
    ),
    [items, setItems] = useState<Control[]>(initialControls),
    [selected, setSelected] = useState(""),
    [preview, setPreview] = useState(false),
    [showCode, setShowCode] = useState(false),
    [workspace, setWorkspace] = useState<"design" | "code">("design"),
    [message, setMessage] = useState(""),
    [undo, setUndo] = useState<Control[][]>([]),
    [redo, setRedo] = useState<Control[][]>([]);
  const drag = useRef<{
    id: string;
    x: number;
    y: number;
    startX: number;
    startY: number;
    before: Control[];
  } | null>(null);
  const cur = items.find((c) => c.id === selected);
  const validation = validateForm(items);
  useEffect(() => {
    try {
      localStorage.setItem("cq-practical-code", practicalCode);
    } catch {}
  }, [practicalCode]);
  useEffect(() => {
    try {
      localStorage.setItem("cq-form", JSON.stringify(items));
    } catch {
      setMessage("Storage is full or blocked. Export your project to keep it.");
    }
  }, [items]);
  function commit(next: Control[]) {
    setUndo((u) => [...u, items].slice(-50));
    setRedo([]);
    setItems(next);
    setMessage("");
  }
  function change(patch: Partial<Control>) {
    if (cur) commit(updateControl(items, cur.id, patch));
  }
  function restore(direction: "undo" | "redo") {
    const source = direction === "undo" ? undo : redo;
    if (!source.length) return;
    const next = source[source.length - 1];
    if (direction === "undo") {
      setUndo(source.slice(0, -1));
      setRedo((r) => [...r, items]);
    } else {
      setRedo(source.slice(0, -1));
      setUndo((u) => [...u, items]);
    }
    setItems(next);
  }
  function exportProject() {
    try {
      if (!items.length) {
        setMessage("Add a control before exporting your project.");
        return;
      }
      download(
        "CodeQuestForms.zip",
        projectZip(items, {
          handlerCode: practicalCode,
        }) as unknown as BlobPart,
        "application/zip",
      );
      setMessage(
        "Project exported. Open the .sln in Visual Studio on Windows.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export failed.");
    }
  }
  function defaultEvent(c: Control) {
    if (c.type === "Button") return ["eventClick", c.name + "_Click"] as const;
    if (c.type === "TextBox")
      return ["eventTextChanged", c.name + "_TextChanged"] as const;
    if (["ComboBox", "ListBox"].includes(c.type))
      return [
        "eventSelectedIndexChanged",
        c.name + "_SelectedIndexChanged",
      ] as const;
    if (["CheckBox", "RadioButton"].includes(c.type))
      return ["eventCheckedChanged", c.name + "_CheckedChanged"] as const;
    return null;
  }
  function openHandler(name: string) {
    if (!/^[A-Za-z_]\w*$/.test(name)) {
      setMessage("Use a valid C# handler name first.");
      return;
    }
    const declared = new Set(
      [
        ...reviewSource(practicalCode).matchAll(
          /\bvoid\s+([A-Za-z_]\w*)\s*\(/g,
        ),
      ].map((match) => match[1]),
    );
    if (!declared.has(name))
      setPracticalCode(
        (code) =>
          `${code.trim()}\n\nprivate void ${name}(object sender, EventArgs e)\n{\n    // Add your event logic here.\n}\n`,
      );
    setWorkspace("code");
    setPreview(false);
    setMessage(
      `Opened ${name} in Form1.cs. Your code is included in the Windows export.`,
    );
  }
  function createDefaultHandler(c: Control) {
    const pair = defaultEvent(c);
    if (!pair) {
      setMessage("This control has no default event in the simulator yet.");
      return;
    }
    const [key, name] = pair;
    commit(updateControl(items, c.id, { [key]: c[key] || name }));
    setSelected(c.id);
    openHandler(c[key] || name);
  }
  function event(name: string) {
    setMessage(
      name
        ? `Event wired to ${name}. Add the C# handler logic in the exported Form1.cs.`
        : "No handler is wired to this event.",
    );
  }
  const practical = readBrief();
  return (
    <section className="page designer-page">
      {practical && (
        <div className="form-validation">
          <CheckCircle2 size={17} />
          <div>
            <b>Active practical: {practical.title}</b>
            <p>{practical.requirements.join(" · ")}</p>
          </div>
        </div>
      )}
      <div className="page-heading">
        <div>
          <p className="eyebrow">JOHANNESBURG / MAKERS YARD</p>
          <h1>Make something useful.</h1>
          <p>
            Place controls. Give them purpose. Take your form into Visual
            Studio.
          </p>
        </div>
        <button className="primary" onClick={exportProject}>
          <Download size={17} /> Export Windows project
        </button>
      </div>
      <div className="designer-toolbar">
        <div className="button-row">
          <button
            disabled={!undo.length}
            onClick={() => restore("undo")}
            aria-label="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button
            disabled={!redo.length}
            onClick={() => restore("redo")}
            aria-label="Redo"
          >
            <Redo2 size={16} />
          </button>
          <button
            className={preview ? "selected-button" : ""}
            aria-pressed={preview}
            onClick={() => {
              setWorkspace("design");
              setPreview(!preview);
            }}
          >
            {preview ? <MousePointer2 size={16} /> : <Play size={16} />}{" "}
            {preview ? "Stop debugging" : "Start / F5"}
          </button>
          <button
            aria-pressed={showCode}
            onClick={() => {
              setWorkspace("design");
              setShowCode(!showCode);
            }}
          >
            <Code2 size={16} /> Designer.cs
          </button>
        </div>
        <span className="muted">
          {items.length} controls · saved on this device
        </span>
      </div>
      <div className="workspace-tabs" aria-label="WinForms workspace files">
        <button
          aria-pressed={workspace === "design"}
          onClick={() => setWorkspace("design")}
        >
          Form1.cs [Design]
        </button>
        <button
          aria-pressed={workspace === "code"}
          onClick={() => setWorkspace("code")}
        >
          Form1.cs
        </button>
        <span>CodeQuestForms · .NET 8 / Windows</span>
      </div>
      <div className="designer-grid">
        <aside className="toolbox">
          <h2>Toolbox</h2>
          <p className="muted">Drag onto the form or double-click to add</p>
          {toolbox.map((type) => (
            <button
              key={type}
              disabled={preview || items.length >= 100}
              draggable={!preview}
              onDragStart={(e) => e.dataTransfer.setData("application/x-codequest-control", type)}
              onDoubleClick={() => {
                const next = addControl(items, type);
                commit(next);
                setSelected(next[next.length - 1].id);
              }}
              onClick={() => {
                const next = addControl(items, type);
                commit(next);
                setSelected(next[next.length - 1].id);
              }}
            >
              <Plus size={14} />
              {type}
            </button>
          ))}
          <div className="tip">
            <b>Try this</b>
            <p>
              A student form needs a name, a student number, and a submit
              button. Use meaningful control names.
            </p>
          </div>
          <h2>Solution Explorer</h2>
          <p className="muted">CodeQuestForms.sln</p>
          <button onClick={() => setWorkspace("design")}>
            Form1.cs [Design]
          </button>
          <button onClick={() => setWorkspace("code")}>Form1.cs</button>
          <button
            onClick={() => {
              setWorkspace("design");
              setShowCode(true);
            }}
          >
            Form1.Designer.cs
          </button>
        </aside>
        <div className="canvas-column">
          {workspace === "code" ? (
            <section className="form-code-workspace">
              <div className="canvas-caption">
                <span>Form1.cs · event handlers</span>
                <span>C#</span>
              </div>
              <p className="muted">
                These methods go inside the exported Form1 class. Controls and
                InitializeComponent are generated in Form1.Designer.cs. Use the
                Design tab to edit the form.
              </p>
              <CodeEditor
                value={practicalCode}
                onChange={setPracticalCode}
                label="Form1.cs event code"
              />
              <p className="muted">
                Build and run this Windows project in Visual Studio to verify
                native event behaviour. Browser Preview tests control
                interaction and wiring.
              </p>
            </section>
          ) : (
            <>
              <div className="canvas-caption">
                <span>Form1.cs [{preview ? "Preview" : "Design"}]</span>
                <span>640 × 420</span>
              </div>
              <label className="selection-label">
                Selected control
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  aria-label="Selected control"
                >
                  <option value="">Choose a control</option>
                  {items.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                      {!c.visible ? " (hidden)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div
                className="canvas-scroll"
                tabIndex={0}
                aria-label="Scrollable form canvas"
              >
                <div className="form-title">
                  My CodeQuest Form <span>─　□　×</span>
                </div>
                <div
                  className="form-canvas"
                  aria-label="Form design canvas"
                  onDragOver={(e) => { if (!preview) e.preventDefault(); }}
                  onDrop={(e) => {
                    if (preview || items.length >= 100) return;
                    e.preventDefault();
                    const type = e.dataTransfer.getData("application/x-codequest-control");
                    if (!toolbox.includes(type)) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const next = addControl(items, type);
                    const added = next[next.length - 1];
                    const x = Math.max(0, Math.min(560, Math.round((e.clientX - rect.left) / 8) * 8));
                    const y = Math.max(0, Math.min(360, Math.round((e.clientY - rect.top) / 8) * 8));
                    const positioned = updateControl(next, added.id, { x, y });
                    commit(positioned);
                    setSelected(added.id);
                    setMessage(`${type} added at ${x}, ${y}. Visual Studio-style 8 px grid snap applied.`);
                  }}
                >
                  {items.length === 0 && (
                    <div className="canvas-empty">
                      <MousePointer2 size={28} />
                      <b>Your idea starts here</b>
                      <p>Add a TextBox, Label or Button from the toolbox.</p>
                    </div>
                  )}
                  {items.map((c) => {
                    let layout: React.CSSProperties = {
                      left: c.x,
                      top: c.y,
                      width: c.width,
                      height: c.height,
                    };
                    if (preview) {
                      if (!c.visible) return null;
                      if (c.dock === "Fill") layout = { inset: 0 };
                      else if (c.dock === "Top")
                        layout = {
                          top: 0,
                          left: 0,
                          right: 0,
                          height: c.height,
                        };
                      else if (c.dock === "Bottom")
                        layout = {
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: c.height,
                        };
                      else if (c.dock === "Left")
                        layout = { top: 0, bottom: 0, left: 0, width: c.width };
                      else if (c.dock === "Right")
                        layout = {
                          top: 0,
                          bottom: 0,
                          right: 0,
                          width: c.width,
                        };
                    }
                    return (
                      <div
                        key={`${c.id}-${preview}`}
                        className={
                          "placed-control " +
                          (!preview && selected === c.id ? "is-selected" : "") +
                          (!c.visible ? " is-hidden" : "")
                        }
                        style={layout}
                        role={!preview ? "button" : undefined}
                        tabIndex={!preview ? 0 : undefined}
                        aria-label={!preview ? `Select ${c.name}` : undefined}
                        onClick={() => !preview && setSelected(c.id)}
                        onDoubleClick={() =>
                          !preview && createDefaultHandler(c)
                        }
                        onKeyDown={(e) => {
                          if (preview) return;
                          if (e.key === "F5") {
                            e.preventDefault();
                            setPreview(true);
                            setMessage("Running Form1 — press Stop debugging to return to the designer.");
                            return;
                          }
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelected(c.id);
                          }
                          if (
                            [
                              "ArrowLeft",
                              "ArrowRight",
                              "ArrowUp",
                              "ArrowDown",
                            ].includes(e.key)
                          ) {
                            e.preventDefault();
                            commit(
                              updateControl(items, c.id, {
                                x:
                                  c.x +
                                  (e.key === "ArrowRight"
                                    ? e.ctrlKey ? 1 : 8
                                    : e.key === "ArrowLeft"
                                      ? e.ctrlKey ? -1 : -8
                                      : 0),
                                y:
                                  c.y +
                                  (e.key === "ArrowDown"
                                    ? e.ctrlKey ? 1 : 8
                                    : e.key === "ArrowUp"
                                      ? e.ctrlKey ? -1 : -8
                                      : 0),
                              }),
                            );
                          }
                        }}
                        onPointerDown={(e) => {
                          if (preview) return;
                          e.preventDefault();
                          setSelected(c.id);
                          e.currentTarget.setPointerCapture(e.pointerId);
                          drag.current = {
                            id: c.id,
                            x: c.x,
                            y: c.y,
                            startX: e.clientX,
                            startY: e.clientY,
                            before: items,
                          };
                        }}
                        onPointerMove={(e) => {
                          const d = drag.current;
                          if (!d || d.id !== c.id) return;
                          setItems(
                            updateControl(d.before, c.id, {
                              x: Math.min(
                                640 - c.width,
                                Math.max(0, d.x + e.clientX - d.startX),
                              ),
                              y: Math.min(
                                420 - c.height,
                                Math.max(0, d.y + e.clientY - d.startY),
                              ),
                            }),
                          );
                        }}
                        onPointerUp={() => {
                          if (drag.current) {
                            setUndo((u) =>
                              [...u, drag.current!.before].slice(-50),
                            );
                            setRedo([]);
                            drag.current = null;
                          }
                        }}
                        onPointerCancel={() => {
                          drag.current = null;
                        }}
                      >
                        <div
                          className={preview ? "" : "design-surface"}
                          aria-hidden={!preview}
                        >
                          <ControlView
                            c={c}
                            preview={preview}
                            onEvent={event}
                          />
                        </div>
                        {!preview && selected === c.id && (
                          <>
                            <span className="control-tag">{c.name}</span>
                            <button
                              type="button"
                              className="resize-handle"
                              aria-label={"Resize " + c.name}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const startX = e.clientX,
                                  startY = e.clientY,
                                  startW = c.width,
                                  startH = c.height,
                                  before = items;
                                (
                                  e.currentTarget as HTMLElement
                                ).setPointerCapture(e.pointerId);
                                const move = (ev: PointerEvent) =>
                                  setItems(
                                    updateControl(before, c.id, {
                                      width: Math.min(
                                        640 - c.x,
                                        Math.max(
                                          24,
                                          startW + ev.clientX - startX,
                                        ),
                                      ),
                                      height: Math.min(
                                        420 - c.y,
                                        Math.max(
                                          20,
                                          startH + ev.clientY - startY,
                                        ),
                                      ),
                                    }),
                                  );
                                const up = () => {
                                  window.removeEventListener(
                                    "pointermove",
                                    move,
                                  );
                                  window.removeEventListener("pointerup", up);
                                  setUndo((u) => [...u, before].slice(-50));
                                  setRedo([]);
                                };
                                window.addEventListener("pointermove", move);
                                window.addEventListener("pointerup", up, {
                                  once: true,
                                });
                              }}
                            >
                              ↘
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="muted canvas-note">
                Design: drag controls, use arrow keys, resize the selected
                control, or double-click a control to create its default event.
                Preview: try text fields and selections. C# event logic runs in
                the exported Windows project.
              </p>
              {showCode && (
                <pre
                  className="code-preview"
                  aria-label="Generated designer code"
                >
                  {designerCode(items) || "// Add a control to generate C#."}
                </pre>
              )}
            </>
          )}
        </div>
        <aside className="properties-panel">
          <h2>
            Properties <span>⚡</span>
          </h2>
          {cur ? (
            <>
              <p className="muted">
                {cur.type} / {cur.name}
              </p>
              <Field title="Design">
                <label>
                  (Name)
                  <input
                    aria-label="Control Name"
                    value={cur.name}
                    onChange={(e) => change({ name: e.target.value })}
                  />
                </label>
                <label>
                  AccessibleName
                  <input
                    value={cur.accessibleName}
                    onChange={(e) => change({ accessibleName: e.target.value })}
                  />
                </label>
              </Field>
              <Field title="Appearance">
                <label>
                  Text
                  <input
                    aria-label="Control Text"
                    value={cur.text}
                    onChange={(e) => change({ text: e.target.value })}
                  />
                </label>
                <label>
                  Font
                  <input
                    value={cur.font}
                    onChange={(e) => change({ font: e.target.value })}
                  />
                </label>
                <div className="two-fields">
                  <label>
                    ForeColor
                    <input
                      type="color"
                      value={cur.foreColor}
                      onChange={(e) => change({ foreColor: e.target.value })}
                    />
                  </label>
                  <label>
                    BackColor
                    <input
                      type="color"
                      value={cur.backColor}
                      onChange={(e) => change({ backColor: e.target.value })}
                    />
                  </label>
                </div>
              </Field>
              <Field title="Layout">
                <div className="two-fields">
                  {(["x", "y", "width", "height", "tabIndex"] as const).map(
                    (key) => (
                      <label key={key}>
                        {key}
                        <input
                          aria-label={`Control ${key}`}
                          type="number"
                          min={0}
                          value={cur[key]}
                          onChange={(e) =>
                            change({ [key]: Number(e.target.value) })
                          }
                        />
                      </label>
                    ),
                  )}
                </div>
                <label>
                  Anchor
                  <select
                    value={cur.anchor}
                    onChange={(e) => change({ anchor: e.target.value })}
                  >
                    {[
                      "Top, Left",
                      "Top, Right",
                      "Bottom, Left",
                      "Bottom, Right",
                      "Top, Bottom, Left, Right",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Dock
                  <select
                    value={cur.dock}
                    onChange={(e) => change({ dock: e.target.value })}
                  >
                    {["None", "Top", "Bottom", "Left", "Right", "Fill"].map(
                      (x) => (
                        <option key={x}>{x}</option>
                      ),
                    )}
                  </select>
                </label>
              </Field>
              <Field title="Behavior">
                {(["enabled", "visible"] as const).map((key) => (
                  <label className="check-label" key={key}>
                    <input
                      type="checkbox"
                      checked={cur[key]}
                      onChange={(e) => change({ [key]: e.target.checked })}
                    />
                    {key}
                  </label>
                ))}
                {["CheckBox", "RadioButton"].includes(cur.type) && (
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={cur.checked}
                      onChange={(e) => change({ checked: e.target.checked })}
                    />
                    Checked
                  </label>
                )}
                {cur.type === "TextBox" && (
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={cur.password}
                      onChange={(e) => change({ password: e.target.checked })}
                    />
                    UseSystemPasswordChar
                  </label>
                )}
                {["ComboBox", "ListBox"].includes(cur.type) && (
                  <label>
                    Items (one per line)
                    <textarea
                      aria-label="Control Items"
                      value={cur.items}
                      onChange={(e) => change({ items: e.target.value })}
                    />
                  </label>
                )}
                {cur.type === "NumericUpDown" &&
                  (["minimum", "maximum", "value"] as const).map((key) => (
                    <label key={key}>
                      {key}
                      <input
                        type="number"
                        value={cur[key]}
                        onChange={(e) =>
                          change({ [key]: Number(e.target.value) })
                        }
                      />
                    </label>
                  ))}
              </Field>
              <Field title="Events">
                {defaultEvent(cur) && (
                  <button
                    type="button"
                    onClick={() => createDefaultHandler(cur)}
                  >
                    Open default event code
                  </button>
                )}
                <label>
                  Click
                  <input
                    aria-label="Click handler"
                    placeholder="btnSubmit_Click"
                    value={cur.eventClick}
                    onChange={(e) => change({ eventClick: e.target.value })}
                  />
                </label>
                <label>
                  TextChanged
                  <input
                    aria-label="TextChanged handler"
                    value={cur.eventTextChanged}
                    onChange={(e) =>
                      change({ eventTextChanged: e.target.value })
                    }
                  />
                </label>
                {["ComboBox", "ListBox"].includes(cur.type) && (
                  <label>
                    SelectedIndexChanged
                    <input
                      aria-label="SelectedIndexChanged handler"
                      value={cur.eventSelectedIndexChanged}
                      onChange={(e) =>
                        change({ eventSelectedIndexChanged: e.target.value })
                      }
                    />
                  </label>
                )}
                {["CheckBox", "RadioButton"].includes(cur.type) && (
                  <label>
                    CheckedChanged
                    <input
                      aria-label="CheckedChanged handler"
                      value={cur.eventCheckedChanged}
                      onChange={(e) =>
                        change({ eventCheckedChanged: e.target.value })
                      }
                    />
                  </label>
                )}
              </Field>
              <button
                className="danger"
                onClick={() => {
                  commit(removeControl(items, cur.id));
                  setSelected("");
                }}
              >
                <Trash2 size={15} /> Remove control
              </button>
            </>
          ) : (
            <p className="muted">Select a control to edit its properties.</p>
          )}
        </aside>
      </div>
      {practical && (
        <div className="question-analyser">
          <h2>Practical C#</h2>
          <p>
            Write the event-handler logic for this practical. Your code is saved
            on this device, included in the Windows export, and reviewed
            alongside the form. Build it in Visual Studio to verify compilation
            and behaviour.
          </p>
          <textarea
            aria-label="Practical C# code"
            value={practicalCode}
            onChange={(e) => setPracticalCode(e.target.value)}
            maxLength={50000}
          />
          <div className="button-row">
            <button onClick={() => setShowCode(true)}>
              <Code2 size={16} />
              View generated Designer.cs
            </button>
            <button
              className="primary"
              onClick={() => {
                if (!writeText("cq-practical-code", practicalCode)) {
                  setMessage(
                    "Storage is blocked. Copy your code before opening Assessment.",
                  );
                  return;
                }
                location.hash = "assessment";
              }}
            >
              Submit practical for marking
            </button>
          </div>
        </div>
      )}
      <div
        className={"form-validation " + (validation.ok ? "valid" : "")}
        role="status"
      >
        <CheckCircle2 size={17} />
        {message ||
          (!items.length
            ? "Add controls to begin."
            : validation.ok
              ? "Properties and handlers are valid. Ready to export."
              : validation.issues.join(" "))}
      </div>
      <details
        className="designer-error-list"
        open={!validation.ok && items.length > 0}
      >
        <summary>Error List · {validation.issues.length} design issues</summary>
        {validation.issues.length ? (
          <ul>
            {validation.issues.map((issue: string, index: number) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        ) : (
          <p>
            No design validation issues. Native compilation is checked when
            building the exported solution.
          </p>
        )}
      </details>
    </section>
  );
}
function Field({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}
