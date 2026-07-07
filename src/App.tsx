import { useEffect, useMemo, useState } from "react";
import { appWindow } from "@tauri-apps/api/window";
import EventDetailDrawer from "./components/EventDetailDrawer";
import InputPanel from "./components/InputPanel";
import SettingsPanel from "./components/SettingsPanel";
import TimelineWidget from "./components/TimelineWidget";
import { getRiskSummary } from "./services/timelineService";
import { loadEvents, loadSettings, saveEvents, saveSettings } from "./services/storageService";
import type { TimelineEvent } from "./types/event";
import type { AppSettings } from "./types/settings";

export default function App() {
  const [events, setEvents] = useState<TimelineEvent[]>(() => loadEvents());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;
  const summary = useMemo(() => getRiskSummary(events), [events]);

  useEffect(() => {
    saveEvents(events);
  }, [events]);

  useEffect(() => {
    saveSettings(settings);
    void appWindow.setAlwaysOnTop(settings.alwaysOnTop).catch(() => undefined);
  }, [settings]);

  function handleAddEvents(nextEvents: TimelineEvent[]) {
    setEvents((current) => [...current, ...nextEvents]);
  }

  function handleSaveSettings(nextSettings: AppSettings) {
    setSettings(nextSettings);
  }

  function handleComplete(eventId: string) {
    setEvents((current) =>
      current.map((event) =>
        event.id === eventId
          ? { ...event, status: event.status === "completed" ? "active" : "completed" }
          : event,
      ),
    );
  }

  function handleDelete(eventId: string) {
    setEvents((current) =>
      current.map((event) => (event.id === eventId ? { ...event, status: "deleted" } : event)),
    );
    setSelectedEventId(null);
  }

  function handleUpdateTime(eventId: string, normalizedTime: string) {
    setEvents((current) =>
      current.map((event) =>
        event.id === eventId
          ? {
              ...event,
              normalized_time: normalizedTime,
              time_granularity: "exact_time",
              confidence: Math.max(event.confidence, 0.75),
            }
          : event,
      ),
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header" data-tauri-drag-region>
        <div data-tauri-drag-region>
          <h1 data-tauri-drag-region>TimeDesk</h1>
          <p data-tauri-drag-region>{formatToday()}</p>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          aria-label="打开设置"
          title="设置"
        >
          ⚙
        </button>
      </header>

      <section className="status-strip" aria-label="时间轴摘要">
        <span>{summary.active} 个待办</span>
        <span>{summary.needsReview} 个需确认</span>
      </section>

      <TimelineWidget events={events} onOpenEvent={(event) => setSelectedEventId(event.id)} />

      <InputPanel settings={settings} onAddEvents={handleAddEvents} />

      <SettingsPanel
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      <EventDetailDrawer
        event={selectedEvent}
        reminderRules={settings.reminderRules}
        onClose={() => setSelectedEventId(null)}
        onComplete={handleComplete}
        onDelete={handleDelete}
        onUpdateTime={handleUpdateTime}
      />
    </main>
  );
}

function formatToday() {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());
}
