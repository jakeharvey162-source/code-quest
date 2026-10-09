import test from "node:test";
import assert from "node:assert/strict";
import {
  selectDeviceVoice,
  tutorVoices,
  voiceSamples,
} from "../src/lib/voice-catalog.mjs";
const voices = [
  { name: "American", lang: "en-US", localService: true },
  { name: "South African", lang: "en-ZA", localService: true },
  { name: "French", lang: "fr-FR", localService: true },
  { name: "Portuguese", lang: "pt_PT", localService: true },
];
test("automatic voice selection prefers the matching locale and rejects another language", () => {
  assert.equal(selectDeviceVoice(voices, "en-ZA").name, "South African");
  assert.equal(selectDeviceVoice(voices, "fr-FR", "American").name, "French");
  assert.equal(selectDeviceVoice(voices, "pt-PT").name, "Portuguese");
  assert.equal(selectDeviceVoice(voices, "zu-ZA"), null);
  assert.equal(selectDeviceVoice([], "sw-KE"), null);
});
test("catalog uses a Swahili-capable model and does not invent a native isiZulu voice", () => {
  assert.equal(tutorVoices["sw-KE"].model, "eleven_v3");
  assert.equal(tutorVoices["zu-ZA"].voiceId, null);
  for (const language of Object.keys(tutorVoices))
    assert.ok(voiceSamples[language]);
});

test("local account storage never reuses guest or another account keys", async () => {
  const { setDataOwner, readText, writeText, removeText } =
    await import("../src/lib/local-data.ts");
  const values = new Map();
  const original = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  try {
    setDataOwner(null);
    writeText("cq-progress-v1", "guest");
    setDataOwner("user-a");
    assert.equal(readText("cq-progress-v1"), "");
    writeText("cq-progress-v1", "private-a");
    setDataOwner("user-b");
    assert.equal(readText("cq-progress-v1"), "");
    writeText("cq-progress-v1", "private-b");
    removeText("cq-progress-v1");
    setDataOwner("user-a");
    assert.equal(readText("cq-progress-v1"), "private-a");
    setDataOwner(null);
    assert.equal(readText("cq-progress-v1"), "guest");
  } finally {
    setDataOwner(null);
    globalThis.localStorage = original;
  }
});

test("automatic African voice uses a matching natural voice before a legacy voice", () => {
  const african = [
    { name: "Legacy South African", lang: "en-ZA" },
    { name: "Leah Online (Natural)", lang: "en-ZA" },
    { name: "Abeo Online (Natural)", lang: "en-NG" },
  ];
  assert.equal(
    selectDeviceVoice(african, "en-ZA").name,
    "Leah Online (Natural)",
  );
  assert.equal(
    selectDeviceVoice(african, "en-NG").name,
    "Abeo Online (Natural)",
  );
  assert.equal(
    selectDeviceVoice(african, "en-ZA", "Legacy South African").name,
    "Legacy South African",
  );
});
