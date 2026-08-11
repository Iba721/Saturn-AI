import { ai } from "./ai";
import { setBrainState } from "./brain";
import type { ConversationMessage } from "@/lib/conversation";

export async function processUserMessage(
  message: string,
  history: ConversationMessage[] = [],
) {
  if (!message.trim()) return "";

  try {
    setBrainState("thinking");

    const reply = await ai.chat(message, history);

    setBrainState("speaking");

    return reply;
  } catch (error) {
    setBrainState("error");
    throw error;
  } finally {
    setBrainState("idle");
  }
}