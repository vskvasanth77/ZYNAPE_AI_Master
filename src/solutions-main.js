import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Lenis from "lenis";

import {
  renderer, scene, camera,
  ambient, hemi, keyLight, rimLight, accentLight, fillLight, underGlow,
} from "./three/renderer.js";
import { createParticleField } from "./three/particles.js";
import { createRobot, startIdleLoop,
         playWave, playPoint, playGesture, playScan, resetPose } from "./three/robot.js";

import { initThemeToggle } from "./components/themeToggle.js";
import { initCursor } from "./components/cursor.js";
import { initNav } from "./components/nav.js";
import { showSpeechBubble, hideSpeechBubble, updateBubblePosition } from "./components/speechBubble.js";

import { device } from "./utils/deviceDetection.js";
import { initSolutionsPageAnimations } from "./animations/solutionsPageAnimations.js";

gsap.registerPlugin(ScrollTrigger, TextPlugin, ScrollToPlugin);

// ── Smooth scroll ────────────────────────────────────────────
const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0); // Lenis sync

// ── Theme ─────────────────────────────────────────────────────
initThemeToggle({ scene, ambient, hemi, keyLight, rimLight, accentLight, fillLight, underGlow });

// ── Three.js ──────────────────────────────────────────────────
const robot = createRobot();
scene.add(robot);
startIdleLoop(robot);
createParticleField(scene);

if (device.prefersReducedMotion) gsap.globalTimeline.timeScale(0.001);

// ── Camera parallax (mouse) ───────────────────────────────────
let camTargetX = 0;
let camTargetY = 0.5;
window.addEventListener("mousemove", (e) => {
  const dx = (e.clientX / window.innerWidth  - 0.5) * 0.6;
  const dy = (e.clientY / window.innerHeight - 0.5) * 0.4;
  camTargetX = dx;
  camTargetY = 0.5 - dy;
});

// ── Render loop ───────────────────────────────────────────────
gsap.ticker.add(() => {
  camera.position.x += (camTargetX - camera.position.x) * 0.04;
  camera.position.y += (camTargetY - camera.position.y) * 0.04;
  camera.lookAt(0, 0.2, 0);
  if (robot?.userData?.head) updateBubblePosition(robot.userData.head, camera);
  renderer.render(scene, camera);
});

document.addEventListener("visibilitychange", () => {
  document.hidden ? gsap.ticker.sleep() : gsap.ticker.wake();
});

// ── Hero button → smooth scroll ───────────────────────────────
document.querySelector('a[href="#sol-migration"]')?.addEventListener("click", (e) => {
  e.preventDefault();
  gsap.to(window, { scrollTo: "#sol-migration", duration: 1.1, ease: "expo.inOut" });
});

// ─────────────────────────────────────────────────────────────
// ADVANCED ROBOT PARALLAX
// Uses the same orient group pattern as robotScroll.js.
// Per-section: position shifts, scale, rotation, gesture, message.
// Additionally: within each section the robot gently drifts on a
// GSAP progress tween so it feels alive as you scroll through.
// ─────────────────────────────────────────────────────────────
function setupSolutionsRobot(robot) {
  const orient = robot.userData.orient;

  // Shared tween defaults — identical to robotScroll.js
  const TW = { overwrite: "auto", ease: "power3.inOut", duration: 1.2 };

  function widthScale() {
    const w = window.innerWidth;
    if (w < 760)  return 0.6;
    if (w < 1100) return 0.85;
    return 1;
  }

  // ── Speech messages ──────────────────────────────────────────
  const MESSAGES = {
    "sol-hero":      "Welcome to Solutions — your full-stack journey starts here.",
    "sol-migration": "From on-prem iron to cloud-native. Let's migrate.",
    "sol-ops-solar": "DevOps · ITOps · SecOps · FinOps — orbiting one intelligence core.",
    "sol-ai":        "Intelligent pipelines, agentic systems, LLMOps — AI that ships.",
    "sol-soc":       "24/7 eyes on your perimeter. Threats caught before they breach.",
  };

  let activeSection = null;

  function setSection(id) {
    if (activeSection === id) return;
    activeSection = id;
    showSpeechBubble(MESSAGES[id]);
  }

  // ── Section definitions ───────────────────────────────────────
  // Each entry: trigger id, position target, scale, rotation-y, gesture fn, side drift
  const sections = [
    {
      // sol-hero — right side, scale matches home robot prominence
      id:      "sol-hero",
      pos:     (w) => ({ x:  2.38 * w, y: -0.80, z: 0.0 }),
      scale:   0.78,
      rotY:   -0.32,
      gesture: (r) => playWave(r),
      drift: { yRange: 0.15, xSide: "right" },
    },
    {
      // sol-migration — extreme bottom-left corner, below and left of rack
      id:      "sol-migration",
      pos:     (w) => ({ x: -2.72 * w, y: -1.50, z: 0.1 }),
      scale:   0.50,
      rotY:    0.40,
      gesture: (r) => playPoint(r),
      drift: { yRange: 0.12, xSide: "left" },
    },
    {
      // sol-ops-solar · Right side — pairs with the orbital stage
      id:      "sol-ops-solar",
      pos:     (w) => ({ x: 2.42 * w, y: -0.60, z: 0.3 }),
      scale:   0.62,
      rotY:   -0.36,
      gesture: (r) => playGesture(r),
      drift: { yRange: 0.14, xSide: "right" },
    },
    {
      // sol-ai — right, behind neural-network viz. Large scale so
      // robot is visible through the glass viz container.
      id:      "sol-ai",
      pos:     (w) => ({ x: 2.35 * w, y: -0.65, z: 0.3 }),
      scale:   0.75,
      rotY:   -0.36,
      gesture: (r) => playPoint(r),
      drift: { yRange: 0.14, xSide: "right" },
    },
    {
      // sol-soc — right side beside the hub diagram
      id:      "sol-soc",
      pos:     (w) => ({ x: 2.35 * w, y: -0.60, z: 0.3 }),
      scale:   0.72,
      rotY:   -0.38,
      gesture: (r) => playScan(r),
      drift: { yRange: 0.13, xSide: "right" },
    },
  ];

  // ── Wire up each section ──────────────────────────────────────
  sections.forEach((sec, i) => {
    const el = document.getElementById(sec.id);
    if (!el) return;

    // Snap: enter/back triggers the position + gesture
    function activate() {
      setSection(sec.id);
      resetPose(robot);
      const w = widthScale();
      const p = sec.pos(w);
      gsap.to(orient.position, { x: p.x, y: p.y, z: p.z, ...TW });
      gsap.to(orient.scale,    { x: sec.scale, y: sec.scale, z: sec.scale, ...TW });
      gsap.to(orient.rotation, { x: 0, y: sec.rotY, z: 0, ...TW });
      gsap.delayedCall(0.5, () => sec.gesture(robot));
    }

    ScrollTrigger.create({
      trigger: el,
      start: "top 60%",
      end: "bottom 40%",
      onEnter: activate,
      onEnterBack: activate,
    });

    // Advanced parallax: scrub robot y-position as section scrolls through viewport.
    // This gives a continuous floating sensation while reading.
    const { yRange } = sec.drift;
    ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      scrub: 1.2,
      onUpdate(self) {
        // progress 0→1 maps to y offset +yRange → -yRange (robot rises as you scroll down)
        const drift = yRange - self.progress * yRange * 2;
        gsap.to(orient.position, {
          y: sec.pos(widthScale()).y + drift,
          duration: 0.6,
          ease: "none",
          overwrite: false,
        });
        // Subtle z-axis lean: robot leans slightly toward viewer at mid-section
        const lean = Math.sin(self.progress * Math.PI) * 0.15;
        gsap.to(orient.position, {
          z: sec.pos(widthScale()).z + lean,
          duration: 0.6,
          ease: "none",
          overwrite: false,
        });
      },
    });

    // Resize re-applies positions
    window.addEventListener("resize", () => {
      if (activeSection === sec.id) activate();
    });
  });

  // Hide bubble when leaving the last section
  const lastEl = document.getElementById("sol-soc");
  if (lastEl) {
    ScrollTrigger.create({
      trigger: lastEl,
      start: "bottom 40%",
      onLeave: () => hideSpeechBubble(),
    });
  }
}

// ─────────────────────────────────────────────────────────────
// SECTION ENTRANCE ANIMATIONS (scroll-driven fade-ins)
// ─────────────────────────────────────────────────────────────
function initSectionAnimations() {

  // Hero — stagger children in
  gsap.timeline({
    scrollTrigger: { trigger: "#sol-hero", start: "top 80%", once: true },
  })
    .to(".sol-hero__eyebrow", { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" })
    .to(".sol-hero h1",       { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.3")
    .to(".sol-hero__lede",    { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.4")
    .to(".sol-hero__actions", { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.3");

  // Section headers (eyebrow + title + lede)
  ["sol-migration", "sol-ops-solar", "sol-ai", "sol-soc"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    gsap.from(el.querySelectorAll(".section__eyebrow, .section__title, .section__lede"), {
      scrollTrigger: { trigger: el, start: "top 75%", once: true },
      y: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out",
    });
  });

  // Migration sides — slide in from sides, beams fade in
  gsap.from(".migration-side--onprem", {
    scrollTrigger: { trigger: "#sol-migration", start: "top 65%", once: true },
    opacity: 0, x: -50, duration: 0.9, ease: "power3.out",
  });
  gsap.from(".migration-side--cloud", {
    scrollTrigger: { trigger: "#sol-migration", start: "top 65%", once: true },
    opacity: 0, x: 50, duration: 0.9, ease: "power3.out",
  });
  gsap.from(".migration-steps", {
    scrollTrigger: { trigger: "#sol-migration", start: "top 65%", once: true },
    opacity: 0, scale: 0.92, duration: 0.7, delay: 0.25, ease: "power3.out",
  });
  gsap.from(".mig-step", {
    scrollTrigger: { trigger: "#sol-migration", start: "top 60%", once: true },
    opacity: 0, y: 16, duration: 0.5, stagger: 0.1, ease: "power3.out", delay: 0.4,
  });
  gsap.from(".migration-stats .sol-metric", {
    scrollTrigger: { trigger: ".migration-stats", start: "top 80%", once: true },
    opacity: 0, y: 30, duration: 0.6, stagger: 0.1, ease: "power3.out",
  });

  // AI section — network viz + list
  gsap.from(".ai-copy", {
    scrollTrigger: { trigger: "#sol-ai", start: "top 70%", once: true },
    opacity: 0, x: -40, duration: 0.9, ease: "power3.out",
  });
  gsap.from(".ai-viz", {
    scrollTrigger: { trigger: "#sol-ai", start: "top 70%", once: true },
    opacity: 0, x: 40, duration: 0.9, ease: "power3.out", delay: 0.15,
  });
  gsap.from(".ai-list li", {
    scrollTrigger: { trigger: "#sol-ai", start: "top 65%", once: true },
    opacity: 0, x: -20, duration: 0.5, stagger: 0.1, ease: "power3.out", delay: 0.3,
  });

  // SOC diagram
  gsap.to(".hub-diagram", {
    scrollTrigger: { trigger: "#sol-soc", start: "top 65%", once: true },
    opacity: 1, duration: 1, ease: "power2.out",
  });

  // SOC spokes — draw in one by one
  ScrollTrigger.create({
    trigger: "#sol-soc",
    start: "top 65%",
    once: true,
    onEnter() {
      const spokes = document.querySelectorAll(".soc-spoke");
      spokes.forEach((s, i) => {
        const len = parseFloat(s.getAttribute("stroke-dasharray")) || 120;
        gsap.to(s, {
          strokeDashoffset: 0,
          duration: 0.9,
          delay: i * 0.12,
          ease: "power2.out",
        });
      });
    },
  });

  // Metrics — stagger
  gsap.to(".sol-metric", {
    scrollTrigger: { trigger: ".sol-metrics", start: "top 80%", once: true },
    opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out",
  });
}

// ─────────────────────────────────────────────────────────────
// OPS ANIMATIONS (rebuilt — no sticky/spacer/scrub)
//
// Previous approach (sticky pin + scroll spacer + ScrollTrigger scrub)
// was incompatible with Lenis scroll proxy. Rebuilt as a normal section
// with once-trigger entrance animations — reliable, clean, fast.
//
// Parallax feel comes from:
//   1. Hub scales in with back-ease on scroll enter
//   2. Cards stagger in with y-translate (0.15s apart)
//   3. Hub drifts -40px on a scrubbed y-tween as section scrolls past
// ─────────────────────────────────────────────────────────────
function initOpsParallax() {
  const section = document.getElementById("sol-ops");
  if (!section) return;

  // Hub entrance
  gsap.from(".ops-hub-core", {
    scrollTrigger: { trigger: section, start: "top 75%", once: true },
    scale: 0.3, opacity: 0, duration: 0.9, ease: "back.out(1.4)",
  });

  // ── Cards ─────────────────────────────────────────────────────
  // FIX: gsap.from() with ScrollTrigger is unreliable when the page
  // loads with the section already past the trigger start — the
  // callback fires immediately during init before ScrollTrigger has
  // calculated positions, leaving cards permanently at opacity:0.
  //
  // Solution: explicit gsap.set() then a ScrollTrigger.create()
  // with onEnter (+ onEnterBack) callback using gsap.to().
  // start:"top 90%" fires as soon as any part of the section is
  // visible, so it never misses.
  gsap.set(".ops-card-new", { opacity: 0, y: 50 });

  ScrollTrigger.create({
    trigger: section,
    start: "top 90%",
    once: true,
    onEnter: () => {
      gsap.to(".ops-card-new", {
        opacity: 1,
        y: 0,
        duration: 0.65,
        stagger: 0.14,
        ease: "power3.out",
        overwrite: "auto",
      });
    },
  });

  // Hub subtle parallax drift
  gsap.to(".ops-hub-core", {
    scrollTrigger: {
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      scrub: 2,
    },
    y: -50,
    ease: "none",
  });
}

// ─────────────────────────────────────────────────────────────
// OPS SOLAR — solar system orbital animation
//
// Concept: OPS hub is the sun.  Four planet cards orbit it.
// Scroll sequence:
//   1. Hub appears (top 80%)
//   2. Orbit ring appears (top 68%)
//   3-6. Planets appear one by one (top 55% → 18%)
//   7. All planets revealed → continuous orbital rotation starts
//
// GSAP drives x/y of each .ops-planet-pivot using trigonometry.
// The planet CARDS are centered on those pivots via CSS
// transform: translate(-50%,-50%) so no counter-rotation needed.
//
// SVG orbit track uses viewBox 0 0 600 600, r=220 units.
// JS radius mirrors this: STAGE * (220/600) for perfect alignment.
// ─────────────────────────────────────────────────────────────
function initOpsSolarAnimation() {
  const section = document.getElementById("sol-ops-solar");
  if (!section) return;

  const hub       = document.getElementById("opsSolarHub");
  const orbitWrap = document.getElementById("opsSolarOrbit");
  const pivots    = [
    document.getElementById("opsPivotDevops"),
    document.getElementById("opsPivotITops"),
    document.getElementById("opsPivotSecops"),
    document.getElementById("opsPivotFinops"),
  ];
  const cards = [
    document.getElementById("opsPlanetDevops"),
    document.getElementById("opsPlanetITops"),
    document.getElementById("opsPlanetSecops"),
    document.getElementById("opsPlanetFinops"),
  ];

  if (!hub || !orbitWrap || pivots.some(p => !p)) return;

  // Planet starting angles (radians): top, right, bottom, left
  const START_ANGLES = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

  // Orbital radius matches SVG viewBox (600×600, r=220 units)
  const getRadius = () => {
    const stageSize = Math.min(660, window.innerWidth * 0.88);
    return stageSize * (220 / 600);
  };

  // Pre-position all pivots at their start angles
  function positionPivots() {
    const r = getRadius();
    pivots.forEach((pivot, i) => {
      gsap.set(pivot, {
        x: Math.cos(START_ANGLES[i]) * r,
        y: Math.sin(START_ANGLES[i]) * r,
      });
    });
  }
  positionPivots();

  // Initial hidden state
  gsap.set(hub,       { opacity: 0, scale: 0 });
  gsap.set(orbitWrap, { opacity: 0 });
  cards.forEach(c => { if (c) gsap.set(c, { opacity: 0, scale: 0 }); });

  // ── Scroll reveal sequence ──────────────────────────────────
  // 1. Hub
  ScrollTrigger.create({
    trigger: section, start: "top 80%", once: true,
    onEnter: () => gsap.to(hub, { opacity: 1, scale: 1, duration: 0.9, ease: "back.out(1.5)" }),
  });

  // 2. Orbit ring
  ScrollTrigger.create({
    trigger: section, start: "top 68%", once: true,
    onEnter: () => gsap.to(orbitWrap, { opacity: 1, duration: 0.7, ease: "power2.out" }),
  });

  // 3-6. Planets staggered — each fires at a different scroll point
  const planetStarts = ["top 55%", "top 42%", "top 30%", "top 18%"];
  let planetsRevealed = 0;

  cards.forEach((card, i) => {
    if (!card) return;
    ScrollTrigger.create({
      trigger: section,
      start: planetStarts[i],
      once: true,
      onEnter: () => {
        gsap.to(card, {
          opacity: 1, scale: 1,
          duration: 0.65,
          ease: "back.out(2.2)",
          overwrite: "auto",
        });
        planetsRevealed++;
        if (planetsRevealed === cards.length) {
          gsap.delayedCall(0.6, startOrbiting);
        }
      },
    });
  });

  // ── Continuous orbital animation ──────────────────────────
  let orbitStarted = false;

  function startOrbiting() {
    if (orbitStarted) return;
    orbitStarted = true;

    const PERIOD = 40; // seconds per full revolution
    const r = getRadius();

    pivots.forEach((pivot, i) => {
      const state = { angle: START_ANGLES[i] };

      gsap.to(state, {
        angle:      state.angle + Math.PI * 2,
        duration:   PERIOD,
        ease:       "none",
        repeat:     -1,
        onUpdate() {
          const radius = getRadius(); // stays responsive on resize
          gsap.set(pivot, {
            x: Math.cos(state.angle) * radius,
            y: Math.sin(state.angle) * radius,
          });
        },
      });
    });
  }

  // ── Mouse parallax — subtle depth on hub + orbit ring ──────
  let parallaxActive = false;

  ScrollTrigger.create({
    trigger:    section,
    start:      "top bottom",
    end:        "bottom top",
    onEnter:     () => { parallaxActive = true; },
    onLeave:     () => { parallaxActive = false; },
    onEnterBack: () => { parallaxActive = true; },
    onLeaveBack: () => { parallaxActive = false; },
  });

  window.addEventListener("mousemove", (e) => {
    if (!parallaxActive) return;
    const dx = (e.clientX / window.innerWidth  - 0.5);
    const dy = (e.clientY / window.innerHeight - 0.5);

    // Hub drifts toward mouse (appears close/foreground)
    gsap.to(hub, {
      x: dx * 18,
      y: dy * 18,
      duration: 0.9,
      ease: "power2.out",
      overwrite: "auto",
    });
    // Orbit ring drifts opposite (appears far/background)
    gsap.to(orbitWrap, {
      x: -dx * 10,
      y: -dy * 10,
      duration: 1.1,
      ease: "power2.out",
      overwrite: "auto",
    });
  });

  // ── Resize: reposition static pivots (if orbit not started) ─
  window.addEventListener("resize", () => {
    if (!orbitStarted) positionPivots();
  });
}

// ─────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────
function initAll() {
  initCursor();
  initNav();
  setupSolutionsRobot(robot);
  initOpsSolarAnimation();
  initSectionAnimations();
  initSolutionsPageAnimations(lenis);
  ScrollTrigger.refresh();
}

if (document.readyState === "complete") {
  initAll();
} else {
  window.addEventListener("load", initAll);
}

if (document.fonts?.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

window.__ST_refresh = () => ScrollTrigger.refresh();
