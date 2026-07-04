import type { TimelineEvent } from "../types/event";
import { defaultSettings, type AppSettings } from "../types/settings";

const EVENTS_KEY = "timedesk.events.v1";
const SETTINGS_KEY = "timedesk.settings.v1";

export function loadEvents(): TimelineEvent[] {
  return readJson<TimelineEvent[]>(EVENTS_KEY, []);
}

export function saveEvents(events: TimelineEvent[]) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export function loadSettings(): AppSettings {
  return {
    ...defaultSettings,
    ...readJson<Partial<AppSettings>>(SETTINGS_KEY, {}),
  };
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function readJson<T>(key: string, fallback: T): T {
  const value = localStorage.getItem(key);
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
