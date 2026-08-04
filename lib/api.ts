export async function chat(message: string) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error);
  }

  return data.reply;
}