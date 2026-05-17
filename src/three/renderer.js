import * as THREE from "three";
import { quality } from "../utils/deviceDetection.js";

const canvas = document.getElementById("bg-canvas");

export const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.setPixelRatio(quality.pixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

export const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050510, 0.03);

export const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 0.5, 7.4);
camera.lookAt(0, 0.2, 0);

// Ambient — cool blue
const ambient = new THREE.AmbientLight(0x6677aa, 0.5);
scene.add(ambient);

// Hemisphere — gives skydome-style depth (sky cyan, ground purple)
const hemi = new THREE.HemisphereLight(0x88e6ff, 0x3a1a7a, 0.45);
scene.add(hemi);

// Key light — bright top-front
const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
keyLight.position.set(5, 7, 5);
scene.add(keyLight);

// Rim light — back-right magenta for sci-fi edge separation
const rimLight = new THREE.DirectionalLight(0xff77ee, 0.8);
rimLight.position.set(-4, 3, -6);
scene.add(rimLight);

// Accent point light — cyan
const accentLight = new THREE.PointLight(0x00f5d4, 1.6, 16, 1.6);
accentLight.position.set(-3, 1.5, 3);
scene.add(accentLight);

// Fill light — purple
const fillLight = new THREE.PointLight(0x7b2ff7, 1.0, 16, 1.6);
fillLight.position.set(4, -1, 2);
scene.add(fillLight);

// Under-glow — small cyan emanating from below the robot
const underGlow = new THREE.PointLight(0x00d4ff, 0.85, 8, 2);
underGlow.position.set(0, -1.5, 0.5);
scene.add(underGlow);

window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});

// Exported so themeToggle can adjust them on theme switch
export { ambient, hemi, keyLight, rimLight, accentLight, fillLight, underGlow };
