import * as THREE from "three";
import { SATURN } from "./saturnConfig";

export interface RingApi {
  group: THREE.Group;
  setColor(color: THREE.ColorRepresentation): void;
  setOpacity(opacity: number): void;
  dispose(): void;
}

export function createRing(): RingApi {
  const ringGroup = new THREE.Group();

  const shape = new THREE.Shape();

const outerRadius =
    SATURN.PLANET_RADIUS +
    SATURN.RING.OUTER_OFFSET;

shape.absarc(
    0,
    0,
    outerRadius,
    0,
    Math.PI * 2
);

const hole = new THREE.Path();

const innerRadius =
    SATURN.PLANET_RADIUS +
    SATURN.RING.INNER_OFFSET;

hole.absarc(
    0,
    0,
    innerRadius,
    0,
    Math.PI * 2
);

shape.holes.push(hole);

const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: SATURN.RING.THICKNESS,          // Thickness of the ring
    bevelEnabled: false,
    curveSegments: 256,
});

  const material = new THREE.MeshBasicMaterial({
    color: 0xd0b08a,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
});

  const brightGeometry = new THREE.RingGeometry(
    2.58,
    2.66,
    512
);

  const brightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffddb0,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false,
});

  const shadowGeometry = new THREE.RingGeometry(
    2.42,
    2.54,
    512
);
  
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x221100,
    transparent:true,
    opacity:0.08,
    side:THREE.DoubleSide,
});

  const fadeGeometry = new THREE.RingGeometry(
    2.95,
    3.20,
    256
);

  const fadeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffb85c,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
    depthWrite: false,
});

const fadeRing = new THREE.Mesh(
    fadeGeometry,
    fadeMaterial
);

fadeRing.rotation.x = THREE.MathUtils.degToRad(
    SATURN.RING.TILT
)
fadeRing.position.y = 0.04;

ringGroup.add(fadeRing);

 const fadeRing2 = fadeRing.clone();

fadeRing2.position.y = -0.04;

ringGroup.add(fadeRing2);
 
  const layers = [
  { y: -0.035, opacity: 0.16 },
  { y: -0.015, opacity: 0.24 },
  { y:  0.000, opacity: 0.32 },
  { y:  0.015, opacity: 0.24 },
  { y:  0.035, opacity: 0.16 },
];

for (const layer of layers) {

    const mesh = new THREE.Mesh(
        geometry,
        material.clone()
    );
    mesh.material.opacity = layer.opacity;
    mesh.position.y = layer.y;
    mesh.rotation.x = THREE.MathUtils.degToRad(
    SATURN.RING.TILT
)
    ringGroup.add(mesh);
}

  const brightRing = new THREE.Mesh(
    brightGeometry,
    brightMaterial
);
   brightRing.rotation.x = THREE.MathUtils.degToRad(
    SATURN.RING.TILT
) 
   ringGroup.add(brightRing);

   const shadowRing = new THREE.Mesh(
    shadowGeometry,
    shadowMaterial
);
shadowRing.rotation.x = THREE.MathUtils.degToRad(
    SATURN.RING.TILT
)
ringGroup.add(shadowRing);

  return {
    group: ringGroup,
    setColor: (color) => material.color.set(color),
    setOpacity: (opacity) => { material.opacity = opacity; },
    dispose: () => {

    geometry.dispose();
    brightGeometry.dispose();
    shadowGeometry.dispose();
    fadeGeometry.dispose();

    ringGroup.traverse((obj) => {

        if (obj instanceof THREE.Mesh) {

            obj.geometry.dispose();

            if (Array.isArray(obj.material)) {

                obj.material.forEach((m) => m.dispose());

            } else {

                obj.material.dispose();

            }
        }
    });

    ringGroup.clear();
    },
  };
}