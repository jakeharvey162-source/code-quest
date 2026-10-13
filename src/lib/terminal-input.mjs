import { compileProject } from "./source-files.mjs";
const literal = (text) => '@"' + text.replaceAll('"', '""') + '"';
export function terminalCSharpSource(source, input) {
  if (typeof input !== "string" || input.length > 20000)
    throw Error("Keep standard input below 20,000 characters.");
  const id = crypto.randomUUID().replaceAll("-", "");
  const name = "CodeQuestTerminalInput_" + id,
    marker = "CQWRITE_" + id + "|";
  // The shipped trimmed .NET Console exposes WriteLine but omits Write/ReadLine.
  // Adapt these two methods without changing strings/comments or stored source.
  const tokens =
    /\/\/[^\n]*|\/\*[\s\S]*?\*\/|(?<raw>"{3,})[\s\S]*?\k<raw>|@"(?:[^"]|"")*"|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|\b(?:global::)?(?:System\s*\.\s*)?Console\s*\.\s*(?<operation>Write|ReadLine)\b/g;
  const rewritten = source.replace(tokens, (text, ...args) => {
    const operation = args.at(-1)?.operation;
    return operation ? "global::" + name + "." + operation : text;
  });
  const lines = input ? input.split(/\r?\n/) : [];
  const helper = `\ninternal static class ${name} {
 private static string[] lines=new string[]{${lines.map(literal).join(",")}};
 private static int index=0;
 public static string ReadLine() { return index<lines.Length?lines[index++]:null; }
 public static void Write(object value) { Write(value==null?"":value.ToString()); }
 public static void Write(char value) { Write(value.ToString()); }
 public static void Write(char[] value) { Write(new string(value)); }
 public static void Write(string format,params object[] values) { Write(global::System.String.Format(format,values)); }
 public static void Write(string value) { global::System.Console.WriteLine(${literal(marker)}+global::System.Convert.ToBase64String(global::System.Text.Encoding.UTF8.GetBytes(value??""))); }
}\n`;
  return { source: compileProject(rewritten, []) + helper, marker };
}
export function terminalStdout(output, marker) {
  if (!output) return output;
  return output
    .split(/(?<=\n)/)
    .map((line) => {
      if (!line.startsWith(marker)) return line;
      try {
        return new TextDecoder().decode(
          Uint8Array.from(atob(line.slice(marker.length).trim()), (c) =>
            c.charCodeAt(0),
          ),
        );
      } catch {
        return line;
      }
    })
    .join("");
}
