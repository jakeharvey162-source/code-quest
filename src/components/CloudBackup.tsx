import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { readText, writeText, readBrief } from "../lib/local-data";
import { xpFor, type Progress } from "../lib/progress";
export function backupPreference(enabled: boolean, revision = 0) {
  const saved = writeText(
    "cq-auto-backup",
    JSON.stringify({ enabled, revision }),
  );
  window.dispatchEvent(new Event("cq-backup-preference"));
  return saved;
}
export default function CloudBackup({
  userId,
  progress,
}: {
  userId?: string;
  progress: Progress;
}) {
  const latest = useRef(progress);
  latest.current = progress;
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (!userId || !supabase) return;
    const client = supabase;
    let active = true,
      busy = false,
      revision: number | null = null,
      last = "",
      paused = false,
      epoch = 0;
    function configure() {
      epoch++;
      try {
        const p = JSON.parse(readText("cq-auto-backup", "{}"));
        revision =
          p.enabled && Number.isInteger(p.revision) && p.revision > 0
            ? p.revision
            : null;
      } catch {
        revision = null;
      }
      paused = false;
      last = "";
      setStatus(
        revision === null
          ? ""
          : "Automatic cloud backup on · checks changed work every 60 seconds.",
      );
    }
    configure();
    async function save() {
      if (
        !active ||
        busy ||
        paused ||
        revision === null ||
        !navigator.onLine ||
        document.visibilityState !== "visible"
      )
        return;
      busy = true;
      const expected = revision,
        generation = epoch;
      try {
        const { normalizeControls } = await import("./FormDesigner");
        if (!active || epoch !== generation) return;
        const p = latest.current;
        const payload = {
          format: "codequest-backup-v1",
          progress: p,
          controls:
            normalizeControls(JSON.parse(readText("cq-form", "[]"))) || [],
          practicalCode: readText("cq-practical-code"),
          practicalBrief: readBrief(),
        };
        const encoded = JSON.stringify(payload);
        if (encoded === last) return;
        setStatus("Saving changed work to your account…");
        const { error } = await client.rpc("cq_save_snapshot", {
          expected_revision: expected,
          payload,
          summary: {
            completed: p.completed.length,
            xp: xpFor(p),
            assessments: p.assessments.length,
          },
        });
        if (!active || generation !== epoch) return;
        if (error) throw error;
        revision = expected + 1;
        window.dispatchEvent(new CustomEvent("cq-cloud-saved", {detail:{userId,revision}}));
        last = encoded;
        writeText(
          "cq-auto-backup",
          JSON.stringify({ enabled: true, revision }),
        );
        setStatus(
          "Cloud backup saved at " +
            new Date().toLocaleTimeString() +
            ". New edits will be backed up within 60 seconds.",
        );
      } catch (error) {
        if (!active || generation !== epoch) return;
        const message = String(
          (error as { message?: string })?.message || error,
        );
        if (/changed|conflict|revision/i.test(message)) {
          paused = true;
          setStatus(
            "Cloud backup paused: another save changed. Open Account, refresh cloud status and choose which work to keep. Local work is safe.",
          );
        } else
          setStatus(
            "Cloud backup could not finish. Local work is kept; retrying while online. Use Account to save before closing.",
          );
      } finally {
        busy = false;
      }
    }
    const timer = setInterval(() => void save(), 60000);
    window.addEventListener("cq-backup-preference", configure);
    window.addEventListener("online", save);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("cq-backup-preference", configure);
      window.removeEventListener("online", save);
    };
  }, [userId]);
  return status ? (
    <p className="cloud-backup-status" aria-live="polite">
      {status} <a href="#account">Account & saves</a>
    </p>
  ) : null;
}
