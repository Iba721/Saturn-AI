import * as THREE from "three";

export interface RingApi {
  group: THREE.Group;
  setColor(color: THREE.ColorRepresentation): void;
  setOpacity(opacity: number): void;
  dispose(): void;
}

export function createRing(): RingApi {
  const ringGroup = new THREE.Group();

  const geometry = new THREE.TorusGeometry(2.35, 0.015, 16, 256);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffaa30,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
  });

  const torus = new THREE.Mesh(geometry, material);
  torus.rotation.x = THREE.MathUtils.degToRad(72);
  ringGroup.add(torus);

  return {
    group: ringGroup,
    setColor: (color) => material.color.set(color),
    setOpacity: (opacity) => { material.opacity = opacity; },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}