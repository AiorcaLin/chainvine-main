/**
 * Slither 静态分析相关类型定义
 * 
 * 参考: https://github.com/crytic/slither/wiki/JSON-output
 * 参考: SWC Registry (https://swcregistry.io/)
 */

/** Slither 检测到的代码元素 */
export interface SlitherElement {
  type: string;           // "function" | "variable" | "contract" | "node" | "pragma"
  name: string;
  source_mapping?: {
    start: number;
    length: number;
    filename_relative: string;
    filename_absolute?: string;
    filename_short?: string;
    lines: number[];
    starting_column?: number;
    ending_column?: number;
  };
  type_specific_fields?: Record<string, unknown>;
  additional_fields?: Record<string, unknown>;
}

/** 单条 Slither 漏洞发现 */
export interface SlitherFinding {
  /** 检测器名称，如 "reentrancy-eth", "unchecked-lowlevel" */
  check: string;
  /** 严重度: "High" | "Medium" | "Low" | "Informational" | "Optimization" */
  impact: SlitherImpact;
  /** 置信度: "High" | "Medium" | "Low" */
  confidence: SlitherConfidence;
  /** 漏洞描述（纯文本） */
  description: string;
  /** 漏洞描述（Markdown 格式） */
  markdown?: string;
  /** 相关代码元素 */
  elements: SlitherElement[];
  /** 唯一标识 */
  id?: string;
  /** 第一个 Markdown 元素 */
  first_markdown_element?: string;
}

/** Slither 分析摘要 */
export interface SlitherSummary {
  total: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
  optimization: number;
}

/** Slither 分析响应 */
export interface SlitherAnalysisResult {
  success: boolean;
  findings: SlitherFinding[];
  summary: SlitherSummary;
  error?: string | null;
  duration_ms: number;
  solc_version?: string | null;
  slither_version?: string | null;
}

/** Slither 严重度等级 */
export type SlitherImpact = "High" | "Medium" | "Low" | "Informational" | "Optimization";

/** Slither 置信度等级 */
export type SlitherConfidence = "High" | "Medium" | "Low";

/** Slither 检测器信息 */
export interface SlitherDetector {
  check: string;
  title: string;
  impact: SlitherImpact;
  confidence: SlitherConfidence;
  wiki_url?: string;
  description?: string;
}

/**
 * 将 Slither impact 映射到统一的严重度等级
 * 用于和 AI 引擎结果融合
 */
export function mapSlitherImpactToSeverity(impact: SlitherImpact): string {
  switch (impact) {
    case "High": return "Critical";
    case "Medium": return "Medium";
    case "Low": return "Low";
    case "Informational": return "Informational";
    case "Optimization": return "Gas Optimization";
    default: return "Unknown";
  }
}

/**
 * Slither 检测器到 SWC ID 的映射
 * 参考: https://swcregistry.io/
 */
export const SLITHER_TO_SWC: Record<string, string> = {
  "reentrancy-eth": "SWC-107",
  "reentrancy-no-eth": "SWC-107",
  "reentrancy-benign": "SWC-107",
  "reentrancy-events": "SWC-107",
  "unchecked-lowlevel": "SWC-104",
  "unchecked-send": "SWC-104",
  "unprotected-upgrade": "SWC-105",
  "suicidal": "SWC-106",
  "tx-origin": "SWC-115",
  "uninitialized-storage": "SWC-109",
  "uninitialized-state": "SWC-109",
  "uninitialized-local": "SWC-109",
  "timestamp": "SWC-116",
  "shadowing-state": "SWC-119",
  "shadowing-local": "SWC-119",
  "controlled-delegatecall": "SWC-112",
  "arbitrary-send-erc20": "SWC-105",
  "arbitrary-send-eth": "SWC-105",
  "locked-ether": "SWC-132",
  "incorrect-equality": "SWC-132",
  "write-after-write": "SWC-110",
};
