import { useEffect, useRef, useState } from "react";
import { consoleChallenges } from "../lib/console-challenges.mjs";
import {
  terminalCSharpSource,
  terminalStdout,
} from "../lib/terminal-input.mjs";
import { runCSharp, cancelRun } from "../lib/compiler";
import { normalizedOutput } from "../lib/debug-practice.mjs";
import type { Progress } from "../lib/progress";
import type { UpdateProgress } from "./LessonView";
import InteractiveConsole from "./InteractiveConsole";
import CodeEditor from "./CodeEditor";
export default function BeginnerConsole({
  progress,
  update,
}: {
  progress: Progress;
  update: UpdateProgress;
}) {
  const [id, setId] = useState("hello"),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState("");
  const owned = useRef(false),
    generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
      if (owned.current) cancelRun();
    },
    [],
  );
  const challenge = consoleChallenges.find((c) => c.id === id)!,
    key = "console-challenge-" + id,
    source = progress.drafts[key] ?? challenge.starter;
  async function check() {
    if (owned.current) return;
    owned.current = true;
    setBusy(true);
    const version = ++generation.current;
    try {
      let passed = 0;
      for (const [input, expected] of challenge.cases) {
        const prepared = terminalCSharpSource(source, input);
        const run = await runCSharp(prepared.source, setResult);
        if (version !== generation.current) return;
        const actual = terminalStdout(run.stdOut, prepared.marker) || "";
        if (run.success && !run.stdErr && normalizedOutput(actual) === expected)
          passed++;
        else {
          setResult(
            `Test ${passed + 1} failed. Input: ${input}\nExpected: ${expected}\nActual: ${run.diagnostics.map((d) => d.message).join("\n") || run.stdErr || actual}`,
          );
          return;
        }
      }
      setResult(`All ${passed} tests passed! Try another console challenge.`);
      update((p) => ({
        ...p,
        steps: {
          ...p.steps,
          "console-practice": [
            ...new Set([...(p.steps["console-practice"] || []), id]),
          ],
        },
      }));
    } catch (e) {
      if (version === generation.current) setResult(String(e));
    } finally {
      if (version === generation.current) {
        owned.current = false;
        setBusy(false);
      }
    }
  }
  return (
    <section className="page">
      <a href="#challenges">← All code challenges</a>
      <h1>Start with the console</h1>
      <p>Practise input, output, variables and loops before building forms.</p>
      <label>
        Console challenge
        <select
          aria-label="Console challenge"
          disabled={busy}
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setResult("");
          }}
        >
          {consoleChallenges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </label>
      <h2>{challenge.title}</h2>
      <p>{challenge.brief}</p>
      <CodeEditor
        label="Beginner C# code"
        value={source}
        onChange={(value) => {
          if (owned.current) return;
          setResult("");
          update((p) => ({ ...p, drafts: { ...p.drafts, [key]: value } }));
        }}
      />
      <div className="button-row">
        <button disabled={busy} onClick={() => void check()}>
          Check console solution
        </button>
        <button
          disabled={!busy}
          onClick={() => {
            generation.current++;
            cancelRun();
            owned.current = false;
            setBusy(false);
            setResult("Check stopped.");
          }}
        >
          Stop checking
        </button>
      </div>
      <p role="status" style={{ whiteSpace: "pre-wrap" }}>
        {result}
      </p>
      <InteractiveConsole key={id} source={source} />
      <details>
        <summary>Need a worked example?</summary>
        <pre style={{ overflow: "auto" }}>{challenge.solution}</pre>
      </details>
    </section>
  );
}
