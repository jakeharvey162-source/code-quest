import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useCommunity } from "./useCommunity";
import { client, result, type Message, type Profile } from "./api";
import { codeChallenges } from "../lib/code-challenges.mjs";
import { xpFor, type Progress } from "../lib/progress";
import { writeText } from "../lib/local-data";
import "./community.css";
const InlineTerminal = lazy(() => import("../components/UniversalTerminal"));
const languages = [
  ["csharp", "C#"],
  ["python", "Python"],
  ["python-turtle", "Python Turtle"],
  ["javascript", "JavaScript"],
  ["typescript", "TypeScript"],
  ["html", "HTML"],
  ["css", "CSS"],
];
type Draft = {
  body: string;
  code: string;
  language: string;
  challenge_id: string | null;
};
const empty: Draft = {
  body: "",
  code: "",
  language: "csharp",
  challenge_id: null,
};
// Token spans are React text nodes. No user-supplied HTML is ever rendered.
function CodePreview({ code, language }: { code: string; language: string }) {
  const parts = code.split(
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/[^\n]*|#[^\n]*|\b(?:public|private|static|class|void|return|if|else|for|while|int|string|decimal|using|const|let|function|import|from|def|print|True|False|true|false|None|new|async|await)\b|\b\d+(?:\.\d+)?\b)/g,
  );
  return (
    <pre className="community-code" aria-label={language + " code snippet"}>
      <code>
        {parts.map((part, i) => (
          <span
            key={i}
            className={
              /^['"]/.test(part)
                ? "token-string"
                : /^(\/\/|#)/.test(part)
                  ? "token-comment"
                  : /^\d/.test(part)
                    ? "token-number"
                    : /^[a-zA-Z]+$/.test(part)
                      ? "token-keyword"
                      : undefined
            }
          >
            {part}
          </span>
        ))}
      </code>
    </pre>
  );
}
export default function Community({
  progress,
  onNavigate,
  defaultTab = "channels",
}: {
  progress: Progress;
  onNavigate: (path: string) => void;
  defaultTab?: "channels" | "people";
}) {
  const c = useCommunity();
  const [tab, setTab] = useState<string>(defaultTab),
    [roomSearch, setRoomSearch] = useState(""),
    [peopleSearch, setPeopleSearch] = useState(""),
    [messageSearch, setMessageSearch] = useState("");
  // Routes share a component instance: switching the Private chats shortcut
  // must still reveal friends even when Community was already open.
  useEffect(() => setTab(defaultTab), [defaultTab]);
  const [draft, setDraft] = useState<Draft>(empty),
    [draftReady, setDraftReady] = useState(false),
    [draftStatus, setDraftStatus] = useState(""),
    [saved, setSaved] = useState<any[]>([]),
    [busy, setBusy] = useState(false);
  const [remoteResults, setRemoteResults] = useState<Message[] | null>(null),
    [reporting, setReporting] = useState(""),
    [reason, setReason] = useState(""),
    [confirmCancel, setConfirmCancel] = useState<Message | null>(null);
  const [nickname, setNickname] = useState(
      progress.settings.nickname || progress.settings.name || "New explorer",
    ),
    [interests, setInterests] = useState(""),
    [requests, setRequests] = useState(false),
    [presence, setPresence] = useState(false);
  const [foundPeople, setFoundPeople] = useState<Profile[]>([]);
  const [peopleNotice, setPeopleNotice] = useState("");
  const peopleRequest = useRef(0);
  const directory = [
    ...new Map(
      [...c.profiles, ...foundPeople].map((p) => [p.user_id, p]),
    ).values(),
  ];
  const [attachments, setAttachments] = useState(false);
  const [inlineEditor, setInlineEditor] = useState<string | null>(null);
  const [chatWidth, setChatWidth] = useState(45);
  const [reviewed, setReviewed] = useState<Record<string, Message>>({});
  const searchRequest = useRef(0);
  const draftWrites = useRef(Promise.resolve()),
    draftVersion = useRef(0);
  const current = c.rooms.find((r) => r.id === c.selected);
  const own = c.profiles.find((p) => p.user_id === c.user?.id);
  const draftKey = c.selected || "personal";
  const peerFor = (room: any) =>
    room.member_a === c.user?.id ? room.member_b : room.member_a;
  const profileFor = (id: string) => directory.find((p) => p.user_id === id);
  const roomName = (room: any) =>
    room.kind === "dm"
      ? profileFor(peerFor(room))?.nickname || "Private conversation"
      : room.name;
  const canManage =
    c.isModerator ||
    !!c.classes.find(
      (cls) => cls.id === current?.class_id && cls.owner_id === c.user?.id,
    );
  const totalUnread =
    Object.values(c.unread).reduce((a, b) => a + b, 0) +
    c.friends.filter(
      (f) => f.recipient === c.user?.id && f.status === "pending",
    ).length;
  useEffect(() => {
    if (own) {
      setNickname(own.nickname);
      setInterests(own.interests);
      setRequests(own.allow_requests);
      setPresence(own.show_presence);
    }
  }, [own?.user_id]);
  useEffect(() => {
    let cancelled = false;
    setDraftReady(false);
    setDraft(empty);
    setAttachments(false);
    setMessageSearch("");
    setRemoteResults(null);
    searchRequest.current++;
    draftWrites.current
      .then(() => c.store.get("draft", draftKey))
      .then((value: any) => {
        if (!cancelled) {
          setDraft(value || empty);
          setAttachments(!!value?.code || !!value?.challenge_id);
          setDraftReady(true);
          setDraftStatus(value ? "Draft restored from this device." : "");
        }
      })
      .catch(c.showError);
    return () => {
      cancelled = true;
    };
  }, [c.store, draftKey]);
  useEffect(() => {
    c.store
      .list("snippet")
      .then((rows: any) => setSaved(rows))
      .catch(c.showError);
  }, [c.store]);
  const edit = (patch: Partial<Draft>) => {
    if (patch.code || patch.challenge_id) setAttachments(true);
    const next = { ...draft, ...patch };
    setDraft(next);
    const version = ++draftVersion.current;
    setDraftStatus("Saving draft…");
    draftWrites.current = draftWrites.current
      .catch(() => {})
      .then(() => c.store.put("draft", draftKey, next))
      .then(() => {
        if (version === draftVersion.current)
          setDraftStatus("Draft saved on this device.");
      })
      .catch((error) => {
        setDraftStatus(
          "Draft could not be saved. Keep this page open and copy your text.",
        );
        c.showError(error);
      });
  };
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !draftReady) return;
    setBusy(true);
    try {
      await draftWrites.current;
      await c.queue(draft);
      ++draftVersion.current;
      await c.store.remove("draft", draftKey);
      setDraft(empty);
      setDraftStatus("Message saved to outbox.");
    } catch (e) {
      c.showError(e);
    } finally {
      setBusy(false);
    }
  }
  async function saveSnippet(code = draft.code, language = draft.language) {
    if (!code.trim()) {
      c.setNotice("Write or attach some code first.");
      return;
    }
    try {
      const item = {
        id: crypto.randomUUID(),
        code,
        language,
        title: code.split("\n")[0].slice(0, 60) || "Saved snippet",
        created_at: new Date().toISOString(),
      };
      await c.store.put("snippet", item.id, item);
      setSaved((await c.store.list("snippet")) as any[]);
      c.setNotice("Code saved to your private notebook on this device.");
    } catch (e) {
      c.showError(e);
    }
  }
  function openEditor(code: string, language: string) {
    if (
      !writeText(
        "cq-community-editor-import",
        JSON.stringify({ code, language }),
      )
    ) {
      c.setNotice(
        "Could not transfer the code. Copy it before opening the editor.",
      );
      return;
    }
    onNavigate("terminal");
  }
  function openBeside(code: string, language: string) {
    if (
      !writeText(
        "cq-community-editor-import",
        JSON.stringify({ code, language }),
      )
    ) {
      c.setNotice(
        "Could not transfer this code. Copy it before opening the editor.",
      );
      return;
    }
    setInlineEditor(crypto.randomUUID());
  }
  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      c.setNotice("Code copied.");
    } catch {
      c.setNotice(
        "Clipboard is unavailable. Select the snippet text to copy it.",
      );
    }
  }
  async function profile(e: React.FormEvent) {
    e.preventDefault();
    if (!c.user || busy) return;
    setBusy(true);
    try {
      await result(
        client()
          .from("cq_community_profiles")
          .upsert({
            user_id: c.user.id,
            nickname: nickname.trim(),
            avatar: ["🤖", "🦁", "🚀", "🧑🏾‍💻", "🦉", "🐉"].includes(
              progress.settings.avatar,
            )
              ? progress.settings.avatar
              : "🤖",
            interests: interests.trim(),
            allow_requests: requests,
            show_presence: presence,
            xp: xpFor(progress),
            completed: progress.completed.length,
          }),
      );
      await c.refresh();
      c.setNotice(
        "Community profile saved. You control friend requests and visibility.",
      );
      setTab("channels");
    } catch (e) {
      c.showError(e);
    } finally {
      setBusy(false);
    }
  }
  // Only opted-in presence is refreshed, and only while the Community page is visible.
  useEffect(() => {
    if (!own?.show_presence || !c.user) return;
    const heartbeat = () => {
      if (document.visibilityState === "visible" && navigator.onLine)
        void result(
          client()
            .from("cq_community_profiles")
            .update({ show_presence: true })
            .eq("user_id", c.user!.id),
        ).catch(c.showError);
    };
    heartbeat();
    const timer = setInterval(heartbeat, 45000);
    return () => clearInterval(timer);
  }, [own?.show_presence, c.user?.id]);
  async function searchPeople() {
    const request = ++peopleRequest.current;
    const term = peopleSearch.trim().slice(0, 60);
    if (term.length < 2) {
      setPeopleNotice("Type at least two characters to search all members.");
      return;
    }
    setPeopleNotice("Searching members…");
    const pattern = "%" + term.replace(/[\\%_]/g, "\\$&") + "%";
    try {
      const batches = await Promise.all(
        ["nickname", "interests"].map((field) =>
          result<Profile[]>(
            client()
              .from("cq_community_profiles")
              .select("*")
              .ilike(field, pattern)
              .order("nickname")
              .order("user_id")
              .limit(50),
          ),
        ),
      );
      if (request !== peopleRequest.current) return;
      const rows = [
        ...new Map(batches.flat().map((p) => [p.user_id, p])).values(),
      ];
      setFoundPeople(rows);
      setPeopleNotice(
        rows.length
          ? `${rows.length} matching members downloaded. Refine the search if needed; each field returns up to 50 matches.`
          : "No matching members found.",
      );
    } catch (error) {
      if (request === peopleRequest.current) {
        setPeopleNotice("Search failed. Downloaded members remain available.");
        c.showError(error);
      }
    }
  }
  async function searchHistory() {
    const request = ++searchRequest.current;
    if (!c.selected || !messageSearch.trim() || busy) return;
    setBusy(true);
    try {
      const term = "%" + messageSearch.replace(/[\\%_]/g, "\\$&") + "%";
      const query = (field: string) =>
        client()
          .from("cq_community_messages")
          .select("*")
          .eq("room_id", c.selected)
          .ilike(field, term)
          .order("created_at", { ascending: false })
          .limit(50);
      const [a, b] = await Promise.all([
        result<Message[]>(query("body")),
        result<Message[]>(query("code")),
      ]);
      if (request !== searchRequest.current) return;
      setRemoteResults(
        [...new Map([...a, ...b].map((m) => [m.id, m])).values()].sort((a, b) =>
          a.created_at.localeCompare(b.created_at),
        ),
      );
      c.setNotice(
        "Search shows up to 50 text and 50 code matches from this conversation.",
      );
    } catch (e) {
      c.showError(e);
    } finally {
      setBusy(false);
    }
  }
  async function direct(peer: string) {
    await c.action(async () => {
      const id = await result<string>(
        client().rpc("cq_community_dm", { peer }),
      );
      await c.refresh();
      c.setSelected(id);
      setTab("channels");
    });
  }
  async function friend(peer: string) {
    if (!c.user) return;
    await c.action(async () => {
      await result(
        client()
          .from("cq_community_friends")
          .insert({ requester: c.user!.id, recipient: peer }),
      );
      c.setNotice(
        "Friend request sent. Private messaging unlocks after they accept.",
      );
    });
  }
  async function block(peer: string) {
    if (!c.user) return;
    await c.action(async () => {
      await result(
        client()
          .from("cq_community_blocks")
          .upsert(
            { owner_id: c.user!.id, peer_id: peer },
            { onConflict: "owner_id,peer_id", ignoreDuplicates: true },
          ),
      );
      c.setNotice(
        "User blocked. Their messages and private conversation are hidden. You can undo this in Privacy.",
      );
    });
  }
  async function react(message: string, emoji: string) {
    if (!c.user) return;
    await c.action(async () => {
      const mine = c.reactions.some(
        (r) =>
          r.message_id === message &&
          r.user_id === c.user!.id &&
          r.emoji === emoji,
      );
      await result(
        mine
          ? client()
              .from("cq_community_reactions")
              .delete()
              .eq("message_id", message)
              .eq("user_id", c.user!.id)
              .eq("emoji", emoji)
          : client()
              .from("cq_community_reactions")
              .insert({ message_id: message, user_id: c.user!.id, emoji }),
      );
    });
  }
  const filteredMessages = (remoteResults ?? c.messages).filter(
    (m) =>
      (m.body + "\n" + m.code)
        .toLowerCase()
        .includes(messageSearch.toLowerCase()) &&
      !c.blocks.some((b) => b.peer_id === m.sender_id),
  );
  const accepted = c.friends.filter((f) => f.status === "accepted");
  const invitations = c.friends.filter((f) => f.status === "pending");
  const connected = (id: string) =>
    accepted.some((f) => f.requester === id || f.recipient === id);
  const pendingFriend = (id: string) =>
    invitations.some((f) => f.requester === id || f.recipient === id);
  const person = (p: Profile) => (
    <article key={p.user_id} className="community-person">
      <span className="community-avatar" aria-hidden="true">
        {p.avatar}
      </span>
      <div>
        <strong>
          {p.nickname}
          {p.user_id === c.user?.id ? " · You" : ""}
        </strong>
        <small>
          {p.xp.toLocaleString()} practice XP · {p.completed} lessons ·{" "}
          {p.xp >= 3000
            ? "🏆 Quest champion"
            : p.xp >= 1500
              ? "🛠 System builder"
              : p.xp >= 500
                ? "🐛 Bug hunter"
                : p.xp >= 100
                  ? "⚡ First spark"
                  : "New explorer"}
        </small>
        <p>{p.interests || "Here to build and learn."}</p>
        <small>
          {p.show_presence && p.last_seen
            ? !c.online
              ? "Last downloaded activity"
              : Date.now() - new Date(p.last_seen).getTime() < 90000
                ? "Active recently"
                : "Away"
            : "Presence private"}
        </small>
      </div>
      {c.user && p.user_id !== c.user.id && (
        <div className="community-actions">
          {connected(p.user_id) ? (
            <>
              <button
                disabled={!c.online}
                onClick={() => void direct(p.user_id)}
              >
                Message
              </button>
              <button
                disabled={!c.online}
                onClick={() =>
                  void c.action(() =>
                    result(
                      client()
                        .from("cq_community_friends")
                        .delete()
                        .or(
                          `requester.eq.${p.user_id},recipient.eq.${p.user_id}`,
                        ),
                    ),
                  )
                }
              >
                Remove friend
              </button>
            </>
          ) : (
            <button
              disabled={
                !c.online ||
                !own ||
                !p.allow_requests ||
                pendingFriend(p.user_id)
              }
              onClick={() => void friend(p.user_id)}
            >
              {pendingFriend(p.user_id)
                ? "Request pending"
                : p.allow_requests
                  ? "Add friend"
                  : "Requests closed"}
            </button>
          )}
          <button disabled={!c.online} onClick={() => void block(p.user_id)}>
            Block
          </button>
        </div>
      )}
    </article>
  );
  return (
    <section className="community-page page" aria-label="CodeQuest Community">
      <header className="community-heading">
        <div>
          <p className="eyebrow">BUILD TOGETHER. GET UNSTUCK.</p>
          <h1>Community</h1>
          <p>
            Your coding neighbourhood. Ask clearly, share what you tried, and
            help someone take their next step.
          </p>
        </div>
        <span
          className={"community-connection " + (!c.online ? "is-offline" : "")}
        >
          {c.online ? "● Connected to network" : "○ Offline · drafts stay here"}
        </span>
      </header>
      <div className="community-notice" role="status" aria-live="polite">
        {c.notice ||
          (!c.online
            ? "Read downloaded conversations, save code and draft replies. New messages wait for a connection."
            : "Code runs only after you open it in the isolated editor and press Run.")}{" "}
        {c.notice && (
          <button
            onClick={() => c.setNotice("")}
            aria-label="Dismiss community notice"
          >
            ×
          </button>
        )}
      </div>
      {!c.user && (
        <div className="community-welcome">
          <div>
            <h2>Bring your next idea.</h2>
            <p>
              Sign in to join channels and message accepted friends. You can use
              the private code notebook and save a draft now.
            </p>
          </div>
          <button className="primary" onClick={() => onNavigate("account")}>
            Sign in to Community
          </button>
        </div>
      )}
      {c.user && !own && (
        <div className="community-welcome">
          <p>
            Choose a Community nickname before posting. Friend requests and
            presence start off.
          </p>
          <button className="primary" onClick={() => setTab("privacy")}>Create my Community profile</button>
        </div>
      )}
      <nav className="community-tabs" aria-label="Community sections">
        {[
          ["channels", "Conversations"],
          ["people", "People & friends"],
          ["notebook", "Code notebook"],
          ["privacy", "Privacy & profile"],
          ...(c.isModerator ||
          c.classes.some((cls) => cls.owner_id === c.user?.id)
            ? [["moderation", "Moderation"]]
            : []),
        ].map(([id, title]) => (
          <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {title}
            {id === "people" && totalUnread > 0 ? (
              <span className="community-count">{totalUnread}</span>
            ) : null}
          </button>
        ))}
      </nav>
      {tab === "channels" && (
        <div
          className={inlineEditor ? "community-with-editor" : undefined}
          style={
            { "--community-chat-width": chatWidth + "%" } as React.CSSProperties
          }
        >
          {inlineEditor && (
            <div className="community-pane-controls">
              <label>
                Chat panel width
                <input
                  aria-label="Chat panel width"
                  type="range"
                  min={35}
                  max={65}
                  step={5}
                  value={chatWidth}
                  onChange={(event) => setChatWidth(Number(event.target.value))}
                />
              </label>
              <button onClick={() => setInlineEditor(null)}>
                Close editor pane
              </button>
            </div>
          )}
          <div className="community-layout">
            <aside className="community-rooms" aria-label="Conversations">
              <label>
                Find a conversation
                <input
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  placeholder="Channels or friends"
                />
              </label>
              <div className="community-actions">
                <button
                  disabled={!c.user || !c.online || c.sending}
                  onClick={() => void c.synchronize().catch(c.showError)}
                >
                  {c.sending ? "Syncing…" : "Sync messages"}
                </button>
                <span>
                  {c.pendingCount}{" "}
                  in this outbox
                </span>
              </div>
              {c.loading && <p role="status">Opening your neighbourhood…</p>}
              {!c.rooms.length && !c.loading && (
                <p>
                  No downloaded conversations yet.{" "}
                  {c.user
                    ? "Reconnect and tap Sync messages."
                    : "Sign in to load the channels."}
                </p>
              )}
              {(["public", "dm", "class"] as const).map((kind) => (
                <div key={kind}>
                  <h2>
                    {kind === "public"
                      ? "THE CHANNELS"
                      : kind === "dm"
                        ? "FRIENDS’ MESSAGES"
                        : "CLASS DISCUSSIONS"}
                  </h2>
                  {c.rooms
                    .filter(
                      (r) =>
                        r.kind === kind &&
                        roomName(r)
                          .toLowerCase()
                          .includes(roomSearch.toLowerCase()),
                    )
                    .map((room) => (
                      <button
                        className="community-room"
                        key={room.id}
                        aria-pressed={c.selected === room.id}
                        onClick={() => c.setSelected(room.id)}
                      >
                        <span aria-hidden="true">
                          {kind === "public"
                            ? "#"
                            : kind === "class"
                              ? "▣"
                              : "↗"}
                        </span>
                        <span>
                          {roomName(room)}
                          {room.locked && <small>Read-only</small>}
                        </span>
                        {c.unread[room.id] > 0 && (
                          <b
                            className="community-count"
                            aria-label={c.unread[room.id] + " unread messages"}
                          >
                            {c.unread[room.id]}
                          </b>
                        )}
                      </button>
                    ))}
                </div>
              ))}
              {c.classes
                .filter(
                  (cls) =>
                    cls.owner_id === c.user?.id &&
                    !c.rooms.some((r) => r.class_id === cls.id),
                )
                .map((cls) => (
                  <button
                    key={cls.id}
                    disabled={!c.online}
                    onClick={() =>
                      void c.action(async () => {
                        const row = await result<any>(
                          client()
                            .from("cq_community_rooms")
                            .insert({
                              id: crypto.randomUUID(),
                              name: cls.name + " discussion",
                              kind: "class",
                              class_id: cls.id,
                            })
                            .select("id")
                            .single(),
                        );
                        await c.refresh();
                        c.setSelected(row.id);
                      })
                    }
                  >
                    Start {cls.name} discussion
                  </button>
                ))}
              <p className="community-footnote">
                Desktop: drag the right edge to resize this list. On a phone,
                choose a conversation above the messages.
              </p>
            </aside>
            <div className="community-conversation">
              <header className="community-room-heading">
                <div>
                  <h2>
                    {current
                      ? roomName(current)
                      : "Your first conversation starts here."}
                  </h2>
                  <p>
                    {current?.kind === "dm"
                      ? "Only accepted friends can access this conversation."
                      : current?.kind === "class"
                        ? "For this class’s lecturer and enrolled learners."
                        : "Share ideas and useful feedback. Keep personal information private."}
                  </p>
                </div>
                {current && c.user && (
                  <div className="community-actions">
                    <button
                      disabled={!c.online}
                      onClick={() =>
                        void c.action(() =>
                          result(
                            client()
                              .from("cq_community_prefs")
                              .upsert({
                                user_id: c.user!.id,
                                room_id: c.selected,
                                read_at:
                                  c.prefs.find((p) => p.room_id === c.selected)
                                    ?.read_at || "1970-01-01T00:00:00Z",
                                muted: !c.prefs.find(
                                  (p) => p.room_id === c.selected,
                                )?.muted,
                              }),
                          ),
                        )
                      }
                    >
                      {c.prefs.find((p) => p.room_id === c.selected)?.muted
                        ? "Unmute"
                        : "Mute"}
                    </button>
                    {canManage && (
                      <button
                        disabled={!c.online}
                        onClick={() =>
                          void c.action(() =>
                            result(
                              client()
                                .from("cq_community_rooms")
                                .update({ locked: !current.locked })
                                .eq("id", current.id),
                            ),
                          )
                        }
                      >
                        {current.locked
                          ? "Unlock discussion"
                          : "Lock discussion"}
                      </button>
                    )}
                  </div>
                )}
              </header>
              <div className="community-search">
                <label>
                  Search messages
                  <input
                    value={messageSearch}
                    onChange={(e) => {
                      setMessageSearch(e.target.value);
                      setRemoteResults(null);
                    }}
                    placeholder="Search downloaded text and code"
                  />
                </label>
                <button
                  disabled={
                    !c.online || !c.user || !messageSearch.trim() || busy
                  }
                  onClick={() => void searchHistory()}
                >
                  Search history online
                </button>
                {remoteResults && (
                  <button
                    onClick={() => {
                      setRemoteResults(null);
                      setMessageSearch("");
                    }}
                  >
                    Clear search
                  </button>
                )}
              </div>
              <div
                className="community-messages"
                aria-label="Conversation messages"
                role="region"
              >
                {c.hasOlder && !remoteResults && (
                  <button
                    disabled={!c.online || busy}
                    onClick={() => void c.loadOlder().catch(c.showError)}
                  >
                    Load 50 earlier messages
                  </button>
                )}
                {!filteredMessages.length && (
                  <div className="community-empty">
                    <span aria-hidden="true">
                      {messageSearch ? "⌕" : "{ }"}
                    </span>
                    <h3>
                      {messageSearch
                        ? "No matching messages here."
                        : "Room for a good question."}
                    </h3>
                    <p>
                      {messageSearch
                        ? "Try another search, or search history when connected."
                        : "Describe what you expected, what happened, and the smallest piece of code that shows it."}
                    </p>
                  </div>
                )}
                {filteredMessages.map((m) => (
                  <article
                    key={m.id}
                    className={
                      "community-message " +
                      (m.sender_id === c.user?.id ? "is-own" : "")
                    }
                  >
                    <header>
                      <span aria-hidden="true">
                        {profileFor(m.sender_id)?.avatar || "🤖"}
                      </span>
                      <strong>
                        {profileFor(m.sender_id)?.nickname ||
                          "Community member"}
                        {m.sender_id === c.user?.id ? " · You" : ""}
                      </strong>
                      <time dateTime={m.created_at}>
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                      <small>
                        {m.state === "sent" || !m.state
                          ? "Sent"
                          : m.state === "failed"
                            ? "Needs attention"
                            : "Queued · not sent"}
                      </small>
                    </header>
                    {m.body && <p className="community-body">{m.body}</p>}
                    {m.code && (
                      <>
                        <CodePreview code={m.code} language={m.language} />
                        <div className="community-actions">
                          <span>
                            {languages.find(([id]) => id === m.language)?.[1] ||
                              m.language}
                          </span>
                          <button onClick={() => void copy(m.code)}>
                            Copy code
                          </button>
                          <button
                            onClick={() => void saveSnippet(m.code, m.language)}
                          >
                            Save code
                          </button>
                          <button
                            onClick={() => openEditor(m.code, m.language)}
                          >
                            Open in editor
                          </button>
                          <button
                            className="community-desktop-action"
                            onClick={() => openBeside(m.code, m.language)}
                          >
                            Open beside chat
                          </button>
                        </div>
                      </>
                    )}
                    {m.challenge_id && (
                      <a
                        className="community-challenge"
                        href={"#challenges/" + m.challenge_id}
                      >
                        ⚑ Coding invitation ·{" "}
                        {codeChallenges.find((q) => q.id === m.challenge_id)
                          ?.title || "Try a challenge"}{" "}
                        →
                      </a>
                    )}
                    {m.error && <p className="community-error">{m.error}</p>}
                    <div className="community-actions">
                      {m.state === "queued" || m.state === "failed" ? (
                        <>
                          <button
                            disabled={!c.online || c.sending}
                            onClick={() => void c.retry(m).catch(c.showError)}
                          >
                            Retry
                          </button>
                          <button onClick={() => setConfirmCancel(m)}>
                            Edit or cancel queued message
                          </button>
                        </>
                      ) : (
                        <>
                          {["👍", "💡", "🎉"].map((emoji) => (
                            <button
                              key={emoji}
                              aria-label={
                                "React " +
                                emoji +
                                " to message by " +
                                (profileFor(m.sender_id)?.nickname || "member")
                              }
                              aria-pressed={c.reactions.some(
                                (r) =>
                                  r.message_id === m.id &&
                                  r.user_id === c.user?.id &&
                                  r.emoji === emoji,
                              )}
                              disabled={!c.online || !c.user}
                              onClick={() => void react(m.id, emoji)}
                            >
                              {emoji}{" "}
                              {c.reactions.filter(
                                (r) =>
                                  r.message_id === m.id && r.emoji === emoji,
                              ).length || ""}
                            </button>
                          ))}
                          {c.user && m.sender_id !== c.user.id && (
                            <>
                              <button onClick={() => setReporting(m.id)}>
                                Report
                              </button>
                              <button
                                disabled={!c.online}
                                onClick={() => void block(m.sender_id)}
                              >
                                Block user
                              </button>
                            </>
                          )}
                          {(m.sender_id === c.user?.id || canManage) && (
                            <button
                              disabled={!c.online}
                              onClick={() =>
                                void c.action(() =>
                                  result(
                                    client()
                                      .from("cq_community_messages")
                                      .delete()
                                      .eq("id", m.id),
                                  ),
                                )
                              }
                            >
                              Remove message
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              {reporting && (
                <form
                  className="community-report"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void c.action(async () => {
                      await result(
                        client().from("cq_community_reports").insert({
                          reporter_id: c.user!.id,
                          message_id: reporting,
                          reason: reason.trim(),
                        }),
                      );
                      setReporting("");
                      setReason("");
                      c.setNotice(
                        "Report saved for review by the channel moderator or class owner.",
                      );
                    });
                  }}
                >
                  <h3>Report this message</h3>
                  <p>
                    The reported message is shared with the responsible
                    moderator. Other private messages are not shared.
                  </p>
                  <label>
                    What should the moderator know?
                    <textarea
                      required
                      minLength={5}
                      maxLength={500}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                  <button disabled={!c.online}>Submit report</button>
                  <button type="button" onClick={() => setReporting("")}>
                    Cancel report
                  </button>
                </form>
              )}
              {confirmCancel && (
                <div
                  className="community-report"
                  role="group"
                  aria-label="Queued message recovery"
                >
                  <p>
                    The original message stays queued until you cancel it. Copy
                    or save its contents before cancelling.
                  </p>
                  <button
                    onClick={() => {
                      void (async () => {
                        await draftWrites.current;
                        const restored = {
                          body: confirmCancel.body,
                          code: confirmCancel.code,
                          language: confirmCancel.language,
                          challenge_id: confirmCancel.challenge_id,
                        };
                        await c.store.put("draft", draftKey, restored);
                        setDraft(restored);
                        await c.cancel(confirmCancel);
                        setConfirmCancel(null);
                      })().catch(c.showError);
                    }}
                  >
                    Move back to draft
                  </button>
                  <button
                    onClick={() =>
                      void c
                        .cancel(confirmCancel)
                        .then(() => setConfirmCancel(null))
                        .catch(c.showError)
                    }
                  >
                    Discard queued message
                  </button>
                  <button onClick={() => setConfirmCancel(null)}>
                    Keep queued
                  </button>
                </div>
              )}
              <form className="community-composer" onSubmit={send}>
                <label>
                  {current
                    ? "Message " + roomName(current)
                    : "A draft for later"}
                  <textarea
                    aria-label="Community message"
                    rows={3}
                    maxLength={4000}
                    disabled={!draftReady || busy}
                    value={draft.body}
                    onChange={(e) => edit({ body: e.target.value })}
                    placeholder="What are you building? What have you tried?"
                  />
                </label>
                <div className="community-attachments">
                  <button
                    type="button"
                    aria-expanded={attachments}
                    onClick={() => setAttachments((value) => !value)}
                  >
                    Attach code or a coding challenge
                  </button>
                  {attachments && (
                    <div>
                      <label>
                        Code language
                        <select
                          disabled={!draftReady || busy}
                          value={draft.language}
                          onChange={(e) => edit({ language: e.target.value })}
                        >
                          {languages.map(([id, name]) => (
                            <option key={id} value={id}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Code snippet
                        <textarea
                          className="community-code-input"
                          aria-label="Community code snippet"
                          rows={6}
                          maxLength={12000}
                          disabled={!draftReady || busy}
                          value={draft.code}
                          onChange={(e) => edit({ code: e.target.value })}
                          spellCheck={false}
                        />
                      </label>
                      <label>
                        Challenge invitation
                        <select
                          disabled={!draftReady || busy}
                          value={draft.challenge_id || ""}
                          onChange={(e) =>
                            edit({ challenge_id: e.target.value || null })
                          }
                        >
                          <option value="">No challenge attached</option>
                          {codeChallenges.map((q) => (
                            <option value={q.id} key={q.id}>
                              {q.title} · {q.level}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                </div>
                <div className="community-actions">
                  <button
                    className="primary"
                    disabled={
                      !c.user ||
                      !own ||
                      !c.selected ||
                      !draftReady ||
                      busy ||
                      (current?.locked && !canManage)
                    }
                  >
                    {busy
                      ? "Saving…"
                      : c.online
                        ? "Send message"
                        : "Queue for reconnect"}
                  </button>
                  <button
                    type="button"
                    disabled={!draftReady}
                    onClick={() => void saveSnippet()}
                  >
                    Save code privately
                  </button>
                  <small role="status">{draftStatus}</small>
                </div>
                <p className="community-footnote">
                  {draft.body.length}/4,000 · Drafts and queued messages stay on
                  this device. Signing into another account keeps them separate.
                </p>
              </form>
            </div>
          </div>
          {inlineEditor && (
            <aside
              className="community-inline-editor"
              aria-label="Editor beside conversation"
            >
              <Suspense
                fallback={<p role="status">Opening your coding workbench…</p>}
              >
                <InlineTerminal key={inlineEditor} />
              </Suspense>
            </aside>
          )}
        </div>
      )}
      {tab === "people" && (
        <section className="community-people">
          <h2>Your people, your pace.</h2>
          <p>
            Accept a friend request to unlock private messages. Practice XP is
            self-reported learning progress.
          </p>
          <label>
            Find a Community member
            <input
              value={peopleSearch}
              onChange={(e) => {
                setPeopleSearch(e.target.value);
                peopleRequest.current++;
                setFoundPeople([]);
                setPeopleNotice("");
              }}
              placeholder="Nickname or interests"
            />
          </label>
          <button disabled={!c.online} onClick={() => void searchPeople()}>
            Search all members
          </button>
          <p aria-live="polite">{peopleNotice}</p>
          {invitations.length > 0 && (
            <section>
              <h3>Friend requests</h3>
              {invitations.map((f) => {
                const incoming = f.recipient === c.user?.id;
                const peer = incoming ? f.requester : f.recipient;
                return (
                  <article
                    key={f.requester + f.recipient}
                    className="community-person"
                  >
                    <strong>
                      {profileFor(peer)?.nickname || "Community member"}
                    </strong>
                    <span>
                      {incoming
                        ? "Wants to be your friend"
                        : "Waiting for their acceptance"}
                    </span>
                    {incoming && (
                      <button
                        disabled={!c.online}
                        onClick={() =>
                          void c.action(() =>
                            result(
                              client()
                                .from("cq_community_friends")
                                .update({ status: "accepted" })
                                .eq("requester", f.requester)
                                .eq("recipient", f.recipient),
                            ),
                          )
                        }
                      >
                        Accept request
                      </button>
                    )}
                    <button
                      disabled={!c.online}
                      onClick={() =>
                        void c.action(() =>
                          result(
                            client()
                              .from("cq_community_friends")
                              .delete()
                              .eq("requester", f.requester)
                              .eq("recipient", f.recipient),
                          ),
                        )
                      }
                    >
                      {incoming ? "Decline" : "Cancel request"}
                    </button>
                  </article>
                );
              })}
            </section>
          )}
          <h3>Friends · {accepted.length}</h3>
          {!accepted.length && (
            <p>
              No accepted friends yet. Start with a helpful conversation in a
              public channel.
            </p>
          )}
          {directory
            .filter(
              (p) =>
                connected(p.user_id) &&
                p.nickname.toLowerCase().includes(peopleSearch.toLowerCase()),
            )
            .map(person)}
          <h3>Discover builders</h3>
          {directory
            .filter(
              (p) =>
                (p.nickname + " " + p.interests)
                  .toLowerCase()
                  .includes(peopleSearch.toLowerCase()) &&
                !connected(p.user_id),
            )
            .map(person)}
          {!directory.length && (
            <p>
              No downloaded profiles yet. Sign in and sync to meet other
              builders.
            </p>
          )}
        </section>
      )}
      {tab === "notebook" && (
        <section className="community-notebook">
          <h2>Your private code notebook.</h2>
          <p>
            Saved on this device, available offline. Opening a snippet never
            runs it automatically.
          </p>
          {!saved.length && (
            <p>Save an attached snippet or your own code to keep it here.</p>
          )}
          {saved.map((item) => (
            <article key={item.id}>
              <h3>{item.title}</h3>
              <CodePreview code={item.code} language={item.language} />
              <div className="community-actions">
                <button onClick={() => void copy(item.code)}>Copy code</button>
                <button onClick={() => openEditor(item.code, item.language)}>
                  Open in editor
                </button>
                <button
                  onClick={() => {
                    setTab("channels");
                    edit({ code: item.code, language: item.language });
                  }}
                >
                  Attach to draft
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([item.code], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download =
                      "codequest-snippet." +
                      (
                        {
                          csharp: "cs",
                          javascript: "js",
                          typescript: "ts",
                          python: "py",
                          "python-turtle": "py",
                          html: "html",
                          css: "css",
                        } as Record<string, string>
                      )[item.language];
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }}
                >
                  Download snippet
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
      {tab === "privacy" && (
        <section className="community-settings">
          <form onSubmit={profile}>
            <h2>Your profile. Your boundaries.</h2>
            <p>
              Joining publishes your nickname, chosen avatar, interests and
              practice XP to signed-in Community members. Email and private code
              stay private.
            </p>
            <label>
              Community nickname
              <input
                required
                minLength={2}
                maxLength={32}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </label>
            <label>
              Coding interests
              <textarea
                maxLength={240}
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="C#, WinForms, small games…"
              />
            </label>
            <label className="community-check">
              <input
                type="checkbox"
                checked={requests}
                onChange={(e) => setRequests(e.target.checked)}
              />
              Allow friend requests
            </label>
            <label className="community-check">
              <input
                type="checkbox"
                checked={presence}
                onChange={(e) => setPresence(e.target.checked)}
              />
              Show when I’m active in Community
            </label>
            <button className="primary" disabled={!c.user || !c.online || busy}>
              {own ? "Save community profile" : "Join Community"}
            </button>
          </form>
          <section>
            <h3>Blocked users</h3>
            {!c.blocks.length && <p>Your block list is empty.</p>}
            {c.blocks.map((b) => (
              <div key={b.peer_id} className="community-person">
                <span>Blocked member · {b.peer_id.slice(0, 8)}</span>
                <button
                  disabled={!c.online}
                  onClick={() =>
                    void c.action(() =>
                      result(
                        client()
                          .from("cq_community_blocks")
                          .delete()
                          .eq("owner_id", c.user!.id)
                          .eq("peer_id", b.peer_id),
                      ),
                    )
                  }
                >
                  Unblock
                </button>
              </div>
            ))}
            <h3>Community guidelines</h3>
            <p>
              Help people understand; don’t shame beginners. Avoid spam,
              harassment and personal information. Review shared code before
              running it. Use Report for content that needs review, Block to
              stop contact, and Mute to hide unread alerts for a room.
            </p>
          </section>
        </section>
      )}
      {tab === "moderation" && (
        <section>
          <h2>Moderation inbox</h2>
          <p>
            Only reports you’re allowed to review appear here. Class owners
            manage their own discussions.
          </p>
          {!c.reports.length && <p>No open reports to review.</p>}
          {c.reports.map((r) => (
            <article key={r.id} className="community-report">
              <p>{r.reason}</p>
              {reviewed[r.id] && (
                <div className="community-message">
                  <p className="community-body">{reviewed[r.id].body}</p>
                  {reviewed[r.id].code && (
                    <CodePreview
                      code={reviewed[r.id].code}
                      language={reviewed[r.id].language}
                    />
                  )}
                  <button
                    disabled={!c.online}
                    onClick={() =>
                      void c.action(() =>
                        result(
                          client()
                            .from("cq_community_messages")
                            .delete()
                            .eq("id", r.message_id),
                        ),
                      )
                    }
                  >
                    Remove reported message
                  </button>
                </div>
              )}
              <small>{new Date(r.created_at).toLocaleString()}</small>
              <div className="community-actions">
                <button
                  onClick={() =>
                    void c.action(async () => {
                      const rows = await result<Message[]>(
                        client()
                          .from("cq_community_messages")
                          .select("*")
                          .eq("id", r.message_id),
                      );
                      if (rows[0])
                        setReviewed((previous) => ({
                          ...previous,
                          [r.id]: rows[0],
                        }));
                    })
                  }
                >
                  Review reported message
                </button>
                <button
                  onClick={() =>
                    void c.action(() =>
                      result(
                        client()
                          .from("cq_community_reports")
                          .update({ status: "resolved" })
                          .eq("id", r.id),
                      ),
                    )
                  }
                >
                  Mark resolved
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
