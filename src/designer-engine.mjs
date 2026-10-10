import { gridColumns, gridRows } from "./lib/grid-data.mjs";
export const toolbox = [
  "Label",
  "TextBox",
  "Button",
  "ComboBox",
  "ListBox",
  "RadioButton",
  "CheckBox",
  "NumericUpDown",
  "DataGridView",
  "ProgressBar",
  "RichTextBox",
  "LinkLabel",
  "TrackBar",
  "DateTimePicker",
  "Panel",
  "GroupBox",
];
export const categories = [
  "Appearance",
  "Behavior",
  "Data",
  "Design",
  "Layout",
  "Accessibility",
  "Events",
];
const defaults = {
  parentId: "",
  font: "Segoe UI, 9pt",
  foreColor: "#000000",
  backColor: "#f0f0f0",
  enabled: true,
  visible: true,
  tabIndex: 0,
  anchor: "Top, Left",
  dock: "None",
  accessibleName: "",
  eventValueChanged: "",
  eventClick: "",
  eventTextChanged: "",
  eventSelectedIndexChanged: "",
  eventCheckedChanged: "",
  items: "",
  checked: false,
  password: false,
  minimum: 0,
  maximum: 100,
  value: 0,
  columns: "Column1|Column 1\nColumn2|Column 2",
  gridRows: "[]",
  readOnly: true,
  multiline: false,
  eventSelectionChanged: "",
};
export function addControl(list, type) {
  if (!toolbox.includes(type)) throw new Error("Unsupported control type");
  let n = 1;
  while (
    list.some(
      (x) =>
        x.id === type.toLowerCase() + n || x.name === type.toLowerCase() + n,
    )
  )
    n++;
  return [
    ...list,
    {
      id: type.toLowerCase() + n,
      type,
      name: type.toLowerCase() + n,
      text:
        type === "DateTimePicker"
          ? "2026-01-01"
          : [
                "TextBox",
                "RichTextBox",
                "ComboBox",
                "ListBox",
                "NumericUpDown",
                "DataGridView",
                "ProgressBar",
              ].includes(type)
            ? ""
            : type.toLowerCase() + n,
      x: 30 + (Math.floor(list.length / 4) % 3) * 200,
      y: 30 + (list.length % 4) * 95,
      width: ["DataGridView", "Panel", "GroupBox"].includes(type)
        ? 360
        : [
              "TextBox",
              "RichTextBox",
              "ProgressBar",
              "TrackBar",
              "DateTimePicker",
            ].includes(type)
          ? 180
          : 110,
      height: ["DataGridView", "RichTextBox", "Panel", "GroupBox"].includes(
        type,
      )
        ? 150
        : type === "ListBox"
          ? 90
          : 34,
      ...defaults,
      tabIndex: list.length,
    },
  ];
}
export function updateControl(list, id, patch) {
  patch = { ...patch };
  delete patch.id;
  delete patch.type;
  for (const k of ["x", "y", "width", "height", "tabIndex"]) {
    if (k in patch) {
      const n = Number(patch[k]);
      patch[k] = Number.isFinite(n)
        ? Math.max(k === "width" ? 24 : k === "height" ? 20 : 0, Math.round(n))
        : 0;
    }
  }
  const original = list.find((x) => x.id === id),
    dx = original && "x" in patch ? patch.x - original.x : 0,
    dy = original && "y" in patch ? patch.y - original.y : 0;
  const inside = (c) => {
    const seen = new Set();
    while (c?.parentId && !seen.has(c.id)) {
      seen.add(c.id);
      if (c.parentId === id) return true;
      c = list.find((x) => x.id === c.parentId);
    }
    return false;
  };
  return list.map((x) =>
    x.id === id
      ? { ...x, ...patch }
      : inside(x)
        ? { ...x, x: Math.max(0, x.x + dx), y: Math.max(0, x.y + dy) }
        : x,
  );
}
export function removeControl(list, id) {
  return list
    .filter((x) => x.id !== id)
    .map((x) => (x.parentId === id ? { ...x, parentId: "" } : x));
}
export function moveControl(list, id, x, y) {
  return updateControl(list, id, { x: Math.max(0, x), y: Math.max(0, y) });
}
export function resizeControl(list, id, width, height) {
  return updateControl(list, id, {
    width: Math.max(24, width),
    height: Math.max(20, height),
  });
}
const formMembers = new Set([
  "Text",
  "Name",
  "ClientSize",
  "Controls",
  "SuspendLayout",
  "ResumeLayout",
  "AutoScaleDimensions",
  "AutoScaleMode",
  "Load",
  "Dispose",
  "InitializeComponent",
  "Form1",
]);
const reserved = new Set(
  "abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new null object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using virtual void volatile while".split(
    " ",
  ),
);
export function validateForm(list) {
  const issues = [];
  const names = list.map((x) => x.name);
  if (new Set(names).size !== names.length)
    issues.push("Control names must be unique.");
  for (const c of list) {
    if (!toolbox.includes(c.type))
      issues.push(c.name + ": unsupported control type.");
    if (
      c.eventSelectedIndexChanged &&
      !["ComboBox", "ListBox"].includes(c.type)
    )
      issues.push(
        c.name + ": SelectedIndexChanged is only available for list controls.",
      );
    if (
      c.eventValueChanged &&
      !["TrackBar", "NumericUpDown", "DateTimePicker"].includes(c.type)
    )
      issues.push(
        c.name + ": ValueChanged belongs to numeric and date controls.",
      );
    if (c.eventCheckedChanged && !["CheckBox", "RadioButton"].includes(c.type))
      issues.push(
        c.name + ": CheckedChanged is only available for checked controls.",
      );
    if (
      !/^[A-Za-z_][A-Za-z0-9_]*$/.test(c.name) ||
      reserved.has(c.name) ||
      formMembers.has(c.name)
    )
      issues.push(c.name + ": invalid C# control name.");
    for (const k of [
      "eventValueChanged",
      "eventClick",
      "eventTextChanged",
      "eventSelectedIndexChanged",
      "eventCheckedChanged",
      "eventSelectionChanged",
    ]) {
      if (
        c[k] &&
        (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(c[k]) ||
          reserved.has(c[k]) ||
          names.includes(c[k]) ||
          formMembers.has(c[k]))
      )
        issues.push(c.name + ": invalid event handler name.");
    }
    for (const key of ["enabled", "visible"]) {
      if (typeof c[key] !== "boolean")
        issues.push(c.name + ": " + key + " must be true or false.");
    }
    const anchors = typeof c.anchor === "string" ? c.anchor.split(",").map((value) => value.trim()) : [];
    const allowedAnchors = new Set(["Top", "Bottom", "Left", "Right"]);
    if (
      !anchors.length ||
      (anchors.includes("None")
        ? anchors.length !== 1
        : anchors.some((value) => !allowedAnchors.has(value)) ||
          new Set(anchors).size !== anchors.length)
    )
      issues.push(c.name + ": invalid Anchor property.");
    if (!["None", "Top", "Bottom", "Left", "Right", "Fill"].includes(c.dock))
      issues.push(c.name + ": invalid Dock property.");
    if (c.parentId) {
      const parent = list.find((x) => x.id === c.parentId);
      if (!parent || !["Panel", "GroupBox"].includes(parent.type))
        issues.push(
          c.name + ": choose an existing Panel or GroupBox as the parent.",
        );
      let node = c;
      const seen = new Set();
      while (node?.parentId) {
        if (seen.has(node.id)) {
          issues.push(c.name + ": containers cannot contain themselves.");
          break;
        }
        seen.add(node.id);
        node = list.find((x) => x.id === node.parentId);
      }
    }
    if (
      c.type === "DateTimePicker" &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(c.text) ||
        !Number.isFinite(Date.parse(c.text)) ||
        new Date(c.text).toISOString().slice(0, 10) !== c.text ||
        Number(c.text.slice(0, 4)) < 1753 ||
        Number(c.text.slice(0, 4)) > 9998)
    )
      issues.push(c.name + ": use a date in YYYY-MM-DD format.");
    if (c.type === "DataGridView") {
      const cols = gridColumns(c.columns);
      if (
        !cols.length ||
        cols.length > 16 ||
        new Set(cols.map((x) => x.name)).size !== cols.length ||
        cols.some((x) => !x.name || x.name.includes("|") || x.name.length > 100)
      )
        issues.push(c.name + ": use 1–16 unique grid column names.");
      let rows;
      try {
        rows = JSON.parse(c.gridRows || "[]");
      } catch {
        rows = null;
      }
      if (
        !Array.isArray(rows) ||
        gridRows(c.gridRows).length !== rows.length ||
        rows.some((row) => !Array.isArray(row) || row.length !== cols.length)
      )
        issues.push(
          c.name +
            ": grid rows must be a JSON array with one value per column (maximum 100 rows).",
        );
    }
    if (c.eventSelectionChanged && c.type !== "DataGridView")
      issues.push(c.name + ": SelectionChanged belongs to DataGridView.");
    if (
      ["NumericUpDown", "ProgressBar", "TrackBar"].includes(c.type) &&
      (!(
        Number.isFinite(c.minimum) &&
        Number.isFinite(c.maximum) &&
        Number.isFinite(c.value)
      ) ||
        c.minimum > c.maximum ||
        c.value < c.minimum ||
        c.value > c.maximum)
    )
      issues.push(c.name + ": numeric range/value is invalid.");
    if (
      ["ProgressBar", "TrackBar"].includes(c.type) &&
      [c.minimum, c.maximum, c.value].some(
        (v) => !Number.isInteger(v) || v < 0 || v > 2147483647,
      )
    )
      issues.push(
        c.name + ": progress values must be non-negative 32-bit integers.",
      );
  }
  return { ok: issues.length === 0, issues };
}
const quote = (value) =>
  JSON.stringify(String(value)).replace(/\\u2028/g, "\\u2028");
export function designerCode(list) {
  const wiring = [];
  return (
    list
      .map((c) => {
        const target = `this.${c.name}`;
        const lines = [
          `${target} = new System.Windows.Forms.${c.type}();`,
          `${target}.Location = new System.Drawing.Point(${c.x}, ${c.y});`,
          `${target}.Name = ${quote(c.name)};`,
          `${target}.Size = new System.Drawing.Size(${c.width}, ${c.height});`,
          `${target}.Text = ${quote(c.text)};`,
          `${target}.Enabled = ${c.enabled};`,
          `${target}.Visible = ${c.visible};`,
          `${target}.TabIndex = ${c.tabIndex};`,
          `${target}.AccessibleName = ${quote(c.accessibleName)};`,
        ];
        for (const key of ["foreColor", "backColor"])
          lines.push(
            `${target}.${key === "foreColor" ? "ForeColor" : "BackColor"} = System.Drawing.ColorTranslator.FromHtml(${quote(c[key])});`,
          );
        const font = /^(.+),\s*(\d+(?:\.\d+)?)pt$/.exec(c.font);
        if (font)
          lines.push(
            `${target}.Font = new System.Drawing.Font(${quote(font[1])}, ${font[2]}F);`,
          );
        lines.push(
          `${target}.Anchor = ${c.anchor
            .split(",")
            .map((a) => `System.Windows.Forms.AnchorStyles.${a.trim()}`)
            .join(" | ")};`,
          `${target}.Dock = System.Windows.Forms.DockStyle.${c.dock};`,
        );
        for (const [property, event] of [
          ["eventValueChanged", "ValueChanged"],
          ["eventClick", "Click"],
          ["eventTextChanged", "TextChanged"],
          ["eventSelectedIndexChanged", "SelectedIndexChanged"],
          ["eventCheckedChanged", "CheckedChanged"],
          ["eventSelectionChanged", "SelectionChanged"],
        ])
          if (c[property])
            wiring.push(
              `${target}.${event} += new System.EventHandler(this.${c[property]});`,
            );
        if (["ListBox", "ComboBox"].includes(c.type) && c.items)
          lines.push(
            `${target}.Items.AddRange(new object[] { ${c.items.split("\n").map(quote).join(", ")} });`,
          );
        if (["RadioButton", "CheckBox"].includes(c.type))
          lines.push(`${target}.Checked = ${!!c.checked};`);
        if (c.type === "TextBox")
          lines.push(`${target}.UseSystemPasswordChar = ${!!c.password};`);
        if (["TextBox", "RichTextBox"].includes(c.type))
          lines.push(
            `${target}.Multiline = ${c.type === "RichTextBox" || !!c.multiline};`,
          );
        if (c.type === "DateTimePicker")
          lines.push(
            `${target}.Value = System.DateTime.Parse(${quote(c.text || "2026-01-01")}, System.Globalization.CultureInfo.InvariantCulture);`,
            `${target}.Format = System.Windows.Forms.DateTimePickerFormat.Short;`,
          );
        if (c.type === "DataGridView") {
          lines.push(
            `${target}.AllowUserToAddRows = false;`,
            `${target}.ReadOnly = ${!!c.readOnly};`,
            `${target}.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;`,
            `${target}.MultiSelect = false;`,
          );
          gridColumns(c.columns).forEach((col) =>
            lines.push(
              `${target}.Columns.Add(${quote(col.name)}, ${quote(col.header)});`,
            ),
          );
          gridRows(c.gridRows).forEach((row) =>
            lines.push(
              `${target}.Rows.Add(new object[] { ${row.map(quote).join(", ")} });`,
            ),
          );
        }
        if (["NumericUpDown", "ProgressBar", "TrackBar"].includes(c.type))
          lines.push(
            `${target}.Maximum = ${Number(c.maximum ?? 100)}${c.type === "NumericUpDown" ? "m" : ""};`,
            `${target}.Minimum = ${Number(c.minimum ?? 0)}${c.type === "NumericUpDown" ? "m" : ""};`,
            `${target}.Value = ${Number(c.value ?? 0)}${c.type === "NumericUpDown" ? "m" : ""};`,
          );
        lines.push(`this.Controls.Add(${target});`);
        return lines.join("\n");
      })
      .join("\n\n") +
    list
      .filter((c) => c.parentId)
      .map((c) => {
        const parent = list.find((x) => x.id === c.parentId);
        return `\nthis.${parent.name}.Controls.Add(this.${c.name});\nthis.${c.name}.Location = new System.Drawing.Point(${c.x - parent.x}, ${c.y - parent.y});`;
      })
      .join("") +
    "\n" +
    wiring.join("\n")
  );
}
