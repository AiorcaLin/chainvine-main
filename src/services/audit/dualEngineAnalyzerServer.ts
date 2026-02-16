/**
 * 服务器端双引擎编排器
 * =====================
 * 与 dualEngineAnalyzer.ts（浏览器端）功能相同，但：
 * - 不依赖 localStorage / onProgress 回调
 * - 使用 contractAnalyzerServer.ts（Provider 抽象层）
 * - 支持同步 + 流式两种模式
 *
 * Ref: Feist et al., "Slither: A Static Analysis Framework", WETSEB 2019
 * Ref: David et al., "Do you still need a manual smart contract audit?", arXiv 2023
 */

import type { ContractFile } from "@/types/blockchain";
import type { SlitherAnalysisResult } from "@/types/slither";
import { analyzeWithSlither, checkSlitherHealth } from "@/services/audit/slitherAnalyzer";
import {
  fuseResults,
  formatFusionReport,
  type FusionResult,
} from "@/services/audit/findingFusion";
import {
  analyzeContractServer,
  analyzeContractServerStream,
  type AgentAIConfig,
} from "@/services/audit/contractAnalyzerServer";

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

export interface DualEngineAgentResult {
  mergedReport: string;
  slitherResult: SlitherAnalysisResult | null;
  aiReport: string | null;
  fusionResult: FusionResult | null;
  metadata: {
    slitherAvailable: boolean;
    slitherDurationMs: number;
    aiDurationMs: number;
    totalDurationMs: number;
    enginesUsed: string[];
  };
}

// ---------------------------------------------------------------------------
// 同步模式
// ---------------------------------------------------------------------------

export async function analyzeDualEngineServer(params: {
  files: ContractFile[];
  contractName: string;
  chain?: string;
  ai: AgentAIConfig;
  signal?: AbortSignal;
}): Promise<DualEngineAgentResult> {
  const startTime = Date.now();
  let slitherResult: SlitherAnalysisResult | null = null;
  let aiReport: string | null = null;
  let slitherAvailable = false;
  let slitherDurationMs = 0;
  let aiDurationMs = 0;

  const healthCheck = await checkSlitherHealth();
  slitherAvailable = healthCheck.healthy;

  const tasks: Promise<void>[] = [];

  // Slither（如果可用则并行启动）
  if (slitherAvailable) {
    tasks.push(
      (async () => {
        const t0 = Date.now();
        try {
          slitherResult = await analyzeWithSlither(
            params.files,
            undefined,
            undefined,
            params.signal
          );
        } catch (err) {
          console.error("Slither analysis error:", err);
        } finally {
          slitherDurationMs = Date.now() - t0;
        }
      })()
    );
  }

  // LLM（通过 Provider 抽象层）
  tasks.push(
    (async () => {
      const t0 = Date.now();
      try {
        const result = await analyzeContractServer({
          files: params.files,
          contractName: params.contractName,
          config: params.ai,
          signal: params.signal,
        });
        aiReport = result?.report?.analysis || null;
      } catch (err) {
        console.error("AI analysis error:", err);
      } finally {
        aiDurationMs = Date.now() - t0;
      }
    })()
  );

  await Promise.allSettled(tasks);

  // 融合
  const enginesUsed: string[] = [];
  if (slitherResult && (slitherResult as SlitherAnalysisResult).success) {
    enginesUsed.push("Slither");
  }
  if (aiReport) enginesUsed.push("AI (LLM)");

  const fusionResult = fuseResults(slitherResult, aiReport);
  const mergedReport = formatFusionReport(
    fusionResult,
    params.contractName,
    enginesUsed,
    slitherResult,
    aiReport
  );

  const totalDurationMs = Date.now() - startTime;
  return {
    mergedReport,
    slitherResult,
    aiReport,
    fusionResult,
    metadata: {
      slitherAvailable,
      slitherDurationMs,
      aiDurationMs,
      totalDurationMs,
      enginesUsed,
    },
  };
}

// ---------------------------------------------------------------------------
// 流式模式
// ---------------------------------------------------------------------------

/**
 * 流式双引擎分析：
 * 1. Slither 在后台同步跑完（通常几秒）
 * 2. LLM 部分流式输出（逐 chunk 推给客户端）
 * 3. 流结束后，将完整 AI 报告与 Slither 结果进行融合
 *
 * 返回一个 ReadableStream<string>，输出格式为 Server-Sent Events：
 *   event: chunk        data: "..."       → AI 文本增量
 *   event: slither      data: {...}       → Slither 分析完成
 *   event: fusion       data: {...}       → 融合结果（流结束后）
 *   event: done         data: {...}       → 最终元数据
 *   event: error        data: "..."       → 错误
 */
export function analyzeDualEngineServerStream(params: {
  files: ContractFile[];
  contractName: string;
  chain?: string;
  ai: AgentAIConfig;
  signal?: AbortSignal;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  // SSE 辅助函数
  function sseEvent(event: string, data: unknown): string {
    const json = typeof data === "string" ? data : JSON.stringify(data);
    return `event: ${event}\ndata: ${json}\n\n`;
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const startTime = Date.now();
      let slitherResult: SlitherAnalysisResult | null = null;
      let slitherAvailable = false;
      let slitherDurationMs = 0;
      let aiDurationMs = 0;
      let collectedAI = "";

      try {
        // 1. 检查 Slither 可用性
        const healthCheck = await checkSlitherHealth();
        slitherAvailable = healthCheck.healthy;

        // 2. 启动 Slither（后台）
        const slitherPromise = slitherAvailable
          ? (async () => {
              const t0 = Date.now();
              try {
                slitherResult = await analyzeWithSlither(
                  params.files,
                  undefined,
                  undefined,
                  params.signal
                );
              } catch (err) {
                console.error("Slither error:", err);
              } finally {
                slitherDurationMs = Date.now() - t0;
                controller.enqueue(
                  encoder.encode(sseEvent("slither", {
                    available: true,
                    durationMs: slitherDurationMs,
                    success: slitherResult?.success ?? false,
                    findingsCount: slitherResult?.summary?.total ?? 0,
                  }))
                );
              }
            })()
          : Promise.resolve();

        // 3. 启动 LLM 流式分析（并行）
        const aiStart = Date.now();
        const aiStream = analyzeContractServerStream({
          files: params.files,
          contractName: params.contractName,
          config: params.ai,
          signal: params.signal,
        });

        const reader = aiStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          collectedAI += value;
          controller.enqueue(encoder.encode(sseEvent("chunk", value)));
        }
        aiDurationMs = Date.now() - aiStart;

        // 4. 等 Slither 完成
        await slitherPromise;

        // 5. 融合
        const enginesUsed: string[] = [];
        if (slitherResult && (slitherResult as SlitherAnalysisResult).success) {
          enginesUsed.push("Slither");
        }
        const formattedAI = collectedAI
          ? "# Generated by ChainVine (Agent API)\n\n" + collectedAI
          : null;
        if (formattedAI) enginesUsed.push("AI (LLM)");

        const fusionResult = fuseResults(slitherResult, formattedAI);
        const mergedReport = formatFusionReport(
          fusionResult,
          params.contractName,
          enginesUsed,
          slitherResult,
          formattedAI
        );

        controller.enqueue(
          encoder.encode(sseEvent("fusion", {
            findings: fusionResult.findings,
            summary: fusionResult.summary,
            metadata: fusionResult.metadata,
          }))
        );

        const totalDurationMs = Date.now() - startTime;
        controller.enqueue(
          encoder.encode(sseEvent("done", {
            mergedReport,
            engines: enginesUsed,
            timings: {
              slitherAvailable,
              slitherDurationMs,
              aiDurationMs,
              totalDurationMs,
            },
          }))
        );

        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(sseEvent("error", msg)));
        controller.close();
      }
    },
  });
}
