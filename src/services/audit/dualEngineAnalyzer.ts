/**
 * Dual-Engine Fusion Analyzer
 * ===========================
 * Runs Slither (static) and AI (LLM) engines in parallel,
 * then fuses results using dedup + cross-validation.
 *
 * Ref: Feist et al., "Slither: A Static Analysis Framework", WETSEB 2019
 * Ref: David et al., "Do you still need a manual smart contract audit?", arXiv 2023
 */

import { ContractFile } from "@/types/blockchain";
import { AIConfig } from "@/types/ai";
import { SlitherAnalysisResult } from "@/types/slither";
import { analyzeWithSlither, checkSlitherHealth } from "./slitherAnalyzer";
import { analyzeContract } from "./contractAnalyzer";
import { fuseResults, formatFusionReport, FusionResult } from "./findingFusion";

export interface DualEngineProgress {
  stage: "slither" | "ai" | "merging" | "done" | "error";
  message: string;
  slitherDone?: boolean;
  aiDone?: boolean;
  percent?: number;
}

export interface DualEngineResult {
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

export async function analyzeDualEngine(
  files: ContractFile[],
  config: AIConfig,
  contractName: string,
  onProgress?: (progress: DualEngineProgress) => void,
  signal?: AbortSignal,
): Promise<DualEngineResult> {
  const startTime = Date.now();
  let slitherResult: SlitherAnalysisResult | null = null;
  let aiReport: string | null = null;
  let slitherAvailable = false;
  let slitherDurationMs = 0;
  let aiDurationMs = 0;

  const healthCheck = await checkSlitherHealth();
  slitherAvailable = healthCheck.healthy;

  const promises: Promise<void>[] = [];

  if (slitherAvailable) {
    onProgress?.({ stage: "slither", message: "Slither engine starting...", slitherDone: false, aiDone: false, percent: 10 });

    const slitherPromise = (async () => {
      const slitherStart = Date.now();
      try {
        slitherResult = await analyzeWithSlither(files, undefined, undefined, signal);
        slitherDurationMs = Date.now() - slitherStart;
        onProgress?.({ stage: "slither", message: `Slither done: ${slitherResult.summary.total} findings (${slitherDurationMs}ms)`, slitherDone: true, aiDone: false, percent: 40 });
      } catch (error) {
        slitherDurationMs = Date.now() - slitherStart;
        console.error("Slither analysis error:", error);
        slitherResult = {
          success: false, findings: [], summary: { total: 0, high: 0, medium: 0, low: 0, informational: 0, optimization: 0 },
          error: error instanceof Error ? error.message : "Slither failed", duration_ms: slitherDurationMs,
        };
      }
    })();
    promises.push(slitherPromise);
  } else {
    onProgress?.({ stage: "slither", message: "Slither unavailable, using AI only", slitherDone: true, aiDone: false, percent: 10 });
  }

  onProgress?.({ stage: "ai", message: "AI deep audit starting...", slitherDone: slitherAvailable ? false : true, aiDone: false, percent: 20 });

  const aiPromise = (async () => {
    const aiStart = Date.now();
    try {
      const result = await analyzeContract({ files, contractName, signal });
      aiDurationMs = Date.now() - aiStart;
      if (result && result.report && result.report.analysis) {
        aiReport = result.report.analysis;
      }
      onProgress?.({ stage: "ai", message: `AI done (${aiDurationMs}ms)`, slitherDone: true, aiDone: true, percent: 80 });
    } catch (error) {
      aiDurationMs = Date.now() - aiStart;
      console.error("AI analysis error:", error);
      aiReport = null;

      // 通知 UI：AI 引擎失败，而非静默吞掉错误
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      // 402 余额不足时直接抛出，阻止继续（因为结果没有 AI 数据可能无意义）
      if (errMsg.includes("402")) {
        onProgress?.({ stage: "error", message: `AI 引擎失败: 余额不足 (${errMsg})`, slitherDone: true, aiDone: true, percent: 80 });
        throw error; // 让外层 Promise.allSettled 捕获，同时让 handleStartAnalysis 的 catch 处理
      }
      onProgress?.({ stage: "ai", message: `AI 引擎失败，仅使用 Slither 结果 (${(aiDurationMs / 1000).toFixed(1)}s)`, slitherDone: true, aiDone: true, percent: 80 });
    }
  })();
  promises.push(aiPromise);

  await Promise.allSettled(promises);

  onProgress?.({ stage: "merging", message: "Fusing dual-engine results...", slitherDone: true, aiDone: true, percent: 90 });

  const enginesUsed: string[] = [];
  const finalSlitherResult = slitherResult as SlitherAnalysisResult | null;
  if (finalSlitherResult && finalSlitherResult.success) enginesUsed.push("Slither");
  if (aiReport) enginesUsed.push("AI (LLM)");

  const fusionResult = fuseResults(finalSlitherResult, aiReport);
  const mergedReport = formatFusionReport(fusionResult, contractName, enginesUsed, finalSlitherResult, aiReport);

  const totalDurationMs = Date.now() - startTime;
  onProgress?.({ stage: "done", message: `Done: ${enginesUsed.length} engines, ${totalDurationMs}ms`, slitherDone: true, aiDone: true, percent: 100 });

  return {
    mergedReport,
    slitherResult: finalSlitherResult,
    aiReport,
    fusionResult,
    metadata: { slitherAvailable, slitherDurationMs, aiDurationMs, totalDurationMs, enginesUsed },
  };
}
