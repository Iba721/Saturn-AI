import type { BrainState } from "./types/brain";
import type { AnimationStateConfig } from "./states";
import { ANIMATION_STATES } from "./states";
import { getTransitionProgress, interpolateAnimationState,} from "./transitions";

export class AnimationController {
  private currentState: BrainState;
  private fromState: BrainState;
  private toState: BrainState;

  private transitionStart = 0;
  private transitioning = false;

  constructor(initialState: BrainState = "idle") {
    this.currentState = initialState;
    this.fromState = initialState;
    this.toState = initialState;
  }

  setState(state: BrainState, now: number): void {
    if (state === this.toState && this.transitioning) {
      return;
    }

    if (state === this.currentState && !this.transitioning) {
      return;
    }

    this.fromState = this.currentState;
    this.toState = state;

    this.transitionStart = now;
    this.transitioning = true;
  }

  update(now: number): AnimationStateConfig {
    if (!this.transitioning) {
      return ANIMATION_STATES[this.currentState];
    }

    const from = ANIMATION_STATES[this.fromState];
const to = ANIMATION_STATES[this.toState];

if (!from || !to) {
  console.error(
    "Invalid animation state:",
    {
      fromState: this.fromState,
      toState: this.toState,
    },
  );

  this.currentState = "idle";
  this.fromState = "idle";
  this.toState = "idle";
  this.transitioning = false;

  return ANIMATION_STATES.idle;
}

const elapsed = now - this.transitionStart;

const progress = getTransitionProgress(
  elapsed,
  to.transitionDuration,
);

    const animation = interpolateAnimationState(
      from,
      to,
      progress,
    );

    if (progress >= 1) {
      this.currentState = this.toState;
      this.transitioning = false;

      return ANIMATION_STATES[this.currentState];
    }

    return animation;
  }

  getState(): BrainState {
    return this.currentState;
  }

  getTargetState(): BrainState {
    return this.toState;
  }

  isTransitioning(): boolean {
    return this.transitioning;
  }
}