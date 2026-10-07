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
  text: c.type === "Label" ? 'Say "hello"' : "Welcome",
}));
await mkdir("test-results/native-project", { recursive: true });
for (const [name, text] of Object.entries(
  projectFiles(controls, {
    handlerCode:
      'private void button_Click(object sender, System.EventArgs e) { System.Windows.Forms.MessageBox.Show("Saved"); }',
  }),
))
  await writeFile("test-results/native-project/" + name, text);
