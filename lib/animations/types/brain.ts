export const BRAIN_STATES = [
  "idle",
  "listening",
  "thinking",
  "speaking",
  "executing",
  "error",
] as const;

export type BrainState =
  typeof BRAIN_STATES[number];