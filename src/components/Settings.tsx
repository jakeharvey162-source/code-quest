import { useState } from "react";
import { Download, Upload, Volume2, Calendar, Trash2 } from "lucide-react";
import { VoiceControls, useVoices } from "./VoiceControls";
import { download } from "../lib/download";
import { readText, readBrief } from "../lib/local-data";
import { migrateProgress, freshProgress } from "../lib/progress";
import type { Progress, Settings as SettingsType } from "../lib/progress";
import type { UpdateProgress } from "./LessonView";
import { validControls, normalizeControls, type Control } from "./FormDesigner";
export default function Settings({
  progress,
  update,
  onNavigate,
}: {
  progress: Progress;
  update: UpdateProgress;
  onNavigate: (p: string) => void;
}) {
  const voices = useVoices();
  const [message, setMessage] = useState(""),
    [reset, setReset] = useState(false);
  const s = progress.settings;
  function change(patch: Partial<SettingsType>) {
    update((p) => ({ ...p, settings: { ...p.settings, ...patch } }));
  }
  function backup() {
    let controls: Control[] = [];
    try {
      const value = JSON.parse(localStorage.getItem("cq-form") || "[]");
      controls = normalizeControls(value) || [];
    } catch {}
    download(
      "CodeQuest-backup.json",
      JSON.stringify(
        {
          format: "codequest-backup-v1",
          progress,
          controls,
          practicalCode: readText("cq-practical-code"),
          practicalBrief: readBrief(),
        },
        null,
        2,
      ),
    );
    setMessage(
      "Backup downloaded. Keep it safe to move your learning to another device.",
    );
  }
  async function restore(file: File | undefined) {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setMessage("Backup must be smaller than 1 MB.");
      return;
    }
    try {
      const value = JSON.parse(await file.text());
      const restored = migrateProgress(value.progress),
        controls = normalizeControls(value.controls);
      if (
        value.format !== "codequest-backup-v1" ||
        !restored ||
        !controls ||
        (value.practicalCode !== undefined &&
          (typeof value.practicalCode !== "string" ||
            value.practicalCode.length > 50000))
      )
        throw new Error("This is not a valid CodeQuest backup.");
      localStorage.setItem("cq-form", JSON.stringify(controls));
      localStorage.setItem("cq-practical-code", value.practicalCode || "");
      localStorage.setItem(
        "cq-practical-brief",
        JSON.stringify(value.practicalBrief || null),
      );
      update(() => restored);
      setMessage("Backup restored. Your lessons and designer are ready.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not restore this backup.",
      );
    }
  }
  function calendar() {
    if (!s.assessmentDate) {
      setMessage("Choose your assessment date first.");
      return;
    }
    const date = s.assessmentDate.replaceAll("-", "");
    const utc = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
    download(
      "CodeQuest-study.ics",
      `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//CodeQuest//Study Plan//EN\r\nBEGIN:VEVENT\r\nUID:codequest-${date}@local\r\nDTSTAMP:${utc}\r\nDTSTART;VALUE=DATE:${date}\r\nSUMMARY:CodeQuest assessment preparation\r\nDESCRIPTION:Review C# and WinForms and OOP. Complete a practice assessment.\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`,
      "text/calendar",
    );
    setMessage(
      "Calendar file downloaded. Import it into your calendar to set a reminder.",
    );
  }
  return (
    <section className="page settings-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR LEARNING, YOUR WAY</p>
          <h1>Make it feel like you.</h1>
          <p>Voice, pace, accessibility and a backup you control.</p>
        </div>
      </div>
      <div className="settings-grid">
        <article className="settings-card">
          <h2>Your learning profile</h2>
          <label>
            Your name
            <input
              value={s.name}
              maxLength={60}
              placeholder="What should Tor call you?"
              onChange={(e) => change({ name: e.target.value })}
            />
          </label>
          <label>
            Tor’s tone
            <select
              value={s.coach}
              onChange={(e) =>
                change({ coach: e.target.value as SettingsType["coach"] })
              }
            >
              {["Teacher", "Friendly", "Spicy"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Daily study goal
            <select
              value={s.dailyMinutes}
              onChange={(e) => change({ dailyMinutes: Number(e.target.value) })}
            >
              {[10, 20, 30, 45, 60].map((x) => (
                <option key={x} value={x}>
                  {x} minutes
                </option>
              ))}
            </select>
          </label>
          <label>
            Editor mode
            <select
              value={s.editorMode}
              onChange={(e) =>
                change({
                  editorMode: e.target.value as SettingsType["editorMode"],
                })
              }
            >
              <option value="editor">Code editor with line numbers</option>
              <option value="plain">Plain text (screen-reader friendly)</option>
            </select>
          </label>
        </article>
        <article className="settings-card">
          <h2>
            <Volume2 size={20} /> Voice & accessibility
          </h2>
          <label>
            Voice input language
            <select
              aria-label="Voice input language"
              value={s.language}
              onChange={(e) =>
                change({ language: e.target.value as SettingsType["language"] })
              }
            >
              <option value="en-ZA">English</option>
              <option value="zu-ZA">isiZulu</option>
              <option value="fr-FR">French</option>
              <option value="pt-PT">Portuguese</option>
              <option value="sw-KE">Swahili</option>
            </select>
          </label>
          <p className="muted">
            Choose the recognition language used for voice commands. Lessons
            remain in English; this setting does not translate the interface or
            lesson text.
          </p>
          <label>
            Device voice
            <select
              aria-label="Device voice"
              value={s.voice}
              onChange={(e) => change({ voice: e.target.value })}
            >
              <option value="">Device default</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </label>
          <p className="muted">
            {voices.length
              ? `${voices.length} device voices available.`
              : "No voices reported yet. The device default may still work."}{" "}
            Lessons are written in English. Selecting another voice does not
            translate the text.
          </p>
          <label>
            Reading speed: {s.rate.toFixed(1)}×
            <input
              aria-label="Reading speed"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={s.rate}
              onChange={(e) => change({ rate: Number(e.target.value) })}
            />
          </label>
          <VoiceControls
            settings={s}
            text={`Hello ${s.name || "learner"}. I’m Tor. Let’s build something you understand.`}
          />
          <label className="check-label">
            <input
              type="checkbox"
              checked={s.reducedMotion}
              onChange={(e) => change({ reducedMotion: e.target.checked })}
            />
            Reduce motion
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={s.highContrast}
              onChange={(e) => change({ highContrast: e.target.checked })}
            />
            High contrast
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={s.voiceInput}
              onChange={(e) => change({ voiceInput: e.target.checked })}
            />
            Enable voice commands
          </label>
          <p className="muted">
            Your browser may send microphone audio to its speech recognition
            service. Listening starts only when you press Voice command. Every
            action is also available by button.
          </p>
        </article>
        <article className="settings-card">
          <h2>
            <Calendar size={20} /> Study plan
          </h2>
          <label>
            Assessment date
            <input
              type="date"
              value={s.assessmentDate}
              onChange={(e) => change({ assessmentDate: e.target.value })}
            />
          </label>
          <p>
            {s.dailyMinutes} minutes a day: understand one idea, practise it,
            then explain it without the example.
          </p>
          <button onClick={calendar}>
            <Download size={16} />
            Download calendar reminder
          </button>
          <p className="muted">
            Calendar reminders work through your calendar app, including when
            CodeQuest is closed.
          </p>
        </article>
        <article className="settings-card">
          <h2>Your data stays with you</h2>
          <p>
            No account is needed. Lessons, code and form drafts are stored in
            this browser. Clearing site data removes them.
          </p>
          <div className="button-row">
            <button onClick={backup}>
              <Download size={16} />
              Export backup
            </button>
            <label className="upload-button">
              <Upload size={16} />
              Restore backup
              <input
                aria-label="Restore backup"
                type="file"
                accept="application/json,.json"
                onChange={(e) => {
                  restore(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="muted">
            Restoring replaces current progress and your form draft. Export a
            backup first if you want to keep them.
          </p>
          {reset ? (
            <div className="reset-confirm">
              <p>Delete your progress and form draft from this browser?</p>
              <button
                className="danger"
                onClick={() => {
                  try {
                    for (const key of [
                      "cq-form",
                      "cq-practical-code",
                      "cq-practical-brief",
                    ])
                      localStorage.removeItem(key);
                  } catch {}
                  update(() => freshProgress());
                  setReset(false);
                  setMessage("Learning data cleared.");
                }}
              >
                Delete my learning data
              </button>
              <button onClick={() => setReset(false)}>Keep my data</button>
            </div>
          ) : (
            <button
              className="text-button danger"
              onClick={() => setReset(true)}
            >
              <Trash2 size={15} />
              Reset learning data
            </button>
          )}
        </article>
      </div>
      <p role="status" className="settings-status">
        {message}
      </p>
      <div className="privacy-note">
        <h2>Built to be accessible and transparent.</h2>
        <p>
          Keyboard navigation, visible focus, a plain editor, reduced-motion
          support, readable feedback and device voice controls are included.
          Code compilation runs on your device in an isolated worker. Voice
          support varies by browser and installed voices. Test your own device
          voice using the button above.
        </p>
        <button onClick={() => onNavigate("progress")}>
          View your progress
        </button>
      </div>
    </section>
  );
}
