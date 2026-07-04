import type { DeadlineAnalysis, SourceType } from "../types/analysis";
import type { TimelineEvent } from "../types/event";

interface NormalizeOptions {
  sourceType: SourceType;
  fileName: string | null;
}

export function normalizeAnalysisToEvents(
  analysis: DeadlineAnalysis,
  options: NormalizeOptions,
): TimelineEvent[] {
  const sourceId = createId();
  const now = new Date().toISOString();

  return analysis.events.map((event) => ({
    id: createId(),
    source_id: sourceId,
    title: event.title,
    event_type: event.event_type,
    original_time_text: event.original_time_text,
    normalized_time: event.normalized_time,
    time_granularity: event.time_granularity,
    confidence: event.confidence,
    risk_level: event.risk_level,
    reason: event.reason,
    evidence: event.evidence,
    dependencies: event.dependencies,
    status: "active",
    created_at: now,
    source_type: options.sourceType,
    file_name: options.fileName,
    uncertainties: analysis.uncertainties,
  }));
}

export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
