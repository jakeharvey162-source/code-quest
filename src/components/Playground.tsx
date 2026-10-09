import { useEffect, useState } from "react";
import { Play, Square, Download, RotateCcw } from "lucide-react";
import CodeEditor from "./CodeEditor";
import ProjectReader from "./ProjectReader";
import { VoiceControls } from "./VoiceControls";
import { runCSharp, cancelRun } from "../lib/compiler";
import { observeWorkspace } from "../lib/workspace-observation";
import { download } from "../lib/download";
import type { Progress } from "../lib/progress";
import type { UpdateProgress } from "./LessonView";
import SourceExplorer, {
  loadSourceFiles,
  saveSourceFiles,
  type SourceFile,
} from "./SourceExplorer";
import { compileProject, validSourceFiles } from "../lib/source-files.mjs";
import { requestQuest } from "../lib/workshop-quests.mjs";
import { zipSync, strToU8 } from "fflate";
const starter =
  'using System;\n\nConsole.WriteLine("Hello, CodeQuest!");\n\n// Try your own C# here.\n';
export default function Playground({
  progress,
  update,
}: {
  progress: Progress;
  update: UpdateProgress;
}) {
  const [busy, setBusy] = useState(false),
    [output, setOutput] = useState("Your output will appear here."),
    [ok, setOk] = useState(true);
  const code = progress.drafts.scratchpad ?? starter;
  const [files, setFiles] = useState(loadSourceFiles),
    [active, setActive] = useState("Program.cs"),
    [fileError, setFileError] = useState("");
  function changeFiles(next: SourceFile[]) {
    try {
      saveSourceFiles(next);
      setFiles(next);
      setFileError("");
    } catch (e) {
      setFileError(String(e));
    }
  }
  const visibleCode =
    active === "Program.cs"
      ? code
      : files.find((f) => f.path === active)?.text || "";
  function edit(value: string) {
    if (active === "Program.cs") setCode(value);
    else
      changeFiles(
        files.map((f) => (f.path === active ? { ...f, text: value } : f)),
      );
  }

  useEffect(() => () => cancelRun(), []);
  useEffect(() => {
    const start = (e: KeyboardEvent) => {
      if (e.key !== "F5" || e.defaultPrevented) return;
      e.preventDefault();
      if (e.shiftKey) cancelRun();
      else if (!busy) run();
    };
    window.addEventListener("keydown", start);
    return () => window.removeEventListener("keydown", start);
  }, [busy, code, files]);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        observeWorkspace({
          page: "playground",
          mode: busy ? "Running Program.cs" : "Editing Program.cs",
          controls: 0,
          selected: "",
          caption: "",
          issues: ok ? [] : ["Fix the first compiler error."],
          output: output.slice(0, 800),
        }),
      500,
    );
    return () => clearTimeout(timer);
  }, [busy, output, ok]);
  function setCode(value: string) {
    update((p) => ({ ...p, drafts: { ...p.drafts, scratchpad: value } }));
  }
  async function run() {
    setBusy(true);
    try {
      const result = await runCSharp(compileProject(code, files), setOutput);
      setOk(result.success);
      if (result.success) {
        requestQuest("first-run");
        if (
          files.some((f) =>
            new RegExp("\\bnew\\s+" + f.path.slice(0, -3) + "\\s*\\(").test(
              code,
            ),
          )
        )
          requestQuest("oop-run");
      }
      setOutput(
        result.success
          ? (result.stdOut || "(Program finished with no console output)") +
              (result.stdErr ? "\n" + result.stdErr : "")
          : result.diagnostics.map((d) => `${d.id}: ${d.message}`).join("\n"),
      );
    } catch (error) {
      setOk(false);
      setOutput(error instanceof Error ? error.message : "Run failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="page playground-page"
      onKeyDown={(e) => {
        if (e.key === "F5") {
          e.preventDefault();
          if (e.shiftKey) cancelRun();
          else if (!busy) run();
        }
      }}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR C# WORKBENCH</p>
          <h1>What happens if…?</h1>
          <p>
            A real C# scratchpad. Try an idea, run it, and read what the
            compiler tells you.
          </p>
        </div>
        <button onClick={() => download("Program.cs", code, "text/plain")}>
          <Download size={16} />
          Download C#
        </button>
      </div>
      <SourceExplorer
        files={files}
        onChange={changeFiles}
        active={active}
        onSelect={setActive}
        disabled={busy}
      />
      {fileError && <p role="alert">{fileError}</p>}
      <button
        onClick={() =>
          download(
            "CodeQuestConsole.zip",
            zipSync(
              Object.fromEntries(
                Object.entries({
                  "Program.cs": code,
                  "CodeQuestConsole.csproj":
                    '<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net8.0</TargetFramework><ImplicitUsings>enable</ImplicitUsings></PropertyGroup></Project>',
                  ...Object.fromEntries(files.map((f) => [f.path, f.text])),
                }).map(([path, text]) => [path, strToU8(text)]),
              ),
            ),
            "application/zip",
          )
        }
      >
        Export C# project ZIP
      </button>
      <details className="shortcut-help">
        <summary>C# snippets & shortcuts</summary>
        <p>
          Type else, if, for, foreach, class, ctor, prop, cw or try on its own
          line, then press Tab twice. Tab moves through snippet fields.
          Ctrl+Space suggests names; Ctrl+K then Ctrl+C comments; Ctrl+K then
          Ctrl+U uncomments; Ctrl+F searches; Ctrl+H opens replace; Ctrl+G jumps
          to a line; Alt+↑/↓ moves lines; Ctrl+D duplicates. Escape then Tab
          leaves the editor. Edits save automatically.
        </p>
      </details>
      <ProjectReader
        onOpenProject={(imported) => {
          const main = imported.filter((f) =>
            /(^|\/)Program\.cs$/i.test(f.name),
          );
          if (main.length !== 1)
            throw new Error(
              "Choose a console project with one Program.cs file. Native forms should be restored in the WinForms workspace.",
            );
          const extras = imported
            .filter((f) => /\.cs$/i.test(f.name) && f !== main[0])
            .map((f) => ({ path: f.name.split("/").at(-1)!, text: f.text }));
          if (!validSourceFiles(extras))
            throw new Error(
              "Use up to 20 C# item files with unique names, each smaller than 50 KB.",
            );
          saveSourceFiles(extras);
          setFiles(extras);
          setCode(main[0].text);
          setActive("Program.cs");
        }}
        onOpenCode={(text) => {
          setActive("Program.cs");
          setCode(text);
        }}
        settings={progress.settings}
      />
      <div className="editor-top">
        <span>{active}</span>
        <span>LOCAL ROSLYN COMPILER</span>
      </div>
      <CodeEditor
        value={visibleCode}
        onChange={edit}
        plain={progress.settings.editorMode === "plain"}
      />
      <div className="editor-actions">
        <button onClick={() => setCode(starter)} disabled={busy}>
          <RotateCcw size={15} />
          Reset example
        </button>
        {busy ? (
          <button onClick={cancelRun}>
            <Square size={15} />
            Stop program
          </button>
        ) : (
          <button className="primary" onClick={run}>
            <Play size={15} />
            Run C#
          </button>
        )}
      </div>
      <pre role="status" className={"run-feedback " + (ok ? "success" : "")}>
        {output}
      </pre>
      <VoiceControls settings={progress.settings} text={output} />
      <p className="muted">
        Console.WriteLine output is captured. Console.ReadLine interactive input
        and native WinForms are not supported in the browser runtime. Your code
        runs on your own device; programs stop after 10 seconds. The compiler
        loads about 40 MB on the first run.
      </p>
    </section>
  );
}
