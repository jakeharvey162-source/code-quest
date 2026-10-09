export const snippets = {
  if: "if (${true})\n{\n    ${}\n}",
  else: "else\n{\n    ${}\n}",
  ifelse: "if (${true})\n{\n    ${}\n}\nelse\n{\n    \n}",
  for: "for (int ${i} = 0; ${i} < ${length}; ${i}++)\n{\n    ${}\n}",
  foreach: "foreach (${var} ${item} in ${collection})\n{\n    ${}\n}",
  while: "while (${true})\n{\n    ${}\n}",
  do: "do\n{\n    ${}\n} while (${true});",
  switch:
    "switch (${value})\n{\n    case ${0}:\n        ${}\n        break;\n    default:\n        break;\n}",
  try: "try\n{\n    ${}\n}\ncatch (Exception ${ex})\n{\n    throw;\n}",
  tryf: "try\n{\n    ${}\n}\nfinally\n{\n    \n}",
  class: "public class ${MyClass}\n{\n    ${}\n}",
  interface: "public interface ${IMyInterface}\n{\n    ${}\n}",
  struct: "public struct ${MyStruct}\n{\n    ${}\n}",
  enum: "public enum ${MyEnum}\n{\n    ${None}\n}",
  namespace: "namespace ${MyNamespace}\n{\n    ${}\n}",
  prop: "public ${int} ${MyProperty} { get; set; }",
  propfull:
    "private ${int} ${myField};\npublic ${int} ${MyProperty}\n{\n    get { return ${myField}; }\n    set { ${myField} = value; }\n}",
  cw: 'Console.WriteLine(${"message"});',
  svm: "static void Main(string[] args)\n{\n    ${}\n}",
  ctor: "public ${MyClass}()\n{\n    ${}\n}",
  using: "using (${var resource = expression})\n{\n    ${}\n}",
  lock: "lock (${syncRoot})\n{\n    ${}\n}",
  region: "#region ${Name}\n${}\n#endregion",
  abstract:
    "public abstract class ${BaseClass}\n{\n    public abstract ${void} ${Method}();\n}",
  virtual: "public virtual ${void} ${Method}()\n{\n    ${}\n}",
  override: "public override ${void} ${Method}()\n{\n    ${}\n}",
};
export function snippetAt(source, cursor) {
  const match = /([A-Za-z_]\w*)$/.exec(source.slice(0, cursor));
  if (!match || !snippets[match[1]]) return null;
  const from = cursor - match[1].length;
  if (from && /[\w.]/.test(source[from - 1])) return null;
  // Snippets only expand standalone tokens, not a member such as account.class.
  if (source.slice(0, from).split("\n").at(-1).trim()) return null;
  let template = snippets[match[1]];
  if (match[1] === "ctor") {
    const names = [
      ...source.slice(0, from).matchAll(/\bclass\s+([A-Za-z_]\w*)/g),
    ];
    if (names.length)
      template = template.replace("${MyClass}", names.at(-1)[1]);
  }
  const indent = /^[ \t]*/.exec(source.slice(0, from).split("\n").at(-1))[0];
  return {
    word: match[1],
    from,
    to: cursor,
    template: template.replaceAll("\n", "\n" + indent),
  };
}
export function plainSnippet(item) {
  let first = null,
    text = "";
  const regex = /\$\{([^}]*)\}/g;
  let pos = 0;
  for (const m of item.template.matchAll(regex)) {
    text += item.template.slice(pos, m.index);
    if (!first) first = { from: text.length, to: text.length + m[1].length };
    text += m[1];
    pos = m.index + m[0].length;
  }
  text += item.template.slice(pos);
  return { text, selection: first || { from: text.length, to: text.length } };
}
