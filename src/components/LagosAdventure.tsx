import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  LockKeyhole,
  Sparkles,
  Lightbulb,
  Store,
  RadioTower,
  Trophy,
} from "lucide-react";
import CodeEditor from "./CodeEditor";
import { AdventureJournal } from "./AdventureProgress";
import LagosScene from "./LagosScene";
import {
  lagosMissions,
  completedMissions,
  unlockedMission,
  adventureDraftKey,
  awardMission,
} from "../lib/lagos-adventure.mjs";
import { challengeProgram, challengeResults } from "../lib/code-challenges.mjs";
import { runCSharp, cancelRun } from "../lib/compiler";
import { localDay, type Progress } from "../lib/progress";
import type { UpdateProgress } from "./LessonView";
import "../adventure.css";

const icons = [Lightbulb, Store, RadioTower];
const oversizedDraftMessage =
  "This draft is over 50,000 characters. Shorten it before saving or testing. The full text remains in this editor; your last saved draft is unchanged.";
export default function LagosAdventure({
  progress,
  update,
  initialId,
  onNavigate,
}: {
  progress: Progress;
  update: UpdateProgress;
  initialId?: string;
  onNavigate: (route: string) => void;
}) {
  const done = completedMissions(progress.steps);
  const requested = lagosMissions.find((m) => m.id === initialId);
  const mission =
    requested && unlockedMission(progress.steps, requested.id)
      ? requested
      : lagosMissions[done.length] || lagosMissions[2];
  const index = lagosMissions.indexOf(mission);
  const [source, setSource] = useState(
    () => progress.drafts[adventureDraftKey(mission.id)] ?? mission.starter,
  );
  const missionDone = done.includes(mission);
  // Synchronous source snapshot: a fast Test click must never compile an older
  // React render (especially after an oversized unsaved editor edit).
  const sourceRef = useRef(source);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const [status, setStatus] = useState(
    "Your code runs locally. Try a repair when you’re ready.",
  );
  const [rows, setRows] = useState<{ passed: boolean; actual: string }[]>([]);
  const [hintCount, setHintCount] = useState(0);
  const [dialogue, setDialogue] = useState(
    missionDone ? mission.success : mission.intro,
  );
  const [celebrate, setCelebrate] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const selectedId = mission.id;
  function tell(kind: string, text: string) {
    setDialogue(text);
    window.dispatchEvent(
      new CustomEvent("cq-adventure-tor", {
        detail: { missionId: selectedId, kind, text },
      }),
    );
  }
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    setRows([]);
    setHintCount(0);
    setCelebrate(false);
    const draft = progress.drafts[adventureDraftKey(selectedId)] ?? mission.starter;
    sourceRef.current = draft;
    setSource(draft);
    const greeting = missionDone ? mission.success : mission.intro;
    setDialogue(greeting);
    setStatus("Your code runs locally. Try a repair when you’re ready.");
    window.dispatchEvent(
      new CustomEvent("cq-adventure-tor", {
        detail: { missionId: selectedId, kind: "intro", text: greeting },
      }),
    );
    return () => {
      generation.current++;
      if (lock.current) cancelRun();
      lock.current = false;
    };
  }, [selectedId]);
  function edit(value: string) {
    if (lock.current) {
      generation.current++;
      cancelRun();
      lock.current = false;
      setBusy(false);
    }
    setRows([]);
    setCelebrate(false);
    // Keep the editor and compiler source identical, including unsaved oversized
    // edits. Refusing a persistence write must never run an older saved repair.
    sourceRef.current = value;
    setSource(value);
    if (value.length > 50000) {
      setStatus(oversizedDraftMessage);
      return;
    }
    setStatus(
      "Draft saved in your progress. Test this version to check the repair.",
    );
    update((p) => ({
      ...p,
      drafts: { ...p.drafts, [adventureDraftKey(selectedId)]: value },
    }));
  }
  async function run() {
    if (lock.current) return;
    const submittedSource = sourceRef.current;
    if (submittedSource.length > 50000) {
      setStatus(oversizedDraftMessage);
      return;
    }
    lock.current = true;
    setBusy(true);
    setRows([]);
    setCelebrate(false);
    const version = ++generation.current;
    const token = "CQLAGOS_" + crypto.randomUUID().replaceAll("-", "");
    try {
      const result = await runCSharp(
        challengeProgram(mission, submittedSource, token),
        setStatus,
      );
      if (version !== generation.current) return;
      if (
        !result.success ||
        result.stdErr ||
        result.diagnostics.some((d) => d.severity.toLowerCase() === "error")
      ) {
        setStatus(
          result.diagnostics.map((d) => d.id + ": " + d.message).join("\n") ||
            result.stdErr ||
            "Compilation failed.",
        );
        tell(
          "error",
          "The compiler found something to fix. Read the first error below; check your spelling, types and semicolons. Your progress is safe.",
        );
        return;
      }
      const results = challengeResults(mission, result.stdOut || "", token);
      setRows(results);
      if (
        results.length === mission.cases.length &&
        results.every((r) => r.passed)
      ) {
        update((p) => awardMission(p, selectedId, results, localDay()));
        setCelebrate(!missionDone);
        setStatus(
          missionDone
            ? "Repair confirmed again. Your achievement and XP were already earned."
            : `Every scenario passed! ${mission.achievement} earned · +${mission.xp} XP once.`,
        );
        tell("success", mission.success);
      } else {
        setStatus(
          "Not repaired yet. Compare actual and expected results, then try another idea. No XP lost.",
        );
        tell(
          "hint",
          "That experiment gave us a clue. Trace the first failing input through your method. I have a hint if you want one.",
        );
      }
    } catch (error) {
      if (version === generation.current)
        setStatus(
          error instanceof Error
            ? error.message
            : "The compiler could not finish. Your code is safe.",
        );
    } finally {
      if (version === generation.current) {
        lock.current = false;
        setBusy(false);
      }
    }
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key !== "F5" || event.defaultPrevented) return;
      event.preventDefault();
      if (event.shiftKey) {
        if (lock.current) cancelRun();
      } else void run();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [source, selectedId, missionDone]);
  return (
    <section className="page adventure-page">
      <nav className="adventure-nav" aria-label="Story navigation">
        <a href="#home">← World</a>
        <a href="#adventure" aria-current="page">
          Missions
        </a>
        <a href="#terminal">Code tools</a>
        <a href="#classes">Community / Classes</a>
        <a href="#progress">My progress</a>
        <a href="#learn">Leave story · Lessons</a>
      </nav>
      <div className="adventure-title">
        <div>
          <p className="eyebrow">CHAPTER 01 / THE CITY NEEDS YOUR IDEAS</p>
          <h1>
            Lagos: Rookie Street<span>.</span>
          </h1>
          <p>
            The lights are out. The market is quiet. Let’s change that, one
            repair at a time.
          </p>
        </div>
        <div className="adventure-chapter-progress">
          <b>
            {done.length}
            <span> / 3</span>
          </b>
          <span>missions repaired</span>
          <progress aria-label="Lagos repairs" value={done.length} max={3} />
        </div>
      </div>
      {!progress.drafts["lagos-intro-seen"] && (
        <aside className="adventure-welcome">
          <div>
            <b>Meet your teammate, TOR.</b>
            <p>
              I’ll explain the mission and offer hints. You write the code that
              changes this street. No timer, no penalty for trying.
            </p>
          </div>
          <button
            onClick={() =>
              update((p) => ({
                ...p,
                drafts: { ...p.drafts, "lagos-intro-seen": "yes" },
              }))
            }
          >
            Let’s explore / Skip intro <ArrowRight size={16} />
          </button>
        </aside>
      )}
      <div className={"adventure-world" + (celebrate ? " is-celebrating" : "")}>
        <LagosScene repaired={done.length} />
        <div className="adventure-scene-caption">
          <span>
            <span className="adventure-live-dot" /> YOUR LIVING NEIGHBORHOOD
          </span>
          <b>
            {
              [
                "A quiet street. A fresh start.",
                "Power restored. The street is glowing.",
                "The market is open for business.",
                "Connected. Rookie Street is back!",
              ][done.length]
            }
          </b>
        </div>
      </div>
      <ol className="adventure-missions" aria-label="Lagos mission path">
        {lagosMissions.map((m, i) => {
          const earned = done.includes(m),
            available = unlockedMission(progress.steps, m.id),
            Icon = icons[i];
          return (
            <li key={m.id}>
              <button
                disabled={!available || busy}
                aria-current={m.id === selectedId ? "step" : undefined}
                onClick={() => {
                  onNavigate("adventure/" + m.id);
                }}
              >
                <span className="adventure-mission-icon">
                  {earned ? (
                    <Check size={22} />
                  ) : available ? (
                    <Icon size={22} />
                  ) : (
                    <LockKeyhole size={20} />
                  )}
                </span>
                <span>
                  <small>
                    {i === 2 ? "03 / CHAPTER BOSS" : `0${i + 1} / MISSION`}
                  </small>
                  <b>{m.title}</b>
                  <span>
                    {earned
                      ? "Repaired · achievement earned"
                      : !available
                        ? "Finish the previous repair"
                        : progress.drafts[adventureDraftKey(m.id)]
                          ? "In progress · continue repair"
                          : "Available · your next repair"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="adventure-workspace">
        <aside className="adventure-brief">
          <p className="eyebrow">
            MISSION 0{index + 1} · {["OPERATORS", "CONDITIONS", "LOOPS"][index]}
          </p>
          <h2 ref={heading} tabIndex={-1}>
            {mission.title}
          </h2>
          <p>{mission.brief}</p>
          <code>{mission.signature}</code>
          <p className="adventure-reward">
            <Trophy size={17} /> {mission.achievement} · {mission.xp} XP
          </p>
          <a href={"#learn/" + mission.lessonId}>
            Need the basics? Open the{" "}
            {["operators", "conditions", "loops"][index]} lesson →
          </a>
          <div className="adventure-dialogue">
            <div className="adventure-tor-label">
              <span className="tor-mark" aria-hidden="true">
                t<span>• •</span>
              </span>
              <b>TOR / YOUR TEAMMATE</b>
            </div>
            <p role="status">{dialogue}</p>
            <button
              disabled={busy}
              onClick={() => {
                const count = Math.min(hintCount + 1, mission.hints.length);
                setHintCount(count);
                tell("hint", mission.hints[count - 1]);
              }}
            >
              Ask TOR for a hint{" "}
              {hintCount > 0 && `(${hintCount}/${mission.hints.length})`}
            </button>
            {hintCount > 0 && (
              <small>Hints are free. Your reward stays the same.</small>
            )}
          </div>
        </aside>
        <article className="adventure-editor">
          <header>
            <span>
              <span className="adventure-live-dot" /> REPAIR WORKSPACE
            </span>
            <small>C# / Solution.cs</small>
          </header>
          <CodeEditor
            label="Mission C# solution"
            value={source}
            onChange={edit}
            plain={progress.settings.editorMode === "plain"}
          />
          <div className="adventure-editor-actions">
            <button
              className="primary"
              disabled={busy}
              onClick={() => void run()}
            >
              {busy ? "Testing repair…" : "Test repair"}{" "}
              <ArrowRight size={17} />
            </button>
            {busy && <button onClick={cancelRun}>Stop tests</button>}
            <button disabled={busy} onClick={() => edit(mission.starter)}>
              Reset code
            </button>
            <span>F5 to test · Shift+F5 to stop</span>
          </div>
          <pre className="adventure-feedback" role="status">
            {status}
          </pre>
          {rows.length > 0 && (
            <div className="adventure-results">
              <h3>Repair checks</h3>
              <ul>
                {rows.map((r, i) => (
                  <li key={i}>
                    <b>{r.passed ? "✓ Pass" : "↻ Try again"}</b>
                    <code>{mission.cases[i][0]}</code>
                    <span>
                      Expected: {mission.cases[i][1]} · Actual: {r.actual}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="adventure-local-note">
            Real C# compilation on your device. Your code is never automatically
            sent to AI. The compiler needs an initial download; it works offline
            after caching.
          </p>
        </article>
      </div>
      {missionDone && (
        <section className="adventure-success" aria-label="Mission achievement">
          <Sparkles size={27} />
          <div>
            <p className="eyebrow">
              {done.length === 3 ? "CHAPTER COMPLETE" : "REPAIR COMPLETE"}
            </p>
            <h2>{mission.achievement}</h2>
            <p>
              {done.length === 3
                ? "You restored the lights, reopened the shop, and rescued the network. Rookie Street is yours to revisit."
                : "Your code made a real change here. The next repair is ready when you are."}
            </p>
          </div>
          {index < 2 ? (
            <button
              className="primary"
              disabled={busy}
              onClick={() =>
                onNavigate("adventure/" + lagosMissions[index + 1].id)
              }
            >
              Next mission <ArrowRight size={17} />
            </button>
          ) : (
            <a className="adventure-link" href="#progress">
              View my achievements →
            </a>
          )}
        </section>
      )}
      <AdventureJournal progress={progress} />
      {done.length === 3 && (
        <section className="adventure-next">
          <p className="eyebrow">BEYOND ROOKIE STREET / PLANNED CHAPTERS</p>
          <h2>A bigger world, built carefully.</h2>
          <p>
            Next up for review: Johannesburg’s Makers Yard — repair real
            WinForms interfaces. Then Kinshasa’s Object Kingdom — bring complete
            systems to life with OOP. These story chapters aren’t playable yet.
          </p>
          <a href="#designer">Explore the existing WinForms designer →</a>{" "}
          <a href="#learn">Browse all existing lessons →</a>
        </section>
      )}
    </section>
  );
}
