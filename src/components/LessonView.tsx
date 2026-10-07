import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Play,
  RotateCcw,
  Square,
} from "lucide-react";
import CodeEditor from "./CodeEditor";
import { VoiceControls } from "./VoiceControls";
import { runCSharp, cancelRun } from "../lib/compiler";
import { completeStep } from "../lib/progress";
import type { Progress } from "../lib/progress";
import type { Lesson } from "../curriculum";
export type UpdateProgress = (fn: (p: Progress) => Progress) => void;
const stageNames = ["See", "Predict", "Build", "Break & fix", "Apply alone"];
export default function LessonView({
  lesson,
  progress,
  update,
  onNavigate,
}: {
  lesson: Lesson;
  progress: Progress;
  update: UpdateProgress;
  onNavigate: (p: string) => void;
}) {
  const completed = progress.steps[lesson.id] || [];
  const [stage, setStage] = useState(() => Math.min(completed.length, 4)),
    [answer, setAnswer] = useState<number | null>(null),
    [feedback, setFeedback] = useState(""),
    [passed, setPassed] = useState(false),
    [busy, setBusy] = useState(false),
    [hint, setHint] = useState(0);
  const challenge = stage === 4 ? lesson.apply : lesson.build;
  const draftKey = lesson.id + ":" + stage;
  const initial = stage === 3 ? lesson.debug : challenge?.starter;
  const code = progress.drafts[draftKey] ?? initial ?? "";
  useEffect(() => {
    setFeedback("");
    setAnswer(null);
    setPassed(false);
    setHint(0);
  }, [stage]);
  useEffect(() => () => cancelRun(), []);
  function setCode(value: string) {
    update((p) => ({ ...p, drafts: { ...p.drafts, [draftKey]: value } }));
  }
  function record(step: string, final = false) {
    update((p) => completeStep(p, lesson.id, step, final));
    setPassed(true);
  }
  async function run() {
    if (!challenge) return;
    setBusy(true);
    setFeedback("Starting compiler…");
    try {
      const source =
        "using System;\nusing System.Collections.Generic;\n" +
        challenge.harness +
        "\n" +
        code;
      const result = await runCSharp(source, setFeedback);
      if (!result.success) {
        setFeedback(
          result.diagnostics
            .filter((d) => d.severity === "Error")
            .map((d) => `${d.id}: ${d.message}`)
            .join("\n") ||
            result.stdErr ||
            "The program could not run.",
        );
        setPassed(false);
      } else {
        const actual = (result.stdOut || "").trim().replace(/\r/g, "");
        const expected = challenge.expected.trim();
        if (actual === expected) {
          setFeedback("All test cases passed.\nOutput:\n" + actual);
          record(String(stage), stage === 4);
        } else {
          setPassed(false);
          setFeedback(
            `The program compiled, but the tests need another look.\nExpected:\n${expected}\nYour output:\n${actual || "(no output)"}`,
          );
        }
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Run failed.");
      setPassed(false);
    } finally {
      setBusy(false);
    }
  }
  if (lesson.kind === "quiz")
    return (
      <QuizLesson
        lesson={lesson}
        progress={progress}
        update={update}
        onNavigate={onNavigate}
      />
    );
  return (
    <section className="page lesson-page">
      <button className="text-button" onClick={() => onNavigate("learn")}>
        <ArrowLeft size={15} /> All lessons
      </button>
      <div className="page-heading">
        <div>
          <p className="eyebrow">QUEST / {lesson.track.toUpperCase()}</p>
          <h1>{lesson.title}</h1>
          <p>{lesson.concept}</p>
        </div>
        <span className="lesson-duration">{lesson.minutes} min · +160 XP</span>
      </div>
      <div className="lesson-stages">
        {stageNames.map((name, i) => (
          <button
            key={name}
            className={stage === i ? "active" : ""}
            disabled={busy || i > completed.length}
            onClick={() => setStage(i)}
          >
            <span>
              {completed.includes(String(i)) ? (
                <CheckCircle2 size={16} />
              ) : (
                i + 1
              )}
            </span>
            {name}
          </button>
        ))}
      </div>
      <div className="lesson-grid">
        <div className="lesson-workspace">
          {stage === 0 ? (
            <div className="worked-example">
              <p className="eyebrow">FIRST, SEE THE IDEA</p>
              <h2>{lesson.concept}</h2>
              <pre>{lesson.example}</pre>
              <p className="muted">
                Read the example. Next, predict what it does before writing your
                own version.
              </p>
              <button
                className="primary"
                onClick={() => {
                  record("0");
                  setStage(1);
                }}
              >
                I’m ready to predict <ArrowRight size={16} />
              </button>
            </div>
          ) : stage === 1 ? (
            <div className="prediction">
              <p className="eyebrow">THINK BEFORE YOU RUN</p>
              <h2>{lesson.prediction!.question}</h2>
              <div className="answer-options">
                {lesson.prediction!.options.map((option, i) => (
                  <label className={answer === i ? "chosen" : ""} key={option}>
                    <input
                      type="radio"
                      name="prediction"
                      checked={answer === i}
                      onChange={() => setAnswer(i)}
                    />
                    <span>{String.fromCharCode(65 + i)}</span>
                    {option}
                  </label>
                ))}
              </div>
              <button
                className="primary"
                disabled={answer === null}
                onClick={() => {
                  if (answer === lesson.prediction!.answer) {
                    record("1");
                    setFeedback("Correct. " + lesson.prediction!.explanation);
                  } else {
                    setPassed(false);
                    setFeedback("Try again. " + lesson.prediction!.explanation);
                  }
                }}
              >
                Check prediction
              </button>
              {passed && (
                <button onClick={() => setStage(2)}>
                  Build it <ArrowRight size={16} />
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="challenge-brief">
                <p className="eyebrow">
                  {stage === 3
                    ? "FIND AND FIX THE BUG"
                    : stage === 4
                      ? "YOUR TURN, WITHOUT A WALKTHROUGH"
                      : "BUILD THE IDEA"}
                </p>
                <h2>
                  {stage === 3
                    ? "Repair this version. It must pass the same tests."
                    : challenge!.task}
                </h2>
              </div>
              <div className="editor-top">
                <span>{lesson.title.replaceAll(" ", "")}.cs</span>
                <span>C# / Roslyn</span>
              </div>
              <CodeEditor
                value={code}
                onChange={setCode}
                plain={progress.settings.editorMode === "plain"}
              />
              <div className="editor-actions">
                <button onClick={() => setCode(initial || "")} disabled={busy}>
                  <RotateCcw size={15} />
                  Reset this stage
                </button>
                <div className="button-row">
                  {busy ? (
                    <button onClick={cancelRun}>
                      <Square size={14} />
                      Stop program
                    </button>
                  ) : (
                    <button className="primary" onClick={run}>
                      <Play size={15} />
                      Run tests
                    </button>
                  )}
                  {passed && stage < 4 && (
                    <button onClick={() => setStage(stage + 1)}>
                      Next stage <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
              <details className="test-cases">
                <summary>What the tests run</summary>
                <pre>{challenge!.harness}</pre>
                <b>Expected output</b>
                <pre>{challenge!.expected}</pre>
              </details>
            </>
          )}
          {feedback && (
            <pre
              role="status"
              className={"run-feedback " + (passed ? "success" : "")}
            >
              {feedback}
            </pre>
          )}
          {progress.completed.includes(lesson.id) && (
            <div className="completion-banner">
              <CheckCircle2 size={23} />
              <div>
                <b>Quest complete.</b>
                <p>
                  You applied the idea independently. Your progress is saved on
                  this device.
                </p>
              </div>
              <button onClick={() => onNavigate("learn")}>
                Choose your next quest <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
        <aside className="lesson-coach">
          <div className="tor-mark" aria-hidden="true">
            t<span>• •</span>
          </div>
          <p className="eyebrow">TOR / YOUR CODE COACH</p>
          <h2>
            {progress.settings.coach === "Teacher"
              ? "One concept, one step."
              : progress.settings.coach === "Spicy"
                ? "Make the code do the talking."
                : "You’ve got this."}
          </h2>
          <p>
            {stage === 4
              ? "Transfer the idea to this new task. Use the tests to check your understanding."
              : lesson.concept}
          </p>
          <VoiceControls
            settings={progress.settings}
            text={
              (stage === 1
                ? lesson.prediction!.question
                : stage > 1
                  ? challenge!.task
                  : lesson.concept) +
              " " +
              feedback
            }
          />
          {stage > 1 && (
            <>
              <button onClick={() => setHint(hint + 1)}>
                <Lightbulb size={16} />{" "}
                {hint ? "Another hint" : "Give me a hint"}
              </button>
              {hint > 0 && (
                <p className="hint">
                  {hint === 1
                    ? lesson.concept
                    : hint === 2
                      ? "Compare the expected outputs with your result. Check the boundary values, types, and method signature."
                      : "Trace each statement using the first test input. Which line makes the value differ?"}
                </p>
              )}
              {stage !== 4 && (
                <details>
                  <summary>Show a worked solution</summary>
                  <pre>{lesson.build!.solution}</pre>
                  <p className="muted">
                    Use this to understand the idea, then try the next stage
                    independently.
                  </p>
                </details>
              )}
            </>
          )}
          <div className="coach-note">
            <b>Real C#. Free to run.</b>
            <p>
              The compiler loads on demand (about 40 MB), then runs on your
              device. Programs stop after 10 seconds. Use Stop whenever you
              need.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
function QuizLesson({
  lesson,
  progress,
  update,
  onNavigate,
}: {
  lesson: Lesson;
  progress: Progress;
  update: UpdateProgress;
  onNavigate: (p: string) => void;
}) {
  const [index, setIndex] = useState(0),
    [answer, setAnswer] = useState<number | null>(null),
    [checked, setChecked] = useState(false);
  const question = lesson.questions![index];
  const correct = checked && answer === question.answer;
  return (
    <section className="page quiz-page">
      <button className="text-button" onClick={() => onNavigate("learn")}>
        <ArrowLeft size={15} />
        All lessons
      </button>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            MAKERS YARD / {index + 1} OF {lesson.questions!.length}
          </p>
          <h1>{lesson.title}</h1>
          <p>{lesson.concept}</p>
        </div>
      </div>
      <div className="quiz-card">
        <h2>{question.question}</h2>
        <div className="answer-options">
          {question.options.map((option, i) => (
            <label className={answer === i ? "chosen" : ""} key={option}>
              <input
                type="radio"
                name="quiz"
                checked={answer === i}
                onChange={() => {
                  setAnswer(i);
                  setChecked(false);
                }}
              />
              <span>{String.fromCharCode(65 + i)}</span>
              {option}
            </label>
          ))}
        </div>
        <button
          className="primary"
          disabled={answer === null}
          onClick={() => {
            setChecked(true);
            if (answer === question.answer)
              update((p) =>
                completeStep(
                  p,
                  lesson.id,
                  String(index),
                  index === lesson.questions!.length - 1,
                ),
              );
          }}
        >
          Check answer
        </button>
        {checked && (
          <p role="status" className={correct ? "quiz-correct" : "quiz-wrong"}>
            {correct ? "Correct. " : "Try again. "}
            {question.explanation}
          </p>
        )}
        {correct && index < lesson.questions!.length - 1 && (
          <button
            onClick={() => {
              setIndex(index + 1);
              setAnswer(null);
              setChecked(false);
            }}
          >
            Next question <ArrowRight size={16} />
          </button>
        )}
        {correct && index === lesson.questions!.length - 1 && (
          <div className="completion-banner">
            <CheckCircle2 />
            <b>Quest complete</b>
            <button onClick={() => onNavigate("designer")}>
              Try it in the designer <ArrowRight size={16} />
            </button>
          </div>
        )}
        <VoiceControls
          settings={progress.settings}
          text={question.question + " " + question.options.join(". ")}
        />
      </div>
    </section>
  );
}
