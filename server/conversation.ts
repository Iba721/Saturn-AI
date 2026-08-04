import { ai } from "./ai";
import { setBrainState } from "./brain";

export async function processUserMessage(message: string) {
  if (!message.trim()) return "";

  try {
    setBrainState("thinking");
    const reply = await ai.chat(message);
    setBrainState("speaking");
    return reply;
  } catch (error) {
    setBrainState("error");
    throw error;
  } finally {
    setBrainState("idle");
  }
}