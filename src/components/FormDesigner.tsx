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
    if (!writeText("cq-practical-code", practicalCode))
      setMessage("Storage is full or blocked. Export your project to keep it.");
  }, [practicalCode]);
  useEffect(() => {
    if (!writeText("cq-form", JSON.stringify(items))) {
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
          handlerCode: readBrief() ? practicalCode : "",
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
            onClick={() => setPreview(!preview)}
          >
            {preview ? <MousePointer2 size={16} /> : <Play size={16} />}{" "}
            {preview ? "Back to design" : "Preview form"}
          </button>
          <button
            aria-pressed={showCode}
            onClick={() => setShowCode(!showCode)}
          >
            <Code2 size={16} /> Designer.cs
          </button>
        </div>
        <span className="muted">
          {items.length} controls · saved on this device
        </span>
      </div>
      <div className="designer-grid">
        <aside className="toolbox">
          <h2>Toolbox</h2>
          <p className="muted">Click to add a control</p>
          {toolbox.map((type) => (
            <button
              key={type}
              disabled={preview || items.length >= 100}
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
        </aside>
        <div className="canvas-column">
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
            <div className="form-canvas" aria-label="Form design canvas">
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
                    layout = { top: 0, left: 0, right: 0, height: c.height };
                  else if (c.dock === "Bottom")
                    layout = { bottom: 0, left: 0, right: 0, height: c.height };
                  else if (c.dock === "Left")
                    layout = { top: 0, bottom: 0, left: 0, width: c.width };
                  else if (c.dock === "Right")
                    layout = { top: 0, bottom: 0, right: 0, width: c.width };
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
                    onKeyDown={(e) => {
                      if (preview) return;
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
                                ? 5
                                : e.key === "ArrowLeft"
                                  ? -5
                                  : 0),
                            y:
                              c.y +
                              (e.key === "ArrowDown"
                                ? 5
                                : e.key === "ArrowUp"
                                  ? -5
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
                        setUndo((u) => [...u, drag.current!.before].slice(-50));
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
                      <ControlView c={c} preview={preview} onEvent={event} />
                    </div>
                    {!preview && selected === c.id && (
                      <span className="control-tag">{c.name}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <p className="muted canvas-note">
            Design: drag controls or use arrow keys. Preview: try text fields
            and selections. C# event logic runs in the exported Windows project.
          </p>
          {showCode && (
            <pre className="code-preview" aria-label="Generated designer code">
              {designerCode(items) || "// Add a control to generate C#."}
            </pre>
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
