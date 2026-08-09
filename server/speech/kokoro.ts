import { TTSProvider } from "./provider";

export class KokoroTTS implements TTSProvider {
  async speak(text: string): Promise<Response> {
    const response = await fetch("http://127.0.0.1:8765/speak", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Kokoro TTS failed (${response.status}): ${errorText}`,
      );
    }

    if (!response.body) {
      throw new Error("Kokoro TTS returned no audio stream.");
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/pcm",
        "X-Audio-Sample-Rate":
          response.headers.get("X-Audio-Sample-Rate") ?? "24000",
        "X-Audio-Channels":
          response.headers.get("X-Audio-Channels") ?? "1",
        "X-Audio-Bit-Depth":
          response.headers.get("X-Audio-Bit-Depth") ?? "16",
      },
    });
  }
}