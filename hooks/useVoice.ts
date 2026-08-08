"use client";

import { useCallback } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const WAKE_WORD = "hey saturn";

export function useVoice() {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const startWakeListening = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      console.error("Saturn: this browser cannot hear you.");
      return;
    }

    console.log("🎤 Starting wake-word recognition...");

    resetTranscript();

    SpeechRecognition.startListening({
      continuous: true,
      language: "en-IN",
    });
  }, [browserSupportsSpeechRecognition, resetTranscript]);

  const startCommandListening = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      console.error("Saturn: this browser cannot hear you.");
      return;
    }

    console.log("🎤 Starting command recognition...");

    resetTranscript();

    SpeechRecognition.startListening({
      continuous: false,
      language: "en-IN",
    });
  }, [browserSupportsSpeechRecognition, resetTranscript]);

  const stopListening = useCallback(() => {
    SpeechRecognition.stopListening();
  }, []);

  const containsWakeWord = useCallback((text: string) => {
    return text
      .toLowerCase()
      .replace(/[.,!?]/g, "")
      .includes(WAKE_WORD);
  }, []);

  const extractCommand = useCallback((text: string) => {
    const normalized = text
      .toLowerCase()
      .replace(/[.,!?]/g, "");

    const index = normalized.indexOf(WAKE_WORD);

    if (index === -1) {
      return text;
    }

    return text.slice(index + WAKE_WORD.length).trim();
  }, []);

  return {
    transcript,
    listening,
    startWakeListening,
    startCommandListening,
    stopListening,
    resetTranscript,
    containsWakeWord,
    extractCommand,
    browserSupportsSpeechRecognition,
  };
}