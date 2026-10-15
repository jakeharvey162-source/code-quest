import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readStudyHistory,
  storeStudyHistory,
  studyReply,
  studyTopic,
  studyQuestion,
} from "../src/lib/tor-study.mjs";
import { equipmentProject } from "../src/lib/equipment-project.mjs";
import { readProject } from "../src/lib/project-reader.mjs";
test("Tor distinguishes planning, file recovery and built-in capability", () => {
  assert.match(
    studyReply("Create an assignment and rubric", "lecturer").text,
    /not an official UJ rubric/,
  );
  assert.match(
    studyReply("Where is bookings.txt?").text,
    /does not contain bookings.txt/,
  );
  assert.match(
    studyReply("Can you browse the web?").text,
    /does not contact a language model/,
  );
  assert.match(
    studyReply("Can you browse the web?", "lecturer", "classroom").text,
    /does not contact a language model/,
  );
  assert.match(
    studyReply("Help me debug the equipment booking practice").text,
    /all six constructor arguments/,
  );
  assert.doesNotMatch(
    studyReply("Explain properties and constructors").text,
    /A Label/,
  );
  assert.equal(studyTopic("What about a setter?", "files"), "objects");
  assert.ok(studyQuestion(0, "files").choices.length > 1);
  assert.equal(readStudyHistory("bad").length, 0);
  assert.equal(
    readStudyHistory(
      JSON.stringify(
        Array.from({ length: 25 }, () => ({
          question: "q",
          answer: "a",
          role: "student",
          topic: "bad",
        })),
      ),
    ).length,
    10,
  );
});
test("practice project preserves broken source and excludes private IDE/build indexes", async () => {
  const files = await readProject("Practice.zip", equipmentProject());
  assert.ok(
    files.some(
      (f) =>
        f.name.endsWith("EquipmentBooking.cs") &&
        f.text.includes("set { EquipmentNumber = value; }"),
    ),
  );
  assert.ok(files.some((f) => f.name.endsWith("Form1.cs")));
  assert.ok(files.every((f) => !/(\.vs|obj|bin)\//.test(f.name)));
  assert.ok(!files.some((f) => f.name.endsWith("bookings.txt")));
});

test("offline greetings are relevant and longer AI history fits a cloud draft without losing the latest question", () => {
  assert.match(studyReply("hey").text, /Hey!/);
  assert.doesNotMatch(studyReply("hey").text, /first error|breakpoint/);
  const rows = Array.from({ length: 10 }, (_, i) => ({
    question: "x".repeat(5990) + i,
    answer: "a".repeat(4000),
    role: "student",
    engine: "ai",
  }));
  const saved = storeStudyHistory(rows);
  assert.ok(saved.length <= 45000);
  assert.ok(JSON.parse(saved).at(-1).question.endsWith("9"));
});
