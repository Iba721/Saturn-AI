import * as THREE from "three";

export const COLORS = {
  BRIGHT: 0xffaa30,
  MID: 0xdd7700,
  DIM: 0x884400,
  FAINT: 0x553300,
  HOT: 0xffcc66,
} as const;

export function lineMat(
  color: THREE.ColorRepresentation,
  opacity = 1
) {
  return new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}