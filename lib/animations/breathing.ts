export interface BreathingState {
  outer: number;
  middle: number;
  inner: number;
  glow: number;
}

export interface BreathingParams {
  frequency: number; // how fast the cycle repeats
  sharpness: number; // curve exponent — higher = snappier, lower = smoother
  amplitude: number; // overall scale of the motion, 1 = idle default
}

const IDLE_BREATHING: BreathingParams = {
  frequency: 0.45,
  sharpness: 2.2,
  amplitude: 1,
};

export function getBreathingState(
  time: number,
  params: BreathingParams = IDLE_BREATHING
): BreathingState {
  const breathe = Math.pow(
    Math.sin(time * params.frequency) * 0.5 + 0.5,
    params.sharpness
  ) * params.amplitude;

  return {
    outer: breathe * 0.003,
    middle: breathe * 0.006,
    inner: breathe * 0.015,
    glow: 0.92 + breathe * 0.18,
  };
}