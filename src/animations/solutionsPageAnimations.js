/**
 * Advanced parallax & UX animations for solutions.html
 * Runs on top of the base entrance animations in solutions-main.js.
 * All effects use GSAP + Lenis — no additional libraries needed.
 *
 * Effects:
 *  1. Velocity skew   — page content leans with scroll momentum
 *  2. Depth parallax  — visual layers move at different speeds
 *  3. SVG wipe reveal — migration illustrations wipe in from sides
 *  4. 3D card tilt    — OPS / metric cards rotate with mouse
 *  5. Magnetic CTAs   — buttons follow cursor and snap back elastically
 *  6. Number counters — stat values count up on enter
 *  7. Floating layers — SOC hub rotates, AI viz drifts, aurora blobs drift
 *  8. Eyebrow focus   — letter-spacing compresses as section enters
 *  9. Divider lines   — gradient lines draw across section headers on scroll
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// ── Entry point ───────────────────────────────────────────────
export function initSolutionsPageAnimations(lenis) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  velocitySkew(lenis);
  depthParallax();
  migrationWipeReveal();
  cardTilt3D();
  magneticButtons();
  statCounters();
  floatingLayers();
  eyebrowFocus();
  sectionDividerLines();
  heroEnhancement();

  // Tech-themed parallax (website-contextual)
  ghostSectionNumbers();
  dataStreamSidebar();
  techFloatingNodes();
  migrationBeamVelocity(lenis);
  socScanLine();
}

// ── 1. Velocity skew ──────────────────────────────────────────
// As the user scrolls fast, the page content leans slightly in the
// direction of motion. Gives the impression of physical momentum.
function velocitySkew(lenis) {
  if (!lenis) return;

  const proxy      = { skew: 0 };
  const skewSetter = gsap.quickSetter("#page", "skewY", "deg");
  const clamp      = gsap.utils.clamp(-0.45, 0.45);

  lenis.on("scroll", ({ velocity }) => {
    const target = clamp(velocity * 0.009);
    gsap.to(proxy, {
      skew: target,
      duration: 0.75,
      ease: "power3.out",
      overwrite: true,
      onUpdate: () => skewSetter(proxy.skew),
    });
  });
}

// ── 2. Depth parallax ─────────────────────────────────────────
// Layers are separated into foreground (faster) and background (slower).
// This creates a convincing sense of 3D depth on a flat page.
function depthParallax() {
  // FAST layers — visuals drift further (feels close, active)
  const fastLayers = [
    { sel: ".ops-grid-new",    yDist: 50, scrub: 1.1 },
    { sel: ".ops-hub-wrap",    yDist: 70, scrub: 0.9 },
    { sel: ".ai-viz",          yDist: 80, scrub: 1.0 },
    { sel: ".ai-metrics",      yDist: 40, scrub: 0.9 },
  ];

  fastLayers.forEach(({ sel, yDist, scrub }) => {
    gsap.utils.toArray(sel).forEach(el => {
      const section = el.closest(".sol-section");
      if (!section) return;
      gsap.to(el, {
        scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub },
        y: yDist,
        ease: "none",
      });
    });
  });

  // SLOW layers — text headers barely move (feel anchored, readable)
  gsap.utils.toArray(".sol-section .section__head").forEach(head => {
    gsap.to(head, {
      scrollTrigger: {
        trigger: head.closest(".sol-section"),
        start: "top bottom",
        end: "bottom top",
        scrub: 1.8,
      },
      y: -30,
      ease: "none",
    });
  });

  // Migration illustrations drift in OPPOSITE vertical directions
  // (on-prem floats up, cloud floats down) — visual breathing room
  gsap.to(".migration-side--onprem", {
    scrollTrigger: { trigger: "#sol-migration", start: "top bottom", end: "bottom top", scrub: 1.3 },
    y: -35,
    ease: "none",
  });
  gsap.to(".migration-side--cloud", {
    scrollTrigger: { trigger: "#sol-migration", start: "top bottom", end: "bottom top", scrub: 1.5 },
    y: 35,
    ease: "none",
  });
  gsap.to(".migration-steps", {
    scrollTrigger: { trigger: "#sol-migration", start: "top bottom", end: "bottom top", scrub: 1.3 },
    y: 12,
    ease: "none",
  });
}

// ── 3. Migration SVG wipe-in ──────────────────────────────────
// On-prem SVG reveals from left → right (like it's being unveiled).
// Cloud SVG reveals from right → left (mirrored) after a slight delay.
function migrationWipeReveal() {
  gsap.from(".migration-side--onprem svg", {
    scrollTrigger: { trigger: "#sol-migration", start: "top 68%", once: true },
    clipPath: "inset(0 100% 0 0)",
    duration: 1.3,
    ease: "power3.inOut",
  });

  gsap.from(".migration-side--cloud svg", {
    scrollTrigger: { trigger: "#sol-migration", start: "top 68%", once: true },
    clipPath: "inset(0 0 0 100%)",
    duration: 1.3,
    ease: "power3.inOut",
    delay: 0.4,
  });
}

// ── 4. 3D card tilt on hover ──────────────────────────────────
// Cards rotate on both axes to follow the mouse position.
// On leave, they snap back with an elastic overshoot.
function cardTilt3D() {
  const targets = [
    ...document.querySelectorAll(".ops-card-new"),
    ...document.querySelectorAll(".sol-metric"),
    ...document.querySelectorAll(".soc-layout .sol-metric, .ai-metrics .sol-metric"),
  ];

  // Give parent containers a perspective context so rotation looks 3D
  [".ops-grid-new", ".sol-metrics", ".ai-metrics"].forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.style.perspective = "900px";
    });
  });

  targets.forEach(card => {
    card.style.transformStyle = "preserve-3d";
    card.style.willChange     = "transform";

    card.addEventListener("mousemove", e => {
      const r  = card.getBoundingClientRect();
      const dx = ((e.clientX - r.left) / r.width  - 0.5) * 2;  // −1 → +1
      const dy = ((e.clientY - r.top)  / r.height - 0.5) * 2;

      gsap.to(card, {
        rotateY:  dx * 10,
        rotateX: -dy * 10,
        scale:    1.035,
        duration: 0.35,
        ease:     "power2.out",
        overwrite: "auto",
      });
    });

    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        rotateY: 0, rotateX: 0, scale: 1,
        duration: 0.7,
        ease:     "back.out(1.3)",
        overwrite: "auto",
      });
    });
  });
}

// ── 5. Magnetic buttons ───────────────────────────────────────
// Buttons drift toward the cursor when hovered and snap back
// elastically on leave — gives a "pull" tactile feel.
function magneticButtons() {
  document.querySelectorAll(".btn").forEach(btn => {
    const strength = 0.3;

    btn.addEventListener("mousemove", e => {
      const r  = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  / 2)) * strength;
      const dy = (e.clientY - (r.top  + r.height / 2)) * strength;
      gsap.to(btn, { x: dx, y: dy, duration: 0.3, ease: "power2.out" });
    });

    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
    });
  });
}

// ── 6. Number counters ────────────────────────────────────────
// Numeric stat values animate from 0 to their final value
// when they scroll into view. Respects prefix/suffix formatting.
function statCounters() {
  document.querySelectorAll(".sol-metric strong").forEach(el => {
    const raw = el.textContent.trim();
    const m   = raw.match(/^([^0-9]*)(\d+(?:\.\d+)?)(.*)$/);
    if (!m) return;

    const prefix = m[1];
    const num    = parseFloat(m[2]);
    const suffix = m[3];
    const isInt  = Number.isInteger(num);
    const obj    = { v: 0 };

    ScrollTrigger.create({
      trigger: el,
      start:   "top 88%",
      once:    true,
      onEnter: () => {
        gsap.to(obj, {
          v: num,
          duration: 2,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent =
              prefix +
              (isInt ? Math.round(obj.v) : obj.v.toFixed(2)) +
              suffix;
          },
        });
      },
    });
  });
}

// ── 7. Floating layers ────────────────────────────────────────
// Selected elements drift / rotate as their parent section scrolls
// through the viewport — creates a sense of weight and depth.
function floatingLayers() {
  // SOC hub diagram — slow clockwise rotation
  const socHub = document.querySelector("#sol-soc .hub-diagram");
  if (socHub) {
    gsap.to(socHub, {
      scrollTrigger: {
        trigger: "#sol-soc",
        start: "top bottom",
        end: "bottom top",
        scrub: 2.5,
      },
      rotate: 14,
      transformOrigin: "center center",
      ease: "none",
    });
  }

  // AI neural-net SVG — gentle drift + tilt
  const aiSvg = document.querySelector(".ai-network-svg");
  if (aiSvg) {
    gsap.to(aiSvg, {
      scrollTrigger: {
        trigger: "#sol-ai",
        start: "top bottom",
        end: "bottom top",
        scrub: 2,
      },
      y: -55,
      rotate: 4,
      transformOrigin: "center center",
      ease: "none",
    });
  }

  // Aurora blobs — each at a different speed so they drift independently
  const blobSpeeds = [1.6, 2.2, 1.1];
  const blobYDists = [-180, 140, -120];

  document.querySelectorAll(".aurora__blob").forEach((blob, i) => {
    gsap.to(blob, {
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: blobSpeeds[i] ?? 1.5,
      },
      y: blobYDists[i] ?? -100,
      ease: "none",
    });
  });
}

// ── 8. Eyebrow letter-spacing focus ───────────────────────────
// Section eyebrows start with wider letter-spacing and tighten
// as the section scrolls into the reading zone — a subtle focus cue.
function eyebrowFocus() {
  document.querySelectorAll(".sol-section .section__eyebrow").forEach(el => {
    const section = el.closest(".sol-section");
    if (!section) return;

    gsap.fromTo(
      el,
      { letterSpacing: "0.22em" },
      {
        letterSpacing: "0.14em",
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "top 30%",
          scrub: 1.5,
        },
      }
    );
  });
}

// ── 9. Section divider lines ──────────────────────────────────
// A thin gradient line draws from left → right beneath each section
// header as it scrolls into the reading zone.
function sectionDividerLines() {
  document.querySelectorAll(".sol-section .section__head").forEach(head => {
    const line = document.createElement("div");
    line.setAttribute("aria-hidden", "true");
    line.style.cssText = [
      "height: 1px",
      "width: 0%",
      "margin-top: 1.5rem",
      "border-radius: 1px",
      "background: linear-gradient(90deg, var(--color-accent), var(--color-accent-2), transparent)",
      "opacity: 0.55",
      "pointer-events: none",
    ].join("; ");
    head.appendChild(line);

    gsap.to(line, {
      scrollTrigger: {
        trigger: head,
        start: "top 78%",
        once: true,
      },
      width: "100%",
      duration: 1.4,
      ease: "power3.inOut",
    });
  });
}

// ── 10. Hero enhancement ──────────────────────────────────────
// Replaces the basic hero fade-in with a cinematic sequence:
// eyebrow slides from left, h1 does a clip-path reveal from below,
// lede and buttons follow with stagger.
function heroEnhancement() {
  const hero = document.getElementById("sol-hero");
  if (!hero) return;

  // Kill the existing simple hero timeline so we don't double-animate
  ScrollTrigger.getAll()
    .filter(st => st.vars?.trigger === "#sol-hero" || st.trigger === hero)
    .forEach(st => st.kill());

  // Set initial states (overriding the opacity:0 CSS)
  gsap.set(".sol-hero__eyebrow", { opacity: 0, x: -36 });
  gsap.set(".sol-hero h1",       { opacity: 0, clipPath: "inset(0 0 100% 0)", y: 16 });
  gsap.set(".sol-hero__lede",    { opacity: 0, y: 24 });
  gsap.set(".sol-hero__actions .btn", { opacity: 0, y: 20, scale: 0.88 });

  const tl = gsap.timeline({ delay: 0.25 });

  tl.to(".sol-hero__eyebrow", {
    opacity: 1, x: 0,
    duration: 0.75,
    ease: "power3.out",
  })
  .to(".sol-hero h1", {
    opacity: 1,
    clipPath: "inset(0 0 0% 0)",
    y: 0,
    duration: 1.15,
    ease: "power4.out",
  }, "-=0.35")
  .to(".sol-hero__lede", {
    opacity: 1, y: 0,
    duration: 0.85,
    ease: "power3.out",
  }, "-=0.65")
  .to(".sol-hero__actions .btn", {
    opacity: 1, y: 0, scale: 1,
    duration: 0.65,
    stagger: 0.12,
    ease: "back.out(1.5)",
  }, "-=0.5");
}

// ═══════════════════════════════════════════════════════════════
// TECH-THEMED WEBSITE-CONTEXTUAL PARALLAX
// Effects that reinforce the infrastructure / AI / security theme
// ═══════════════════════════════════════════════════════════════

// ── T1. Ghost section numbers ─────────────────────────────────
// Huge, faint section numbers sit behind each section and drift
// at a slower rate than the content — creating apparent depth.
// Common in high-end agency/tech sites to signal structure.
function ghostSectionNumbers() {
  const map = [
    { id: "sol-migration", num: "01" },
    { id: "sol-ops",       num: "02" },
    { id: "sol-ai",        num: "03" },
    { id: "sol-soc",       num: "04" },
  ];

  map.forEach(({ id, num }) => {
    const section = document.getElementById(id);
    if (!section) return;

    const ghost = document.createElement("span");
    ghost.setAttribute("aria-hidden", "true");
    ghost.className = "section-ghost-num";
    ghost.textContent = num;
    section.appendChild(ghost);

    // Parallax: ghost moves up more slowly than content → feels anchored behind
    gsap.to(ghost, {
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.5,
      },
      y: -60,
      ease: "none",
    });
  });
}

// ── T2. Data-stream sidebar ───────────────────────────────────
// Three thin vertical "data pipe" lines appear in the far-right margin.
// Animated dots travel downward at different speeds, suggesting
// live telemetry / data flow — reinforcing the infrastructure theme.
function dataStreamSidebar() {
  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.className = "data-streams-sidebar";
  document.getElementById("page")?.appendChild(container);

  const speeds    = [2.2, 3.4, 1.9];
  const delays    = [0, 1.1, 2.0];
  const heights   = ["40vh", "55vh", "30vh"];
  const hues      = [
    "var(--color-accent)",
    "var(--color-accent-2)",
    "var(--color-accent)",
  ];

  speeds.forEach((speed, i) => {
    const pipe = document.createElement("div");
    pipe.className = "data-pipe";

    const dot = document.createElement("div");
    dot.className = "data-pipe__dot";
    dot.style.setProperty("--dot-color", hues[i]);
    dot.style.height = heights[i];
    pipe.appendChild(dot);
    container.appendChild(pipe);

    // Infinite downward travel — restarts at top automatically
    gsap.to(dot, {
      yPercent: 200,
      duration: speed,
      ease: "none",
      repeat: -1,
      delay: delays[i],
    });
  });
}

// ── T3. Floating tech nodes ───────────────────────────────────
// Small hexagonal nodes drift through the hero and AI sections
// at different parallax rates — like network nodes in a live diagram.
// Each moves at a unique speed so they separate visually over time.
function techFloatingNodes() {
  const placements = [
    { parent: "#sol-hero",   x: "12%",  y: "25%", size: 18, scrub: 0.7, yDist: -80 },
    { parent: "#sol-hero",   x: "88%",  y: "60%", size: 12, scrub: 1.1, yDist: -50 },
    { parent: "#sol-hero",   x: "72%",  y: "30%", size: 8,  scrub: 0.5, yDist: -110 },
    { parent: "#sol-ai",     x: "8%",   y: "40%", size: 14, scrub: 0.9, yDist: -70 },
    { parent: "#sol-ai",     x: "92%",  y: "55%", size: 10, scrub: 1.3, yDist: -60 },
    { parent: "#sol-migration", x: "6%", y: "70%", size: 10, scrub: 0.8, yDist: -80 },
    { parent: "#sol-migration", x: "95%",y: "30%", size: 14, scrub: 1.2, yDist: -55 },
  ];

  placements.forEach(({ parent, x, y, size, scrub, yDist }) => {
    const section = document.querySelector(parent);
    if (!section) return;

    const node = document.createElement("div");
    node.setAttribute("aria-hidden", "true");
    node.className = "tech-node";
    node.style.left   = x;
    node.style.top    = y;
    node.style.width  = `${size}px`;
    node.style.height = `${size}px`;
    section.appendChild(node);

    gsap.to(node, {
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub,
      },
      y: yDist,
      ease: "none",
    });
  });
}

// ── T4. Migration beam velocity response ──────────────────────
// The .migration-conn-beams speed up / slow down based on how fast
// the user scrolls — faster scroll = faster data migration beams.
// Implemented by adjusting CSS animation-duration via Lenis velocity.
function migrationBeamVelocity(lenis) {
  if (!lenis) return;
  const beams = document.querySelectorAll(".conn-beam");
  if (!beams.length) return;

  let baseSpeed = 3;   // seconds per cycle at rest

  lenis.on("scroll", ({ velocity }) => {
    const v = Math.abs(velocity);
    // Fast scroll = shorter duration (faster animation); slow = back to base
    const targetSpeed = Math.max(0.6, baseSpeed - v * 0.12);
    beams.forEach(beam => {
      beam.style.animationDuration = `${targetSpeed}s`;
    });
  });
}

// ── T5. SOC scan-line sweep ───────────────────────────────────
// A thin horizontal "scan line" sweeps down the SOC section once
// when it enters the viewport — like a SIEM dashboard initialising.
// Reinforces the security operations / threat-monitoring theme.
function socScanLine() {
  const soc = document.getElementById("sol-soc");
  if (!soc) return;

  const scan = document.createElement("div");
  scan.setAttribute("aria-hidden", "true");
  scan.className = "soc-scanline";
  soc.appendChild(scan);

  ScrollTrigger.create({
    trigger: soc,
    start: "top 65%",
    once: true,
    onEnter: () => {
      gsap.fromTo(scan,
        { top: "0%", opacity: 0.7 },
        { top: "100%", opacity: 0, duration: 2.4, ease: "power1.inOut" }
      );
    },
  });
}
