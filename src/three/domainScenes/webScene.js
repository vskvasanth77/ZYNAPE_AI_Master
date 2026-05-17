import * as THREE from "three";
import { makeScene } from "./sceneBase.js";

/** Floating UI component tree — stacked panes representing layout */
export default function init(canvas) {
  const ctx = makeScene(canvas, { cameraZ: 5 });
  const group = new THREE.Group();
  ctx.scene.add(group);

  function makePanel(w, h, depth, color, opacity = 0.85) {
    const geo = new THREE.BoxGeometry(w, h, depth);
    const mat = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity,
      metalness: 0.4,
      roughness: 0.4,
    });
    return new THREE.Mesh(geo, mat);
  }

  // Outer browser frame
  const browser = makePanel(3.4, 2.2, 0.1, 0x12122a, 0.6);
  group.add(browser);

  // Top bar
  const topbar = makePanel(3.2, 0.18, 0.04, 0x1d1d3c);
  topbar.position.set(0, 0.95, 0.07);
  group.add(topbar);

  // Sidebar
  const sidebar = makePanel(0.7, 1.7, 0.04, 0x1d1d3c);
  sidebar.position.set(-1.3, -0.05, 0.07);
  group.add(sidebar);

  // Main content cards
  const cards = [];
  const accents = [0x00f5d4, 0x7b2ff7, 0xff6b6b, 0xffe066, 0x00f5d4, 0x7b2ff7];
  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const card = makePanel(0.6, 0.55, 0.05, accents[i], 0.88);
    card.material.emissive = new THREE.Color(accents[i]);
    card.material.emissiveIntensity = 0.4;
    card.position.set(
      -0.5 + col * 0.7,
      0.32 - row * 0.7,
      0.18
    );
    group.add(card);
    cards.push(card);
  }

  // Floating cursor pointer
  const cursorGeo = new THREE.ConeGeometry(0.08, 0.18, 12);
  const cursorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.7,
  });
  const cursor = new THREE.Mesh(cursorGeo, cursorMat);
  cursor.rotation.z = Math.PI / 4;
  cursor.position.set(0.6, -0.2, 0.4);
  group.add(cursor);

  let t = 0;
  ctx.addUpdater((d) => {
    t += d;
    group.rotation.y = Math.sin(t * 0.4) * 0.5;
    group.rotation.x = Math.sin(t * 0.3) * 0.15;
    cards.forEach((card, i) => {
      card.position.z = 0.18 + Math.sin(t * 1.4 + i * 0.6) * 0.08;
      card.material.emissiveIntensity = 0.35 + Math.sin(t * 2 + i) * 0.25;
    });
    cursor.position.x = 0.6 + Math.sin(t * 0.8) * 0.5;
    cursor.position.y = -0.2 + Math.cos(t * 0.6) * 0.4;
  });

  return ctx;
}
