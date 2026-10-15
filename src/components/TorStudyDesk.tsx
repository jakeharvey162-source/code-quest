import { useState } from "react";
import { askTorLive } from "../lib/tor-ai";
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
    [notice, setNotice] = useState(""),
    [thinking, setThinking] = useState(false);
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
  async function ask(text: string) {
    const questionText = text.trim();
    if (!questionText || thinking) return;
    setThinking(true);
    setNotice("Tor is thinking…");
    try {
      const live = await askTorLive(
        questionText,
        role,
        history.map((row) => ({ question: row.question, answer: row.answer })),
      );
      const fallback = studyReply(questionText, role, topic);
      const answer = live.answer || fallback.text;
      setTopic(fallback.topic);
      update((p) => ({
        ...p,
        drafts: {
          ...p.drafts,
          "tor-study-history": JSON.stringify(
            [
              ...readStudyHistory(p.drafts["tor-study-history"]),
              { question: questionText.slice(0, 1000), answer, topic: fallback.topic, role, source: live.live ? "live" : "built-in" },
            ].slice(-10),
          ),
        },
      }));
      setQuestion("");
      setNotice(live.notice);
    } catch {
      setNotice("Tor could not finish that request. Your question is still here; try again.");
    } finally {
      setThinking(false);
    }
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
        Chat naturally, share a C# error or ask for help with any CodeQuest
        lesson. Live AI uses Gemini when configured and you are signed in.
        Built-in explanations and practice questions remain available offline.
        When live AI is enabled, your question and recent conversation are
        sent to Google Gemini for a reply. Do not paste passwords or private data.
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
          <button key={p} onClick={() => void ask(p)} disabled={thinking}>
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
              <h3>Tor · {row.source === "live" ? "live AI" : "built-in guide"}</h3>
              <p>{row.answer}</p>
            </article>
          ))
        ) : (
          <p>
            Say hello, paste an error or ask a coding question. Tor keeps the last
            ten exchanges in your saved progress.
          </p>
        )}
      </section>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
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
          <button className="primary" disabled={!question.trim() || thinking}>
            {thinking ? "Tor is thinking…" : "Send to Tor"}
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
          <button type="button" onClick={generate} disabled={thinking}>
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
