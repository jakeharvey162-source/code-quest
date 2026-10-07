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

export function torPracticalFeedback(result,attempt=1,preference="Friendly"){
 const area=result?.weak?.[0];if(!area)return{tone:"celebrate",level:0,message:"Sharp! 🎉 Your form covers the practical foundations. Explain why your validation works before you move on.",rematch:null};
 const concept={"UI Design":"Compare the brief with the controls actually on the form.","Control Naming":"Use meaningful WinForms prefixes so another developer can understand each control.","Input Validation":"An 8-character value is not automatically an 8-digit student number.","Events":"The event must be wired and its handler must exist in your C#.","C# Logic":"Trace both the valid and invalid paths through your handler.","Code Quality":"Readable names and small, clear blocks make bugs easier to spot."}[area];
 const clue={"UI Design":"List every required control, then tick them off one by one.","Control Naming":"Think txtStudentNumber, btnRegister, cmbCourse — type + purpose.","Input Validation":"You need both a length check and a digit check such as All(char.IsDigit) or TryParse.","Events":"Match the Designer event name to a void handler with the same name.","C# Logic":"Your handler needs a decision and clear feedback for both outcomes.","Code Quality":"Check access modifiers, meaningful names, and balanced braces."}[area];
 const worked={"UI Design":"Example pattern: Label + TextBox + Button, each with a purpose and accessible name.","Control Naming":"Example: TextBox → txtStudentNumber; Button → btnRegister.","Input Validation":"Pattern: value.Length == 8 && value.All(char.IsDigit). Adapt it yourself.","Events":"Pattern: btnRegister.Click → btnRegister_Click(object sender, EventArgs e).","C# Logic":"Pattern: if (valid) { success } else { helpful error }. Write your own messages.","Code Quality":"Keep validation readable: name the controls clearly and avoid hiding everything in one giant expression."}[area];
 const level=Math.min(4,Math.max(1,attempt));let message=level===1?concept:level===2?concept+" "+clue:level===3?concept+" "+clue:worked;
 if(level>=3&&preference==="Spicy")message="Omo 😭 "+message+" Tor is not letting this bug collect rent in your code.";
 if(preference==="Teacher")message="Teacher mode: "+message;
 return{tone:level>=3&&preference==="Spicy"?"spicy":"coach",level,message,rematch:result.recommendations?.find(r=>r.area===area)?.lesson||null};
}
