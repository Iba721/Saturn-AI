import { GoogleGenAI } from "@google/genai";
import type { AIProvider } from "./provider";
import { SYSTEM_PROMPT } from "@/server/prompts/system";

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.SATURN_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("SATURN_GEMINI_API_KEY is missing.");
    }

    this.ai = new GoogleGenAI({
      apiKey,
    });
  }

  async chat(message: string): Promise<string> {
    const model =
  process.env.SATURN_MODEL ?? "gemini-3.6-flash";

const response = await this.ai.models.generateContent({
  model,
  config: {
    systemInstruction: SYSTEM_PROMPT,
  },
  contents: message,
});

    return response.text ?? "";
  }
}