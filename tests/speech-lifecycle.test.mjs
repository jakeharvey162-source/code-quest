import test from "node:test";
import assert from "node:assert/strict";
import { speakText, stopSpeech } from "../src/lib/voice.ts";
test("speech waits for late voices, ignores stale callbacks and retries a failing voice", async () => {
  const listeners = new Set(),
    spoken = [];
  let voices = [];
  globalThis.window = {
    speechSynthesis: {
      getVoices: () => voices,
      addEventListener: (e, fn) => listeners.add(fn),
      removeEventListener: (e, fn) => listeners.delete(fn),
      cancel() {},
      speak: (u) => spoken.push(u),
    },
  };
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
    }
  };
  window.SpeechSynthesisUtterance = globalThis.SpeechSynthesisUtterance;
  const status = [];
  try {
    speakText("Hello there", "", 1, (s) => status.push(s));
    assert.equal(spoken.length, 0);
    assert.equal(status.at(-1), "Loading device voices…");
    voices = [
      { name: "Google English", lang: "en-US" },
      { name: "Local English", lang: "en-US" },
    ];
    for (const fn of listeners) fn();
    assert.equal(spoken[0].voice.name, "Google English");
    spoken[0].onerror({ error: "voice-unavailable" });
    assert.equal(spoken[1].voice.name, "Local English");
    spoken[1].onstart();
    assert.equal(status.at(-1), "Speaking…");
    stopSpeech();
    const last = status.at(-1);
    spoken[1].onend();
    assert.equal(status.at(-1), last);
    voices = [];
    speakText("Cancelled", "", 1, (s) => status.push(s));
    stopSpeech();
    await new Promise((r) => setTimeout(r, 1100));
    assert.equal(spoken.length, 2);
    assert.equal(listeners.size, 0);
  } finally {
    stopSpeech();
    delete globalThis.window;
    delete globalThis.SpeechSynthesisUtterance;
  }
});
