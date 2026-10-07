import { useEffect, useState } from "react";
import { Clock, CheckCircle2, Play, ArrowRight } from "lucide-react";
import { lessons } from "../curriculum";
import type { Question } from "../curriculum";
import type { Progress } from "../lib/progress";
import type { UpdateProgress } from "./LessonView";
import { detectSkills } from "../learning-engine.mjs";
import {
  readText,
  writeText,
  readBrief,
  registrationBrief,
} from "../lib/local-data";
import {
  markPractical,
  torPracticalFeedback,
} from "../lib/assessment-engine.mjs";
const bank: Question[] = [
  ...lessons.flatMap((l) => l.questions || [l.prediction!]).filter(Boolean),
];
export default function Assessment({
  progress,
  update,
  onNavigate,
}: {
  progress: Progress;
  update: UpdateProgress;
  onNavigate: (p: string) => void;
}) {
  const [practicalCode, setPracticalCode] = useState(
      () =>
        readText("cq-practical-code") ||
        "private void btnRegister_Click(object sender, EventArgs e) {\n    // Write your validation and registration logic here\n}",
    ),
    [practicalResult, setPracticalResult] = useState<any>(null),
    [practicalAttempts, setPracticalAttempts] = useState(0),
    [active, setActive] = useState(false),
    [finished, setFinished] = useState(false),
    [index, setIndex] = useState(0),
    [answers, setAnswers] = useState<(number | null)[]>([]),
    [questions, setQuestions] = useState<Question[]>([]),
    [seconds, setSeconds] = useState(600),
    [timed, setTimed] = useState(true),
    [prompt, setPrompt] = useState(""),
    [analysis, setAnalysis] = useState<string[]>([]);
  const question = questions[index];
  const score = questions.reduce(
    (sum, q, i) => sum + (answers[i] === q.answer ? 1 : 0),
    0,
  );
  useEffect(() => {
    writeText("cq-practical-code", practicalCode);
  }, [practicalCode]);
  function finish() {
    setActive(false);
    setFinished(true);
    update((p) => ({
      ...p,
      assessments: [
        ...p.assessments,
        { date: new Date().toISOString(), score, total: questions.length },
      ].slice(-30),
    }));
  }
  useEffect(() => {
    if (!active || !timed) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [active, timed]);
  useEffect(() => {
    if (active && timed && seconds === 0) finish();
  }, [seconds, active, timed]);
  function start() {
    const chosen = [...bank];
    for (let i = chosen.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
    }
    setQuestions(chosen.slice(0, 10));
    setAnswers(Array(10).fill(null));
    setIndex(0);
    setSeconds(600);
    setActive(true);
    setFinished(false);
  }
  return (
    <section className="page assessment-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ASSESSMENT ARENA</p>
          <h1>Ready when it counts.</h1>
          <p>Ten questions. Honest marks. Learn from every answer.</p>
        </div>
        <span className="status-pill">
          <Clock size={15} />
          {active
            ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
            : "10 minute practice"}
        </span>
      </div>
      {!active && !finished ? (
        <div className="assessment-start">
          <div className="arena-number">
            10<span>QUESTIONS</span>
          </div>
          <div>
            <h2>Find the gaps before the test.</h2>
            <p>
              Practice covers C# fundamentals, WinForms controls and OOP. This
              is a self-study quiz, not an official university assessment.
            </p>
            <label className="check-label">
              <input
                type="checkbox"
                checked={timed}
                onChange={(e) => setTimed(e.target.checked)}
              />
              Use a 10-minute timer
            </label>
            <button className="primary" onClick={start}>
              <Play size={16} />
              Start assessment
            </button>
          </div>
        </div>
      ) : active ? (
        <div className="quiz-card">
          <p className="eyebrow">
            QUESTION {index + 1} / {questions.length}
          </p>
          <h2>{question.question}</h2>
          <div className="answer-options">
            {question.options.map((option, i) => (
              <label
                key={option}
                className={answers[index] === i ? "chosen" : ""}
              >
                <input
                  name="assessment-answer"
                  type="radio"
                  checked={answers[index] === i}
                  onChange={() =>
                    setAnswers((a) => a.map((v, j) => (j === index ? i : v)))
                  }
                />
                <span>{String.fromCharCode(65 + i)}</span>
                {option}
              </label>
            ))}
          </div>
          <div className="button-row">
            <button disabled={index === 0} onClick={() => setIndex(index - 1)}>
              Previous
            </button>
            {index < questions.length - 1 ? (
              <button className="primary" onClick={() => setIndex(index + 1)}>
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button className="primary" onClick={finish}>
                Finish & mark
              </button>
            )}
          </div>
          <p className="muted">
            {answers.filter((a) => a !== null).length} answered. Unanswered
            questions receive zero marks. Leaving this page cancels the current
            attempt.
          </p>
        </div>
      ) : (
        <div className="assessment-results">
          <div className="result-heading">
            <CheckCircle2 size={35} />
            <h2>
              {score} / {questions.length}
            </h2>
            <p>
              {score >= 8
                ? "Strong understanding. Keep practising your code."
                : "Your next steps are clear. Review the explanations, then revisit the lessons."}
            </p>
            <button onClick={start}>Try another assessment</button>
          </div>
          {questions.map((q, i) => (
            <article
              key={i}
              className={
                answers[i] === q.answer
                  ? "answer-review correct"
                  : "answer-review"
              }
            >
              <b>
                {i + 1}. {q.question}
              </b>
              <p>
                Your answer:{" "}
                {answers[i] === null || answers[i] === undefined
                  ? "Not answered"
                  : q.options[answers[i]!]}
              </p>
              <p>Correct: {q.options[q.answer]}</p>
              <span>{q.explanation}</span>
            </article>
          ))}
        </div>
      )}
      <div className="question-analyser">
        <h2>Bring your own question</h2>
        <p>
          Paste a tutorial question to identify topics and find the matching
          lessons. This topic matcher does not generate or mark arbitrary
          answers.
        </p>
        <textarea
          aria-label="Assessment question"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Create an abstract Employee class…"
          maxLength={10000}
        />
        <button
          onClick={() => setAnalysis(detectSkills(prompt))}
          disabled={!prompt.trim()}
        >
          Find relevant topics
        </button>
        {analysis.length > 0 && (
          <div className="topic-results">
            {analysis.map((topic) => (
              <span className="chip" key={topic}>
                {topic}
              </span>
            ))}
            <button onClick={() => onNavigate("learn")}>
              Open lesson library <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
      <div className="assessment-start">
        <div className="arena-number">
          P1<span>PRACTICAL</span>
        </div>
        <div>
          <h2>Student Registration Form</h2>
          <p>
            Build a Windows Forms registration screen with a student-number
            TextBox and Register Button. Use meaningful control names, validate
            exactly 8 digits, wire the button Click event, and show clear
            feedback with MessageBox.Show.
          </p>
          <div className="topic-results">
            <span className="chip">TextBox → txtStudentNumber</span>
            <span className="chip">Button → btnRegister</span>
            <span className="chip">8-digit validation</span>
            <span className="chip">Click event</span>
          </div>
          <button
            className="primary"
            onClick={() => {
              writeText(
                "cq-practical-brief",
                JSON.stringify(registrationBrief),
              );
              onNavigate("designer");
            }}
          >
            Build this practical <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <div className="question-analyser" id="practical-marker">
        <h2>Practical marker</h2>
        <p>
          Build your form in WinForms, then paste your event-handler C# here.
          CodeQuest reviews six categories using static code patterns and points
          you to the weakest skill. It does not compile or execute this Windows
          Forms handler, and a high score does not verify its behaviour. This is
          formative practice, not an official university mark.
        </p>
        <textarea
          aria-label="Practical C# code"
          value={practicalCode}
          onChange={(e) => setPracticalCode(e.target.value)}
          maxLength={50000}
        />
        <button
          onClick={() => {
            let controls = [];
            try {
              controls = JSON.parse(readText("cq-form", "[]"));
            } catch {}
            setPracticalAttempts((n) => n + 1);
            setPracticalResult(
              markPractical({
                controls,
                code: practicalCode,
                requirements: (() => {
                  try {
                    return readBrief() || registrationBrief;
                  } catch {
                    return registrationBrief;
                  }
                })(),
              }),
            );
          }}
        >
          Mark my practical
        </button>
        {practicalResult && (
          <div className="assessment-results">
            <div className="result-heading">
              <CheckCircle2 size={35} />
              <h2>{practicalResult.total}% rubric coverage</h2>
              <p>
                {practicalResult.weak.length
                  ? "Focus next: " + practicalResult.weak.join(", ")
                  : "Strong foundation. Try a harder practical next."}
              </p>
            </div>
            {Object.entries(practicalResult.breakdown).map(([name, score]) => (
              <article className="answer-review" key={name}>
                <b>{name}</b>
                <span>{String(score)} marks</span>
              </article>
            ))}
            <div className="coach-note">
              <b>Tor says</b>
              <p>
                {
                  torPracticalFeedback(
                    practicalResult,
                    practicalAttempts,
                    progress.settings.coach,
                  ).message
                }
              </p>
            </div>
            {practicalResult.recommendations.map((r: any) => (
              <button
                key={r.area}
                onClick={() => onNavigate("learn/" + r.lesson)}
              >
                Train {r.area} <ArrowRight size={15} />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
