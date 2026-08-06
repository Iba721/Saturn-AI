import { ElevenLabsClient } from "elevenlabs";
import { TTSProvider } from "./provider";

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

export class ElevenLabsTTS implements TTSProvider {
  async speak(text: string): Promise<Response> {
    const audioStream = await client.textToSpeech.convert(
      process.env.SATURN_VOICE_ID!,
      {
        text,
        model_id: "eleven_multilingual_v2",
        output_format: "mp3_44100_128",
      }
    );

    return new Response(audioStream, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  }
}