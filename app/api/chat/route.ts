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
  } catch (error) {
    console.error("Saturn API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate response.",
      },
      { status: 500 }
    );
  }
}