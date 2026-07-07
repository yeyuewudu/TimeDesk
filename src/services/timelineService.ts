import type { RiskLevel } from "../types/analysis";
import type { TimelineEvent, TimelineGroup } from "../types/event";

const riskWeight: Record<RiskLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const typeWeight: Record<TimelineEvent["event_type"], number> = {
  hidden_deadline: 5,
  hard_deadline: 4,
  checkpoint: 3,
  preparation: 2,
  reminder: 1,
};

export function sortEvents(events: TimelineEvent[]) {
  return [...events].sort((a, b) => {
    const aTime = getEventTime(a);
    const bTime = getEventTime(b);
    const timeDiff = aTime - bTime;
    if (timeDiff !== 0) return timeDiff;
    const riskDiff = riskWeight[b.risk_level] - riskWeight[a.risk_level];
    if (riskDiff !== 0) return riskDiff;
    return typeWeight[b.event_type] - typeWeight[a.event_type];
  });
}

export function groupEventsByDate(events: TimelineEvent[], now = new Date()): TimelineGroup[] {
  const dateGroups = new Map<string, TimelineEvent[]>();
  const needsReview: TimelineEvent[] = [];

  for (const event of sortEvents(events.filter((item) => item.status !== "deleted"))) {
    const date = new Date(event.normalized_time);
    if (needsTimeReview(event, date)) {
      needsReview.push(event);
      continue;
    }

    const key = getDateKey(date);
    dateGroups.set(key, [...(dateGroups.get(key) ?? []), event]);
  }

  const timelineGroups = [...dateGroups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map<TimelineGroup>(([key, groupEvents]) => {
      const date = new Date(groupEvents[0].normalized_time);
      return {
        key,
        kind: "date",
        title: key,
        subtitle: formatDateSubtitle(date, now),
        events: groupEvents,
      };
    });

  if (needsReview.length > 0) {
    return [
      {
        key: "needs-review",
        kind: "needsReview",
        title: "需要确认时间",
        subtitle: `${needsReview.length} 个节点`,
        events: needsReview,
      },
      ...timelineGroups,
    ];
  }

  return timelineGroups;
}

export function getRiskSummary(events: TimelineEvent[]) {
  const visible = events.filter((event) => event.status !== "deleted");
  const active = visible.filter((event) => event.status === "active");
  const needsReview = active.filter((event) =>
    needsTimeReview(event, new Date(event.normalized_time)),
  ).length;

  return {
    total: visible.length,
    active: active.length,
    completed: visible.length - active.length,
    needsReview,
  };
}

export function formatEventDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatEventTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "待定";
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDateSubtitle(date: Date, now: Date) {
  const weekday = new Intl.DateTimeFormat("zh-CN", {
    weekday: "short",
  }).format(date);
  const relative = getRelativeDayLabel(date, now);
  return relative ? `${weekday} · ${relative}` : weekday;
}

function getRelativeDayLabel(date: Date, now: Date) {
  const startToday = startOfDay(now);
  const startTomorrow = addDays(startToday, 1);
  const dayDiff = Math.round((startOfDay(date).getTime() - startToday.getTime()) / 86_400_000);

  if (dayDiff === 0) return "今天";
  if (dayDiff === 1) return "明天";
  if (dayDiff === 2) return "后天";
  if (dayDiff > 2 && dayDiff < 7) return `${dayDiff} 天后`;
  if (dayDiff === -1) return "昨天";
  if (dayDiff < -1 && dayDiff > -7) return `${Math.abs(dayDiff)} 天前`;
  if (startOfDay(date).getTime() === startTomorrow.getTime()) return "明天";
  return "";
}

function needsTimeReview(event: TimelineEvent, date: Date) {
  return (
    event.time_granularity === "fuzzy" ||
    event.confidence < 0.55 ||
    Number.isNaN(date.getTime())
  );
}

function getEventTime(event: TimelineEvent) {
  const date = new Date(event.normalized_time);
  return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getDateKey(date: Date) {
  const pad = (input: number) => input.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
