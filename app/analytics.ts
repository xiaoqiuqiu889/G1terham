export const gameEventNames = [
  "scene_enter",
  "interaction_start",
  "interaction_complete",
  "clue_discovered",
  "memory_value_change",
  "collectible_get",
  "paid_dialogue_impression",
  "paid_dialogue_unlock_click",
  "paid_dialogue_skip",
  "paid_dialogue_complete",
  "chapter_pack_impression",
  "chapter_pack_click",
  "full_pass_impression",
  "full_pass_click",
  "chapter_reward_reveal",
  "chapter_reward_claim",
  "chapter_complete",
  "next_chapter_start",
  "save_resume",
  "ending_complete",
  "revisit_start",
  "return_teaser_click",
] as const;

export type GameEventName = (typeof gameEventNames)[number];
export type GameEventPayload = Record<string, string | number | boolean | null | undefined>;
export type GameEvent = {
  name: GameEventName;
  eventId: string;
  timestamp: number;
  sessionId: string;
  simulated: true;
  payload: GameEventPayload;
};

const LOG_KEY = "revolution-street-events-v6";
const SESSION_KEY = "revolution-street-session-v6";
const seen = new Set<string>();

function sessionId() {
  if (typeof window === "undefined") return "server";
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
  sessionStorage.setItem(SESSION_KEY, created);
  return created;
}

export function trackEvent(name: GameEventName, payload: GameEventPayload = {}, dedupeKey?: string): GameEvent | null {
  if (typeof window === "undefined") return null;
  const key = dedupeKey ? name + ":" + dedupeKey : "";
  if (key && seen.has(key)) return null;
  if (key) seen.add(key);
  const event: GameEvent = {
    name,
    eventId: crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2),
    timestamp: Date.now(),
    sessionId: sessionId(),
    simulated: true,
    payload,
  };
  try {
    const previous = JSON.parse(localStorage.getItem(LOG_KEY) || "[]") as GameEvent[];
    localStorage.setItem(LOG_KEY, JSON.stringify([...previous.slice(-199), event]));
  } catch {
    // Analytics must never interrupt the story.
  }
  console.info("[RevolutionStreet:event]", event);
  window.dispatchEvent(new CustomEvent("revolution-street:event", { detail: event }));
  return event;
}

export function readLocalEventLog(): GameEvent[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || "[]") as GameEvent[]; }
  catch { return []; }
}
