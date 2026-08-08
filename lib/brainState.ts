import type { BrainState } from "./animations/types/brain";
export type BrainStateListener = (state: BrainState) => void;

let current: BrainState = "idle";

const listeners = new Set<BrainStateListener>();

export const brainState = {
  get current(): BrainState {
    return current;
  },

setState(state: BrainState) {
  console.log(
    "🧠 STATE CHANGE:",
    current,
    "→",
    state,
  );

  if (state === current) return;

  current = state;

  listeners.forEach((listener) => {
    listener(state);
  });
},

  subscribe(listener: BrainStateListener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};