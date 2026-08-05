"use client";

import { useState } from "react";

export type BrainState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "executing"
  | "error";

export function useBrain() {
  const [brainState, setBrainState] =
    useState<BrainState>("idle");

  return {
    brainState,
    setBrainState,
  };
}