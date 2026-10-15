import { lessons } from "../curriculum.ts";
import { debugExercises } from "./debug-practice.mjs";
export const assignableTasks = [
  ...lessons.map((l) => ({ id: l.id, title: l.title, route: "learn/" + l.id })),
  ...debugExercises.map((e) => ({
    id: "repair:" + e.id,
    title: "Repair · " + e.title,
    route: "challenges/" + e.id,
  })),
];
export const assignmentTask = (id) =>
  assignableTasks.find((task) => task.id === id);
export function sharedTaskIds(progress) {
  return [
    ...new Set([
      ...progress.completed,
      ...debugExercises
        .filter((e) => progress.drafts["repair-complete-" + e.id] === "yes")
        .map((e) => "repair:" + e.id),
    ]),
  ];
}
