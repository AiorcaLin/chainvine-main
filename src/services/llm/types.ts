/**
 * LLM Provider 抽象层 — 类型定义
 * ================================
 * 统一 OpenAI / DashScope（通义千问）/ Neversight 三种 Provider 的调用接口。
 * 所有 Provider 均走 OpenAI-compatible /chat/completions 格式。
 *
 * 设计依据：
 * - Schick et al., "Toolformer: Language Models Can Teach Themselves to Use Tools",
 *   NeurIPS 2023 —— 工具/API 调用能力的标准化是 Agent 生态的基础。
 * - OpenAPI Specification 3.0 —— 机器可读的接口契约。
 */

export type LLMRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

/** 支持的 Provider 标识 */
export type LLMProvider = "openai" | "dashscope" | "neversight";

/** 统一的聊天请求 */
export interface LLMChatRequest {
  provider: LLMProvider;
  /** Provider 原生模型 id，例如 "gpt-4o-mini"、"qwen-max"、"openai/gpt-5.2" */
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
}

/** 统一的聊天响应 */
export interface LLMChatResponse {
  content: string;
  /** 原始 Provider 返回（调试用） */
  raw?: unknown;
}
