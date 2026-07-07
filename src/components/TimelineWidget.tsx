import type { TimelineEvent } from "../types/event";
import { groupEventsByDate } from "../services/timelineService";
import EmptyState from "./EmptyState";
import EventCard from "./EventCard";

interface TimelineWidgetProps {
  events: TimelineEvent[];
  onOpenEvent: (event: TimelineEvent) => void;
}

export default function TimelineWidget({ events, onOpenEvent }: TimelineWidgetProps) {
  const groups = groupEventsByDate(events);

  if (groups.length === 0) {
    return <EmptyState />;
  }

  return (
    <section className="timeline" aria-label="时间轴">
      {groups.map((group) => (
        <div className={`timeline__group timeline__group--${group.kind}`} key={group.key}>
          <header className="timeline__heading">
            <h2>{group.title}</h2>
            <span>{group.subtitle}</span>
          </header>
          <div className="timeline__events">
            {group.events.map((event) => (
              <EventCard event={event} key={event.id} onOpen={onOpenEvent} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
