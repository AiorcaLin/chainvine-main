/**
 * Agent 审计 API
 * ==============
 * POST /api/agent/audit
 *
 * 功能：外部 AI Agent / 脚本调用此接口，触发 Slither + LLM 双引擎审计。
 * 模式：
 *   - 默认（stream: false）：同步返回完整 JSON（含 fusion findings + markdown report）
 *   - 流式（stream: true） ：以 SSE（text/event-stream）逐 chunk 推送 AI 输出，
 *                            最后推送融合结果与元数据
 *
 * 鉴权：通过 x-agent-api-key 头匹配 AGENT_API_KEY 环境变量（本机部署简单权限控制）。
 * API Key 不从请求 body 传入，全部从服务器环境变量读取。
 *
 * 设计依据：
 * - Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models", ICLR 2023
 *   —— Agent 通过工具调用接口获取能力扩展，稳定 API > UI 自动化。
 * - OpenAPI Specification 3.0 —— 机器可读接口契约（见 docs/openapi-agent-audit.yaml）。
 */

import { NextRequest, NextResponse } from "next/server";
import type { ContractFile } from "@/types/blockchain";
import { analyzeDualEngineServer, analyzeDualEngineServerStream } from "@/services/audit/dualEngineAnalyzerServer";
import type { LLMProvider } from "@/services/llm/types";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// 请求类型
// ---------------------------------------------------------------------------

interface AgentAuditRequest {
  address: string;
  chain: string;
  provider: LLMProvider;
  model: string;
  language?: string;
  superPrompt?: boolean;
  /** 设为 true 启用 SSE 流式输出 */
  stream?: boolean;
}

// ---------------------------------------------------------------------------
// 辅助函数
// ---------------------------------------------------------------------------

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function getHeader(req: NextRequest, name: string): string | null {
  return req.headers.get(name) || req.headers.get(name.toLowerCase()) || null;
}

/** 通过内部 /api/source 获取合约源码 */
async function fetchSourceFiles(
  req: NextRequest,
  address: string,
  chain: string
): Promise<{ files: ContractFile[]; contractName: string; apiUrl?: string }> {
  const url = new URL(req.url);
  url.pathname = "/api/source";
  url.searchParams.set("address", address);
  url.searchParams.set("chain", chain);

  const resp = await fetch(url.toString(), { method: "GET" });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Failed to fetch source via /api/source: HTTP ${resp.status}. ${text}`);
  }

  const data = (await resp.json()) as Record<string, unknown>;
  const files = Array.isArray(data?.files) ? (data.files as ContractFile[]) : [];
  const contractName =
    typeof data?.contractName === "string" ? data.contractName : "Contract";
  const apiUrl = typeof data?.apiUrl === "string" ? data.apiUrl : undefined;

  if (!files.length) throw new Error("No source files returned from /api/source");
  return { files, contractName, apiUrl };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // ── 鉴权 ──
  const expected = process.env.AGENT_API_KEY?.trim();
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "AGENT_API_KEY not configured on server" },
      { status: 500 }
    );
  }
  const provided = getHeader(req, "x-agent-api-key")?.trim();
  if (provided !== expected) {
    return unauthorized();
  }

  // ── 解析请求 ──
  let body: AgentAuditRequest;
  try {
    body = (await req.json()) as AgentAuditRequest;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const address = body.address?.trim();
  const chain = body.chain?.trim();
  const provider = body.provider;
  const model = body.model?.trim();

  if (!address || !chain || !provider || !model) {
    return badRequest("Missing required fields: address, chain, provider, model");
  }

  const language = (body.language || "chinese-simplified").trim();
  const superPrompt = body.superPrompt !== false;
  const useStream = body.stream === true;

  // ── 获取合约源码 ──
  let files: ContractFile[];
  let contractName: string;
  let apiUrl: string | undefined;
  try {
    ({ files, contractName, apiUrl } = await fetchSourceFiles(req, address, chain));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch source";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }

  const aiConfig = { provider, model, language, superPrompt };

  // ── 流式模式 ──
  if (useStream) {
    const stream = analyzeDualEngineServerStream({
      files,
      contractName,
      chain,
      ai: aiConfig,
      signal: req.signal,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // ── 同步模式 ──
  try {
    const result = await analyzeDualEngineServer({
      files,
      contractName,
      chain,
      ai: aiConfig,
      signal: req.signal,
    });

    return NextResponse.json({
      ok: true,
      input: { address, chain, contractName },
      source: { via: "/api/source", apiUrl },
      ai: { provider, model, language, superPrompt },
      engines: result.metadata.enginesUsed,
      timings: result.metadata,
      fusion: result.fusionResult,
      report: {
        mergedMarkdown: result.mergedReport,
        aiMarkdown: result.aiReport,
        slither: result.slitherResult,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
