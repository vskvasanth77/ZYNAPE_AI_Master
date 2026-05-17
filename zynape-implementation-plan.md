# Zynape — Complete Implementation Plan
> Robot-guided 3D parallax website · GSAP-powered · 4 sections · Sub-domain animations

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Phase 0 — Project Setup](#4-phase-0--project-setup)
5. [Phase 1 — Robot Guide (3D Character System)](#5-phase-1--robot-guide-3d-character-system)
6. [Phase 2 — Home Section](#6-phase-2--home-section)
7. [Phase 3 — Solutions Section](#7-phase-3--solutions-section)
8. [Phase 4 — Service Section](#8-phase-4--service-section)
9. [Phase 5 — Contact Section](#9-phase-5--contact-section)
10. [Phase 6 — Global Systems](#10-phase-6--global-systems)
11. [Animation Reference](#11-animation-reference)
12. [Performance Guidelines](#12-performance-guidelines)
13. [Claude Prompt Guide](#13-claude-prompt-guide)

---

## 1. Project Overview

**Zynape** is a visually extraordinary company website built around a 3D robot mascot that guides users through four sections: Home, Solutions, Service, and Contact. The experience is driven by GSAP ScrollTrigger and Three.js, with smooth parallax layers, extraordinary level transitions, and domain-specific sub-animations in the Solutions and Service sections.

### Core Experience Goals

- A robot/AI mascot lives on a persistent Three.js canvas and reacts to every scroll event
- Each section transition is a cinematic moment — not a fade, but a wipe, shatter, or zoom
- The Solutions section expands domain cards to fullscreen with unique 3D environments
- The Service section uses horizontal sticky scroll with connected animated threads
- Contact is the emotional finale — the robot waves, confetti fires, form morphs on submit

---

## 2. Tech Stack

| Category | Library / Tool | Purpose |
|---|---|---|
| Build tool | Vite | Fast dev server, ESM bundling |
| 3D engine | Three.js r165 | Robot, backgrounds, mini-scenes |
| Animation | GSAP 3 + ScrollTrigger | All motion, scroll-driven animation |
| GSAP plugins | Flip, TextPlugin, ScrollTo, MorphSVG | Card transitions, typewriter, nav scroll, SVG morph |
| Smooth scroll | Lenis | Buttery scroll synced with GSAP ticker |
| Styling | Tailwind CSS | Utility-first layout |
| 3D assets | GLTF/GLB | Robot model and domain mini-scenes |
| Shaders | GLSL (optional) | Portal transition, aurora background |

### GSAP Plugin Registration

```js
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { TextPlugin } from "gsap/TextPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

gsap.registerPlugin(ScrollTrigger, Flip, TextPlugin, ScrollToPlugin, MorphSVGPlugin);
```

### Lenis + GSAP Sync

```js
import Lenis from "lenis";

const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);
```

---

## 3. Project Structure

```
zynape/
├── index.html
├── vite.config.js
├── public/
│   └── models/
│       ├── robot.glb              # Main robot mascot
│       ├── ai-scene.glb           # AI & Automation mini-scene
│       ├── cloud-scene.glb        # Cloud Infra mini-scene
│       └── ...
├── src/
│   ├── main.js                    # Entry point, Lenis + GSAP init
│   ├── three/
│   │   ├── renderer.js            # Shared WebGLRenderer setup
│   │   ├── robot.js               # Robot loader, animations, scroll behavior
│   │   ├── particles.js           # Background particle field
│   │   ├── scenes/
│   │   │   ├── homeScene.js
│   │   │   ├── solutionsScene.js
│   │   │   ├── serviceScene.js
│   │   │   └── contactScene.js
│   │   └── domainScenes/
│   │       ├── aiScene.js
│   │       ├── cloudScene.js
│   │       ├── cybersecScene.js
│   │       ├── webScene.js
│   │       ├── dataScene.js
│   │       └── designScene.js
│   ├── animations/
│   │   ├── homeAnimations.js
│   │   ├── solutionsAnimations.js
│   │   ├── serviceAnimations.js
│   │   ├── contactAnimations.js
│   │   └── transitionAnimations.js
│   ├── components/
│   │   ├── cursor.js
│   │   ├── nav.js
│   │   ├── speechBubble.js
│   │   └── domainCard.js
│   ├── config/
│   │   └── animationConfig.js     # Shared ease/duration/stagger values
│   └── styles/
│       ├── globals.css
│       ├── variables.css
│       └── sections/
│           ├── home.css
│           ├── solutions.css
│           ├── service.css
│           └── contact.css
```

---

## 4. Phase 0 — Project Setup

### 4.1 Install Dependencies

```bash
npm create vite@latest zynape -- --template vanilla
cd zynape
npm install gsap three lenis tailwindcss
npm install -D @gsap/member  # if using Club GSAP plugins
```

### 4.2 Three.js Renderer (Fixed Canvas)

The renderer canvas must be `position: fixed` behind all HTML content. This is the architectural foundation — all Three.js scenes render here persistently as scroll changes which scene is active.

```js
// src/three/renderer.js
import * as THREE from "three";

const canvas = document.getElementById("bg-canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

export { renderer };
```

```css
/* Fixed canvas behind all content */
#bg-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

/* All sections sit above canvas */
section {
  position: relative;
  z-index: 1;
}
```

### 4.3 Global Animation Config

```js
// src/config/animationConfig.js
export const config = {
  ease: {
    smooth: "power2.out",
    bounce: "back.out(1.7)",
    snap: "expo.out",
    in: "power3.in",
    elastic: "elastic.out(1, 0.5)",
  },
  duration: {
    fast: 0.4,
    normal: 0.7,
    slow: 1.2,
    cinematic: 1.8,
  },
  stagger: {
    tight: 0.05,
    normal: 0.1,
    loose: 0.18,
  },
};
```

### 4.4 CSS Variables

```css
/* src/styles/variables.css */
:root {
  /* Brand palette */
  --color-bg:        #050510;
  --color-bg-2:      #0a0a24;
  --color-accent:    #00f5d4;
  --color-accent-2:  #7b2ff7;
  --color-accent-3:  #ff6b6b;
  --color-text:      #e8e8f0;
  --color-text-muted:#8888aa;

  /* Z-index layers */
  --z-canvas:   0;
  --z-content:  1;
  --z-robot:    2;
  --z-bubble:   3;
  --z-card-exp: 10;
  --z-nav:      20;
  --z-cursor:   100;

  /* Typography */
  --font-display: "Space Grotesk", sans-serif;
  --font-body:    "Inter", sans-serif;
  --font-mono:    "JetBrains Mono", monospace;
}
```

---

## 5. Phase 1 — Robot Guide (3D Character System)

The robot is the soul of Zynape. It lives on the fixed Three.js canvas and its behavior changes with every scroll milestone.

### 5.1 Robot Model

Source a `.glb` robot model from one of:
- **Sketchfab** — search "robot" filtered by CC0/Creative Commons
- **Spline** — design a custom robot and export as `.glb`
- **Mixamo** — humanoid character with pre-rigged animations

Recommended design: sleek humanoid with a glowing visor, jointed limbs, and a compact silhouette that reads well at small sizes.

```js
// src/three/robot.js
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";

let robot, mixer, animations = {};

export async function loadRobot(scene) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync("/models/robot.glb");

  robot = gltf.scene;
  robot.scale.set(0.8, 0.8, 0.8);
  robot.position.set(3, -1.5, 0);
  scene.add(robot);

  // Emissive visor glow
  robot.traverse((child) => {
    if (child.isMesh && child.name.includes("visor")) {
      child.material.emissive = new THREE.Color(0x00f5d4);
      child.material.emissiveIntensity = 1.2;
    }
  });

  // Animation mixer
  mixer = new THREE.AnimationMixer(robot);
  gltf.animations.forEach((clip) => {
    animations[clip.name] = mixer.clipAction(clip);
  });

  startIdleFloat();
  return robot;
}
```

### 5.2 Idle Float Animation

```js
function startIdleFloat() {
  gsap.to(robot.position, {
    y: "+=0.12",
    repeat: -1,
    yoyo: true,
    duration: 2,
    ease: "sine.inOut",
  });

  gsap.to(robot.rotation, {
    y: "+=0.08",
    repeat: -1,
    yoyo: true,
    duration: 3,
    ease: "sine.inOut",
  });

  // Visor glow pulse
  robot.traverse((child) => {
    if (child.isMesh && child.name.includes("visor")) {
      gsap.to(child.material, {
        emissiveIntensity: 0.6,
        repeat: -1,
        yoyo: true,
        duration: 1.5,
        ease: "sine.inOut",
      });
    }
  });
}
```

### 5.3 Scroll-Driven Robot Behavior

```js
// src/three/robot.js — scroll behavior
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function setupRobotScrollBehavior(robot) {

  // HOME: Robot enters, points at headline
  ScrollTrigger.create({
    trigger: "#home",
    start: "top top",
    end: "bottom top",
    onEnter: () => {
      gsap.to(robot.position, { x: 1.8, y: -0.5, z: 0, duration: 1.2, ease: "back.out(1.4)" });
      gsap.to(robot.rotation, { y: -0.3, duration: 1 });
      playAnimation("wave");
    },
  });

  // SOLUTIONS: Robot flies across, spins, lands left
  ScrollTrigger.create({
    trigger: "#solutions",
    start: "top center",
    onEnter: () => {
      const tl = gsap.timeline();
      tl.to(robot.position, { x: -4, duration: 0.6, ease: "power3.in" })
        .to(robot.rotation, { y: Math.PI * 2, duration: 0.6 }, "<")
        .to(robot.position, { x: -2.5, y: -0.8, duration: 0.8, ease: "back.out(1.7)" })
        .to(robot.rotation, { y: 0.4, duration: 0.5 });
    },
  });

  // SERVICE: Robot shrinks to corner, gestures
  ScrollTrigger.create({
    trigger: "#service",
    start: "top center",
    onEnter: () => {
      gsap.to(robot.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 0.8, ease: "power2.out" });
      gsap.to(robot.position, { x: 3.5, y: -2, duration: 0.8, ease: "power2.out" });
      playAnimation("point");
    },
  });

  // CONTACT: Robot walks toward camera, waves
  ScrollTrigger.create({
    trigger: "#contact",
    start: "top center",
    onEnter: () => {
      gsap.to(robot.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 1, ease: "power2.out" });
      gsap.to(robot.position, { x: 0, y: -0.3, z: 1, duration: 1, ease: "power2.out" });
      playAnimation("wave");
      showSpeechBubble("Let's connect! 👋");
    },
  });
}

function playAnimation(name) {
  if (!animations[name]) return;
  Object.values(animations).forEach((a) => a.fadeOut(0.3));
  animations[name].reset().fadeIn(0.3).play();
}
```

### 5.4 Speech Bubble System

The speech bubble is an HTML overlay. Its position is computed by projecting the robot's head position from 3D to screen space every frame.

```js
// src/components/speechBubble.js
const bubble = document.getElementById("speech-bubble");

export function showSpeechBubble(text) {
  bubble.classList.add("visible");
  gsap.to(bubble, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" });

  // Typewriter effect
  let i = 0;
  bubble.querySelector(".text").textContent = "";
  const interval = setInterval(() => {
    bubble.querySelector(".text").textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
  }, 45);
}

export function hideSpeechBubble() {
  gsap.to(bubble, {
    opacity: 0, scale: 0.8, duration: 0.3,
    onComplete: () => bubble.classList.remove("visible"),
  });
}

// Track robot head in screen space each frame
export function updateBubblePosition(robotHead, camera) {
  const pos = robotHead.getWorldPosition(new THREE.Vector3());
  pos.project(camera);

  const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;

  bubble.style.left = `${x + 20}px`;
  bubble.style.top = `${y - 60}px`;
}
```

---

## 6. Phase 2 — Home Section

### 6.1 HTML Structure

```html
<section id="home">
  <div class="home__layers">
    <div class="layer layer--1"></div>   <!-- Blurred geometric shapes -->
    <div class="layer layer--2"></div>   <!-- Secondary parallax -->
  </div>
  <div class="home__content">
    <h1 class="home__logo">
      <span class="char" data-char="Z">Z</span>
      <span class="char" data-char="Y">Y</span>
      <span class="char" data-char="N">N</span>
      <span class="char" data-char="A">A</span>
      <span class="char" data-char="P">P</span>
      <span class="char" data-char="E">E</span>
    </h1>
    <p class="home__tagline">Intelligence. Engineered.</p>
    <a href="#solutions" class="home__cta">Explore Zynape</a>
  </div>
</section>
```

### 6.2 Three.js Particle Field

```js
// src/three/particles.js
import * as THREE from "three";

export function createParticleField(scene) {
  const count = 3000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 20;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x00f5d4,
    size: 0.02,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Slow rotation
  gsap.to(particles.rotation, {
    y: Math.PI * 2,
    duration: 80,
    repeat: -1,
    ease: "none",
  });

  return particles;
}
```

### 6.3 Home Entrance Animation

```js
// src/animations/homeAnimations.js
import { gsap } from "gsap";
import { config } from "../config/animationConfig.js";

export function playHomeEntrance() {
  const tl = gsap.timeline({ delay: 0.3 });

  // Particles fade in
  tl.from(".layer--1", { opacity: 0, duration: 0.8 })

  // Logo letter scramble
  .from(".char", {
    opacity: 0,
    y: 60,
    rotateX: -90,
    stagger: 0.08,
    duration: 0.7,
    ease: config.ease.bounce,
  }, "-=0.3")

  // Tagline slides up
  .from(".home__tagline", {
    opacity: 0,
    y: 30,
    duration: config.duration.normal,
    ease: config.ease.smooth,
  }, "-=0.2")

  // CTA button pulses in
  .from(".home__cta", {
    opacity: 0,
    scale: 0.8,
    duration: config.duration.fast,
    ease: config.ease.bounce,
  }, "-=0.1")

  // CTA idle pulse
  .to(".home__cta", {
    boxShadow: "0 0 30px var(--color-accent)",
    repeat: -1,
    yoyo: true,
    duration: 1.5,
    ease: "sine.inOut",
  });

  return tl;
}
```

### 6.4 Mouse Parallax

```js
let mouseX = 0, mouseY = 0;
const layers = [
  { el: document.querySelector(".layer--1"), factor: 0.02 },
  { el: document.querySelector(".layer--2"), factor: 0.04 },
  { el: document.querySelector(".home__logo"), factor: 0.01 },
];

const quickSetters = layers.map((l) => ({
  x: gsap.quickTo(l.el, "x", { duration: 0.8, ease: "power3" }),
  y: gsap.quickTo(l.el, "y", { duration: 0.8, ease: "power3" }),
  factor: l.factor,
}));

window.addEventListener("mousemove", (e) => {
  mouseX = (e.clientX - window.innerWidth / 2);
  mouseY = (e.clientY - window.innerHeight / 2);

  quickSetters.forEach((qs) => {
    qs.x(mouseX * qs.factor);
    qs.y(mouseY * qs.factor);
  });
});
```

### 6.5 Home Scroll Exit

```js
ScrollTrigger.create({
  trigger: "#home",
  start: "top top",
  end: "bottom top",
  scrub: true,
  onUpdate: (self) => {
    gsap.set(".home__content", {
      opacity: 1 - self.progress,
      scale: 1 - self.progress * 0.1,
      y: self.progress * -50,
    });
  },
});
```

---

## 7. Phase 3 — Solutions Section

### 7.1 Section Transition (Home → Solutions)

```js
// src/animations/transitionAnimations.js

export function homeToSolutions() {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#solutions",
      start: "top 80%",
      toggleActions: "play none none reverse",
    },
  });

  // Diagonal wipe mask
  tl.fromTo("#solutions",
    { clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)" },
    { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 1.2, ease: "expo.out" }
  );

  // Background color shift
  tl.to("body", { backgroundColor: "#08082a", duration: 1 }, "<");

  return tl;
}
```

### 7.2 Domain Cards

**The 6 Domains:**

| Domain | Icon | Three.js Mini-scene |
|---|---|---|
| AI & Automation | Neural net icon | Rotating neural network nodes |
| Cloud Infrastructure | Cloud icon | Spinning wireframe globe |
| Cybersecurity | Shield icon | Pulsing shield with particle deflection |
| Web Platforms | Browser icon | Floating UI component tree |
| Data Analytics | Chart icon | Animated bar chart in 3D |
| Product Design | Pencil icon | Orbiting design shapes |

```html
<!-- Domain card HTML -->
<div class="domain-card" data-domain="ai">
  <div class="domain-card__front">
    <div class="domain-card__icon"><!-- SVG icon --></div>
    <h3 class="domain-card__title">AI & Automation</h3>
    <p class="domain-card__desc">Intelligent systems that learn and adapt</p>
  </div>
</div>
```

### 7.3 Card Enter Animation

```js
// src/animations/solutionsAnimations.js

export function animateDomainCards() {
  gsap.from(".domain-card", {
    opacity: 0,
    rotateY: 90,
    transformOrigin: "left center",
    stagger: 0.1,
    duration: 0.8,
    ease: "back.out(1.7)",
    scrollTrigger: {
      trigger: "#solutions",
      start: "top 60%",
    },
  });
}
```

### 7.4 Card Hover Effect

```js
document.querySelectorAll(".domain-card").forEach((card) => {
  card.addEventListener("mouseenter", () => {
    gsap.to(card, {
      y: -8,
      scale: 1.03,
      boxShadow: "0 20px 60px rgba(0, 245, 212, 0.25)",
      duration: 0.35,
      ease: "power2.out",
    });
    gsap.to(card.querySelector(".domain-card__icon"), {
      rotation: 360,
      duration: 0.6,
      ease: "back.out(1.4)",
    });
  });

  card.addEventListener("mouseleave", () => {
    gsap.to(card, {
      y: 0,
      scale: 1,
      boxShadow: "none",
      duration: 0.35,
      ease: "power2.out",
    });
  });
});
```

### 7.5 Card Expand to Fullscreen (GSAP Flip)

```js
// src/components/domainCard.js
import { Flip } from "gsap/Flip";

let expandedCard = null;

export function expandCard(card) {
  const state = Flip.getState(card);

  card.classList.add("domain-card--expanded");
  document.body.classList.add("card-expanded");

  Flip.from(state, {
    duration: 0.8,
    ease: "expo.inOut",
    absolute: true,
    onComplete: () => {
      loadDomainScene(card.dataset.domain);
      animateDomainContent(card);
    },
  });

  expandedCard = card;
}

export function collapseCard() {
  if (!expandedCard) return;
  const state = Flip.getState(expandedCard);

  expandedCard.classList.remove("domain-card--expanded");
  document.body.classList.remove("card-expanded");

  Flip.from(state, {
    duration: 0.7,
    ease: "expo.inOut",
  });

  unloadDomainScene(expandedCard.dataset.domain);
  expandedCard = null;
}
```

### 7.6 Domain Sub-page Animation

When a card expands, the inner content animates in from below:

```js
function animateDomainContent(card) {
  const content = card.querySelectorAll(".domain-content > *");
  gsap.from(content, {
    opacity: 0,
    y: 40,
    stagger: 0.1,
    duration: 0.6,
    ease: "power2.out",
    delay: 0.4,
  });
}
```

---

## 8. Phase 4 — Service Section

### 8.1 Transition (Solutions → Service)

**Option A — Shatter:**
```js
export function solutionsToService() {
  // Create fragment elements programmatically
  const fragments = createFragments("#solutions", 20);

  gsap.to(fragments, {
    x: "random(-400, 400)",
    y: "random(-300, 300)",
    rotation: "random(-180, 180)",
    opacity: 0,
    duration: 0.8,
    stagger: 0.02,
    ease: "power3.in",
    onComplete: () => fragments.forEach((f) => f.remove()),
  });
}
```

**Option B — Horizontal slide (simpler, recommended first):**
```js
gsap.timeline({
  scrollTrigger: { trigger: "#service", start: "top 80%", toggleActions: "play none none reverse" }
})
.to("#solutions", { x: "-100%", duration: 0.8, ease: "expo.in" })
.from("#service", { x: "100%", duration: 0.8, ease: "expo.out" }, "<0.2");
```

### 8.2 Horizontal Sticky Scroll Setup

```js
// src/animations/serviceAnimations.js

export function setupHorizontalScroll() {
  const serviceItems = gsap.utils.toArray(".service-item");
  const totalWidth = serviceItems.reduce((sum, el) => sum + el.offsetWidth + 60, 0);

  gsap.to(serviceItems, {
    x: () => -(totalWidth - window.innerWidth),
    ease: "none",
    scrollTrigger: {
      trigger: "#service",
      start: "top top",
      end: () => `+=${totalWidth}`,
      scrub: 1,
      pin: true,
      anticipatePin: 1,
    },
  });
}
```

### 8.3 Service Item Animations

Each service item reveals as it enters the viewport during horizontal scroll:

```js
gsap.utils.toArray(".service-item").forEach((item, i) => {
  const icon = item.querySelector(".service-icon");
  const title = item.querySelector(".service-title");
  const text = item.querySelector(".service-text");
  const line = item.querySelector(".service-line");

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: item,
      containerAnimation: horizontalScrollTween,
      start: "left 80%",
    },
  });

  // SVG icon draws in via stroke-dashoffset
  tl.from(icon.querySelectorAll("path"), {
    strokeDashoffset: 100,
    duration: 0.8,
    ease: "power2.out",
  })

  // Title types in
  .from(title, { opacity: 0, y: 20, duration: 0.5, ease: "power2.out" }, "-=0.3")

  // Text reveals
  .from(text, { opacity: 0, y: 15, duration: 0.5, ease: "power2.out" }, "-=0.2")

  // Accent line grows
  .from(line, { scaleX: 0, transformOrigin: "left center", duration: 0.6, ease: "expo.out" }, "-=0.3");
});
```

### 8.4 Connecting Thread Animation

An SVG path draws between service items as scroll progresses:

```html
<svg class="service-thread" viewBox="0 0 3000 200" preserveAspectRatio="none">
  <path id="thread-path" d="M0,100 C300,20 600,180 900,100 C1200,20 1500,180 1800,100 C2100,20 2400,180 2700,100" />
</svg>
```

```js
const threadPath = document.getElementById("thread-path");
const threadLength = threadPath.getTotalLength();

gsap.set(threadPath, { strokeDasharray: threadLength, strokeDashoffset: threadLength });

gsap.to(threadPath, {
  strokeDashoffset: 0,
  ease: "none",
  scrollTrigger: {
    trigger: "#service",
    start: "top top",
    end: `+=${totalServiceWidth}`,
    scrub: 1,
  },
});
```

### 8.5 Service Card 3D Flip (Hover)

```css
.service-item {
  perspective: 800px;
}

.service-card-inner {
  transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  transform-style: preserve-3d;
}

.service-item:hover .service-card-inner {
  transform: rotateY(180deg);
}

.service-card-back {
  backface-visibility: hidden;
  transform: rotateY(180deg);
  position: absolute;
  inset: 0;
}
```

---

## 9. Phase 5 — Contact Section

### 9.1 Transition (Service → Contact) — Portal Zoom

```js
export function serviceToContact() {
  const tl = gsap.timeline({
    scrollTrigger: { trigger: "#contact", start: "top 80%", toggleActions: "play none none reverse" }
  });

  // Portal vortex (CSS radial zoom)
  tl.from("#contact", {
    clipPath: "circle(0% at 50% 50%)",
    duration: 1.2,
    ease: "expo.out",
  });

  // Background shift to calm starfield
  tl.to("body", { backgroundColor: "#020210", duration: 1 }, "<");

  return tl;
}
```

### 9.2 Contact Form Animation

```html
<section id="contact">
  <div class="contact__inner">
    <h2 class="contact__heading">Start a conversation</h2>
    <form class="contact__form" novalidate>
      <div class="field-group">
        <input type="text" id="name" required>
        <label for="name">Your name</label>
      </div>
      <div class="field-group">
        <input type="email" id="email" required>
        <label for="email">Email address</label>
      </div>
      <div class="field-group">
        <textarea id="message" rows="4" required></textarea>
        <label for="message">Message</label>
      </div>
      <button type="submit" class="contact__submit">
        <span class="btn-text">Send message</span>
        <svg class="btn-spinner" viewBox="0 0 50 50"><!-- spinner --></svg>
        <svg class="btn-check" viewBox="0 0 50 50"><!-- checkmark path --></svg>
      </button>
    </form>
  </div>
</section>
```

```js
// Form fields animate in
gsap.from(".field-group", {
  opacity: 0,
  y: 40,
  stagger: 0.12,
  duration: 0.7,
  ease: "power2.out",
  scrollTrigger: { trigger: "#contact", start: "top 60%" },
});
```

### 9.3 Submit Button Morph

```js
document.querySelector(".contact__form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector(".contact__submit");

  // Text → spinner
  gsap.to(btn.querySelector(".btn-text"), { opacity: 0, duration: 0.3 });
  gsap.to(btn.querySelector(".btn-spinner"), { opacity: 1, rotation: 360, repeat: -1, duration: 0.8, ease: "none" });

  await submitForm(e.target); // Your API call

  // Spinner → checkmark (MorphSVG)
  gsap.to(btn.querySelector(".btn-spinner"), { opacity: 0 });
  gsap.to(btn.querySelector(".btn-check"), { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" });

  // Confetti burst
  fireConfetti();

  // Robot victory wave
  playRobotAnimation("victory");
});
```

### 9.4 Confetti (Three.js Particles)

```js
export function fireConfetti(scene) {
  const count = 200;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const confettiColors = [
    new THREE.Color(0x00f5d4), // accent
    new THREE.Color(0x7b2ff7), // purple
    new THREE.Color(0xff6b6b), // coral
    new THREE.Color(0xffe066), // yellow
  ];

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 0.5;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    const c = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({ size: 0.05, vertexColors: true });
  const confetti = new THREE.Points(geometry, material);
  scene.add(confetti);

  // Explode outward then gravity
  gsap.to(confetti.position, { y: 3, duration: 1.5, ease: "power2.out" });
  gsap.to(confetti.position, { y: -5, duration: 1.5, delay: 1, ease: "power2.in",
    onComplete: () => scene.remove(confetti)
  });
}
```

---

## 10. Phase 6 — Global Systems

### 10.1 Custom Cursor

```js
// src/components/cursor.js
const cursorOuter = document.createElement("div");
const cursorInner = document.createElement("div");
cursorOuter.className = "cursor-outer";
cursorInner.className = "cursor-inner";
document.body.append(cursorOuter, cursorInner);

const moveOuter = gsap.quickTo([cursorOuter], "left", { duration: 0.6, ease: "power3" });
const moveOuterY = gsap.quickTo([cursorOuter], "top",  { duration: 0.6, ease: "power3" });
const moveInner  = gsap.quickTo([cursorInner], "left", { duration: 0.1 });
const moveInnerY = gsap.quickTo([cursorInner], "top",  { duration: 0.1 });

window.addEventListener("mousemove", (e) => {
  moveOuter(e.clientX);  moveOuterY(e.clientY);
  moveInner(e.clientX);  moveInnerY(e.clientY);
});

// Cursor states
document.querySelectorAll("a, button, .domain-card").forEach((el) => {
  el.addEventListener("mouseenter", () =>
    gsap.to(cursorOuter, { scale: 2.5, duration: 0.3, ease: "power2.out" }));
  el.addEventListener("mouseleave", () =>
    gsap.to(cursorOuter, { scale: 1, duration: 0.3, ease: "power2.out" }));
});
```

```css
.cursor-outer {
  position: fixed;
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-accent);
  border-radius: 50%;
  pointer-events: none;
  z-index: var(--z-cursor);
  transform: translate(-50%, -50%);
  mix-blend-mode: difference;
}

.cursor-inner {
  position: fixed;
  width: 6px;
  height: 6px;
  background: var(--color-accent);
  border-radius: 50%;
  pointer-events: none;
  z-index: var(--z-cursor);
  transform: translate(-50%, -50%);
}
```

### 10.2 Floating Navigation

```html
<nav class="zynape-nav" id="main-nav">
  <a href="#home"      class="nav-item" data-section="home">Home</a>
  <a href="#solutions" class="nav-item" data-section="solutions">Solutions</a>
  <a href="#service"   class="nav-item" data-section="service">Service</a>
  <a href="#contact"   class="nav-item" data-section="contact">Contact</a>
  <span class="nav-indicator"></span>
</nav>
```

```js
// Show nav after first scroll
ScrollTrigger.create({
  start: 100,
  onEnter: () => gsap.to("#main-nav", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }),
  onLeaveBack: () => gsap.to("#main-nav", { opacity: 0, y: -20, duration: 0.3 }),
});

// Smooth scroll on nav click
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const target = item.getAttribute("href");
    gsap.to(window, { scrollTo: target, duration: 1.2, ease: "expo.inOut" });
  });
});

// Active indicator slide
const sections = ["home", "solutions", "service", "contact"];
sections.forEach((id) => {
  ScrollTrigger.create({
    trigger: `#${id}`,
    start: "top center",
    end: "bottom center",
    onToggle: (self) => self.isActive && updateNavIndicator(id),
  });
});
```

---

## 11. Animation Reference

### GSAP ScrollTrigger Pattern

```js
// Standard scroll-triggered animation pattern
gsap.from(".element", {
  opacity: 0,
  y: 50,
  duration: 0.8,
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".element",        // Element that triggers animation
    start: "top 80%",           // When top of element hits 80% from viewport top
    end: "bottom 20%",          // When bottom of element hits 20%
    toggleActions: "play none none reverse", // onEnter onLeave onEnterBack onLeaveBack
    scrub: false,               // true = ties animation to scroll position
    pin: false,                 // true = pins element during scroll
    markers: false,             // true = shows debug markers
  },
});
```

### Ease Cheat Sheet

| Ease | Use case |
|---|---|
| `power2.out` | Most animations — smooth natural feel |
| `expo.out` | Snappy UI elements, menus |
| `back.out(1.7)` | Elements that need a slight overshoot |
| `elastic.out(1, 0.5)` | Playful, bouncy elements |
| `sine.inOut` | Idle loops, breathing animations |
| `expo.inOut` | Section transitions, page-level moves |
| `none` | Scrub animations tied to scroll |

### Three.js Render Loop

```js
// Always sync Three.js with GSAP ticker, not requestAnimationFrame directly
gsap.ticker.add(() => {
  const delta = clock.getDelta();
  mixer?.update(delta);         // Robot animations
  renderer.render(scene, camera);
});
```

---

## 12. Performance Guidelines

### Device Detection

```js
// src/utils/deviceDetection.js
const isLowEnd = navigator.hardwareConcurrency <= 4
  || window.innerWidth < 768;

export const quality = {
  particleCount: isLowEnd ? 800 : 3000,
  useShaders: !isLowEnd,
  robotDetail: isLowEnd ? "low" : "high",
  enableBloom: !isLowEnd,
};
```

### Render Loop Pause

```js
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    gsap.ticker.sleep();
  } else {
    gsap.ticker.wake();
  }
});
```

### Reduced Motion

```js
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(0);  // Pause all animations
  // Show static version
}
```

### Lazy-load Domain Scenes

```js
// Only load Three.js mini-scene when card is clicked, not on page load
async function loadDomainScene(domain) {
  const { default: init } = await import(`./three/domainScenes/${domain}Scene.js`);
  init(expandedCardCanvas);
}
```

---

## 13. Claude Prompt Guide

Use these prompts with Claude to build each phase. Copy and paste exactly.

### Phase 0 — Setup
> "Build the Zynape project scaffolding: Vite + vanilla JS, install GSAP with ScrollTrigger and Lenis smooth scroll, set up a fixed Three.js WebGLRenderer canvas as a background layer with alpha: true, and define CSS custom properties for a dark futuristic brand palette (dark navy backgrounds, cyan and purple accents). Show the complete file structure and vite.config.js."

### Phase 1 — Robot
> "Create a Three.js robot guide for Zynape using BoxGeometry and SphereGeometry primitives (no GLB needed). The robot should have a body, head with an emissive cyan visor, two arms, and two legs. Add an idle float animation using GSAP. Set up ScrollTrigger so the robot moves to a different screen position and plays a different animation when each of the 4 sections (Home, Solutions, Service, Contact) enters the viewport."

### Phase 2 — Home
> "Build the Zynape Home section as a complete HTML/CSS/JS module. Include: a Three.js particle field (3000 points, cyan color, slow rotation), a 5-layer CSS parallax stack, a GSAP entrance timeline where the ZYNAPE logo does a letter-by-letter 3D flip-in (rotateX from -90deg), tagline slides up, and a CTA button pulses. Add mouse-move parallax with gsap.quickTo on each layer."

### Phase 3 — Solutions
> "Build the Zynape Solutions section with 6 domain cards: AI & Automation, Cloud Infrastructure, Cybersecurity, Web Platforms, Data Analytics, Product Design. Cards should enter with staggered rotateY(90deg → 0) animation. On hover: card lifts 8px with a cyan glow box-shadow and the icon spins 360°. On click: use GSAP Flip plugin to expand the card to fullscreen. Inside the expanded view, slide content up from below with stagger. Add a close button that reverses the Flip animation."

### Phase 4 — Service
> "Build the Zynape Service section with horizontal sticky scroll using GSAP ScrollTrigger pin. Include 5 service items. Each item should have: an SVG icon that draws in via stroke-dashoffset animation, a title that fades up, and descriptive text. Add an SVG wavy path that connects all items and draws progressively as scroll advances using stroke-dashoffset tied to scrub. Add CSS 3D card-flip on hover to reveal service details on the back face."

### Phase 5 — Contact
> "Build the Zynape Contact section with: a clip-path circle expansion transition (circle(0% at 50% 50%) → full), a contact form with floating labels (label moves to top on input focus), all fields animate in with stagger on scroll. The submit button should: show a spinner on click, morph to a checkmark SVG on success using GSAP MorphSVGPlugin. On success, fire a Three.js confetti particle burst."

### Phase 6 — Global Systems
> "Build the Zynape global systems: (1) A custom cursor with a large lagging outer ring (gsap.quickTo, 0.6s) and small instant inner dot. Cursor scales 2.5x on hover over interactive elements. (2) A floating pill navigation bar that appears after 100px scroll with smooth GSAP scrollTo on click. (3) An active section indicator line that slides between nav items using ScrollTrigger. (4) Pause the Three.js render loop on tab hide using visibilitychange."

---

*Zynape Implementation Plan — Generated by Claude · Build in phases, test scroll after each, enjoy the ride.*
