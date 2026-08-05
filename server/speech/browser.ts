import { TTSProvider } from "./provider";

export class BrowserTTS implements TTSProvider {
  async speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang = "en-US";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => resolve();

      speechSynthesis.speak(utterance);
    });
  }

  stop(): void {
    speechSynthesis.cancel();
  }
}