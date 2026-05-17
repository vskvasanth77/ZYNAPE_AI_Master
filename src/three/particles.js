import * as THREE from "three";
import { gsap } from "gsap";
import { quality } from "../utils/deviceDetection.js";

export function createParticleField(scene) {
  const count = quality.particleCount;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  const accent = new THREE.Color(0x00f5d4);
  const purple = new THREE.Color(0x7b2ff7);

  for (let i = 0; i < count; i++) {
    const r = 6 + Math.random() * 14;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
    positions[i * 3 + 2] = r * Math.cos(phi);
    sizes[i] = 0.012 + Math.random() * 0.04;
    const mix = accent.clone().lerp(purple, Math.random());
    colors[i * 3] = mix.r;
    colors[i * 3 + 1] = mix.g;
    colors[i * 3 + 2] = mix.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  gsap.to(points.rotation, { y: Math.PI * 2, duration: 90, repeat: -1, ease: "none" });
  gsap.to(points.rotation, { x: Math.PI * 0.4, duration: 60, repeat: -1, yoyo: true, ease: "sine.inOut" });

  return points;
}
