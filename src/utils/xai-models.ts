export interface XAIModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
}

export const XAI_MODELS: XAIModel[] = [
  {
    id: "grok-2-latest",
    name: "grok-2-latest",
    description: "xAI's Grok model for advanced language understanding",
    contextWindow: 131072,
  },
];

export const getXAIModelById = (modelId: string): XAIModel | undefined => {
  return XAI_MODELS.find((model) => model.id === modelId);
}; 