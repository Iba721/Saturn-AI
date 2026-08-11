import type { ConversationMessage } from "./conversation";

export async function chat(
  message: string,
  history: ConversationMessage[] = [],
) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      history,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error);
  }

  return data.reply;
}