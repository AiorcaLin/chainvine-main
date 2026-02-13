export interface OpenAIModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  trainingData?: string;
  supportsTemperature?: boolean;
}

export const GPT_MODELS: OpenAIModel[] = [
  {
    id: "o1-mini",
    name: "o1-mini",
    description: "Compact version of Opus One model",
    contextWindow: 128000,
    trainingData: "Up to Jan 2024",
    supportsTemperature: false,
  },
  {
    id: "o1-preview",
    name: "o1-preview",
    description: "Preview version of next-generation Opus One model",
    contextWindow: 128000,
    trainingData: "Up to Jan 2024",
    supportsTemperature: false,
  },
  {
    id: "o1",
    name: "o1",
    description: "Standard Opus One model with extended context window",
    contextWindow: 200000,
    trainingData: "Up to Dec 2024",
    supportsTemperature: false,
  },
  {
    id: "gpt-4o-mini",
    name: "gpt-4o-mini",
    description: "Lightweight version of GPT-4 Opus optimized for efficiency",
    contextWindow: 8000,
    trainingData: "Up to Jan 2024",
    supportsTemperature: true,
  },
  {
    id: "chatgpt-4o-latest",
    name: "chatgpt-4o-latest",
    description: "Latest version of ChatGPT-4 Opus with continuous updates",
    contextWindow: 128000,
    trainingData: "Continuous updates",
    supportsTemperature: true,
  },
  {
    id: "gpt-4o",
    name: "gpt-4o",
    description: "Standard GPT-4 Opus model for general use",
    contextWindow: 8192,
    trainingData: "Up to Jan 2024",
    supportsTemperature: true,
  },
  {
    id: "gpt-4o-2024-11-20",
    name: "gpt-4o-2024-11-20",
    description: "Version-specific GPT-4 Opus with November 2024 training",
    contextWindow: 8192,
    trainingData: "Up to Nov 2024",
    supportsTemperature: true,
  },
  {
    id: "gpt-4-turbo",
    name: "gpt-4-turbo",
    description: "High-performance GPT-4 model with enhanced capabilities",
    contextWindow: 128000,
    trainingData: "Up to Dec 2023",
    supportsTemperature: true,
  },
];

// Get all available models
export const getAllModels = (): OpenAIModel[] => GPT_MODELS;

// Get model information by ID
export const getModelById = (modelId: string): OpenAIModel | undefined => {
  return GPT_MODELS.find((model) => model.id === modelId);
};

// Get default model
export const getDefaultModel = (): OpenAIModel => {
  return GPT_MODELS[0]; // Returns gpt-4o as default
};
