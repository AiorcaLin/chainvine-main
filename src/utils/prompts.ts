import { SUPPER_PROMPT } from "@/services/audit/prompts";

// Create a prompt with super prompt
export const createPromptWithSupperPrompt = (prompt: string) => {
  return SUPPER_PROMPT + "\n\n" + prompt;
};
