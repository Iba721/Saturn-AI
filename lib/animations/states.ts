import type { BrainState } from "./types/brain";

export interface AnimationStateConfig {

  transitionDuration: number;

  breathing: {
    frequency: number;
    sharpness: number;
    amplitude: number;
  };

  idle: {
    enabled: boolean;
    strength: number;
  };

  glow: {
    intensity: number;
    radius: number;
    pulse: number;
  };

  ring: {
    rotationSpeed: number;
    wobble: number;
    rippleStrength: number;
    brightness: number;
  };

  visual: {
    coreColor: number;
    ringColor: number;
    shellColor: number;
    dustColor: number;
  };

  bloom: {
    strength: number;
    radius: number;
    threshold: number;
  };
}

export const ANIMATION_STATES: Record<BrainState, AnimationStateConfig> = {
  idle: {

    transitionDuration: 800,

    breathing: {
      frequency: 0.45,
      sharpness: 2.2,
      amplitude: 1,
    },

    idle: {
      enabled: true,
      strength: 1,
    },

    glow: {
      intensity: 1.0,
      radius: 1.0,
      pulse: 1.0,
    },

    ring: {
      rotationSpeed: 1.0,
      wobble: 1.0,
      rippleStrength: 0.0,
      brightness: 1.0,
    },

    visual: {
    coreColor: 0xFFD07A,
    ringColor: 0xD49A3A,
    shellColor: 0xB67A2A,
    dustColor: 0xE6B86A,
},

bloom: {
    strength: 1.25,
    radius: 0.35,
    threshold: 0.65,
},
  },

  listening: {

    transitionDuration: 250,

    breathing: {
      frequency: 0.9,
      sharpness: 1.8,
      amplitude: 1.15,
    },

    idle: {
      enabled: true,
      strength: 0.4,
    },

    glow: {
      intensity: 1.35,
      radius: 1.15,
      pulse: 1.25,
    },

    ring: {
      rotationSpeed: 0.85,
      wobble: 0.25,
      rippleStrength: 0.75,
      brightness: 1.25,
    },

    visual: {
    coreColor: 0xFFF2C5,
    ringColor: 0xFFE7A6,
    shellColor: 0xF5C96B,
    dustColor: 0xFFF5D2,
},

bloom: {
    strength: 1.55,
    radius: 0.40,
    threshold: 0.60,
},
  },

  speaking: {

    transitionDuration: 150,

    breathing: {
      frequency: 0.8,
      sharpness: 2,
      amplitude: 1.1,
    },

    idle: {
      enabled: true,
      strength: 0.6,
    },

    glow: {
      intensity: 1.55,
      radius: 1.2,
      pulse: 2.0,
    },

    ring: {
      rotationSpeed: 1.15,
      wobble: 0.4,
      rippleStrength: 1.0,
      brightness: 1.45,
    },

    visual: {
    coreColor: 0xFFF7E6,
    ringColor: 0xFFC96A,
    shellColor: 0xD7902C,
    dustColor: 0xFFD68C,
},

bloom: {
    strength: 1.85,
    radius: 0.42,
    threshold: 0.58,
},
  },

  executing: {

    transitionDuration: 300,

    breathing: {
      frequency: 0.35,
      sharpness: 6,
      amplitude: 0.4,
    },

    idle: {
      enabled: false,
      strength: 0,
    },

    glow: {
      intensity: 2.25,
      radius: 0.8,
      pulse: 0.15,
    },

    ring: {
      rotationSpeed: 0.0,
      wobble: 0.0,
      rippleStrength: 0.0,
      brightness: 2.0,
    },

    visual: {
    coreColor: 0xFFFFFF,
    ringColor: 0xFFF8E5,
    shellColor: 0xEED8A0,
    dustColor: 0xFFFDF6,
},

bloom: {
    strength: 2.4,
    radius: 0.55,
    threshold: 0.45,
},
  },

  error: {

    transitionDuration: 400,

    breathing: {
      frequency: 1.8,
      sharpness: 0.8,
      amplitude: 1.4,
    },

    idle: {
      enabled: true,
      strength: 0.3,
    },

    glow: {
      intensity: 0.45,
      radius: 1.35,
      pulse: 3.0,
    },

    ring: {
      rotationSpeed: 0.5,
      wobble: 1.8,
      rippleStrength: 0.2,
      brightness: 0.55,
    },

    visual: {
  coreColor: 0xFF00FF,
  ringColor: 0xFF00FF,
  shellColor: 0xFF00FF,
  dustColor: 0xFF00FF
},

bloom: {
    strength: 0.45,
    radius: 0.18,
    threshold: 0.90,
},
  },

  thinking: {

    transitionDuration: 500,

    breathing: {
      frequency: 0.65,
      sharpness: 4,
      amplitude: 0.7,
    },

    idle: {
      enabled: false,
      strength: 0,
    },

    glow: {
      intensity: 1.75,
      radius: 0.9,
      pulse: 0.35,
    },

    ring: {
      rotationSpeed: 0.2,
      wobble: 0.0,
      rippleStrength: 0.0,
      brightness: 0.9,
    },

    visual: {
    coreColor: 0xFFF4D5,
    ringColor: 0xFFB347,
    shellColor: 0xA56218,
    dustColor: 0xFFC870,
},

bloom: {
    strength: 1.05,
    radius: 0.25,
    threshold: 0.72,
   },
  },
};