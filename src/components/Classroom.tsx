import { lazy, Suspense } from "react";
import { useAuth } from "./AuthProvider";
import type { Progress } from "../lib/progress";
const Classes = lazy(() => import("./Classes"));
const Community = lazy(() => import("../community/Community"));
export default function Classroom({
  progress,
  onNavigate,
  community = false,
}: {
  progress: Progress;
  onNavigate: (path: string) => void;
  community?: boolean;
}) {
  const { user } = useAuth();
  if (!user)
    return (
      <section className="page settings-page">
        <p className="eyebrow">LEARN TOGETHER</p>
        <h1>Classroom</h1>
        <article className="settings-card">
          <h2>Your learning crew starts here</h2>
          <p>
            Create or join a class, share code with the community, and chat
            privately with accepted friends. Sign in to take part.
          </p>
          <p>
            Class owners can assign quests and see progress you choose to share.
            A class does not include an automatic lecturer or live lessons.
          </p>
          <button className="primary" onClick={() => onNavigate("account")}>
            Open account
          </button>
        </article>
      </section>
    );
  return (
    <>
      <nav className="classroom-tabs" aria-label="Classroom sections">
        <button
          aria-current={!community ? "page" : undefined}
          onClick={() => onNavigate("classes")}
        >
          Classes & assignments
        </button>
        <button
          aria-current={community ? "page" : undefined}
          onClick={() => onNavigate("community")}
        >
          Community
        </button>
      </nav>
      <Suspense fallback={<p role="status">Opening your classroom…</p>}>
        {community ? (
          <Community progress={progress} onNavigate={onNavigate} />
        ) : (
          <Classes progress={progress} onNavigate={onNavigate} />
        )}
      </Suspense>
    </>
  );
}
