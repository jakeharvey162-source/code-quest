export const toolbox = [
  "Label",
  "TextBox",
  "Button",
  "ComboBox",
  "ListBox",
  "RadioButton",
  "CheckBox",
  "NumericUpDown",
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
  font: "Segoe UI, 9pt",
  foreColor: "#000000",
  backColor: "#f0f0f0",
  enabled: true,
  visible: true,
  tabIndex: 0,
  anchor: "Top, Left",
  dock: "None",
  accessibleName: "",
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
      text: ["TextBox", "ComboBox", "ListBox", "NumericUpDown"].includes(type) ? "" : type.toLowerCase() + n,
      x: 30 + (Math.floor(list.length / 4) % 3) * 200,
      y: 30 + (list.length % 4) * 95,
      width: type === "TextBox" ? 180 : 110,
      height: type === "ListBox" ? 90 : 34,
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
  return list.map((x) => (x.id === id ? { ...x, ...patch } : x));
}
export function removeControl(list, id) {
  return list.filter((x) => x.id !== id);
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
      "eventClick",
      "eventTextChanged",
      "eventSelectedIndexChanged",
      "eventCheckedChanged",
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
    if (
      c.type === "NumericUpDown" &&
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
    if (c.type === "Button" && !c.eventClick)
      issues.push(c.name + ": wire a Click event.");
  }
  return { ok: issues.length === 0, issues };
}
const quote = (value) =>
  JSON.stringify(String(value)).replace(/\\u2028/g, "\\u2028");
export function designerCode(list) {
  return list
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
        ["eventClick", "Click"],
        ["eventTextChanged", "TextChanged"],
        ["eventSelectedIndexChanged", "SelectedIndexChanged"],
        ["eventCheckedChanged", "CheckedChanged"],
      ])
        if (c[property])
          lines.push(
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
      if (c.type === "NumericUpDown")
        lines.push(
          `${target}.Maximum = ${Number(c.maximum ?? 100)}m;`,
          `${target}.Minimum = ${Number(c.minimum ?? 0)}m;`,
          `${target}.Value = ${Number(c.value ?? 0)}m;`,
        );
      lines.push(`this.Controls.Add(${target});`);
      return lines.join("\n");
    })
    .join("\n\n");
}
