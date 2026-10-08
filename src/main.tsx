import React, { Component, lazy, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Terminal,
  House,
  BookOpen,
  PanelsTopLeft,
  Flag,
  ChartNoAxesCombined,
  Settings as SettingsIcon,
  ArrowRight,
  CheckCircle2,
  Flame,
  Zap,
  Search,
  WifiOff,
  Download,
  Menu,
} from "lucide-react";
import "./styles.css";
import { lessons, tracks } from "./curriculum";
import { loadProgress, saveProgress, xpFor, streakFor } from "./lib/progress";
import type { Progress } from "./lib/progress";
import CityMap from "./components/CityMap";
import TorCoach from "./components/TorCoach";
import { VoiceControls } from "./components/VoiceControls";
import { reloadLatestWorkspace } from "./lib/workspace-recovery";
import AuthProvider, { useAuth } from "./components/AuthProvider";
const Account = lazy(() => import("./components/Account"));
const Classes = lazy(() => import("./components/Classes"));
const Playground = lazy(() => import("./components/Playground"));
const LessonView = lazy(() => import("./components/LessonView"));
const FormDesigner = lazy(() => import("./components/FormDesigner"));
const Assessment = lazy(() => import("./components/Assessment"));
const SettingsPage = lazy(() => import("./components/Settings"));
const navigation = [
  { id: "home", title: "World", icon: House },
  { id: "learn", title: "Lessons", icon: BookOpen },
  { id: "playground", title: "Code Lab", icon: Terminal },
  { id: "designer", title: "WinForms", icon: PanelsTopLeft },
  { id: "assessment", title: "Assessment", icon: Flag },
  { id: "progress", title: "Progress", icon: ChartNoAxesCombined },
  { id: "settings", title: "Settings", icon: SettingsIcon },
  { id: "account", title: "Account", icon: House },
  { id: "classes", title: "Classes", icon: BookOpen },
];
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { failed: boolean; detail: string; recovering: boolean }
> {
  state = { failed: false, detail: "", recovering: false };
  static getDerivedStateFromError(error: unknown) {
    return {
      failed: true,
      detail:
        error instanceof Error
          ? error.message
          : "The workspace failed to open.",
    };
  }
  componentDidCatch(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const chunkFailure = /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk/i.test(message);
    if (!chunkFailure || !navigator.onLine) return;
    const key = "cq-auto-workspace-recovery";
    // Storage may be unavailable in private or restricted browsing. In that
    // case leave the manual recovery action available rather than risk a loop.
    try {
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
    } catch {
      return;
    }
    this.setState({ recovering: true });
    reloadLatestWorkspace().catch((recoveryError) =>
      this.setState({
        recovering: false,
        detail:
          recoveryError instanceof Error
            ? recoveryError.message
            : "Automatic recovery failed.",
      }),
    );
  }
  render() {
    if (this.state.failed)
      return (
        <section className="page">
          <h1>Let’s get you back on track.</h1>
          <p>
            {this.state.recovering
              ? "CodeQuest found an outdated workspace and is refreshing it automatically. Your saved progress stays on this device."
              : "Something could not load. Your saved progress remains on this device."}
          </p>
          <button
            disabled={this.state.recovering}
            onClick={() => {
              this.setState({ recovering: true });
              reloadLatestWorkspace().catch((error) =>
                this.setState({ recovering: false, detail: error.message }),
              );
            }}
          >
            {this.state.recovering ? "Refreshing workspace…" : "Load latest workspace"}
          </button>
          <button
            onClick={() => {
              location.hash = "home";
            }}
          >
            Return to World
          </button>
          <details>
            <summary>Technical details</summary>
            <p role="status">{this.state.detail}</p>
          </details>
          <a
            href="https://github.com/jakeharvey162-source/code-quest/issues"
            target="_blank"
            rel="noreferrer"
          >
            Report a problem
          </a>
        </section>
      );
    // Keep the retry guard for this tab session, including Suspense renders.
    return this.props.children;
  }
}
function App() {
  const [progress, setProgress] = useState(loadProgress),
    [route, setRoute] = useState(() => location.hash.slice(1) || "home"),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState(""),
    [online, setOnline] = useState(navigator.onLine),
    [saveError, setSaveError] = useState(false),
    [installPrompt, setInstallPrompt] = useState<any>(null),
    [updateReady, setUpdateReady] = useState<ServiceWorker | null>(null);
  const [page, lessonId] = route.split("/");
  const selectedLesson = lessons.find((l) => l.id === lessonId);
  const xp = xpFor(progress),
    streak = streakFor(progress.activity);
  const next =
    lessons.find((l) => !progress.completed.includes(l.id)) || lessons[0];
  function navigate(path: string) {
    location.hash = path;
  }
  function update(fn: (p: Progress) => Progress) {
    setProgress(fn);
  }
  useEffect(() => {
    setSaveError(!saveProgress(progress));
  }, [progress]);
  useEffect(() => {
    const changed = () => {
      setRoute(location.hash.slice(1) || "home");
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  useEffect(() => {
    const changed = () => setOnline(navigator.onLine);
    window.addEventListener("online", changed);
    window.addEventListener("offline", changed);
    const install = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", install);
    return () => {
      window.removeEventListener("online", changed);
      window.removeEventListener("offline", changed);
      window.removeEventListener("beforeinstallprompt", install);
    };
  }, []);
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    let reload = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reload) location.reload();
    });
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (registration.waiting) setUpdateReady(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            )
              setUpdateReady(worker);
          });
        });
      })
      .catch(() => {});
    return () => {
      reload = true;
    };
  }, []);
  const visible = lessons.filter(
    (l) =>
      (filter === "all" || l.track === filter) &&
      (l.title + " " + l.concept).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div
      className={
        "app-shell " +
        (progress.settings.reducedMotion ? "reduce-motion " : "") +
        (progress.settings.highContrast ? "high-contrast" : "")
      }
      lang={progress.settings.language.split("-")[0]}
    >
      <a
        className="skip-link"
        href="#content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("content")?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className="app-sidebar">
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="CodeQuest home"
        >
          <span className="brand-icon">
            cq<span>+</span>
          </span>
          <span>
            CodeQuest<small>BUILD YOUR UNDERSTANDING</small>
          </span>
        </button>
        <p className="sidebar-label">YOUR ADVENTURE</p>
        <nav aria-label="Main navigation">
          {navigation.map(({ id, title, icon: Icon }) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              aria-current={page === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={19} />
              <span>{title}</span>
              {page === id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-coach">
            <div className="tor-mark">
              t<span>• •</span>
            </div>
            <div>
              <b>Tor’s here.</b>
              <p>One idea at a time.</p>
            </div>
          </div>
          <p>
            Made for curious minds.
            <br />
            Rooted in Africa. Open to everyone.
          </p>
          <a
            href="https://github.com/jakeharvey162-source/code-quest"
            target="_blank"
            rel="noreferrer"
          >
            Open source ↗
          </a>
        </div>
      </aside>
      <div className="main-column">
        <header className="app-header">
          <span className="breadcrumb">
            YOUR WORLD <span>/</span>{" "}
            {navigation.find((n) => n.id === page)?.title.toUpperCase() ||
              "LESSON"}
          </span>
          <div className="header-stats">
            {!online && (
              <span className="offline-pill">
                <WifiOff size={14} />
                Offline
              </span>
            )}
            <span>
              <Flame size={17} />
              {streak} day{streak !== 1 ? "s" : ""}
            </span>
            <span className="xp-pill">
              <Zap size={16} />
              {xp} XP
            </span>
            <button
              className="avatar"
              aria-label="Open learning profile"
              onClick={() => navigate("settings")}
            >
              {(progress.settings.name || "Q").slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        {saveError && (
          <p className="warning-banner" role="alert">
            This browser could not save your progress. Export a backup in
            Settings before leaving.
          </p>
        )}
        {updateReady && (
          <div className="warning-banner">
            A new CodeQuest version is available.{" "}
            <button
              onClick={() => {
                updateReady.postMessage({ type: "SKIP_WAITING" });
                setTimeout(() => location.reload(), 400);
              }}
            >
              Update app
            </button>
          </div>
        )}
        <main id="content" tabIndex={-1}>
          <ErrorBoundary key={route}>
            <Suspense
              fallback={
                <div className="loading-page" role="status">
                  <span className="loading-dot" />
                  Getting your workspace ready…
                </div>
              }
            >
              {page === "home" ? (
                <section className="page home-page">
                  <div className="welcome-line">
                    <p className="eyebrow">A SMALL STEP. A REAL SKILL.</p>
                    <span>
                      Welcome
                      {progress.settings.name
                        ? ", " + progress.settings.name
                        : ""}
                      .
                    </span>
                  </div>
                  <div className="home-hero">
                    <div className="hero-copy">
                      <h1>
                        Don’t just
                        <br />
                        learn code.
                        <br />
                        <em>Make it yours.</em>
                      </h1>
                      <p>
                        From your first variable to a form that works. Explore,
                        predict, build, break it, and finally do it on your own.
                      </p>
                      <button
                        className="primary"
                        onClick={() => navigate("learn/" + next.id)}
                      >
                        {progress.completed.length
                          ? "Continue your adventure"
                          : "Start your first quest"}
                        <ArrowRight size={18} />
                      </button>
                      <div className="hero-details">
                        <span>
                          <CheckCircle2 size={14} />
                          No account needed
                        </span>
                        <span>
                          <CheckCircle2 size={14} />
                          No paid APIs
                        </span>
                      </div>
                    </div>
                    <div className="hero-map">
                      <CityMap
                        onSelect={(id) => {
                          setFilter(id);
                          navigate("learn");
                        }}
                      />
                      <span className="map-sticker">
                        21 QUESTS.
                        <br />
                        ONE CURIOUS YOU.
                      </span>
                    </div>
                  </div>
                  <div className="world-section-heading">
                    <div>
                      <p className="eyebrow">CHOOSE YOUR NEIGHBOURHOOD</p>
                      <h2>A world of things to make.</h2>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => {
                        setFilter("all");
                        navigate("learn");
                      }}
                    >
                      All quests <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="district-list">
                    {tracks.map((track, i) => {
                      const total = lessons.filter(
                          (l) => l.track === track.id,
                        ).length,
                        done = lessons.filter(
                          (l) =>
                            l.track === track.id &&
                            progress.completed.includes(l.id),
                        ).length;
                      return (
                        <button
                          className="district"
                          style={
                            {
                              "--district-color": track.color,
                            } as React.CSSProperties
                          }
                          key={track.id}
                          onClick={() => {
                            setFilter(track.id);
                            navigate("learn");
                          }}
                        >
                          <span className="district-number">0{i + 1}</span>
                          <div>
                            <small>{track.name.toUpperCase()}</small>
                            <h3>{track.subtitle}</h3>
                            <p>{track.description}</p>
                          </div>
                          <div className="district-progress">
                            <b>
                              {done}/{total}
                            </b>
                            <span>quests complete</span>
                            <ArrowRight size={21} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="home-footer-card">
                    <div className="tor-mark">
                      t<span>• •</span>
                    </div>
                    <div>
                      <p className="eyebrow">A NOTE FROM TOR</p>
                      <h3>Understanding beats memorising.</h3>
                      <p>
                        Make a prediction. Test it. Explain the result. That’s
                        how the idea becomes yours.
                      </p>
                    </div>
                    <VoiceControls
                      settings={progress.settings}
                      text="Welcome to CodeQuest. Choose a neighbourhood to practise C sharp, Windows Forms, or object oriented programming."
                      onNavigate={navigate}
                    />
                  </div>
                  {installPrompt && (
                    <button
                      className="install-button"
                      onClick={async () => {
                        await installPrompt.prompt();
                        setInstallPrompt(null);
                      }}
                    >
                      <Download size={16} />
                      Install CodeQuest on this device
                    </button>
                  )}
                </section>
              ) : page === "learn" && selectedLesson ? (
                <LessonView
                  key={selectedLesson.id}
                  lesson={selectedLesson}
                  progress={progress}
                  update={update}
                  onNavigate={navigate}
                />
              ) : page === "learn" ? (
                <section className="page library-page">
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">THE QUEST LIBRARY</p>
                      <h1>Build a little. Learn a lot.</h1>
                      <p>
                        Every quest ends with something you can explain or do
                        yourself.
                      </p>
                    </div>
                    <label className="search-box">
                      <Search size={17} />
                      <input
                        aria-label="Search lessons"
                        placeholder="Find a topic…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="filter-tabs">
                    {[{ id: "all", name: "All quests" }, ...tracks].map((t) => (
                      <button
                        key={t.id}
                        aria-pressed={filter === t.id}
                        className={filter === t.id ? "active" : ""}
                        onClick={() => setFilter(t.id)}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                  <div className="lesson-list">
                    {visible.map((lesson, i) => {
                      const done = progress.completed.includes(lesson.id),
                        started = (progress.steps[lesson.id] || []).length > 0;
                      return (
                        <button
                          className="lesson-row"
                          key={lesson.id}
                          onClick={() => navigate("learn/" + lesson.id)}
                        >
                          <span
                            className={
                              "lesson-index " + (done ? "complete" : "")
                            }
                          >
                            {done ? (
                              <CheckCircle2 size={22} />
                            ) : (
                              String(i + 1).padStart(2, "0")
                            )}
                          </span>
                          <div>
                            <small>
                              {tracks.find((t) => t.id === lesson.track)?.name}{" "}
                              /{" "}
                              {lesson.kind === "code"
                                ? "CODE CHALLENGE"
                                : "FORMS KNOWLEDGE"}
                            </small>
                            <h2>{lesson.title}</h2>
                            <p>{lesson.concept}</p>
                          </div>
                          <span className="lesson-row-status">
                            {done
                              ? "Complete"
                              : started
                                ? "In progress"
                                : `${lesson.minutes} min`}
                            <ArrowRight size={18} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {!visible.length && (
                    <div className="empty-state">
                      <h2>No quests match that search.</h2>
                      <button
                        onClick={() => {
                          setSearch("");
                          setFilter("all");
                        }}
                      >
                        Show every quest
                      </button>
                    </div>
                  )}
                </section>
              ) : page === "playground" ? (
                <Playground progress={progress} update={update} />
              ) : page === "designer" ? (
                <FormDesigner settings={progress.settings} />
              ) : page === "assessment" ? (
                <Assessment
                  progress={progress}
                  update={update}
                  onNavigate={navigate}
                />
              ) : page === "account" ? (
                <Account progress={progress} update={update} />
              ) : page === "classes" ? (
                <Classes progress={progress} onNavigate={navigate} />
              ) : page === "settings" ? (
                <SettingsPage
                  progress={progress}
                  update={update}
                  onNavigate={navigate}
                />
              ) : page === "progress" ? (
                <ProgressPage progress={progress} onNavigate={navigate} />
              ) : (
                <section className="page">
                  <h1>That path isn’t on the map.</h1>
                  <button onClick={() => navigate("home")}>
                    Return to the world
                  </button>
                </section>
              )}
            </Suspense>
          </ErrorBoundary>
        </main>
        <TorCoach page={page} settings={progress.settings} />
        <footer className="app-footer">
          <span>CodeQuest / Built for understanding.</span>
          <span>
            Progress is stored on this device.{" "}
            <button onClick={() => navigate("settings")}>Back it up →</button>
          </span>
        </footer>
      </div>
    </div>
  );
}
function ProgressPage({
  progress,
  onNavigate,
}: {
  progress: Progress;
  onNavigate: (p: string) => void;
}) {
  const count = lessons.filter((l) => progress.completed.includes(l.id)).length;
  return (
    <section className="page progress-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR PROGRESS</p>
          <h1>You’re building something.</h1>
          <p>Every completed quest is another idea you made your own.</p>
        </div>
      </div>
      <div className="progress-stats">
        <article>
          <span>QUESTS COMPLETE</span>
          <b>
            {count}
            <small> / {lessons.length}</small>
          </b>
        </article>
        <article>
          <span>EXPERIENCE EARNED</span>
          <b>
            {xpFor(progress)}
            <small> XP</small>
          </b>
        </article>
        <article>
          <span>CURRENT STREAK</span>
          <b>
            {streakFor(progress.activity)}
            <small> days</small>
          </b>
        </article>
      </div>
      <h2>Your neighbourhoods</h2>
      <div className="track-progress-list">
        {tracks.map((track) => {
          const own = lessons.filter((l) => l.track === track.id),
            done = own.filter((l) => progress.completed.includes(l.id)).length;
          return (
            <article key={track.id}>
              <div>
                <b>
                  {track.name} / {track.subtitle}
                </b>
                <span>
                  {done} of {own.length}
                </span>
              </div>
              <progress max={own.length} value={done} />
            </article>
          );
        })}
      </div>
      <div className="badges">
        <h2>Milestones worth keeping.</h2>
        {[
          {
            name: "First steps",
            desc: "Complete your first quest",
            done: count >= 1,
          },
          {
            name: "Building momentum",
            desc: "Complete five quests",
            done: count >= 5,
          },
          {
            name: "Well rounded",
            desc: "Complete a quest in every neighbourhood",
            done: tracks.every((t) =>
              lessons.some(
                (l) => l.track === t.id && progress.completed.includes(l.id),
              ),
            ),
          },
          {
            name: "Quest master",
            desc: "Complete every quest",
            done: count === lessons.length,
          },
        ].map((b) => (
          <div key={b.name} className={b.done ? "badge earned" : "badge"}>
            <CheckCircle2 size={24} />
            <b>{b.name}</b>
            <p>{b.desc}</p>
            <small>{b.done ? "EARNED" : "IN YOUR FUTURE"}</small>
          </div>
        ))}
      </div>
      <h2>Assessment history</h2>
      {progress.assessments.length ? (
        <div className="assessment-history">
          {[...progress.assessments].reverse().map((a, i) => (
            <div key={i}>
              <span>{new Date(a.date).toLocaleDateString()}</span>
              <b>
                {a.score} / {a.total}
              </b>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>You haven’t completed a practice assessment yet.</p>
          <button onClick={() => onNavigate("assessment")}>
            Try the assessment arena <ArrowRight size={16} />
          </button>
        </div>
      )}
      <button onClick={() => onNavigate("settings")}>
        Export your progress backup <Download size={16} />
      </button>
    </section>
  );
}
function SessionApp() {
  const { user } = useAuth();
  return <App key={user?.id || "guest"} />;
}
createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <SessionApp />
  </AuthProvider>,
);
