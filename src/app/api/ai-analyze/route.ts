/**
 * 前端 AI 分析代理路由
 * ======================
 * POST /api/ai-analyze
 *
 * 支持两种模式：
 *   - 同步模式（默认）：返回完整 JSON { content: string }
 *   - 流式模式（stream: true）：返回 SSE text/event-stream
 *
 * 前端对于 DashScope / OpenAI 等服务器端 Provider，
 * 通过此路由代理到 LLM Provider 抽象层，避免 CORS + Key 暴露。
 *
 * Neversight 仍由浏览器直连（用户自带 Key），不经此路由。
 */

import { NextRequest, NextResponse } from "next/server";
import { chatCompletion, chatCompletionStream } from "@/services/llm/client";
import type { LLMProvider } from "@/services/llm/types";

export const runtime = "nodejs";

const SYSTEM_MSG =
  "You are a smart contract security auditor. Return findings in the requested markdown structure with clear, concrete locations and recommendations.";

interface AIAnalyzeRequest {
  prompt: string;
  provider: LLMProvider;
  model: string;
  stream?: boolean;
}

export async function POST(req: NextRequest) {
  let body: AIAnalyzeRequest;
  try {
    body = (await req.json()) as AIAnalyzeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, provider, model, stream: useStream } = body;

  if (!prompt || !provider || !model) {
    return NextResponse.json(
      { error: "Missing required fields: prompt, provider, model" },
      { status: 400 }
    );
  }

  if (provider !== "dashscope" && provider !== "openai") {
    return NextResponse.json(
      { error: 'This endpoint only supports "dashscope" and "openai" providers' },
      { status: 400 }
    );
  }

  const messages = [
    { role: "system" as const, content: SYSTEM_MSG },
    { role: "user" as const, content: prompt },
  ];

  // ── 流式模式 ──
  if (useStream) {
    try {
      const llmStream = chatCompletionStream(
        { provider, model, messages, temperature: 0.5 },
        req.signal
      );

      const encoder = new TextEncoder();
      const sseStream = new ReadableStream<Uint8Array>({
        async start(controller) {
          const reader = llmStream.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(value)}\n\n`)
              );
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Stream error";
            controller.enqueue(
              encoder.encode(`event: error\ndata: ${JSON.stringify(msg)}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(sseStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // ── 同步模式 ──
  try {
    const result = await chatCompletion(
      { provider, model, messages, temperature: 0.5 },
      req.signal
    );
    return NextResponse.json({ content: result.content });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error(`[/api/ai-analyze] Error (${provider}/${model}):`, msg);

    const status = msg.includes("401") || msg.includes("403")
      ? 401
      : msg.includes("402")
        ? 402
        : msg.includes("404")
          ? 404
          : 500;

    return NextResponse.json({ error: msg }, { status });
  }
}
