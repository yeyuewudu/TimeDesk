import { useEffect, useState } from "react";
import { appWindow } from "@tauri-apps/api/window";
import type { AppSettings } from "../types/settings";
import { requestBrowserNotificationPermission } from "../services/reminderService";

interface SettingsPanelProps {
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
}

export default function SettingsPanel({ settings, isOpen, onClose, onSave }: SettingsPanelProps) {
  const [draft, setDraft] = useState(settings);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  if (!isOpen) return null;

  async function handleSave() {
    onSave(draft);
    try {
      await appWindow.setAlwaysOnTop(draft.alwaysOnTop);
    } catch {
      // The setting is still saved when the app is previewed outside Tauri.
    }
    setMessage("设置已保存。");
  }

  async function handleNotificationToggle(enabled: boolean) {
    setDraft((current) => ({ ...current, enableNotifications: enabled }));
    if (enabled) {
      const permission = await requestBrowserNotificationPermission();
      if (permission === "denied") {
        setMessage("系统通知权限被拒绝，当前仅保存开关状态。");
      }
    }
  }

  return (
    <aside className="panel-overlay" aria-label="设置">
      <div className="settings-panel">
        <div className="settings-panel__header">
          <h2>设置</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭设置">
            ×
          </button>
        </div>

        <label className="field">
          <span>API Key</span>
          <input
            type="password"
            value={draft.apiKey}
            placeholder="sk-..."
            onChange={(event) => setDraft({ ...draft, apiKey: event.target.value })}
          />
        </label>

        <label className="field">
          <span>Base URL</span>
          <input
            type="url"
            value={draft.baseUrl}
            onChange={(event) => setDraft({ ...draft, baseUrl: event.target.value })}
          />
        </label>

        <label className="field">
          <span>Model</span>
          <input
            type="text"
            value={draft.model}
            onChange={(event) => setDraft({ ...draft, model: event.target.value })}
          />
        </label>

        <label className="field">
          <span>默认时区</span>
          <input
            type="text"
            value={draft.timezone}
            onChange={(event) => setDraft({ ...draft, timezone: event.target.value })}
          />
        </label>

        <label className="toggle-row">
          <span>窗口置顶</span>
          <input
            type="checkbox"
            checked={draft.alwaysOnTop}
            onChange={(event) => setDraft({ ...draft, alwaysOnTop: event.target.checked })}
          />
        </label>

        <label className="toggle-row">
          <span>启用系统通知</span>
          <input
            type="checkbox"
            checked={draft.enableNotifications}
            onChange={(event) => void handleNotificationToggle(event.target.checked)}
          />
        </label>

        <div className="settings-panel__rules">
          <span>默认提醒建议</span>
          <p>{draft.reminderRules.map((rule) => rule.label).join("、")}</p>
        </div>

        {message ? <p className="notice">{message}</p> : null}

        <button className="primary-button" type="button" onClick={handleSave}>
          保存设置
        </button>
      </div>
    </aside>
  );
}
