export interface GeminiModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
}

export const GEMINI_MODELS: GeminiModel[] = [
  {
    id: "gemini-2.0-flash",
    name: "gemini-2.0-flash",
    description: "2,0 flash model with enhanced capabilities",
    contextWindow: 1048576,
  },
  {
    id: "gemini-2.0-flash-lite-preview",
    name: "gemini-2.0-flash-lite-preview",
    description: "2,0 flash lite preview model with enhanced capabilities",
    contextWindow: 1048576,
  },
  {
    id: "gemini-2.0-pro-exp",
    name: "gemini-2.0-pro-exp",
    description: "2,0 pro model with enhanced capabilities",
    contextWindow: 2097152,
  },
  {
    id: "gemini-2.0-flash-thinking-exp",
    name: "gemini-2.0-flash-thinking-exp",
    description: "2,0 flash thinking model with enhanced capabilities",
    contextWindow: 1048576,
  },
];

export const getGeminiModelById = (
  modelId: string
): GeminiModel | undefined => {
  return GEMINI_MODELS.find((model) => model.id === modelId);
};
