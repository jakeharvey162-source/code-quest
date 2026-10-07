export const practicalRubric = [
  ["UI Design", 20],
  ["Control Naming", 10],
  ["Input Validation", 20],
  ["Events", 15],
  ["C# Logic", 25],
  ["Code Quality", 10],
];
const count = (xs, p) => xs.filter(p).length;
// Formative static review only. This is deliberately separate from the real C# runner.
export function reviewSource(source) {
  return String(source)
    .replace(
      /@"(?:""|[^"])*"|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
      (token) =>
        token.startsWith("//") || token.startsWith("/*") ? " " : token,
    )
    .replace(/@"(?:""|[^"])*"|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, " ");
}
export function markPractical(input = {}) {
  const controls = (Array.isArray(input.controls) ? input.controls : []).filter(
    (c) => c && typeof c === "object",
  );
  const code = reviewSource(input.code || "");
  const required = Array.isArray(input.requirements?.controls)
    ? input.requirements.controls
    : ["TextBox", "Button"];
  const types = controls.map((c) => c.type),
    names = controls.map((c) => String(c.name || "")),
    breakdown = {};
  breakdown["UI Design"] = Math.round(
    (20 * count(required, (t) => types.includes(t))) /
      Math.max(1, required.length),
  );
  breakdown["Control Naming"] = Math.round(
    (10 *
      count(names, (n) => /^(txt|btn|cmb|lst|nud|rb|chk|lbl)[A-Z_]/.test(n))) /
      Math.max(1, names.length),
  );
  const length = /\.Length\s*(?:==|!=)\s*8/.test(code),
    digits =
      /\b(?:char\.)?IsDigit\s*\(/.test(code) ||
      /\b(?:int|long|ulong)\.TryParse\s*\(/.test(code);
  // Eight characters alone does not establish eight digits. Static matches are hints, not proof.
  breakdown["Input Validation"] =
    (length ? 5 : 0) +
    (digits ? 10 : 0) +
    (/IsNullOrWhiteSpace\s*\(/.test(code) ? 5 : 0);
  const eventTargets = controls.filter((c) => c.type === "Button");
  breakdown["Events"] = Math.round(
    (15 *
      count(
        eventTargets,
        (c) =>
          /^[A-Za-z_]\w*$/.test(c.eventClick || "") &&
          new RegExp("\\bvoid\\s+" + c.eventClick + "\\s*\\(").test(code),
      )) /
      Math.max(1, eventTargets.length),
  );
  breakdown["C# Logic"] =
    (/\bif\s*\(/.test(code) ? 10 : 0) +
    (/\b(?:else|return)\b/.test(code) ? 10 : 0) +
    (/MessageBox\.Show\s*\(/.test(code) ? 5 : 0);
  breakdown["Code Quality"] = Math.min(
    10,
    [
      /\b(private|public|protected)\b/,
      /\b(txt|btn|cmb|lst|nud|rb|chk|lbl)[A-Z_]/,
      /\{[\s\S]*\}/,
    ].filter((r) => r.test(code)).length *
      3 +
      (code.trim().length >= 40 ? 1 : 0),
  );
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0),
    weak = Object.entries(breakdown)
      .filter(
        ([name, score]) =>
          score < practicalRubric.find((r) => r[0] === name)[1] * 0.7,
      )
      .map(([name]) => name);
  const lessonFor = {
    "UI Design": "controls",
    "Control Naming": "controls",
    "Input Validation": "validation",
    Events: "events",
    "C# Logic": "conditions",
    "Code Quality": "methods",
  };
  return {
    total,
    breakdown,
    weak,
    method: "static-review",
    recommendations: weak.map((area) => ({ area, lesson: lessonFor[area] })),
  };
}

export function torPracticalFeedback(
  result,
  attempt = 1,
  preference = "Friendly",
) {
  const area = result?.weak?.[0];
  if (!area)
    return {
      tone: "celebrate",
      message:
        "Strong work. Your form and code cover the practical foundations.",
      rematch: null,
    };
  const hints = {
    "UI Design":
      "Check the brief against the controls on your form. Is every required control actually there?",
    "Control Naming":
      "Use meaningful prefixes such as txt, btn, cmb, lst, nud, rb, chk and lbl.",
    "Input Validation":
      "Trace invalid input first. For a student number, check the required length before accepting it.",
    Events:
      "A control cannot react until the correct event is wired to a handler.",
    "C# Logic":
      "Follow the decision path line by line. What should happen for valid input, and what should happen otherwise?",
    "Code Quality":
      "Make names communicate purpose and keep the handler readable.",
  };
  const spice =
    attempt >= 3 && preference === "Spicy"
      ? " Omo 😭 the compiler cannot read your mind — show it the rule clearly."
      : "";
  return {
    tone: attempt >= 3 && preference === "Spicy" ? "spicy" : "coach",
    message: hints[area] + spice,
    rematch:
      result.recommendations?.find((r) => r.area === area)?.lesson || null,
  };
}
