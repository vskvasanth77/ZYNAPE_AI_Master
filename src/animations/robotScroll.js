import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { playWave, playPoint, playGesture, playScan, playWalkCycle, resetPose } from "../three/robot.js";
import { showSpeechBubble, hideSpeechBubble } from "../components/speechBubble.js";
import { getValue } from "../admin/contentStore.js";

gsap.registerPlugin(ScrollTrigger);

/*
 * ROBOT POSITION GUIDE (world half-width ≈ 2.84 units at z=0)
 *
 * All transforms go on the `orient` group. The `bob` child group
 * runs the idle loop underneath with no tween conflicts.
 *
 * Safe zones:
 *   x > +2.5  → far-right edge, clears text columns
 *   x < -2.5  → far-left edge, clears text columns
 *   y < -1.5  → well below centre, clears most HTML content
 *   scale < 0.5 → small enough to peek without dominating
 */

const TW = { overwrite: "auto", ease: "power3.inOut", duration: 1.2 };
let activeSection = null;

const MESSAGES = {
  home:       getValue("robotMessages.home")       || "Hi — I'm your guide. Scroll to explore.",
  solutions:  getValue("robotMessages.solutions")  || "Six domains. Pick one to dive in.",
  operations: getValue("robotMessages.operations") || "Cloud · SOC · NOC — operations that never sleep.",
  contact:    getValue("robotMessages.contact")    || "Let's connect — type your message.",
};

function widthScale() {
  const w = window.innerWidth;
  if (w < 760)  return 0.6;
  if (w < 1100) return 0.85;
  return 1;
}

export function setupRobotScroll(robot) {
  const orient = robot.userData.orient;

  function setSection(id) {
    if (activeSection === id) return;
    activeSection = id;
    if (!document.body.classList.contains("card-expanded")) {
      showSpeechBubble(MESSAGES[id]);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // HOME  ·  right side, large, waves — original behaviour
  // Robot docks top-right, away from the left-aligned hero text.
  // ─────────────────────────────────────────────────────────────
  ScrollTrigger.create({
    trigger:     "#home",
    start:       "top top",
    end:         "bottom top",
    onEnter:     onHome,
    onEnterBack: onHome,
  });

  function onHome() {
    setSection("home");
    resetPose(robot);
    const w = widthScale();
    gsap.to(orient.position, { x: 2.4 * w, y: -0.4, z: -0.3, ...TW });
    gsap.to(orient.rotation, { x: 0, y: -0.32, z: 0, ...TW });
    gsap.to(orient.scale,    { x: 0.88, y: 0.88, z: 0.88, ...TW });
    gsap.delayedCall(0.45, () => playWave(robot));
  }

  // ─────────────────────────────────────────────────────────────
  // SOLUTIONS (domain cards)
  // Far bottom-right corner, very small — cards breathe in centre.
  // y = -1.85 keeps the robot well below the 6-card grid.
  // ─────────────────────────────────────────────────────────────
  ScrollTrigger.create({
    trigger:     "#solutions",
    start:       "top 60%",
    end:         "bottom 40%",
    onEnter:     onSolutions,
    onEnterBack: onSolutions,
  });

  function onSolutions() {
    setSection("solutions");
    resetPose(robot);
    const w = widthScale();
    gsap.to(orient.scale,    { x: 0.46, y: 0.46, z: 0.46, ...TW });
    gsap.to(orient.position, { x: 2.60 * w, y: -1.85, z: 0.4, ...TW });
    gsap.to(orient.rotation, { x: 0, y: -0.40, z: 0, ...TW });
    gsap.delayedCall(0.6, () => playPoint(robot));
  }

  // ─────────────────────────────────────────────────────────────
  // OPERATIONS  ·  bottom-left corner, tiny
  // Ops panels have viz on left and text on right.
  // x = -2.78w + y = -1.90 clears both columns.
  // ─────────────────────────────────────────────────────────────
  ScrollTrigger.create({
    trigger:     "#operations",
    start:       "top 60%",
    end:         "bottom 40%",
    onEnter:     onOperations,
    onEnterBack: onOperations,
  });

  function onOperations() {
    setSection("operations");
    resetPose(robot);
    const w = widthScale();
    // Far right edge — partially off-screen is intentional (robot peeks from margin).
    // x=3.80 pushes the centre well past the content container on any viewport.
    // Scale 0.38 keeps the visible footprint small enough to sit in the margin strip.
    gsap.to(orient.scale,    { x: 0.38, y: 0.38, z: 0.38, ...TW });
    gsap.to(orient.position, { x: 4.70 * w, y: -0.45, z: 0.2, ...TW });
    gsap.to(orient.rotation, { x: 0, y: -0.55, z: 0, ...TW });
    gsap.delayedCall(0.55, () => playScan(robot));
  }

  // ─────────────────────────────────────────────────────────────
  // CONTACT  ·  bottom-right, small
  // Contact layout: form (left) · aside with info (right).
  // y = -1.85 keeps the robot below the aside text block.
  // ─────────────────────────────────────────────────────────────
  ScrollTrigger.create({
    trigger:     "#contact",
    start:       "top 70%",
    end:         "bottom 40%",
    onEnter:     onContact,
    onEnterBack: onContact,
    onLeave: () => hideSpeechBubble(),
  });

  function onContact() {
    setSection("contact");
    resetPose(robot);
    const w = widthScale();
    gsap.to(orient.scale,    { x: 0.52, y: 0.52, z: 0.52, ...TW });
    gsap.to(orient.position, { x: 2.65 * w, y: -1.85, z: 0.5, ...TW });
    gsap.to(orient.rotation, { x: 0, y: -0.44, z: 0, ...TW });
    gsap.delayedCall(0.4,  () => playWalkCycle(robot, 1.2));
    gsap.delayedCall(1.55, () => playWave(robot));
  }

  // Bubble: hide when domain card is expanded; restore on collapse
  const observer = new MutationObserver(() => {
    if (document.body.classList.contains("card-expanded")) {
      hideSpeechBubble();
    } else if (activeSection) {
      showSpeechBubble(MESSAGES[activeSection]);
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  // Resize: reapply current section position
  window.addEventListener("resize", () => {
    if (!activeSection) return;
    ({ home: onHome, solutions: onSolutions,
       operations: onOperations, contact: onContact })[activeSection]?.();
  });
}

export function celebrateContactSuccess(robot) {
  const { orient } = robot.userData;
  playWave(robot);
  gsap.to(orient.scale, {
    x: 1.1, y: 1.1, z: 1.1,
    duration: 0.4, yoyo: true, repeat: 1,
    ease: "power2.inOut", overwrite: "auto",
  });
}
