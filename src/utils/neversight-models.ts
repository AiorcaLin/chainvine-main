export interface NeversightModel {
  /** Neversight model id, e.g. "openai/gpt-5.2" */
  id: string;
  /** Display name */
  name: string;
  description?: string;
}

// Only keep 6 models from 3 providers (Anthropic / Google / OpenAI)
export const NEVERSIGHT_MODELS: NeversightModel[] = [
  {
    id: "anthropic/claude-4.5-opus",
    name: "Claude 4.5 Opus",
    description: "Anthropic Claude 4.5 Opus",
  },
  {
    id: "anthropic/claude-4.5-opus-max",
    name: "Claude 4.5 Opus Max",
    description: "Anthropic Claude 4.5 Opus Max",
  },
  {
    id: "google/gemini-3-pro",
    name: "Gemini 3 Pro",
    description: "Google Gemini 3 Pro",
  },
  {
    id: "google/gemini-3-flash",
    name: "Gemini 3 Flash",
    description: "Google Gemini 3 Flash",
  },
  {
    id: "openai/gpt-5.2",
    name: "GPT-5.2",
    description: "OpenAI GPT-5.2",
  },
  {
    id: "openai/gpt-5.2-high",
    name: "GPT-5.2 High",
    description: "OpenAI GPT-5.2 High",
  },
];

export const getNeversightModelById = (modelId: string) =>
  NEVERSIGHT_MODELS.find((m) => m.id === modelId);

