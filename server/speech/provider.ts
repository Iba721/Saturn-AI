export interface TTSProvider {
  speak(text: string): Promise<Response>;
}