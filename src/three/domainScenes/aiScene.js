import * as THREE from "three";
import { makeScene } from "./sceneBase.js";

/** Animated neural network: 3 layers of nodes with pulsing connections */
export default function init(canvas) {
  const ctx = makeScene(canvas, { cameraZ: 5 });
  const group = new THREE.Group();
  ctx.scene.add(group);

  const layerCounts = [4, 6, 4];
  const layerXs = [-1.8, 0, 1.8];
  const nodes = [];

  layerCounts.forEach((count, layerIdx) => {
    const layerNodes = [];
    for (let i = 0; i < count; i++) {
      const y = (i - (count - 1) / 2) * 0.55;
      const geo = new THREE.SphereGeometry(0.13, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x00f5d4,
        emissive: 0x00f5d4,
        emissiveIntensity: 0.6,
        metalness: 0.3,
        roughness: 0.4,
      });
      const node = new THREE.Mesh(geo, mat);
      node.position.set(layerXs[layerIdx], y, 0);
      group.add(node);
      layerNodes.push(node);
    }
    nodes.push(layerNodes);
  });

  // Connections
  const lineGeo = new THREE.BufferGeometry();
  const positions = [];
  const lineColors = [];
  const accent = new THREE.Color(0x00f5d4);
  const purple = new THREE.Color(0x7b2ff7);

  for (let l = 0; l < nodes.length - 1; l++) {
    nodes[l].forEach((a) => {
      nodes[l + 1].forEach((b) => {
        positions.push(a.position.x, a.position.y, a.position.z);
        positions.push(b.position.x, b.position.y, b.position.z);
        const c = accent.clone().lerp(purple, Math.random());
        lineColors.push(c.r, c.g, c.b);
        lineColors.push(c.r, c.g, c.b);
      });
    });
  }

  lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  lineGeo.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));
  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  group.add(lines);

  let t = 0;
  ctx.addUpdater((d) => {
    t += d;
    group.rotation.y = Math.sin(t * 0.3) * 0.4;
    group.rotation.x = Math.cos(t * 0.2) * 0.15;
    nodes.flat().forEach((n, i) => {
      n.material.emissiveIntensity = 0.4 + Math.sin(t * 2.5 + i) * 0.6;
      n.scale.setScalar(1 + Math.sin(t * 2 + i * 0.5) * 0.1);
    });
    lineMat.opacity = 0.4 + Math.sin(t * 2) * 0.15;
  });

  return ctx;
}
