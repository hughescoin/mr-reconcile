import {
  Client,
  isCurrentTurnBoundaryEvent,
  type ClientSessionState,
  type MessageStreamEvent,
} from "eve/client";

export const EVE_CHAT_STORAGE_KEY = "mr-reconcile-eve-chat:v1";

export interface SavedEveChat {
  events: readonly MessageStreamEvent[];
  session?: ClientSessionState;
}

interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const EMPTY_CHAT: SavedEveChat = { events: [] };

export function loadSavedEveChat(
  storage: KeyValueStorage | undefined,
): SavedEveChat {
  if (!storage) {
    return EMPTY_CHAT;
  }

  try {
    const raw = storage.getItem(EVE_CHAT_STORAGE_KEY);

    if (!raw) {
      return EMPTY_CHAT;
    }

    const parsed = JSON.parse(raw) as unknown;

    return isSavedEveChat(parsed) ? parsed : EMPTY_CHAT;
  } catch {
    return EMPTY_CHAT;
  }
}

export function saveEveChat(
  storage: KeyValueStorage | undefined,
  chat: SavedEveChat,
) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(EVE_CHAT_STORAGE_KEY, JSON.stringify(chat));
  } catch {
    // A storage failure must not break the active reconciliation session.
  }
}

export async function resumeSavedEveChat(
  storage: KeyValueStorage | undefined,
  chat: SavedEveChat,
): Promise<SavedEveChat> {
  const lastEvent = chat.events.at(-1);

  if (
    !chat.session ||
    (lastEvent !== undefined && isCurrentTurnBoundaryEvent(lastEvent))
  ) {
    return chat;
  }

  try {
    const client = new Client({ host: "" });
    const session = client.sessions.attach(chat.session.sessionId, {
      streamIndex: chat.session.streamIndex,
    });
    const events = [...chat.events];
    const eventIds = new Set(events.map((event) => event.meta.id));

    for await (const event of session.stream()) {
      if (!eventIds.has(event.meta.id)) {
        eventIds.add(event.meta.id);
        events.push(event);
      }

      saveEveChat(storage, {
        events,
        session: session.state,
      });

      if (isCurrentTurnBoundaryEvent(event)) {
        break;
      }
    }

    const resumed = {
      events,
      session: session.state,
    };

    saveEveChat(storage, resumed);
    return resumed;
  } catch {
    // Render the last durable prefix even when catch-up is temporarily offline.
    return chat;
  }
}

function isSavedEveChat(value: unknown): value is SavedEveChat {
  if (!isRecord(value) || !Array.isArray(value.events)) {
    return false;
  }

  if (!value.events.every(isMessageStreamEvent)) {
    return false;
  }

  if (value.session === undefined) {
    return true;
  }

  return (
    isRecord(value.session) &&
    typeof value.session.sessionId === "string" &&
    value.session.sessionId.length > 0 &&
    Number.isInteger(value.session.streamIndex) &&
    typeof value.session.streamIndex === "number" &&
    value.session.streamIndex >= 0
  );
}

function isMessageStreamEvent(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.type === "string" &&
    isRecord(value.meta) &&
    typeof value.meta.id === "string" &&
    typeof value.meta.at === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
