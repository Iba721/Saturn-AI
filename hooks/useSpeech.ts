"use client";

import { useEffect, useState } from "react";
import { tts } from "@/server/speech";

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      tts.stop();
    };
  }, []);

  const speak = async (text: string) => {
    if (!text.trim()) return;

    setSpeaking(true);

    try {
      await tts.speak(text);
    } finally {
      setSpeaking(false);
    }
  };

  const stop = () => {
    tts.stop();
    setSpeaking(false);
  };

  return {
    speak,
    stop,
    speaking,
  };
}