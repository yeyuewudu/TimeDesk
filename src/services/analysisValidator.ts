import { z } from "zod";
import type { DeadlineAnalysis } from "../types/analysis";

const eventTypeSchema = z.enum([
  "hard_deadline",
  "hidden_deadline",
  "checkpoint",
  "preparation",
  "reminder",
]);

const granularitySchema = z.enum([
  "date",
  "morning",
  "afternoon",
  "evening",
  "exact_time",
  "fuzzy",
]);

const riskSchema = z.enum(["low", "medium", "high", "critical"]);

const analysisEventSchema = z.object({
  title: z.string().min(1),
  event_type: eventTypeSchema,
  original_time_text: z.string().default(""),
  normalized_time: z.string().min(1),
  time_granularity: granularitySchema,
  confidence: z.number().min(0).max(1).catch(0.5),
  risk_level: riskSchema.catch("medium"),
  reason: z.string().default(""),
  evidence: z.string().default(""),
  dependencies: z.array(z.string()).catch([]),
});

const preparationStepSchema = z.object({
  title: z.string().min(1),
  suggested_time: z.string().min(1),
  reason: z.string().default(""),
});

export const deadlineAnalysisSchema = z.object({
  source_summary: z.string().default(""),
  events: z.array(analysisEventSchema).catch([]),
  preparation_steps: z.array(preparationStepSchema).catch([]),
  uncertainties: z.array(z.string()).catch([]),
  overall_risk: riskSchema.catch("medium"),
});

export function validateDeadlineAnalysis(value: unknown): DeadlineAnalysis {
  const parsed = deadlineAnalysisSchema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(issue ? `模型返回结构不完整：${issue.path.join(".")} ${issue.message}` : "模型返回结构不完整");
  }
  return parsed.data;
}

export function parseModelJson(text: string): unknown {
  const cleaned = cleanJsonText(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("模型没有返回可解析的 JSON");
  }
}

function cleanJsonText(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}
