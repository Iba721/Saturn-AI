import { ANIMATION_STATES } from "./states";
import type { BrainState } from "./types/brain";

export function getAnimationState(state: BrainState) {
  const config = ANIMATION_STATES[state];

  if (!config) {
    console.warn(`No animation config for state: ${state}`);
    return ANIMATION_STATES.idle;
  }

  return config;
}