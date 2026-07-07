import type { EventType, RiskLevel, SourceType, TimeGranularity } from "./analysis";

export type EventStatus = "active" | "completed" | "deleted";

export interface TimelineEvent {
  id: string;
  source_id: string;
  title: string;
  event_type: EventType;
  original_time_text: string;
  normalized_time: string;
  time_granularity: TimeGranularity;
  confidence: number;
  risk_level: RiskLevel;
  reason: string;
  evidence: string;
  dependencies: string[];
  status: EventStatus;
  created_at: string;
  source_type: SourceType;
  file_name: string | null;
  uncertainties: string[];
}

export type TimelineGroupKind = "date" | "needsReview";

export interface TimelineGroup {
  key: string;
  kind: TimelineGroupKind;
  title: string;
  subtitle: string;
  events: TimelineEvent[];
}
