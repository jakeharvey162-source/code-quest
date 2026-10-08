import { useEffect, useState, type FormEvent } from "react";
import {
  supabase,
  authRedirect,
  supabaseConfigurationError,
} from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { migrateProgress, xpFor, type Progress } from "../lib/progress";
import { readText, writeText, readBrief } from "../lib/local-data";
import { normalizeControls } from "./FormDesigner";
import type { UpdateProgress } from "./LessonView";
export default function Account({
  progress,
  update,
}: {
  progress: Progress;
  update: UpdateProgress;
}) {
  const { user, recovery, error: authError } = useAuth();
  const [mode, setMode] = useState("signin"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(authError),
    [history, setHistory] = useState<any[]>([]);
  const [revision, setRevision] = useState<number | null>(null),
    [restore, setRestore] = useState(false);
  async function refresh() {
    if (!supabase || !user) return;
    const { data, error } = await supabase
      .from("cq_snapshots")
      .select("revision")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    setRevision(data?.revision || 0);
    const result = await supabase
      .from("cq_history")
      .select("id,created_at,summary")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (result.error) throw result.error;
    setHistory(result.data || []);
  }
  useEffect(() => {
    refresh().catch(() =>
      setMessage(
        "Cloud history is unavailable. Check the CodeQuest database migration and connection.",
      ),
    );
  }, [user?.id]);
  async function action(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await task();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : (error as any)?.message ||
              "The request could not complete. Try again.",
      );
    } finally {
      setBusy(false);
      setPassword("");
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    action(async () => {
      if (!supabase) throw new Error("Accounts have not been connected yet.");
      const result = recovery
        ? await supabase.auth.updateUser({ password })
        : mode === "signup"
          ? await supabase.auth.signUp({
              email,
              password,
              options: { emailRedirectTo: authRedirect() },
            })
          : mode === "reset"
            ? await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: authRedirect("recovery"),
              })
            : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      setMessage(
        recovery
          ? "Password updated. Sign out and sign in with your new password."
          : mode === "signup"
            ? "Check your email to confirm your account. Your guest profile stays on this device."
            : mode === "reset"
              ? "If the address has an account, a reset link will arrive by email."
              : "Signed in.",
      );
    });
  }
  async function save() {
    if (!supabase || !user) return;
    if (revision === null)
      throw new Error(
        "Load cloud status before saving. Try Refresh cloud status.",
      );
    const snapshot = {
      format: "codequest-backup-v1",
      progress,
      controls: normalizeControls(JSON.parse(readText("cq-form", "[]"))) || [],
      practicalCode: readText("cq-practical-code"),
      practicalBrief: readBrief(),
    };
    const { error } = await supabase.rpc("cq_save_snapshot", {
      expected_revision: revision,
      payload: snapshot,
      summary: {
        completed: progress.completed.length,
        xp: xpFor(progress),
        assessments: progress.assessments.length,
      },
    });
    if (error) throw error;
    await refresh();
    setMessage("Saved to your account. Cloud history updated.");
  }
  async function load() {
    if (!supabase || !user) return;
    const { data, error } = await supabase
      .from("cq_snapshots")
      .select("snapshot,revision")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("There is no cloud save yet.");
    const value = data.snapshot,
      restored = migrateProgress(value?.progress),
      controls = normalizeControls(value?.controls);
    if (
      value?.format !== "codequest-backup-v1" ||
      !restored ||
      !controls ||
      typeof value.practicalCode !== "string" ||
      value.practicalCode.length > 50000
    )
      throw new Error("Cloud save is invalid. Your local work was kept.");
    if (
      !writeText("cq-form", JSON.stringify(controls)) ||
      !writeText("cq-practical-code", value.practicalCode) ||
      !writeText(
        "cq-practical-brief",
        JSON.stringify(value.practicalBrief || null),
      )
    )
      throw new Error("This browser could not save the restored draft.");
    update(() => restored);
    setRevision(data.revision);
    setRestore(false);
    setMessage("Cloud save restored on this device.");
  }
  return (
    <section className="page settings-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR PLACE IN THE WORLD</p>
          <h1>Your CodeQuest account.</h1>
          <p>Keep your learning safe and pick it up on another device.</p>
        </div>
      </div>
      {!supabase ? (
        <article className="settings-card">
          <h2>Local learning is ready</h2>
          {supabaseConfigurationError && (
            <p role="status">{supabaseConfigurationError}</p>
          )}
          <p>
            Accounts need the dedicated CodeQuest Supabase project. You can
            learn, save locally, and export a backup from Settings now.
          </p>
        </article>
      ) : !user || recovery ? (
        <form className="settings-card" onSubmit={submit}>
          <h2>
            {recovery
              ? "Choose a new password"
              : mode === "signup"
                ? "Create an account"
                : mode === "reset"
                  ? "Reset your password"
                  : "Welcome back"}
          </h2>
          {!recovery && (
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                maxLength={254}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          )}
          {(recovery || mode !== "reset") && (
            <label>
              Password
              <input
                type="password"
                autoComplete={
                  recovery || mode === "signup"
                    ? "new-password"
                    : "current-password"
                }
                minLength={8}
                maxLength={128}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}
          <button className="primary" disabled={busy}>
            {busy
              ? "Working…"
              : recovery
                ? "Update password"
                : mode === "signup"
                  ? "Create account"
                  : mode === "reset"
                    ? "Send reset link"
                    : "Sign in"}
          </button>
          {!recovery && (
            <div className="button-row">
              {["signin", "signup", "reset"]
                .filter((x) => x !== mode)
                .map((x) => (
                  <button
                    type="button"
                    key={x}
                    disabled={busy}
                    onClick={() => {
                      setMode(x);
                      setMessage("");
                    }}
                  >
                    {x === "signin"
                      ? "Sign in"
                      : x === "signup"
                        ? "Create account"
                        : "Forgot password?"}
                  </button>
                ))}
            </div>
          )}
          <p className="muted">
            Guest and account profiles are separate. Export your guest backup,
            then restore it in Settings while signed in to move it to your
            account.
          </p>
        </form>
      ) : (
        <div className="settings-grid">
          <article className="settings-card">
            <h2>{user.email}</h2>
            <p>
              Cloud saves are manual. Save before changing devices; restore to
              load your last cloud save. Class sharing does not include your
              private code drafts.
            </p>
            <div className="button-row">
              <button disabled={busy} onClick={() => action(save)}>
                Save to cloud
              </button>
              <button disabled={busy} onClick={() => setRestore(true)}>
                Restore cloud save
              </button>
              <button disabled={busy} onClick={() => action(refresh)}>
                Refresh cloud status
              </button>
            </div>
            {restore && (
              <div>
                <p>
                  Restoring replaces this account’s local learning and form
                  draft. Export a backup in Settings first if you need it.
                </p>
                <button disabled={busy} onClick={() => action(load)}>
                  Replace local work with cloud save
                </button>
                <button onClick={() => setRestore(false)}>
                  Keep local work
                </button>
              </div>
            )}
            <button
              disabled={busy}
              onClick={() =>
                action(async () => {
                  const result = await supabase!.auth.signOut();
                  if (result.error) throw result.error;
                })
              }
            >
              Sign out
            </button>
          </article>
          <article className="settings-card">
            <h2>Save history</h2>
            {history.length ? (
              history.map((item) => (
                <p key={item.id}>
                  {new Date(item.created_at).toLocaleString()} ·{" "}
                  {item.summary.completed} quests · {item.summary.xp} XP
                </p>
              ))
            ) : (
              <p>No cloud saves yet.</p>
            )}
          </article>
        </div>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
