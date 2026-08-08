import type { BrainState } from "./animations/types/brain";

type Listener = (state: BrainState) => void;

class BrainStateManager {
  private state: BrainState = "error";
  private listeners = new Set<Listener>();

  get current() {
    return this.state;
  }

  setState(state: BrainState) {
    if (state === this.state) return;
    this.state = state;
    this.listeners.forEach((fn) => fn(state));
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const brainState = new BrainStateManager();