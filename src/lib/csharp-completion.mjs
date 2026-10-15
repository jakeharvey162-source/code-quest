// Offline declaration/member hints, not a full C# semantic compiler service.
const keywords =
  "class public private protected internal interface abstract virtual override new return if else for foreach while using namespace string int decimal double float long bool char void static var null true false try catch finally throw out ref this base get set value async await List Console MessageBox File Convert Math".split(
    " ",
  );
const item = (label, type, detail, info = "") => ({
  label,
  type,
  detail,
  info,
  boost: type === "variable" ? 20 : type === "property" ? 15 : 0,
});
const members = {
  Console: [
    [
      "WriteLine",
      "method",
      "WriteLine(object value)",
      "Print a value followed by a newline.",
    ],
    ["Write", "method", "Write(object value)", "Print without a newline."],
    [
      "ReadLine",
      "method",
      "string ReadLine()",
      "Read the next console input line.",
    ],
  ],
  MessageBox: [
    [
      "Show",
      "method",
      "Show(string text)",
      "Show a message in a Windows Forms application.",
    ],
  ],
  File: [
    [
      "Exists",
      "method",
      "bool Exists(string path)",
      "Check whether a file exists.",
    ],
    [
      "ReadAllLines",
      "method",
      "string[] ReadAllLines(string path)",
      "Read the lines of a text file.",
    ],
    [
      "WriteAllText",
      "method",
      "WriteAllText(string path, string contents)",
      "Replace file contents.",
    ],
    [
      "AppendAllText",
      "method",
      "AppendAllText(string path, string contents)",
      "Append to existing file contents.",
    ],
  ],
  string: [
    ["Length", "property", "int Length", "Number of UTF-16 characters."],
    [
      "Trim",
      "method",
      "string Trim()",
      "Return a string with surrounding whitespace removed.",
    ],
    ["ToUpperInvariant", "method", "string ToUpperInvariant()"],
    ["ToLowerInvariant", "method", "string ToLowerInvariant()"],
    ["Contains", "method", "bool Contains(string value)"],
    ["StartsWith", "method", "bool StartsWith(string value)"],
    ["Split", "method", "string[] Split(char separator)"],
    ["Substring", "method", "string Substring(int startIndex)"],
  ],
  int: [
    ["TryParse", "method", "bool TryParse(string text, out int value)"],
    ["Parse", "method", "int Parse(string text)"],
    ["ToString", "method", "string ToString()"],
  ],
  decimal: [
    ["TryParse", "method", "bool TryParse(string text, out decimal value)"],
    ["Parse", "method", "decimal Parse(string text)"],
    ["ToString", "method", "string ToString()"],
  ],
  List: [
    ["Add", "method", "void Add(T item)"],
    ["Remove", "method", "bool Remove(T item)"],
    ["Clear", "method", "void Clear()"],
    ["Count", "property", "int Count"],
    ["Contains", "method", "bool Contains(T item)"],
  ],
  TextBox: [
    ["Text", "property", "string Text"],
    ["Clear", "method", "void Clear()"],
    ["Focus", "method", "bool Focus()"],
    ["Enabled", "property", "bool Enabled"],
  ],
  Label: [
    ["Text", "property", "string Text"],
    ["ForeColor", "property", "Color ForeColor"],
    ["BackColor", "property", "Color BackColor"],
  ],
  Button: [
    ["Text", "property", "string Text"],
    ["Enabled", "property", "bool Enabled"],
    ["Click", "property", "event Click"],
  ],
};
const tokens =
  /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)|(?<raw>"{3,})[\s\S]*?(?:\k<raw>|$)|@"(?:[^"]|"")*(?:"|$)|"(?:\\[\s\S]|[^"\\])*(?:"|$)|'(?:\\[\s\S]|[^'\\])*(?:'|$)/g;
export function maskCSharp(source) {
  return source.replace(tokens, (text) => text.replace(/[^\n]/g, " "));
}
function declarations(source) {
  const map = new Map();
  const re =
    /\b([A-Za-z_]\w*(?:\s*<[^;{}()]+>)?(?:\[\])?\??)\s+([A-Za-z_]\w*)\s*(?=[=;,)\{])/g;
  for (const m of source.matchAll(re)) {
    const type = m[1].replace(/\s/g, "");
    if (
      keywords.includes(type) &&
      ![
        "string",
        "int",
        "decimal",
        "double",
        "float",
        "long",
        "bool",
        "char",
        "var",
      ].includes(type)
    )
      continue;
    if (["return", "throw", "new", "case", "using"].includes(type)) continue;
    const property = source
      .slice(m.index + m[0].length)
      .trimStart()
      .startsWith("{");
    map.set(m[2], item(m[2], property ? "property" : "variable", type));
  }
  return map;
}
function classMembers(code, type) {
  const start = new RegExp("\\bclass\\s+" + type + "\\b[^{}]*\\{").exec(code);
  if (!start) return [];
  let depth = 1,
    end = start.index + start[0].length;
  for (; end < code.length && depth; end++) {
    if (code[end] === "{") depth++;
    if (code[end] === "}") depth--;
  }
  const body = code.slice(start.index + start[0].length, end - 1);
  const result = [];
  for (const m of body.matchAll(
    /\bpublic\s+(?:static\s+|virtual\s+|override\s+)?([\w<>\[\]?]+)\s+(\w+)\s*(\([^)]*\)|\{)/g,
  ))
    result.push(
      item(
        m[2],
        m[3].startsWith("(") ? "method" : "property",
        m[1] + " " + m[2] + (m[3].startsWith("(") ? m[3] : ""),
      ),
    );
  return result;
}
export function csharpCompletions(source, cursor, extra = "") {
  if (source.length + extra.length > 250000) return null;
  const prefix = source.slice(0, cursor),
    masked = maskCSharp(source);
  // Do not suggest identifiers inside a comment, string or char literal.
  for (const token of source.matchAll(tokens))
    if (cursor > token.index && cursor <= token.index + token[0].length)
      return null;
  const match = prefix.match(/([A-Za-z_]\w*)?$/),
    word = match?.[0] || "",
    from = cursor - word.length;
  const before = prefix.slice(0, from);
  const member = before.match(/\b([A-Za-z_]\w*)\s*\.\s*$/);
  const scope = maskCSharp(extra) + "\n" + masked.slice(0, cursor);
  const declared = declarations(scope);
  if (member) {
    const receiver = member[1];
    let type = declared.get(receiver)?.detail || receiver;
    if (type === "var") {
      const escaped = receiver.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const init = new RegExp(
        "\\bvar\\s+" + escaped + "\\s*=\\s*new\\s+(\\w+)",
      ).exec(scope);
      type = init?.[1] || type;
    }
    let builtIn =
      members[type.startsWith("List<") ? "List" : type.replace(/\?$/, "")] ||
      [];
    if (receiver === "string" && !declared.has(receiver))
      builtIn = [
        [
          "IsNullOrWhiteSpace",
          "method",
          "bool IsNullOrWhiteSpace(string value)",
        ],
        ["IsNullOrEmpty", "method", "bool IsNullOrEmpty(string value)"],
        ["Join", "method", "string Join(string separator, string[] values)"],
      ];
    if (
      declared.has(receiver) &&
      ["int", "decimal", "double", "bool"].includes(type)
    )
      builtIn = [["ToString", "method", "string ToString()"]];
    const options = [
      ...builtIn.map((m) => item(...m)),
      ...classMembers(maskCSharp(extra + "\n" + source), type),
    ];
    return options.length ? { from, options, validFor: /^\w*$/ } : null;
  }
  const options = [...declared.values()];
  for (const m of maskCSharp(extra + "\n" + source).matchAll(
    /\b(class|interface|enum)\s+(\w+)/g,
  ))
    options.push(item(m[2], "class", m[1]));
  for (const keyword of keywords)
    if (!declared.has(keyword)) options.push(item(keyword, "keyword", "C#"));
  return { from, options, validFor: /^\w*$/ };
}
