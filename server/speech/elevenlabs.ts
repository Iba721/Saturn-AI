import { ElevenLabsClient } from "elevenlabs";
import { TTSProvider } from "./provider";
import { formatForSpeech } from "./formatter";

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

export class ElevenLabsTTS implements TTSProvider {
  async speak(text: string): Promise<Response> {
    const formattedText = formatForSpeech(text);

    try {
      const audioStream = await client.textToSpeech.convert(
        process.env.SATURN_VOICE_ID!,
        {
          text,
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128",

          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.9,
            style: 0.15,
            use_speaker_boost: true,
            speed: 0.85,
          },
        }
      );

      const chunks: Buffer[] = [];

for await (const chunk of audioStream) {
  chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
}

const audioBuffer = Buffer.concat(chunks);

return new Response(audioBuffer, {
  headers: {
    "Content-Type": "audio/mpeg",
  },
});
    } catch (err: any) {
      console.error("🔥 ElevenLabs Error:", err);

      if (err.body) {
        const body = await new Response(err.body).text();
        console.error("📄 ElevenLabs Response:", body);
      }

      throw err;
    }
  }
}