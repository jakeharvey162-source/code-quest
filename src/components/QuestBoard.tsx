import { workshopQuests } from "../lib/workshop-quests.mjs";
import type { Progress } from "../lib/progress";
export default function QuestBoard({ progress }: { progress: Progress }) {
  const done = new Set(progress.steps["workshop-quests"] || []);
  return (
    <details className="quest-board">
      <summary>
        Developer quests · {workshopQuests.filter((q) => done.has(q.id)).length}
        /{workshopQuests.length} badges earned
      </summary>
      <p>
        Earn XP by building, testing and learning useful IDE habits. Each reward
        is awarded once per learning profile.
      </p>
      <div className="quest-cards">
        {workshopQuests.map((q) => (
          <article key={q.id} className={done.has(q.id) ? "quest-earned" : ""}>
            <strong>
              {done.has(q.id) ? "✓" : "◇"} {q.title}
            </strong>
            <span>+{q.xp} XP</span>
            <p>{q.task}</p>
            <a href={"#" + q.route}>
              {done.has(q.id) ? "Practise again" : "Try this quest"}
            </a>
          </article>
        ))}
      </div>
    </details>
  );
}
