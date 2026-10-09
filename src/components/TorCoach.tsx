import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { Settings } from "../lib/progress";
import { readText, writeText } from "../lib/local-data";
import { speakText, stopSpeech, commandFor, voiceError } from "../lib/voice";
import {
  coachAction,
  cleanCoachRequest,
  roastReply,
} from "../lib/coach-commands.mjs";
import { requestWorkspaceAction } from "../lib/coach-actions";
import type { WorkspaceObservation } from "../lib/workspace-observation";
import {
  observationReply,
  describeObservation,
} from "../lib/coach-observation.mjs";
import { useVoices } from "./VoiceControls";
const TorAvatar = lazy(() => import("./TorAvatar"));
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
  const [observation, setObservation] = useState<WorkspaceObservation | null>(
    null,
  );
  const [mood, setMood] = useState("ready");
  const [proactive, setProactive] = useState(
    () => readText("cq-tor-observe", "true") === "true",
  );
  const previousObservation = useRef<WorkspaceObservation | null>(null);
  const lastRequest = useRef(0);
  const [accent, setAccent] = useState(() =>
    readText("cq-tor-accent", "en-ZA"),
  );
  const accents = [
    { code: "en-ZA", name: "South African English" },
    { code: "en-NG", name: "Nigerian English" },
    { code: "en-KE", name: "Kenyan English" },
  ];
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
    speakText(text, voice, settings.rate, setStatus, accent);
  }
  function respond(text: string) {
    setReply(text);
    setMood(
      /error|invalid|failed|denied|isn.t a valid/i.test(text)
        ? "concerned"
        : roast
          ? "cheeky"
          : "happy",
    );
    setStatus("");
    if (autoSpeak) say(roast ? roastReply(text) : text);
  }
  async function ask(text: string) {
    lastRequest.current = Date.now();
    setMood("thinking");
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
    if (
      /what (?:do you see|am i doing)|look at (?:my|the) (?:form|screen)|why.*(?:error|work)|help.*(?:error|form)/i.test(
        request,
      ) &&
      observation
    ) {
      respond(
        `${describeObservation(observation)}. ${observation.output ? `Latest output: ${observation.output}. ` : ""}${observation.issues.length ? `Check: ${observation.issues.join(" ")}` : "Your control properties are valid. Run the app and test the inputs."}`,
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
  const [modelReady, setModelReady] = useState(false);
  const [osReduced, setOsReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setOsReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const [moving, setMoving] = useState(false);
  const [roam, setRoam] = useState(
    () => readText("cq-tor-roam", "true") === "true",
  );
  const movement = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (
      !roam ||
      open ||
      innerWidth < 650 ||
      settings.reducedMotion ||
      osReduced
    ) {
      setMoving(false);
      return;
    }
    let frame = 0,
      start = 0,
      from = 0,
      target = 0,
      top = 0;
    const walk = (time: number) => {
      if (!box.current || document.hidden || drag.current) {
        setMoving(false);
        return;
      }
      if (!start) {
        start = time;
        const r = box.current.getBoundingClientRect();
        from = r.left;
        top = r.top;
        target = Math.max(
          8,
          Math.min(
            innerWidth - r.width - 8,
            from + (Math.random() > 0.5 ? 1 : -1) * 180,
          ),
        );
        setMoving(true);
      }
      const fraction = Math.min(1, (time - start) / 3000);
      move(from + (target - from) * fraction, top);
      if (fraction < 1) frame = requestAnimationFrame(walk);
      else {
        setMoving(false);
        start = 0;
        movement.current = setTimeout(() => {
          frame = requestAnimationFrame(walk);
        }, 12000);
      }
    };
    movement.current = setTimeout(() => {
      frame = requestAnimationFrame(walk);
    }, 12000);
    return () => {
      cancelAnimationFrame(frame);
      if (movement.current) clearTimeout(movement.current);
    };
  }, [roam, open, settings.reducedMotion, osReduced]);
  useEffect(() => {
    pendingAction.current?.abort();
    setReply(tips[page] || tips.learn);
    setObservation(null);
    previousObservation.current = null;
    setMood("ready");
  }, [page]);
  useEffect(() => {
    const resize = () => {
      const r = box.current?.getBoundingClientRect();
      if (r) move(r.left, r.top);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [open, modelReady]);
  useEffect(
    () => () => {
      pendingAction.current?.abort();
      recognition.current?.abort();
      stopSpeech();
    },
    [],
  );
  useEffect(() => {
    const see = (event: Event) => {
      const next = (event as CustomEvent<WorkspaceObservation>).detail;
      if (next.page !== page) return;
      const reaction = observationReply(next, previousObservation.current);
      previousObservation.current = next;
      setObservation(next);
      if (
        !proactive ||
        !reaction ||
        listening ||
        pendingAction.current ||
        Date.now() - lastRequest.current < 2000
      )
        return;
      const text = roast ? `${reaction.roast} ${reaction.text}` : reaction.text;
      setMood(reaction.mood);
      setReply(text);
      if (autoSpeak) say(text);
    };
    window.addEventListener("cq-workspace-observation", see);
    return () => window.removeEventListener("cq-workspace-observation", see);
  }, [
    page,
    proactive,
    listening,
    roast,
    autoSpeak,
    voice,
    accent,
    settings.rate,
  ]);
  const message = roast ? roastReply(reply) : reply;
  return (
    <aside
      ref={box}
      className={`tor-coach ${open ? "expanded" : ""} ${status === "Speaking…" ? "speaking" : ""}`}
      aria-label="Tor hologram tutor"
      data-moving={moving}
      data-mood={
        listening ? "listening" : status === "Speaking…" ? "speaking" : mood
      }
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
        <Suspense fallback={null}>
          <TorAvatar
            mood={
              listening
                ? "listening"
                : status === "Speaking…"
                  ? "speaking"
                  : mood
            }
            moving={moving}
            reduced={settings.reducedMotion || osReduced}
            onReady={setModelReady}
          />
        </Suspense>
        <svg
          style={{ display: modelReady ? "none" : undefined }}
          viewBox="0 0 120 110"
          aria-hidden="true"
        >
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
          <g className="tor-eyes">
            <circle cx="46" cy="35" r="5" />
            <circle cx="74" cy="35" r="5" />
          </g>
          <path
            className="tor-brows"
            d={
              mood === "concerned"
                ? "M39 25L51 29M69 29L81 25"
                : "M39 26Q46 22 51 26M69 26Q74 22 81 26"
            }
          />
          <path
            className="tor-mouth"
            d={
              mood === "concerned"
                ? "M48 53 Q60 44 72 53"
                : mood === "thinking"
                  ? "M51 51H69"
                  : "M48 49 Q60 61 72 49"
            }
          />
          <path d="M24 74L8 60M96 74L112 60" />
        </svg>
        <span>{open ? "Hide panel" : "Talk to Tor"}</span>
      </button>
      {open && (
        <div className="tor-panel">
          <div className="tor-observation" aria-label="What Tor sees">
            <b>What I see</b>
            <br />
            {observation
              ? describeObservation(observation)
              : `You're on ${page}. Waiting for workspace activity.`}
          </div>
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
              checked={roam}
              onChange={(e) => {
                setRoam(e.target.checked);
                writeText("cq-tor-roam", String(e.target.checked));
              }}
            />
            Let Tor walk around
          </label>
          <label className="tor-roast">
            <input
              type="checkbox"
              checked={proactive}
              onChange={(e) => {
                setProactive(e.target.checked);
                writeText("cq-tor-observe", String(e.target.checked));
              }}
            />{" "}
            React to my workspace
          </label>
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
            African English accent
            <select
              aria-label="African English accent"
              value={accent}
              onChange={(e) => {
                setAccent(e.target.value);
                setVoice("");
                writeText("cq-tor-accent", e.target.value);
                writeText("cq-tor-voice", "");
                stopSpeech();
              }}
            >
              {accents.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name}
                  {voices.some(
                    (v) => v.lang.toLowerCase() === a.code.toLowerCase(),
                  )
                    ? " · available"
                    : " · voice not installed"}
                </option>
              ))}
            </select>
          </label>
          {!voices.some(
            (v) => v.lang.toLowerCase() === accent.toLowerCase(),
          ) && (
            <small>
              That accent isn't installed here. Automatic uses an available
              English voice; it does not change its accent. Edge's online
              natural voices may appear in your device list.
            </small>
          )}
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
              Start preview. Type Jake into txtName. Click btnSave. Stop
              preview. Undo. Open Code Lab.
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
