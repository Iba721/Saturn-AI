export type BrainState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "executing"
  | "error";

let currentState: BrainState = "idle";

const listeners = new Set<(state: BrainState) => void>();

export function getBrainState(): BrainState {
  return currentState;
}

export function setBrainState(state: BrainState) {
  if (state === currentState) return;
  currentState = state;
  listeners.forEach((listener) => listener(state));
}

export function subscribeBrain(
  listener: (state: BrainState) => void
) {
  listeners.add(listener);

  return () => listeners.delete(listener);
}