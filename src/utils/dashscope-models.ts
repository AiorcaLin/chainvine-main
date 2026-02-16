/**
 * DashScope (通义千问) 弗吉尼亚区域可用模型
 * =============================================
 * 通过 /models API 查询确认（2026-02-15）。
 * 仅列出适合智能合约安全审计的文本模型。
 *
 * 参考: Alibaba Cloud Model Studio — DashScope API Reference
 * 端点: https://dashscope-us.aliyuncs.com/compatible-mode/v1
 */

export interface DashScopeModel {
  id: string;
  name: string;
  description: string;
}

export const DASHSCOPE_MODELS: DashScopeModel[] = [
  {
    id: "qwen3-coder-plus",
    name: "Qwen3 Coder Plus",
    description: "Code-specialized, ideal for contract audit",
  },
  {
    id: "qwen3-max",
    name: "Qwen3 Max",
    description: "Flagship model, most powerful",
  },
  {
    id: "qwen-plus",
    name: "Qwen Plus",
    description: "Balanced performance & cost",
  },
  {
    id: "qwen-flash",
    name: "Qwen Flash",
    description: "Fast & efficient, good for testing",
  },
  {
    id: "qwen3-coder-flash",
    name: "Qwen3 Coder Flash",
    description: "Code-specialized, fast",
  },
];

export const getDashScopeModelById = (modelId: string) =>
  DASHSCOPE_MODELS.find((m) => m.id === modelId);
