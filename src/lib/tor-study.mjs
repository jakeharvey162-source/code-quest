import { localizedLesson } from "./tor-teaching.mjs";
import { practiceQuestion } from "./continuous-practice.mjs";
export const torSources = [
  {
    title: "Debug C# and inspect values",
    url: "https://learn.microsoft.com/en-us/visualstudio/get-started/csharp/tutorial-debugger",
    topic: "debug",
  },
  {
    title: "WinForms event handlers",
    url: "https://learn.microsoft.com/en-us/dotnet/desktop/winforms/controls/how-to-add-an-event-handler",
    topic: "events",
  },
  {
    title: "C# properties",
    url: "https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/properties",
    topic: "objects",
  },
  {
    title: "Read text-file lines",
    url: "https://learn.microsoft.com/en-us/dotnet/api/system.io.file.readalllines?view=netframework-4.8.1",
    topic: "files",
  },
];
export function studyTopic(text, previous = "debug") {
  if (/classroom|assign|lecturer|rubric|marking|grade|progress/i.test(text))
    return "classroom";
  if (/file|record|load|persist|split|bookings.txt/i.test(text)) return "files";
  if (
    /constructor|property|properties|setter|getter|encapsul|object|inherit/i.test(
      text,
    )
  )
    return "objects";
  if (/event|button|click|form/i.test(text)) return "events";
  if (/valid|tryparse|parse|boundary/i.test(text)) return "validation";
  if (/debug|error|breakpoint|trace|loop|repair|equipment|practice/i.test(text))
    return "debug";
  return previous;
}
export function studyReply(question, role = "student", previous = "debug") {
  const topic = studyTopic(question, previous);
  if (/bookings.txt|histor|missing file/i.test(question))
    return {
      topic: "files",
      text: "The supplied Practice Question 15 OCT ZIP does not contain bookings.txt. Keep a backup of what you received and obtain the actual file from your lecturer or project handover. The sample rows in the paper are useful test fixtures; they do not establish historical recovery. In Visual Studio, use a stable runtime data path and copy the recovered file to output. Test a missing file, blanks, malformed records and reopening the app. The CodeQuest browser mission models record parsing; it cannot verify your Windows disk or Form Load event.",
    };
  if (
    role === "lecturer" &&
    /assign|generate|rubric|question|mark|plan/i.test(question)
  )
    return {
      topic,
      text: "Suggested repair assignment\n1. Give learners a broken booking class and ask them to repair constructor and setter assignments. Require direct property tests.\n2. Supply valid and invalid pipe-separated records. Ask learners to retain saved statuses, skip bad rows and summarize skipped records.\n3. Ask for valid capture, inclusive day boundaries, active duplicate rejection and correct statistics.\n\nSuggested rubric (adapt to your module): class repair 25%, loading and persistence 30%, validation and statistics 30%, evidence and explanation 15%. This is a planning aid, not an official UJ rubric.\n\nIn Classroom, create your class, assign a repair mission and share its invitation code. Learners choose when to share progress. Use their exported Windows project and test evidence for assessment; CodeQuest progress is self-reported.",
    };
  if (/chatgpt|internet|browse|web|ai model/i.test(question))
    return {
      topic,
      text: "This Tor study desk uses built-in course coaching and local question templates. It does not contact a language model or browse pages. The official-document links open the web when you choose them. Your conversation stays in your CodeQuest progress on this device and is included if you enable cloud backup. Use New practice question for varying exercises, or ask about debugging, events, validation, files or properties.",
    };
  if (topic === "classroom")
    return {
      topic,
      text: "A real lecturer creates a class and shares its invitation code. Signed-in learners join, open assigned quests or repair missions, and use Share my progress when they want to update the lecturer. Community and friend-consent private chats are inside Classroom. Classroom does not supply a lecturer automatically. Joining shares the profile name; progress sharing sends completed quest IDs and XP, not code drafts. Ask your lecturer how they want repair evidence submitted.",
    };
  if (/equipment.*(?:booking|practice)|booking practice/i.test(question))
    return {
      topic: "debug",
      text: "For the equipment-booking practice, work in this order:\n1. Build first: repair syntax/type errors and inspect Form Load and button subscriptions.\n2. Test the class: all six constructor arguments, every property assignment, and CompleteBooking on the same object.\n3. Recover records: the supplied ZIP has no bookings.txt. Obtain the actual historical file; use sample input only as test fixtures. Check seven fields, saved statuses and malformed rows.\n4. Validate capture: nine digits, trimmed name, uppercase equipment code, allowed type, days 1–7 inclusive, Boolean accessories and active duplicate rejection.\n5. Check statistics: total = booked + completed. Complete a booking and check that its equipment can be booked again.\n\nUse the equipment mission’s console and Check repairs for logic. Record & trace and F10 show recorded checkpoints. Test native event wiring, disk paths and reopening in Visual Studio.",
    };
  const key =
    {
      debug: /loop|foreach|while|\bfor\b/i.test(question)
        ? "loop"
        : "debug error",
      events: "button event",
      validation: "validation TryParse",
      files: "file persistence",
      objects: "constructor property",
    }[topic] || "debug error";
  const explanation =
    topic === "objects"
      ? "A constructor initializes a new object. In this.name = name, this.name is the field and name is the parameter. A property getter reads its backing field; its setter stores the supplied value. For example: public string Name { get { return name; } set { name = value; } }. Assigning Name inside its own setter would recurse. Each object should keep its own state."
      : topic === "files"
        ? "A text-file record is a string until you parse it. Split the line on the expected separator, check the field count before using indexes, and use TryParse for numbers and Booleans. Keep saved statuses when loading. Skip malformed records without throwing away valid ones, and show a single summary of skipped rows. Test real disk paths and reopening in the native project."
        : localizedLesson(key, "en-ZA", false, 0);
  const next = {
    debug:
      "Try this: put a breakpoint before the suspicious assignment, predict the current values, step once, then compare. In CodeQuest, Record & trace captures values at trace comments; F10 replays snapshots.",
    events:
      "Try this: check the event subscription, put a breakpoint in the handler, click once and verify it runs once. A method with a matching name is not automatically connected.",
    validation:
      "Try this: write one valid input, the two exact boundary values, and one invalid value. Check every rule before creating or adding an object.",
    files:
      "Try this: load one valid row, one malformed row, a blank line and a saved Completed row. Confirm the good rows survive and statuses are preserved.",
    objects:
      "Try this: construct an object, read every property, then assign a new value to each setter and read it back. Test a second object to confirm it has independent state.",
  }[topic];
  return {
    topic,
    text:
      (explanation || "Let’s work through one repair at a time.") +
      "\n\n" +
      next +
      "\n\nIf this does not match your question, name the topic and describe the expected result. For arbitrary code analysis, use the compiler and test output in Code Challenges.",
  };
}
export function readStudyHistory(raw) {
  try {
    const rows = JSON.parse(raw || "[]");
    return Array.isArray(rows)
      ? rows
          .filter(
            (r) =>
              r &&
              typeof r.question === "string" &&
              typeof r.answer === "string" &&
              ["student", "lecturer"].includes(r.role),
          )
          .slice(-10)
          .map((r) => ({
            ...r,
            question: r.question.slice(0, 1000),
            answer: r.answer.slice(0, 2500),
            topic: studyTopic(
              "",
              r.topic &&
                [
                  "classroom",
                  "files",
                  "objects",
                  "events",
                  "validation",
                  "debug",
                ].includes(r.topic)
                ? r.topic
                : "debug",
            ),
          }))
      : [];
  } catch {
    return [];
  }
}
export function studyQuestion(seed, topic) {
  return practiceQuestion(
    seed,
    { debug: 1, events: 2, validation: 2, files: 4, objects: 5 }[topic] || 0,
  );
}
