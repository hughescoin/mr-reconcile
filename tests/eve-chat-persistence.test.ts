import assert from "node:assert/strict";
import { test } from "node:test";

import type { MessageStreamEvent } from "eve/client";

import {
  EVE_CHAT_STORAGE_KEY,
  loadSavedEveChat,
  saveEveChat,
} from "../lib/eve-chat-persistence";

class MemoryStorage {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const event = {
  type: "session.waiting",
  data: {},
  meta: {
    at: "2026-08-22T16:00:00.000Z",
    id: "evt_durable",
  },
} as MessageStreamEvent;

test("round-trips the Eve event prefix and session cursor", () => {
  const storage = new MemoryStorage();
  const saved = {
    events: [event],
    session: {
      sessionId: "wrun_durable",
      streamIndex: 42,
    },
  };

  saveEveChat(storage, saved);

  assert.deepEqual(loadSavedEveChat(storage), saved);
});

test("ignores corrupt or incompatible saved chat state", () => {
  const storage = new MemoryStorage();

  storage.setItem(EVE_CHAT_STORAGE_KEY, "not-json");
  assert.deepEqual(loadSavedEveChat(storage), { events: [] });

  storage.setItem(
    EVE_CHAT_STORAGE_KEY,
    JSON.stringify({
      events: [{ type: "session.waiting" }],
      session: { sessionId: "", streamIndex: -1 },
    }),
  );
  assert.deepEqual(loadSavedEveChat(storage), { events: [] });
});

test("treats storage failures as non-fatal", () => {
  const storage = {
    getItem() {
      throw new Error("unavailable");
    },
    setItem() {
      throw new Error("quota exceeded");
    },
  };

  assert.deepEqual(loadSavedEveChat(storage), { events: [] });
  assert.doesNotThrow(() => saveEveChat(storage, { events: [] }));
});
