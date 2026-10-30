import { useState } from "react";
import type { Progress } from "../lib/progress";
import { writeText } from "../lib/local-data";
import { rookieStoryState } from "../lib/story-missions.mjs";

/** Optional first story slice. All success is derived from genuine completed lessons. */
export default function RookieStory({ progress }: { progress: Progress }) {
  const [open, setOpen] = useState(false);
  const story = rookieStoryState(progress);
  return (
    <section className="rookie-story" aria-label="Optional CodeQuest story mode">
      <div className="rookie-story-intro">
        <div>
          <p className="eyebrow">CODEQUEST ADVENTURE · EPISODE 01</p>
          <h2>Rookie Street needs a developer.</h2>
          <p>
            Write real code. Restore a neighbourhood. Every completed mission
            changes your street—no extra XP, chance rewards, or forced sign-in.
          </p>
          <div className="rookie-story-tags" aria-label="Adventure details">
            <span>Three real C# missions</span>
            <span>Works offline after setup</span>
            <span>Optional mode</span>
          </div>
        </div>
        <div className="rookie-story-actions">
          <span className="rookie-story-count">
            <strong>{story.finished}/{story.total}</strong> landmarks restored
          </span>
          <button
            type="button"
            className="rookie-story-toggle"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="rookie-story-panel"
          >
            {open ? "Close story map" : "Enter story mode"}
            <span aria-hidden="true">{open ? "−" : "↗"}</span>
          </button>
        </div>
      </div>
      <div id="rookie-story-panel" hidden={!open}>
        <div className="rookie-story-scene" aria-label="Rookie Street restoration progress">
          <div className="rookie-story-scene-head">
            <strong>ROOKIE STREET / LAGOS</strong>
            <span>{story.districtState === "restored" ? "DISTRICT RESTORED" : "DISTRICT IN PROGRESS"}</span>
          </div>
          <div className="rookie-story-skyline" aria-hidden="true">
            {story.missions.map((mission, index) => (
              <div
                key={mission.id}
                className={"rookie-story-building " + (mission.status === "complete" ? "is-restored" : "is-pending")}
                style={{ height: (index === 1 ? 88 : index === 2 ? 71 : 101) + "px" }}
              >
                <span className="rookie-story-window" />
                <span className="rookie-story-window" />
                <span className="rookie-story-window" />
                <span className="rookie-story-door" />
              </div>
            ))}
          </div>
          <p role="status">
            {story.districtState === "restored"
              ? "All three landmarks are restored. You can revisit any mission."
              : story.finished
                ? story.finished + " landmark" + (story.finished === 1 ? "" : "s") + " restored. Your progress is saved with your lessons."
                : "The street is ready. Complete a genuine coding lesson to restore its first landmark."}
          </p>
        </div>
        <div className="rookie-story-missions">
          <div className="rookie-story-heading">
            <h3>Your missions</h3>
            <a href={"#learn/" + story.next.lessonId}>Continue: {story.next.title} →</a>
          </div>
          <ol>
            {story.missions.map((mission, index) => (
              <li key={mission.id} className={"rookie-mission rookie-mission-" + mission.status}>
                <span className="rookie-mission-number">0{index + 1}</span>
                <div>
                  <span className="rookie-mission-status">
                    {mission.status === "complete"
                      ? "✓ COMPLETED WITH LESSON PROGRESS"
                      : mission.status === "in-progress" ? "IN PROGRESS" : "AVAILABLE"}
                  </span>
                  <h4>{mission.title}</h4>
                  <p>{mission.objective}</p>
                  <small>Unlocks visually: {mission.landmark}. {mission.story}</small>
                </div>
                <a href={"#learn/" + mission.lessonId}>
                  {mission.status === "complete" ? "Replay" : mission.status === "in-progress" ? "Continue" : "Play mission"}
                </a>
              </li>
            ))}
          </ol>
        </div>
        <div className="rookie-story-languages">
          <div>
            <p className="eyebrow">CHOOSE YOUR LANGUAGE</p>
            <h3>One world. More ways to code.</h3>
            <p>
              C# has the full lesson journey today. Python, JavaScript, TypeScript,
              HTML and CSS already run in Code Terminal; their separate story
              campaigns are planned, not falsely shown as finished courses.
            </p>
          </div>
          <div className="rookie-story-language-links">
            <a href="#learn">C# quests <span>21 lessons</span></a>
            <a href="#terminal" onClick={() => writeText("cq-terminal-language", "python")}>Python <span>Runnable terminal</span></a>
            <a href="#terminal" onClick={() => writeText("cq-terminal-language", "javascript")}>JavaScript <span>Runnable terminal</span></a>
            <a href="#terminal" onClick={() => writeText("cq-terminal-language", "typescript")}>TypeScript <span>Runnable terminal</span></a>
            <a href="#terminal" onClick={() => writeText("cq-terminal-language", "html")}>HTML <span>Live preview</span></a>
            <a href="#terminal" onClick={() => writeText("cq-terminal-language", "css")}>CSS <span>Live preview</span></a>
          </div>
        </div>
      </div>
    </section>
  );
}
