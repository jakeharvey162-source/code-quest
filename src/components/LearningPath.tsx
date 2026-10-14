import { learningLevels, pathLessons } from "../lib/learning-path";
import { localDay } from "../lib/progress";
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
  // The daily remix is practice, so revisiting it never fabricates XP.
  const pool = pathLessons(current.id === "pro" ? "advanced" : current.id);
  const seed = [...localDay()].reduce((n, char) => n * 31 + char.charCodeAt(0), 0) >>> 0;
  const remix = pool[seed % pool.length];
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
      {remix && <aside className="daily-remix" aria-label="Tor daily remix">
        <div><span className="eyebrow">TOR’S DAILY REMIX · {current.title.toUpperCase()}</span>
          <h3>{remix.title}</h3>
          <p>Predict it. Run it. Change one value and explain what happens. A new pick every day.</p>
        </div>
        <a className="primary" href={"#learn/" + remix.id}>Take today’s quest →</a>
        <a href="#challenges">Continue with fresh practice quests →</a>
      </aside>}
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
