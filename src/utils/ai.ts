import { useState, useEffect } from "react";
import { AIConfig } from "@/types/ai";
import { getNeversightModelById, NEVERSIGHT_MODELS } from "./neversight-models";

export type { AIConfig } from "@/types/ai";

const SYSTEM_PROMPT = `You are a smart contract security auditor with the following responsibilities:
- Identify potential security vulnerabilities and risks
- Analyze code for best practices and standards compliance
- Suggest gas optimizations and efficiency improvements
- Provide detailed explanations of findings
- Recommend specific fixes and improvements
Format your response with clear sections for vulnerabilities, optimizations, and recommendations.
Please include full code snippets and function names in your response.`;

// Get AI config from localStorage
export function getAIConfig(config: AIConfig): AIConfig {
  const savedConfig = localStorage.getItem("ai_config");
  if (savedConfig) {
    return JSON.parse(savedConfig);
  }
  return config;
}

// Get AI model name
export function getModelName(config: AIConfig): string {
  // Make it safe for filenames (no slashes)
  return (config.selectedModel || "model")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// AI configuration Hook
export function useAIConfig() {
  const [config, setConfig] = useState<AIConfig>(() => {
    const defaultConfig: AIConfig = {
      apiKey: "",
      selectedModel: NEVERSIGHT_MODELS[0].id,
      language: "english",
      superPrompt: true,
    };

    if (typeof window === "undefined") return defaultConfig;

    const saved = localStorage.getItem("ai_config");
    if (!saved) return defaultConfig;

    try {
      const raw = JSON.parse(saved) as Record<string, unknown>;
      const merged: AIConfig = {
        apiKey: typeof raw.apiKey === "string" ? raw.apiKey : defaultConfig.apiKey,
        selectedModel:
          typeof raw.selectedModel === "string"
            ? raw.selectedModel
            : defaultConfig.selectedModel,
        language: typeof raw.language === "string" ? raw.language : defaultConfig.language,
        superPrompt:
          typeof raw.superPrompt === "boolean" ? raw.superPrompt : defaultConfig.superPrompt,
      };

      if (!getNeversightModelById(merged.selectedModel)) {
        merged.selectedModel = defaultConfig.selectedModel;
      }

      return merged;
    } catch {
      return defaultConfig;
    }
  });

  // Save configuration to localStorage
  useEffect(() => {
    localStorage.setItem("ai_config", JSON.stringify(config));
  }, [config]);

  return { config, setConfig };
}

// AI analysis function
export async function analyzeWithAI(
  prompt: string,
  signal?: AbortSignal
): Promise<string> {
  const savedConfig = localStorage.getItem("ai_config");
  if (!savedConfig) {
    throw new Error("AI configuration not found");
  }

  const config: AIConfig = JSON.parse(savedConfig);
  const model = getNeversightModelById(config.selectedModel);
  if (!model) {
    throw new Error(`Invalid model selected: ${config.selectedModel}`);
  }

  const apiKey = config.apiKey?.trim();
  if (!apiKey) {
    throw new Error("Neversight API key not found");
  }

  try {
    const response = await fetch(
      "https://api.neversight.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model.id,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 0.5,
        }),
        signal,
      }
    );

    if (!response?.ok) {
      const errorData = await response.text();
      throw new Error(
        `Neversight API request failed: ${response.status} ${response.statusText}. Details: ${errorData}`
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content) {
      throw new Error("Unexpected response format from Neversight");
    }
    return content;
  } catch (error) {
    console.error("AI analysis error:", error);
    throw error instanceof Error
      ? error
      : new Error("Unknown error during analysis");
  }
}
