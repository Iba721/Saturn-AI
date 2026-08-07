import * as THREE from "three";

/**
 * Creates a latitude ring on a sphere.
 */
export function latRing(
  radius: number,
  lat: number,
  segs = 120
): THREE.BufferGeometry {
  const r = radius * Math.cos(lat);
  const y = radius * Math.sin(lat);

  const pts: THREE.Vector3[] = [];

  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;

    pts.push(
      new THREE.Vector3(
        r * Math.cos(a),
        y,
        r * Math.sin(a)
      )
    );
  }

  return new THREE.BufferGeometry().setFromPoints(pts);
}

/**
 * Creates a meridian on a sphere.
 */
export function meridian(
  radius: number,
  lon: number,
  segs = 120
): THREE.BufferGeometry {

  const pts: THREE.Vector3[] = [];

  for (let i = 0; i <= segs; i++) {

    const lat = (i / segs) * Math.PI - Math.PI / 2;

    pts.push(
      new THREE.Vector3(
        radius * Math.cos(lat) * Math.cos(lon),
        radius * Math.sin(lat),
        radius * Math.cos(lat) * Math.sin(lon),
      )
    );
  }

  return new THREE.BufferGeometry().setFromPoints(pts);
}

/**
 * Creates one rectangular grid panel on the sphere surface.
 */
export function createSpherePanel(
  latCenter: number,
  lonCenter: number,
  latSpan: number,
  lonSpan: number,
  radius: number,
  material: THREE.Material,
  divisions = 4,
): THREE.Group {

  const group = new THREE.Group();

  // Horizontal lines
  for (let i = 0; i <= divisions; i++) {

    const lat =
      latCenter - latSpan / 2 + (i / divisions) * latSpan;

    const pts: THREE.Vector3[] = [];

    for (let j = 0; j <= divisions * 4; j++) {

      const lon =
        lonCenter - lonSpan / 2 +
        (j / (divisions * 4)) * lonSpan;

      pts.push(
        new THREE.Vector3(
          radius * Math.cos(lat) * Math.cos(lon),
          radius * Math.sin(lat),
          radius * Math.cos(lat) * Math.sin(lon),
        )
      );
    }

    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        material
      )
    );
  }

  // Vertical lines
  for (let j = 0; j <= divisions; j++) {

    const lon =
      lonCenter - lonSpan / 2 + (j / divisions) * lonSpan;

    const pts: THREE.Vector3[] = [];

    for (let i = 0; i <= divisions * 4; i++) {

      const lat =
        latCenter - latSpan / 2 +
        (i / (divisions * 4)) * latSpan;

      pts.push(
        new THREE.Vector3(
          radius * Math.cos(lat) * Math.cos(lon),
          radius * Math.sin(lat),
          radius * Math.cos(lat) * Math.sin(lon),
        )
      );
    }

    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        material
      )
    );
  }

  return group;
}