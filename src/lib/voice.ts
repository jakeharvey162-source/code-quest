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
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 5000));
  const selected = selectDeviceVoice(
    window.speechSynthesis.getVoices(),
    language,
    voiceName,
  );
  if (!selected && language.split("-")[0] !== "en") {
    onStatus(
      `No ${language} voice is installed on this device. Install a matching speech voice in your device settings.`,
    );
    return false;
  }
  if (selected) utterance.voice = selected;
  utterance.lang = selected?.lang || language;
  utterance.rate = rate;
  utterance.onstart = () => onStatus("Speaking…");
  utterance.onend = () => onStatus("Finished reading.");
  utterance.onerror = (e) =>
    onStatus(
      e.error === "canceled" || e.error === "interrupted"
        ? "Reading stopped."
        : "The selected voice could not play. Try another device voice.",
    );
  window.speechSynthesis.speak(utterance);
  onStatus("Preparing read-aloud…");
  return true;
}
