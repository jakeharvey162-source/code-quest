// Source paths are portable project-relative names, never filesystem paths.
// Keep them safe for browser storage, ZIP export and Windows extraction alike.
const deviceName = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const reservedSource = /^(?:Program|Form1|Form1\.Designer)\.cs$/i;
function validFolder(folder) {
  return (
    typeof folder === "string" &&
    (folder === "" ||
      folder
        .split("/")
        .every(
          (part) =>
            /^[A-Za-z_][A-Za-z0-9_-]*$/.test(part) && !deviceName.test(part),
        ))
  );
}
export function validSourcePath(path) {
  if (typeof path !== "string" || path.length > 240) return false;
  const parts = path.split("/"),
    name = parts.pop();
  return (
    validFolder(parts.join("/")) &&
    // Empty leading/trailing and repeated separators must not normalize away.
    parts.every(Boolean) &&
    /^[A-Za-z_]\w*\.cs$/.test(name) &&
    !deviceName.test(name.slice(0, -3)) &&
    !reservedSource.test(name)
  );
}
export function validSourceFiles(value) {
  return (
    Array.isArray(value) &&
    value.length <= 20 &&
    value.every(
      (f) =>
        f &&
        // Previously saved root identifiers must remain readable, including
        // Windows device names. New items/moves use strict validSourcePath.
        (validSourcePath(f.path) ||
          (typeof f.path === "string" &&
            /^[A-Za-z_]\w*\.cs$/.test(f.path) &&
            !reservedSource.test(f.path))) &&
        typeof f.text === "string" &&
        f.text.length <= 50000,
    ) &&
    new Set(value.map((f) => f.path.toLowerCase())).size === value.length
  );
}
function requireSourceFiles(files) {
  if (!validSourceFiles(files))
    throw new Error(
      "Invalid source files. Use up to 20 uniquely named C# files.",
    );
}
export function renameSourceFile(files, from, to) {
  requireSourceFiles(files);
  if (!files.some((file) => file.path === from))
    throw new Error("Choose an existing C# file.");
  if (!validSourcePath(to))
    throw new Error(
      "Use a relative C# path such as Models/Account.cs. Main and generated files are reserved.",
    );
  const next = files.map((file) =>
    file.path === from ? { ...file, path: to } : file,
  );
  if (!validSourceFiles(next))
    throw new Error("That file already exists. Choose another path.");
  return next;
}
export function removeSourceFile(files, path) {
  requireSourceFiles(files);
  if (!files.some((file) => file.path === path))
    throw new Error("Choose an existing C# file.");
  return files.filter((file) => file.path !== path);
}
// Renderers retain the full path as identity so equal filenames in different
// folders stay separate. Empty folders are not persisted as project content.
export function sourceTree(files, main = "Program.cs") {
  requireSourceFiles(files);
  if (!/^(?:Program|Form1)\.cs$/.test(main))
    throw new Error("Choose Program.cs or Form1.cs as the main file.");
  const roots = [];
  for (const path of [main, ...files.map((file) => file.path)].sort()) {
    let children = roots,
      parent = "";
    const parts = path.split("/");
    for (let index = 0; index < parts.length; index++) {
      const name = parts[index],
        current = parent ? parent + "/" + name : name;
      const type = index === parts.length - 1 ? "file" : "folder";
      let node = children.find(
        (child) => child.path.toLowerCase() === current.toLowerCase(),
      );
      if (!node) {
        node = {
          type,
          name,
          path: current,
          ...(type === "folder" ? { children: [] } : {}),
        };
        children.push(node);
      }
      parent = current;
      children = node.children;
    }
  }
  const order = (nodes) => {
    nodes.sort((a, b) =>
      a.type === b.type
        ? a.name.toLowerCase() < b.name.toLowerCase()
          ? -1
          : a.name.toLowerCase() > b.name.toLowerCase()
            ? 1
            : a.name < b.name
              ? -1
              : 1
        : a.type === "folder"
          ? -1
          : 1,
    );
    for (const node of nodes) if (node.children) order(node.children);
    return nodes;
  };
  return order(roots);
}
export function classFile(name, kind = "class", folder = "") {
  if (
    !/^[A-Za-z_]\w*$/.test(name) ||
    /^(class|namespace|public|private|protected|internal|void|int|string|bool|double|decimal|float|object|interface|abstract|enum|static|new|using|base|this|return|Form1|Program)$/.test(
      name,
    )
  )
    throw new Error("Use a C# name such as Account or Student.");
  if (!["class", "interface", "abstract class", "enum"].includes(kind))
    throw new Error("Choose a supported C# item.");
  const path = (folder ? folder + "/" : "") + name + ".cs";
  if (!validFolder(folder) || !validSourcePath(path))
    throw new Error(
      "Use a relative folder such as Models. Main and generated filenames are reserved.",
    );
  return {
    path,
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
