// Private caches are partitioned by account. No conversation is cached by the service worker.
export class CommunityStore {
  constructor(owner, indexedDB = globalThis.indexedDB) {
    this.owner = owner || "guest";
    this.indexedDB = indexedDB;
  }
  async db() {
    if (!this.indexedDB)
      throw Error(
        "Offline storage is unavailable. Enable browser storage before composing messages.",
      );
    if (!this.connection)
      this.connection = new Promise((resolve, reject) => {
        const request = this.indexedDB.open("codequest-community-v1", 2);
        request.onupgradeneeded = () => {
          const records = request.result.objectStoreNames.contains("records")
            ? request.transaction.objectStore("records")
            : request.result.createObjectStore("records", { keyPath: "id" });
          if (!records.indexNames.contains("by-owner-kind"))
            records.createIndex("by-owner-kind", ["owner", "kind"]);
        };
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => {
            db.close();
            this.connection = null;
          };
          resolve(db);
        };
        request.onerror = () => {
          this.connection = null;
          reject(
            Error(
              "Community storage could not open. Your message has not been sent.",
            ),
          );
        };
        request.onblocked = () => {
          this.connection = null;
          reject(
            Error(
              "Close other CodeQuest tabs, then reload to upgrade offline storage.",
            ),
          );
        };
      });
    return this.connection;
  }
  id(kind, key) {
    return JSON.stringify([this.owner, kind, key]);
  }
  async get(kind, key) {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const req = db
        .transaction("records")
        .objectStore("records")
        .get(this.id(kind, key));
      req.onsuccess = () => resolve(req.result?.value);
      req.onerror = () => reject(req.error);
    });
  }
  async list(kind) {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const req = db
        .transaction("records")
        .objectStore("records")
        .index("by-owner-kind")
        .getAll([this.owner, kind]);
      req.onsuccess = () =>
        resolve(
          req.result
            .filter((row) => row.owner === this.owner && row.kind === kind)
            .map((row) => row.value),
        );
      req.onerror = () => reject(req.error);
    });
  }
  async put(kind, key, value) {
    return this.write((store) =>
      store.put({
        id: this.id(kind, key),
        owner: this.owner,
        kind,
        key,
        value,
      }),
    );
  }
  async remove(kind, key) {
    return this.write((store) => store.delete(this.id(kind, key)));
  }
  async write(action) {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("records", "readwrite");
      action(tx.objectStore("records"));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () =>
        reject(
          Error("Storage is full or unavailable. Your message was not saved."),
        );
    });
  }
}
const flushing = new Map();
export function flushOutbox(store, send, onChange = (_item, _failed) => {}) {
  if (flushing.has(store.owner)) return flushing.get(store.owner);
  const work = (async () => {
    const queue = (await store.list("outbox")).sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    );
    for (const item of queue) {
      if (item.state === "failed") continue;
      try {
        await send(item);
        await store.remove("outbox", item.id);
        onChange(item, null);
      } catch (error) {
        const code = error?.code || "";
        const permanent = /42501|23514|23503|22023|P0001/.test(code);
        const failed = {
          ...item,
          state: permanent ? "failed" : "queued",
          error: error?.message || "Waiting to reconnect.",
        };
        await store.put("outbox", item.id, failed);
        onChange(item, failed);
        // Network/auth/rate-limit failures pause the queue; no silent drops or retry storms.
        if (!permanent) break;
      }
    }
  })().finally(() => flushing.delete(store.owner));
  flushing.set(store.owner, work);
  return work;
}
export function mergeMessages(server, pending) {
  const map = new Map(pending.map((item) => [item.id, item]));
  for (const row of server) map.set(row.id, { ...row, state: "sent" });
  return [...map.values()].sort(
    (a, b) =>
      a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  );
}
export function validateMessage(message) {
  if (!message.body.trim() && !message.code.trim() && !message.challenge_id)
    throw Error(
      "Write a message, attach code or invite someone to a challenge.",
    );
  if (message.body.length > 4000 || message.code.length > 12000)
    throw Error(
      "Keep messages under 4,000 characters and code under 12,000 characters.",
    );
  if (
    ![
      "javascript",
      "typescript",
      "html",
      "css",
      "python",
      "python-turtle",
      "csharp",
    ].includes(message.language)
  )
    throw Error("Choose a supported code language.");
}
