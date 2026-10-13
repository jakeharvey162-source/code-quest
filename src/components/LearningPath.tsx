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
        <p className="eyebrow">YOUR LEARNING PATH</p>
        <h2>One milestone at a time.</h2>
        <p>
          Start where you feel comfortable. Build your skills, then ship a Windows app.
          Switch levels anytime; your progress stays saved.
        </p>
      </div>
      <div className="level-cards">
        {learningLevels.map((l, index) => (
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
            <span className="level-step" aria-hidden="true">0{index + 1}</span>
            <strong>{l.title}</strong>
            <span>{l.subtitle}</span>
            <small>
              {l.id === "pro"
                ? "3 system projects"
                : `${progress.completed.filter((id) => (l.ids as readonly string[]).includes(id)).length}/${l.ids.length} quests complete`}
            </small>
            {l.id !== "pro" && <span className="level-progress" aria-hidden="true"><span style={{ width: `${100 * progress.completed.filter((id) => (l.ids as readonly string[]).includes(id)).length / l.ids.length}%` }} /></span>}
          </button>
        ))}
      </div>
      <div className="path-next-step">
      <p><strong>{current.title}: your next step</strong><br />{current.description}</p>
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
      </div>
    </section>
  );
}
