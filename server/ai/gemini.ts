import { GoogleGenAI } from "@google/genai";
import type { AIProvider } from "./provider";
import { SYSTEM_PROMPT } from "@/server/prompts/system";
import type { ConversationMessage } from "@/lib/conversation";

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

  async chat(
    message: string,
    history: ConversationMessage[],
  ): Promise<string> {
    const model =
      process.env.SATURN_MODEL ?? "gemini-3.6-flash";

    const contents: Array<{
  role: "user" | "model";
  parts: { text: string }[];
}> = [
  ...history.map((item): {
    role: "user" | "model";
    parts: { text: string }[];
  } => ({
    role: item.role === "assistant" ? "model" : "user",
    parts: [{ text: item.content }],
  })),
  {
    role: "user",
    parts: [{ text: message }],
  },
];

    const response = await this.ai.models.generateContent({
      model,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
      contents,
    });

    return response.text ?? "";
  }
}