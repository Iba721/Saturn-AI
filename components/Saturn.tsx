"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createOrbScene, type OrbSceneApi } from "@/lib/orbScene";
import { HandTracker, type TrackerStatus } from "@/lib/handTracker";
import { useVoice } from "@/hooks/useVoice";
import { useSpeech } from "@/hooks/useSpeech";
import { chat } from "@/lib/api";
import { useBrain } from "@/hooks/useBrain";
import Image from "next/image";

type CameraState = "off" | "starting" | "on" | "error";

const MODE_LABEL: Record<TrackerStatus["mode"], string> = {
  idle: "STANDBY",
  spin: "SPIN",
  zoom: "ZOOM",
};

export default function Saturn() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<OrbSceneApi | null>(null);
  const trackerRef = useRef<HandTracker | null>(null);
  const {
  transcript,
  listening,
  startWakeListening,
  startCommandListening,
  stopListening,
  resetTranscript,
  containsWakeWord,
  extractCommand,
} = useVoice();
  const { speak } = useSpeech();
  const { brainState, setBrainState } = useBrain();

  const [camera, setCamera] = useState<CameraState>("off");
  const [status, setStatus] = useState<TrackerStatus>({ hands: 0, mode: "idle" });
  const [error, setError] = useState<string | null>(null);
  const lastTranscriptRef = useRef("");
  const wakeListeningRef = useRef(false);
  const wakeDetectedRef = useRef(false);
  const commandListeningRef = useRef(false);
  const commandStartTranscriptRef = useRef("");
  const conversationActiveRef = useRef(false);
  const conversationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scene = createOrbScene(container);
    sceneRef.current = scene;
    return () => {
      trackerRef.current?.stop();
      trackerRef.current = null;
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
  console.log("🪐 Starting Saturn wake listener...");

  startWakeListening();

  return () => {
    stopListening();
  };
}, [startWakeListening, stopListening]);

  const stopGestures = useCallback(() => {
    trackerRef.current?.stop();
    trackerRef.current = null;
    setCamera("off");
    setStatus({ hands: 0, mode: "idle" });
  }, []);

  const startGestures = useCallback(async () => {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay || trackerRef.current) return;

    setCamera("starting");
    setError(null);

    const tracker = new HandTracker(video, overlay, {
      onRotate: (dt, dp) => sceneRef.current?.rotateBy(dt, dp),
      onZoom: (factor) => sceneRef.current?.zoomBy(factor),
      onStatus: setStatus,
    });
    trackerRef.current = tracker;

    try {
      await tracker.start();
      setCamera("on");
    } catch (err) {
      trackerRef.current = null;
      tracker.stop();
      setCamera("error");
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "CAMERA ACCESS DENIED"
          : "TRACKING INIT FAILED",
      );
    }
  }, []);

  const toggleGestures = useCallback(() => {
    if (trackerRef.current) stopGestures();
    else void startGestures();
  }, [startGestures, stopGestures]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "+":
        case "=":
          sceneRef.current?.zoomIn();
          break;
        case "-":
        case "_":
          sceneRef.current?.zoomOut();
          break;
        case "r":
        case "R":
          sceneRef.current?.resetView();
          break;
        case "g":
        case "G":
          toggleGestures();
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleGestures, startCommandListening]);

const endConversation = useCallback(() => {
  console.log("🪐 Conversation ended.");

  if (conversationTimeoutRef.current) {
    clearTimeout(conversationTimeoutRef.current);
    conversationTimeoutRef.current = null;
  }

  conversationActiveRef.current = false;
  commandListeningRef.current = false;
  wakeDetectedRef.current = false;
  lastTranscriptRef.current = "";

  resetTranscript();
  stopListening();

  setBrainState("idle");

  startWakeListening();
}, [
  resetTranscript,
  stopListening,
  startWakeListening,
  setBrainState,
]);

const resetConversationTimeout = useCallback(() => {
  if (conversationTimeoutRef.current) {
    clearTimeout(conversationTimeoutRef.current);
  }

  conversationTimeoutRef.current = setTimeout(() => {
    console.log("🪐 40 seconds passed. Conversation ended.");
    endConversation();
  }, 40_000);
}, [endConversation]);

useEffect(() => {
  async function handleVoice() {
    if (!transcript.trim()) return;

    const text = transcript.trim();

    console.log("🎤 Voice:", text);

    // ================================
    // WAITING FOR "HEY SATURN"
    // ================================

    if (!wakeDetectedRef.current) {
      if (!containsWakeWord(text)) {
        return;
      }

      console.log("🪐 WAKE WORD DETECTED!");

      wakeDetectedRef.current = true;

      const command = extractCommand(text);

      console.log("🪐 Extracted command:", command);

      stopListening();

      // "Hey Saturn" with no command
      if (!command) {
  setBrainState("speaking");

  try {
    await speak("Yes?");
  } catch (error) {
    console.error("Saturn wake response failed:", error);
    setBrainState("error");
    return;
  }

  setBrainState("idle");

  resetTranscript();

  conversationActiveRef.current = true;
  commandListeningRef.current = true;
  commandStartTranscriptRef.current = text;

  startCommandListening();
  resetConversationTimeout();

  return;
}

      // "Hey Saturn, hello"
      conversationActiveRef.current = true;
      commandStartTranscriptRef.current = text;

      await processCommand(command);

      return;
    }

    // ================================
    // WAITING FOR COMMAND
    // ================================

        if (commandListeningRef.current) {
  if (text === commandStartTranscriptRef.current) {
    return;
  }

  console.log("🗣️ COMMAND RECEIVED:", text);
  console.log("🛑 END COMMAND CHECK:", JSON.stringify(text));

  if (text.toLowerCase().trim() === "nothing") {
    endConversation();
    return;
  }

  await processCommand(text);

  return;
}
  }

  async function processCommand(command: string) {
    try {
      console.log("You:", command);

      commandListeningRef.current = false;

      stopListening();

      setBrainState("thinking");

      const reply = await chat(command);

      console.log("Saturn:", reply);

      setBrainState("speaking");

      await speak(reply);

      setBrainState("idle");

    } catch (error) {
      console.error(error);

      setBrainState("error");

      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";

      try {
  await speak(message);
} catch (speakError) {
  console.error(
    "Saturn failed to speak the error too:",
    speakError,
  );
} finally {
  setBrainState("idle");
}
    } finally {
  lastTranscriptRef.current = "";

  resetTranscript();

  if (conversationActiveRef.current) {
    wakeDetectedRef.current = true;
    commandListeningRef.current = true;

    resetConversationTimeout();
    startCommandListening();
  } else {
    wakeDetectedRef.current = false;
    commandListeningRef.current = false;
  }
}
  }
  void handleVoice();
}, [
  transcript,
  listening,
  containsWakeWord,
  extractCommand,
  stopListening,
  startCommandListening,
  resetTranscript,
  speak,
  setBrainState,
  resetConversationTimeout,
  endConversation,
]);


  const cameraOn = camera === "on";

  return (
    <>
      <div ref={containerRef} className="orb-root" />

      <div className="overlay-vignette" />
      <div className="overlay-grain" />
      <div className="overlay-scanlines" />

      <div className="hud hud-title">
  <Image
    src="/branding/logo.svg"
    alt="Saturn"
    width={190}
    height={110}
    priority
  />

  {listening && (
    <div
      style={{
        fontSize: "0.8rem",
        color: "#00d4ff",
        marginTop: "6px",
      }}
    >
      🎤 LISTENING...
    </div>
  )}
</div>

      <div className="hud hud-hint">
        <div>
          <span className="key">DRAG</span> spin&nbsp;&nbsp;
          <span className="key">SCROLL</span> zoom
        </div>
        {cameraOn ? (
          <div>
            <span className="key">PINCH + MOVE</span> spin&nbsp;&nbsp;
            <span className="key">PINCH BOTH HANDS ± SPREAD</span> zoom
          </div>
        ) : (
          <div>
            <span className="key">G</span> hand gestures&nbsp;&nbsp;
            <span className="key">R</span> reset&nbsp;&nbsp;
            <span className="key">+/−</span> zoom
          </div>
        )}
      </div>

      <div className="hud hud-controls">
        <div className={`camera-panel${cameraOn ? " visible" : ""}`}>
          {/* Mirrored preview so it behaves like a mirror */}
          <video ref={videoRef} muted playsInline className="camera-video" />
          <canvas ref={overlayRef} width={208} height={156} className="camera-overlay" />
          <div className="camera-status">
            {status.hands > 0
              ? `${status.hands} HAND${status.hands > 1 ? "S" : ""} · ${MODE_LABEL[status.mode]}`
              : "SHOW HANDS"}
          </div>
        </div>

        {error && <div className="hud-error">{error}</div>}

        <div className="hud-row">
          <button
            type="button"
            className="hud-btn"
            aria-pressed={cameraOn}
            onClick={toggleGestures}
            disabled={camera === "starting"}
          >
            {camera === "starting" ? "INITIALIZING…" : cameraOn ? "GESTURES ON" : "GESTURES OFF"}
          </button>
        </div>
        <div className="hud-row">
          <button type="button" className="hud-btn" onClick={() => sceneRef.current?.zoomIn()} aria-label="Zoom in">
            +
          </button>
          <button type="button" className="hud-btn" onClick={() => sceneRef.current?.zoomOut()} aria-label="Zoom out">
            −
          </button>
          <button type="button" className="hud-btn" onClick={() => sceneRef.current?.resetView()}>
            RESET
          </button>
        </div>
      </div>
    </>
  );
}
