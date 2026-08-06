import { NextRequest } from "next/server";
import { tts } from "@/server/speech";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || !text.trim()) {
      return new Response("Text is required", {
        status: 400,
      });
    }

    return await tts.speak(text);

  } catch (error) {
    console.error(error);

    return new Response("Speech generation failed", {
      status: 500,
    });
  }
}