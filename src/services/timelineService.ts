import type { RiskLevel } from "../types/analysis";
import type { TimelineEvent, TimelineGroup, TimelineGroupKey } from "../types/event";

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
  const groups: Record<TimelineGroupKey, TimelineEvent[]> = {
    today: [],
    tomorrow: [],
    thisWeek: [],
    nextWeek: [],
    later: [],
    needsReview: [],
  };

  for (const event of sortEvents(events.filter((item) => item.status !== "deleted"))) {
    const key = getGroupKey(event, now);
    groups[key].push(event);
  }

  const timelineGroups: TimelineGroup[] = [
    { key: "today", title: "今天", events: groups.today },
    { key: "tomorrow", title: "明天", events: groups.tomorrow },
    { key: "thisWeek", title: "本周", events: groups.thisWeek },
    { key: "nextWeek", title: "下周", events: groups.nextWeek },
    { key: "later", title: "更晚", events: groups.later },
    { key: "needsReview", title: "待确认", events: groups.needsReview },
  ];

  return timelineGroups.filter((group) => group.events.length > 0);
}

export function getRiskSummary(events: TimelineEvent[]) {
  const visible = events.filter((event) => event.status !== "deleted");
  const active = visible.filter((event) => event.status === "active");
  const needsReview = active.filter(
    (event) => event.time_granularity === "fuzzy" || event.confidence < 0.55,
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
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatEventTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getGroupKey(event: TimelineEvent, now: Date): TimelineGroupKey {
  const date = new Date(event.normalized_time);
  if (
    event.time_granularity === "fuzzy" ||
    event.confidence < 0.55 ||
    Number.isNaN(date.getTime())
  ) {
    return "needsReview";
  }

  const startToday = startOfDay(now);
  const startTomorrow = addDays(startToday, 1);
  const startAfterTomorrow = addDays(startToday, 2);
  const startNextWeek = addDays(startToday, 7 - getMondayBasedDay(now) + 1);
  const startWeekAfterNext = addDays(startNextWeek, 7);

  if (date >= startToday && date < startTomorrow) return "today";
  if (date >= startTomorrow && date < startAfterTomorrow) return "tomorrow";
  if (date >= startAfterTomorrow && date < startNextWeek) return "thisWeek";
  if (date >= startNextWeek && date < startWeekAfterNext) return "nextWeek";
  return "later";
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

function getMondayBasedDay(date: Date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}
