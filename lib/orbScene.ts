import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { createRing } from "./ring";
import { COLORS, lineMat } from "./materials";
import { latRing, meridian, createSpherePanel } from "./geometry";
import { SATURN } from "./saturnConfig";
import {  getAnimationState, getBreathingState,  getIdleState } from "./animations";
import { brainState } from "./brainState";
import { AnimationController } from "./animations/controller";
import type { BrainState } from "./animations/types/brain";

export interface OrbSceneApi {
  /** Rotate the camera around the orb by the given angles (radians). */
  rotateBy(deltaTheta: number, deltaPhi: number): void;
  /** Multiply the camera distance by `factor` (<1 zooms in, >1 zooms out). */
  zoomBy(factor: number): void;
  zoomIn(): void;
  zoomOut(): void;
  resetView(): void;
  dispose(): void;
}

const HOME_POSITION = new THREE.Vector3(0, 0.5, 5.5);
const MIN_DISTANCE = 0.6;
const MAX_DISTANCE = 40;

export function createOrbScene(container: HTMLElement): OrbSceneApi {
  const width = container.clientWidth;
  const height = container.clientHeight;

  // ——— SCENE ———
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 500);
  camera.position.copy(HOME_POSITION);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  container.appendChild(renderer.domElement);

  // ——— POST PROCESSING ———
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    SATURN.BLOOM.STRENGTH,
    SATURN.BLOOM.RADIUS,
    SATURN.BLOOM.THRESHOLD,
);

  composer.addPass(bloom);

  // Chromatic aberration + color grade shader
  const chromaticShader = {
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uIntensity: { value: 0.003 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uTime;
      uniform float uIntensity;
      varying vec2 vUv;
      void main() {
        vec2 dir = vUv - vec2(0.5);
        float d = length(dir);
        float offset = uIntensity * d;
        // Slight flicker
        float flicker = 1.0 + 0.02 * sin(uTime * 30.0) * sin(uTime * 7.3);
        vec4 cr = texture2D(tDiffuse, vUv + dir * offset);
        vec4 cg = texture2D(tDiffuse, vUv);
        vec4 cb = texture2D(tDiffuse, vUv - dir * offset * 0.5);
        gl_FragColor = vec4(cr.r, cg.g * 1.05, cb.b * 0.6, 1.0) * flicker;
        // Push towards amber/orange tone
        gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * vec3(1.15, 0.85, 0.55), 0.3);
      }
    `,
  };
  const chromaticPass = new ShaderPass(chromaticShader);
  composer.addPass(chromaticPass);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.04;
  controls.minDistance = MIN_DISTANCE;
  controls.maxDistance = MAX_DISTANCE;
  controls.zoomSpeed = 1.4;
  controls.enablePan = false;

  // ——— ORB ROOT ———
  // Every part of the orb (shells, core, orbiting debris, text, dust, rings)
  // lives under this group.
  const orbGroup = new THREE.Group();
  scene.add(orbGroup);

  const saturnRing = createRing();
  orbGroup.add(saturnRing.group);

  // ═══════════════════════════════════════════════
  // LAYER 1: OUTER SHELL — dense wireframe grid
  // ═══════════════════════════════════════════════
  const outerShell = new THREE.Group();
  const shellMaterials: THREE.LineBasicMaterial[] = [];
  const R1 = 2.0;

  // Every outer-shell line/segment goes through this helper so its
  // material is tracked in shellMaterials — otherwise the state-driven
  // color update in the animate loop has nothing to actually update.
  function shellLine(geometry: THREE.BufferGeometry, color: number, opacity: number) {
    const mat = lineMat(color, opacity);
    shellMaterials.push(mat);
    return new THREE.Line(geometry, mat);
  }

  function shellLineSegments(geometry: THREE.BufferGeometry, color: number, opacity: number) {
    const mat = lineMat(color, opacity);
    shellMaterials.push(mat);
    return new THREE.LineSegments(geometry, mat);
  }

  // Dense latitude rings (30+)
  for (let i = -15; i <= 15; i++) {
    const lat = (i / 15) * (Math.PI / 2) * 0.95;
    const opacity = i % 3 === 0 ? 0.5 : 0.12;
    const color = i % 3 === 0 ? COLORS.MID : COLORS.FAINT;
    outerShell.add(shellLine(latRing(R1, lat), color, opacity));
  }

  // Dense meridians (24)
  for (let i = 0; i < 24; i++) {
    const lon = (i / 24) * Math.PI * 2;
    const isMajor = i % 6 === 0;
    outerShell.add(
      shellLine(meridian(R1, lon), isMajor ? COLORS.MID : COLORS.FAINT, isMajor ? 0.6 : 0.1),
    );
  }

  // 4 bright cross meridians (the "plus" shape) — wide bands
  const CROSS_LINES = 18;
  const CROSS_SPREAD = 0.25; // radians total width
  for (let i = 0; i < 4; i++) {
    const lon = (i / 4) * Math.PI * 2;
    for (let j = 0; j < CROSS_LINES; j++) {
      const t = (j / (CROSS_LINES - 1)) * 2 - 1; // -1 to 1
      const offset = (t * CROSS_SPREAD) / 2;
      const falloff = 1 - Math.abs(t) * 0.7; // brighter at center, dimmer at edges
      const opacity = 0.85 * falloff;
      const color = Math.abs(t) < 0.3 ? COLORS.BRIGHT : COLORS.MID;
      outerShell.add(shellLine(meridian(R1, lon + offset, 200), color, opacity));
    }
  }

  // Bright equator band — wide
  const EQ_LINES = 8;
  const EQ_SPREAD = 0.35;
  for (let j = 0; j < EQ_LINES; j++) {
    const t = (j / (EQ_LINES - 1)) * 2 - 1;
    const offset = (t * EQ_SPREAD) / 2;
    const falloff = 1 - Math.abs(t) * 0.65;
    const opacity = 0.35 * falloff;
    const color = Math.abs(t) < 0.3 ? COLORS.BRIGHT : COLORS.MID;
    outerShell.add(shellLine(latRing(R1, offset, 200), color, opacity));
  }

  orbGroup.add(outerShell);

  // ═══════════════════════════════════════════════
  // LAYER 2: GRID PANELS on the sphere surface
  // ═══════════════════════════════════════════════

  const panelGroup = new THREE.Group();

  // Scatter panels across the sphere
  for (let i = 0; i < 30; i++) {
    const lat = (Math.random() - 0.5) * Math.PI * 0.8;
    const lon = Math.random() * Math.PI * 2;
    const size = 0.15 + Math.random() * 0.25;
    const panel = createSpherePanel(
      lat,
      lon,
      size,
      size,
      R1 + 0.01,
      lineMat(COLORS.DIM, 0.25),
      3 + Math.floor(Math.random() * 3),
    );
    panelGroup.add(panel);
  }
  orbGroup.add(panelGroup);

  // ═══════════════════════════════════════════════
  // LAYER 3: SECONDARY SHELL — offset, partial arcs
  // ═══════════════════════════════════════════════
  const shell2 = new THREE.Group();
  const R2 = 2.12;

  // Partial arcs at random latitudes
  for (let i = 0; i < 16; i++) {
    const lat = (Math.random() - 0.5) * Math.PI * 0.85;
    const startLon = Math.random() * Math.PI * 2;
    const arcLen = 0.3 + Math.random() * 1.2;
    const pts: THREE.Vector3[] = [];
    const segs = 60;
    const r = R2 * Math.cos(lat);
    const y = R2 * Math.sin(lat);
    for (let j = 0; j <= segs; j++) {
      const a = startLon + (j / segs) * arcLen;
      pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
    }
    shell2.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        lineMat(COLORS.MID, 0.2 + Math.random() * 0.3),
      ),
    );
  }

  // Partial meridian arcs
  for (let i = 0; i < 12; i++) {
    const lon = Math.random() * Math.PI * 2;
    const startLat = (Math.random() - 0.5) * Math.PI * 0.8;
    const arcLen = 0.3 + Math.random() * 0.8;
    const pts: THREE.Vector3[] = [];
    const segs = 40;
    for (let j = 0; j <= segs; j++) {
      const lat = startLat + (j / segs) * arcLen;
      pts.push(
        new THREE.Vector3(
          R2 * Math.cos(lat) * Math.cos(lon),
          R2 * Math.sin(lat),
          R2 * Math.cos(lat) * Math.sin(lon),
        ),
      );
    }
    shell2.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        lineMat(COLORS.DIM, 0.15 + Math.random() * 0.2),
      ),
    );
  }
  orbGroup.add(shell2);

  // ═══════════════════════════════════════════════
  // LAYER 4: INNER CORE — spiral geodesic
  // ═══════════════════════════════════════════════
  const innerCore = new THREE.Group();
  const innerCoreMaterials: THREE.LineBasicMaterial[] = [];
  const R3 = 0.9;

  // Dense spirals
  for (let s = 0; s < 8; s++) {
    const pts: THREE.Vector3[] = [];
    const turns = 3 + Math.random() * 2;
    const segs = 300;
    const phase = (s / 8) * Math.PI * 2;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const lat = t * Math.PI - Math.PI / 2;
      const lon = t * turns * Math.PI * 2 + phase;
      pts.push(
        new THREE.Vector3(
          R3 * Math.cos(lat) * Math.cos(lon),
          R3 * Math.sin(lat),
          R3 * Math.cos(lat) * Math.sin(lon),
        ),
      );
    }
    const mat = lineMat(
  COLORS.BRIGHT,
  0.3 + Math.random() * 0.2
);

innerCoreMaterials.push(mat);

innerCore.add(
  new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    mat,
  ),
);
  }

  // Inner latitude rings
  for (let i = -6; i <= 6; i++) {
    const lat = (i / 6) * (Math.PI / 2) * 0.9;
    const mat = lineMat(COLORS.DIM, 0.2);

innerCoreMaterials.push(mat);

innerCore.add(
  new THREE.Line(
    latRing(R3, lat, 80),
    mat
  )
);
  }

  // Inner meridians
  for (let i = 0; i < 12; i++) {
    const lon = (i / 12) * Math.PI * 2;
    const mat = lineMat(COLORS.DIM, 0.15);

innerCoreMaterials.push(mat);

innerCore.add(
  new THREE.Line(
    meridian(R3, lon, 80),
    mat
  )
);
  }

  orbGroup.add(innerCore);

  // ═══════════════════════════════════════════════
  // LAYER 5: INNERMOST CORE — bright hot center
  // ═══════════════════════════════════════════════
  const coreR = 0.25;

  // Icosahedron wireframe core
  const icoGeo = new THREE.IcosahedronGeometry(coreR, 1);
  const icoEdges = new THREE.EdgesGeometry(icoGeo);
  const icoWireMat = lineMat(COLORS.HOT, 0.9);
  const icoWire = new THREE.LineSegments(icoEdges, icoWireMat);
  orbGroup.add(icoWire);

  // Glowing center sphere — subtle, see-through
  const coreSphereMat = new THREE.MeshBasicMaterial({
    color: COLORS.HOT,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
  });
  const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), coreSphereMat);
  orbGroup.add(coreSphere);

  // Larger faint glow — very subtle
  const glowSphereMat = new THREE.MeshBasicMaterial({
    color: COLORS.MID,
    transparent: true,
    opacity: 0.04,
    blending: THREE.AdditiveBlending,
  });
  const glowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), glowSphereMat);
  orbGroup.add(glowSphere);

  // ═══════════════════════════════════════════════
  // ORBITING DEBRIS / ROCKS
  // ═══════════════════════════════════════════════
  // Shared geometries for performance — reuse across 250 satellites
  const debrisGeos = [
    new THREE.IcosahedronGeometry(0.012, 0),
    new THREE.IcosahedronGeometry(0.02, 0),
    new THREE.IcosahedronGeometry(0.03, 1),
    new THREE.IcosahedronGeometry(0.008, 0),
    new THREE.TetrahedronGeometry(0.015, 0),
    new THREE.OctahedronGeometry(0.018, 0),
  ];
  interface DebrisOrbit {
    orbitR: number;
    speed: number;
    tiltX: number;
    tiltZ: number;
    phase: number;
  }
  const debris: THREE.Mesh[] = [];
  const debrisMaterials: THREE.MeshBasicMaterial[] = [];
  // Trail lines get their own tracked array — they're LineBasicMaterial,
  // not MeshBasicMaterial like the debris bodies, so they can't share
  // debrisMaterials' array type. Previously these were created via a
  // bare lineMat() call with no tracking at all, meaning ~15% of debris
  // trails never responded to state color changes.
  const debrisTrailMaterials: THREE.LineBasicMaterial[] = [];
  for (let i = 0; i < 250; i++) {
    const geo = debrisGeos[Math.floor(Math.random() * debrisGeos.length)];
    const mat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.7 ? COLORS.BRIGHT : COLORS.MID,
      transparent: true,
      opacity: 0.3 + Math.random() * 0.6,
      blending: THREE.AdditiveBlending,
    });

    debrisMaterials.push(mat);

    const mesh = new THREE.Mesh(geo, mat);
    const orbitR = 1.2 + Math.random() * 4.0;
    const speed = (0.08 + Math.random() * 0.6) * (Math.random() > 0.5 ? 1 : -1);
    const tiltX = (Math.random() - 0.5) * Math.PI * 0.9;
    const tiltZ = (Math.random() - 0.5) * Math.PI * 0.5;
    const phase = Math.random() * Math.PI * 2;
    mesh.userData = { orbitR, speed, tiltX, tiltZ, phase } satisfies DebrisOrbit;
    debris.push(mesh);
    orbGroup.add(mesh);

    // ~15% get a faint trailing line
    if (Math.random() > 0.85) {
      const trailPts: THREE.Vector3[] = [];
      for (let j = 0; j <= 15; j++) {
        const a = -(j / 15) * 0.3;
        trailPts.push(
          new THREE.Vector3(
            orbitR * Math.cos(a + phase),
            orbitR * 0.08 * Math.sin(a * 3),
            orbitR * Math.sin(a + phase),
          ),
        );
      }
      const trailMat = lineMat(COLORS.FAINT, 0.08);
      debrisTrailMaterials.push(trailMat);
      const trail = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(trailPts),
        trailMat,
      );
      mesh.add(trail);
    }
  }

  // ═══════════════════════════════════════════════
  // DUST PARTICLES — lots of them
  // ═══════════════════════════════════════════════
  const dustCount = 2000;
  const dustPos = new Float32Array(dustCount * 3);

  for (let i = 0; i < dustCount; i++) {
    // Concentrate near the sphere, sparse further out
    const rr = 0.5 + Math.pow(Math.random(), 0.6) * 7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    dustPos[i * 3] = rr * Math.sin(phi) * Math.cos(theta);
    dustPos[i * 3 + 1] = rr * Math.cos(phi);
    dustPos[i * 3 + 2] = rr * Math.sin(phi) * Math.sin(theta);
  }

  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.Float32BufferAttribute(dustPos, 3));

  // Soft dot texture
  const dotC = document.createElement("canvas");
  dotC.width = dotC.height = 64;
  const dCtx = dotC.getContext("2d")!;
  const g = dCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
g.addColorStop(0, "rgba(255,255,255,1)");
g.addColorStop(0.2, "rgba(255,255,255,0.6)");
g.addColorStop(0.5, "rgba(255,255,255,0.15)");
g.addColorStop(1, "rgba(255,255,255,0)");
  dCtx.fillStyle = g;
  dCtx.fillRect(0, 0, 64, 64);

  const dustMat = new THREE.PointsMaterial({
    map: new THREE.CanvasTexture(dotC),
    size: 0.04,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    color: COLORS.BRIGHT,
  });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  orbGroup.add(dustPoints);

  // ═══════════════════════════════════════════════
  // SCANNING RINGS
  // ═══════════════════════════════════════════════
  function makeScanRing(radius: number, thickness = 0.015) {
    const geo = new THREE.RingGeometry(radius - thickness, radius + thickness, 120);
    const mat = new THREE.MeshBasicMaterial({
      color: COLORS.BRIGHT,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  const scanRing1 = makeScanRing(R1, 0.01);
  const scanRing2 = makeScanRing(R1 * 0.7, 0.008);
  orbGroup.add(scanRing1, scanRing2);

  // ═══════════════════════════════════════════════
  // HEXAGONAL NODES — small tech details
  // ═══════════════════════════════════════════════
  for (let i = 0; i < 15; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = R1 + 0.02;
    const hexGeo = new THREE.CircleGeometry(0.03 + Math.random() * 0.02, 6);
    const hexEdges = new THREE.EdgesGeometry(hexGeo);
    const hex = shellLineSegments(hexEdges, COLORS.MID, 0.5);
    hex.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta),
    );
    hex.lookAt(0, 0, 0);
    outerShell.add(hex);
  }

  // ═══════════════════════════════════════════════
  // GESTURE / PROGRAMMATIC CAMERA CONTROL
  // ═══════════════════════════════════════════════
  const sphericalScratch = new THREE.Spherical();
  const offsetScratch = new THREE.Vector3();

  function rotateBy(deltaTheta: number, deltaPhi: number) {
    offsetScratch.copy(camera.position).sub(controls.target);
    sphericalScratch.setFromVector3(offsetScratch);
    sphericalScratch.theta -= deltaTheta;
    sphericalScratch.phi = THREE.MathUtils.clamp(
      sphericalScratch.phi - deltaPhi,
      0.05,
      Math.PI - 0.05,
    );
    sphericalScratch.makeSafe();
    offsetScratch.setFromSpherical(sphericalScratch);
    camera.position.copy(controls.target).add(offsetScratch);
    camera.lookAt(controls.target);
  }

  function zoomBy(factor: number) {
    offsetScratch.copy(camera.position).sub(controls.target);
    const dist = THREE.MathUtils.clamp(
      offsetScratch.length() * factor,
      MIN_DISTANCE,
      MAX_DISTANCE,
    );
    offsetScratch.setLength(dist);
    camera.position.copy(controls.target).add(offsetScratch);
  }

  function resetView() {
    camera.position.copy(HOME_POSITION);
    controls.target.set(0, 0, 0);
    camera.lookAt(controls.target);
    controls.update();
  }

  // ═══════════════════════════════════════════════
  // ANIMATION
  // ═══════════════════════════════════════════════
  const clock = new THREE.Clock();
  const animationController = new AnimationController(
  brainState.current,
);

// Hidden dev console hook (from the original roadmap's "F12 -> type
// command -> Saturn executes" idea) — kept out of production builds so
// a live site doesn't ship a global that lets anyone force Saturn's
// visible state from the browser console.
if (process.env.NODE_ENV !== "production") {
  (window as any).saturnState = (state: BrainState) => {
    brainState.setState(state);
  };
}

const unsubscribeBrainState = brainState.subscribe((state) => {
   console.log("🪐 SATURN RECEIVED:", state);
  animationController.setState(
    state,
    performance.now(),
  );
});

  let flickerTimer = 0;
  let rafId = 0;
  let disposed = false;

  function animate() {
    if (disposed) return;

    rafId = requestAnimationFrame(animate);

    const t = clock.getElapsedTime();

    const now = performance.now();

    const animation = animationController.update(
  performance.now(),
);
  saturnRing.setColor(animation.visual.ringColor);

  coreSphereMat.color.set(animation.visual.coreColor);
  glowSphereMat.color.set(animation.visual.coreColor);
  icoWireMat.color.set(animation.visual.coreColor);

  innerCoreMaterials.forEach((m) => {
    m.color.set(animation.visual.coreColor);
  });

  debrisMaterials.forEach((mat) => {
  mat.color.set(animation.visual.dustColor);
});

  // Debris trails ride along with the debris bodies' color mapping —
  // they're the same visual "family" (orbiting particulate), just a
  // different material type, so no separate config field needed.
  debrisTrailMaterials.forEach((mat) => {
    mat.color.set(animation.visual.dustColor);
  });

  dustMat.color.set(animation.visual.dustColor);
  shellMaterials.forEach((m) => {
    m.color.set(animation.visual.shellColor);
});
  
    const breathing = getBreathingState(
    t,
    animation.breathing
   );
    const idle = getIdleState(t);
    saturnRing.group.rotation.y += 0.002 * animation.ring.rotationSpeed;
    saturnRing.group.rotation.z = idle.ringTilt;

    // Entire orb slowly drifts
    orbGroup.rotation.x = idle.orbTiltX;
    orbGroup.rotation.z = idle.orbTiltZ;

    // Outer shell rotation
    outerShell.rotation.y += 0.0015;
    outerShell.rotation.x = idle.shellTilt;

   // Breathing
    outerShell.scale.setScalar(
    1 + breathing.outer
  );

    // Panel group follows shell but with slight offset
    panelGroup.rotation.y += 0.0018;
    panelGroup.rotation.x = Math.sin(t * 0.08 + 0.5) * 0.04;

    // Secondary shell counter-rotates slowly
shell2.rotation.y -= 0.001;
shell2.rotation.z = Math.sin(t * 0.12) * 0.03;

// Breathing
shell2.scale.setScalar(
    1 + breathing.middle
);

    // Inner core — opposite, faster
innerCore.rotation.y -= 0.005;
innerCore.rotation.z += 0.002;
innerCore.rotation.x = Math.cos(t * 0.1) * 0.08;

// Breathing
innerCore.scale.setScalar(
    1 + breathing.inner
);

    // Innermost wireframe
icoWire.rotation.x += 0.008 * animation.ring.rotationSpeed;
icoWire.rotation.y += 0.012 * animation.ring.rotationSpeed;

// Core pulse
const wave1 =
  Math.sin(t * 1.2 * animation.glow.pulse);

const wave3 =
  Math.pow(
    Math.max(0, Math.sin(t * 0.4 * animation.glow.pulse)),
    5,
  );

const wave4 =
  Math.pow(
    Math.max(0, Math.sin(t * 0.7 * animation.glow.pulse + 2)),
    8,
  );

const fadeOut =
  Math.pow(
    Math.max(0, Math.sin(t * 0.25)),
    3,
  );

const surge =
  wave3 * 1.5 +
  wave4 * 2.0;

const coreScale =
  1 +
  surge +
  breathing.inner +
  Math.sin(t * 5) * 0.02;

coreSphere.scale.setScalar(coreScale);

// Core glow
const coreOpacity = Math.max(
  0,
  (
    0.08 +
    wave1 * 0.05 +
    surge * 0.2
  ) *
  animation.glow.intensity *
  (1 - fadeOut * 0.95),
);

coreSphereMat.opacity = Math.min(
  0.6,
  coreOpacity,
);

glowSphere.scale.setScalar(
  1 +
  surge *
  0.8 *
  animation.glow.radius,
);

glowSphereMat.opacity = Math.max(
  0,
  (
    0.03 +
    surge * 0.08
  ) *
  animation.glow.intensity *
  (1 - fadeOut * 0.9) *
  breathing.glow,
);

// Icosahedron wireframe
icoWire.scale.setScalar(
  1 +
  surge *
  0.6 *
  animation.glow.radius,
);

icoWireMat.opacity = Math.min(
  1,
  0.5 +
  surge *
  0.4 *
  animation.glow.intensity,
);

    // Debris orbits
const debrisSpeed =
  animation.ring.rotationSpeed;

debris.forEach((d) => {
  const u = d.userData as DebrisOrbit;

  const a =
    t *
    u.speed *
    debrisSpeed +
    u.phase;

  d.position.set(
    u.orbitR *
      Math.cos(a) *
      Math.cos(u.tiltX),

    u.orbitR *
      Math.sin(u.tiltX) *
      Math.sin(a * 0.8) +
      Math.sin(a * 0.3 + u.tiltZ) * 0.2,

    u.orbitR *
      Math.sin(a) *
      Math.cos(u.tiltZ),
  );

  d.rotation.x +=
    0.015 *
    debrisSpeed;

  d.rotation.z +=
    0.01 *
    debrisSpeed;
});

    // Scan rings sweeping
const scanSpeed = animation.glow.pulse;

const scanY1 =
  Math.sin(t * 0.4 * scanSpeed) * R1;

scanRing1.position.y = scanY1;

const scanS1 =
  Math.sqrt(
    Math.max(
      0,
      R1 * R1 - scanY1 * scanY1,
    ),
  ) / R1;

scanRing1.scale.set(
  scanS1,
  scanS1,
  1,
);

(
  scanRing1.material as THREE.MeshBasicMaterial
).opacity =
  0.2 *
  scanS1 *
  animation.ring.rippleStrength;


const scanY2 =
  Math.sin(t * 0.6 * scanSpeed + 2) * R3;

scanRing2.position.y = scanY2;

const scanS2 =
  Math.sqrt(
    Math.max(
      0,
      R3 * R3 - scanY2 * scanY2,
    ),
  ) / R3;

scanRing2.scale.set(
  scanS2,
  scanS2,
  1,
);

(
  scanRing2.material as THREE.MeshBasicMaterial
).opacity =
  0.15 *
  scanS2 *
  animation.ring.rippleStrength;

    // Dust
dustPoints.rotation.y +=
  0.0002 *
  animation.ring.rotationSpeed;

dustPoints.rotation.x =
  idle.dustTilt *
  animation.ring.wobble;

dustPoints.scale.setScalar(
  1 +
  breathing.outer * 0.6,
);

    // Random flicker on some panels
    flickerTimer += 0.016;
    if (flickerTimer > 0.1) {
      flickerTimer = 0;
      panelGroup.children.forEach((p) => {
        const flickerStrength =
  animation.idle.strength;

if (
  Math.random() >
  1 - 0.05 * flickerStrength
) {
  p.visible = !p.visible;
}
      });
    }

    const bloomPulse =
  Math.sin(t * animation.glow.pulse) * 0.05;

bloom.strength =
  Math.max(
    0,
    animation.bloom.strength + bloomPulse,
  );

  bloom.radius = animation.bloom.radius;
  bloom.threshold = animation.bloom.threshold;

    // Update chromatic aberration time
    chromaticPass.uniforms.uTime.value = t;

    controls.update();
    composer.render();
  }

  animate();

  // ——— RESIZE ———
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  }
  window.addEventListener("resize", onResize);

  // ——— CLEANUP ———
  function dispose() {
    disposed = true;
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", onResize);
    controls.dispose();
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (!mat) continue;
        const anyMat = mat as THREE.Material & { map?: THREE.Texture };
        anyMat.map?.dispose();
        mat.dispose();
      }
    });
    saturnRing.dispose();
    composer.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    unsubscribeBrainState();
  }

  return {
    rotateBy,
    zoomBy,
    zoomIn: () => zoomBy(0.65),
    zoomOut: () => zoomBy(1.55),
    resetView,
    dispose,
  };
}