import * as THREE from "three";
import { makeScene } from "./sceneBase.js";

/** Spinning wireframe globe with orbiting connection arcs */
export default function init(canvas) {
  const ctx = makeScene(canvas, { cameraZ: 4.6 });
  const group = new THREE.Group();
  ctx.scene.add(group);

  // Wireframe globe
  const sphereGeo = new THREE.IcosahedronGeometry(1.2, 3);
  const wireGeo = new THREE.WireframeGeometry(sphereGeo);
  const wireMat = new THREE.LineBasicMaterial({
    color: 0x00f5d4,
    transparent: true,
    opacity: 0.42,
  });
  const wire = new THREE.LineSegments(wireGeo, wireMat);
  group.add(wire);

  // Solid faint inner sphere
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0x0a0a24,
    transparent: true,
    opacity: 0.4,
  });
  const inner = new THREE.Mesh(new THREE.SphereGeometry(1.18, 32, 32), innerMat);
  group.add(inner);

  // Data point markers
  const points = [];
  const pointMat = new THREE.MeshStandardMaterial({
    color: 0x00f5d4,
    emissive: 0x00f5d4,
    emissiveIntensity: 1.6,
  });
  for (let i = 0; i < 24; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = 1.22;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), pointMat);
    m.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
    group.add(m);
    points.push(m);
  }

  // Orbital rings
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const ringGeo = new THREE.TorusGeometry(1.4 + i * 0.18, 0.005, 12, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: i === 0 ? 0x00f5d4 : i === 1 ? 0x7b2ff7 : 0xff6b6b,
      transparent: true,
      opacity: 0.5,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.random() * Math.PI;
    ring.rotation.y = Math.random() * Math.PI;
    group.add(ring);
    rings.push(ring);
  }

  let t = 0;
  ctx.addUpdater((d) => {
    t += d;
    group.rotation.y += d * 0.25;
    group.rotation.x = Math.sin(t * 0.2) * 0.1;
    rings.forEach((r, i) => {
      r.rotation.z += d * (0.5 + i * 0.2);
    });
    points.forEach((p, i) => {
      p.material.emissiveIntensity = 1.0 + Math.sin(t * 3 + i) * 0.7;
    });
  });

  return ctx;
}
