export interface ClaudeModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  inputTokensPerMinute: number;
  outputTokensPerMinute: number;
  requestsPerMinute: number;
}

export const CLAUDE_MODELS: ClaudeModel[] = [
  {
    id: "claude-3-5-sonnet-latest",
    name: "claude-3-5-sonnet-latest",
    description: "Latest version of Claude 3.5 Sonnet with enhanced capabilities",
    contextWindow: 200000,
    inputTokensPerMinute: 40000,
    outputTokensPerMinute: 8000,
    requestsPerMinute: 50,
  },
  {
    id: "claude-3-5-haiku-latest",
    name: "claude-3-5-haiku-latest",
    description: "Fast and efficient version of Claude 3.5",
    contextWindow: 200000,
    inputTokensPerMinute: 50000,
    outputTokensPerMinute: 10000,
    requestsPerMinute: 50,
  },
  {
    id: "claude-3-opus-latest",
    name: "claude-3-opus-latest",
    description: "Most capable Claude model for complex tasks",
    contextWindow: 200000,
    inputTokensPerMinute: 20000,
    outputTokensPerMinute: 4000,
    requestsPerMinute: 50,
  },
  {
    id: "claude-3-sonnet-20240229",
    name: "claude-3-sonnet-20240229",
    description: "Balanced model for most use cases",
    contextWindow: 200000,
    inputTokensPerMinute: 40000,
    outputTokensPerMinute: 8000,
    requestsPerMinute: 50,
  },
  {
    id: "claude-3-haiku-20240307",
    name: "claude-3-haiku-20240307",
    description: "Fast and efficient version of Claude 3",
    contextWindow: 200000,
    inputTokensPerMinute: 50000,
    outputTokensPerMinute: 10000,
    requestsPerMinute: 50,
  },
];

// Get all available Claude models
export const getAllClaudeModels = (): ClaudeModel[] => CLAUDE_MODELS;

// Get Claude model information by ID
export const getClaudeModelById = (modelId: string): ClaudeModel | undefined => {
  return CLAUDE_MODELS.find((model) => model.id === modelId);
};

// Get default Claude model
export const getDefaultClaudeModel = (): ClaudeModel => {
  return CLAUDE_MODELS[0]; // Returns Claude 3.5 Sonnet as default
}; 