import * as THREE from "three";
import { makeScene } from "./sceneBase.js";

/** Pulsing shield with deflecting particle threats */
export default function init(canvas) {
  const ctx = makeScene(canvas, { cameraZ: 5 });

  // Shield: octahedral hex pattern
  const shieldGroup = new THREE.Group();
  ctx.scene.add(shieldGroup);

  const shieldGeo = new THREE.IcosahedronGeometry(1.2, 1);
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0x00f5d4,
    emissive: 0x00f5d4,
    emissiveIntensity: 0.5,
    metalness: 0.6,
    roughness: 0.3,
    transparent: true,
    opacity: 0.45,
    flatShading: true,
    side: THREE.DoubleSide,
  });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shieldGroup.add(shield);

  const shieldWire = new THREE.LineSegments(
    new THREE.WireframeGeometry(shieldGeo),
    new THREE.LineBasicMaterial({ color: 0x00f5d4, transparent: true, opacity: 0.7 })
  );
  shieldGroup.add(shieldWire);

  // Inner glowing core
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 24, 24),
    new THREE.MeshStandardMaterial({
      color: 0x7b2ff7,
      emissive: 0x7b2ff7,
      emissiveIntensity: 1.4,
    })
  );
  shieldGroup.add(core);

  // Threat particles flying inward then deflecting
  const threatCount = 40;
  const threatGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(threatCount * 3);
  const velocities = new Float32Array(threatCount * 3);
  const phases = new Float32Array(threatCount);

  for (let i = 0; i < threatCount; i++) {
    seed(i);
    phases[i] = Math.random() * Math.PI * 2;
  }

  function seed(i) {
    const angle = Math.random() * Math.PI * 2;
    const elev = (Math.random() - 0.5) * 1.5;
    const r = 4 + Math.random() * 2;
    positions[i * 3]     = Math.cos(angle) * r;
    positions[i * 3 + 1] = elev;
    positions[i * 3 + 2] = Math.sin(angle) * r;
    const v = 0.5 + Math.random() * 0.7;
    velocities[i * 3]     = -Math.cos(angle) * v;
    velocities[i * 3 + 1] = -elev * 0.2;
    velocities[i * 3 + 2] = -Math.sin(angle) * v;
  }

  threatGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const threatMat = new THREE.PointsMaterial({
    color: 0xff6b6b,
    size: 0.07,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const threats = new THREE.Points(threatGeo, threatMat);
  ctx.scene.add(threats);

  let t = 0;
  ctx.addUpdater((d) => {
    t += d;
    shieldGroup.rotation.y += d * 0.4;
    shieldGroup.rotation.x = Math.sin(t * 0.6) * 0.15;
    const pulse = 1 + Math.sin(t * 2.4) * 0.05;
    shieldGroup.scale.setScalar(pulse);
    shieldMat.emissiveIntensity = 0.3 + Math.sin(t * 2) * 0.3;
    core.material.emissiveIntensity = 1.0 + Math.sin(t * 4) * 0.6;

    const arr = threatGeo.attributes.position.array;
    for (let i = 0; i < threatCount; i++) {
      arr[i * 3]     += velocities[i * 3] * d;
      arr[i * 3 + 1] += velocities[i * 3 + 1] * d;
      arr[i * 3 + 2] += velocities[i * 3 + 2] * d;
      const x = arr[i * 3], y = arr[i * 3 + 1], z = arr[i * 3 + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);
      if (dist < 1.4) {
        // Deflect outward
        const a = Math.random() * Math.PI * 2;
        const r = 5;
        arr[i * 3]     = Math.cos(a) * r;
        arr[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
        arr[i * 3 + 2] = Math.sin(a) * r;
        velocities[i * 3]     = -arr[i * 3] / 6;
        velocities[i * 3 + 2] = -arr[i * 3 + 2] / 6;
      }
    }
    threatGeo.attributes.position.needsUpdate = true;
  });

  return ctx;
}
