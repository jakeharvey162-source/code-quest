import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { xpFor, type Progress } from "../lib/progress";
import { lessons } from "../curriculum";
import ProfileAvatar from "./ProfileAvatar";
type Entry = {
  user_id: string;
  nickname: string;
  avatar: string;
  xp: number;
  completed: number;
};
export default function Leaderboard({ progress }: { progress: Progress }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Entry[]>([]),
    [joined, setJoined] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const xp = xpFor(progress),
    completed = lessons.filter((l) => progress.completed.includes(l.id)).length;
  async function refresh() {
    if (!supabase) return;
    const [ranking, mine] = await Promise.all([
      supabase
        .from("cq_leaderboard")
        .select("user_id,nickname,avatar,xp,completed")
        .eq("visible", true)
        .order("xp", { ascending: false })
        .order("completed", { ascending: false })
        .order("user_id")
        .limit(50),
      user
        ? supabase
            .from("cq_leaderboard")
            .select("visible")
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (ranking.error) throw ranking.error;
    if (mine.error) throw mine.error;
    setRows(ranking.data || []);
    setJoined(mine.data?.visible === true);
  }
  useEffect(() => {
    let active = true;
    setRows([]);
    setJoined(false);
    setMessage("");
    refresh().catch(() => {
      if (active)
        setMessage(
          "The shared leaderboard is not connected yet. Your local XP and badges are still available.",
        );
    });
    return () => {
      active = false;
    };
  }, [user?.id]);
  async function publish(visible: boolean) {
    if (!supabase || !user || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const nickname = (
        progress.settings.nickname || progress.settings.name
      ).trim();
      if (visible && !nickname) {
        setMessage("Save a nickname in Account before joining.");
        return;
      }
      const result = visible
        ? await supabase
            .from("cq_leaderboard")
            .upsert(
              {
                user_id: user.id,
                nickname,
                avatar: progress.settings.avatar,
                xp: Math.min(100000, xp),
                completed,
                visible: true,
              },
              { onConflict: "user_id" },
            )
        : await supabase.from("cq_leaderboard").delete().eq("user_id", user.id);
      if (result.error) throw result.error;
      await refresh();
      setMessage(
        visible
          ? "Your latest practice score is published. Keep building!"
          : "You left the leaderboard. Your private learning progress is unchanged.",
      );
    } catch {
      setMessage(
        "Could not update the leaderboard. Check your connection or try again later.",
      );
    } finally {
      setBusy(false);
    }
  }
  const badges = [
    { xp: 100, title: "First spark", emoji: "⚡" },
    { xp: 500, title: "Bug hunter", emoji: "🐛" },
    { xp: 1500, title: "System builder", emoji: "🛠️" },
    { xp: 3000, title: "Quest champion", emoji: "🏆" },
  ];
  return (
    <section className="page leaderboard-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">BUILD. BREAK. FIX. CLIMB.</p>
          <h1>Leaderboard</h1>
          <p>Celebrate practice XP with your fellow builders.</p>
        </div>
      </div>
      <article className="settings-card">
        <div className="profile-preview">
          <ProfileAvatar value={progress.settings.avatar} />
          <div>
            <h2>
              {progress.settings.nickname ||
                progress.settings.name ||
                "Your adventure"}
            </h2>
            <b>
              {xp} XP · {completed}/21 lessons · {progress.settings.level} path
            </b>
          </div>
        </div>
        <div className="reward-badges">
          {badges.map((b) => (
            <div key={b.title} className={xp >= b.xp ? "earned" : ""}>
              <span>{b.emoji}</span>
              <b>{b.title}</b>
              <small>
                {xp >= b.xp
                  ? "Unlocked"
                  : `${Math.max(0, b.xp - xp)} XP to unlock`}
              </small>
            </div>
          ))}
        </div>
        <p>
          Earn XP from lesson steps and workshop quests. Badges unlock at 100,
          500, 1,500 and 3,000 XP.
        </p>
      </article>
      <article className="settings-card">
        <h2>Community top 50</h2>
        <p>
          Joining makes your nickname, selected photo/avatar, practice XP and
          lesson count public. Email and private code stay private. Scores are
          self-study progress, not verified exam marks.
        </p>
        {!supabase ? (
          <p>
            Community rankings need the CodeQuest account service. You can earn
            every local badge while practising as a guest.
          </p>
        ) : !user ? (
          <a href="#account">Sign in to join the leaderboard →</a>
        ) : (
          <div className="button-row">
            <button
              className="primary"
              disabled={busy}
              onClick={() => void publish(true)}
            >
              {joined ? "Publish latest XP" : "Join leaderboard"}
            </button>
            {joined && (
              <button disabled={busy} onClick={() => void publish(false)}>
                Leave leaderboard
              </button>
            )}
            <a href="#account">Edit player profile</a>
          </div>
        )}
        {supabase && (
          <button
            disabled={busy}
            onClick={() => {
              setBusy(true);
              refresh()
                .then(() => setMessage("Leaderboard refreshed."))
                .catch(() => setMessage("Could not refresh rankings."))
                .finally(() => setBusy(false));
            }}
          >
            Refresh rankings
          </button>
        )}
        <p role="status">{message}</p>
        {rows.length ? (
          <ol className="leaderboard-list">
            {rows.map((r, i) => (
              <li
                key={r.user_id}
                className={r.user_id === user?.id ? "is-you" : ""}
              >
                <b>#{i + 1}</b>
                <ProfileAvatar value={r.avatar} />
                <span>
                  {r.nickname}
                  {r.user_id === user?.id ? " · You" : ""}
                  <small>{r.completed}/21 lessons complete</small>
                </span>
                <strong>{r.xp} XP</strong>
              </li>
            ))}
          </ol>
        ) : (
          <p>
            No published scores to show yet. Be the first builder on the board.
          </p>
        )}
      </article>
    </section>
  );
}
