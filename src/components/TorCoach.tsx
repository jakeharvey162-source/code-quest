import { useEffect, useRef, useState } from "react";
import type { Settings } from "../lib/progress";
import { readText, writeText } from "../lib/local-data";
import { speakText, stopSpeech, commandFor, voiceError } from "../lib/voice";
import {
  coachAction,
  cleanCoachRequest,
  roastReply,
} from "../lib/coach-commands.mjs";
import { requestWorkspaceAction } from "../lib/coach-actions";
import { useVoices } from "./VoiceControls";
const tips: Record<string, string> = {
  designer:
    "Select a toolbox control, then click the form to place it. Double-click adds it automatically. Drag to move, edit Name and Text in Properties, and double-click a Button on the form to write its Click event. Press F5 to test.",
  playground:
    "Read the compiler message from the top. Check the line number, semicolons and variable types. Change one thing, run again, then explain why it works.",
  assessment:
    "Trace the code on paper first. Write each variable's value after every statement. For a loop, check the starting value, condition and update separately.",
  learn:
    "Predict the output before you run the code. If your prediction differs, trace one statement at a time. Understanding the change is how you prepare for an exam.",
  home: "Pick a quest or open WinForms to build a form. I can explain controls, events, loops and validation. Drag my hologram out of your way, or use the arrow keys on my handle.",
};
function answer(question: string, page: string) {
  if (/label|textbox|text box/i.test(question))
    return "A Label displays information. A TextBox accepts input. Name is the identifier your C# code uses; Text is what the student sees. For example: lblResult.Text = txtName.Text;";
  if (/event|button|click/i.test(question))
    return "A Button needs a Click event handler. Double-click the Button in Design to open its handler. Put your validation and actions inside that method, then press F5 and click the Button to test.";
  if (/valid|parse|number/i.test(question))
    return "TextBox.Text is a string. Use int.TryParse(txtNumber.Text, out int number) before doing maths. If it returns false, show a useful MessageBox and return before continuing.";
  if (/loop|\b(for|while)\b/i.test(question))
    return "A for loop has a start, a condition and an update. for (int i = 0; i < 3; i++) runs with i equal to 0, 1 and 2. Trace those values to spot an off-by-one error.";
  if (/zip|upload|file/i.test(question))
    return "Use Choose project file to open a ZIP locally. Select a file to read its contents. Open Program.cs in Code Lab, or restore codequest-form.json in WinForms from a CodeQuest export.";
  return tips[page] || tips.learn;
}
export default function TorCoach({
  page,
  settings,
  onNavigate,
}: {
  page: string;
  settings: Settings;
  onNavigate: (page: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [roast, setRoast] = useState(settings.coach === "Spicy");
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState(tips[page] || tips.learn);
  const [status, setStatus] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(
    () => readText("cq-tor-auto-speak", "true") === "true",
  );
  const [listening, setListening] = useState(false);
  const recognition = useRef<any>(null);
  const pendingAction = useRef<AbortController | null>(null);
  const voices = useVoices();
  const englishVoices = voices.filter((v) =>
    v.lang.toLowerCase().startsWith("en"),
  );
  const [voice, setVoice] = useState(() =>
    readText("cq-tor-voice", settings.voice),
  );
  function say(text: string) {
    speakText(text, voice, settings.rate, setStatus, "en-ZA");
  }
  function respond(text: string) {
    setReply(text);
    setStatus("");
    if (autoSpeak) say(roast ? roastReply(text) : text);
  }
  async function ask(text: string) {
    pendingAction.current?.abort();
    const request = cleanCoachRequest(text);
    if (!request) return;
    const route = commandFor(request);
    if (route === "stop") {
      stop();
      return;
    }
    if (route) {
      onNavigate(route);
      respond(
        `Opening ${route === "designer" ? "WinForms" : route === "playground" ? "Code Lab" : route}. Let's work.`,
      );
      return;
    }
    const action = coachAction(request);
    if (action) {
      if (page !== "designer") {
        respond(
          "Open WinForms first, then ask me to change or review your form.",
        );
        return;
      }
      const controller = new AbortController();
      pendingAction.current = controller;
      const result = await requestWorkspaceAction(action, controller.signal);
      if (controller.signal.aborted) return;
      pendingAction.current = null;
      respond(
        result ||
          "The designer is still loading. Try that command again once the form appears.",
      );
      return;
    }
    respond(answer(request, page));
  }
  function stop() {
    pendingAction.current?.abort();
    recognition.current?.abort();
    recognition.current = null;
    setListening(false);
    stopSpeech();
    setStatus("Reading stopped.");
  }
  function listen() {
    if (listening) {
      stop();
      return;
    }
    const Recognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setStatus(
        "Voice input isn't available here. Use Chrome or Edge, or type your request below.",
      );
      return;
    }
    stopSpeech();
    recognition.current?.abort();
    const r = new Recognition();
    recognition.current = r;
    r.lang = settings.language || "en-ZA";
    r.continuous = false;
    r.interimResults = false;
    r.onstart = () => {
      setListening(true);
      setStatus("Listening… tell me what to do.");
    };
    r.onend = () => {
      if (recognition.current === r) {
        recognition.current = null;
        setListening(false);
        setStatus((current) =>
          current.startsWith("Listening")
            ? "I didn’t catch that. Tap Talk to Tor and try again."
            : current,
        );
      }
    };
    r.onerror = (event: any) => {
      if (recognition.current === r) {
        setStatus(voiceError(event.error));
        setListening(false);
      }
    };
    r.onresult = (event: any) => {
      if (recognition.current !== r) return;
      const text = event.results[0][0].transcript;
      recognition.current = null;
      setListening(false);
      setQuestion(text);
      ask(text);
    };
    try {
      r.start();
    } catch {
      recognition.current = null;
      setListening(false);
      setStatus("The microphone couldn't start. Try again or type below.");
    }
  }
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    () => {
      try {
        const p = JSON.parse(readText("cq-tor-position", "null"));
        return p && Number.isFinite(p.x) && Number.isFinite(p.y) ? p : null;
      } catch {
        return null;
      }
    },
  );
  const box = useRef<HTMLElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  function move(x: number, y: number) {
    const rect = box.current?.getBoundingClientRect();
    const p = {
      x: Math.max(8, Math.min(x, innerWidth - (rect?.width || 130) - 8)),
      y: Math.max(8, Math.min(y, innerHeight - (rect?.height || 160) - 8)),
    };
    setPosition(p);
    writeText("cq-tor-position", JSON.stringify(p));
  }
  useEffect(() => {
    pendingAction.current?.abort();
    setReply(tips[page] || tips.learn);
  }, [page]);
  useEffect(() => {
    const resize = () => {
      const r = box.current?.getBoundingClientRect();
      if (r) move(r.left, r.top);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [open]);
  useEffect(
    () => () => {
      pendingAction.current?.abort();
      recognition.current?.abort();
      stopSpeech();
    },
    [],
  );
  const message = roast ? roastReply(reply) : reply;
  return (
    <aside
      ref={box}
      className={`tor-coach ${open ? "expanded" : ""} ${status === "Speaking…" ? "speaking" : ""}`}
      aria-label="Tor hologram tutor"
      style={
        position
          ? { left: position.x, top: position.y, right: "auto", bottom: "auto" }
          : undefined
      }
    >
      <button
        className="tor-handle"
        aria-label="Move Tor hologram"
        title="Drag to move. Arrow keys move 16 pixels."
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          const r = box.current!.getBoundingClientRect();
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            left: r.left,
            top: r.top,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d) move(d.left + e.clientX - d.x, d.top + e.clientY - d.y);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onKeyDown={(e) => {
          const delta: Record<string, number[]> = {
            ArrowLeft: [-16, 0],
            ArrowRight: [16, 0],
            ArrowUp: [0, -16],
            ArrowDown: [0, 16],
          };
          if (delta[e.key]) {
            e.preventDefault();
            const r = box.current!.getBoundingClientRect();
            move(r.left + delta[e.key][0], r.top + delta[e.key][1]);
          }
        }}
      >
        ⠿ TOR · drag me
      </button>
      <button
        className="tor-avatar"
        aria-label={open ? "Minimise Tor" : "Open Tor tutor"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <svg viewBox="0 0 120 110" aria-hidden="true">
          <ellipse className="tor-beam" cx="60" cy="98" rx="46" ry="9" />
          <path
            className="tor-body"
            d="M30 78 Q30 60 60 60 Q90 60 90 78 L100 94 H20 Z"
          />
          <rect
            className="tor-head"
            x="30"
            y="15"
            width="60"
            height="48"
            rx="18"
          />
          <path d="M60 15V6M52 6H68" />
          <circle cx="46" cy="35" r="5" />
          <circle cx="74" cy="35" r="5" />
          <path className="tor-mouth" d="M48 49 Q60 57 72 49" />
          <path d="M24 74L8 60M96 74L112 60" />
        </svg>
        <span>{open ? "Hide panel" : "Talk to Tor"}</span>
      </button>
      {open && (
        <div className="tor-panel">
          <p className="tor-reply">{message}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
          >
            <label htmlFor="tor-question">Ask about C# or your form</label>
            <input
              id="tor-question"
              value={question}
              maxLength={250}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Add a label that says Student Name"
            />
            <button type="submit">Explain</button>
            <button
              type="button"
              className="tor-mic"
              aria-pressed={listening}
              onClick={listen}
            >
              {listening ? "Stop listening" : "Talk to Tor"}
            </button>
          </form>
          <label className="tor-roast">
            <input
              type="checkbox"
              checked={roast}
              onChange={(e) => setRoast(e.target.checked)}
            />{" "}
            Roast mode
          </label>
          <label className="tor-roast">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => {
                setAutoSpeak(e.target.checked);
                writeText("cq-tor-auto-speak", String(e.target.checked));
                if (!e.target.checked) stopSpeech();
              }}
            />{" "}
            Speak replies automatically
          </label>
          <label>
            Tor voice
            <select
              aria-label="Tor voice"
              value={voice}
              onChange={(e) => {
                setVoice(e.target.value);
                writeText("cq-tor-voice", e.target.value);
              }}
            >
              <option value="">Automatic · best available English voice</option>
              {englishVoices.map((v) => (
                <option key={v.voiceURI || v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </label>
          <div className="tor-actions">
            <button onClick={() => say(message)}>Tor, speak</button>
            <button onClick={stop}>Stop voice</button>
          </div>
          <details className="tor-command-help">
            <summary>Things you can ask Tor to do</summary>
            <p>
              Add a label that says Student Name. Set text to Welcome. Rename to
              lblWelcome. Select label1. Move right 24 pixels. Review my form.
              Start preview. Stop preview. Undo. Open Code Lab.
            </p>
          </details>
          <small role="status">
            {status || "Ready · voice commands and C# coaching"}
          </small>
          <small className="tor-mic-note">
            Microphone audio may be processed by your browser’s speech service.
            Tor controls this workspace.
          </small>
        </div>
      )}
    </aside>
  );
}
