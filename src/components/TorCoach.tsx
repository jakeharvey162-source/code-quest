import {chatWithTor, type TorMessage} from "../lib/tor-chat";
import {useAuth} from "./AuthProvider";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { Settings } from "../lib/progress";
import { readText, writeText } from "../lib/local-data";
import { speakText, stopSpeech, commandFor, voiceError } from "../lib/voice";
import { coachAction, cleanCoachRequest } from "../lib/coach-commands.mjs";
import { TOR_LANGUAGES, localizedLesson, localizedChallenge, localizedFallback } from "../lib/tor-teaching.mjs";
import { requestWorkspaceAction } from "../lib/coach-actions";
import type { WorkspaceObservation } from "../lib/workspace-observation";
import {
  observationReply,
  describeObservation,
} from "../lib/coach-observation.mjs";
import { useVoices } from "./VoiceControls";
import {chooseTorReaction,reactionLine} from "../lib/tor-performance.mjs";
import { studyReply } from "../lib/tor-study.mjs";
import { lessonSummary, workspaceSummary } from "../lib/tor-summary.mjs";
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
  home: "Pick a quest or open WinForms to build a form. I can explain controls, events, loops and validation. Open my panel for help, then minimise it to keep your workspace clear.",
  adventure: "Welcome to Rookie Street! Each repair needs working C#. Read the mission, try a fix, and run the real tests. Ask me for a hint whenever you need one. Experiments never cost adventure XP.",
  terminal: "Pick a language, press Run, and inspect the preview and console. I can help debug your code.",
};
function answer(question: string, page: string, language: string, spicy: boolean, variation=0) {
  const lesson=localizedLesson(question,language,spicy,variation);
  if(lesson)return lesson;
  if(language!=="en-ZA")return localizedFallback(language);
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
  lessonId,
  adventureContext,
}: {
  page: string;
  settings: Settings;
  onNavigate: (page: string) => void;
  lessonId?: string;
  adventureContext?: {
    title: string;
    objective: string;
    hint: string;
    completed: number;
  };
}) {
  const [open, setOpen] = useState(false);
  const [presence,setPresence]=useState<"visible"|"departing"|"hidden"|"arriving">("visible");
  const portalTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  function portal(action:"dismiss"|"summon") {
    if(portalTimer.current)clearTimeout(portalTimer.current);
    pendingAction.current?.abort();
    setOpen(false);
    setMoving(false);
    setPresence(action==="dismiss"?"departing":"arriving");
    const line=action==="dismiss"?"Alright, portal time. Call Tor when you need me.":"Now you need me? Let's pick up where we left off.";
    setStatus(line);
    if(autoSpeak)say(line);
    portalTimer.current=setTimeout(()=>setPresence(action==="dismiss"?"hidden":"visible"),settings.reducedMotion||osReduced?0:1000);
  }
  useEffect(()=>()=>{if(portalTimer.current)clearTimeout(portalTimer.current);},[]);
  const [roast, setRoast] = useState(() => readText("cq-tor-roast", settings.coach === "Spicy" ? "true" : "false") === "true");
  const [teachingLanguage, setTeachingLanguage] = useState(() => readText("cq-tor-teach-language", settings.language));
  const [observation, setObservation] = useState<WorkspaceObservation | null>(
    null,
  );
  const [mood, setMood] = useState("ready");
  const [speaking,setSpeaking]=useState(false);
  const [speechBeat,setSpeechBeat]=useState(0);
  const [gestureId,setGestureId]=useState(0);
  const [gestureClip,setGestureClip]=useState("");
  const lastSpokenObservation = useRef(0);
  const [reactionLabel,setReactionLabel]=useState("");
  const [proactive, setProactive] = useState(
    () => readText("cq-tor-observe", "true") === "true",
  );
  const previousObservation = useRef<WorkspaceObservation | null>(null);
  const lastRequest = useRef(0);
  const lastProactive = useRef(0);
  const personalityTurn = useRef(0);
  const [accent, setAccent] = useState(() =>
    readText("cq-tor-accent", "en-ZA"),
  );
  const accents = [
    { code: "en-ZA", name: "South African English" },
    { code: "en-NG", name: "Nigerian English" },
    { code: "en-KE", name: "Kenyan English" },
  ];
  const [question, setQuestion] = useState("");
  const {user}=useAuth();
  const conversation=useRef<TorMessage[]>([]);
  const [reply, setReply] = useState(tips[page] || tips.learn);
  const adventureError = useRef("");
  const [status, setStatus] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(
    () => readText("cq-tor-auto-speak", "true") === "true",
  );
  const [listening, setListening] = useState(false);
  const recognition = useRef<any>(null);
  const pendingAction = useRef<AbortController | null>(null);
  const voices = useVoices();
  const matchingVoices = voices.filter((v) =>
    v.lang.toLowerCase().split("-")[0] === teachingLanguage.split("-")[0],
  );
  const [voice, setVoice] = useState(() =>
    readText("cq-tor-voice", settings.voice),
  );
  function say(text: string, rate=settings.rate) {
    speakText(text,voice,rate,setStatus,teachingLanguage==="en-ZA"?accent:teachingLanguage,
      (active,index)=>{
        setSpeaking(active);
        if(active&&typeof index==="number")setSpeechBeat(n=>n+1);
      });
  }
  function react(kind:"highfive"|"dance"|"celebrate"|"nope"|"wow",voiceReaction=true){
    const item=chooseTorReaction(kind);
    setGestureClip(item.clip);
    setReactionLabel(item.title);
    setGestureId(n=>n+1);
    setMood(kind==="nope"?"concerned":kind==="dance"?"cheeky":"happy");
    const quip=reactionLine(kind,teachingLanguage);
    setReply(quip);
    if(voiceReaction&&autoSpeak)say(quip);
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
    if (autoSpeak) say(text);
  }
  async function ask(text: string) {
    lastRequest.current = Date.now();
    setMood("thinking");
    pendingAction.current?.abort();
    const request = cleanCoachRequest(text);
    if (!request) return;
    // Mission context contains authored objectives and earned progress only.
    // Resolve these locally, including for signed-in learners when AI is offline.
    // Never append editor contents or compiler output to an AI conversation.
    if (page === "adventure" && adventureContext) {
      if (/\b(hint|stuck|help me)\b/i.test(request)) {
        respond(adventureContext.hint);
        return;
      }
      if (/\b(error|compiler|compil(?:e|ation)|debug)\b/i.test(request)) {
        respond(adventureError.current || "Read the first compiler message, check its line number, and compare the method name and return type with the mission signature. Fix one thing, then run the tests again. Your attempts never reduce adventure XP.");
        return;
      }
      if (/\b(mission|objective|what.*next|summari[sz]e|summary|simpler|simply|break it down|explain this)\b/i.test(request)) {
        respond(adventureContext.completed === 3
          ? "Rookie Street is restored! You earned all three mission achievements. Replay any mission to practise, or open Lessons and the coding tools for your next skill."
          : `${adventureContext.title}: ${adventureContext.objective} ${adventureContext.completed} of 3 repairs earned. Run the mission tests to prove your fix; hints are always optional.`);
        return;
      }
    }
    if ((!user || !navigator.onLine) && /\b(summari[sz]e|summary|simpler|simply|break it down|what.*next)\b/i.test(request)) {
      respond(teachingLanguage !== "en-ZA" ? localizedFallback(teachingLanguage) : lessonId ? lessonSummary(lessonId) : workspaceSummary(observation, page));
      return;
    }
    if (/^(?:tor[, ]+)?(?:get out|go away|disappear|hide|take a break)[.!?]*$/i.test(request)) {
      portal("dismiss");return;
    }
    if (/^(?:hey )?tor[.!?]*$|^(?:tor[, ]+)?(?:come back|appear|show yourself)[.!?]*$/i.test(request)) {
      portal("summon");return;
    }
    const contextTopic = observation?.output && /error|failed|CS\d{4}/i.test(observation.output)?"debug error":page==="designer"?"button event":page==="terminal"?"debug error":"loop";
    if ((!user || !navigator.onLine) && /\b(roast me|roast my code|give me a roast)\b/i.test(request)) {
      respond(localizedLesson(contextTopic,teachingLanguage,true,++personalityTurn.current)||localizedFallback(teachingLanguage));
      const reaction=chooseTorReaction("dance");
      setGestureClip(reaction.clip);
      setReactionLabel(reaction.title);
      setGestureId(n=>n+1);
      return;
    }
    if ((!user || !navigator.onLine) && /\b(challenge me|coding challenge|give me a challenge)\b/i.test(request)) {
      respond(localizedChallenge(contextTopic,teachingLanguage));
      return;
    }
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
      /what (?:do you see|am i doing)|look at (?:my|the) (?:form|screen)/i.test(
        request,
      ) &&
      observation
    ) {
      respond(
        workspaceSummary(observation, page),
      );
      return;
    }
    if(user && navigator.onLine){
      const controller=new AbortController();pendingAction.current=controller;
      setStatus("Tor is thinking…");setReply("");
      try{
        const messages:TorMessage[]=[...conversation.current,{role:"user",content:request}];
        const response=await chatWithTor(messages,controller.signal,"student",teachingLanguage);
        if(controller.signal.aborted)return;
        conversation.current=[...messages,{role:"assistant" as const,content:response}].slice(-6);
        respond(response);
      }catch(error){if(!controller.signal.aborted){
        setStatus(error instanceof Error?error.message:"Tor’s AI is unavailable.");
        setMood("concerned");
        if (page === "adventure") {
          // navigator.onLine does not prove the provider is reachable. Keep
          // authored teaching available after an explicit AI request fails.
          setReply(answer(request, page, teachingLanguage, roast, ++personalityTurn.current));
        }
      }}
      finally{if(pendingAction.current===controller)pendingAction.current=null;}
      return;
    }
    if(teachingLanguage === "en-ZA" && /lecturer|classroom|assign|rubric|bookings.txt|historical file/i.test(request)){respond(studyReply(request,/lecturer|rubric|assign/i.test(request)?"lecturer":"student").text);return;}
    if (/^(hey|hi|hello|yo|howzit)[!.? ]*$/i.test(request)) respond("Hey! I’m Tor. What are we building or learning today? Sign in for an AI conversation, or I can help with the offline lessons.");
    else respond(answer(request, page, teachingLanguage, roast, ++personalityTurn.current));
  }
  function stop() {
    pendingAction.current?.abort();
    recognition.current?.abort();
    recognition.current = null;
    setListening(false);
    stopSpeech();
    setSpeaking(false);
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
    setSpeaking(false);
    recognition.current?.abort();
    const r = new Recognition();
    recognition.current = r;
    r.lang = teachingLanguage || "en-ZA";
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
        recognition.current=null;
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
  const manualMoveUntil = useRef(0);
  const box = useRef<HTMLElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  function move(x: number, y: number) {
    const rect = box.current?.getBoundingClientRect();
    const maxY = Math.max(8, innerHeight - (rect?.height || 160) - 8);
    const minY = Math.min(maxY, (document.querySelector(".app-header")?.getBoundingClientRect().bottom || 0) + 8);
    const p = {
      x: Math.max(8, Math.min(x, innerWidth - (rect?.width || 130) - 8)),
      y: Math.max(minY, Math.min(y, maxY)),
    };
    setPosition(p);
    writeText("cq-tor-position", JSON.stringify(p));
  }
  useEffect(() => {
    if (
      !roam ||
      open || presence!=="visible" ||
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
      if (!box.current || document.hidden) {
        setMoving(false);
        return;
      }
      if (drag.current || Date.now() < manualMoveUntil.current) {
        setMoving(false);
        start = 0;
        movement.current = setTimeout(() => { frame = requestAnimationFrame(walk); }, Math.max(1000, manualMoveUntil.current - Date.now()));
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
  }, [roam, open, presence, settings.reducedMotion, osReduced]);
  useEffect(() => {
    pendingAction.current?.abort();
    setReply(teachingLanguage === "en-ZA" ? (tips[page] || tips.learn) : localizedFallback(teachingLanguage));
    setStatus("");
    setObservation(null);
    previousObservation.current = null;
    setMood("ready");
  }, [page, teachingLanguage]);
  useEffect(() => {
    if (page !== "adventure" || !adventureContext) return;
    adventureError.current = "";
    setReply(`${adventureContext.title}: ${adventureContext.objective} Ask me for an optional hint, then test your fix.`);
    setMood("ready");
  }, [page, adventureContext?.title, adventureContext?.objective]);
  useEffect(() => {
    if (page !== "adventure") return;
    const adventure = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail || typeof detail.missionId !== "string" ||
        !["intro", "hint", "error", "success"].includes(detail.kind) ||
        typeof detail.text !== "string" || detail.text.length > 1500) return;
      // Keep authored debugging guidance available for a later explicit question,
      // even when the learner disables proactive workspace reactions.
      if (detail.kind === "error") adventureError.current = detail.text;
      else if (detail.kind === "success" || detail.kind === "intro") adventureError.current = "";
      if (!proactive || presence !== "visible" ||
        listening || pendingAction.current) return;
      const performance = chooseTorReaction(detail.kind === "success" ? "celebrate" : "wow");
      setGestureClip(performance.clip);
      setReactionLabel(detail.kind === "success" ? "Mission repaired!" : "Your adventure companion");
      setGestureId(n => n + 1);
      setMood(detail.kind === "success" ? "happy" : "ready");
      setReply(detail.text);
      setStatus("");
      // Automatic mission events remain silent. Reading is available through
      // Tor's existing explicit speech controls; no AI request is made here.
    };
    window.addEventListener("cq-adventure-tor", adventure);
    return () => window.removeEventListener("cq-adventure-tor", adventure);
  }, [page, proactive, presence, listening]);
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
      lastProactive.current = Date.now();
      setMood(reaction.mood);
      const performance=chooseTorReaction(reaction.mood==="happy"?"celebrate":reaction.mood==="concerned"?"nope":"wow");
      setGestureClip(performance.clip);
      setReactionLabel(performance.title);
      setGestureId(n=>n+1);
      setReply(text);
      if (autoSpeak && Date.now() - lastSpokenObservation.current >= 8000) { lastSpokenObservation.current = Date.now(); say(text); }
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
  const message = reply;
  if(presence==="hidden")return <aside className="tor-summon" aria-label="Summon Tor">
    <button onClick={()=>portal("summon")}>Call Tor</button>
    <button onClick={listen} aria-label="Call Tor by voice">🎙</button>
    <span role="status" aria-live="polite" aria-atomic="true">{status}</span>
  </aside>;
  return (
    <aside
      ref={box}
      className={`tor-coach ${open ? "expanded" : ""} ${speaking ? "speaking" : ""}`}
      aria-label="Tor hologram tutor"
      data-presence={presence}
      data-moving={moving}
      data-mood={
        listening ? "listening" : speaking ? "speaking" : mood
      }
      style={
        position
          ? { left: position.x, top: position.y, right: "auto", bottom: "auto" }
          : undefined
      }
    >
      {presence!=="visible"&&<div className="tor-portal" aria-hidden="true"/>}
      <button className="tor-dismiss" aria-label="Dismiss Tor through portal" onClick={()=>portal("dismiss")}>✦</button>
      <button
        className="tor-handle"
        aria-label="Move Tor hologram"
        aria-describedby="tor-move-help"
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
        title="Drag to move. Arrow keys move 16 pixels."
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          manualMoveUntil.current = Date.now() + 15000;
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
            manualMoveUntil.current = Date.now() + 15000;
            const r = box.current!.getBoundingClientRect();
            move(r.left + delta[e.key][0], r.top + delta[e.key][1]);
          }
        }}
      >
        ⠿ TOR · drag me
      </button>
      <span id="tor-move-help" className="sr-only">Use the arrow keys to move Tor 16 pixels. Position is saved on this device.</span>
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
                : speaking
                  ? "speaking"
                  : mood
            }
            moving={moving}
            speaking={speaking}
            speechBeat={speechBeat}
            gestureClip={gestureClip}
            gestureId={gestureId}
            reactionLabel={reactionLabel}
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
          {user && <a className="tor-study-link" href="#tor" onClick={()=>setOpen(false)}>Open Tor study desk · more room to read ↗</a>}
          <div className="tor-observation" aria-label="What Tor sees">
            <b>What I see</b>
            <br />
            {observation
              ? describeObservation(observation)
              : page === "adventure" && adventureContext
                ? `${adventureContext.title} · ${adventureContext.completed}/3 Rookie Street repairs earned. Your editor stays private.`
              : `You're on ${page}. Waiting for workspace activity.`}
          </div>
          <p className="tor-reply">{message}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
          >
            <label htmlFor="tor-question">{page === "adventure" ? "Ask about your mission or C#" : "Ask about C# or your form"}</label>
            <input
              id="tor-question"
              value={question}
              maxLength={250}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={page === "adventure" ? "What is my mission? Give me a hint." : "Add a label that says Student Name"}
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
          <div className="tor-reactions" role="group" aria-label="Play with Tor's 3D reactions">
            <button type="button" onClick={()=>react("highfive")} aria-label="High five Tor">✋ High five</button>
            <button type="button" onClick={()=>react("dance")} aria-label="Make Tor dance">♫ Dance</button>
            <button type="button" onClick={()=>react("celebrate")} aria-label="Make Tor celebrate">★ Celebrate</button>
            <button type="button" onClick={()=>react("nope")} aria-label="Make Tor act shocked">!? Plot twist</button>
          </div>
          <div className="tor-quick-quests" aria-label="Tor fun learning shortcuts">
            <button type="button" onClick={() => void ask("Explain this simply")}>Explain simply</button>
            <button type="button" onClick={() => void ask("Roast my code")}>Roast my code</button>
            <button type="button" onClick={() => void ask("Challenge me")}>Give me a challenge</button>
          </div>
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
              onChange={(e) => { const on=e.target.checked; setRoast(on); writeText("cq-tor-roast", String(on)); const updated=localizedLesson(question,teachingLanguage,on); if(updated)setReply(updated); }}
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
                if (!e.target.checked) {stopSpeech();setSpeaking(false);}
              }}
            />{" "}
            Speak replies automatically
          </label>
          <label>
            Tor teaching language
            <select
              aria-label="Tor teaching language"
              value={teachingLanguage}
              onChange={(e) => {
                const next=e.target.value;
                setTeachingLanguage(next);
                writeText("cq-tor-teach-language",next);
                setVoice("");writeText("cq-tor-voice","");
                setReply(localizedFallback(next));
                stopSpeech();
              }}
            >
              {TOR_LANGUAGES.map(item=><option key={item.code} value={item.code}>{item.name}</option>)}
            </select>
          </label>
          <small>Tor teaches key programming topics in this language. Full lessons and menus stay in English. Device speech and microphone support vary by browser.</small>
          {teachingLanguage === "en-ZA" && <label>
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
          </label>}
          {teachingLanguage === "en-ZA" && !voices.some(
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
              <option value="">Automatic · matching device voice</option>
              {matchingVoices.map((v) => (
                <option key={v.voiceURI || v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </label>
          <div className="tor-actions">
            <button onClick={() => say(message)}>Tor, speak</button>
            <button onClick={() => say(message,Math.min(0.8,settings.rate))}>Speak slower</button>
            <button onClick={stop}>Stop voice</button>
          </div>
          <details className="tor-command-help">
            <summary>Things you can ask Tor to do</summary>
            <p>
              Add a label that says Student Name. Set text to Welcome. Rename to
              lblWelcome. Select label1. Move right 24 pixels. Review my form.
              Start preview. Type Jake into txtName. Click btnSave. Stop
              preview. Undo. Open Code Lab. Open Code Terminal. Challenge me. Roast my code.
            </p>
          </details>
          <small role="status" aria-live="polite" aria-atomic="true">
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
