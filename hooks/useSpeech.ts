"use client";

import { useRef, useState } from "react";

const SAMPLE_RATE = 24000;
const CHANNELS = 1;
const BYTES_PER_SAMPLE = 2;

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const stopRequestedRef = useRef(false);
  const nextStartTimeRef = useRef(0);

  const speak = async (text: string) => {
    if (!text.trim()) return;

    setSpeaking(true);
    stopRequestedRef.current = false;

    try {
      // Stop any previous speech.
      stop();

      stopRequestedRef.current = false;
      setSpeaking(true);

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioContext = audioContextRef.current;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const response = await fetch("/api/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech.");
      }

      if (!response.body) {
        throw new Error("Speech stream is unavailable.");
      }

      const reader = response.body.getReader();

      let pendingBytes = new Uint8Array(0);
      let scheduledSomething = false;

      nextStartTimeRef.current = audioContext.currentTime + 0.05;

      while (true) {
        if (stopRequestedRef.current) {
          await reader.cancel();
          return;
        }

        const { done, value } = await reader.read();

        if (done) break;

        if (!value || value.length === 0) {
          continue;
        }

        // Combine leftover bytes from the previous chunk
        // with the new network chunk.
        const combined = new Uint8Array(
          pendingBytes.length + value.length,
        );

        combined.set(pendingBytes);
        combined.set(value, pendingBytes.length);

        // PCM16 samples are 2 bytes each.
        const usableLength =
          combined.length -
          (combined.length % BYTES_PER_SAMPLE);

        const pcmBytes = combined.slice(0, usableLength);

        pendingBytes = combined.slice(usableLength);

        if (pcmBytes.length === 0) {
          continue;
        }

        // Convert signed 16-bit PCM → Float32.
        const sampleCount =
          pcmBytes.length / BYTES_PER_SAMPLE;

        const samples = new Float32Array(sampleCount);

        const view = new DataView(
          pcmBytes.buffer,
          pcmBytes.byteOffset,
          pcmBytes.byteLength,
        );

        for (let i = 0; i < sampleCount; i++) {
          samples[i] =
            view.getInt16(i * BYTES_PER_SAMPLE, true) /
            32768;
        }

        const audioBuffer =
          audioContext.createBuffer(
            CHANNELS,
            sampleCount,
            SAMPLE_RATE,
          );

        audioBuffer.copyToChannel(samples, 0);

        const source =
          audioContext.createBufferSource();

        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        const startTime = Math.max(
          nextStartTimeRef.current,
          audioContext.currentTime,
        );

        source.start(startTime);

        activeSourcesRef.current.push(source);

        source.onended = () => {
          activeSourcesRef.current =
            activeSourcesRef.current.filter(
              (item) => item !== source,
            );
        };

        nextStartTimeRef.current =
          startTime + audioBuffer.duration;

        scheduledSomething = true;
      }

      // If the stream ended without producing audio,
      // treat that as a failure.
      if (!scheduledSomething) {
        throw new Error("Kokoro returned no audio.");
      }

      // Wait until all scheduled audio has finished.
      const remaining =
        Math.max(
          0,
          nextStartTimeRef.current -
            audioContext.currentTime,
        );

      if (remaining > 0) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, remaining * 1000);
        });
      }

      if (!stopRequestedRef.current) {
        setSpeaking(false);
      }
    } catch (err) {
      console.error(err);

      stopRequestedRef.current = true;

      activeSourcesRef.current.forEach((source) => {
        try {
          source.stop();
        } catch {
          // Already stopped.
        }

        source.disconnect();
      });

      activeSourcesRef.current = [];

      setSpeaking(false);

      throw err;
    }
  };

  const stop = () => {
    stopRequestedRef.current = true;

    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Already stopped.
      }

      source.disconnect();
    });

    activeSourcesRef.current = [];

    nextStartTimeRef.current =
      audioContextRef.current?.currentTime ?? 0;

    setSpeaking(false);
  };

  return {
    speak,
    stop,
    speaking,
  };
}