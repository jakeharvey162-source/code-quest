import { unzip, strFromU8 } from "fflate";
const MAX_ARCHIVE = 10 * 1024 * 1024;
const MAX_TEXT = 2 * 1024 * 1024;
const MAX_TOTAL = 8 * 1024 * 1024;
const readable = /\.(cs|csproj|sln|json|txt|md|csv|xml|config)$/i;
export async function readProject(name, bytes) {
  if (bytes.byteLength > MAX_ARCHIVE) throw new Error("Choose a file smaller than 10 MB.");
  if (!/\.zip$/i.test(name)) {
    if (!readable.test(name)) throw new Error("Choose a ZIP, C# or text project file.");
    if (bytes.byteLength > MAX_TEXT) throw new Error("Text files must be smaller than 2 MB.");
    return [{ name, text: strFromU8(bytes) }];
  }
  let count = 0, total = 0, rejected = "";
  const files = await new Promise((resolve, reject) => {
    unzip(bytes, { filter(entry) {
      count++;
      if (count > 300) { rejected = "This ZIP contains too many entries (maximum 300)."; return false; }
      const path = entry.name.replace(/\\/g, "/");
      if (path.startsWith("/") || /^[a-z]:/i.test(path) || path.split("/").includes("..")) {
        rejected = "This ZIP contains unsafe file paths."; return false;
      }
      if (!readable.test(path) || /(^|\/)(bin|obj|node_modules|\.git|__MACOSX)(\/|$)/i.test(path)) return false;
      total += entry.originalSize;
      if (entry.originalSize > MAX_TEXT || total > MAX_TOTAL) {
        rejected = "The ZIP expands to too much text. Limit each file to 2 MB and total text to 8 MB."; return false;
      }
      return true;
    } }, (error, result) => error ? reject(new Error("This ZIP could not be read. Use a valid, unencrypted ZIP.")) : resolve(result));
  });
  if (rejected) throw new Error(rejected);
  const result = Object.entries(files).map(([name, bytes]) => ({ name, text: strFromU8(bytes) })).sort((a, b) => a.name.localeCompare(b.name));
  if (!result.length) throw new Error("No readable C# or text files were found in this ZIP.");
  return result;
}
