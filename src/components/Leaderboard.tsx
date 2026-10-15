import { useEffect, useState, useRef } from "react";
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
  rank?: number;
  position?: number;
  xp_ahead?: number | null;
};
export default function Leaderboard({ progress }: { progress: Progress }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Entry[]>([]),
    [joined, setJoined] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [page, setPage] = useState(0),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(false),
    [mineRank, setMineRank] = useState<Entry | null>(null);
  const requestId = useRef(0);
  const autoPublishAttempt = useRef("");
  const xp = xpFor(progress),
    completed = lessons.filter((l) => progress.completed.includes(l.id)).length;
  async function refresh() {
    if (!supabase) return;
    const request = ++requestId.current;
    setLoading(true);
    try {
      const [ranking, mine, position] = await Promise.all([
        supabase
          .from("cq_rankings")
          .select(
            "user_id,nickname,avatar,xp,completed,rank,position,xp_ahead",
            { count: "exact" },
          )
          .order("xp", { ascending: false })
          .order("completed", { ascending: false })
          .order("user_id")
          .range(page * 25, page * 25 + 24),
        user
          ? supabase
              .from("cq_leaderboard")
              .select("visible")
              .eq("user_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        user
          ? supabase
              .from("cq_rankings")
              .select(
                "user_id,nickname,avatar,xp,completed,rank,position,xp_ahead",
              )
              .eq("user_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);
      if (request !== requestId.current) return;
      if (!mine.error) setJoined(mine.data?.visible === true);
      if (ranking.error) throw ranking.error;
      if (mine.error) throw mine.error;
      if (position.error) throw position.error;
      if (request !== requestId.current) return;
      setMineRank(position.data);
      setTotal(ranking.count ?? (ranking.data || []).length);
      setRows(ranking.data || []);
      setJoined(mine.data?.visible === true);
    } finally {
      if (request === requestId.current) setLoading(false);
    }
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
      requestId.current++;
    };
  }, [user?.id, page]);
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
        ? await supabase.from("cq_leaderboard").upsert(
            {
              user_id: user.id,
              nickname,
              avatar: progress.settings.avatar,
              xp: Math.min(100000, Math.max(0, xp)),
              completed: Math.max(completed, mineRank?.completed || 0),
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
  useEffect(() => {
    if (!joined || !mineRank || busy || xp === mineRank.xp) return;
    const attempt = `${user?.id}:${xp}`;
    if (autoPublishAttempt.current === attempt) return;
    const timer = setTimeout(() => {
      autoPublishAttempt.current = attempt;
      void publish(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [joined, mineRank?.xp, xp, busy, user?.id]);
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
        <h2>Community rankings</h2>
        <p>
          Every participating player has a place on the board. Browse all pages;
          tied scores share a rank. Scores are self-reported practice progress, not verified competition results or cash prizes.
        </p>
        {mineRank && (
          <div className="rank-summary">
            <strong>Your rank: #{mineRank.rank}</strong>
            <span>
              {mineRank.xp} published XP · {total} players
            </span>
            <span>
              {mineRank.xp_ahead === null
                ? "You are leading the board!"
                : `${Math.max(1, (mineRank.xp_ahead ?? mineRank.xp) - mineRank.xp + 1)} XP to pass the next player`}
            </span>
            <button
              onClick={() =>
                setPage(Math.floor((Number(mineRank.position) - 1) / 25))
              }
              disabled={busy || loading}
            >
              Find my rank
            </button>
          </div>
        )}
        <p>
          Joining makes your nickname, selected photo/avatar, practice XP and
          lesson count public. Your current XP updates when you visit this board, including challenge penalties.
          Email and private code stay private. Scores are self-study progress,
          not verified exam marks.
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
        {!loading && page === 0 && rows.length > 0 && (
          <div className="rank-podium" aria-label="Top three players">
            {rows
              .filter((r) => Number(r.position) <= 3)
              .map((r) => (
                <div key={r.user_id}>
                  <span>{["🏆", "🥈", "🥉"][Number(r.position) - 1]}</span>
                  <ProfileAvatar value={r.avatar} />
                  <b>{r.nickname}</b>
                  <strong>{r.xp} XP</strong>
                </div>
              ))}
          </div>
        )}
        {loading ? (
          <p role="status">Loading player rankings…</p>
        ) : rows.length ? (
          <ol className="leaderboard-list">
            {rows.map((r, i) => (
              <li
                key={r.user_id}
                className={r.user_id === user?.id ? "is-you" : ""}
              >
                <b>#{r.rank ?? page * 25 + i + 1}</b>
                <ProfileAvatar value={r.avatar} />
                <span>
                  {r.nickname}
                  {r.user_id === user?.id ? " · You" : ""}
                  {r.position && r.position <= 3
                    ? " · " +
                      ["🏆 Champion", "🥈 Trailblazer", "🥉 Rising star"][
                        r.position - 1
                      ]
                    : ""}
                  <small>{r.completed}/21 lessons complete</small>
                </span>
                <strong>{r.xp} XP</strong>
              </li>
            ))}
          </ol>
        ) : (
          <p>
            {supabase
              ? "No public players to show on this page yet."
              : "Connect the account service to see real students here. No example players or invented ranks are shown."}
          </p>
        )}
        {total > 25 && (
          <nav className="rank-pagination" aria-label="Leaderboard pages">
            <button
              disabled={page === 0 || loading || busy}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous players
            </button>
            <span>
              Page {page + 1} of {Math.ceil(total / 25)} · {total} players
            </span>
            <button
              disabled={(page + 1) * 25 >= total || loading || busy}
              onClick={() => setPage((p) => p + 1)}
            >
              Next players
            </button>
          </nav>
        )}
        <a href="#challenges">Earn your next XP in a code challenge →</a>
      </article>
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
    </section>
  );
}
