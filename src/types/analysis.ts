export type EventType =
  | "hard_deadline"
  | "hidden_deadline"
  | "checkpoint"
  | "preparation"
  | "reminder";

export type TimeGranularity =
  | "date"
  | "morning"
  | "afternoon"
  | "evening"
  | "exact_time"
  | "fuzzy";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type SourceType = "pasted_text" | "pdf" | "docx" | "txt" | "md";

export interface AnalysisEvent {
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
}

export interface PreparationStep {
  title: string;
  suggested_time: string;
  reason: string;
}

export interface DeadlineAnalysis {
  source_summary: string;
  events: AnalysisEvent[];
  preparation_steps: PreparationStep[];
  uncertainties: string[];
  overall_risk: RiskLevel;
}

export interface AnalyzeInput {
  rawText: string;
  referenceDatetime: string;
  timezone: string;
  sourceType: SourceType;
  settings: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
}
