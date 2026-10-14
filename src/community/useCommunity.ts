import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { communityError } from "./errors.mjs";
import { useAuth } from "../components/AuthProvider";
import {
  CommunityStore,
  flushOutbox,
  mergeMessages,
  validateMessage,
} from "./store.mjs";
import {
  client,
  result,
  listMessages,
  sendMessage,
  type Room,
  type Message,
  type Profile,
  type Friend,
  type Pref,
} from "./api";
export function useCommunity() {
  const { user } = useAuth();
  const owner = user?.id || "guest";
  const store = useMemo(() => new CommunityStore(owner), [owner]);
  const [online, setOnline] = useState(navigator.onLine),
    [notice, setNotice] = useState(""),
    [loading, setLoading] = useState(true),
    [sending, setSending] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]),
    [profiles, setProfiles] = useState<Profile[]>([]),
    [friends, setFriends] = useState<Friend[]>([]),
    [blocks, setBlocks] = useState<{ peer_id: string }[]>([]),
    [prefs, setPrefs] = useState<Pref[]>([]);
  const [classes, setClasses] = useState<any[]>([]),
    [reports, setReports] = useState<any[]>([]),
    [unread, setUnread] = useState<Record<string, number>>({}),
    [isModerator, setIsModerator] = useState(false);
  const [selected, setSelected] = useState(""),
    [messages, setMessages] = useState<Message[]>([]),
    [pending, setPending] = useState<Message[]>([]),
    [reactions, setReactions] = useState<any[]>([]),
    [hasOlder, setHasOlder] = useState(false);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const epoch = useRef(0),
    loadSeq = useRef(0),
    active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      epoch.current++;
    };
  }, []);
  const showError = useCallback((e: any) => {
    if (active.current) setNotice(communityError(e));
  }, []);
  const reloadOutbox = useCallback(async () => {
    const rows = (await store.list("outbox")) as Message[];
    if (active.current) setPending(rows);
  }, [store]);
  const refresh = useCallback(async () => {
    if (!user || !navigator.onLine) return;
    const version = epoch.current;
    const [r, p, f, b, settings, c, u, rep, mod, me] = await Promise.all([
      result<Room[]>(
        client()
          .from("cq_community_rooms")
          .select("*")
          .order("name")
          .limit(200),
      ),
      result<Profile[]>(
        client()
          .from("cq_community_profiles")
          .select("*")
          .order("nickname")
          .limit(200),
      ),
      result<Friend[]>(client().from("cq_community_friends").select("*")),
      result<any[]>(client().from("cq_community_blocks").select("peer_id")),
      result<Pref[]>(client().from("cq_community_prefs").select("*")),
      result<any[]>(client().from("cq_classes").select("id,name,owner_id")),
      result<any[]>(client().rpc("cq_community_unread")),
      result<any[]>(
        client()
          .from("cq_community_reports")
          .select("*")
          .eq("status", "open")
          .order("created_at")
          .limit(50),
      ),
      result<boolean>(client().rpc("cq_community_is_moderator")),
      result<Profile[]>(
        client()
          .from("cq_community_profiles")
          .select("*")
          .eq("user_id", user.id),
      ),
    ]);
    if (!active.current || version !== epoch.current) return;
    setRooms(r);
    const knownProfiles = [
      ...new Map(
        [...p, ...me].map((profile) => [profile.user_id, profile]),
      ).values(),
    ];
    setProfiles(knownProfiles);
    setFriends(f);
    setBlocks(b);
    setPrefs(settings);
    setClasses(c);
    setReports(rep);
    setIsModerator(mod);
    setUnread(Object.fromEntries(u.map((x) => [x.room_id, Number(x.unread)])));
    const snapshot = {
      rooms: r,
      profiles: knownProfiles,
      friends: f,
      blocks: b,
      prefs: settings,
      classes: c,
    };
    await store.put("meta", "snapshot", snapshot);
    setSelected((old) =>
      r.some((room) => room.id === old)
        ? old
        : r.find((room) => room.slug === "general")?.id || r[0]?.id || "",
    );
  }, [user?.id, store]);
  const markRead = useCallback(
    async (room: string, at: string) => {
      if (!user || !navigator.onLine) return;
      const preference = prefs.find((p) => p.room_id === room);
      await result(
        client()
          .from("cq_community_prefs")
          .upsert({
            user_id: user.id,
            room_id: room,
            read_at: at,
            muted: preference?.muted || false,
          }),
      );
      if (active.current) setUnread((old) => ({ ...old, [room]: 0 }));
    },
    [user?.id, prefs],
  );
  const loadMessages = useCallback(
    async (room: string, older = false) => {
      if (!room || !user || !navigator.onLine) return;
      const sequence = ++loadSeq.current;
      const version = epoch.current;
      const cursor = older ? messages[0] : undefined;
      const rows = await listMessages(room, cursor);
      if (
        !active.current ||
        version !== epoch.current ||
        room !== selectedRef.current ||
        sequence !== loadSeq.current
      )
        return;
      setHasOlder(rows.length === 50);
      // Replace the latest page so deletions and changed permissions disappear locally too.
      const merged = older
        ? mergeMessages(rows, messages)
        : rows.slice().reverse();
      setMessages(merged);
      await store.put("messages", room, merged);
      const ids = merged.map((m: Message) => m.id);
      const reactions = ids.length
        ? await result<any[]>(
            client()
              .from("cq_community_reactions")
              .select("*")
              .in("message_id", ids),
          )
        : [];
      if (
        active.current &&
        room === selectedRef.current &&
        sequence === loadSeq.current
      )
        setReactions(reactions);
      const latest = rows[0]?.created_at;
      if (!older && latest && document.visibilityState === "visible")
        await markRead(room, latest);
    },
    [user?.id, store, messages, markRead],
  );
  const latestLoad = useRef(loadMessages);
  latestLoad.current = loadMessages;
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const synchronize = useCallback(async () => {
    if (!user || !navigator.onLine) return;
    setSending(true);
    try {
      let delivered = 0;
      await flushOutbox(
        store,
        (item: Message) => sendMessage(owner, item),
        (_item: Message, failed: Message | null) => {
          if (!failed) delivered++;
          else if (active.current)
            setNotice(failed.error || "A queued message needs attention.");
          void reloadOutbox().catch(showError);
        },
      );
      await reloadOutbox();
      await refreshRef.current();
      if (selectedRef.current) await latestLoad.current(selectedRef.current);
      if (delivered && active.current)
        setNotice(
          delivered === 1
            ? "Message delivered."
            : `${delivered} messages delivered.`,
        );
    } finally {
      if (active.current) setSending(false);
    }
  }, [user?.id, owner, store, reloadOutbox, showError]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snapshot: any = await store.get("meta", "snapshot");
        const lastRoom: any = await store.get("meta", "last-room");
        if (cancelled) return;
        if (snapshot) {
          setRooms(snapshot.rooms || []);
          setProfiles(snapshot.profiles || []);
          setFriends(snapshot.friends || []);
          setBlocks(snapshot.blocks || []);
          setPrefs(snapshot.prefs || []);
          setClasses(snapshot.classes || []);
          setSelected(
            snapshot.rooms?.some((room: Room) => room.id === lastRoom)
              ? lastRoom
              : snapshot.rooms?.[0]?.id || "",
          );
        }
        await reloadOutbox();
        await refreshRef.current();
        await synchronize();
      } catch (e) {
        showError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);
  useEffect(() => {
    const connect = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) void synchronize().catch(showError);
    };
    window.addEventListener("online", connect);
    window.addEventListener("offline", connect);
    const tick = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine)
        void synchronize().catch(showError);
    }, 15000);
    return () => {
      window.removeEventListener("online", connect);
      window.removeEventListener("offline", connect);
      clearInterval(tick);
    };
  }, [synchronize, showError]);
  useEffect(() => {
    setMessages([]);
    setReactions([]);
    setHasOlder(false);
    loadSeq.current++;
    if (!selected) return;
    void store.put("meta", "last-room", selected).catch(showError);
    let cancelled = false;
    store
      .get("messages", selected)
      .then((cached: any) => {
        if (!cancelled && cached) setMessages(cached);
      })
      .then(() => {
        if (!cancelled) return latestLoad.current(selected);
      })
      .catch(showError);
    return () => {
      cancelled = true;
    };
  }, [selected, store]);
  useEffect(() => {
    if (!user) return;
    const channel = client()
      .channel("cq-community:" + user.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cq_community_messages" },
        () => {
          if (selectedRef.current)
            void latestLoad.current(selectedRef.current).catch(showError);
          void refreshRef.current().catch(showError);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cq_community_reactions" },
        () => {
          if (selectedRef.current)
            void latestLoad.current(selectedRef.current).catch(showError);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cq_community_friends" },
        () => void refreshRef.current().catch(showError),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cq_community_rooms" },
        () => void refreshRef.current().catch(showError),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void synchronize().catch(showError);
      });
    return () => {
      void client().removeChannel(channel);
    };
  }, [user?.id, synchronize, showError]);
  async function queue(draft: {
    body: string;
    code: string;
    language: string;
    challenge_id: string | null;
  }) {
    if (!user)
      throw Error(
        "Sign in before sending. Your draft can be saved on this device.",
      );
    if (!selected) throw Error("Choose a conversation first.");
    validateMessage(draft);
    const item: Message = {
      ...draft,
      id: crypto.randomUUID(),
      room_id: selected,
      sender_id: user.id,
      created_at: new Date().toISOString(),
      state: "queued",
    };
    await store.put("outbox", item.id, item);
    await reloadOutbox();
    setNotice(
      navigator.onLine
        ? "Saved to outbox. Sending when the server acknowledges delivery."
        : "Saved offline. It will send when you reconnect with this account.",
    );
    void synchronize().catch(showError);
  }
  async function retry(item: Message) {
    await store.put("outbox", item.id, { ...item, state: "queued", error: "" });
    await reloadOutbox();
    await synchronize();
  }
  async function cancel(item: Message) {
    await store.remove("outbox", item.id);
    await reloadOutbox();
  }
  async function action(fn: () => Promise<unknown>) {
    try {
      await fn();
      await refresh();
      if (selectedRef.current) await latestLoad.current(selectedRef.current);
    } catch (e) {
      showError(e);
    }
  }
  const visible = mergeMessages(
    messages,
    pending.filter((m) => m.room_id === selected),
  ).filter((m: Message) => !blocks.some((b) => b.peer_id === m.sender_id));
  return {
    user,
    owner,
    store,
    online,
    notice,
    setNotice,
    loading,
    sending,
    rooms,
    profiles,
    friends,
    blocks,
    prefs,
    classes,
    reports,
    unread,
    isModerator,
    selected,
    setSelected,
    messages: visible,
    reactions,
    hasOlder,
    refresh,
    showError,
    queue,
    retry,
    cancel,
    action,
    synchronize,
    loadOlder: () => loadMessages(selected, true),
  };
}
