import { gridColumns, gridRows } from "./grid-data.mjs";
import { validateForm } from "../designer-engine.mjs";
const literal = (text) => `@"${String(text).replaceAll('"', '""')}"`;
export function formEventSource(
  controls,
  handlerCode,
  handler,
  senderId,
  fieldsState = {},
) {
  const validation = validateForm(controls);
  const critical = validation.issues.filter(
    (issue) => !issue.includes(": wire a Click event."),
  );
  if (critical.length) throw new Error(critical.join("\n"));
  if (!/^[A-Za-z_]\w*$/.test(handler))
    throw new Error("Choose a valid event handler.");
  const sender = controls.find((c) => c.id === senderId);
  if (!sender) throw new Error("Select an event control.");
  const fields = controls
    .map((c) => `public ${c.type} ${c.name} = new ${c.type}();`)
    .join("\n");
  const init =
    controls
      .map(
        (c) => `
    ${c.name}.Name = ${literal(c.name)};
    ${c.name}.Text = ${literal(c.text)};
    ${c.name}.Enabled = ${c.enabled ? "true" : "false"};
    ${c.name}.Visible = ${c.visible ? "true" : "false"};
    ${c.name}.Checked = ${c.checked ? "true" : "false"};
    ${c.name}.UseSystemPasswordChar = ${c.password ? "true" : "false"};
    ${c.name}.Minimum = ${Number(c.minimum)}${c.type === "TrackBar" ? "" : "m"}; ${c.name}.Maximum = ${Number(c.maximum)}${c.type === "TrackBar" ? "" : "m"}; ${c.name}.Value = ${c.type === "DateTimePicker" ? `DateTime.Parse(${literal(c.text)}, CultureInfo.InvariantCulture)` : Number(c.value) + (c.type === "TrackBar" ? "" : "m")};
    ${c.name}.Items.AddRange(new object[] { ${c.items.split("\n").filter(Boolean).map(literal).join(",")} });
    ${c.name}.SelectedIndex = ${Number.isSafeInteger(c.selectedIndex) ? c.selectedIndex : -1};`,
      )
      .join("\n") +
    controls
      .filter((c) => c.parentId)
      .map((c) => {
        const parent = controls.find((x) => x.id === c.parentId);
        return `\n${parent.name}.Controls.Add(${c.name});`;
      })
      .join("");
  const gridInit = controls
    .filter((c) => c.type === "DataGridView")
    .map((c) => {
      const cols = gridColumns(c.columns);
      return (
        cols
          .map(
            (col) =>
              `${c.name}.Columns.Add(${literal(col.name)}, ${literal(col.header)});`,
          )
          .join("\n") +
        "\n" +
        gridRows(c.gridRows)
          .map(
            (row) =>
              `${c.name}.Rows.Add(new object[] {${row.map(literal).join(",")}});`,
          )
          .join("\n")
      );
    })
    .join("\n");
  const restore = Object.entries(fieldsState)
    .map(
      ([name, state]) =>
        `Restore(${literal(name)}, ${literal(state.type)}, ${literal(state.value)});`,
    )
    .join("\n");
  const output = controls
    .map((c) => `Dump(${literal(c.id)}, ${c.name});`)
    .join("\n");
  return `using System;
using System.Linq;
using System.Collections.Generic;
using System.Text;
using System.Reflection;
using System.Globalization;
using System.Collections;
using System.Windows.Forms;
var cqForm = new Form1(); cqForm.Execute(); cqForm.Print();
foreach (var message in MessageBox.Messages) Console.WriteLine("CQMESSAGE|" + Convert.ToBase64String(Encoding.UTF8.GetBytes(message)));
namespace System.Windows.Forms {
  public enum DialogResult { None, OK, Cancel, Yes, No }
  public enum MessageBoxButtons { OK, OKCancel, YesNo, YesNoCancel }
  public enum MessageBoxIcon { None, Information, Warning, Error, Question }
  public class Control {
    public List<Control> Controls {get;} = new List<Control>();
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
  public class LinkLabel : Control {} public class Panel : Control {} public class GroupBox : Control {}
  public class TrackBar : Control { public new int Value {get;set;} public new int Minimum {get;set;} public new int Maximum {get;set;}=100; }
  public class DateTimePicker : Control { public new DateTime Value {get;set;} }
  public class Label : Control {} public class TextBox : Control {}
  public class RichTextBox : TextBox {} public class ProgressBar : Control {}
  public class Button : Control {} public class ComboBox : Control {}
  public class ListBox : Control {} public class RadioButton : Control {}
  public class CheckBox : Control {} public class NumericUpDown : Control {}
  public class DataGridViewCell { public object Value {get;set;} public DataGridViewCell(object value) { Value=value; } }
  public class DataGridViewColumn {public string Name {get;set;} public string HeaderText {get;set;} public DataGridViewColumn(string name,string header) {Name=name;HeaderText=header;}}
  public class DataGridViewColumnCollection : List<DataGridViewColumn> { public int Add(string name,string header) {if(Count>=16) throw new InvalidOperationException("Practice grid supports up to 16 columns."); base.Add(new DataGridViewColumn(name,header));return Count-1;} }
  public class DataGridViewCellCollection : List<DataGridViewCell> {
    DataGridViewColumnCollection columns; public DataGridViewCellCollection(DataGridViewColumnCollection cols) {columns=cols;}
    public DataGridViewCell this[string name] {get {var index=columns.FindIndex(c=>c.Name==name);if(index<0) throw new ArgumentException("Column not found: " + name);return this[index];}}
  }
  public class DataGridViewRow {public int Index {get;set;} public bool Selected {get;set;} public bool IsNewRow {get {return false;}} public DataGridViewCellCollection Cells {get;} public DataGridViewRow(DataGridViewColumnCollection cols,object[] values) {Cells=new DataGridViewCellCollection(cols); for(int i=0;i<cols.Count;i++) Cells.Add(new DataGridViewCell(i<values.Length?values[i]:null));}}
  public class DataGridViewRowCollection : List<DataGridViewRow> {
    DataGridView owner; public DataGridViewRowCollection(DataGridView grid) {owner=grid;}
    public int Add(params object[] values) {if(Count>=100) throw new InvalidOperationException("Practice grid supports up to 100 rows.");var row=new DataGridViewRow(owner.Columns,values);row.Index=Count;base.Add(row);return row.Index;}
    public new void RemoveAt(int index) {base.RemoveAt(index);for(int i=0;i<Count;i++) this[i].Index=i;if(owner.SelectedIndex>=Count) owner.SelectedIndex=Count-1;}
    public new void Clear() {base.Clear();owner.SelectedIndex=-1;}
  }
  public enum DataGridViewSelectionMode {CellSelect,FullRowSelect,FullColumnSelect,RowHeaderSelect,ColumnHeaderSelect}
  public class DataGridView : Control {
    public DataGridViewColumnCollection Columns {get;} = new DataGridViewColumnCollection();
    public DataGridViewRowCollection Rows {get;}
    public bool ReadOnly {get;set;} public bool AllowUserToAddRows {get;set;} public bool MultiSelect {get;set;} public DataGridViewSelectionMode SelectionMode {get;set;}
    public DataGridView() {Rows=new DataGridViewRowCollection(this);}
    public List<DataGridViewRow> SelectedRows {get {return Rows.Where(r=>r.Selected || r.Index == SelectedIndex).ToList();}}
    public DataGridViewRow CurrentRow {get {return SelectedIndex>=0 && SelectedIndex<Rows.Count ? Rows[SelectedIndex] : Rows.FirstOrDefault();}}
    public DataGridViewCell CurrentCell {get {return CurrentRow == null ? null : CurrentRow.Cells.FirstOrDefault();}}
    public int RowCount {get {return Rows.Count;} set {while(Rows.Count>value) Rows.RemoveAt(Rows.Count-1);while(Rows.Count<value) Rows.Add(new object[Columns.Count]);}}
    public int ColumnCount {get {return Columns.Count;} set {while(Columns.Count>value) Columns.RemoveAt(Columns.Count-1);while(Columns.Count<value) Columns.Add("Column"+Columns.Count,"Column "+Columns.Count);}}
  }
  public class Form : Control { public void Close() { Visible = false; } }
  public static class MessageBox {
    public static List<string> Messages = new List<string>();
    public static DialogResult Show(string text) { Messages.Add(text); return DialogResult.OK; }
    public static DialogResult Show(string text, string caption) { Messages.Add(caption + ": " + text); return DialogResult.OK; }
  }
}
public class Form1 : Form {
${fields}
public Form1() { ${init} ${gridInit} ${restore} }
${handlerCode}
public void Execute() { ${handler}(${sender.name}, EventArgs.Empty); }
public void Print() { ${output}
  foreach(var field in GetType().GetFields(BindingFlags.Instance|BindingFlags.Public|BindingFlags.NonPublic|BindingFlags.DeclaredOnly)) {
    var value=field.GetValue(this); if(value is Control || field.IsInitOnly) continue;
    var type=field.FieldType; if(type.IsPrimitive || type==typeof(decimal) || type==typeof(string) || type==typeof(DateTime) || type.IsEnum) Console.WriteLine("CQFIELD|"+field.Name+"|"+type.FullName+"|"+Encode(value is DateTime ? ((DateTime)value).ToString("O") : Convert.ToString(value,CultureInfo.InvariantCulture)));
  }
}
void Restore(string name,string typeName,string value) {
  var field=GetType().GetField(name,BindingFlags.Instance|BindingFlags.Public|BindingFlags.NonPublic|BindingFlags.DeclaredOnly);
  if(field==null || field.IsInitOnly || field.FieldType.FullName!=typeName || typeof(Control).IsAssignableFrom(field.FieldType)) return;
  var type=field.FieldType; if(type.IsEnum) field.SetValue(this,Enum.Parse(type,value));
  else if(type.IsPrimitive || type==typeof(decimal) || type==typeof(string)) field.SetValue(this,Convert.ChangeType(value,type,CultureInfo.InvariantCulture));
  else if(type==typeof(DateTime)) field.SetValue(this,DateTime.Parse(value,CultureInfo.InvariantCulture,DateTimeStyles.RoundtripKind));
}
static string Encode(string value) {return Convert.ToBase64String(Encoding.UTF8.GetBytes(value ?? ""));}
static void Dump(string id, Control c) {
  if(c is TrackBar track) c.Value=track.Value;
  if(c is DateTimePicker date) c.Text=date.Value.ToString("yyyy-MM-dd",CultureInfo.InvariantCulture);
  if(c is DataGridView) {var grid=(DataGridView)c;
    Console.WriteLine("CQGRID|"+id);
    foreach(var col in grid.Columns) Console.WriteLine("CQCOL|"+id+"|"+Encode(col.Name)+"|"+Encode(col.HeaderText));
    foreach(var row in grid.Rows) Console.WriteLine("CQROW|"+id+"|"+string.Join("|",row.Cells.Select(cell=>Encode(Convert.ToString(cell.Value,CultureInfo.InvariantCulture)))));
  }
  Console.WriteLine("CQCONTROL|" + id + "|" + Encode(c.Text) + "|" + c.Enabled + "|" + c.Visible + "|" + c.Checked + "|" + (c.UseSystemPasswordChar || c.PasswordChar != '\\0') + "|" + c.Value.ToString(System.Globalization.CultureInfo.InvariantCulture) + "|" + Encode(string.Join("\\n", c.Items)) + "|" + c.SelectedIndex);
}
}`;
}
export function parseFormOutput(output, controls) {
  const decode = (s) =>
    new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
  const changes = new Map();
  const messages = [];
  const grids = new Map();
  const fields = {};
  for (const line of output.split(/\r?\n/)) {
    const bits = line.split("|");
    if (bits[0] === "CQFIELD" && bits.length === 4)
      fields[bits[1]] = { type: bits[2], value: decode(bits[3]) };
    if (bits[0] === "CQGRID") grids.set(bits[1], { columns: [], rows: [] });
    if (bits[0] === "CQCOL" && grids.has(bits[1]))
      grids.get(bits[1]).columns.push(decode(bits[2]) + "|" + decode(bits[3]));
    if (bits[0] === "CQROW" && grids.has(bits[1]))
      grids.get(bits[1]).rows.push(bits.slice(2).map(decode));
    if (bits[0] === "CQMESSAGE") messages.push(decode(bits[1]));
    if (bits[0] === "CQCONTROL" && bits.length === 10)
      changes.set(bits[1], {
        text: decode(bits[2]),
        enabled: bits[3] === "True",
        visible: bits[4] === "True",
        checked: bits[5] === "True",
        password: bits[6] === "True",
        value: Number(bits[7]),
        items: decode(bits[8]),
        selectedIndex: Number(bits[9]),
      });
  }
  if (changes.size !== controls.length)
    throw new Error("The event did not return a complete form state.");
  return {
    controls: controls.map((c) => ({
      ...c,
      ...changes.get(c.id),
      ...(grids.has(c.id)
        ? {
            columns: grids.get(c.id).columns.join("\n"),
            gridRows: JSON.stringify(grids.get(c.id).rows),
          }
        : {}),
    })),
    messages,
    fields,
  };
}
