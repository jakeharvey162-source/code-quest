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
import SystemWorkshop from "./SystemWorkshop";
import ProjectReader from "./ProjectReader";
import { runCSharp, cancelRun } from "../lib/compiler";
import { formEventSource, parseFormOutput } from "../lib/form-runtime.mjs";
import type { CoachRequest } from "../lib/coach-actions";
import { observeWorkspace } from "../lib/workspace-observation";
import type { Settings } from "../lib/progress";
import { gridColumns, gridRows } from "../lib/grid-data.mjs";
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
  selectedIndex?: number;
  columns: string;
  gridRows: string;
  readOnly: boolean;
  multiline: boolean;
  eventSelectionChanged: string;
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
          "columns",
          "eventSelectionChanged",
        ].every((k) => typeof c[k] === "string" && c[k].length < 10000) &&
        typeof c.gridRows === "string" &&
        c.gridRows.length <= 850000 &&
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
        [
          "enabled",
          "visible",
          "checked",
          "password",
          "readOnly",
          "multiline",
        ].every((k) => typeof c[k] === "boolean") &&
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
      ? {
          columns: "Column1|Column 1\nColumn2|Column 2",
          gridRows: "[]",
          readOnly: true,
          multiline: false,
          eventSelectionChanged: "",
          eventSelectedIndexChanged: "",
          eventCheckedChanged: "",
          ...c,
        }
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
  onValue,
}: {
  c: Control;
  preview?: boolean;
  onEvent?: (name: string) => void;
  onValue?: (patch: Partial<Control>) => void;
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
    case "DataGridView": {
      const columns = gridColumns(c.columns),
        rows = gridRows(c.gridRows);
      return (
        <div className="data-grid" style={{ ...style, overflow: "auto" }}>
          <table aria-label={c.accessibleName || c.name}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.name} scope="col">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className={c.selectedIndex === index ? "grid-selected" : ""}
                >
                  {columns.map((col, j) => (
                    <td key={col.name}>
                      {preview && !c.readOnly ? (
                        <input
                          aria-label={`${c.name} row ${index + 1} ${col.header}`}
                          value={row[j] || ""}
                          disabled={!c.enabled}
                          onFocus={() => {
                            onValue?.({ selectedIndex: index });
                            if (
                              c.eventSelectionChanged &&
                              c.selectedIndex !== index
                            )
                              onEvent?.(c.eventSelectionChanged);
                          }}
                          onChange={(e) => {
                            const next = rows.map((r) => [...r]);
                            next[index][j] = e.target.value.slice(0, 500);
                            onValue?.({ gridRows: JSON.stringify(next) });
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          disabled={!preview || !c.enabled}
                          aria-label={`Select ${c.name} row ${index + 1} ${col.header}`}
                          onClick={() => {
                            onValue?.({ selectedIndex: index });
                            if (
                              c.eventSelectionChanged &&
                              c.selectedIndex !== index
                            )
                              onEvent?.(c.eventSelectionChanged);
                          }}
                        >
                          {row[j] || " "}
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <small>No rows · use Rows.Add in your C# event</small>
          )}
        </div>
      );
    }
    case "ProgressBar":
      return (
        <progress
          aria-label={c.accessibleName || c.name}
          max={Math.max(1, c.maximum - c.minimum)}
          value={c.value - c.minimum}
          style={style}
        />
      );
    case "RichTextBox":
    case "TextBox":
      if (c.type === "RichTextBox" || c.multiline)
        return (
          <textarea
            aria-label={c.accessibleName || c.name}
            value={c.text}
            readOnly={!preview}
            disabled={!preview || !c.enabled}
            style={style}
            tabIndex={preview ? 0 : -1}
            onChange={(e) => {
              onValue?.({ text: e.target.value });
              if (c.eventTextChanged) onEvent?.(c.eventTextChanged);
            }}
          />
        );
      return (
        <input
          style={style}
          aria-label={c.accessibleName || c.name}
          tabIndex={preview ? 0 : -1}
          type={c.password ? "password" : "text"}
          value={c.text === "TextBox" ? "" : c.text}
          readOnly={!preview}
          disabled={!preview || !c.enabled}
          onChange={(event) => {
            onValue?.({ text: event.target.value });
            if (c.eventTextChanged) onEvent?.(c.eventTextChanged);
          }}
        />
      );
    case "Label":
      return <span style={style}>{c.text}</span>;
    case "ComboBox":
      return (
        <select
          style={style}
          aria-label={c.accessibleName || c.name}
          tabIndex={preview ? 0 : -1}
          disabled={!preview || !c.enabled}
          value={opts[c.selectedIndex ?? 0] ?? ""}
          onChange={(event) => {
            onValue?.({ selectedIndex: event.target.selectedIndex });
            if (c.eventSelectedIndexChanged)
              onEvent?.(c.eventSelectedIndexChanged);
          }}
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
          tabIndex={preview ? 0 : -1}
          disabled={!preview || !c.enabled}
          value={opts[c.selectedIndex ?? 0] ?? ""}
          onChange={(event) => {
            onValue?.({ selectedIndex: event.target.selectedIndex });
            if (c.eventSelectedIndexChanged)
              onEvent?.(c.eventSelectedIndexChanged);
          }}
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
            tabIndex={preview ? 0 : -1}
            name={c.type === "RadioButton" ? "preview-radio" : c.name}
            checked={c.checked}
            disabled={!preview || !c.enabled}
            onChange={(event) => {
              onValue?.({ checked: event.target.checked });
              if (c.eventCheckedChanged) onEvent?.(c.eventCheckedChanged);
            }}
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
          tabIndex={preview ? 0 : -1}
          min={c.minimum}
          max={c.maximum}
          value={c.value}
          readOnly={!preview}
          disabled={!preview || !c.enabled}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (event.target.value && Number.isFinite(value))
              onValue?.({
                value: Math.min(c.maximum, Math.max(c.minimum, value)),
              });
          }}
        />
      );
    default:
      return (
        <button
          style={style}
          tabIndex={preview ? 0 : -1}
          disabled={!preview || !c.enabled}
          onClick={() => onEvent?.(c.eventClick)}
        >
          {c.text}
        </button>
      );
  }
}
export default function FormDesigner({ settings }: { settings: Settings }) {
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
    [runtimeItems, setRuntimeItems] = useState<Control[]>([]),
    [eventBusy, setEventBusy] = useState(false),
    [grading, setGrading] = useState(false),
    [undo, setUndo] = useState<Control[][]>([]),
    [redo, setRedo] = useState<Control[][]>([]);
  const [runPosition, setRunPosition] = useState({ x: 24, y: 80 });
  const [messageBoxes, setMessageBoxes] = useState<string[]>([]);
  const runWindow = useRef<HTMLDivElement>(null);
  const runDrag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const fieldsState = useRef<Record<string, { type: string; value: string }>>(
    {},
  );
  const runtimeRef = useRef<Control[]>([]);
  const eventGeneration = useRef(0);
  useEffect(() => {
    eventGeneration.current++;
    if (!preview) {
      cancelRun();
      setEventBusy(false);
      setMessageBoxes([]);
      return;
    }
    const previous = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => runWindow.current?.focus());
    fieldsState.current = {};
    const snapshot = items.map((c) => ({
      ...c,
      text: c.type === "TextBox" && c.text === "TextBox" ? "" : c.text,
      selectedIndex: c.items ? 0 : -1,
    }));
    runtimeRef.current = snapshot;
    setRuntimeItems(snapshot);
    return () => {
      eventGeneration.current++;
      cancelRun();
      if (previous?.isConnected && previous !== document.body) previous.focus();
      else
        (
          formCanvas.current?.closest(".designer-page") as HTMLElement | null
        )?.focus();
    };
  }, [preview]);
  useEffect(() => {
    if (!preview) return;
    const stop = (event: KeyboardEvent) => {
      if (!event.defaultPrevented && event.key === "F5" && event.shiftKey) {
        event.preventDefault();
        setPreview(false);
        setMessage("Stopped Form1 — back in the designer.");
      }
    };
    window.addEventListener("keydown", stop);
    return () => window.removeEventListener("keydown", stop);
  }, [preview]);
  const drag = useRef<{
    id: string;
    x: number;
    y: number;
    startX: number;
    startY: number;
    before: Control[];
  } | null>(null);
  const formCanvas = useRef<HTMLDivElement>(null);
  const toolboxDrag = useRef<{ type: string; x: number; y: number } | null>(
    null,
  );
  const ignoreToolboxClick = useRef(false);
  const [armedTool, setArmedTool] = useState("");
  function placeTool(type: string, x?: number, y?: number) {
    if (preview || items.length >= 100) return;
    const next = addControl(items, type);
    const added = next[next.length - 1];
    const placed =
      x === undefined
        ? next
        : updateControl(next, added.id, {
            x: Math.max(0, Math.min(640 - added.width, Math.round(x / 8) * 8)),
            y: Math.max(
              0,
              Math.min(420 - added.height, Math.round((y || 0) / 8) * 8),
            ),
          });
    commit(placed);
    setSelected(added.id);
    setArmedTool("");
  }
  const cur = items.find((c) => c.id === selected);
  const validation = validateForm(items);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        observeWorkspace({
          page: "designer",
          mode: preview
            ? "Running Form1"
            : workspace === "code"
              ? "Editing C# handlers"
              : "Designing Form1",
          controls: items.length,
          selected: cur?.name || "",
          caption: cur?.type === "TextBox" ? "" : cur?.text || "",
          issues: validation.issues.slice(0, 3),
          output: message.slice(0, 800),
        }),
      500,
    );
    return () => clearTimeout(timer);
  }, [items, selected, preview, workspace, message]);
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
  useEffect(() => {
    const act = (event: Event) => {
      const { action, respond } = (event as CustomEvent<CoachRequest>).detail;
      const done = (text: string) => {
        setMessage(text);
        respond(text);
      };
      if (grading) {
        done("Stop system checks before changing or running the form.");
        return;
      }
      if (action.type === "review") {
        done(
          `${items.length} controls on your form. ${cur ? `Selected: ${cur.name}. Its visible Text is ${cur.text || "empty"}. ` : ""}${validation.ok ? "Your control properties and event wiring are valid." : validation.issues.slice(0, 3).join(" ")}`,
        );
        return;
      }
      if (action.type === "start" || action.type === "stop") {
        setWorkspace("design");
        setArmedTool("");
        setPreview(action.type === "start");
        done(
          action.type === "start"
            ? "Preview started. Try your inputs and click your Button to test its C# handler."
            : "Preview stopped. You're back in Design.",
        );
        return;
      }
      if (action.type === "click" || action.type === "input") {
        if (!preview) {
          done(
            "Start the form with F5 first, then ask me to operate its controls.",
          );
          return;
        }
        const target = runtimeRef.current.find(
          (c) => c.name.toLowerCase() === action.control?.toLowerCase(),
        );
        if (!target) {
          done(`I couldn't find ${action.control} in the running form.`);
          return;
        }
        if (eventBusy || messageBoxes.length) {
          done("Finish the current event or close the MessageBox first.");
          return;
        }
        if (!target.enabled || !target.visible) {
          done(
            `${target.name} is hidden or disabled, so it can't be operated.`,
          );
          return;
        }
        if (action.type === "input") {
          if (target.type !== "TextBox") {
            done("Ask me to type into a TextBox by its C# Name.");
            return;
          }
          if (target.password) {
            done("Enter password values yourself in the form.");
            return;
          }
          runtimeChange(target.id, {
            text: (action.value || "").slice(0, 250),
          });
          done(
            `Entered ${action.value} into ${target.name}. Your design is preserved.`,
          );
          if (target.eventTextChanged)
            void runFormEvent(target.eventTextChanged, target.id);
        } else {
          if (target.type !== "Button") {
            done("Ask me to click a Button by its C# Name.");
            return;
          }
          if (!target.eventClick) {
            done(
              `${target.name} has no Click handler. Stop the form and double-click the Button in Design to wire one.`,
            );
            return;
          }
          done(
            `Clicking ${target.name}. Its C# handler runs now; check Debug output for the result.`,
          );
          void runFormEvent(target.eventClick, target.id);
        }
        return;
      }
      if (preview) {
        done("Stop the preview first so I can edit the form.");
        return;
      }
      if (action.type === "undo" || action.type === "redo") {
        const available = action.type === "undo" ? undo : redo;
        if (!available.length) {
          done(`There's nothing to ${action.type}.`);
          return;
        }
        restore(action.type);
        done(
          `${action.type === "undo" ? "Undid" : "Restored"} your last change.`,
        );
        return;
      }
      if (
        action.type === "add" &&
        action.control &&
        toolbox.includes(action.control)
      ) {
        if (items.length >= 100) {
          done(
            "The form already has 100 controls. Remove one before adding another.",
          );
          return;
        }
        let next = addControl(items, action.control);
        const added = next[next.length - 1];
        if (action.value !== undefined)
          next = updateControl(next, added.id, {
            text: action.value.slice(0, 250),
          });
        commit(next);
        setSelected(added.id);
        setWorkspace("design");
        done(
          `Added ${added.name}${action.value ? ` with the caption ${action.value}` : ""}. You can drag it into position.`,
        );
        return;
      }
      if (action.type === "select") {
        const found = items.find(
          (c) => c.name.toLowerCase() === action.value?.toLowerCase(),
        );
        if (found) {
          setSelected(found.id);
          done(
            `Selected ${found.name}. Its visible Text is ${found.text || "empty"}.`,
          );
        } else
          done(
            `I couldn't find a control named ${action.value}. Check the Selected control list.`,
          );
        return;
      }
      if (!cur) {
        done(
          "Select a control on the form first, then tell me what to change.",
        );
        return;
      }
      if (action.type === "text") {
        change({ text: (action.value || "").slice(0, 250) });
        done(
          `Done. ${cur.name} now displays ${action.value}. Its C# Name stays ${cur.name}.`,
        );
      } else if (action.type === "name") {
        const next = updateControl(items, cur.id, { name: action.value || "" });
        const errors = validateForm(next).issues.filter((i: string) =>
          /control name|names must/i.test(i),
        );
        if (errors.length) {
          done(
            "That isn't a valid unique C# Name. Use something like lblStudentName. To change what the user sees, say set text to Student Name.",
          );
          return;
        }
        change({ name: action.value });
        done(
          `Renamed the C# identifier to ${action.value}. The visible caption stays ${cur.text}.`,
        );
      } else if (action.type === "move") {
        const distance = action.distance || 8;
        change({
          x: Math.max(
            0,
            Math.min(
              640 - cur.width,
              cur.x +
                (action.direction === "right"
                  ? distance
                  : action.direction === "left"
                    ? -distance
                    : 0),
            ),
          ),
          y: Math.max(
            0,
            Math.min(
              420 - cur.height,
              cur.y +
                (action.direction === "down"
                  ? distance
                  : action.direction === "up"
                    ? -distance
                    : 0),
            ),
          ),
        });
        done(
          `Moved ${cur.name} ${action.direction} by ${distance} pixels, within the form edges.`,
        );
      }
    };
    window.addEventListener("cq-coach-action", act);
    return () => window.removeEventListener("cq-coach-action", act);
  }, [
    items,
    selected,
    preview,
    undo,
    redo,
    eventBusy,
    grading,
    messageBoxes,
    practicalCode,
  ]);
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
    if (c.type === "DataGridView")
      return ["eventSelectionChanged", c.name + "_SelectionChanged"] as const;
    if (c.type === "Button") return ["eventClick", c.name + "_Click"] as const;
    if (["TextBox", "RichTextBox"].includes(c.type))
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
  function runtimeChange(id: string, patch: Partial<Control>) {
    let next: Control[] = updateControl(runtimeRef.current, id, patch);
    if (patch.checked && next.find((c) => c.id === id)?.type === "RadioButton")
      next = next.map((c) =>
        c.type === "RadioButton" && c.id !== id ? { ...c, checked: false } : c,
      );
    runtimeRef.current = next;
    setRuntimeItems(next);
  }
  async function runFormEvent(name: string, id: string) {
    if (!name) {
      setMessage("No handler is wired to this event.");
      return;
    }
    if (
      !new RegExp("\\bvoid\\s+" + name + "\\s*\\(").test(
        reviewSource(practicalCode),
      )
    ) {
      setMessage(
        `Event wired to ${name}. Double-click the control to create its C# handler in Form1.cs.`,
      );
      return;
    }
    if (eventBusy) return;
    const generation = eventGeneration.current;
    const focused = document.activeElement as HTMLElement | null;
    let restoreFocus = true;
    setEventBusy(true);
    try {
      const result = await runCSharp(
        formEventSource(
          runtimeRef.current,
          practicalCode,
          name,
          id,
          fieldsState.current,
        ),
        setMessage,
      );
      if (generation !== eventGeneration.current) return;
      if (!result.success) {
        setMessage(
          result.diagnostics.map((d) => `${d.id}: ${d.message}`).join("\n"),
        );
        return;
      }
      const next = parseFormOutput(result.stdOut || "", runtimeRef.current);
      restoreFocus = next.messages.length === 0;
      fieldsState.current = next.fields;
      runtimeRef.current = next.controls;
      setRuntimeItems(next.controls);
      setMessageBoxes(next.messages);
      setMessage(`${name} executed. ${next.messages.join(" · ")}`);
    } catch (error) {
      if (generation === eventGeneration.current)
        setMessage(error instanceof Error ? error.message : "Event failed.");
    } finally {
      if (generation === eventGeneration.current) {
        setEventBusy(false);
        if (restoreFocus)
          requestAnimationFrame(() => {
            if (focused?.isConnected) focused.focus();
          });
      }
    }
  }
  const practical = readBrief();
  return (
    <section
      className="page designer-page"
      tabIndex={-1}
      onKeyDownCapture={(event) => {
        if (grading) {
          if (event.key === "F5") {
            event.preventDefault();
            event.stopPropagation();
          }
          return;
        }
        const editable = (event.target as HTMLElement).closest(
          "input, textarea, select, [contenteditable=true]",
        );
        if (
          !preview &&
          !editable &&
          (event.ctrlKey || event.metaKey) &&
          ["z", "y"].includes(event.key.toLowerCase())
        ) {
          event.preventDefault();
          restore(
            event.key.toLowerCase() === "y" || event.shiftKey ? "redo" : "undo",
          );
        }
        if (!preview && !editable && event.key === "Delete" && selected) {
          event.preventDefault();
          commit(removeControl(items, selected));
          setSelected("");
        }
        if (event.key === "Escape") {
          if (preview) {
            setPreview(false);
            setMessage("Stopped Form1 — back in the designer.");
          } else {
            setArmedTool("");
            setMessage("Tool selection cancelled.");
          }
        }
        if (event.key === "F5") {
          event.preventDefault();
          event.stopPropagation();
          setWorkspace("design");
          setPreview(!event.shiftKey);
          setMessage(
            event.shiftKey
              ? "Stopped Form1 — back in the designer."
              : "Running Form1 — common handlers run here; other C# event logic runs in the exported Windows project.",
          );
        }
      }}
    >
      <SystemWorkshop
        onBusy={setGrading}
        controls={items}
        code={practicalCode}
        disabled={preview || eventBusy}
        onLoad={(project, worked) => {
          writeText(
            "cq-previous-system",
            JSON.stringify({
              controls: items,
              code: practicalCode,
              brief: readText("cq-practical-brief", ""),
            }),
          );
          commit(project.template.map((c: Control) => ({ ...c })));
          setPracticalCode(worked ? project.solution : project.starter);
          setSelected("");
          setWorkspace("design");
          writeText("cq-practical-brief", JSON.stringify({ id: project.id }));
          setMessage(
            `${project.title} loaded. ${worked ? "Worked example: run it, change the inputs and inspect the C#." : "Starter: write the empty event handlers, then grade your system."} Your previous work is saved for recovery.`,
          );
        }}
      />
      <details className="previous-system">
        <summary>Recover previous system</summary>
        <button
          disabled={preview || grading}
          onClick={() => {
            try {
              const previous = JSON.parse(
                readText("cq-previous-system", "null"),
              );
              const recovered = normalizeControls(previous?.controls);
              if (!recovered || typeof previous.code !== "string") {
                setMessage("No previous system is saved yet.");
                return;
              }
              commit(recovered);
              setPracticalCode(previous.code);
              if (typeof previous.brief === "string")
                writeText("cq-practical-brief", previous.brief);
              setSelected("");
              setMessage("Previous system restored.");
            } catch {
              setMessage("The previous system couldn't be restored.");
            }
          }}
        >
          Restore previous design and code
        </button>
      </details>
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
      <div inert={grading}>
        <ProjectReader
          settings={settings}
          onOpenCode={(text) => {
            if (/\b(namespace|class)\s/.test(reviewSource(text))) {
              setMessage(
                "This is a complete C# file. Read it in the project viewer; copy event methods into Form1.cs, or restore codequest-form.json from a CodeQuest export.",
              );
              return;
            }
            setPracticalCode(text);
            setWorkspace("code");
            setPreview(false);
          }}
          onRestoreForm={(text) => {
            try {
              const project = JSON.parse(text);
              const controls = normalizeControls(project.controls);
              if (
                project.version !== 1 ||
                !controls ||
                typeof project.handlerCode !== "string" ||
                project.handlerCode.length > 200000
              )
                throw new Error(
                  "This file is not a valid CodeQuest form project.",
                );
              commit(controls);
              setPracticalCode(project.handlerCode);
              setSelected("");
              setPreview(false);
              setWorkspace("design");
              setMessage(
                "Form and event code restored. Undo restores your previous controls.",
              );
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Could not restore this form.",
              );
            }
          }}
        />
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
              className={preview ? "selected-button runtime-stop" : ""}
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
            <p className="muted">
              Select then click the form · drag or double-click to add
            </p>
            {toolbox.map((type) => (
              <button
                key={type}
                aria-pressed={armedTool === type}
                disabled={preview || items.length >= 100}
                style={{ touchAction: "none" }}
                onPointerDown={(event) => {
                  if (preview || event.button !== 0) return;
                  ignoreToolboxClick.current = false;
                  toolboxDrag.current = {
                    type,
                    x: event.clientX,
                    y: event.clientY,
                  };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerCancel={() => {
                  toolboxDrag.current = null;
                }}
                onPointerUp={(event) => {
                  const start = toolboxDrag.current;
                  toolboxDrag.current = null;
                  if (!start || preview || items.length >= 100) return;
                  if (
                    Math.hypot(
                      event.clientX - start.x,
                      event.clientY - start.y,
                    ) < 5
                  )
                    return;
                  ignoreToolboxClick.current = true;
                  const rect = formCanvas.current?.getBoundingClientRect();
                  if (
                    !rect ||
                    event.clientX < rect.left ||
                    event.clientX > rect.right ||
                    event.clientY < rect.top ||
                    event.clientY > rect.bottom
                  )
                    return;
                  const next = addControl(items, start.type);
                  const added = next[next.length - 1];
                  const x = Math.max(
                    0,
                    Math.min(
                      640 - added.width,
                      Math.round(
                        (event.clientX -
                          rect.left -
                          (formCanvas.current?.clientLeft || 0)) /
                          8,
                      ) * 8,
                    ),
                  );
                  const y = Math.max(
                    0,
                    Math.min(
                      420 - added.height,
                      Math.round(
                        (event.clientY -
                          rect.top -
                          (formCanvas.current?.clientTop || 0)) /
                          8,
                      ) * 8,
                    ),
                  );
                  commit(updateControl(next, added.id, { x, y }));
                  setSelected(added.id);
                  setArmedTool("");
                  setMessage(
                    `${start.type} added at ${x}, ${y}. Visual Studio-style 8 px grid snap applied.`,
                  );
                }}
                onClick={(event) => {
                  if (event.detail > 0 && ignoreToolboxClick.current) return;
                  if (event.detail === 0) placeTool(type);
                  else {
                    setArmedTool(type);
                    setMessage(
                      `${type} selected. Click the form to place it; Escape cancels.`,
                    );
                  }
                }}
                onDoubleClick={() => {
                  if (!ignoreToolboxClick.current) placeTool(type);
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
                  InitializeComponent are generated in Form1.Designer.cs. Use
                  the Design tab to edit the form.
                </p>
                <CodeEditor
                  value={practicalCode}
                  onChange={setPracticalCode}
                  label="Form1.cs event code"
                />
                <p className="muted">
                  Start / F5 runs common event code using real C# and a browser
                  control bridge. Text, Checked, Items, validation and simple
                  MessageBox.Show are supported. Windows APIs, extra forms and
                  confirmation dialogs require Visual Studio.
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
                    disabled={preview}
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
                  ref={runWindow}
                  className={
                    preview ? "canvas-scroll runtime-window" : "canvas-scroll"
                  }
                  role={preview ? "dialog" : undefined}
                  tabIndex={preview ? -1 : 0}
                  aria-label={
                    preview
                      ? "Running Form1 application"
                      : "Scrollable form canvas"
                  }
                  style={
                    preview
                      ? {
                          left: runPosition.x,
                          top: runPosition.y,
                          maxHeight: `calc(100dvh - ${runPosition.y + 8}px)`,
                        }
                      : undefined
                  }
                >
                  <div className="form-title">
                    {preview ? (
                      <>
                        <button
                          className="runtime-drag"
                          aria-label="Move running form window"
                          onPointerDown={(e) => {
                            if (e.button !== 0) return;
                            runDrag.current = {
                              x: e.clientX,
                              y: e.clientY,
                              left: runPosition.x,
                              top: runPosition.y,
                            };
                            e.currentTarget.setPointerCapture(e.pointerId);
                          }}
                          onPointerMove={(e) => {
                            const d = runDrag.current;
                            if (d)
                              setRunPosition({
                                x: Math.max(
                                  8,
                                  Math.min(
                                    innerWidth -
                                      Math.min(680, innerWidth - 16) -
                                      8,
                                    d.left + e.clientX - d.x,
                                  ),
                                ),
                                y: Math.max(
                                  8,
                                  Math.min(
                                    innerHeight - 80,
                                    d.top + e.clientY - d.y,
                                  ),
                                ),
                              });
                          }}
                          onPointerUp={() => {
                            runDrag.current = null;
                          }}
                          onPointerCancel={() => {
                            runDrag.current = null;
                          }}
                          onKeyDown={(e) => {
                            const deltas: Record<string, number[]> = {
                              ArrowLeft: [-16, 0],
                              ArrowRight: [16, 0],
                              ArrowUp: [0, -16],
                              ArrowDown: [0, 16],
                            };
                            if (deltas[e.key]) {
                              e.preventDefault();
                              setRunPosition((p) => ({
                                x: Math.max(
                                  8,
                                  Math.min(
                                    innerWidth -
                                      Math.min(680, innerWidth - 16) -
                                      8,
                                    p.x + deltas[e.key][0],
                                  ),
                                ),
                                y: Math.max(
                                  8,
                                  Math.min(
                                    innerHeight - 80,
                                    p.y + deltas[e.key][1],
                                  ),
                                ),
                              }));
                            }
                          }}
                        >
                          ▣ Form1 · running · drag to move
                        </button>
                        <button
                          aria-label="Close running form"
                          onClick={() => {
                            setPreview(false);
                            setMessage("Stopped Form1 — back in the designer.");
                          }}
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <>
                        My CodeQuest Form <span>─　□　×</span>
                      </>
                    )}
                  </div>
                  <div
                    ref={formCanvas}
                    className="form-canvas"
                    aria-label={
                      preview ? "Running form controls" : "Form design canvas"
                    }
                    style={
                      eventBusy
                        ? { pointerEvents: "none", opacity: 0.7 }
                        : armedTool && !preview
                          ? { cursor: "crosshair" }
                          : undefined
                    }
                    onClick={(event) => {
                      if (
                        !armedTool ||
                        preview ||
                        (event.target as HTMLElement).closest(".placed-control")
                      )
                        return;
                      const r = event.currentTarget.getBoundingClientRect();
                      placeTool(
                        armedTool,
                        event.clientX - r.left - event.currentTarget.clientLeft,
                        event.clientY - r.top - event.currentTarget.clientTop,
                      );
                    }}
                    aria-busy={eventBusy}
                    inert={preview && messageBoxes.length > 0}
                  >
                    {items.length === 0 && (
                      <div className="canvas-empty">
                        <MousePointer2 size={28} />
                        <b>Your idea starts here</b>
                        <p>Add a TextBox, Label or Button from the toolbox.</p>
                      </div>
                    )}
                    {(preview
                      ? [...runtimeItems].sort(
                          (a, b) => a.tabIndex - b.tabIndex,
                        )
                      : items
                    ).map((c) => {
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
                          layout = {
                            top: 0,
                            bottom: 0,
                            left: 0,
                            width: c.width,
                          };
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
                            (!preview && selected === c.id
                              ? "is-selected"
                              : "") +
                            (!c.visible ? " is-hidden" : "")
                          }
                          style={layout}
                          role={!preview ? "button" : undefined}
                          tabIndex={!preview ? 0 : undefined}
                          aria-label={!preview ? `Select ${c.name}` : undefined}
                          onFocus={() => !preview && setSelected(c.id)}
                          onClick={() => !preview && setSelected(c.id)}
                          onDoubleClick={() =>
                            !preview && createDefaultHandler(c)
                          }
                          onKeyDown={(e) => {
                            if (preview) return;
                            if (e.key === "F5") {
                              e.preventDefault();
                              setPreview(true);
                              setMessage(
                                "Running Form1 — press Stop debugging to return to the designer.",
                              );
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
                                      ? e.ctrlKey
                                        ? 1
                                        : 8
                                      : e.key === "ArrowLeft"
                                        ? e.ctrlKey
                                          ? -1
                                          : -8
                                        : 0),
                                  y:
                                    c.y +
                                    (e.key === "ArrowDown"
                                      ? e.ctrlKey
                                        ? 1
                                        : 8
                                      : e.key === "ArrowUp"
                                        ? e.ctrlKey
                                          ? -1
                                          : -8
                                        : 0),
                                }),
                              );
                            }
                          }}
                          onPointerDown={(e) => {
                            if (preview) return;
                            e.preventDefault();
                            e.currentTarget.focus();
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
                          onPointerUp={(event) => {
                            const completedDrag = drag.current;
                            drag.current = null;
                            if (
                              completedDrag &&
                              (Math.abs(event.clientX - completedDrag.startX) >
                                2 ||
                                Math.abs(event.clientY - completedDrag.startY) >
                                  2)
                            ) {
                              // React may evaluate this updater after pointer-up.
                              // Capture the snapshot, not a mutable cleared ref.
                              const before = completedDrag.before;
                              setItems(
                                updateControl(before, c.id, {
                                  x: Math.max(
                                    0,
                                    Math.min(
                                      640 - c.width,
                                      Math.round(
                                        (completedDrag.x +
                                          event.clientX -
                                          completedDrag.startX) /
                                          8,
                                      ) * 8,
                                    ),
                                  ),
                                  y: Math.max(
                                    0,
                                    Math.min(
                                      420 - c.height,
                                      Math.round(
                                        (completedDrag.y +
                                          event.clientY -
                                          completedDrag.startY) /
                                          8,
                                      ) * 8,
                                    ),
                                  ),
                                }),
                              );
                              setUndo((u) => [...u, before].slice(-50));
                              setRedo([]);
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
                              c={eventBusy ? { ...c, enabled: false } : c}
                              preview={preview}
                              onValue={(patch) => runtimeChange(c.id, patch)}
                              onEvent={(name) => {
                                void runFormEvent(name, c.id);
                              }}
                            />
                          </div>
                          {!preview && selected === c.id && (
                            <>
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
                  {preview && (
                    <>
                      <div className="runtime-output" role="status">
                        <b>Debug output</b>
                        <pre>
                          {message || "Application started. Try your controls."}
                        </pre>
                        {eventBusy && <span>Running C# event…</span>}
                      </div>
                      {messageBoxes.length > 0 && (
                        <div
                          className="runtime-message"
                          role="alertdialog"
                          aria-label="MessageBox"
                          tabIndex={0}
                        >
                          <b>Form1 · MessageBox</b>
                          <p>{messageBoxes[0]}</p>
                          <button
                            autoFocus
                            onClick={() =>
                              setMessageBoxes((boxes) => boxes.slice(1))
                            }
                          >
                            OK
                          </button>
                        </div>
                      )}
                      <p className="runtime-footer">
                        F5 runs your form · Shift+F5 or Escape stops · Design is
                        preserved
                      </p>
                    </>
                  )}
                </div>
                <p className="muted canvas-note">
                  Design: drag controls, use arrow keys, resize the selected
                  control, or double-click a control to create its default
                  event. Preview: try inputs and run C# handlers for Text,
                  Checked, Items, numeric values, visibility, password masking
                  and MessageBox.Show. Other Windows APIs require the exported
                  project.
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
            <fieldset disabled={preview} className="properties-fields">
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
                      (Name) · C# identifier
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
                        onChange={(e) =>
                          change({ accessibleName: e.target.value })
                        }
                      />
                    </label>
                  </Field>
                  <p className="property-help">
                    Text is what the user sees. (Name) is used in C# code, for
                    example lblStudentName.
                  </p>
                  <Field title="Appearance">
                    <label>
                      Text · visible caption
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
                          onChange={(e) =>
                            change({ foreColor: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        BackColor
                        <input
                          type="color"
                          value={cur.backColor}
                          onChange={(e) =>
                            change({ backColor: e.target.value })
                          }
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
                          onChange={(e) =>
                            change({ checked: e.target.checked })
                          }
                        />
                        Checked
                      </label>
                    )}
                    {cur.type === "TextBox" && (
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={cur.password}
                          onChange={(e) =>
                            change({ password: e.target.checked })
                          }
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
                    {cur.type === "DataGridView" && (
                      <>
                        <label>
                          Columns · Name|Header, one per line
                          <textarea
                            aria-label="Grid columns"
                            value={cur.columns}
                            onChange={(e) =>
                              change({ columns: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          Rows · JSON arrays
                          <textarea
                            aria-label="Grid rows"
                            value={cur.gridRows}
                            onChange={(e) =>
                              change({ gridRows: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={cur.readOnly}
                            onChange={(e) =>
                              change({ readOnly: e.target.checked })
                            }
                          />
                          ReadOnly
                        </label>
                      </>
                    )}
                    {["TextBox", "RichTextBox"].includes(cur.type) && (
                      <label>
                        <input
                          type="checkbox"
                          checked={cur.multiline || cur.type === "RichTextBox"}
                          disabled={cur.type === "RichTextBox"}
                          onChange={(e) =>
                            change({ multiline: e.target.checked })
                          }
                        />
                        Multiline
                      </label>
                    )}
                    {["NumericUpDown", "ProgressBar"].includes(cur.type) &&
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
                    {cur.type === "DataGridView" && (
                      <label>
                        SelectionChanged
                        <input
                          aria-label="SelectionChanged handler"
                          value={cur.eventSelectionChanged}
                          onChange={(e) =>
                            change({ eventSelectionChanged: e.target.value })
                          }
                        />
                      </label>
                    )}
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
                            change({
                              eventSelectedIndexChanged: e.target.value,
                            })
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
                <p className="muted">
                  Select a control to edit its properties.
                </p>
              )}
            </fieldset>
          </aside>
        </div>
        {practical && (
          <div className="question-analyser">
            <h2>Practical C#</h2>
            <p>
              Write the event-handler logic for this practical. Your code is
              saved on this device, included in the Windows export, and reviewed
              alongside the form. Build it in Visual Studio to verify
              compilation and behaviour.
            </p>
            {workspace === "design" && (
              <textarea
                aria-label="Practical C# code"
                value={practicalCode}
                onChange={(e) => setPracticalCode(e.target.value)}
                maxLength={50000}
              />
            )}
            <div className="button-row">
              <button
                onClick={() => {
                  setWorkspace("design");
                  setShowCode(true);
                }}
              >
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
          <summary>
            Error List · {validation.issues.length} design issues
          </summary>
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
