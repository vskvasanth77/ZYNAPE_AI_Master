import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { TextPlugin } from "gsap/TextPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Lenis from "lenis";

import { renderer, scene, camera,
         ambient, hemi, keyLight, rimLight, accentLight, fillLight, underGlow,
} from "./three/renderer.js";
import { createParticleField } from "./three/particles.js";
import { createRobot, startIdleLoop } from "./three/robot.js";

import { initThemeToggle } from "./components/themeToggle.js";
import { initCursor } from "./components/cursor.js";
import { initNav } from "./components/nav.js";
import { initDomainCards } from "./components/domainCard.js";
import { updateBubblePosition } from "./components/speechBubble.js";

import { initHomeAnimations } from "./animations/homeAnimations.js";
import { initSolutionsAnimations } from "./animations/solutionsAnimations.js";
import { initOperationsAnimations } from "./animations/operationsAnimations.js";
import { initContactAnimations, setConfettiScene } from "./animations/contactAnimations.js";
import { initTransitions } from "./animations/transitionAnimations.js";
import { setupRobotScroll } from "./animations/robotScroll.js";

import { device } from "./utils/deviceDetection.js";
import { hydrateAll } from "./admin/hydrate.js";
import { maybeInitAdmin, registerAdminShortcut } from "./admin/adminMode.js";

gsap.registerPlugin(ScrollTrigger, Flip, TextPlugin, ScrollToPlugin);

// ===== Content hydration — runs before any animation init =====
// Applies saved draft (or shipped defaults) to all [data-edit] nodes
hydrateAll();

// ===== Lenis smooth scroll =====
const lenis = new Lenis({
  lerp: 0.085,
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1.4,
});

lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// Pause Lenis when a card is expanded so the modal scrolls instead of the page
const bodyObserver = new MutationObserver(() => {
  if (document.body.classList.contains("card-expanded")) {
    lenis.stop();
  } else {
    lenis.start();
  }
});
bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

// ===== Theme toggle — init before scene so saved preference applies on load =====
initThemeToggle({ scene, ambient, hemi, keyLight, rimLight, accentLight, fillLight, underGlow });

// ===== Three.js scene setup =====
const robot = createRobot();
scene.add(robot);
startIdleLoop(robot);
const particles = createParticleField(scene);
setConfettiScene(scene);

// Reduced motion: simplify
if (device.prefersReducedMotion) {
  gsap.globalTimeline.timeScale(0.001);
}

// ===== Render loop =====
gsap.ticker.add(() => {
  // Camera subtle parallax based on mouse
  camera.position.x += (camTargetX - camera.position.x) * 0.04;
  camera.position.y += (camTargetY - camera.position.y) * 0.04;
  camera.lookAt(0, 0.2, 0);

  if (robot?.userData?.head) {
    updateBubblePosition(robot.userData.head, camera);
  }
  renderer.render(scene, camera);
});

// Mouse-driven camera parallax
let camTargetX = 0;
let camTargetY = 0.5;
window.addEventListener("mousemove", (e) => {
  const dx = (e.clientX / window.innerWidth - 0.5) * 0.6;
  const dy = (e.clientY / window.innerHeight - 0.5) * 0.4;
  camTargetX = dx;
  camTargetY = 0.5 - dy;
});

// Pause render loop on tab hide
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    gsap.ticker.sleep();
  } else {
    gsap.ticker.wake();
  }
});

// ===== Init UI + scroll-bound animations =====
function initAll() {
  initCursor();
  initNav();
  initDomainCards();
  initHomeAnimations();
  initSolutionsAnimations();
  initOperationsAnimations();
  initContactAnimations();
  initTransitions();
  setupRobotScroll(robot);

  // Final layout pass after fonts/images load
  ScrollTrigger.refresh();
}

if (document.readyState === "complete") {
  initAll();
} else {
  window.addEventListener("load", initAll);
}

// Expose ScrollTrigger.refresh for theme toggle
window.__ST_refresh = () => ScrollTrigger.refresh();

// Refresh ScrollTrigger after fonts load (heading metrics may shift)
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

// ===== Admin mode =====
// ?admin=1 in URL → prompt for passphrase; Ctrl+Shift+E toggles from any page
registerAdminShortcut();
maybeInitAdmin();
