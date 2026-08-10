"use client";

import { useRef, useState } from "react";

const SAMPLE_RATE = 24000;
const CHANNELS = 1;
const BYTES_PER_SAMPLE = 2;

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef(0);

  // Generation token: every speak() call gets a unique id.
  // A call only acts on shared state (scheduling audio, flipping
  // `speaking`) while its id still matches the latest one. This is
  // what stopRequestedRef alone couldn't do — a boolean has no memory
  // of *which* call set it, so a newer call resetting it to false
  // would silently un-stop an older call still mid-stream.
  const speakTokenRef = useRef(0);

  const stopActiveSources = () => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
      source.disconnect();
    });
    activeSourcesRef.current = [];
  };

  const stop = () => {
    // Bump the token so any in-flight speak() call recognizes it has
    // been superseded, even if it never gets another chance to read
    // a "stop requested" flag before this function returns.
    speakTokenRef.current += 1;

    stopActiveSources();
    nextStartTimeRef.current = audioContextRef.current?.currentTime ?? 0;
    setSpeaking(false);
  };

  const speak = async (text: string) => {
    if (!text.trim()) return;

    // Claim this call's slot. Any older, still-running speak() call
    // will see its captured token no longer matches and bail out.
    stop();
    const myToken = ++speakTokenRef.current;

    setSpeaking(true);

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioContext = audioContextRef.current;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        // Superseded by a newer speak() or an explicit stop() — abandon
        // this stream instead of continuing to schedule audio into
        // state a newer call now owns.
        if (speakTokenRef.current !== myToken) {
          await reader.cancel();
          return;
        }

        const { done, value } = await reader.read();
        if (done) break;
        if (!value || value.length === 0) continue;

        const combined = new Uint8Array(pendingBytes.length + value.length);
        combined.set(pendingBytes);
        combined.set(value, pendingBytes.length);

        const usableLength = combined.length - (combined.length % BYTES_PER_SAMPLE);
        const pcmBytes = combined.slice(0, usableLength);
        pendingBytes = combined.slice(usableLength);

        if (pcmBytes.length === 0) continue;

        const sampleCount = pcmBytes.length / BYTES_PER_SAMPLE;
        const samples = new Float32Array(sampleCount);
        const view = new DataView(pcmBytes.buffer, pcmBytes.byteOffset, pcmBytes.byteLength);

        for (let i = 0; i < sampleCount; i++) {
          samples[i] = view.getInt16(i * BYTES_PER_SAMPLE, true) / 32768;
        }

        const audioBuffer = audioContext.createBuffer(CHANNELS, sampleCount, SAMPLE_RATE);
        audioBuffer.copyToChannel(samples, 0);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        const startTime = Math.max(nextStartTimeRef.current, audioContext.currentTime);
        source.start(startTime);

        activeSourcesRef.current.push(source);
        source.onended = () => {
          activeSourcesRef.current = activeSourcesRef.current.filter((item) => item !== source);
        };

        nextStartTimeRef.current = startTime + audioBuffer.duration;
        scheduledSomething = true;
      }

      if (speakTokenRef.current !== myToken) return;

      if (!scheduledSomething) {
        throw new Error("Kokoro returned no audio.");
      }

      const remaining = Math.max(0, nextStartTimeRef.current - audioContext.currentTime);
      if (remaining > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, remaining * 1000));
      }

      if (speakTokenRef.current === myToken) {
        setSpeaking(false);
      }
    } catch (err) {
      console.error(err);

      if (speakTokenRef.current === myToken) {
        stopActiveSources();
        setSpeaking(false);
      }

      throw err;
    }
  };

  return { speak, stop, speaking };
}