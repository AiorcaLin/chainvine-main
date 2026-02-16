/**
 * 支持的 AI Provider
 * - neversight: 浏览器直连（用户自带 Key）
 * - dashscope:  服务器端调用（Key 在 .env.local）
 * - openai:     服务器端调用（Key 在 .env.local）
 */
export type AIProvider = "neversight" | "dashscope" | "openai";

export interface AIConfig {
  /** AI Provider（默认 neversight 以兼容旧配置） */
  provider: AIProvider;
  /** API Key — 仅 Neversight 浏览器直连时使用 */
  apiKey: string;
  selectedModel: string;
  language: string;
  superPrompt: boolean;
}
