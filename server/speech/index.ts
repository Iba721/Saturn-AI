import { ElevenLabsTTS } from "./elevenlabs";
import { KokoroTTS } from "./kokoro";

export const elevenLabsTTS = new ElevenLabsTTS();
export const kokoroTTS = new KokoroTTS();

export const tts = elevenLabsTTS;