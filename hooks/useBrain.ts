"use client";

import { useEffect, useState } from "react";
import type { BrainState } from "@/lib/animations/types/brain";
import { brainState } from "@/lib/brainState";

export function useBrain() {
  const [state, setState] = useState<BrainState>(
    brainState.current,
  );

  useEffect(() => {
    return brainState.subscribe(setState);
  }, []);

  return {
    brainState: state,

    setBrainState: (nextState: BrainState) => {
      brainState.setState(nextState);
    },
  };
}