import { useRef, useState } from "react";
import type { SourceType } from "../types/analysis";
import type { TimelineEvent } from "../types/event";
import type { AppSettings } from "../types/settings";
import { extractTextFromFile } from "../services/fileTextExtractor";
import { analyzeText } from "../services/llmClient";
import { normalizeAnalysisToEvents } from "../services/eventNormalizer";

interface InputPanelProps {
  settings: AppSettings;
  onAddEvents: (events: TimelineEvent[]) => void;
}

const MAX_TEXT_LENGTH = 12_000;

export default function InputPanel({ settings, onAddEvents }: InputPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("pasted_text");
  const [fileName, setFileName] = useState<string | null>(null);
  const [referenceDatetime, setReferenceDatetime] = useState(() =>
    toDatetimeLocalValue(settings.referenceDatetime || new Date().toISOString()),
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setError("");
    setNotice("");

    if (!settings.apiKey.trim()) {
      setError("请先在设置中配置 API Key。");
      return;
    }

    const trimmed = rawText.trim();
    if (!trimmed) {
      setError("请先粘贴文本，或导入一个文件。");
      return;
    }

    const textForAnalysis =
      trimmed.length > MAX_TEXT_LENGTH ? trimmed.slice(0, MAX_TEXT_LENGTH) : trimmed;

    if (trimmed.length > MAX_TEXT_LENGTH) {
      setNotice("文本超过 12000 字符，已先截断用于本次整理。");
    }

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeText({
        rawText: textForAnalysis,
        referenceDatetime: normalizeDatetimeLocal(referenceDatetime),
        timezone: settings.timezone,
        sourceType,
        settings: {
          apiKey: settings.apiKey,
          baseUrl: settings.baseUrl,
          model: settings.model,
        },
      });
      const events = normalizeAnalysisToEvents(analysis, { sourceType, fileName });
      if (events.length === 0) {
        setNotice(analysis.uncertainties[0] || "没有整理出明确时间节点。");
        return;
      }
      onAddEvents(events);
      setRawText("");
      setFileName(null);
      setSourceType("pasted_text");
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "整理失败，请稍后重试。");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError("");
    setNotice("");

    try {
      const extracted = await extractTextFromFile(file);
      setRawText(extracted.text);
      setSourceType(extracted.sourceType);
      setFileName(extracted.fileName);
      setNotice(extracted.warning || `已从 ${extracted.fileName} 提取文本，可编辑后再整理。`);
      setIsOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "文件读取失败。");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void handleFiles(event.dataTransfer.files);
  }

  if (!isOpen) {
    return (
      <div className="input-entry">
        <button className="input-entry__button" type="button" onClick={() => setIsOpen(true)}>
          <span aria-hidden="true">+</span>
          <strong>粘贴消息、通知、邮件</strong>
          <small>PDF / Word</small>
        </button>
      </div>
    );
  }

  return (
    <section className="input-panel" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
      <div className="input-panel__header">
        <h2>整理到时间轴</h2>
        <button className="icon-button" type="button" onClick={() => setIsOpen(false)} aria-label="收起输入面板">
          ×
        </button>
      </div>

      <textarea
        className="input-panel__textarea"
        value={rawText}
        onChange={(event) => {
          setRawText(event.target.value);
          if (sourceType !== "pasted_text" && !fileName) setSourceType("pasted_text");
        }}
        placeholder="粘贴通知、邮件、群消息或会议纪要..."
      />

      <div className="input-panel__tools">
        <button className="secondary-button" type="button" onClick={() => fileInputRef.current?.click()}>
          选择文件
        </button>
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept=".pdf,.docx,.doc,.txt,.md,.markdown"
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <span className="input-panel__file">{fileName || "支持 PDF / DOCX / TXT / MD，也可以拖入这里"}</span>
      </div>

      <label className="field">
        <span>参考时间</span>
        <input
          type="datetime-local"
          value={referenceDatetime}
          onChange={(event) => setReferenceDatetime(event.target.value)}
        />
      </label>

      {notice ? <p className="notice">{notice}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="input-panel__actions">
        <button className="primary-button" type="button" onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? "整理中..." : "整理到时间轴"}
        </button>
      </div>
    </section>
  );
}

function toDatetimeLocalValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return toDatetimeLocalValue(new Date().toISOString());
  const pad = (input: number) => input.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function normalizeDatetimeLocal(value: string) {
  if (!value) return toDatetimeLocalValue(new Date().toISOString()) + ":00";
  return value.length === 16 ? `${value}:00` : value;
}
