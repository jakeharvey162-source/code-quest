import { useEffect, useRef, useState } from "react";
import { equipmentRecovery } from "../lib/equipment-practice.mjs";
import { download } from "../lib/download";
import CodeEditor from "./CodeEditor";
import {
  debugExercises,
  traceProgram,
  readTrace,
  normalizedOutput,
} from "../lib/debug-practice.mjs";
import {
  terminalCSharpSource,
  terminalStdout,
} from "../lib/terminal-input.mjs";
import { cancelRun, runCSharp } from "../lib/compiler";
import type { Progress } from "../lib/progress";
import type { UpdateProgress } from "./LessonView";

type Frame = {
  line: number;
  output: string;
  watches: { name: string; value: string }[];
};
export default function DebugRepairLab({
  progress,
  update,
  initialId,
}: {
  initialId?: string;
  progress: Progress;
  update: UpdateProgress;
}) {
  const [id, setId] = useState(
    () =>
      debugExercises.find((e) => e.id === initialId)?.id ||
      debugExercises.find((e) => e.id === progress.drafts["repair-selected"])
        ?.id ||
      debugExercises[0].id,
  );
  const [labOpen, setLabOpen] = useState(
    () => !!initialId && debugExercises.some((e) => e.id === initialId),
  );
  useEffect(() => {
    if (initialId && debugExercises.some((e) => e.id === initialId)) {
      generation.current++;
      if (owner.current) cancelRun();
      owner.current = false;
      setBusy(false);
      setLabOpen(true);
      setId(initialId);
      clear();
    }
  }, [initialId]);
  const exercise = debugExercises.find((e) => e.id === id)!;
  const source = progress.drafts["repair-code-" + id] ?? exercise.starter;
  const input = progress.drafts["repair-input-" + id] ?? exercise.cases[0][0];
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState(
      "Find one fault, predict the result, then run a test.",
    );
  const [output, setOutput] = useState(""),
    [frames, setFrames] = useState<Frame[]>([]),
    [cursor, setCursor] = useState(0);
  const [breaks, setBreaks] = useState<number[]>([]),
    [checks, setChecks] = useState<
      { input: string; expected: string; actual: string; passed: boolean }[]
    >([]);
  const [hint, setHint] = useState(false);
  const owner = useRef(false),
    generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
      if (owner.current) cancelRun();
    },
    [],
  );
  const frame = frames[cursor];
  function save(key: string, value: string) {
    update((p) => ({ ...p, drafts: { ...p.drafts, [key]: value } }));
  }
  function clear() {
    setFrames([]);
    setCursor(0);
    setOutput("");
    setChecks([]);
    setBreaks([]);
    setStatus("Changed. Run again to inspect this version.");
  }
  function select(next: string) {
    setId(next);
    save("repair-selected", next);
    clear();
    setHint(false);
  }
  async function execute(trace = false, check = false) {
    if (owner.current) return;
    owner.current = true;
    setBusy(true);
    setFrames([]);
    setOutput("");
    setChecks([]);
    setCursor(0);
    const version = ++generation.current;
    try {
      const rows = [];
      const cases = check ? exercise.cases : [[input, ""]];
      for (const [stdin, expected] of cases) {
        const token = "CQTRACE" + crypto.randomUUID().replaceAll("-", "");
        const instrumented = trace
          ? traceProgram(source, token)
          : { source, points: [] };
        const prepared = terminalCSharpSource(instrumented.source, stdin);
        const result = await runCSharp(prepared.source, (text) => {
          if (generation.current === version) setStatus(text);
        });
        if (generation.current !== version) return;
        const recorded = readTrace(
          result.stdOut || "",
          token,
          instrumented.points,
        );
        const stdout = terminalStdout(recorded.output, prepared.marker) || "";
        const errors =
          result.diagnostics
            .filter((d) => String(d.severity).toLowerCase() === "error")
            .map((d) => d.id + ": " + d.message)
            .join("\n") ||
          result.stdErr ||
          (!result.success ? "Compilation failed." : "");
        setOutput(stdout);
        if (trace)
          setFrames(
            recorded.frames.map((f) => ({
              ...f,
              output: terminalStdout(f.output, prepared.marker) || "",
            })),
          );
        if (check) {
          rows.push({
            input: stdin,
            expected,
            actual: errors || stdout,
            passed: !errors && normalizedOutput(stdout) === expected,
          });
          setChecks([...rows]);
        } else {
          setStatus(
            errors ||
              (trace
                ? `Recorded ${recorded.frames.length} snapshots. Step through the recorded run; each snapshot is before the statement following its trace comment.`
                : "Run complete. Compare your output with the expected example."),
          );
        }
        if (errors && !result.success) break;
      }
      if (check) {
        const passed =
          rows.length === exercise.cases.length && rows.every((r) => r.passed);
        setStatus(
          passed
            ? "All repair checks passed. Try another case, or change the input to test your assumptions."
            : `${rows.filter((r) => r.passed).length}/${exercise.cases.length} checks passed. Fix the first failure and retry.`,
        );
        if (passed) save("repair-complete-" + id, "yes");
      }
    } catch (e) {
      if (generation.current === version)
        setStatus(e instanceof Error ? e.message : "Run failed.");
    } finally {
      if (generation.current === version) {
        owner.current = false;
        setBusy(false);
      }
    }
  }
  function step() {
    setCursor((n) => Math.min(n + 1, frames.length));
  }
  function resume() {
    const next = frames.findIndex(
      (f, i) => i > cursor && breaks.includes(f.line),
    );
    setCursor(next < 0 ? frames.length : next);
  }
  function toggle(line: number) {
    setBreaks((old) =>
      old.includes(line) ? old.filter((n) => n !== line) : [...old, line],
    );
  }
  return (
    <details
      open={labOpen}
      onToggle={(e) => setLabOpen(e.currentTarget.open)}
      className="repair-lab"
      onKeyDown={(e) => {
        if (!["F5", "F9", "F10"].includes(e.key)) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.key === "F5") {
          if (e.shiftKey) {
            if (owner.current) cancelRun();
          } else if (frames.length && !busy) resume();
          else void execute(false);
        }
        if (e.key === "F10" && !busy) step();
        if (e.key === "F9" && frame) toggle(frame.line);
      }}
    >
      <summary>
        <strong>Debug repair lab</strong>
        <span>Broken code · console input · recorded steps</span>
      </summary>
      <div className="repair-content">
        <p className="eyebrow">REPAIR → TEST → EXPLAIN</p>
        <h2>Find the bug before it finds your marks</h2>
        <p>
          Start with compilation errors, then check runtime errors, then wrong
          answers. These original exercises practise the concepts in your
          course; they are not predictions of your assessment.
        </p>
        <label>
          Repair mission
          <select
            aria-label="Repair mission"
            disabled={busy}
            value={id}
            onChange={(e) => select(e.target.value)}
          >
            {debugExercises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.category}: {e.title}
                {progress.drafts["repair-complete-" + e.id] === "yes"
                  ? " · Practised"
                  : ""}
              </option>
            ))}
          </select>
        </label>
        <h3>{exercise.title}</h3>
        <p>{exercise.brief}</p>
        {id === "equipment-booking" && (
          <details className="equipment-paper">
            <summary>
              Your full practice task: project recovery and booking rules
            </summary>
            <p>
              The browser mission below adapts the logic from your Practice
              Question 15 OCT project and Equipment Booking question paper. The
              native source ZIP remains deliberately broken for repair.
            </p>
            <ol>
              {equipmentRecovery.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <p>
              <b>Required record format:</b>{" "}
              StudentNumber|StudentName|EquipmentNumber|EquipmentType|BookingDays|AccessoriesRequired|BookingStatus
            </p>
            <p>
              The supplied ZIP has no bookings.txt. Console LOAD commands are
              test fixtures, not recovered history.
            </p>
            <button
              onClick={async () => {
                try {
                  const { equipmentProject } =
                    await import("../lib/equipment-project.mjs");
                  download(
                    "EquipmentBooking-Practice.zip",
                    equipmentProject().buffer,
                    "application/zip",
                  );
                } catch {
                  setStatus(
                    "Project download could not load. Reconnect and retry.",
                  );
                }
              }}
            >
              Download practice Windows project
            </button>
            <p>
              Native checks: back up → build → inspect Form Load and Click
              subscriptions → recover the actual file → reopen → test invalid
              capture and statistics. Record what you changed and the evidence
              for each check.
            </p>
            <a href="#tor">Ask Tor for a recovery plan →</a>
          </details>
        )}
        <p>
          <b>Example input:</b>{" "}
          <code>{JSON.stringify(exercise.cases[0][0])}</code>{" "}
          <b>Expected output:</b> <code>{exercise.cases[0][1]}</code>
        </p>
        <CodeEditor
          value={source}
          onChange={(v) => {
            if (!owner.current) {
              save("repair-code-" + id, v);
              clear();
            }
          }}
          plain={progress.settings.editorMode === "plain"}
          label="Repair C# program"
        />
        <label>
          Console input · one answer per line
          <textarea
            aria-label="Repair console input"
            rows={3}
            maxLength={20000}
            disabled={busy}
            value={input}
            onChange={(e) => {
              save("repair-input-" + id, e.target.value);
              clear();
            }}
          />
        </label>
        <p className="muted">
          Supply input before Run. Each Console.ReadLine() reads the next line;
          exhausted input returns null. Change the input and run again to test a
          different conversation.
        </p>
        <div className="editor-actions">
          <button
            className="primary"
            disabled={busy}
            onClick={() => void execute()}
          >
            Run console
          </button>
          <button disabled={busy} onClick={() => void execute(true)}>
            Record &amp; trace
          </button>
          <button disabled={busy} onClick={() => void execute(false, true)}>
            Check repairs
          </button>
          {busy && <button onClick={cancelRun}>Stop repair run</button>}
          <button
            disabled={busy}
            onClick={() => {
              save("repair-code-" + id, exercise.starter);
              clear();
            }}
          >
            Reset repair code
          </button>
          <button onClick={() => setHint(!hint)} aria-expanded={hint}>
            Repair hint
          </button>
        </div>
        {hint && <p className="challenge-hint">Tor: {exercise.hint}</p>}
        <p role="status" aria-live="polite" className="repair-status">
          {status}
        </p>
        <div className="repair-console">
          <h3>Console output</h3>
          <pre role="log" aria-label="Repair console output">
            {frame ? frame.output : output || "No output yet."}
          </pre>
        </div>
        <details>
          <summary>How recorded debugging works</summary>
          <p>
            Record &amp; trace runs real C# to completion and captures values at{" "}
            <code>// @trace name, days</code> comments. Add these comments
            inside a method or executable block, before the statement you want
            to inspect. Use only existing, initialized variables or
            side-effect-free properties. Keep braces around loop/if bodies when
            adding trace points.
          </p>
          <p>
            F10 advances one recorded snapshot. F9 toggles a replay breakpoint
            at the selected snapshot. F5 continues to the next replay
            breakpoint. This is a recorded trace, not a paused live .NET
            debugger: it cannot change variables mid-run or step into arbitrary
            methods with F11. For a full Windows debugger, export your WinForms
            project and open it in Visual Studio.
          </p>
          <p>
            Trace mode stops after 150 snapshots to keep the browser responsive.
            Run console and Check repairs use your original program without
            probes.
          </p>
        </details>
        {frames.length > 0 && (
          <section aria-label="Recorded debugger" className="repair-debugger">
            <div className="editor-actions">
              <button disabled={busy} onClick={() => setCursor(0)}>
                Restart replay
              </button>
              <button disabled={busy || cursor >= frames.length} onClick={step}>
                Step snapshot (F10)
              </button>
              <button
                disabled={busy || cursor >= frames.length}
                onClick={resume}
              >
                Continue replay (F5)
              </button>
              <button onClick={() => setCursor(frames.length)}>
                Show final output
              </button>
            </div>
            <p aria-live="polite">
              {frame
                ? `Snapshot ${cursor + 1}/${frames.length}, at trace line ${frame.line}. The following statement has not executed yet.`
                : "End of recorded trace."}
            </p>
            <div className="repair-trace-grid">
              <div className="repair-source" aria-label="Recorded source">
                {source.split("\n").map((line, i) => (
                  <div key={i} data-current={frame?.line === i + 1}>
                    <span>{i + 1}</span>
                    <code>{line || " "}</code>
                  </div>
                ))}
              </div>
              <div>
                <h4>Watched values</h4>
                {frame ? (
                  <dl>
                    {frame.watches.map((w) => (
                      <div key={w.name}>
                        <dt>{w.name}</dt>
                        <dd>{w.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p>Restart replay to inspect values.</p>
                )}
                <h4>Replay breakpoints</h4>
                {[...new Set(frames.map((f) => f.line))].map((line) => (
                  <label key={line}>
                    <input
                      type="checkbox"
                      checked={breaks.includes(line)}
                      onChange={() => toggle(line)}
                    />
                    Trace line {line}
                  </label>
                ))}
              </div>
            </div>
          </section>
        )}
        {checks.length > 0 && (
          <ol className="challenge-results">
            {checks.map((row, i) => (
              <li key={i}>
                <b>
                  {row.passed ? "✓ Pass" : "✕ Fix"} · Case {i + 1}
                </b>
                <code>Input: {JSON.stringify(row.input)}</code>
                <code>Expected: {row.expected}</code>
                <code>Actual: {row.actual || "(empty)"}</code>
              </li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}
