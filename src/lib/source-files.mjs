export function validSourceFiles(value) {
  return (
    Array.isArray(value) &&
    value.length <= 20 &&
    new Set(value.map((f) => f?.path?.toLowerCase())).size === value.length &&
    value.every(
      (f) =>
        f &&
        /^[A-Za-z_]\w*\.cs$/.test(f.path) &&
        !/^(Program|Form1|Form1\.Designer)\.cs$/i.test(f.path) &&
        typeof f.text === "string" &&
        f.text.length <= 50000,
    )
  );
}
export function classFile(name, kind = "class") {
  if (
    !/^[A-Za-z_]\w*$/.test(name) ||
    /^(class|namespace|public|private|protected|internal|void|int|string|bool|double|decimal|float|object|interface|abstract|enum|static|new|using|base|this|return|Form1|Program)$/.test(
      name,
    )
  )
    throw new Error("Use a C# name such as Account or Student.");
  if (!["class", "interface", "abstract class", "enum"].includes(kind))
    throw new Error("Choose a supported C# item.");
  return {
    path: name + ".cs",
    text:
      "using System;\n\npublic " +
      kind +
      " " +
      name +
      "\n{\n    // Add your " +
      (kind === "interface" ? "member contracts" : "members") +
      " here.\n}\n",
  };
}
// Roslyn's browser entry point accepts one source string. Preserve normal project
// files on export, and combine their leading using directives for browser runs.
export function compileProject(main, files = []) {
  if (!validSourceFiles(files))
    throw new Error(
      "Invalid source files. Use up to 20 uniquely named C# files.",
    );
  const imports = [],
    bodies = [];
  for (const source of [main, ...files.map((f) => f.text)]) {
    let body = source.replace(/^\uFEFF/, "");
    const prefix =
      /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*(?:(?:global\s+)?using\s+(?:static\s+)?[A-Za-z_][\w.\s=:<>]*;)/;
    while (prefix.test(body)) {
      const match = prefix.exec(body)[0];
      imports.push(match);
      body = body.slice(match.length);
    }
    body = body.replace(
      /^(\s*)namespace\s+([\w.]+)\s*;([\s\S]*)$/,
      (_, space, name, rest) =>
        space + "namespace " + name + "\n{" + rest + "\n}",
    );
    bodies.push(body);
  }
  return imports.join("\n") + "\n" + bodies.join("\n\n");
}
