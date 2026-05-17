import * as THREE from "three";
import { makeScene } from "./sceneBase.js";

/** Orbiting design primitives — sphere, torus, cone, cube floating in formation */
export default function init(canvas) {
  const ctx = makeScene(canvas, { cameraZ: 5 });
  const group = new THREE.Group();
  ctx.scene.add(group);

  function shape(geo, color) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.7,
      roughness: 0.25,
      emissive: color,
      emissiveIntensity: 0.25,
    });
    return new THREE.Mesh(geo, mat);
  }

  const shapes = [
    { mesh: shape(new THREE.IcosahedronGeometry(0.55, 0), 0x00f5d4), orbit: 1.6, speed: 0.6, axisY: 0.4 },
    { mesh: shape(new THREE.TorusGeometry(0.45, 0.16, 16, 48), 0x7b2ff7), orbit: 1.7, speed: -0.5, axisY: -0.2 },
    { mesh: shape(new THREE.ConeGeometry(0.5, 0.9, 5), 0xff6b6b), orbit: 1.5, speed: 0.45, axisY: 0.6 },
    { mesh: shape(new THREE.BoxGeometry(0.55, 0.55, 0.55), 0xffe066), orbit: 1.8, speed: -0.4, axisY: -0.5 },
    { mesh: shape(new THREE.OctahedronGeometry(0.5, 0), 0x00d4ff), orbit: 1.55, speed: 0.55, axisY: 0.1 },
  ];

  shapes.forEach((s, i) => {
    s.angle = (i / shapes.length) * Math.PI * 2;
    group.add(s.mesh);
  });

  // Center sphere
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.7,
      metalness: 0.5,
      roughness: 0.2,
    })
  );
  group.add(center);

  let t = 0;
  ctx.addUpdater((d) => {
    t += d;
    group.rotation.y += d * 0.2;
    group.rotation.x = Math.sin(t * 0.3) * 0.18;
    shapes.forEach((s) => {
      s.angle += d * s.speed;
      s.mesh.position.set(
        Math.cos(s.angle) * s.orbit,
        Math.sin(t * 1.2 + s.axisY * 4) * 0.3 + s.axisY,
        Math.sin(s.angle) * s.orbit
      );
      s.mesh.rotation.x += d * 0.6;
      s.mesh.rotation.y += d * 0.4;
    });
    center.scale.setScalar(1 + Math.sin(t * 2) * 0.08);
    center.material.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.3;
  });

  return ctx;
}
