import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { lessons } from "../curriculum";
import { xpFor, type Progress } from "../lib/progress";
export default function Classes({
  progress,
  onNavigate,
}: {
  progress: Progress;
  onNavigate: (path: string) => void;
}) {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]),
    [assignments, setAssignments] = useState<any[]>([]),
    [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState(""),
    [name, setName] = useState(""),
    [code, setCode] = useState(""),
    [lessonId, setLessonId] = useState(lessons[0].id),
    [due, setDue] = useState("");
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const current = classes.find((item) => item.id === selected),
    owner = current?.owner_id === user?.id;
  async function refresh() {
    if (!supabase || !user) return;
    const result = await supabase
      .from("cq_classes")
      .select("id,name,owner_id,join_code")
      .order("created_at");
    if (result.error) throw result.error;
    setClasses(result.data || []);
  }
  async function details() {
    if (!supabase || !selected) {
      setAssignments([]);
      setStudents([]);
      return;
    }
    const [a, s] = await Promise.all([
      supabase
        .from("cq_assignments")
        .select("id,lesson_id,due_date")
        .eq("class_id", selected)
        .order("created_at"),
      supabase
        .from("cq_members")
        .select("user_id,display_name,completed,xp,updated_at")
        .eq("class_id", selected),
    ]);
    if (a.error || s.error) throw a.error || s.error;
    setAssignments(a.data || []);
    setStudents(s.data || []);
  }
  useEffect(() => {
    refresh().catch(() =>
      setMessage(
        "Classes need the CodeQuest database migration and an internet connection.",
      ),
    );
  }, [user?.id]);
  useEffect(() => {
    setAssignments([]);
    setStudents([]);
    details().catch(() => setMessage("This class could not load."));
  }, [selected]);
  async function action(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await task();
    } catch (error) {
      setMessage((error as any)?.message || "Could not complete the request.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page settings-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">LEARN TOGETHER</p>
          <h1>A classroom in CodeQuest.</h1>
          <p>
            Lecturers assign quests. Learners share progress when they choose.
          </p>
        </div>
      </div>
      {!user || !supabase ? (
        <article className="settings-card">
          <p>Sign in to create a class or join your lecturer’s class.</p>
          <button onClick={() => onNavigate("account")}>Open account</button>
        </article>
      ) : (
        <>
          <div className="settings-grid">
            <form
              className="settings-card"
              onSubmit={(e) => {
                e.preventDefault();
                action(async () => {
                  const { data, error } = await supabase!
                    .from("cq_classes")
                    .insert({ name: name.trim(), owner_id: user.id })
                    .select("id")
                    .single();
                  if (error) throw error;
                  await refresh();
                  setSelected(data.id);
                  setName("");
                  setMessage(
                    "Class created. Share its invitation code with your learners.",
                  );
                });
              }}
            >
              <h2>Create a class</h2>
              <label>
                Class name
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <button disabled={busy}>Create class</button>
            </form>
            <form
              className="settings-card"
              onSubmit={(e) => {
                e.preventDefault();
                action(async () => {
                  const { data, error } = await supabase!.rpc("cq_join_class", {
                    invitation: code.trim(),
                    learner_name: progress.settings.name || "Learner",
                  });
                  if (error) throw error;
                  await refresh();
                  setSelected(data);
                  setCode("");
                  setMessage(
                    "Joined. Use Share my progress to update your lecturer.",
                  );
                });
              }}
            >
              <h2>Join a class</h2>
              <label>
                Invitation code
                <input
                  required
                  maxLength={36}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </label>
              <p className="muted">
                Joining shares your profile name. Share my progress sends
                completed quest IDs and XP to the lecturer. Code drafts,
                assessment answers and account settings stay private.
              </p>
              <button disabled={busy}>Join class</button>
            </form>
          </div>
          <article className="settings-card">
            <label>
              Your classes
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Choose a class</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            {current && (
              <>
                <h2>{current.name}</h2>
                {owner ? (
                  <>
                    <p>
                      Invitation code: <code>{current.join_code}</code>
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        action(async () => {
                          const { error } = await supabase!
                            .from("cq_assignments")
                            .insert({
                              class_id: selected,
                              lesson_id: lessonId,
                              due_date: due || null,
                            });
                          if (error) throw error;
                          await details();
                          setMessage("Quest assigned.");
                        });
                      }}
                    >
                      <label>
                        Quest
                        <select
                          value={lessonId}
                          onChange={(e) => setLessonId(e.target.value)}
                        >
                          {lessons.map((lesson) => (
                            <option key={lesson.id} value={lesson.id}>
                              {lesson.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Due date (optional)
                        <input
                          type="date"
                          value={due}
                          onChange={(e) => setDue(e.target.value)}
                        />
                      </label>
                      <button disabled={busy}>Assign quest</button>
                    </form>
                  </>
                ) : (
                  <div className="button-row">
                    <button
                      disabled={busy}
                      onClick={() =>
                        action(async () => {
                          const { error } = await supabase!
                            .from("cq_members")
                            .update({
                              display_name: progress.settings.name || "Learner",
                              completed: progress.completed,
                              xp: xpFor(progress),
                              updated_at: new Date().toISOString(),
                            })
                            .eq("class_id", selected)
                            .eq("user_id", user.id);
                          if (error) throw error;
                          await details();
                          setMessage(
                            "Your progress was shared with this class.",
                          );
                        })
                      }
                    >
                      Share my progress
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        action(async () => {
                          const { error } = await supabase!
                            .from("cq_members")
                            .delete()
                            .eq("class_id", selected)
                            .eq("user_id", user.id);
                          if (error) throw error;
                          setSelected("");
                          await refresh();
                          setMessage(
                            "Left the class. Its lecturer can no longer see your shared progress.",
                          );
                        })
                      }
                    >
                      Leave class
                    </button>
                  </div>
                )}
                <h3>Assigned quests</h3>
                {assignments.length ? (
                  assignments.map((item) => (
                    <div key={item.id} className="button-row">
                      <button
                        onClick={() => onNavigate(`learn/${item.lesson_id}`)}
                      >
                        {lessons.find((lesson) => lesson.id === item.lesson_id)
                          ?.title || "Quest"}
                      </button>
                      <span>
                        {item.due_date ? `Due ${item.due_date}` : "No deadline"}
                      </span>
                      {owner && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            action(async () => {
                              const { error } = await supabase!
                                .from("cq_assignments")
                                .delete()
                                .eq("id", item.id);
                              if (error) throw error;
                              await details();
                            })
                          }
                        >
                          Remove assignment
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No quests assigned yet.</p>
                )}
                {owner && (
                  <>
                    <h3>Shared learning progress</h3>
                    <p className="muted">
                      Progress is learner-reported, not a verified examination
                      result.
                    </p>
                    {students.length ? (
                      <table>
                        <thead>
                          <tr>
                            <th>Learner</th>
                            <th>Quests</th>
                            <th>XP</th>
                            <th>Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student) => (
                            <tr key={student.user_id}>
                              <td>{student.display_name}</td>
                              <td>{student.completed.length}</td>
                              <td>{student.xp}</td>
                              <td>
                                {new Date(
                                  student.updated_at,
                                ).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>No learners have joined yet.</p>
                    )}
                  </>
                )}
              </>
            )}
          </article>
        </>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
