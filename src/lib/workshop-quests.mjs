export const workshopQuests = [
  {
    id: "snippet-builder",
    title: "Code wizard",
    xp: 20,
    task: "Expand a C# snippet with Tab, Tab.",
    route: "playground",
  },
  {
    id: "class-builder",
    title: "Class maker",
    xp: 40,
    task: "Create your own named C# class file.",
    route: "playground",
  },
  {
    id: "first-run",
    title: "It lives!",
    xp: 20,
    task: "Compile and run a C# program successfully.",
    route: "playground",
  },
  {
    id: "oop-run",
    title: "Object architect",
    xp: 60,
    task: "Instantiate a class from your own source file and run the project.",
    route: "playground",
  },
  {
    id: "comment-ninja",
    title: "Comment ninja",
    xp: 20,
    task: "Comment code using Ctrl+K, Ctrl+C.",
    route: "playground",
  },
  {
    id: "grid-engineer",
    title: "Data keeper",
    xp: 40,
    task: "Run an event that adds rows to your DataGridView.",
    route: "designer",
  },
  {
    id: "system-builder",
    title: "System builder",
    xp: 80,
    task: "Earn at least 60/100 on a complete-system practice check.",
    route: "designer",
  },
  {
    id: "system-master",
    title: "System master",
    xp: 120,
    task: "Earn at least 90/100 on the real C# system checks.",
    route: "designer",
  },
];
export function requestQuest(id) {
  if (typeof window !== "undefined" && workshopQuests.some((q) => q.id === id))
    window.dispatchEvent(
      new CustomEvent("cq-quest-earned", { detail: { id } }),
    );
}
export function earnedQuestXp(steps) {
  const done = new Set(steps?.["workshop-quests"] || []);
  return workshopQuests
    .filter((q) => done.has(q.id))
    .reduce((n, q) => n + q.xp, 0);
}
