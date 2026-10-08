// Selected from ElevenLabs' connected voice library, 7 October 2026.
// Library metadata describes an accent; it is not a native-speaker quality review.
export const tutorVoices = Object.freeze({
  "en-ZA": {
    name: "Peter",
    voiceId: "wldVCiOxtkWPlsr2mHyo",
    accent: "South African English",
    model: "eleven_multilingual_v2",
  },
  "fr-FR": {
    name: "Enrick",
    voiceId: "0xHziZolI8Tp6rLtUqh2",
    accent: "Standard French",
    model: "eleven_multilingual_v2",
  },
  "pt-PT": {
    name: "Adilson",
    voiceId: "A26KfvFuSKaMzhhYkSlQ",
    accent: "European Portuguese",
    model: "eleven_multilingual_v2",
  },
  "sw-KE": {
    name: "Halima",
    voiceId: "i5oE89JoUCpIgvSOemWx",
    accent: "Tanga, Tanzania",
    model: "eleven_v3",
  },
  "zu-ZA": {
    name: "Language-matched device voice",
    voiceId: null,
    accent: "isiZulu voice availability depends on your device",
    model: null,
  },
});

export function selectDeviceVoice(voices, language, preferredName = "") {
  const normalize = (value) => value.toLowerCase().replaceAll("_", "-");
  const desired = normalize(language);
  const base = desired.split("-")[0];
  const matching = voices.filter(
    (voice) => normalize(voice.lang).split("-")[0] === base,
  );
  return (
    matching.find((voice) => voice.name === preferredName) ||
    matching.find((voice) => normalize(voice.lang) === desired) ||
    matching.find((voice) => /natural|neural|google/i.test(voice.name)) ||
    matching.find((voice) => voice.localService) ||
    matching[0] ||
    null
  );
}

export const voiceSamples = Object.freeze({
  "en-ZA":
    "Welcome to CodeQuest. I am Tor. Let us learn to code, one step at a time.",
  "fr-FR":
    "Bienvenue dans CodeQuest. Je suis Tor. Apprenons à programmer, étape par étape.",
  "pt-PT":
    "Bem-vindo ao CodeQuest. Sou o Tor. Vamos aprender a programar, passo a passo.",
  "sw-KE":
    "Karibu CodeQuest. Mimi ni Tor. Tujifunze kuandika programu, hatua kwa hatua.",
  "zu-ZA":
    "Siyakwamukela ku-CodeQuest. Ngingu-Tor. Masifunde ukubhala ikhodi, isinyathelo ngesinyathelo.",
});
