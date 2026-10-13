import { useEffect, useState, useRef } from "react";
import type { Progress } from "../lib/progress";
import type { UpdateProgress } from "./LessonView";
import { useAuth } from "./AuthProvider";
import { supabase } from "../lib/supabase";
import { avatars, profileAvatar, readProfilePhoto } from "../lib/profile";
import ProfileAvatar from "./ProfileAvatar";
export default function LearnerProfile({
  progress,
  update,
}: {
  progress: Progress;
  update: UpdateProgress;
}) {
  const { user } = useAuth();
  const [name, setName] = useState(progress.settings.name),
    [nickname, setNickname] = useState(progress.settings.nickname),
    [avatar, setAvatar] = useState(progress.settings.avatar),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const uploadVersion = useRef(0);
  useEffect(() => {
    const m = user?.user_metadata;
    setName(
      typeof m?.display_name === "string"
        ? m.display_name.slice(0, 60)
        : progress.settings.name,
    );
    setNickname(
      typeof m?.nickname === "string"
        ? m.nickname.slice(0, 32)
        : progress.settings.nickname,
    );
    setAvatar(m?.avatar ? profileAvatar(m.avatar) : progress.settings.avatar);
    return () => {
      uploadVersion.current++;
    };
  }, [user?.id]);
  async function save() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const profile = { name: name.trim(), nickname: nickname.trim(), avatar };
      if (user && supabase) {
        const { error } = await supabase.auth.updateUser({
          data: {
            display_name: profile.name,
            nickname: profile.nickname,
            avatar,
          },
        });
        if (error) throw error;
      }
      update((p) => ({ ...p, settings: { ...p.settings, ...profile } }));
      setMessage(
        user
          ? "Profile saved to your account and this device."
          : "Profile saved on this device. Sign in to keep it across devices.",
      );
    } catch {
      setMessage(
        "Could not save your account profile. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="settings-card learner-profile">
      <h2>Your player profile</h2>
      <div className="profile-preview">
        <ProfileAvatar value={avatar} />
        <b>{nickname || name || "New explorer"}</b>
      </div>
      <label>
        Your name
        <input
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />
      </label>
      <label>
        Nickname
        <input
          maxLength={32}
          value={nickname}
          placeholder="What should Tor call you?"
          onChange={(e) => setNickname(e.target.value)}
          disabled={busy}
        />
      </label>
      <div className="avatar-options" aria-label="Choose an avatar">
        {avatars.map((a) => (
          <button
            key={a}
            aria-label={"Choose avatar " + a}
            aria-pressed={a === avatar}
            disabled={busy}
            onClick={() => {
              uploadVersion.current++;
              setAvatar(a);
            }}
          >
            {a}
          </button>
        ))}
      </div>
      <label>
        Upload profile photo
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            const version = ++uploadVersion.current;
            setBusy(true);
            try {
              const photo = await readProfilePhoto(f);
              if (version === uploadVersion.current) setAvatar(photo);
            } catch (err) {
              setMessage(
                err instanceof Error
                  ? err.message
                  : "Could not read this photo.",
              );
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      <button className="primary" disabled={busy} onClick={() => void save()}>
        {busy ? "Saving…" : "Save player profile"}
      </button>
      <p aria-live="polite" role={message ? "status" : undefined}>{message}</p>
    </article>
  );
}
