import type { TimelineEvent } from "../types/event";
import type { ReminderRule } from "../types/settings";

export function buildReminderSuggestions(event: TimelineEvent, rules: ReminderRule[]) {
  if (!["hard_deadline", "hidden_deadline"].includes(event.event_type)) {
    return [];
  }

  const due = new Date(event.normalized_time);
  if (Number.isNaN(due.getTime())) return [];

  return rules.map((rule) => {
    const remindAt = new Date(due.getTime() - rule.minutesBefore * 60 * 1000);
    return {
      id: `${event.id}-${rule.id}`,
      label: rule.label,
      remindAt: remindAt.toISOString(),
    };
  });
}

export async function requestBrowserNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }
  return Notification.permission;
}
