const ideas = {
  variables: "Think of a variable as a labelled box: its type says what fits inside, and its value is what is in it now.",
  strings: "A string is text, even when it contains digits. Join words with +; convert text before doing maths.",
  conditions: "An if statement is a fork in the road. A true condition takes one route; false takes the other.",
  logic: "With AND, both checks must pass. With OR, either one is enough. NOT flips the answer.",
  methods: "A method is a reusable job: give it inputs, let it work, then use the value it returns.",
  loops: "A loop repeats a job. Track the counter and the stopping condition so it stops at the right moment.",
  arrays: "An array is a row of numbered boxes. The first box is number zero; a loop can visit each one.",
  validation: "Check input before using it. TryParse lets you reject bad text without crashing your app.",
  "student-number": "Check two separate things: exactly eight characters, and every character must be a digit.",
  controls: "Your form is a conversation: textboxes collect answers, buttons trigger actions, and labels show results.",
  events: "Drawing a button gives it an appearance. Its Click handler gives it a job when someone presses it.",
  choices: "Use checkboxes for independent choices and radio buttons for one choice from a group.",
  "collections-ui": "A list keeps several items together. Add, remove or clear items when the user asks; keep the display in sync.",
  classes: "A class is a blueprint. Each object built from it has its own data and can do the jobs in that blueprint.",
  encapsulation: "Protect the data behind a small set of sensible operations. Outside code should not break the object's rules.",
  inheritance: "A child class reuses a parent class and adds a special role. Use inheritance when the child really is a kind of parent.",
  polymorphism: "The same method call can do different jobs for different objects. The object's actual type chooses the overridden method.",
  abstraction: "Show the useful controls and hide the machinery. An abstract member says what a child must implement.",
  interfaces: "An interface is a promise about what an object can do. Different classes can keep the same promise in different ways.",
  layout: "A useful form stays readable when its window changes size. Anchors and docking keep controls where users expect them.",
  "forms-validation": "Treat the whole form as one set of rules. Explain what needs fixing before saving, closing or moving on.",
};
export function explainProblem(output = "") {
  const code = String(output).match(/\bCS\d{4}\b/)?.[0];
  const explanations = {
    CS0103: "C# cannot find a name you used. Check its spelling and whether that variable or control exists in this scope.",
    CS1002: "A statement needs a semicolon. Check the reported line and the line just before it.",
    CS0029: "The value and its destination have different types. Convert deliberately instead of treating text as a number.",
    CS1503: "An argument has the wrong type for this method. Compare your input with the method's parameter type.",
    CS0165: "A variable might be used before it gets a value. Make sure every route assigns it first.",
  };
  if (code) return `${code}: ${explanations[code] || "Start with this first compiler error. Check its line and the nearby statement before changing more code."}`;
  if (/DivideByZeroException/i.test(output)) return "The calculation divides by zero. Reject zero before dividing, then test the smallest valid value.";
  if (/FormatException/i.test(output)) return "The input could not be converted. Use TryParse and show a helpful message for invalid input.";
  if (/No handler|Event wired/i.test(output)) return "The button is connected to a handler that cannot run yet. Open its Click event and check that the method exists.";
  return "The run needs attention. Compare the first actual result with the expected result, trace one input, and fix the first place they differ.";
}
export function lessonSummary(id, stage = 0, feedback = "") {
  const idea = ideas[id] || "Break this task into input, processing and output. Check what each step is responsible for.";
  const action = ["Try a small example and explain why it works.", "Trace each statement before choosing an answer.", "Build the smallest working version, then test a boundary value.", "Find the first line where the result goes wrong; change one thing and test again.", "Use the idea in this new problem without copying the earlier answer."][stage] || "Test your understanding with a new example.";
  return `${idea} ${/\bCS\d{4}\b|exception|failed|error/i.test(feedback) ? explainProblem(feedback) : action}`;
}
export function workspaceSummary(now, page = "home") {
  if (!now) return ({home: "Choose a path in World, try one quest, then test yourself with a code challenge.",learn: "Read the idea, predict what happens, then prove it with a small example.",challenges: "Solve one method at a time. Test cases show where your answer differs; XP comes from fixing the logic.",terminal: "Run a small example first. Then compare its output with what you expected."})[page] || "Tell me the part that is confusing. We'll reduce it to one idea and one next step.";
  if (/\bCS\d{4}\b|exception|failed|error|No handler/i.test(now.output)) return explainProblem(now.output);
  if (now.issues?.length) return `First fix: ${String(now.issues[0]).slice(0,180)}. Fix that one issue, run again, then check the next one.`;
  if (now.page === "designer") {
    if (now.mode === "Running Form1") return "Your form is running. Try a normal value, an empty value and an invalid value; each should get a sensible response.";
    if (!now.controls) return "Start with a textbox for input, a button for the action and a label for the answer. Connect the button's Click event, then test it.";
    const selected = String(now.selected || "").slice(0,80);
    const caption = now.caption ? ` It displays “${String(now.caption).slice(0,120)}”.` : "";
    if (/label|lbl/i.test(now.selected)) return `Selected ${selected}.${caption} This label is your app's answer area. Text is the message people see; Name is the reference your code uses. Update its Text inside the button's Click event.`;
    if (/button|btn/i.test(now.selected)) return "Give this button one clear job. In its Click event, validate the input, do the calculation, then show the result.";
    return "Think input → action → result. Give each control one job, connect an event, then test both valid and invalid input.";
  }
  if (now.output) return "You have an output to inspect. Check it against your prediction, then try an edge case; one successful run does not cover every input.";
  return "Before running, write down the input and expected answer. Trace how the values change, then compare with the actual output.";
}
