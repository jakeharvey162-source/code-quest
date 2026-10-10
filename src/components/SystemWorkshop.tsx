import { requestQuest } from "../lib/workshop-quests.mjs";
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
  sourceFiles = [],
}: {
  sourceFiles?: { path: string; text: string }[];
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
  const requiredNames = project.template.map(c => c.name);
  const presentControls = requiredNames.filter(name=>controls.some(c=>c.name===name));
  const expectedHandlers = project.template.map(c=>c.eventClick).filter(Boolean);
  const definedHandlers = expectedHandlers.filter(name=>new RegExp("(?<![a-zA-Z0-9_])"+name+"\\\\s*\\\\(").test(code));
  const milestones = [
    {key:"controls",name:"Form designer",passed:presentControls.length===requiredNames.length,
      detail:presentControls.length+" / "+requiredNames.length+" required named controls"},
    {key:"handlers",name:"C# event handlers",passed:definedHandlers.length===expectedHandlers.length && expectedHandlers.length>0,
      detail:definedHandlers.length+" / "+expectedHandlers.length+" event handlers detected"},
    {key:"tests",name:"Run and verify",passed:Boolean(result&&result.behavior===50),
      detail:result?"Behavior score: "+result.behavior+" / 50":"Run Grade my system to test with the actual C# compiler"},
    {key:"export",name:"Windows delivery",passed:false,
      detail:"Export .sln and .csproj from this studio; build and run natively in Visual Studio on Windows"}
  ];
  useEffect(() => {
    onBusy(busy);
    if (wasBusy.current && !busy) gradeButton.current?.focus();
    wasBusy.current = busy;
  }, [busy]);
  useEffect(() => {
    setResult(null);
    setStatus("");
  }, [controls, code, sourceFiles]);
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
        sourceFiles,
      );
      if (controller.signal.aborted) return;
      setResult(mark);
      if (mark.total >= 60) requestQuest("system-builder");
      if (mark.total >= 90) requestQuest("system-master");
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
        <div className="system-mission" aria-label="Complete app mission progress">
          <p className="eyebrow">BUILD A FULL WINDOWS APPLICATION</p>
          <h3>Developer's mission board</h3>
          <p>Go from a blank designer to a tested solution. You do not need an expensive computer to practice the workflow; native Windows execution happens after you export.</p>
          <div className="system-mission-grid">
            {milestones.map((item,index)=><div className={"system-mission-step "+(item.passed?"done":"")} key={item.key}>
              <span className="system-mission-marker">{item.passed?"✓":String(index+1).padStart(2,"0")}</span>
              <div><strong>{item.name}</strong><small>{item.detail}</small></div>
            </div>)}
          </div>
          <p className="muted">The last step is completed on a real Windows computer. The CodeQuest browser preview emulates supported WinForms behavior and is not the Windows Forms runtime.</p>
        </div>
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
