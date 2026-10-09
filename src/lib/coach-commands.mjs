// Explicit, reversible workspace actions; never execute arbitrary generated code.
export function cleanCoachRequest(text) {
  return String(text)
    .trim()
    .replace(/^(?:hey\s+|hi\s+)?tor[,!\s]+/i, "")
    .replace(/^(?:(?:can you|could you|please)\s+)+/i, "")
    .trim();
}
export function coachAction(text) {
  const q = cleanCoachRequest(text).replace(/[.!?]+$/, "");
  const types = {
    label: "Label",
    datagridview: "DataGridView",
    "data grid view": "DataGridView",
    "progress bar": "ProgressBar",
    progressbar: "ProgressBar",
    "rich text box": "RichTextBox",
    richtextbox: "RichTextBox",
    textbox: "TextBox",
    "text box": "TextBox",
    button: "Button",
    combobox: "ComboBox",
    "combo box": "ComboBox",
    listbox: "ListBox",
    "list box": "ListBox",
    checkbox: "CheckBox",
    "check box": "CheckBox",
    "radio button": "RadioButton",
    radiobutton: "RadioButton",
    "numeric up down": "NumericUpDown",
    numericupdown: "NumericUpDown",
  };
  let m =
    /^(?:add|create|place)\s+(?:a\s+|an\s+)?(label|text ?box|button|combo ?box|list ?box|check ?box|radio ?button|numeric ?up ?down|data ?grid ?view|progress ?bar|rich ?text ?box)(?:\s+(?:with text|that says|saying)\s+(.+))?$/i.exec(
      q,
    );
  if (m)
    return {
      type: "add",
      control: types[m[1].toLowerCase()],
      value: m[2]?.replace(/^['"]|['"]$/g, ""),
    };
  m =
    /^(?:set|change)\s+(?:(?:the\s+)?(?:label|button|selected control)(?:'s)?\s+)?(?:text|caption)(?:\s+to)?\s+(.+)$/i.exec(
      q,
    );
  if (m) return { type: "text", value: m[1].replace(/^['"]|['"]$/g, "") };
  m =
    /^(?:rename(?:\s+(?:the\s+)?(?:selected control|label|button))?|set\s+(?:the\s+)?name)\s+to\s+(.+)$/i.exec(
      q,
    );
  if (m) return { type: "name", value: m[1] };
  m = /^(?:click|press)\s+([A-Za-z_]\w*)$/i.exec(q);
  if (m) return { type: "click", control: m[1] };
  m = /^(?:type|enter)\s+(.+?)\s+(?:into|in)\s+([A-Za-z_]\w*)$/i.exec(q);
  if (m)
    return {
      type: "input",
      control: m[2],
      value: m[1].replace(/^['"]|['"]$/g, ""),
    };
  m = /^select\s+([A-Za-z_]\w*)$/i.exec(q);
  if (m) return { type: "select", value: m[1] };
  m =
    /^move(?:\s+(?:it|the selected control))?\s+(left|right|up|down)(?:\s+(\d+)(?:\s+(?:pixels?|px))?)?$/i.exec(
      q,
    );
  if (m)
    return {
      type: "move",
      direction: m[1].toLowerCase(),
      distance: Math.min(640, Number(m[2] || 8)),
    };
  if (
    /^(?:start|run)(?:\s+(?:the\s+)?(?:form|preview|debugging))?$|^press f5$/i.test(
      q,
    )
  )
    return { type: "start" };
  if (/^stop(?:\s+(?:the\s+)?(?:preview|form|debugging))$/i.test(q))
    return { type: "stop" };
  if (/^(undo|redo)$/i.test(q)) return { type: q.toLowerCase() };
  if (/^(?:review|check|explain)\s+(?:my|the|this)\s+form$/i.test(q))
    return { type: "review" };
  return null;
}
export const roastReply = (text) =>
  `Alright, legend. Less guessing, more debugging. ${text}`;
