import type { TimelineEvent } from "../types/event";
import { formatEventTime } from "../services/timelineService";

interface EventCardProps {
  event: TimelineEvent;
  onOpen: (event: TimelineEvent) => void;
}

const typeLabels: Record<TimelineEvent["event_type"], string> = {
  hard_deadline: "截止",
  hidden_deadline: "提前",
  checkpoint: "节点",
  preparation: "准备",
  reminder: "提醒",
};

const riskLabels: Record<TimelineEvent["risk_level"], string> = {
  low: "",
  medium: "",
  high: "高优先",
  critical: "紧急",
};

export default function EventCard({ event, onOpen }: EventCardProps) {
  const isCompleted = event.status === "completed";
  const needsReview = event.time_granularity === "fuzzy" || event.confidence < 0.55;
  const showRisk = event.risk_level === "high" || event.risk_level === "critical";
  const timeLabel = needsReview
    ? event.original_time_text || "待定"
    : formatEventTime(event.normalized_time);

  return (
    <button
      className={`event-card event-card--${event.event_type} event-card--risk-${event.risk_level} ${
        needsReview ? "needs-review" : ""
      } ${isCompleted ? "is-completed" : ""}`}
      onClick={() => onOpen(event)}
      type="button"
    >
      <span className="event-card__check" aria-hidden="true" />
      <span className="event-card__time">{timeLabel}</span>
      <span className="event-card__body">
        <span className="event-card__title">{event.title}</span>
        <span className="event-card__meta">
          <span>{typeLabels[event.event_type]}</span>
          {needsReview ? <span className="event-card__tag--review">待确认</span> : null}
          {showRisk ? <span className="event-card__tag--risk">{riskLabels[event.risk_level]}</span> : null}
        </span>
      </span>
    </button>
  );
}
