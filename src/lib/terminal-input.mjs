import { compileProject } from "./source-files.mjs";
const literal = (text) => '@"' + text.replaceAll('"', '""') + '"';
export function terminalCSharpSource(source, input, options = {}) {
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
  const lines = options.lines ?? (input ? input.split(/\r?\n/) : []);
  if (
    !Array.isArray(lines) ||
    lines.some((l) => typeof l !== "string") ||
    lines.join("\n").length > 20000 ||
    lines.length > 200
  )
    throw Error("Keep terminal input below 200 lines and 20,000 characters.");
  const waitingMarker = "CQINPUT_" + id;
  const helper = `\ninternal static class ${name} {
 private static string[] lines=new string[]{${lines.map(literal).join(",")}};
 private static int index=0;
 public static string ReadLine() {
   if(index<lines.Length) { string line=lines[index++]; ${options.interactive ? "global::System.Console.WriteLine(line);" : ""} return line; }
   ${options.interactive && !options.eof ? "global::System.Console.WriteLine(" + literal(waitingMarker) + "); throw new global::System.InvalidOperationException(" + literal(waitingMarker) + ");" : "return null;"}
 }
 public static void Write(object value) { Write(value==null?"":value.ToString()); }
 public static void Write(char value) { Write(value.ToString()); }
 public static void Write(char[] value) { Write(new string(value)); }
 public static void Write(string format,params object[] values) { Write(global::System.String.Format(format,values)); }
 public static void Write(string value) { global::System.Console.WriteLine(${literal(marker)}+global::System.Convert.ToBase64String(global::System.Text.Encoding.UTF8.GetBytes(value??""))); }
}\n`;
  return {
    source: compileProject(rewritten, []) + helper,
    marker,
    waitingMarker,
  };
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
