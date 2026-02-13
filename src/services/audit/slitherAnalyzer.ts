/**
 * Slither 分析服务
 * ================
 * 封装与 Slither Docker 微服务的通信逻辑。
 * 负责：发送合约源码 → 接收扫描结果 → 标准化输出。
 */

import { ContractFile } from "@/types/blockchain";
import {
  SlitherAnalysisResult,
  SlitherFinding,
  SlitherSummary,
} from "@/types/slither";

/** Slither 服务地址（Docker 容器） */
const SLITHER_SERVICE_URL =
  process.env.NEXT_PUBLIC_SLITHER_SERVICE_URL || "http://localhost:8545";

/**
 * 检查 Slither 服务是否在线
 */
export async function checkSlitherHealth(): Promise<{
  healthy: boolean;
  slither_version?: string;
  solc_version?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${SLITHER_SERVICE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { healthy: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return {
      healthy: data.status === "healthy",
      slither_version: data.slither_version,
      solc_version: data.solc_version,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * 使用 Slither 分析合约
 *
 * @param files - 合约源文件列表
 * @param mainFile - 主合约文件路径（可选，自动检测）
 * @param solcVersion - Solidity 编译器版本（可选，自动检测）
 * @param signal - 取消信号
 * @returns Slither 分析结果
 */
export async function analyzeWithSlither(
  files: ContractFile[],
  mainFile?: string,
  solcVersion?: string,
  signal?: AbortSignal
): Promise<SlitherAnalysisResult> {
  // 准备请求数据
  const requestFiles = files
    .filter((f) => f.path.endsWith(".sol"))
    .map((f) => ({
      path: cleanFilePath(f.path),
      content: f.content,
    }));

  if (requestFiles.length === 0) {
    return {
      success: false,
      findings: [],
      summary: emptySummary(),
      error: "No Solidity files found for analysis",
      duration_ms: 0,
    };
  }

  // 确定主文件
  const main = mainFile
    ? cleanFilePath(mainFile)
    : findMainContract(requestFiles);

  const requestBody = {
    files: requestFiles,
    main_file: main,
    solc_version: solcVersion || undefined,
  };

  try {
    const response = await fetch(`${SLITHER_SERVICE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: signal || AbortSignal.timeout(180000), // 3 分钟超时
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        findings: [],
        summary: emptySummary(),
        error: `Slither service error: HTTP ${response.status} - ${errorText}`,
        duration_ms: 0,
      };
    }

    const result: SlitherAnalysisResult = await response.json();
    return result;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        success: false,
        findings: [],
        summary: emptySummary(),
        error: "Slither analysis was cancelled",
        duration_ms: 0,
      };
    }

    return {
      success: false,
      findings: [],
      summary: emptySummary(),
      error: error instanceof Error ? error.message : "Unknown error",
      duration_ms: 0,
    };
  }
}

/**
 * 清理文件路径 — 移除 proxy/ 或 implementation/ 前缀
 */
function cleanFilePath(path: string): string {
  return path
    .replace(/^proxy\//, "")
    .replace(/^implementation\//, "")
    .replace(/\\/g, "/");
}

/**
 * 从文件列表中找到主合约文件
 * 优先级：名称最短的 .sol 文件 > 第一个 .sol 文件
 */
function findMainContract(
  files: { path: string; content: string }[]
): string {
  const solFiles = files.filter((f) => f.path.endsWith(".sol"));

  if (solFiles.length === 0) return files[0]?.path || "";
  if (solFiles.length === 1) return solFiles[0].path;

  // 排除常见库文件
  const nonLib = solFiles.filter(
    (f) =>
      !f.path.includes("@openzeppelin") &&
      !f.path.includes("solmate") &&
      !f.path.includes("solady") &&
      !f.path.includes("/interfaces/") &&
      !f.path.includes("/libraries/") &&
      !f.path.includes("/lib/")
  );

  const candidates = nonLib.length > 0 ? nonLib : solFiles;

  // 选择路径最短的（通常是主合约）
  return candidates.sort((a, b) => a.path.length - b.path.length)[0].path;
}

/**
 * 生成空的摘要对象
 */
function emptySummary(): SlitherSummary {
  return {
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
    optimization: 0,
  };
}

/**
 * 格式化 Slither 结果为 Markdown
 * 用于和 AI 审计报告合并展示
 */
export function formatSlitherResultsAsMarkdown(
  result: SlitherAnalysisResult
): string {
  if (!result.success && result.error) {
    return `## Slither 静态分析\n\n> ⚠️ 分析失败: ${result.error}\n`;
  }

  if (result.findings.length === 0) {
    return `## Slither 静态分析\n\n✅ 未检测到已知漏洞模式。\n\n*分析耗时: ${result.duration_ms}ms | Slither ${result.slither_version || "unknown"} | solc ${result.solc_version || "unknown"}*\n`;
  }

  const lines: string[] = [];
  lines.push("## Slither 静态分析结果\n");
  lines.push(
    `*检测到 **${result.summary.total}** 个发现 | 分析耗时: ${result.duration_ms}ms | Slither ${result.slither_version || "unknown"} | solc ${result.solc_version || "unknown"}*\n`
  );

  // 摘要表格
  lines.push("### 摘要\n");
  lines.push("| 严重度 | 数量 |");
  lines.push("|--------|------|");
  if (result.summary.high > 0)
    lines.push(`| 🔴 High | ${result.summary.high} |`);
  if (result.summary.medium > 0)
    lines.push(`| 🟠 Medium | ${result.summary.medium} |`);
  if (result.summary.low > 0)
    lines.push(`| 🟡 Low | ${result.summary.low} |`);
  if (result.summary.informational > 0)
    lines.push(`| 🔵 Informational | ${result.summary.informational} |`);
  if (result.summary.optimization > 0)
    lines.push(`| ⚪ Optimization | ${result.summary.optimization} |`);
  lines.push("");

  // 按严重度分组
  const impactOrder = ["High", "Medium", "Low", "Informational", "Optimization"];

  for (const impact of impactOrder) {
    const group = result.findings.filter((f) => f.impact === impact);
    if (group.length === 0) continue;

    const emoji =
      impact === "High" ? "🔴" :
      impact === "Medium" ? "🟠" :
      impact === "Low" ? "🟡" :
      impact === "Informational" ? "🔵" : "⚪";

    lines.push(`### ${emoji} ${impact} Severity\n`);

    for (const finding of group) {
      lines.push(`#### ${finding.check}\n`);
      lines.push(finding.description.trim());
      lines.push("");

      // 代码位置
      if (finding.elements && finding.elements.length > 0) {
        const locations = finding.elements
          .filter(
            (e: SlitherFinding["elements"][0]) =>
              e.source_mapping?.filename_relative && e.source_mapping?.lines?.length > 0
          )
          .map(
            (e: SlitherFinding["elements"][0]) =>
              `- \`${e.source_mapping?.filename_relative}\` (lines ${e.source_mapping?.lines?.[0]}-${e.source_mapping?.lines?.[e.source_mapping.lines.length - 1]})`
          );

        if (locations.length > 0) {
          lines.push("**位置:**");
          lines.push(...locations);
          lines.push("");
        }
      }
    }
  }

  return lines.join("\n");
}
