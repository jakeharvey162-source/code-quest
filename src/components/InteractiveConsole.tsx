import { useEffect, useRef, useState } from "react";
import {
  terminalCSharpSource,
  terminalStdout,
} from "../lib/terminal-input.mjs";
import { runCSharp, cancelRun } from "../lib/compiler";
export default function InteractiveConsole({ source }: { source: string }) {
  const [output, setOutput] = useState(""),
    [status, setStatus] = useState("Ready to run."),
    [busy, setBusy] = useState(false),
    [waiting, setWaiting] = useState(false),
    [answer, setAnswer] = useState("");
  const lines = useRef<string[]>([]),
    generation = useRef(0),
    owned = useRef(false),
    field = useRef<HTMLInputElement>(null);
  function stop() {
    generation.current++;
    if (owned.current) cancelRun();
    owned.current = false;
    setBusy(false);
    setWaiting(false);
    setStatus("Stopped. Your code is kept.");
  }
  useEffect(() => {
    stop();
    setOutput("");
    setStatus("Ready to run this version.");
    return () => {
      generation.current++;
      if (owned.current) cancelRun();
      owned.current = false;
    };
  }, [source]);
  useEffect(() => {
    if (waiting) field.current?.focus();
  }, [waiting]);
  async function execute(inputs: string[], eof = false) {
    if (owned.current) return;
    const version = ++generation.current;
    owned.current = true;
    setBusy(true);
    setWaiting(false);
    try {
      const prepared = terminalCSharpSource(source, "", {
        interactive: true,
        lines: inputs,
        eof,
      });
      const result = await runCSharp(prepared.source, (text) => {
        if (version === generation.current) setStatus(text);
      });
      if (version !== generation.current) return;
      const raw = result.stdOut || "",
        needsInput = raw.includes(prepared.waitingMarker);
      setOutput(
        terminalStdout(
          raw
            .replace(prepared.waitingMarker + "\n", "")
            .replace(prepared.waitingMarker, ""),
          prepared.marker,
        ) || "",
      );
      const diagnostics = result.diagnostics.filter(
        (d) => String(d.severity).toLowerCase() === "error",
      );
      if (needsInput && !diagnostics.length) {
        setWaiting(true);
        setStatus("Waiting for your input. Type a value and press Enter.");
      } else
        setStatus(
          diagnostics.map((d) => d.id + ": " + d.message).join("\n") ||
            result.stdErr ||
            (result.success ? "Program finished." : "Run failed."),
        );
    } catch (error) {
      if (version === generation.current)
        setStatus(error instanceof Error ? error.message : "Run failed.");
    } finally {
      if (version === generation.current) {
        owned.current = false;
        setBusy(false);
      }
    }
  }
  return (
    <section className="settings-card" aria-label="Interactive C# console">
      <h3>Try your program</h3>
      <p>
        Answer each Console.ReadLine prompt below. Each answer reruns your code
        with earlier inputs, so random values and file changes may differ.
      </p>
      <div className="button-row">
        <button
          className="primary"
          disabled={busy}
          onClick={() => {
            lines.current = [];
            setAnswer("");
            setOutput("");
            void execute([]);
          }}
        >
          Run console
        </button>
        <button disabled={!busy && !waiting} onClick={stop}>
          Stop console
        </button>
        <button
          disabled={!waiting || busy}
          onClick={() => void execute(lines.current, true)}
        >
          End input (EOF)
        </button>
      </div>
      <pre
        className="terminal-output"
        aria-label="Console output"
        style={{
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          minHeight: 100,
          maxHeight: 400,
          overflow: "auto",
        }}
      >
        {output || "Your program’s output will appear here."}
      </pre>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!waiting || busy) return;
          const next = [...lines.current, answer];
          lines.current = next;
          setAnswer("");
          void execute(next);
        }}
      >
        <label>
          Console input
          <input
            ref={field}
            autoComplete="off"
            disabled={!waiting || busy}
            value={answer}
            maxLength={2000}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </label>
        <button disabled={!waiting || busy}>Send input</button>
      </form>
      <p role="status" style={{ whiteSpace: "pre-wrap" }}>
        {status}
      </p>
    </section>
  );
}
