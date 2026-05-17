import * as THREE from "three";
import { gsap } from "gsap";

const ACCENT   = 0x00f5d4;
const ACCENT_2 = 0x00d4ff;
const PURPLE   = 0x7b2ff7;
const GOLD     = 0xffe066;

const PALETTE = {
  body:    0x0b0b1f,
  shell:   0x161636,
  carbon:  0x080814,
  trim:    0x232352,
  joint:   0x222244,
  chrome:  0x4a4a78,
  visor:   ACCENT,
  accent:  ACCENT,
  glow:    PURPLE,
};

function physicalMat(color, opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.92,
    roughness: 0.28,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    reflectivity: 0.6,
    iridescence: 0.18,
    iridescenceIOR: 1.45,
    ...opts,
  });
}

function chromeMat(color = PALETTE.chrome) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 1.0,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
}

function emissiveMat(color, intensity = 1.6) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    metalness: 0.4,
    roughness: 0.22,
  });
}

function additive(color, opacity = 0.6) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function addEdges(mesh, color = ACCENT, opacity = 0.55) {
  const eg = new THREE.EdgesGeometry(mesh.geometry, 25);
  const lm = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const lines = new THREE.LineSegments(eg, lm);
  mesh.add(lines);
  return lines;
}

/**
 * Rig structure (FIX FOR FLICKERING):
 *   root        — userData container
 *   └ orient    — scroll-driven (position / rotation / scale)
 *     └ bob     — idle bob (position.y, rotation.z) — never touched by scroll
 *       └ body  — visual robot
 */
export function createRobot() {
  const root = new THREE.Group();
  root.name = "robotRoot";

  const orient = new THREE.Group();
  root.add(orient);

  const bob = new THREE.Group();
  orient.add(bob);

  const body = new THREE.Group();
  bob.add(body);

  // ====================================================================
  // GROUND PLATE — hover pad + emanating rings
  // ====================================================================
  const padGroup = new THREE.Group();
  padGroup.position.y = -1.06;
  body.add(padGroup);

  // Hex-inspired hover pad (octagon ring)
  const padOuter = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 1.18, 8, 1),
    additive(ACCENT, 0.35),
  );
  padOuter.rotation.x = -Math.PI / 2;
  padGroup.add(padOuter);

  const padInner = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.62, 32, 1),
    additive(ACCENT_2, 0.45),
  );
  padInner.rotation.x = -Math.PI / 2;
  padInner.position.y = 0.005;
  padGroup.add(padInner);

  // Holographic disc under feet
  const disc = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 1.4, 64, 1),
    new THREE.MeshBasicMaterial({
      color: ACCENT,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  disc.rotation.x = -Math.PI / 2;
  padGroup.add(disc);

  // Floor pulse rings — emanating
  const floorRings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.012, 8, 64),
      additive(ACCENT, 0.55),
    );
    ring.rotation.x = Math.PI / 2;
    padGroup.add(ring);
    floorRings.push(ring);
  }

  // ====================================================================
  // PELVIS / WAIST — segmented chrome belt
  // ====================================================================
  const pelvis = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.18, 0.5),
    chromeMat(PALETTE.shell),
  );
  pelvis.position.y = 0.05;
  body.add(pelvis);
  addEdges(pelvis, ACCENT, 0.4);

  // Hip core glow
  const hipBuckle = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.08, 0),
    emissiveMat(ACCENT, 2.0),
  );
  hipBuckle.position.set(0, 0.05, 0.27);
  hipBuckle.rotation.z = Math.PI / 4;
  body.add(hipBuckle);

  // ====================================================================
  // TORSO — faceted shell with hex chest pattern
  // ====================================================================
  const torsoGeo = new THREE.BoxGeometry(0.92, 1.05, 0.6, 2, 2, 2);
  const torso = new THREE.Mesh(torsoGeo, physicalMat(PALETTE.body));
  torso.position.y = 0.6;
  body.add(torso);
  addEdges(torso, ACCENT, 0.55);

  // Side trim emissive strips (vertical, both sides)
  for (const sx of [-0.46, 0.46]) {
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.92, 0.014),
      emissiveMat(ACCENT, 2.4),
    );
    trim.position.set(sx, 0.6, 0.3);
    body.add(trim);
  }

  // Chest plate — beveled tray
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.62, 0.06),
    physicalMat(PALETTE.shell, { roughness: 0.18 }),
  );
  plate.position.set(0, 0.66, 0.33);
  body.add(plate);
  addEdges(plate, ACCENT, 0.5);

  // Hex pattern (faux) on chest — small tris
  const hexGroup = new THREE.Group();
  hexGroup.position.set(0, 0.66, 0.36);
  body.add(hexGroup);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const seg = new THREE.Mesh(
      new THREE.CircleGeometry(0.05, 6),
      additive(ACCENT_2, 0.35),
    );
    seg.position.set(Math.cos(angle) * 0.22, Math.sin(angle) * 0.22, 0);
    hexGroup.add(seg);
  }

  // Holographic core (recessed cavity, then layered emissives)
  const coreCavity = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.04, 32),
    physicalMat(0x05050f, { roughness: 0.6 }),
  );
  coreCavity.rotation.x = Math.PI / 2;
  coreCavity.position.set(0, 0.66, 0.37);
  body.add(coreCavity);

  const coreRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.014, 16, 48),
    emissiveMat(PALETTE.accent, 2.6),
  );
  coreRing.position.set(0, 0.66, 0.4);
  body.add(coreRing);

  // Outer rotating tri-ring
  const coreTriRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.21, 0.006, 6, 3),
    additive(ACCENT, 0.85),
  );
  coreTriRing.position.set(0, 0.66, 0.42);
  body.add(coreTriRing);

  const coreInner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.075, 0),
    emissiveMat(PALETTE.glow, 2.4),
  );
  coreInner.position.set(0, 0.66, 0.4);
  body.add(coreInner);

  // Holo aura
  const coreAura = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 32),
    additive(PURPLE, 0.45),
  );
  coreAura.position.set(0, 0.66, 0.41);
  body.add(coreAura);

  // ====================================================================
  // BACKPACK / JETPACK — energy reactor with thrusters
  // ====================================================================
  const pack = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.85, 0.22),
    chromeMat(PALETTE.shell),
  );
  pack.position.set(0, 0.7, -0.36);
  body.add(pack);
  addEdges(pack, ACCENT, 0.45);

  // Thruster nozzles (left & right)
  const thrusters = [];
  for (const sx of [-0.22, 0.22]) {
    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.09, 0.18, 16),
      chromeMat(PALETTE.chrome),
    );
    nozzle.position.set(sx, 0.32, -0.42);
    nozzle.rotation.x = 0;
    body.add(nozzle);

    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.32, 16, 1, true),
      additive(ACCENT_2, 0.85),
    );
    flame.rotation.x = Math.PI;
    flame.position.set(sx, 0.16, -0.42);
    body.add(flame);
    thrusters.push({ nozzle, flame });
  }

  // Top antenna pair on pack
  for (const sx of [-0.22, 0.22]) {
    const antRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.32, 8),
      physicalMat(PALETTE.shell),
    );
    antRod.position.set(sx, 1.28, -0.36);
    body.add(antRod);

    const antTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 12, 12),
      emissiveMat(GOLD, 2.6),
    );
    antTip.position.set(sx, 1.46, -0.36);
    body.add(antTip);
  }

  // ====================================================================
  // HUD ring — equatorial belt around torso
  // ====================================================================
  const hudRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.006, 6, 96),
    additive(ACCENT, 0.6),
  );
  hudRing.rotation.x = Math.PI / 2;
  hudRing.position.y = 0.85;
  body.add(hudRing);

  // Counter-spin secondary HUD
  const hudRing2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.004, 6, 64, Math.PI * 1.2),
    additive(PURPLE, 0.5),
  );
  hudRing2.rotation.x = Math.PI / 2;
  hudRing2.position.y = 0.45;
  body.add(hudRing2);

  // ====================================================================
  // NECK
  // ====================================================================
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.18, 16),
    physicalMat(PALETTE.joint),
  );
  neck.position.y = 1.22;
  body.add(neck);

  const neckRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.012, 8, 24),
    emissiveMat(ACCENT, 2.0),
  );
  neckRing.rotation.x = Math.PI / 2;
  neckRing.position.y = 1.16;
  body.add(neckRing);

  // ====================================================================
  // HEAD — helmet with multi-segment visor & ear pieces
  // ====================================================================
  const headPivot = new THREE.Group();
  headPivot.position.y = 1.5;
  body.add(headPivot);

  // Main helmet shell — slightly rounded box
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.56, 0.56, 2, 2, 2),
    physicalMat(PALETTE.shell, { roughness: 0.2 }),
  );
  head.name = "head";
  headPivot.add(head);
  addEdges(head, ACCENT, 0.55);

  // Crest (forehead crown blade)
  const crest = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.12, 0.5),
    chromeMat(PALETTE.chrome),
  );
  crest.position.set(0, 0.32, 0);
  headPivot.add(crest);

  const crestGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.12, 0.45),
    emissiveMat(ACCENT, 2.2),
  );
  crestGlow.position.set(0, 0.32, 0);
  headPivot.add(crestGlow);

  // Visor — recessed dark base
  const visorBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.18, 0.04),
    new THREE.MeshStandardMaterial({
      color: 0x010108,
      roughness: 0.08,
      metalness: 0.6,
    }),
  );
  visorBody.position.set(0, 0.04, 0.275);
  headPivot.add(visorBody);

  // Visor emissive plate
  const visorMat = emissiveMat(PALETTE.visor, 1.8);
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.15, 0.012),
    visorMat,
  );
  visor.position.set(0, 0.04, 0.3);
  visor.name = "visor";
  headPivot.add(visor);

  // Two iris dots inside visor (eyes)
  const eyeGeo = new THREE.SphereGeometry(0.022, 16, 16);
  const eyeMat = emissiveMat(0xffffff, 2.8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.13, 0.04, 0.31);
  rightEye.position.set(0.13, 0.04, 0.31);
  headPivot.add(leftEye, rightEye);

  // Visor outer glow halo
  const visorGlowMat = additive(PALETTE.visor, 0.45);
  const visorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.3),
    visorGlowMat,
  );
  visorGlow.position.set(0, 0.04, 0.34);
  headPivot.add(visorGlow);

  // Scan line
  const scanLineMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const scanLine = new THREE.Mesh(
    new THREE.PlaneGeometry(0.54, 0.012),
    scanLineMat,
  );
  scanLine.position.set(0, 0.1, 0.315);
  headPivot.add(scanLine);

  // Head halo ring
  const headHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.005, 6, 64),
    additive(ACCENT, 0.65),
  );
  headHalo.rotation.x = Math.PI / 2;
  headPivot.add(headHalo);

  // Ear pieces (audio modules)
  for (const sx of [-0.32, 0.32]) {
    const ear = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16),
      chromeMat(PALETTE.chrome),
    );
    ear.rotation.z = Math.PI / 2;
    ear.position.set(sx, 0.02, 0);
    headPivot.add(ear);

    const earGlow = new THREE.Mesh(
      new THREE.CircleGeometry(0.04, 16),
      emissiveMat(ACCENT, 2.2),
    );
    earGlow.position.set(sx * 1.05, 0.02, 0);
    earGlow.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
    headPivot.add(earGlow);
  }

  // Cheek vents
  for (const sx of [-0.31, 0.31]) {
    for (let i = 0; i < 3; i++) {
      const vent = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.05, 0.012),
        emissiveMat(ACCENT, 2.0),
      );
      vent.position.set(sx, -0.12 + i * 0.025, 0.18);
      headPivot.add(vent);
    }
  }

  // Antenna with energy particles
  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.34, 8),
    physicalMat(PALETTE.shell),
  );
  antenna.position.set(0.18, 0.42, 0);
  headPivot.add(antenna);

  const antennaTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 16, 16),
    emissiveMat(PALETTE.accent, 2.8),
  );
  antennaTip.position.set(0.18, 0.6, 0);
  headPivot.add(antennaTip);

  // Antenna particle wisps
  const antennaParticles = [];
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 8, 8),
      additive(ACCENT, 0.85),
    );
    p.position.set(0.18, 0.6 + i * 0.05, 0);
    p.userData.phase = i * 0.4;
    headPivot.add(p);
    antennaParticles.push(p);
  }

  // ====================================================================
  // SHOULDERS / PAULDRONS — armored with emissive trim
  // ====================================================================
  function buildArm(side) {
    const sign = side === "left" ? -1 : 1;
    const shoulder = new THREE.Group();
    shoulder.position.set(sign * 0.55, 1.0, 0);
    body.add(shoulder);

    // Pauldron — angled armor cap
    const pauldron = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 18, 18, 0, Math.PI * 2, 0, Math.PI / 2),
      physicalMat(PALETTE.shell, { roughness: 0.2 }),
    );
    pauldron.rotation.z = sign * 0.25;
    shoulder.add(pauldron);
    addEdges(pauldron, ACCENT, 0.4);

    // Pauldron edge glow
    const pauldronEdge = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.008, 6, 24, Math.PI),
      emissiveMat(ACCENT, 2.0),
    );
    pauldronEdge.rotation.y = Math.PI / 2;
    shoulder.add(pauldronEdge);

    // Shoulder ball joint
    const shoulderBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 18, 18),
      chromeMat(PALETTE.joint),
    );
    shoulderBall.position.y = -0.04;
    shoulder.add(shoulderBall);

    const upperArmGroup = new THREE.Group();
    shoulder.add(upperArmGroup);

    const upperArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.085, 0.42, 6, 12),
      physicalMat(PALETTE.shell),
    );
    upperArm.position.y = -0.27;
    upperArmGroup.add(upperArm);

    // Bicep emissive band
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.092, 0.008, 6, 24),
      emissiveMat(PALETTE.accent, 2.0),
    );
    band.rotation.x = Math.PI / 2;
    band.position.y = -0.16;
    upperArmGroup.add(band);

    const elbow = new THREE.Group();
    elbow.position.y = -0.5;
    upperArmGroup.add(elbow);

    const elbowBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.092, 16, 16),
      chromeMat(PALETTE.joint),
    );
    elbow.add(elbowBall);

    const forearm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.075, 0.4, 6, 12),
      physicalMat(PALETTE.body),
    );
    forearm.position.y = -0.25;
    elbow.add(forearm);

    // Gauntlet (forearm armor) with HUD strip
    const gauntlet = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.14, 0.16),
      physicalMat(PALETTE.shell, { roughness: 0.2 }),
    );
    gauntlet.position.y = -0.18;
    elbow.add(gauntlet);
    addEdges(gauntlet, ACCENT, 0.5);

    const gauntletStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.1, 0.018),
      emissiveMat(ACCENT, 2.4),
    );
    gauntletStrip.position.set(0, -0.18, 0.085);
    elbow.add(gauntletStrip);

    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 16, 16),
      chromeMat(PALETTE.shell),
    );
    hand.position.y = -0.5;
    elbow.add(hand);

    return { shoulder, upperArmGroup, elbow, hand, band, gauntlet };
  }

  const leftArm  = buildArm("left");
  const rightArm = buildArm("right");

  // ====================================================================
  // LEGS
  // ====================================================================
  function buildLeg(side) {
    const sign = side === "left" ? -1 : 1;
    const hip = new THREE.Group();
    hip.position.set(sign * 0.22, 0.05, 0);
    body.add(hip);

    const hipBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 16, 16),
      chromeMat(PALETTE.joint),
    );
    hip.add(hipBall);

    const upperLeg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.105, 0.38, 6, 12),
      physicalMat(PALETTE.shell),
    );
    upperLeg.position.y = -0.28;
    hip.add(upperLeg);

    // Thigh trim
    const thighTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.34, 0.014),
      emissiveMat(ACCENT, 1.8),
    );
    thighTrim.position.set(sign * 0.11, -0.28, 0.04);
    hip.add(thighTrim);

    const knee = new THREE.Group();
    knee.position.y = -0.5;
    hip.add(knee);

    const kneeBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 14, 14),
      chromeMat(PALETTE.joint),
    );
    knee.add(kneeBall);

    const lowerLeg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.092, 0.38, 6, 12),
      physicalMat(PALETTE.body),
    );
    lowerLeg.position.y = -0.27;
    knee.add(lowerLeg);

    // Shin armor plate
    const shinPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.32, 0.04),
      physicalMat(PALETTE.shell, { roughness: 0.18 }),
    );
    shinPlate.position.set(0, -0.27, 0.09);
    knee.add(shinPlate);

    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.12, 0.34),
      physicalMat(PALETTE.shell, { roughness: 0.4 }),
    );
    foot.position.set(0, -0.5, 0.06);
    knee.add(foot);

    // Foot thruster glow (under sole)
    const footGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.28),
      additive(ACCENT_2, 0.55),
    );
    footGlow.rotation.x = -Math.PI / 2;
    footGlow.position.set(0, -0.555, 0.06);
    knee.add(footGlow);

    return { hip, knee, footGlow };
  }

  const leftLeg  = buildLeg("left");
  const rightLeg = buildLeg("right");

  // ====================================================================
  // ORBITAL DRONES — three sci-fi sentinels
  // ====================================================================
  const drones = [];
  const droneColors = [ACCENT, ACCENT_2, GOLD];
  for (let i = 0; i < 3; i++) {
    const drone = new THREE.Group();
    const color = droneColors[i];
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.06, 0),
      emissiveMat(color, 2.6),
    );
    drone.add(core);
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.005, 6, 32),
      additive(color, 0.7),
    );
    halo.rotation.x = Math.PI / 2;
    drone.add(halo);

    // Drone trail
    const trail = new THREE.Mesh(
      new THREE.PlaneGeometry(0.14, 0.02),
      additive(color, 0.5),
    );
    drone.add(trail);

    drone.userData = { angle: i * (Math.PI * 2 / 3), halo, trail, color };
    body.add(drone);
    drones.push(drone);
  }

  // ====================================================================
  // INITIAL POSE & TRANSFORM
  // ====================================================================
  leftArm.shoulder.rotation.z = 0.2;
  rightArm.shoulder.rotation.z = -0.2;
  leftArm.elbow.rotation.x = 0.18;
  rightArm.elbow.rotation.x = 0.18;

  // Default off-screen-right starting position
  orient.scale.setScalar(0.78);
  orient.position.set(2.8, -0.7, 0);
  orient.rotation.y = -0.18;

  root.userData = {
    orient,
    bob,
    body,
    headPivot,
    head,
    visor,
    visorMat,
    visorGlow,
    visorGlowMat,
    scanLine,
    scanLineMat,
    coreRing,
    coreTriRing,
    coreInner,
    coreAura,
    hudRing,
    hudRing2,
    headHalo,
    floorRings,
    padOuter,
    padInner,
    disc,
    drones,
    antennaParticles,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    thrusters,
    leftEye,
    rightEye,
  };

  return root;
}

/**
 * Idle loop — operates ONLY on `bob` and visual sub-elements.
 */
export function startIdleLoop(robot) {
  const u = robot.userData;
  const { bob, headPivot, visorMat, visorGlowMat, scanLine, scanLineMat,
          coreRing, coreTriRing, coreInner, coreAura, hudRing, hudRing2, headHalo,
          floorRings, padOuter, padInner, drones, antennaParticles, thrusters,
          leftEye, rightEye } = u;

  // Float — slightly more pronounced
  gsap.to(bob.position, { y: 0.16, repeat: -1, yoyo: true, duration: 2.6, ease: "sine.inOut" });
  gsap.to(bob.rotation, { z: 0.05, repeat: -1, yoyo: true, duration: 3.4, ease: "sine.inOut" });
  gsap.to(bob.rotation, { y: 0.06, repeat: -1, yoyo: true, duration: 5.2, ease: "sine.inOut" });

  // Head wobble
  gsap.to(headPivot.rotation, { y: 0.18, repeat: -1, yoyo: true, duration: 4.5, ease: "sine.inOut" });
  gsap.to(headPivot.rotation, { x: 0.04, repeat: -1, yoyo: true, duration: 3.8, ease: "sine.inOut" });

  // Visor pulse
  gsap.to(visorMat, { emissiveIntensity: 0.8, repeat: -1, yoyo: true, duration: 1.8, ease: "sine.inOut" });
  gsap.to(visorGlowMat, { opacity: 0.18, repeat: -1, yoyo: true, duration: 1.8, ease: "sine.inOut" });

  // Eye blink (random scale collapses)
  function blink() {
    gsap.to([leftEye.scale, rightEye.scale], {
      y: 0.05, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.inOut",
      onComplete: () => gsap.delayedCall(2 + Math.random() * 4, blink),
    });
  }
  gsap.delayedCall(2 + Math.random() * 3, blink);

  // Scan line sweep
  gsap.fromTo(scanLine.position,
    { y: -0.05 },
    { y: 0.11, duration: 2.2, repeat: -1, yoyo: true, ease: "sine.inOut" },
  );
  gsap.to(scanLineMat, { opacity: 0.45, repeat: -1, yoyo: true, duration: 1.1, ease: "sine.inOut" });

  // Chest core
  gsap.to(coreRing.rotation, { z: Math.PI * 2, repeat: -1, duration: 14, ease: "none" });
  gsap.to(coreTriRing.rotation, { z: -Math.PI * 2, repeat: -1, duration: 9, ease: "none" });
  gsap.to(coreInner.rotation, { x: Math.PI * 2, y: Math.PI * 2, repeat: -1, duration: 7, ease: "none" });
  gsap.to(coreInner.scale, { x: 0.7, y: 0.7, z: 0.7, repeat: -1, yoyo: true, duration: 1.4, ease: "sine.inOut" });
  gsap.to(coreAura.scale, { x: 1.25, y: 1.25, z: 1.25, repeat: -1, yoyo: true, duration: 2.2, ease: "sine.inOut" });
  gsap.to(coreAura.material, { opacity: 0.18, repeat: -1, yoyo: true, duration: 2.2, ease: "sine.inOut" });

  // HUD rings drift opposing
  gsap.to(hudRing.rotation, { y: Math.PI * 2, repeat: -1, duration: 18, ease: "none" });
  gsap.to(hudRing2.rotation, { y: -Math.PI * 2, repeat: -1, duration: 22, ease: "none" });

  // Head halo counter-rotate
  gsap.to(headHalo.rotation, { z: -Math.PI * 2, repeat: -1, duration: 12, ease: "none" });

  // Pad rings slow rotate
  gsap.to(padOuter.rotation, { z: Math.PI * 2, repeat: -1, duration: 24, ease: "none" });
  gsap.to(padInner.rotation, { z: -Math.PI * 2, repeat: -1, duration: 16, ease: "none" });

  // Floor pulse rings — emanating outward
  floorRings.forEach((ring, i) => {
    gsap.fromTo(ring.scale,
      { x: 1, y: 1, z: 1 },
      { x: 2.4, y: 2.4, z: 2.4, duration: 2.6, repeat: -1, ease: "sine.out", delay: i * 0.85 },
    );
    gsap.fromTo(ring.material,
      { opacity: 0.55 },
      { opacity: 0, duration: 2.6, repeat: -1, ease: "sine.out", delay: i * 0.85 },
    );
  });

  // Thruster flicker
  thrusters.forEach((t, i) => {
    gsap.to(t.flame.scale, {
      y: 1.4, x: 1.15, z: 1.15,
      duration: 0.18 + i * 0.05, repeat: -1, yoyo: true, ease: "sine.inOut",
    });
    gsap.to(t.flame.material, {
      opacity: 0.45,
      duration: 0.32 + i * 0.04, repeat: -1, yoyo: true, ease: "sine.inOut",
    });
  });

  // Orbital drones — varied orbits
  drones.forEach((drone, i) => {
    const radius = 1.1 + i * 0.18;
    const speed = 0.0048 - i * 0.0009;
    const yLift = 0.95 + i * 0.4;
    drone.userData.angle = i * (Math.PI * 2 / drones.length);
    gsap.ticker.add(() => {
      drone.userData.angle += speed;
      const a = drone.userData.angle;
      drone.position.set(
        Math.cos(a) * radius,
        yLift + Math.sin(a * 2.0) * 0.16,
        Math.sin(a) * radius,
      );
      drone.rotation.y = -a + Math.PI / 2;
      drone.userData.halo.rotation.z += 0.04;
      drone.userData.trail.position.x = -0.08;
    });
  });

  // Antenna wisps
  antennaParticles.forEach((p, i) => {
    gsap.fromTo(p.position,
      { y: 0.6 },
      { y: 0.86, duration: 1.6, repeat: -1, ease: "power1.out", delay: i * 0.32 },
    );
    gsap.fromTo(p.material,
      { opacity: 0.85 },
      { opacity: 0, duration: 1.6, repeat: -1, ease: "power1.out", delay: i * 0.32 },
    );
    gsap.fromTo(p.scale,
      { x: 1, y: 1, z: 1 },
      { x: 0.3, y: 0.3, z: 0.3, duration: 1.6, repeat: -1, ease: "power1.out", delay: i * 0.32 },
    );
  });
}

/* ============================================================
 * Pose helpers
 * ============================================================ */
const TW = { overwrite: "auto" };

export function playWave(robot) {
  const { rightArm } = robot.userData;
  const tl = gsap.timeline();
  tl.to(rightArm.shoulder.rotation, { z: -2.0, x: 0.2, duration: 0.55, ease: "back.out(1.6)", ...TW })
    .to(rightArm.elbow.rotation, { z: 0.1, x: 0, duration: 0.4, ...TW }, "<")
    .to(rightArm.elbow.rotation, {
      z: -0.6, yoyo: true, repeat: 3, duration: 0.32, ease: "sine.inOut", ...TW,
    })
    .to(rightArm.shoulder.rotation, { z: -0.2, x: 0, duration: 0.6, ease: "power2.out", ...TW }, "+=0.2")
    .to(rightArm.elbow.rotation, { z: 0, x: 0.18, duration: 0.6, ease: "power2.out", ...TW }, "<");
  return tl;
}

export function playPoint(robot) {
  const { rightArm, headPivot } = robot.userData;
  const tl = gsap.timeline();
  tl.to(rightArm.shoulder.rotation, { z: -1.55, x: 0.1, duration: 0.5, ease: "power3.out", ...TW })
    .to(rightArm.elbow.rotation, { x: 0, z: 0, duration: 0.4, ...TW }, "<")
    .to(headPivot.rotation, { y: -0.4, duration: 0.4, ...TW }, "<");
  return tl;
}

export function playGesture(robot) {
  const { leftArm, rightArm } = robot.userData;
  const tl = gsap.timeline();
  tl.to([leftArm.shoulder.rotation, rightArm.shoulder.rotation], {
    x: 1.2, z: 0, duration: 0.6, ease: "power2.out", ...TW,
  })
    .to([leftArm.elbow.rotation, rightArm.elbow.rotation], {
      x: 0.7, duration: 0.6, ease: "power2.out", ...TW,
    }, "<");
  return tl;
}

export function playScan(robot) {
  const { rightArm, headPivot } = robot.userData;
  const tl = gsap.timeline();
  tl.to(rightArm.shoulder.rotation, { z: -1.1, x: 0.5, duration: 0.5, ease: "power2.out", ...TW })
    .to(rightArm.elbow.rotation, { x: 0.6, duration: 0.4, ease: "power2.out", ...TW }, "<")
    .to(headPivot.rotation, { y: -0.3, x: 0.1, duration: 0.5, ease: "power2.out", ...TW }, "<")
    .to(headPivot.rotation, { y: 0.3, duration: 1.4, ease: "sine.inOut", ...TW });
  return tl;
}

export function playWalkCycle(robot, duration = 1.8) {
  const { leftLeg, rightLeg, leftArm, rightArm } = robot.userData;
  const half = duration / 2;
  const tl = gsap.timeline();
  tl.to(leftLeg.hip.rotation,  { x:  0.6, duration: half, ease: "sine.inOut", ...TW }, 0)
    .to(rightLeg.hip.rotation, { x: -0.6, duration: half, ease: "sine.inOut", ...TW }, 0)
    .to(leftLeg.knee.rotation, { x: -0.4, duration: half, ease: "sine.inOut", ...TW }, 0)
    .to(rightLeg.knee.rotation,{ x:  0.0, duration: half, ease: "sine.inOut", ...TW }, 0)
    .to(leftArm.shoulder.rotation,  { x: -0.5, duration: half, ease: "sine.inOut", ...TW }, 0)
    .to(rightArm.shoulder.rotation, { x:  0.5, duration: half, ease: "sine.inOut", ...TW }, 0)
    .to(leftLeg.hip.rotation,  { x: -0.6, duration: half, ease: "sine.inOut", ...TW }, half)
    .to(rightLeg.hip.rotation, { x:  0.6, duration: half, ease: "sine.inOut", ...TW }, half)
    .to(leftLeg.knee.rotation, { x:  0.0, duration: half, ease: "sine.inOut", ...TW }, half)
    .to(rightLeg.knee.rotation,{ x: -0.4, duration: half, ease: "sine.inOut", ...TW }, half)
    .to(leftArm.shoulder.rotation,  { x:  0.5, duration: half, ease: "sine.inOut", ...TW }, half)
    .to(rightArm.shoulder.rotation, { x: -0.5, duration: half, ease: "sine.inOut", ...TW }, half)
    .to([leftLeg.hip.rotation, rightLeg.hip.rotation, leftLeg.knee.rotation, rightLeg.knee.rotation,
         leftArm.shoulder.rotation, rightArm.shoulder.rotation], {
      x: 0, duration: 0.4, ease: "power2.out", ...TW,
    });
  return tl;
}

export function resetPose(robot) {
  const { leftArm, rightArm, headPivot } = robot.userData;
  gsap.to(leftArm.shoulder.rotation,  { x: 0, y: 0, z: 0.2,  duration: 0.6, ease: "power2.out", ...TW });
  gsap.to(rightArm.shoulder.rotation, { x: 0, y: 0, z: -0.2, duration: 0.6, ease: "power2.out", ...TW });
  gsap.to(leftArm.elbow.rotation,  { x: 0.18, y: 0, z: 0, duration: 0.6, ...TW });
  gsap.to(rightArm.elbow.rotation, { x: 0.18, y: 0, z: 0, duration: 0.6, ...TW });
  gsap.to(headPivot.rotation, { x: 0, z: 0, duration: 0.6, ...TW });
}
