import { communityError } from "./errors.mjs";
import { supabase } from "../lib/supabase";
export type Room = {
  id: string;
  name: string;
  slug?: string;
  kind: "public" | "dm" | "class";
  class_id: string | null;
  member_a: string | null;
  member_b: string | null;
  locked: boolean;
};
export type Profile = {
  user_id: string;
  nickname: string;
  avatar: string;
  interests: string;
  xp: number;
  completed: number;
  allow_requests: boolean;
  last_seen: string;
  show_presence: boolean;
};
export type Message = {
  id: string;
  room_id: string;
  sender_id: string;
  body: string;
  code: string;
  language: string;
  challenge_id: string | null;
  created_at: string;
  state?: string;
  error?: string;
};
export type Friend = {
  requester: string;
  recipient: string;
  status: "pending" | "accepted";
};
export type Pref = { room_id: string; read_at: string; muted: boolean };
export function client() {
  if (!supabase)
    throw Error(
      "Account service is unavailable. You can still use your saved drafts and snippets.",
    );
  return supabase;
}
export async function result<T = any>(
  query: PromiseLike<{ data: unknown; error: any }>,
): Promise<T> {
  const { data, error } = await query;
  if (error) throw { ...error, message: communityError(error) };
  return data as T;
}
export async function sendMessage(owner: string, item: Message) {
  const {
    data: { session },
  } = await client().auth.getSession();
  if (session?.user.id !== owner)
    throw {
      code: "AUTH",
      message: "Sign in to the original account to send these queued messages.",
    };
  const rows = await result<Message[]>(
    client().rpc("cq_community_send", {
      client_id: item.id,
      target_room: item.room_id,
      message_body: item.body,
      message_code: item.code,
      code_language: item.language,
      challenge: item.challenge_id,
    }),
  );
  if (!rows?.length)
    throw Error(
      "Delivery was not acknowledged. The message remains in your outbox.",
    );
}
export async function listMessages(room: string, before?: Message) {
  let query = client()
    .from("cq_community_messages")
    .select("*")
    .eq("room_id", room)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(50);
  if (before)
    query = query.or(
      `created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id})`,
    );
  return result<Message[]>(query);
}
