import { learningLevels, pathLessons } from "../lib/learning-path";
import type { Progress } from "../lib/progress";
import type { UpdateProgress } from "./LessonView";
export default function LearningPath({
  progress,
  update,
}: {
  progress: Progress;
  update: UpdateProgress;
}) {
  const current =
    learningLevels.find((l) => l.id === progress.settings.level) ||
    learningLevels[0];
  const next = pathLessons(current.id).find(
    (l) => !progress.completed.includes(l.id),
  );
  return (
    <section className="learning-path" aria-label="Easy to pro learning path">
      <div>
        <p className="eyebrow">YOUR ROAD TO A WORKING WINDOWS APP</p>
        <h2>Easy → Intermediate → Advanced → Pro</h2>
        <p>
          Choose your starting point. Every level stays open; your work and XP
          carry forward.
        </p>
      </div>
      <div className="level-cards">
        {learningLevels.map((l) => (
          <button
            key={l.id}
            aria-pressed={l.id === current.id}
            onClick={() =>
              update((p) => ({
                ...p,
                settings: { ...p.settings, level: l.id },
              }))
            }
          >
            <strong>{l.title}</strong>
            <span>{l.subtitle}</span>
            <small>
              {l.id === "pro"
                ? "3 system projects"
                : `${progress.completed.filter((id) => (l.ids as readonly string[]).includes(id)).length}/${l.ids.length} quests complete`}
            </small>
          </button>
        ))}
      </div>
      <p>{current.description}</p>
      <button
        className="primary"
        onClick={() => {
          location.hash =
            current.id === "pro"
              ? "designer"
              : next
                ? "learn/" + next.id
                : "assessment";
        }}
      >
        {current.id === "pro"
          ? "Build a full system"
          : next
            ? "Start " + current.title + " quest"
            : "Practise your assessment"}
      </button>
      <a href="#challenges">Try a code challenge →</a>
      <a href="#leaderboard">View leaderboard and badges →</a>
    </section>
  );
}
