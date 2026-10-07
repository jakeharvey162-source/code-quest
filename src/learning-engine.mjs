export function evaluate(code, attempt = 1) {
  if (!code.trim()) return { ok: false, kind: "empty" };
  if (
    /class\s+BITStudent\s*:\s*Student/.test(code) &&
    /virtual\s+string\s+GetRole/.test(code) &&
    /override\s+string\s+GetRole/.test(code)
  )
    return { ok: true, kind: "oop-complete" };
  if (/class\s+BITStudent/.test(code) && !/:\s*Student/.test(code))
    return { ok: false, kind: "missing-inheritance" };
  if (/override/.test(code) && !/(virtual|abstract)/.test(code))
    return { ok: false, kind: "orphan-override" };
  return { ok: false, kind: attempt > 2 ? "guided-example" : "needs-guidance" };
}
export function detectSkills(q) {
  const s = q.toLowerCase(),
    a = [];
  if (s.includes("abstract")) a.push("Abstraction");
  if (s.includes("inherit") || s.includes("derive")) a.push("Inheritance");
  if (s.includes("override") || s.includes("polymorph")) a.push("Polymorphism");
  if (s.includes("interface")) a.push("Interfaces");
  if (/button|textbox|winform/.test(s)) a.push("WinForms");
  if (s.includes("valid")) a.push("Validation");
  return a.length ? a : ["C# problem solving"];
}
export function hintLevel(n) {
  return n <= 1
    ? "nudge"
    : n === 2
      ? "concept"
      : n === 3
        ? "syntax"
        : "worked-example";
}

// These checks inspect lesson structure; they deliberately do not claim compilation.
export function evaluateStage(code, stage, attempt = 1) {
  const clean = code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
  if (stage === 0)
    return {
      ok:
        /class\s+Student\b/.test(clean) &&
        /class\s+BITStudent\s*:\s*Student\b/.test(clean),
      message:
        "Student is the base class; BITStudent inherits from it. Next, predict the result.",
    };
  if (stage === 1)
    return {
      ok: /^\s*BIT Student\s*$/i.test(code),
      message:
        "Type BIT Student as your prediction: the derived override is used.",
    };
  const base = stage === 4 ? "Employee" : "Student",
    child = stage === 4 ? "PermanentEmployee" : "BITStudent",
    method = stage === 4 ? "CalculatePay" : "GetRole",
    type = stage === 4 ? "(?:decimal|double|int)" : "string";
  const pattern = new RegExp(
    `class\\s+${base}\\b[^{}]*\\{([^{}]*(?:\\{[^{}]*\\}[^{}]*)*)\\}`,
  );
  const baseBody = pattern.exec(clean)?.[1] || "";
  const childBody =
    new RegExp(
      `class\\s+${child}\\s*:\\s*${base}\\b[^{}]*\\{([^{}]*(?:\\{[^{}]*\\}[^{}]*)*)\\}`,
    ).exec(clean)?.[1] || "";
  const ok =
    new RegExp(
      `(?:virtual|abstract)\\s+${type}\\s+${method}\\s*\\(\\s*\\)`,
    ).test(baseBody) &&
    new RegExp(`override\\s+${type}\\s+${method}\\s*\\(\\s*\\)`).test(
      childBody,
    );
  return {
    ok,
    message: ok
      ? "Required class relationship and method modifiers found. Compile in Visual Studio to verify executable C#."
      : `Use ${base} → ${child}, with ${method}() virtual or abstract in the base and override in the child. This is a structural check.`,
  };
}
