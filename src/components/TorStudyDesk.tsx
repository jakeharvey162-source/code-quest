import { useState } from "react";
import type { Progress } from "../lib/progress";
import type { UpdateProgress } from "./LessonView";
import {
  readStudyHistory,
  studyReply,
  studyQuestion,
  torSources,
} from "../lib/tor-study.mjs";
export default function TorStudyDesk({
  progress,
  update,
}: {
  progress: Progress;
  update: UpdateProgress;
}) {
  const [role, setRole] = useState<"student" | "lecturer">("student"),
    [question, setQuestion] = useState(""),
    [notice, setNotice] = useState("");
  const history = readStudyHistory(progress.drafts["tor-study-history"]);
  const [topic, setTopic] = useState(history.at(-1)?.topic || "debug");
  const [quiz, setQuiz] = useState<ReturnType<typeof studyQuestion> | null>(
      null,
    ),
    [choice, setChoice] = useState("");
  const prompts =
    role === "student"
      ? [
          "Help me debug the equipment booking practice",
          "How do I check constructor and property errors?",
          "What if bookings.txt is missing?",
          "How do I join a class and share progress?",
        ]
      : [
          "Create a repair assignment and suggested rubric",
          "How do learners share progress?",
          "Explain how to test event wiring",
          "How do I check historical file recovery?",
        ];
  function ask(text: string) {
    if (!text.trim()) return;
    const answer = studyReply(text.trim(), role, topic);
    setTopic(answer.topic);
    update((p) => ({
      ...p,
      drafts: {
        ...p.drafts,
        "tor-study-history": JSON.stringify(
          [
            ...readStudyHistory(p.drafts["tor-study-history"]),
            {
              question: text.trim().slice(0, 1000),
              answer: answer.text,
              topic: answer.topic,
              role,
            },
          ].slice(-10),
        ),
      },
    }));
    setQuestion("");
    setNotice("Tor’s built-in coaching reply is ready.");
  }
  function generate() {
    const n = Number(progress.drafts["tor-study-seed"]) || 0;
    setQuiz(studyQuestion(n, topic));
    setChoice("");
    update((p) => ({
      ...p,
      drafts: { ...p.drafts, "tor-study-seed": String((n + 1) % 1e9) },
    }));
  }
  return (
    <section className="page tor-study-page">
      <p className="eyebrow">YOUR STUDY PARTNER</p>
      <h1>Tor’s study desk</h1>
      <p>
        Room to read, ask and practise. Built-in coaching works offline after
        the app is cached. Official documentation opens on the web. A live AI
        model or web-browsing service is not connected.
      </p>
      <div className="button-row">
        <a href="#challenges/equipment-booking">
          Open today’s equipment practice →
        </a>
        <a href="#classes">Open Classroom →</a>
      </div>
      <label>
        I’m here as
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "student" | "lecturer")}
        >
          <option value="student">Student</option>
          <option value="lecturer">Lecturer</option>
        </select>
      </label>
      <div className="tor-study-prompts">
        {prompts.map((p) => (
          <button key={p} onClick={() => ask(p)}>
            {p}
          </button>
        ))}
      </div>
      <section className="tor-study-history" aria-label="Study conversation">
        {history.length ? (
          history.map((row, i) => (
            <article key={i}>
              <h2>You · {row.role}</h2>
              <p>{row.question}</p>
              <h3>Tor · built-in guide</h3>
              <p>{row.answer}</p>
            </article>
          ))
        ) : (
          <p>
            Pick a prompt or ask about debugging, events, validation, files or
            properties. Tor keeps the last ten exchanges in your saved progress.
          </p>
        )}
      </section>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <label>
          Ask Tor
          <textarea
            aria-label="Study question"
            value={question}
            maxLength={1000}
            rows={3}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What should I test after fixing the constructor?"
          />
        </label>
        <div className="button-row">
          <button className="primary" disabled={!question.trim()}>
            Send to Tor
          </button>
          <button
            type="button"
            onClick={() => {
              update((p) => ({
                ...p,
                drafts: { ...p.drafts, "tor-study-history": "[]" },
              }));
              setNotice("Conversation cleared.");
            }}
          >
            Clear conversation
          </button>
          <button type="button" onClick={generate}>
            New practice question
          </button>
        </div>
      </form>
      <p role="status" aria-live="polite">
        {notice}
      </p>
      {quiz && (
        <article className="settings-card">
          <h2>{quiz.title}</h2>
          <pre>{quiz.code}</pre>
          <fieldset>
            <legend>Choose your prediction</legend>
            {quiz.choices.map((value: string) => (
              <label className="check-label" key={value}>
                <input
                  type="radio"
                  name="tor-practice"
                  checked={choice === value}
                  onChange={() => setChoice(value)}
                />
                {value}
              </label>
            ))}
          </fieldset>
          {choice && (
            <p role="status">
              {choice === quiz.answer ? "Correct." : "Try again."}{" "}
              {quiz.explanation}
            </p>
          )}
        </article>
      )}
      <aside
        className="tor-study-sources"
        aria-label="Official learning sources"
      >
        <h2>Read the official explanation</h2>
        <p>
          These curated Microsoft references are separate from Tor’s built-in
          replies.
        </p>
        {torSources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noreferrer"
          >
            {source.title} ↗
          </a>
        ))}
        <a
          href={
            "https://learn.microsoft.com/en-us/search/?terms=" +
            encodeURIComponent("C# " + (question || topic))
          }
          target="_blank"
          rel="noreferrer"
        >
          Search Microsoft Learn for this topic ↗
        </a>
      </aside>
    </section>
  );
}
