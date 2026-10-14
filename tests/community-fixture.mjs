import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
export const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222",
  C = "33333333-3333-4333-8333-333333333333";
const jwt = (id) =>
  `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated", aud: "authenticated" })).toString("base64url")}.test-fixture`;
const actor = (token) => {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString())
      .sub;
  } catch {
    return null;
  }
};
function split(value) {
  let depth = 0,
    start = 0,
    result = [];
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "(") depth++;
    if (value[i] === ")") depth--;
    if (value[i] === "," && depth === 0) {
      result.push(value.slice(start, i));
      start = i + 1;
    }
  }
  result.push(value.slice(start));
  return result;
}
export async function fixture() {
  const db = new PGlite();
  let chain = Promise.resolve();
  const serial = (fn) => {
    const next = chain.catch(() => {}).then(fn);
    chain = next;
    return next;
  };
  await db.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${A}'),('${B}'),('${C}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`,
  );
  for (const file of [
    "20261007141701_codequest_accounts_classes.sql",
    "20261014052709_codequest_community.sql",
  ])
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/" + file, import.meta.url),
        "utf8",
      ),
    );
  await db.exec(
    `insert into public.cq_community_profiles(user_id,nickname,allow_requests) values('${A}','Ada the builder',true),('${B}','Bayo the builder',true),('${C}','Curious outsider',true);`,
  );
  const subscribers = [];
  const wire = (msg) =>
    JSON.stringify([
      msg.join_ref ?? null,
      msg.ref ?? null,
      msg.topic,
      msg.event,
      msg.payload,
    ]);
  async function as(id, sql, args = []) {
    await db.exec(
      `reset role;set role ${id ? "authenticated" : "anon"};set request.jwt.claim.sub='${id || ""}';`,
    );
    return db.query(sql, args);
  }
  async function notify(table, row, type = "INSERT") {
    for (const sub of subscribers) {
      const conf = sub.config.find((c) => c.table === table);
      if (!conf) continue;
      let allowed = false;
      try {
        allowed =
          (
            await as(
              sub.actor,
              `select * from public.${table} where ${table === "cq_community_friends" ? "requester=$1 and recipient=$2" : "id=$1"}`,
              table === "cq_community_friends"
                ? [row.requester, row.recipient]
                : [row.id],
            )
          ).rows.length > 0;
      } catch {}
      if (allowed)
        sub.ws.send(
          wire({
            topic: sub.topic,
            event: "postgres_changes",
            payload: {
              ids: [conf.id],
              data: {
                schema: "public",
                table,
                commit_timestamp: new Date().toISOString(),
                type,
                record: row,
                columns: [],
                old_record: {},
                errors: null,
              },
            },
            ref: null,
          }),
        );
    }
  }
  async function attach(page) {
    await page.routeWebSocket("**/realtime/v1/websocket**", (ws) => {
      let sub;
      ws.onMessage((raw) => {
        const decoded = JSON.parse(String(raw));
        const msg = Array.isArray(decoded)
          ? {
              join_ref: decoded[0],
              ref: decoded[1],
              topic: decoded[2],
              event: decoded[3],
              payload: decoded[4],
            }
          : decoded;
        if (msg.event === "phx_join") {
          sub = {
            ws,
            topic: msg.topic,
            actor: actor(msg.payload.access_token),
            config: (msg.payload.config?.postgres_changes || []).map(
              (c, i) => ({ ...c, id: i + 1 }),
            ),
          };
          subscribers.push(sub);
          ws.send(
            wire({
              topic: msg.topic,
              event: "phx_reply",
              payload: {
                status: "ok",
                response: { postgres_changes: sub.config },
              },
              ref: msg.ref,
            }),
          );
        } else if (msg.event === "heartbeat") {
          ws.send(
            wire({
              topic: msg.topic,
              event: "phx_reply",
              payload: { status: "ok", response: {} },
              ref: msg.ref,
            }),
          );
        } else if (msg.event === "access_token" && sub)
          sub.actor = actor(msg.payload.access_token);
        else if (msg.event === "phx_leave") {
          const i = subscribers.indexOf(sub);
          if (i >= 0) subscribers.splice(i, 1);
          ws.send(
            wire({
              topic: msg.topic,
              event: "phx_reply",
              payload: { status: "ok", response: {} },
              ref: msg.ref,
            }),
          );
        }
      });
      ws.onClose(() => {
        const i = subscribers.indexOf(sub);
        if (i >= 0) subscribers.splice(i, 1);
      });
    });
    await page.route("**/auth/v1/**", async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      const body = request.postData() ? request.postDataJSON() : {};
      const id = url.pathname.endsWith("/token")
        ? body.email?.startsWith("b")
          ? B
          : body.email?.startsWith("c")
            ? C
            : A
        : actor(request.headers().authorization?.replace("Bearer ", ""));
      const user = {
        id,
        email: (id === B ? "b" : id === C ? "c" : "a") + "@community.test",
        aud: "authenticated",
        role: "authenticated",
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: {},
        created_at: new Date().toISOString(),
      };
      const data = url.pathname.endsWith("/token")
        ? {
            access_token: jwt(id),
            refresh_token: "test-only-" + id,
            token_type: "bearer",
            expires_in: 3600,
            user,
          }
        : url.pathname.endsWith("/logout")
          ? {}
          : user;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    });
    await page.route("**/rest/v1/**", async (route) => {
      const request = route.request(),
        url = new URL(request.url()),
        body = request.postData() ? request.postDataJSON() : null;
      const id = actor(request.headers().authorization?.replace("Bearer ", ""));
      const table = url.pathname.split("/").pop();
      if (!/^cq_community_|^cq_classes$/.test(table)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "[]",
        });
        return;
      }
      await serial(async () => {
        try {
          let rows = [];
          const params = [];
          const bind = (value) => {
            params.push(value);
            return "$" + params.length;
          };
          const ident = (value) => {
            if (!/^[a-z_]+$/.test(value))
              throw Error("Invalid test identifier");
            return '"' + value + '"';
          };
          function filter(expression) {
            if (expression.startsWith("and(") || expression.startsWith("or(")) {
              const and = expression.startsWith("and(");
              return (
                "(" +
                split(expression.slice(and ? 4 : 3, -1))
                  .map(filter)
                  .join(and ? " and " : " or ") +
                ")"
              );
            }
            const match = /^([a-z_]+)\.(eq|neq|lt|ilike|in)\.(.*)$/.exec(
              expression,
            );
            if (!match) throw Error("Unsupported test filter: " + expression);
            const [, key, op, value] = match;
            if (op === "in")
              return (
                ident(key) +
                " in (" +
                split(value.slice(1, -1))
                  .map((v) => bind(v.replace(/^"|"$/g, "")))
                  .join(",") +
                ")"
              );
            return (
              ident(key) +
              { eq: "=", neq: "<>", lt: "<", ilike: " ilike " }[op] +
              bind(value)
            );
          }
          const filters = [...url.searchParams]
            .filter(
              ([key]) =>
                ![
                  "select",
                  "order",
                  "limit",
                  "offset",
                  "on_conflict",
                  "columns",
                ].includes(key),
            )
            .map(([key, value]) =>
              key === "or"
                ? "(" + split(value.slice(1, -1)).map(filter).join(" or ") + ")"
                : filter(key + "." + value),
            );
          const where = filters.length ? " where " + filters.join(" and ") : "";
          if (url.pathname.includes("/rpc/")) {
            const names = Object.keys(body || {});
            const sql = `select * from public.${ident(table)}(${names.map((name) => ident(name) + "=>" + bind(body[name])).join(",")})`;
            rows = (await as(id, sql, params)).rows;
            // SQL scalar functions return a field named after the function; PostgREST unwraps it.
            if (
              ["cq_community_dm", "cq_community_is_moderator"].includes(table)
            ) {
              const value = rows[0]?.[table];
              await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(value),
              });
              return;
            }
            if (table === "cq_community_send" && rows[0])
              await notify("cq_community_messages", rows[0]);
          } else if (
            request.method() === "GET" ||
            request.method() === "HEAD"
          ) {
            const columns = url.searchParams.get("select") || "*";
            const selection =
              columns === "*" ? "*" : columns.split(",").map(ident).join(",");
            const order = url.searchParams.get("order");
            const orderSQL = order
              ? " order by " +
                order
                  .split(",")
                  .map((item) => {
                    const [col, dir] = item.split(".");
                    return ident(col) + (dir === "desc" ? " desc" : " asc");
                  })
                  .join(",")
              : "";
            const limit = Math.min(
                Number(url.searchParams.get("limit") || 1000),
                1000,
              ),
              offset = Number(url.searchParams.get("offset") || 0);
            rows = (
              await as(
                id,
                `select ${selection} from public.${ident(table)}${where}${orderSQL} limit ${limit} offset ${offset}`,
                params,
              )
            ).rows;
          } else if (request.method() === "POST") {
            const values = Array.isArray(body) ? body[0] : body;
            const keys = Object.keys(values);
            const columns = keys.map(ident).join(",");
            const placeholders = keys.map((k) => bind(values[k])).join(",");
            const conflicts =
              url.searchParams.get("on_conflict") ||
              {
                cq_community_profiles: "user_id",
                cq_community_prefs: "user_id,room_id",
                cq_community_blocks: "owner_id,peer_id",
              }[table];
            const prefer = request.headers().prefer || "";
            const conflict = prefer.includes("resolution=")
              ? ` on conflict(${conflicts.split(",").map(ident).join(",")}) ` +
                (prefer.includes("ignore-duplicates")
                  ? "do nothing"
                  : "do update set " +
                    keys
                      .map((k) => ident(k) + "=excluded." + ident(k))
                      .join(","))
              : "";
            rows = (
              await as(
                id,
                `insert into public.${ident(table)}(${columns}) values(${placeholders})${conflict} returning *`,
                params,
              )
            ).rows;
            if (
              rows[0] &&
              ["cq_community_friends", "cq_community_rooms"].includes(table)
            )
              await notify(table, rows[0]);
          } else if (request.method() === "PATCH") {
            const sets = Object.keys(body)
              .map((key) => ident(key) + "=" + bind(body[key]))
              .join(",");
            rows = (
              await as(
                id,
                `update public.${ident(table)} set ${sets}${where} returning *`,
                params,
              )
            ).rows;
            if (rows[0] && table === "cq_community_friends")
              await notify(table, rows[0], "UPDATE");
          } else if (request.method() === "DELETE")
            rows = (
              await as(
                id,
                `delete from public.${ident(table)}${where} returning *`,
                params,
              )
            ).rows;
          const single = (request.headers().accept || "").includes(
            "vnd.pgrst.object",
          );
          const response = single ? rows[0] || null : rows;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(response),
          });
        } catch (error) {
          await route.fulfill({
            status: error.code === "42501" ? 403 : 400,
            contentType: "application/json",
            body: JSON.stringify({
              code: error.code || "TEST_API",
              message: error.message,
              details: error.detail,
            }),
          });
        }
      });
    });
  }
  return {
    db,
    attach,
    close: () => db.close(),
    as: (...args) => serial(() => as(...args)),
  };
}
