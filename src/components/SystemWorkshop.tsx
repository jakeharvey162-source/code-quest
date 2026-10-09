import { useEffect, useRef, useState } from "react";
import { systemProjects } from "../lib/system-projects.mjs";
import { gradeSystem } from "../lib/system-grader";
import { cancelRun } from "../lib/compiler";
import { readText, writeText } from "../lib/local-data";
import type { Control } from "./FormDesigner";
export default function SystemWorkshop({
  controls,
  code,
  onLoad,
  disabled = false,
  onBusy,
}: {
  controls: Control[];
  code: string;
  onLoad: (project: any, worked: boolean) => void;
  disabled?: boolean;
  onBusy: (busy: boolean) => void;
}) {
  const [id, setId] = useState(() =>
      readText("cq-system-project", "atm-system"),
    ),
    [result, setResult] = useState<any>(null),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  const gradeButton = useRef<HTMLButtonElement>(null),
    wasBusy = useRef(false);
  const project = systemProjects.find((p) => p.id === id) || systemProjects[0];
  useEffect(() => {
    onBusy(busy);
    if (wasBusy.current && !busy) gradeButton.current?.focus();
    wasBusy.current = busy;
  }, [busy]);
  useEffect(() => {
    setResult(null);
    setStatus("");
  }, [controls, code]);
  useEffect(
    () => () => {
      if (request.current) {
        request.current.abort();
        cancelRun();
      }
    },
    [],
  );
  async function grade() {
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setResult(null);
    try {
      const mark = await gradeSystem(
        project,
        controls,
        code,
        setStatus,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setResult(mark);
      setStatus("Checks finished. Your design and code are unchanged.");
      writeText(
        "cq-system-report",
        JSON.stringify({
          project: project.id,
          ...mark,
          date: new Date().toISOString(),
        }),
      );
    } catch (error) {
      if (!controller.signal.aborted)
        setStatus(
          error instanceof Error ? error.message : "Checks could not finish.",
        );
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }
  return (
    <details className="system-workshop">
      <summary>System workshop · ATM, loans and banking</summary>
      <section aria-label="Build a complete system">
        <div>
          <p className="eyebrow">BUILD • RUN • BREAK • IMPROVE</p>
          <h2>Build a complete system</h2>
          <p>
            50 marks for your controls and code structure, 50 for behaviour
            tested with real C#. Incomplete code still earns credit for the
            parts you get right.
          </p>
        </div>
        <label>
          System project
          <select
            aria-label="System project"
            value={project.id}
            disabled={busy || disabled}
            onChange={(e) => {
              setId(e.target.value);
              writeText("cq-system-project", e.target.value);
              setResult(null);
              setStatus("");
            }}
          >
            {systemProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <ul>
          {project.requirements.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <details>
          <summary>Required control names and test cases</summary>
          <p>
            {project.template.map((c) => `${c.type}: ${c.name}`).join(" · ")}
          </p>
          <ol>
            {project.tests.map((t) => (
              <li key={t.name}>{t.name}</li>
            ))}
          </ol>
        </details>
        <div className="system-actions">
          <button
            disabled={busy || disabled}
            onClick={() => {
              setResult(null);
              onLoad(project, false);
            }}
          >
            Load starter form
          </button>
          <button
            disabled={busy || disabled}
            onClick={() => {
              setResult(null);
              onLoad(project, true);
            }}
          >
            Load worked example
          </button>
          <button
            ref={gradeButton}
            className="primary"
            disabled={busy || disabled}
            onClick={grade}
          >
            Grade my system
          </button>
          {busy && (
            <button
              onClick={() => {
                request.current?.abort();
                cancelRun();
                request.current = null;
                setBusy(false);
                setStatus("Checks stopped. Your code is safe.");
              }}
            >
              Stop system checks
            </button>
          )}
        </div>
        <p role="status">
          {status ||
            "Start with the skeleton, write the events, run your app, then check it here."}
        </p>
        {result && (
          <div className="system-report">
            <h3>{result.total}/100 · practice grade</h3>
            <p>
              Design and structure: {result.design.earned}/50 · Tested
              behaviour: {result.behavior}/50
            </p>
            <ul>
              {Object.entries(result.design.breakdown).map(([area, mark]) => (
                <li key={area}>
                  {area}: {String(mark)} marks
                </li>
              ))}
            </ul>
            {result.results.map((r: any) => (
              <article
                key={r.name}
                className={r.passed ? "case-pass" : "case-fail"}
              >
                <b>
                  {r.passed ? "✓" : "○"} {r.name}
                </b>
                <p>{r.detail}</p>
              </article>
            ))}
            <p>
              Tor:{" "}
              {result.total === 100
                ? "That system cooked. Try new inputs and explain each event before you export it."
                : "Keep the marks you earned. Fix the first failing case, then run the checks again."}
            </p>
            <p className="muted">
              These named scenarios are practice checks, not an official
              university mark or proof that every possible input works.
            </p>
          </div>
        )}
      </section>
    </details>
  );
}
