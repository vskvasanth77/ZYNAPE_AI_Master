import * as THREE from "three";
import { gsap } from "gsap";

/**
 * Each domain mini-scene shares the same lifecycle: init(canvas) returns
 * an object { dispose() }. The base sets up renderer, camera, scene, lights,
 * resize handling, and a render loop driven by gsap.ticker.
 */
export function makeScene(canvas, { cameraZ = 4, fov = 45, bg = null } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  if (bg) scene.background = new THREE.Color(bg);

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.set(0, 0, cameraZ);

  scene.add(new THREE.AmbientLight(0x99aacc, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(3, 4, 4);
  scene.add(key);
  const accent = new THREE.PointLight(0x00f5d4, 1.4, 14);
  accent.position.set(-2, 1, 3);
  scene.add(accent);
  const purple = new THREE.PointLight(0x7b2ff7, 0.9, 14);
  purple.position.set(2, -1, 2);
  scene.add(purple);

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let updaters = [];
  const onTick = (time, deltaMs) => {
    const delta = deltaMs / 1000;
    updaters.forEach((u) => u(delta));
    renderer.render(scene, camera);
  };
  gsap.ticker.add(onTick);

  return {
    renderer,
    scene,
    camera,
    addUpdater(fn) { updaters.push(fn); },
    dispose() {
      gsap.ticker.remove(onTick);
      ro.disconnect();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose?.();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m.dispose?.());
        }
      });
      renderer.dispose();
    },
  };
}
