/**
 * LLM Provider 统一调用客户端
 * ============================
 * 根据 provider 从环境变量读取对应的 baseUrl / apiKey，
 * 统一走 OpenAI-compatible /chat/completions 端点。
 *
 * 环境变量说明（均为服务器端变量，不以 NEXT_PUBLIC_ 开头）：
 * - OPENAI_API_KEY / OPENAI_BASE_URL        → OpenAI 直连
 * - DASHSCOPE_API_KEY / DASHSCOPE_BASE_URL  → 通义千问 DashScope（OpenAI-compatible mode）
 * - NEVERSIGHT_API_KEY / NEVERSIGHT_BASE_URL → Neversight 网关
 */

import type { LLMChatRequest, LLMChatResponse, LLMProvider } from "./types";

export type { LLMChatRequest, LLMChatResponse, LLMProvider } from "./types";

// ---------------------------------------------------------------------------
// Provider 配置
// ---------------------------------------------------------------------------

interface ProviderConfig {
  baseUrl: string;
  apiKey: string | undefined;
}

function getProviderConfig(provider: LLMProvider): ProviderConfig {
  switch (provider) {
    case "openai":
      return {
        baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY,
      };
    case "dashscope":
      return {
        baseUrl:
          process.env.DASHSCOPE_BASE_URL ||
          "https://dashscope.aliyuncs.com/compatible-mode/v1",
        apiKey: process.env.DASHSCOPE_API_KEY,
      };
    case "neversight":
    default:
      return {
        baseUrl:
          process.env.NEVERSIGHT_BASE_URL || "https://api.neversight.dev/v1",
        apiKey: process.env.NEVERSIGHT_API_KEY,
      };
  }
}

function requireKey(provider: LLMProvider, raw: string | undefined): string {
  const k = raw?.trim();
  if (!k) {
    const envName =
      provider === "openai"
        ? "OPENAI_API_KEY"
        : provider === "dashscope"
          ? "DASHSCOPE_API_KEY"
          : "NEVERSIGHT_API_KEY";
    throw new Error(
      `Missing API key for provider "${provider}". Set ${envName} in .env.local.`
    );
  }
  return k;
}

// ---------------------------------------------------------------------------
// 核心调用
// ---------------------------------------------------------------------------

export async function chatCompletion(
  req: LLMChatRequest,
  signal?: AbortSignal
): Promise<LLMChatResponse> {
  const { baseUrl, apiKey } = getProviderConfig(req.provider);
  const key = requireKey(req.provider, apiKey);

  const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

  const body: Record<string, unknown> = {
    model: req.model,
    messages: req.messages,
    temperature: req.temperature ?? 0.5,
  };
  if (typeof req.maxTokens === "number") {
    body.max_tokens = req.maxTokens;
  }

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (fetchErr) {
    // 打印底层 fetch 错误的完整信息，便于调试代理 / 网络问题
    console.error(
      `[LLM client] fetch error (${req.provider} → ${url}):`,
      fetchErr instanceof Error ? `${fetchErr.name}: ${fetchErr.message}` : fetchErr
    );
    throw fetchErr;
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `LLM request failed (${req.provider}): HTTP ${resp.status} ${resp.statusText}. ${text}`
    );
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error(
      "Unexpected LLM response format: missing choices[0].message.content"
    );
  }

  return { content, raw: data };
}

// ---------------------------------------------------------------------------
// 流式调用（SSE / Server-Sent Events）
// ---------------------------------------------------------------------------

/**
 * 流式聊天补全 —— 返回一个 ReadableStream<string>，每个 chunk 是一段文本增量。
 * 用于 Agent API 的 stream 模式以及未来前端流式展示。
 *
 * 实现原理：向 LLM 发送 stream:true 请求，逐行解析 SSE data 行，
 * 提取 choices[0].delta.content 并 enqueue。
 *
 * 参考：OpenAI Streaming 文档 — https://platform.openai.com/docs/api-reference/streaming
 *       Anthropic / DashScope 均兼容此 SSE 格式。
 */
export function chatCompletionStream(
  req: LLMChatRequest,
  signal?: AbortSignal
): ReadableStream<string> {
  const { baseUrl, apiKey } = getProviderConfig(req.provider);
  const key = requireKey(req.provider, apiKey);

  const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

  const body: Record<string, unknown> = {
    model: req.model,
    messages: req.messages,
    temperature: req.temperature ?? 0.5,
    stream: true,
  };
  if (typeof req.maxTokens === "number") {
    body.max_tokens = req.maxTokens;
  }

  return new ReadableStream<string>({
    async start(controller) {
      try {
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify(body),
          signal,
        });

        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          controller.error(
            new Error(
              `LLM stream request failed (${req.provider}): HTTP ${resp.status} ${resp.statusText}. ${text}`
            )
          );
          return;
        }

        const reader = resp.body?.getReader();
        if (!reader) {
          controller.error(new Error("Response body is not readable"));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // 保留最后一个可能不完整的行
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") {
              controller.close();
              return;
            }

            try {
              const json = JSON.parse(payload);
              const delta = json?.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta) {
                controller.enqueue(delta);
              }
            } catch {
              // 忽略无法解析的行（心跳、注释等）
            }
          }
        }

        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
