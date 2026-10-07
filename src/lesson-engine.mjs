export const oopStages = [
  {
    id: "see",
    title: "SEE",
    task: "Watch the family tree",
    help: "Student is the base class. BITStudent is a specialized Student.",
  },
  {
    id: "predict",
    title: "PREDICT",
    task: "What will GetRole() return?",
    help: "Predict before running: which implementation should a BITStudent use?",
  },
  {
    id: "build",
    title: "BUILD",
    task: "Create the relationship",
    help: "Add inheritance, virtual and override yourself.",
  },
  {
    id: "breakfix",
    title: "BREAK + FIX",
    task: "Repair a broken override",
    help: "Find why override fails when the base method cannot be overridden.",
  },
  {
    id: "apply",
    title: "APPLY ALONE",
    task: "Employee challenge",
    help: "No walkthrough. Build Employee → PermanentEmployee using the same idea.",
  },
];
export function nextStage(i, passed) {
  return passed ? Math.min(i + 1, oopStages.length - 1) : i;
}
export function guidance(i) {
  return i === 0
    ? "worked"
    : i === 1
      ? "prediction"
      : i === 2
        ? "hints"
        : i === 3
          ? "debug"
          : "minimal";
}
