import { useState, useRef, useEffect } from "react";
import DebugRepairLab from "./DebugRepairLab";
import ContinuousPractice from "./ContinuousPractice";
import CodeEditor from "./CodeEditor";
import {
  codeChallenges,
  codingRemix,
  challengeProgram,
  challengeResults,
} from "../lib/code-challenges.mjs";
import { runCSharp, cancelRun } from "../lib/compiler";
import { localDay, type Progress } from "../lib/progress";
import type { UpdateProgress } from "./LessonView";
export default function CodeChallenges({
  progress,
  update,
  initialId,
}: {
  initialId?: string;
  progress: Progress;
  update: UpdateProgress;
}) {
  const [id, setId] = useState(
      codeChallenges.find((c) => c.id === initialId)?.id ||
        (progress.drafts["coding-selected"] === "practice-remix"
          ? "practice-remix"
          : codeChallenges.find(
              (c) => c.id === progress.drafts["coding-selected"],
            )?.id) ||
        codeChallenges[0].id,
    ),
    [level, setLevel] = useState("all"),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("Choose a challenge. Predict, code, test."),
    [results, setResults] = useState<{ passed: boolean; actual: string }[]>([]),
    [hint, setHint] = useState(false);
  useEffect(() => {
    if (initialId && codeChallenges.some((c) => c.id === initialId)) {
      generation.current++;
      if (lock.current) cancelRun();
      lock.current = false;
      setBusy(false);
      setId(initialId);
      setResults([]);
      setHint(false);
    }
  }, [initialId]);
  const generation = useRef(0);
  const lock = useRef(false);
  useEffect(
    () => () => {
      generation.current++;
      if (lock.current) cancelRun();
    },
    [],
  );
  const remixRound = Math.max(
    0,
    Math.min(1e9, Number(progress.drafts["coding-remix-round"]) || 0),
  );
  const challenge =
    id === "practice-remix"
      ? codingRemix(remixRound)
      : codeChallenges.find((c) => c.id === id)!;
  const source = progress.drafts["challenge-" + id] ?? challenge.starter;
  function edit(value: string) {
    if (lock.current) return;
    setResults([]);
    setStatus("Edited. Run tests to check this version.");
    update((p) => ({
      ...p,
      drafts: { ...p.drafts, ["challenge-" + id]: value },
    }));
  }
  async function test() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setResults([]);
    const version = ++generation.current;
    const token = "CQCH_" + crypto.randomUUID().replaceAll("-", "");
    try {
      const run = await runCSharp(
        challengeProgram(challenge, source, token),
        setStatus,
      );
      if (version !== generation.current) return;
      if (!run.success || run.stdErr) {
        setStatus(
          run.diagnostics.map((d) => d.id + ": " + d.message).join("\n") ||
            run.stdErr ||
            "Compilation failed.",
        );
        return;
      }
      const rows = challengeResults(challenge, run.stdOut || "", token);
      setResults(rows);
      if (rows.every((r) => r.passed)) {
        update((p) => ({
          ...p,
          steps: {
            ...p.steps,
            "code-challenges": [
              ...new Set([...(p.steps["code-challenges"] || []), id]),
            ],
          },
          activity: [...new Set([...p.activity, localDay()])].slice(-365),
        }));
        setStatus(
          "All tests passed! " +
            challenge.xp +
            " XP earned once. Try the next challenge.",
        );
      } else
        setStatus(
          "Some tests failed. Read the actual result, fix one thing, and try again.",
        );
    } catch (e) {
      if (version === generation.current)
        setStatus(e instanceof Error ? e.message : "Run failed.");
    } finally {
      if (version === generation.current) {
        setBusy(false);
        lock.current = false;
      }
    }
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== "F5" || e.defaultPrevented) return;
      e.preventDefault();
      if (e.shiftKey) cancelRun();
      else void test();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [id, source]);
  return (
    <section className="page challenge-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE EXAM TRAINING ARENA</p>
          <h1>Code challenges</h1>
          <p>
            Real C# tests. Earn XP by fixing the code, not just clicking Run.
          </p>
        </div>
        <div className="button-row">
          <a href="#challenges/daily">Daily repair project →</a>
          <a href="#leaderboard">Compare your rank →</a>
        </div>
      </div>
      <p><a className="primary" href="#challenges/console">New to C#? Start with Console.Write and ReadLine →</a></p>
      <DebugRepairLab
        progress={progress}
        update={update}
        initialId={initialId}
      />
      <ContinuousPractice progress={progress} update={update} />
      <div className="challenge-layout">
        <aside className="challenge-picker">
          <button
            disabled={busy}
            onClick={() => {
              update((p) => {
                const drafts: Record<string, string> = {
                  ...p.drafts,
                  "coding-selected": "practice-remix",
                  "coding-remix-round": String((remixRound + 1) % 1e9),
                };
                delete drafts["challenge-practice-remix"];
                return { ...p, drafts };
              });
              setId("practice-remix");
              setResults([]);
              setHint(false);
              setLevel("all");
              setStatus(
                "New coding remix. Fill in the method and test the edge cases.",
              );
            }}
          >
            New coding remix →
          </button>
          <label>
            Difficulty
            <select
              aria-label="Challenge difficulty"
              value={level}
              onChange={(e) => {
                const next = e.target.value;
                setLevel(next);
                if (next !== "all" && challenge.level !== next) {
                  const nextId = codeChallenges.find(
                    (c) => c.level === next,
                  )!.id;
                  setId(nextId);
                  update((p) => ({
                    ...p,
                    drafts: { ...p.drafts, "coding-selected": nextId },
                  }));
                  setHint(false);
                  setResults([]);
                  setStatus("Ready to test your solution.");
                }
              }}
              disabled={busy}
            >
              {["all", "easy", "intermediate", "advanced", "pro"].map((l) => (
                <option key={l} value={l}>
                  {l === "all" ? "All levels" : l}
                </option>
              ))}
            </select>
          </label>
          {codeChallenges
            .filter((c) => level === "all" || c.level === level)
            .map((c) => (
              <button
                key={c.id}
                disabled={busy}
                aria-pressed={c.id === id}
                onClick={() => {
                  setId(c.id);
                  update((p) => ({
                    ...p,
                    drafts: { ...p.drafts, "coding-selected": c.id },
                  }));
                  setHint(false);
                  setResults([]);
                  setStatus("Ready to test your solution.");
                }}
              >
                <b>{c.title}</b>
                <small>
                  {c.level} · {c.xp} XP{" "}
                  {(progress.steps["code-challenges"] || []).includes(c.id)
                    ? "· Completed"
                    : ""}
                </small>
              </button>
            ))}
        </aside>
        <article className="challenge-workspace">
          <div className="challenge-brief">
            <p className="eyebrow">
              {challenge.level} · +{challenge.xp} XP
            </p>
            <h2>{challenge.title}</h2>
            <p>{challenge.brief}</p>
            <p>
              Write the method below. System, LINQ and Globalization are already
              imported.
            </p>
            <code>{challenge.signature}</code>
            <button disabled={busy} onClick={() => setHint(!hint)}>
              {hint ? "Hide hint" : "Ask Tor for a hint"}
            </button>
            {hint && <p className="challenge-hint">Tor: {challenge.hint}</p>}
          </div>
          <CodeEditor
            value={source}
            onChange={edit}
            plain={progress.settings.editorMode === "plain"}
            label="Challenge solution"
          />
          <div className="editor-actions">
            <button
              className="primary"
              disabled={busy}
              onClick={() => void test()}
            >
              {busy ? "Testing…" : "Run challenge tests"}
            </button>
            {busy && <button onClick={cancelRun}>Stop tests</button>}
            <button disabled={busy} onClick={() => edit(challenge.starter)}>
              Reset this challenge
            </button>
          </div>
          <pre className="run-feedback" role="status">
            {status}
          </pre>
          {results.length > 0 && (
            <ol className="challenge-results">
              {results.map((r, i) => (
                <li key={i}>
                  <b>
                    {r.passed ? "✓ Pass" : "✕ Fix"} · Test {i + 1}
                  </b>
                  <span>
                    {challenge.cases[i]?.[0] ||
                      [
                        "Reject zero months",
                        "Reject negative months",
                        "Reject negative principal",
                      ][i - challenge.cases.length]}
                  </span>
                  <code>Actual: {r.actual}</code>
                  <small>
                    Expected: {challenge.cases[i]?.[1] || "ArgumentException"}
                  </small>
                </li>
              ))}
            </ol>
          )}
          <p className="muted">
            Practice tests cover the listed scenarios. XP is awarded once per
            solved challenge. Use WinForms → System workshop to build and grade
            a complete ATM, loan or banking app.
          </p>
        </article>
      </div>
    </section>
  );
}
