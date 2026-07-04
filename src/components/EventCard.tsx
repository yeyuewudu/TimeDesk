import type { TimelineEvent } from "../types/event";
import { formatEventTime } from "../services/timelineService";

interface EventCardProps {
  event: TimelineEvent;
  onOpen: (event: TimelineEvent) => void;
}

const typeLabels: Record<TimelineEvent["event_type"], string> = {
  hard_deadline: "截止",
  hidden_deadline: "提前节点",
  checkpoint: "中间节点",
  preparation: "准备事项",
  reminder: "提醒",
};

const riskLabels: Record<TimelineEvent["risk_level"], string> = {
  low: "低",
  medium: "中",
  high: "高",
  critical: "紧急",
};

export default function EventCard({ event, onOpen }: EventCardProps) {
  const isCompleted = event.status === "completed";

  return (
    <button
      className={`event-card event-card--${event.event_type} ${isCompleted ? "is-completed" : ""}`}
      onClick={() => onOpen(event)}
      type="button"
    >
      <span className="event-card__line" aria-hidden="true" />
      <span className="event-card__dot" aria-hidden="true" />
      <span className="event-card__time">{formatEventTime(event.normalized_time)}</span>
      <span className="event-card__body">
        <span className="event-card__title">{event.title}</span>
        <span className="event-card__meta">
          <span>{typeLabels[event.event_type]}</span>
          {event.time_granularity === "fuzzy" || event.confidence < 0.55 ? <span>待确认</span> : null}
          {event.risk_level === "high" || event.risk_level === "critical" ? (
            <span>{riskLabels[event.risk_level]}</span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
