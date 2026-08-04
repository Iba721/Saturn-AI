"use client";

import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

export function useVoice() {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const startListening = () => {
  if (!browserSupportsSpeechRecognition) {
    console.error("Saturn: this browser cannot hear you.");
    return;
  }
  resetTranscript();
  SpeechRecognition.startListening({
    continuous: false,
    language: "en-IN",
  });
};

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  return {
    transcript,
    listening,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition,
  };
}