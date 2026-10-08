import { useRef, useState } from "react";
import { readProject } from "../lib/project-reader.mjs";
import { VoiceControls } from "./VoiceControls";
import type { Settings } from "../lib/progress";
type ProjectFile = { name: string; text: string };
export default function ProjectReader({ onOpenCode, onRestoreForm, settings }: {
  onOpenCode: (text: string) => void;
  onRestoreForm?: (text: string) => void;
  settings: Settings;
}) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const request = useRef(0);
  const current = files[selected];
  return <details className="project-reader">
    <summary>Open ZIP / project files</summary>
    <p>Read your project files here, then choose what to open. Files stay on this device. ZIP, C#, solution and text files are supported; PDFs and images are not read.</p>
    <label>Choose project file<input type="file" accept=".zip,.cs,.csproj,.sln,.json,.txt,.md,.csv,.xml,.config" disabled={busy} onChange={async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      const id = ++request.current;
      setBusy(true); setStatus("Reading project…");
      try {
        if (file.size > 10 * 1024 * 1024) throw new Error("Choose a file smaller than 10 MB.");
        const next = await readProject(file.name, new Uint8Array(await file.arrayBuffer()));
        if (id !== request.current) return;
        setFiles(next); setSelected(0); setStatus(`${next.length} readable file${next.length === 1 ? "" : "s"} loaded.`);
      } catch (error) { setStatus(error instanceof Error ? error.message : "Could not read this file."); }
      finally { if (id === request.current) setBusy(false); }
    }} /></label>
    <p role="status">{status}</p>
    {current && <>
      <label>Project file<select aria-label="Project file" value={selected} onChange={(event) => setSelected(Number(event.target.value))}>{files.map((file, index) => <option key={file.name} value={index}>{file.name}</option>)}</select></label>
      <pre className="code-preview" aria-label="Uploaded file contents">{current.text}</pre>
      <div className="button-row">
        {/\.cs$/i.test(current.name) && !/\.Designer\.cs$/i.test(current.name) && <button onClick={() => onOpenCode(current.text)}>Open selected C# in editor</button>}
        {onRestoreForm && /(^|\/)codequest-form\.json$/i.test(current.name) && <button onClick={() => onRestoreForm(current.text)}>Restore form from project</button>}
      </div>
      <VoiceControls settings={settings} text={current.text} />
    </>}
  </details>;
}
