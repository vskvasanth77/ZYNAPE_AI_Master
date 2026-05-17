import * as THREE from "three";
import { makeScene } from "./sceneBase.js";

/** 3D bar chart — animated bars rising and falling */
export default function init(canvas) {
  const ctx = makeScene(canvas, { cameraZ: 5.5 });
  const group = new THREE.Group();
  group.position.set(0, -0.4, 0);
  group.rotation.x = -0.25;
  ctx.scene.add(group);

  // Floor grid
  const gridHelper = new THREE.GridHelper(4.5, 9, 0x00f5d4, 0x223355);
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.35;
  gridHelper.position.y = -0.01;
  group.add(gridHelper);

  // Bars in a 5x5 grid
  const bars = [];
  const heights = [];
  const cols = 5, rows = 5;
  for (let x = 0; x < cols; x++) {
    for (let z = 0; z < rows; z++) {
      const h = 0.4 + Math.random() * 1.6;
      heights.push({ base: h, phase: Math.random() * Math.PI * 2 });
      const geo = new THREE.BoxGeometry(0.55, h, 0.55);
      const accent = new THREE.Color().setHSL(0.45 + (x + z) * 0.04, 0.85, 0.55);
      const mat = new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: 0.5,
        metalness: 0.5,
        roughness: 0.4,
      });
      const bar = new THREE.Mesh(geo, mat);
      bar.position.set(
        (x - (cols - 1) / 2) * 0.7,
        h / 2,
        (z - (rows - 1) / 2) * 0.7
      );
      group.add(bar);
      bars.push(bar);
    }
  }

  let t = 0;
  ctx.addUpdater((d) => {
    t += d;
    group.rotation.y = Math.sin(t * 0.25) * 0.6;
    bars.forEach((bar, i) => {
      const meta = heights[i];
      const newH = meta.base * (0.55 + Math.sin(t * 1.4 + meta.phase) * 0.45);
      bar.scale.y = newH / meta.base;
      bar.position.y = (newH) / 2;
      bar.material.emissiveIntensity = 0.4 + Math.sin(t * 2 + meta.phase) * 0.3;
    });
  });

  return ctx;
}
