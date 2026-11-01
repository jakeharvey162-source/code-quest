import { ArrowRight, Flag, Trophy } from "lucide-react";
import type { Progress } from "../lib/progress";
import {
  lagosMissions,
  completedMissions,
  adventureDraftKey,
} from "../lib/lagos-adventure.mjs";
import "../adventure.css";

export function AdventureJournal({ progress }: { progress: Progress }) {
  const earned = completedMissions(progress.steps);
  return (
    <section className="adventure-journal" aria-label="Adventure achievements">
      <div>
        <p className="eyebrow">YOUR ADVENTURE JOURNAL</p>
        <h2>Skills that changed the street.</h2>
        <p>
          Earned by passing every C# scenario. Practice badges, not exam
          certification.
        </p>
      </div>
      <div className="adventure-badges">
        {lagosMissions.map((m, i) => (
          <div key={m.id} className={earned.includes(m) ? "earned" : ""}>
            <Trophy size={20} aria-hidden="true" />
            <b>{m.achievement}</b>
            <span>
              {earned.includes(m) ? "Earned" : "Not yet earned"} ·{" "}
              {["Operators", "Conditions", "Loops"][i]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdventureEntry({ progress }: { progress: Progress }) {
  const done = completedMissions(progress.steps).length;
  return (
    <section className="adventure-entry" aria-label="Optional story mode">
      <span className="adventure-entry-icon">
        <Flag size={27} aria-hidden="true" />
      </span>
      <div>
        <p className="eyebrow">NEW · OPTIONAL STORY MODE</p>
        <h2>A little code. A brighter Lagos.</h2>
        <p>
          Repair Rookie Street with TOR. Three real C# missions, one
          neighborhood to bring back to life.
        </p>
      </div>
      <a className="adventure-link" href="#adventure">
        {done === 3
          ? "Revisit Lagos"
          : done || progress.drafts[adventureDraftKey(lagosMissions[0].id)]
            ? "Continue mission"
            : "Start Adventure"}{" "}
        <ArrowRight size={17} />
        <small>{done}/3 missions repaired</small>
      </a>
    </section>
  );
}
