import { invoke } from "@tauri-apps/api/tauri";
import type { AnalyzeInput, DeadlineAnalysis } from "../types/analysis";
import { validateDeadlineAnalysis } from "./analysisValidator";

interface RustAnalyzeRequest {
  raw_text: string;
  reference_datetime: string;
  timezone: string;
  source_type: string;
  settings: {
    api_key: string;
    base_url: string;
    model: string;
  };
}

export async function analyzeText(input: AnalyzeInput): Promise<DeadlineAnalysis> {
  const request: RustAnalyzeRequest = {
    raw_text: input.rawText,
    reference_datetime: input.referenceDatetime,
    timezone: input.timezone,
    source_type: input.sourceType,
    settings: {
      api_key: input.settings.apiKey,
      base_url: input.settings.baseUrl,
      model: input.settings.model,
    },
  };

  const response = await invoke<unknown>("analyze_text_with_llm", { input: request });
  return validateDeadlineAnalysis(response);
}
