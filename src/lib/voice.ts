import { selectDeviceVoice } from "./voice-catalog.mjs";
export function voiceError(error: string) {
  return (
    (
      {
        "not-allowed":
          "Microphone permission was denied. Allow microphone access in the browser site settings, then try again.",
        "service-not-allowed":
          "This browser does not allow speech recognition here. Use the buttons or text input.",
        "audio-capture": "No microphone was found. Connect one and try again.",
        "no-speech": "No speech was detected. Try again in a quieter place.",
        network:
          "The browser recognition service could not connect. Check your connection.",
        "language-not-supported":
          "The selected speech language is not supported by this device.",
      } as Record<string, string>
    )[error] ||
    "Voice input could not finish. You can still use every feature with the buttons."
  );
}
export const voiceCommands: Record<string, Record<string, string>> = {
  "en-ZA": {
    home: "open home",
    learn: "open lessons",
    designer: "open designer",
    assessment: "open assessment",
    settings: "open settings",
    progress: "open progress",
    playground: "open code lab",
    stop: "stop",
  },
  "zu-ZA": {
    home: "vula ikhaya",
    learn: "vula izifundo",
    designer: "vula umklami",
    assessment: "vula ukuhlolwa",
    settings: "vula izilungiselelo",
    progress: "vula inqubekelaphambili",
    playground: "vula ikhodi",
    stop: "yima",
  },
  "fr-FR": {
    home: "ouvre accueil",
    learn: "ouvre les leçons",
    designer: "ouvre le designer",
    assessment: "ouvre évaluation",
    settings: "ouvre paramètres",
    progress: "ouvre progression",
    playground: "ouvre laboratoire",
    stop: "arrête",
  },
  "pt-PT": {
    home: "abrir início",
    learn: "abrir lições",
    designer: "abrir designer",
    assessment: "abrir avaliação",
    settings: "abrir definições",
    progress: "abrir progresso",
    playground: "abrir laboratório",
    stop: "parar",
  },
  "sw-KE": {
    home: "fungua nyumbani",
    learn: "fungua masomo",
    designer: "fungua mbunifu",
    assessment: "fungua tathmini",
    settings: "fungua mipangilio",
    progress: "fungua maendeleo",
    playground: "fungua maabara",
    stop: "simama",
  },
};
const normalized = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[.!?]/g, "")
    .replace(/\s+/g, " ");
export function commandFor(text: string) {
  const s = normalized(text);
  for (const commands of Object.values(voiceCommands))
    for (const [page, command] of Object.entries(commands))
      if (s === normalized(command)) return page;
  if (/^(go to |open |show )?(home|world|map)$/.test(s)) return "home";
  if (/^(go to |open |show )?(lessons|learn|quests)$/.test(s)) return "learn";
  if (/^(go to |open |show )?(designer|winforms|forms)$/.test(s))
    return "designer";
  if (/^(go to |open |show )?(assessment|assessments|arena)$/.test(s))
    return "assessment";
  if (/^(go to |open |show )?(settings|preferences)$/.test(s))
    return "settings";
  if (/^(go to |open |show )?(progress|profile)$/.test(s)) return "progress";
  if (/^(go to |open |show )?(code lab|scratchpad|playground)$/.test(s))
    return "playground";
  if (s === "stop speaking") return "stop";
  return null;
}
let speechGeneration = 0;
let pendingVoiceLoad: (() => void) | undefined;
let activeUtterance: SpeechSynthesisUtterance | undefined;
export function speechToken() {
  return speechGeneration;
}
export function stopSpeech(expectedToken?: number) {
  if (expectedToken !== undefined && expectedToken !== speechGeneration) return;
  speechGeneration++;
  pendingVoiceLoad?.();
  pendingVoiceLoad = undefined;
  activeUtterance = undefined;
  window.speechSynthesis?.cancel();
}
export function speakText(
  text: string,
  voiceName: string,
  rate: number,
  onStatus: (s: string) => void,
  language = "en-ZA",
) {
  if (
    !("speechSynthesis" in window) ||
    !("SpeechSynthesisUtterance" in window)
  ) {
    onStatus(
      "Read-aloud is unavailable in this browser. The text remains on screen.",
    );
    return false;
  }
  stopSpeech();
  const generation = speechGeneration;
  const synth = window.speechSynthesis;
  function play() {
    if (generation !== speechGeneration) return;
    const voices = synth.getVoices();
    const selected = selectDeviceVoice(voices, language, voiceName);
    if (!selected && language.split("-")[0] !== "en") {
      onStatus(
        `No ${language} voice is installed on this device. Install a matching speech voice in your device settings.`,
      );
      return;
    }
    function utter(voice: SpeechSynthesisVoice | null, retry: boolean) {
      const u = new SpeechSynthesisUtterance(text.slice(0, 5000));
      activeUtterance = u;
      if (voice) u.voice = voice;
      u.lang = voice?.lang || language;
      u.rate = Number.isFinite(rate) ? Math.min(2, Math.max(0.5, rate)) : 1;
      u.pitch = 1;
      u.onstart = () => {
        if (generation === speechGeneration) onStatus("Speaking…");
      };
      u.onend = () => {
        if (generation === speechGeneration) {
          activeUtterance = undefined;
          onStatus("Finished reading.");
        }
      };
      u.onerror = (e) => {
        if (generation !== speechGeneration) return;
        if (e.error === "canceled" || e.error === "interrupted") {
          onStatus("Reading stopped.");
          return;
        }
        const fallback = voices.find(
          (v) =>
            v.name !== voice?.name &&
            v.lang.split("-")[0] === language.split("-")[0],
        );
        if (!retry && fallback) {
          utter(fallback, true);
          return;
        }
        activeUtterance = undefined;
        onStatus(
          "No working speech voice is available here. Try another voice, or Chrome/Edge with an installed English voice.",
        );
      };
      onStatus("Preparing read-aloud…");
      try {
        synth.speak(u);
      } catch {
        activeUtterance = undefined;
        onStatus(
          "The speech service couldn't start. Try another voice or browser.",
        );
      }
    }
    utter(selected, false);
  }
  if (synth.getVoices().length) play();
  else {
    onStatus("Loading device voices…");
    let timer: ReturnType<typeof setTimeout>;
    const ready = () => {
      if (!synth.getVoices().length) return;
      cleanup();
      play();
    };
    const cleanup = () => {
      clearTimeout(timer);
      synth.removeEventListener?.("voiceschanged", ready);
      if (pendingVoiceLoad === cleanup) pendingVoiceLoad = undefined;
    };
    pendingVoiceLoad = cleanup;
    synth.addEventListener?.("voiceschanged", ready);
    timer = setTimeout(() => {
      cleanup();
      play();
    }, 1000);
  }
  return true;
}
