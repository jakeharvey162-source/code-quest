import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { readText, writeText } from "../lib/local-data";
import { xpFor, type Progress } from "../lib/progress";
import {
  currentSnapshot,
  restoreSnapshot,
  hasLocalWork,
  snapshotText,
} from "../lib/cloud-snapshot";
import type { UpdateProgress } from "./LessonView";
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
  update,
}: {
  userId?: string;
  progress: Progress;
  update: UpdateProgress;
}) {
  const latest = useRef(progress),
    apply = useRef(update);
  latest.current = progress;
  apply.current = update;
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (!userId || !supabase) return;
    const client = supabase;
    let active = true,
      busy = false,
      connecting = false,
      retryAt = 0,
      revision: number | null = null,
      last = "",
      paused = false,
      epoch = 0;
    async function configure() {
      if (!active || connecting || Date.now() < retryAt) return;
      connecting = true;
      const generation = ++epoch;
      revision = null;
      paused = false;
      try {
        const preference = JSON.parse(readText("cq-auto-backup", "{}"));
        if (preference.enabled === false) {
          setStatus("Automatic saving is off on this device.");
          return;
        }
        setStatus("Connecting your cloud saves…");
        const { data, error } = await client
          .from("cq_snapshots")
          .select("snapshot,revision")
          .eq("user_id", userId!)
          .abortSignal(AbortSignal.timeout(30000))
          .maybeSingle();
        if (!active || epoch !== generation) return;
        if (error) throw error;
        const local = snapshotText(currentSnapshot(latest.current));
        const baseline = readText("cq-cloud-baseline");
        if (
          data &&
          data.revision !== preference.revision &&
          snapshotText(data.snapshot) !== local
        ) {
          if (!hasLocalWork(latest.current) || local === baseline) {
            const restored = restoreSnapshot(data.snapshot);
            latest.current = restored;
            apply.current(() => restored);
          } else {
            paused = true;
            setStatus(
              "Cloud backup paused: this device and your cloud save both have work. Open Account to choose which to keep.",
            );
            return;
          }
        }
        revision = data?.revision || 0;
        last = data ? snapshotText(data.snapshot) : "";
        writeText(
          "cq-auto-backup",
          JSON.stringify({ enabled: true, revision }),
        );
        if (data) writeText("cq-cloud-baseline", last);
        setStatus(
          data
            ? "All changes saved to your account."
            : "Automatic saving is on.",
        );
        // First save needs no button click. Subsequent edits are checked every 5s.
        void save();
      } catch {
        retryAt = Date.now() + 30000 + Math.random() * 5000;
        if (active && generation === epoch)
          setStatus(
            "Cloud connection unavailable. Your work is saved on this device; we’ll retry online.",
          );
      } finally {
        connecting = false;
      }
    }
    async function save() {
      if (
        !active ||
        Date.now() < retryAt ||
        busy ||
        paused ||
        !navigator.onLine ||
        document.visibilityState !== "visible"
      )
        return;
      if (revision === null) {
        void configure();
        return;
      }
      busy = true;
      const expected = revision,
        generation = epoch;
      try {
        const p = latest.current,
          payload = currentSnapshot(p),
          encoded = snapshotText(payload);
        if (encoded === last) return;
        if (new TextEncoder().encode(encoded).length > 1000000) {
          paused = true;
          setStatus(
            "Your cloud backup is too large. Export your projects in Settings and remove unused drafts before saving again. Local work is kept.",
          );
          return;
        }
        setStatus("Saving changes…");
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
        last = encoded;
        writeText(
          "cq-auto-backup",
          JSON.stringify({ enabled: true, revision }),
        );
        writeText("cq-cloud-baseline", encoded);
        window.dispatchEvent(
          new CustomEvent("cq-cloud-saved", { detail: { userId, revision } }),
        );
        setStatus("All changes saved to your account.");
      } catch (error) {
        if (!active || generation !== epoch) return;
        if (
          /changed|conflict|revision/i.test(
            String((error as { message?: string })?.message || error),
          )
        ) {
          paused = true;
          setStatus(
            "Cloud backup paused: another device saved newer work. Open Account to choose which work to keep. Local work is safe.",
          );
        } else {
          retryAt = Date.now() + 30000 + Math.random() * 5000;
          setStatus(
            "Cloud save pending. Your work is saved on this device; retrying online.",
          );
        }
      } finally {
        busy = false;
      }
    }
    void configure();
    const timer = setInterval(() => void save(), 5000);
    const reconnect = () => {
      retryAt = 0;
      if (!paused) void configure();
    };
    const preference = () => {
      epoch++;
      revision = null;
      paused = false;
      retryAt = 0;
      void configure();
    };
    window.addEventListener("cq-backup-preference", preference);
    window.addEventListener("online", reconnect);
    document.addEventListener("visibilitychange", save);
    return () => {
      active = false;
      epoch++;
      clearInterval(timer);
      window.removeEventListener("cq-backup-preference", preference);
      window.removeEventListener("online", reconnect);
      document.removeEventListener("visibilitychange", save);
    };
  }, [userId]);
  return status ? (
    <p className="cloud-backup-status" aria-live="polite">
      {status} <a href="#account">Account</a>
    </p>
  ) : null;
}
