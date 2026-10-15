import { useState, useRef, useEffect } from "react";
import type { Progress } from "../lib/progress";
import type { UpdateProgress } from "./LessonView";
import {
  readStudyHistory,
  storeStudyHistory,
  studyReply,
  studyQuestion,
  torSources,
} from "../lib/tor-study.mjs";
import { chatWithTor, type TorMessage } from "../lib/tor-chat";
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
  const [engine, setEngine] = useState<"ai" | "offline">("ai"),
    [busy, setBusy] = useState(false);
  const pending = useRef<AbortController | null>(null);
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
      pending.current?.abort();
    },
    [],
  );
  function cancel() {
    generation.current++;
    pending.current?.abort();
    pending.current = null;
    setBusy(false);
  }
  async function ask(text: string) {
    if (!text.trim() || busy) return;
    const request = text.trim().slice(0, 6000),
      version = ++generation.current;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setNotice(engine === "ai" ? "Tor is thinking…" : "");
    try {
      let answer;
      if (engine === "offline") answer = studyReply(request, role, topic);
      else {
        const messages: TorMessage[] = history.flatMap((row) => [
          { role: "user" as const, content: row.question },
          { role: "assistant" as const, content: row.answer },
        ]);
        messages.push({ role: "user", content: request });
        answer = {
          topic,
          text: await chatWithTor(messages, controller.signal, role),
        };
      }
      if (version !== generation.current) return;
      setTopic(answer.topic);
      update((p) => ({
        ...p,
        drafts: {
          ...p.drafts,
          "tor-study-history": storeStudyHistory(
            [
              ...readStudyHistory(p.drafts["tor-study-history"]),
              {
                question: request,
                answer: answer.text.slice(0, 6000),
                topic: answer.topic,
                role,
                engine,
              },
            ].slice(-10),
          ),
        },
      }));
      setQuestion("");
      setNotice("");
    } catch (error) {
      if (version === generation.current)
        setNotice(
          error instanceof Error
            ? error.message
            : "Tor could not reply. Your question is kept; try again.",
        );
    } finally {
      if (version === generation.current) {
        setBusy(false);
        pending.current = null;
      }
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
      <p>Ask a question, paste code, or pick up where you left off.</p>
      <label>
        Tor mode
        <select
          aria-label="Tor mode"
          value={engine}
          onChange={(e) => {
            cancel();
            setEngine(e.target.value as "ai" | "offline");
            setNotice("");
          }}
        >
          <option value="ai">AI conversation</option>
          <option value="offline">Offline guide</option>
        </select>
      </label>
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
          <button key={p} disabled={busy} onClick={() => void ask(p)}>
            {p}
          </button>
        ))}
      </div>
      <section className="tor-study-history" aria-label="Study conversation">
        {history.length ? (
          history.map((row, i) => (
            <article key={i}>
              <h2>You</h2>
              <p>{row.question}</p>
              <h3>{row.engine === "ai" ? "Tor" : "Tor · offline guide"}</h3>
              <p style={{ whiteSpace: "pre-wrap" }}>{row.answer}</p>
            </article>
          ))
        ) : (
          <p>
            Pick a prompt or ask about debugging, events, validation, files or
            properties. Tor keeps your recent conversation in your saved
            progress.
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
            maxLength={6000}
            disabled={busy}
            rows={3}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Message Tor, or paste the code you’re working on…"
          />
        </label>
        <div className="button-row">
          <button className="primary" disabled={busy || !question.trim()}>
            {busy ? "Thinking…" : "Send to Tor"}
          </button>
          {busy && (
            <button
              type="button"
              onClick={() => {
                cancel();
                setNotice("Stopped. Your question is kept.");
              }}
            >
              Stop reply
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              cancel();
              update((p) => ({
                ...p,
                drafts: { ...p.drafts, "tor-study-history": "[]" },
              }));
              setNotice("Conversation cleared.");
            }}
          >
            Clear conversation
          </button>
          <button
            type="button"
            onClick={() =>
              engine === "ai"
                ? void ask(
                    "Give me one original beginner C# code-repair challenge. Include broken code, requirements and example inputs/outputs. Ask me to type a correction, not choose multiple-choice answers. Wait for my attempt before revealing the solution.",
                  )
                : generate()
            }
          >
            New practice question
          </button>
        </div>
      </form>
      {engine === "ai" && (
        <p className="muted">
          AI chat runs online; the provider may retain messages. No live web
          browsing.
        </p>
      )}
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
        <p>Check explanations against these official Microsoft references.</p>
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
