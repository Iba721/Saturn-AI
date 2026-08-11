import type { ConversationMessage } from "@/lib/conversation";

export interface AIProvider {
  chat(
    message: string,
    history: ConversationMessage[],
  ): Promise<string>;
}