import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

export function initOperationsAnimations() {
  // ===== Section header reveal =====
  gsap.set(".ops__head .section__eyebrow", { opacity: 0, y: 18 });
  gsap.set(".ops__head .section__title",   { opacity: 0, y: 28 });
  gsap.set(".ops__head .section__lede",    { opacity: 0, y: 18 });

  ScrollTrigger.create({
    trigger: "#operations",
    start: "top 75%",
    onEnter: () => {
      gsap.to(".ops__head .section__eyebrow", { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" });
      gsap.to(".ops__head .section__title",   { opacity: 1, y: 0, duration: 0.75, delay: 0.1, ease: "power3.out" });
      gsap.to(".ops__head .section__lede",    { opacity: 1, y: 0, duration: 0.65, delay: 0.2, ease: "power3.out" });
    },
  });

  // ===== Panel reveal — staggered slide-up =====
  gsap.utils.toArray(".ops-panel").forEach((panel, i) => {
    ScrollTrigger.create({
      trigger: panel,
      start: "top 82%",
      onEnter: () => {
        gsap.to(panel, {
          opacity: 1, y: 0,
          duration: 0.95,
          delay: i * 0.08,
          ease: "expo.out",
        });
      },
    });
  });

  // Activate per-panel viz only when in view (perf)
  initCloudDC();
  initSOC();
  initNOC();
}

// ============================================================
// CLOUD DATA CENTER — server LEDs blinking + flow particles
// ============================================================
function initCloudDC() {
  const viz = document.querySelector(".dc-viz");
  if (!viz) return;
  const leds = viz.querySelectorAll(".dc-rack-leds rect");
  const conduit = viz.querySelector(".dc-conduit");
  const conduitPulse = viz.querySelector(".dc-conduit-pulse");
  const flowDots = viz.querySelectorAll(".dc-flow circle");
  const racks = viz.querySelectorAll(".dc-rack");

  // Conduit dash for flow effect
  const conduitLen = conduit.getTotalLength();
  conduit.style.strokeDasharray = `${conduitLen * 0.2} ${conduitLen}`;
  conduit.style.strokeDashoffset = conduitLen;

  let active = false;
  const onView = (visible) => { active = visible; };

  ScrollTrigger.create({
    trigger: viz,
    start: "top 90%",
    end: "bottom 10%",
    onToggle: (s) => onView(s.isActive),
  });

  // LEDs flickering — random subset on
  function tickLeds() {
    if (!active) { gsap.delayedCall(0.4, tickLeds); return; }
    leds.forEach((led) => {
      if (Math.random() > 0.55) led.classList.add("is-on");
      else led.classList.remove("is-on");
    });
    gsap.delayedCall(0.18 + Math.random() * 0.12, tickLeds);
  }
  tickLeds();

  // Subtle rack hover
  racks.forEach((rack, i) => {
    gsap.to(rack, {
      y: -1.2,
      duration: 1.4 + i * 0.07,
      yoyo: true, repeat: -1, ease: "sine.inOut",
    });
  });

  // Conduit dash drift
  gsap.to(conduit, {
    strokeDashoffset: 0,
    duration: 2.4, ease: "none", repeat: -1,
  });

  // Conduit pulse traveling across the top
  gsap.fromTo(conduitPulse,
    { attr: { cx: 0 } },
    { attr: { cx: 360 }, duration: 2.6, repeat: -1, ease: "none" },
  );

  // Flow particles rising through the cooling aisle
  flowDots.forEach((dot, i) => {
    gsap.fromTo(dot,
      { attr: { cx: 152 + Math.random() * 56, cy: 172 } },
      {
        attr: { cy: 48 },
        duration: 2.6 + Math.random() * 1.2,
        delay: i * 0.4,
        repeat: -1,
        ease: "sine.inOut",
        onRepeat: () => gsap.set(dot, { attr: { cx: 152 + Math.random() * 56 } }),
      });
    gsap.fromTo(dot,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, delay: i * 0.4, repeat: -1, repeatDelay: (2.4 + Math.random()), yoyo: true, ease: "power1.inOut" });
  });
}

// ============================================================
// SOC — radar sweep + threat blips + telemetry bars
// ============================================================
function initSOC() {
  const viz = document.querySelector(".soc-viz");
  if (!viz) return;
  const sweep = viz.querySelector(".soc-sweep");
  const rings = viz.querySelectorAll(".soc-ring");
  const blips = viz.querySelectorAll(".soc-blip");
  const pulse = viz.querySelector(".soc-pulse");
  const bars  = viz.querySelectorAll(".soc-bar");

  // Sweep rotation
  gsap.set(sweep, { transformOrigin: "center", transformBox: "fill-box" });
  gsap.to(sweep, { rotation: 360, duration: 5, repeat: -1, ease: "none" });

  // Concentric rings breathing
  rings.forEach((r, i) => {
    gsap.to(r, {
      attr: { "stroke-opacity": 0.65 },
      duration: 1.4 + i * 0.4,
      yoyo: true, repeat: -1, ease: "sine.inOut",
    });
  });

  // Blips: pulse + fade in/out, occasionally spawn at random positions
  blips.forEach((b, i) => {
    const tl = gsap.timeline({ repeat: -1, delay: i * 0.4 });
    tl.set(b, { scale: 0, opacity: 0, transformOrigin: "center", transformBox: "fill-box" })
      .to(b, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" })
      .to(b, { scale: 1.6, opacity: 0, duration: 1.2, ease: "power2.out" }, "+=0.6");
  });

  // Center pulse
  gsap.fromTo(pulse,
    { scale: 0.7, opacity: 0.85 },
    { scale: 2.4, opacity: 0, duration: 1.6, repeat: -1, ease: "power1.out" },
  );

  // Telemetry bars — flicker on/off staggered
  bars.forEach((bar, i) => {
    gsap.to(bar, {
      attr: { width: () => 20 + Math.random() * 18 },
      duration: 0.45 + Math.random() * 0.25,
      delay: i * 0.06,
      yoyo: true, repeat: -1, ease: "power2.inOut",
    });
  });
}

// ============================================================
// NOC — packets traveling along edges, node pulses, ticker
// ============================================================
function initNOC() {
  const viz = document.querySelector(".noc-viz");
  if (!viz) return;
  const edges = Array.from(viz.querySelectorAll(".noc-edge"));
  const packets = Array.from(viz.querySelectorAll(".noc-packet"));
  const nodes = viz.querySelectorAll(".noc-node circle");
  const ticks = viz.querySelectorAll(".noc-tick");

  // Animate dashed edges scrolling
  edges.forEach((e, i) => {
    gsap.set(e, { strokeDasharray: "6 6", strokeDashoffset: 0 });
    gsap.to(e, {
      strokeDashoffset: -120,
      duration: 4 + (i % 3),
      repeat: -1, ease: "none",
    });
  });

  // Packets traverse random edges
  packets.forEach((packet, i) => {
    function go() {
      const edge = edges[Math.floor(Math.random() * edges.length)];
      gsap.fromTo(packet,
        { motionPath: { path: edge, align: edge, alignOrigin: [0.5, 0.5], start: 0, end: 0 }, opacity: 1 },
        {
          motionPath: { path: edge, align: edge, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
          duration: 1.6 + Math.random() * 1.2,
          ease: "power1.inOut",
          onComplete: go,
        });
    }
    gsap.delayedCall(i * 0.5, go);
  });

  // Node pulses
  nodes.forEach((n, i) => {
    gsap.to(n, {
      scale: 1.2,
      duration: 1.0 + i * 0.18,
      yoyo: true, repeat: -1, ease: "sine.inOut",
    });
  });

  // Ticker bars (latency)
  ticks.forEach((t, i) => {
    gsap.to(t, {
      scaleY: () => 0.4 + Math.random() * 1.6,
      duration: 0.4,
      delay: i * 0.04,
      repeat: -1, yoyo: true, ease: "power2.inOut",
    });
  });
}
