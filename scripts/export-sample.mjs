import { mkdir, writeFile } from "node:fs/promises";
import { toolbox, addControl, updateControl } from "../src/designer-engine.mjs";
import { projectFiles } from "../src/lib/project-export.mjs";
let controls = [];
for (const type of toolbox) controls = addControl(controls, type);
controls = controls.map((c, i) => ({
  ...c,
  x: 20,
  y: 20 + i * 42,
  eventClick: c.type === "Button" ? "button_Click" : "",
  eventTextChanged: c.type === "TextBox" ? "text_Changed" : "",
  eventSelectedIndexChanged: ["ComboBox", "ListBox"].includes(c.type)
    ? c.name + "_SelectedIndexChanged"
    : "",
  eventCheckedChanged: ["CheckBox", "RadioButton"].includes(c.type)
    ? c.name + "_CheckedChanged"
    : "",
  items: ["ComboBox", "ListBox"].includes(c.type) ? "Ada\nLebo" : "",
  text:
    c.type === "DateTimePicker"
      ? "2026-10-09"
      : c.type === "Label"
        ? 'Say "hello"'
        : "Welcome",
  eventValueChanged: ["TrackBar", "NumericUpDown", "DateTimePicker"].includes(
    c.type,
  )
    ? c.name + "_ValueChanged"
    : "",
}));
controls = controls.map((c) =>
  c.type === "Label"
    ? { ...c, parentId: controls.find((p) => p.type === "GroupBox").id }
    : c,
);
await mkdir("test-results/native-project", { recursive: true });
for (const [name, text] of Object.entries(
  projectFiles(controls, {
    sourceFiles: [
      {
        path: "Account.cs",
        text: "public class Account { public decimal Balance {get;set;} = 100m; }",
      },
    ],
    handlerCode:
      "private void button_Click(object sender, System.EventArgs e) { var account=new Account(); System.Windows.Forms.MessageBox.Show(account.Balance.ToString()); }",
  }),
))
  await writeFile("test-results/native-project/" + name, text);
