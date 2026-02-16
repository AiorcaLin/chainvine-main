import { useState, useEffect } from "react";
import { AIConfig, AIProvider } from "@/types/ai";
import { getNeversightModelById, NEVERSIGHT_MODELS } from "./neversight-models";
import { DASHSCOPE_MODELS } from "./dashscope-models";
import { GPT_MODELS } from "./openai-models";

export type { AIConfig, AIProvider } from "@/types/ai";

const SYSTEM_PROMPT = `You are a smart contract security auditor with the following responsibilities:
- Identify potential security vulnerabilities and risks
- Analyze code for best practices and standards compliance
- Suggest gas optimizations and efficiency improvements
- Provide detailed explanations of findings
- Recommend specific fixes and improvements
Format your response with clear sections for vulnerabilities, optimizations, and recommendations.
Please include full code snippets and function names in your response.`;

// ---------------------------------------------------------------------------
// 辅助函数
// ---------------------------------------------------------------------------

/** 获取 Provider 的默认模型 ID */
export function getDefaultModelForProvider(provider: AIProvider): string {
  switch (provider) {
    case "dashscope":
      return DASHSCOPE_MODELS[0].id;
    case "openai":
      return GPT_MODELS[0].id;
    case "neversight":
    default:
      return NEVERSIGHT_MODELS[0].id;
  }
}

/** 验证模型 ID 在指定 Provider 中是否有效 */
function isValidModel(provider: AIProvider, modelId: string): boolean {
  switch (provider) {
    case "dashscope":
      return DASHSCOPE_MODELS.some((m) => m.id === modelId);
    case "openai":
      return GPT_MODELS.some((m) => m.id === modelId);
    case "neversight":
    default:
      return !!getNeversightModelById(modelId);
  }
}

// ---------------------------------------------------------------------------
// Get AI config from localStorage
// ---------------------------------------------------------------------------

export function getAIConfig(config: AIConfig): AIConfig {
  const savedConfig = localStorage.getItem("ai_config");
  if (savedConfig) {
    return JSON.parse(savedConfig);
  }
  return config;
}

// Get AI model name (safe for filenames)
export function getModelName(config: AIConfig): string {
  return (config.selectedModel || "model")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// AI configuration Hook
// ---------------------------------------------------------------------------

export function useAIConfig() {
  const [config, setConfig] = useState<AIConfig>(() => {
    const defaultConfig: AIConfig = {
      provider: "neversight",
      apiKey: "",
      selectedModel: NEVERSIGHT_MODELS[0].id,
      language: "english",
      superPrompt: true,
    };

    if (typeof window === "undefined") return defaultConfig;

    const saved = localStorage.getItem("ai_config");
    if (!saved) return defaultConfig;

    try {
      const raw = JSON.parse(saved) as Record<string, unknown>;

      // 兼容旧版配置（无 provider 字段 → 默认 neversight）
      const provider: AIProvider =
        raw.provider === "dashscope" || raw.provider === "openai"
          ? (raw.provider as AIProvider)
          : "neversight";

      const merged: AIConfig = {
        provider,
        apiKey: typeof raw.apiKey === "string" ? raw.apiKey : defaultConfig.apiKey,
        selectedModel:
          typeof raw.selectedModel === "string"
            ? raw.selectedModel
            : getDefaultModelForProvider(provider),
        language: typeof raw.language === "string" ? raw.language : defaultConfig.language,
        superPrompt:
          typeof raw.superPrompt === "boolean" ? raw.superPrompt : defaultConfig.superPrompt,
      };

      // 验证模型是否属于当前 Provider
      if (!isValidModel(merged.provider, merged.selectedModel)) {
        merged.selectedModel = getDefaultModelForProvider(merged.provider);
      }

      return merged;
    } catch {
      return defaultConfig;
    }
  });

  useEffect(() => {
    localStorage.setItem("ai_config", JSON.stringify(config));
  }, [config]);

  return { config, setConfig };
}

// ---------------------------------------------------------------------------
// AI analysis — Provider 路由
// ---------------------------------------------------------------------------

/**
 * 统一 AI 分析入口。
 * - Neversight: 浏览器直连（用户自带 Key，无 CORS 问题）
 * - DashScope / OpenAI: 通过 /api/ai-analyze 服务器端代理（Key 在 .env.local）
 *
 * @param onChunk — 可选流式回调，每收到一个 LLM 增量 chunk 时触发。
 *   如果提供，将自动启用流式模式（SSE），返回值仍是完整文本。
 *   参考: Nielsen's Response Time Guidelines — 流式输出将首 token 延迟从
 *         30-200s 降至 1-2s，显著改善用户感知等待时间。
 */
export async function analyzeWithAI(
  prompt: string,
  signal?: AbortSignal,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const savedConfig = localStorage.getItem("ai_config");
  if (!savedConfig) {
    throw new Error("AI configuration not found");
  }

  const config: AIConfig = JSON.parse(savedConfig);
  const provider = config.provider || "neversight";

  if (provider === "neversight") {
    return analyzeWithNeversight(prompt, config, signal, onChunk);
  } else {
    return analyzeWithServerProvider(prompt, provider, config.selectedModel, signal, onChunk);
  }
}

// ---------------------------------------------------------------------------
// Neversight — 浏览器直连
// ---------------------------------------------------------------------------

async function analyzeWithNeversight(
  prompt: string,
  config: AIConfig,
  signal?: AbortSignal,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const model = getNeversightModelById(config.selectedModel);
  if (!model) {
    throw new Error(`Invalid model selected: ${config.selectedModel}`);
  }

  const apiKey = config.apiKey?.trim();
  if (!apiKey) {
    throw new Error("Neversight API key not found. Please configure it in AI settings.");
  }

  const useStream = !!onChunk;

  const response = await fetch(
    "https://api.neversight.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        stream: useStream,
      }),
      signal,
    }
  );

  if (!response?.ok) {
    const errorData = await response.text();
    throw new Error(
      `Neversight API request failed: ${response.status} ${response.statusText}. Details: ${errorData}`
    );
  }

  // 流式模式：逐 chunk 解析 SSE
  if (useStream) {
    return parseSSEStream(response, onChunk);
  }

  // 同步模式
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content) {
    throw new Error("Unexpected response format from Neversight");
  }
  return content;
}

// ---------------------------------------------------------------------------
// DashScope / OpenAI — 服务器端代理
// ---------------------------------------------------------------------------

async function analyzeWithServerProvider(
  prompt: string,
  provider: AIProvider,
  model: string,
  signal?: AbortSignal,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const useStream = !!onChunk;

  const response = await fetch("/api/ai-analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, provider, model, stream: useStream }),
    signal,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: response.statusText }));
    const errMsg = data?.error || `HTTP ${response.status}`;

    if (response.status === 402) {
      throw new Error(`${provider} API 余额不足: ${errMsg}`);
    }
    if (response.status === 401) {
      throw new Error(`${provider} API Key 无效或未配置。请在服务器 .env.local 中设置。`);
    }
    if (response.status === 404) {
      throw new Error(`模型 "${model}" 在 ${provider} 上不可用: ${errMsg}`);
    }
    throw new Error(`${provider} AI analysis failed: ${errMsg}`);
  }

  // 流式模式：解析 SSE
  if (useStream) {
    return parseSSEStream(response, onChunk);
  }

  // 同步模式
  const data = await response.json();
  if (typeof data?.content !== "string" || !data.content) {
    throw new Error("Unexpected response format from server AI endpoint");
  }
  return data.content;
}

// ---------------------------------------------------------------------------
// SSE 流式解析器（Neversight / /api/ai-analyze 共用）
// ---------------------------------------------------------------------------

async function parseSSEStream(
  response: Response,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Response body not readable");

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("event:")) continue;
      if (!trimmed.startsWith("data:")) continue;

      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") {
        return fullText;
      }

      try {
        const parsed = JSON.parse(payload);

        // /api/ai-analyze 格式: data: "chunk text"
        if (typeof parsed === "string") {
          fullText += parsed;
          onChunk?.(parsed);
          continue;
        }

        // OpenAI-compatible SSE 格式: data: {choices:[{delta:{content:"..."}}]}
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) {
          fullText += delta;
          onChunk?.(delta);
        }
      } catch {
        // 忽略无法解析的行
      }
    }
  }

  return fullText;
}
