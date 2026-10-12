// Small, offline, curated creativity prompts. No paid model or untrusted runtime.
export const TERMINAL_MISSIONS = Object.freeze({
  javascript: [
    { title: "Make the heart dance", task: "Change the heart's color and make it pulse at a new speed.", hint: "Find fillStyle or the animation timing. Change one value and press F5." },
    { title: "Make the screen celebrate", task: "Add a second animated shape or a custom birthday greeting.", hint: "Start with the existing example. Try another fillText or a new canvas path." },
    { title: "Bug hunter", task: "Intentionally create a simple syntax error, run it, then fix it.", hint: "A missing bracket is enough. Read the console error and restore the bracket." },
  ],
  typescript: [
    { title: "Typed birthday hero", task: "Use a typed string for a friend and display it on the Canvas.", hint: "Try const name: string = \"Friend\"; and use ctx.fillText(name, 480, 360)." },
    { title: "Fix the type bug", task: "Deliberately assign a string to a number and discover what TypeScript syntax can (and cannot) catch in the browser preview.", hint: "This sandbox transpiles TypeScript but is not a full TypeScript semantic typechecker; test runtime behavior as well." },
  ],
  html: [
    { title: "Secret birthday card", task: "Make a revealable card with your own words.", hint: "Try a <button> and an onclick handler that changes an element's textContent." },
    { title: "Keyboard-friendly surprise", task: "Build a card that works without a mouse.", hint: "Native <button> elements work with Enter or Space." },
  ],
  css: [
    { title: "Color remix", task: "Create your own background gradient.", hint: "Try linear-gradient(45deg, ...) and choose two colors." },
    { title: "Motion without motion sickness", task: "Create an animation and support reduced motion.", hint: "Use @media (prefers-reduced-motion: reduce) to disable movement." },
  ],
  python: [
    { title: "Tiny birthday generator", task: "Print a personalized birthday poem using variables.", hint: "Create name = 'Friend' and use print(f'Happy birthday {name}!')." },
    { title: "Guess the number", task: "Print hints for a number using an if/else branch.", hint: "Start with secret = 7 and guess = 5. Keep it deterministic for now." },
  ],
  "python-turtle": [
    { title: "Draw a heart", task: "Modify the heart's fill color and make the greeting personal.", hint: "Look for pencolor, fillcolor and turtle.write." },
    { title: "Birthday cake", task: "Add another candle or decorate the existing cake.", hint: "Reuse the drawing commands with a different x coordinate." },
  ],
  csharp: [
    { title: "Message from the future", task: "Print a personalized message with C# interpolation.", hint: 'Try string name = "Friend"; Console.WriteLine($"Hello {name}!");' },
    { title: "Exam-ready validation", task: "Use TryParse or a conditional to handle incorrect input.", hint: "Start with int.TryParse on a string. Print a useful error when it is false." },
  ],
});
export function missionsFor(language) {
  return TERMINAL_MISSIONS[language] || [];
}
export function torDebugTip(language, source, hadError = false) {
  if (hadError) return "Tor: The code ran into an error. Start with the first red console line, fix one thing, then press F5 again.";
  if (!String(source || "").trim()) return "Tor: Paste code or pick an example, then press F5. I won't execute anything until you ask.";
  if (language === "csharp") return "Tor: Predict the console output before pressing F5. In C#, trace each variable and check your semicolons.";
  if (language === "python" || language === "python-turtle") return "Tor: Indentation matters in Python. Change one line, run it, then explain why the output changed.";
  if (language === "css") return "Tor: Try a tiny style change first. Compare the preview before adding another animation.";
  return "Tor: Remix one detail, press F5, and compare the visual output. Save your favorite version before experimenting.";
}
