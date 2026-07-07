import { useState } from "react";
import type { TimelineEvent } from "../types/event";
import type { ReminderRule } from "../types/settings";
import { buildReminderSuggestions } from "../services/reminderService";
import { formatEventDateTime } from "../services/timelineService";

interface EventDetailDrawerProps {
  event: TimelineEvent | null;
  reminderRules: ReminderRule[];
  onClose: () => void;
  onComplete: (eventId: string) => void;
  onDelete: (eventId: string) => void;
  onUpdateTime: (eventId: string, normalizedTime: string) => void;
}

const typeLabels: Record<TimelineEvent["event_type"], string> = {
  hard_deadline: "截止",
  hidden_deadline: "提前节点",
  checkpoint: "中间节点",
  preparation: "准备事项",
  reminder: "提醒",
};

const riskLabels: Record<TimelineEvent["risk_level"], string> = {
  low: "普通",
  medium: "关注",
  high: "高优先",
  critical: "紧急",
};

export default function EventDetailDrawer({
  event,
  reminderRules,
  onClose,
  onComplete,
  onDelete,
  onUpdateTime,
}: EventDetailDrawerProps) {
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [draftTime, setDraftTime] = useState("");

  if (!event) return null;

  const currentEvent = event;
  const reminders = buildReminderSuggestions(currentEvent, reminderRules);

  function startEditing() {
    setDraftTime(toDatetimeLocalValue(currentEvent.normalized_time));
    setIsEditingTime(true);
  }

  function saveTime() {
    if (draftTime) {
      onUpdateTime(currentEvent.id, draftTime.length === 16 ? `${draftTime}:00` : draftTime);
    }
    setIsEditingTime(false);
  }

  return (
    <aside className="detail-drawer" aria-label="事件详情">
      <div className="detail-drawer__header">
        <div>
          <p className="eyebrow">{typeLabels[event.event_type]}</p>
          <h2>{event.title}</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="关闭详情">
          ×
        </button>
      </div>

      <div className="detail-drawer__section">
        <span className="detail-label">时间</span>
        {isEditingTime ? (
          <div className="inline-edit">
            <input type="datetime-local" value={draftTime} onChange={(event) => setDraftTime(event.target.value)} />
            <button className="secondary-button" type="button" onClick={saveTime}>
              保存
            </button>
          </div>
        ) : (
          <p>{formatEventDateTime(event.normalized_time)}</p>
        )}
      </div>

      <div className="detail-grid">
        <div>
          <span className="detail-label">注意级别</span>
          <p>{riskLabels[event.risk_level]}</p>
        </div>
        <div>
          <span className="detail-label">置信度</span>
          <p>{Math.round(event.confidence * 100)}%</p>
        </div>
      </div>

      <div className="detail-drawer__section">
        <span className="detail-label">原文证据</span>
        <blockquote>{event.evidence || event.original_time_text || "无"}</blockquote>
      </div>

      <div className="detail-drawer__section">
        <span className="detail-label">为什么重要</span>
        <p>{event.reason || "模型没有提供更多解释。"}</p>
      </div>

      {event.dependencies.length > 0 ? (
        <div className="detail-drawer__section">
          <span className="detail-label">依赖项</span>
          <p>{event.dependencies.join("、")}</p>
        </div>
      ) : null}

      {event.uncertainties.length > 0 ? (
        <div className="detail-drawer__section">
          <span className="detail-label">不确定项</span>
          <ul className="plain-list">
            {event.uncertainties.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {reminders.length > 0 ? (
        <div className="detail-drawer__section">
          <span className="detail-label">提醒建议</span>
          <ul className="plain-list">
            {reminders.map((reminder) => (
              <li key={reminder.id}>
                {reminder.label}：{formatEventDateTime(reminder.remindAt)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="detail-drawer__actions">
        <button className="secondary-button" type="button" onClick={startEditing}>
          编辑时间
        </button>
        <button className="secondary-button" type="button" onClick={() => onComplete(event.id)}>
          {event.status === "completed" ? "恢复" : "完成"}
        </button>
        <button className="danger-button" type="button" onClick={() => onDelete(event.id)}>
          删除
        </button>
      </div>
    </aside>
  );
}

function toDatetimeLocalValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (input: number) => input.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
