import type { AnimationStateConfig } from "./states";

export interface AnimationTransition {
  from: AnimationStateConfig;
  to: AnimationStateConfig;
  progress: number;
}

export function lerp(
  from: number,
  to: number,
  progress: number,
): number {
  return from + (to - from) * progress;
}

export function lerpColor(
  from: number,
  to: number,
  progress: number,
): number {
  const fromColor = {
    r: (from >> 16) & 0xff,
    g: (from >> 8) & 0xff,
    b: from & 0xff,
  };

  const toColor = {
    r: (to >> 16) & 0xff,
    g: (to >> 8) & 0xff,
    b: to & 0xff,
  };

  const r = Math.round(lerp(fromColor.r, toColor.r, progress));
  const g = Math.round(lerp(fromColor.g, toColor.g, progress));
  const b = Math.round(lerp(fromColor.b, toColor.b, progress));

  return (r << 16) | (g << 8) | b;
}

export function getTransitionProgress(
  elapsed: number,
  duration: number,
): number {
  if (duration <= 0) return 1;

  const linear = Math.min(
    Math.max(elapsed / duration, 0),
    1,
  );

  // Smoothstep
  return linear * linear * (3 - 2 * linear);
}

export function interpolateAnimationState(
  from: AnimationStateConfig,
  to: AnimationStateConfig,
  progress: number,
): AnimationStateConfig {
  const p = Math.max(0, Math.min(1, progress));

  return {
    transitionDuration: to.transitionDuration,

    breathing: {
      frequency: lerp(
        from.breathing.frequency,
        to.breathing.frequency,
        p,
      ),
      sharpness: lerp(
        from.breathing.sharpness,
        to.breathing.sharpness,
        p,
      ),
      amplitude: lerp(
        from.breathing.amplitude,
        to.breathing.amplitude,
        p,
      ),
    },

    idle: {
      enabled: p < 0.5
        ? from.idle.enabled
        : to.idle.enabled,

      strength: lerp(
        from.idle.strength,
        to.idle.strength,
        p,
      ),
    },

    glow: {
      intensity: lerp(
        from.glow.intensity,
        to.glow.intensity,
        p,
      ),
      radius: lerp(
        from.glow.radius,
        to.glow.radius,
        p,
      ),
      pulse: lerp(
        from.glow.pulse,
        to.glow.pulse,
        p,
      ),
    },

    ring: {
      rotationSpeed: lerp(
        from.ring.rotationSpeed,
        to.ring.rotationSpeed,
        p,
      ),
      wobble: lerp(
        from.ring.wobble,
        to.ring.wobble,
        p,
      ),
      rippleStrength: lerp(
        from.ring.rippleStrength,
        to.ring.rippleStrength,
        p,
      ),
      brightness: lerp(
        from.ring.brightness,
        to.ring.brightness,
        p,
      ),
    },

    visual: {
      coreColor: lerpColor(
        from.visual.coreColor,
        to.visual.coreColor,
        p,
      ),
      ringColor: lerpColor(
        from.visual.ringColor,
        to.visual.ringColor,
        p,
      ),
      shellColor: lerpColor(
        from.visual.shellColor,
        to.visual.shellColor,
        p,
      ),
      dustColor: lerpColor(
        from.visual.dustColor,
        to.visual.dustColor,
        p,
      ),
    },

    bloom: {
      strength: lerp(
        from.bloom.strength,
        to.bloom.strength,
        p,
      ),
      radius: lerp(
        from.bloom.radius,
        to.bloom.radius,
        p,
      ),
      threshold: lerp(
        from.bloom.threshold,
        to.bloom.threshold,
        p,
      ),
    },
  };
}