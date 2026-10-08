import { validateForm } from "../designer-engine.mjs";
const literal = (text) => `@"${String(text).replaceAll('"', '""')}"`;
export function formEventSource(controls, handlerCode, handler, senderId) {
  const validation = validateForm(controls);
  if (!validation.ok) throw new Error(validation.issues.join("\n"));
  if (!/^[A-Za-z_]\w*$/.test(handler)) throw new Error("Choose a valid event handler.");
  const sender = controls.find(c => c.id === senderId);
  if (!sender) throw new Error("Select an event control.");
  const fields = controls.map(c => `public ${c.type} ${c.name} = new ${c.type}();`).join("\n");
  const init = controls.map(c => `
    ${c.name}.Name = ${literal(c.name)};
    ${c.name}.Text = ${literal(c.text)};
    ${c.name}.Enabled = ${c.enabled ? "true" : "false"};
    ${c.name}.Visible = ${c.visible ? "true" : "false"};
    ${c.name}.Checked = ${c.checked ? "true" : "false"};
    ${c.name}.UseSystemPasswordChar = ${c.password ? "true" : "false"};
    ${c.name}.Minimum = ${Number(c.minimum)}m; ${c.name}.Maximum = ${Number(c.maximum)}m; ${c.name}.Value = ${Number(c.value)}m;
    ${c.name}.Items.AddRange(new object[] { ${c.items.split("\n").filter(Boolean).map(literal).join(",")} });
    ${c.name}.SelectedIndex = ${Number.isSafeInteger(c.selectedIndex) ? c.selectedIndex : -1};`).join("\n");
  const output = controls.map(c => `Dump(${literal(c.id)}, ${c.name});`).join("\n");
  return `using System;
using System.Linq;
using System.Collections.Generic;
using System.Text;
using System.Windows.Forms;
var cqForm = new Form1(); cqForm.Execute(); cqForm.Print();
foreach (var message in MessageBox.Messages) Console.WriteLine("CQMESSAGE|" + Convert.ToBase64String(Encoding.UTF8.GetBytes(message)));
namespace System.Windows.Forms {
  public enum DialogResult { None, OK, Cancel, Yes, No }
  public enum MessageBoxButtons { OK, OKCancel, YesNo, YesNoCancel }
  public enum MessageBoxIcon { None, Information, Warning, Error, Question }
  public class Control {
    public string Name {get;set;} = "";
    public string Text {get;set;} = "";
    public bool Enabled {get;set;} = true;
    public bool Visible {get;set;} = true;
    public bool Checked {get;set;}
    public bool UseSystemPasswordChar {get;set;}
    public char PasswordChar {get;set;}
    public decimal Minimum {get;set;}
    public decimal Maximum {get;set;} = 100;
    public decimal Value {get;set;}
    public List<object> Items {get;} = new List<object>();
    public int SelectedIndex {get;set;} = -1;
    public object SelectedItem { get {return SelectedIndex >= 0 && SelectedIndex < Items.Count ? Items[SelectedIndex] : null;} set {SelectedIndex = Items.IndexOf(value);} }
    public void Clear() { Text = ""; }
    public void Focus() { }
    public void Show() { Visible = true; }
    public void Hide() { Visible = false; }
  }
  public class Label : Control {} public class TextBox : Control {}
  public class Button : Control {} public class ComboBox : Control {}
  public class ListBox : Control {} public class RadioButton : Control {}
  public class CheckBox : Control {} public class NumericUpDown : Control {}
  public class Form : Control { public void Close() { Visible = false; } }
  public static class MessageBox {
    public static List<string> Messages = new List<string>();
    public static DialogResult Show(string text) { Messages.Add(text); return DialogResult.OK; }
    public static DialogResult Show(string text, string caption) { Messages.Add(caption + ": " + text); return DialogResult.OK; }
  }
}
public class Form1 : Form {
${fields}
public Form1() { ${init} }
${handlerCode}
public void Execute() { ${handler}(${sender.name}, EventArgs.Empty); }
public void Print() { ${output} }
static string Encode(string value) {return Convert.ToBase64String(Encoding.UTF8.GetBytes(value ?? ""));}
static void Dump(string id, Control c) {
  Console.WriteLine("CQCONTROL|" + id + "|" + Encode(c.Text) + "|" + c.Enabled + "|" + c.Visible + "|" + c.Checked + "|" + (c.UseSystemPasswordChar || c.PasswordChar != '\\0') + "|" + c.Value.ToString(System.Globalization.CultureInfo.InvariantCulture) + "|" + Encode(string.Join("\\n", c.Items)) + "|" + c.SelectedIndex);
}
}`;
}
export function parseFormOutput(output, controls) {
  const decode = (s) => new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)));
  const changes = new Map(); const messages = [];
  for (const line of output.split(/\r?\n/)) {
    const bits = line.split("|");
    if (bits[0] === "CQMESSAGE") messages.push(decode(bits[1]));
    if (bits[0] === "CQCONTROL" && bits.length === 10) changes.set(bits[1], {
      text: decode(bits[2]), enabled: bits[3] === "True", visible: bits[4] === "True",
      checked: bits[5] === "True", password: bits[6] === "True", value: Number(bits[7]), items: decode(bits[8]), selectedIndex: Number(bits[9]),
    });
  }
  if (changes.size !== controls.length) throw new Error("The event did not return a complete form state.");
  return { controls: controls.map(c => ({ ...c, ...changes.get(c.id) })), messages };
}
