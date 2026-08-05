import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/server/ai";
import { processUserMessage } from "@/server/conversation";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    const reply = await processUserMessage(message);

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error: any) {
  console.error("Saturn API Error:", error);

  if (error?.status === 429) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Saturn has reached its current Gemini free-tier quota. Please wait before trying again.",
      },
      { status: 429 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error:
        error?.message ?? "An unexpected error occurred.",
    },
    { status: 500 }
  );
 }
}