import { lessons } from "../curriculum.ts";
export const learningLevels = [
  {
    id: "easy",
    title: "Easy",
    subtitle: "First steps",
    description:
      "Variables, strings, decisions and your first button. Read the example, predict the result, then build.",
    ids: ["variables", "strings", "conditions", "logic", "controls", "events"],
  },
  {
    id: "intermediate",
    title: "Intermediate",
    subtitle: "Useful programs",
    description:
      "Methods, loops, collections, choices and safe input. Build a working form with your own event handlers.",
    ids: [
      "methods",
      "loops",
      "arrays",
      "validation",
      "student-number",
      "choices",
      "collections-ui",
    ],
  },
  {
    id: "advanced",
    title: "Advanced",
    subtitle: "Systems thinking",
    description:
      "Classes, encapsulation, inheritance, contracts and resilient layouts. Separate interface code from business logic.",
    ids: [
      "classes",
      "encapsulation",
      "inheritance",
      "polymorphism",
      "abstraction",
      "interfaces",
      "layout",
      "forms-validation",
    ],
  },
  {
    id: "pro",
    title: "Pro",
    subtitle: "Ship a complete system",
    description:
      "Build an ATM, loan calculator or bank manager. Test invalid input and sequential transactions, earn partial credit, then export your Windows solution.",
    ids: [],
  },
] as const;
export type LearningLevel = (typeof learningLevels)[number]["id"];
export function pathLessons(level: string) {
  const path = learningLevels.find((p) => p.id === level);
  return path
    ? path.ids.map((id) => lessons.find((l) => l.id === id)!).filter(Boolean)
    : lessons;
}
