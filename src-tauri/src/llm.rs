use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde::Deserialize;
use serde_json::{json, Value};

const SYSTEM_PROMPT: &str = r#"你是一个时间节点整理器。请从用户提供的中文文本中提取所有与时间、截止日期、准备事项、交付节点、会议节点和提醒有关的信息，并整理成一条可放入时间轴的数据。

你必须区分：
1. 正式截止日期：明确要求最终提交、完成、报名、确认或交付的时间；
2. 提前节点：不是最终提交，但如果错过会影响汇总、review、后续修改、他人协作或导致来不及的关键节点；
3. 中间节点：review、汇总、讨论、预展示、确认、反馈、技术评审、会议等；
4. 准备事项：为了完成任务需要提前做的步骤；
5. 模糊时间：尽快、近期、本周内、月底前、节前、开学前、收到通知后 48 小时内等。

请基于 reference_datetime 和 timezone 解析“明天”“下周三”“本周五”“周一晚上”等相对时间。

对于没有具体小时的日期，请使用合理默认值：
- 上午默认 10:00；
- 下午默认 15:00；
- 晚上默认 21:00；
- 只有日期但没有时间的正式截止日期默认 23:59；
- 只有日期但没有时间的准备事项默认 18:00。

只输出合法 JSON，不要输出 Markdown，不要输出解释性文字。
每个事件必须包含 evidence 字段，引用对应的原文片段。
如果有不确定解释，必须写入 uncertainties。
如果文本中没有任何明确时间，也要返回空 events，并在 uncertainties 中说明。

输出 JSON 必须符合：
{
  "source_summary": "string",
  "events": [
    {
      "title": "string",
      "event_type": "hard_deadline | hidden_deadline | checkpoint | preparation | reminder",
      "original_time_text": "string",
      "normalized_time": "YYYY-MM-DDTHH:mm:ss",
      "time_granularity": "date | morning | afternoon | evening | exact_time | fuzzy",
      "confidence": 0.0,
      "risk_level": "low | medium | high | critical",
      "reason": "string",
      "evidence": "string",
      "dependencies": ["string"]
    }
  ],
  "preparation_steps": [
    {
      "title": "string",
      "suggested_time": "YYYY-MM-DDTHH:mm:ss",
      "reason": "string"
    }
  ],
  "uncertainties": ["string"],
  "overall_risk": "low | medium | high | critical"
}"#;

#[derive(Debug, Deserialize)]
pub struct AnalyzeRequest {
    raw_text: String,
    reference_datetime: String,
    timezone: String,
    source_type: String,
    settings: LlmSettings,
}

#[derive(Debug, Deserialize)]
pub struct LlmSettings {
    api_key: String,
    base_url: String,
    model: String,
}

#[derive(Debug, Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatChoice {
    message: ChatChoiceMessage,
}

#[derive(Debug, Deserialize)]
struct ChatChoiceMessage {
    content: String,
}

#[tauri::command]
pub async fn analyze_text_with_llm(input: AnalyzeRequest) -> Result<Value, String> {
    if input.settings.api_key.trim().is_empty() {
        return Err("请先在设置中配置 API Key。".to_string());
    }

    if input.raw_text.trim().is_empty() {
        return Err("请先输入或导入一段文本。".to_string());
    }

    let endpoint = build_endpoint(&input.settings.base_url);
    let user_prompt = build_user_prompt(&input);
    let client = reqwest::Client::new();

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    let auth_value = HeaderValue::from_str(&format!("Bearer {}", input.settings.api_key.trim()))
        .map_err(|_| "API Key 格式不正确。".to_string())?;
    headers.insert(AUTHORIZATION, auth_value);

    let body = json!({
        "model": input.settings.model,
        "temperature": 0.1,
        "response_format": { "type": "json_object" },
        "messages": [
            { "role": "system", "content": SYSTEM_PROMPT },
            { "role": "user", "content": user_prompt }
        ]
    });

    let response = client
        .post(endpoint)
        .headers(headers)
        .json(&body)
        .send()
        .await
        .map_err(|error| format!("请求大模型失败：{}", error))?;

    let status = response.status();
    let response_text = response
        .text()
        .await
        .map_err(|error| format!("读取大模型响应失败：{}", error))?;

    if !status.is_success() {
        return Err(format!("大模型接口返回错误 {}：{}", status, response_text));
    }

    let completion: ChatCompletionResponse = serde_json::from_str(&response_text)
        .map_err(|error| format!("大模型响应不是标准 chat completions 格式：{}", error))?;

    let content = completion
        .choices
        .first()
        .map(|choice| choice.message.content.trim().to_string())
        .filter(|content| !content.is_empty())
        .ok_or_else(|| "大模型响应中没有 message.content。".to_string())?;

    parse_model_json(&content)
}

fn build_endpoint(base_url: &str) -> String {
    let trimmed = base_url.trim().trim_end_matches('/');
    if trimmed.ends_with("/chat/completions") {
        trimmed.to_string()
    } else {
        format!("{}/chat/completions", trimmed)
    }
}

fn build_user_prompt(input: &AnalyzeRequest) -> String {
    format!(
        r#"raw_text:
"""{raw_text}"""

reference_datetime: {reference_datetime}
timezone: {timezone}
source_type: {source_type}

请分析并返回严格 JSON。"#,
        raw_text = input.raw_text,
        reference_datetime = input.reference_datetime,
        timezone = input.timezone,
        source_type = input.source_type
    )
}

fn parse_model_json(content: &str) -> Result<Value, String> {
    let cleaned = clean_json_text(content);
    match serde_json::from_str::<Value>(&cleaned) {
        Ok(value) => Ok(value),
        Err(_) => {
            let start = cleaned.find('{');
            let end = cleaned.rfind('}');
            match (start, end) {
                (Some(start), Some(end)) if end > start => {
                    serde_json::from_str::<Value>(&cleaned[start..=end])
                        .map_err(|error| format!("模型返回内容无法解析为 JSON：{}", error))
                }
                _ => Err("模型没有返回可解析的 JSON。".to_string()),
            }
        }
    }
}

fn clean_json_text(content: &str) -> String {
    let trimmed = content.trim();
    let without_prefix = trimmed
        .strip_prefix("```json")
        .or_else(|| trimmed.strip_prefix("```JSON"))
        .or_else(|| trimmed.strip_prefix("```"))
        .unwrap_or(trimmed);
    without_prefix
        .strip_suffix("```")
        .unwrap_or(without_prefix)
        .trim()
        .to_string()
}
