import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { config } from "../config/animationConfig.js";

gsap.registerPlugin(ScrollTrigger);

export function initHomeAnimations() {
  // Initial states
  gsap.set(".home__eyebrow", { opacity: 0, y: 14 });
  gsap.set(".char", { opacity: 0, y: 80, rotateX: -90 });
  gsap.set(".home__tagline", { opacity: 0, y: 30 });
  gsap.set(".home__sub", { opacity: 0, y: 20 });
  gsap.set(".home__actions .btn", { opacity: 0, scale: 0.85 });
  gsap.set(".stat", { opacity: 0, y: 20 });
  gsap.set(".home__scroll-hint", { opacity: 0 });
  gsap.set(".layer", { opacity: 0 });

  const tl = gsap.timeline({ delay: 0.25 });

  tl.to(".layer--grid", { opacity: 1, duration: 1.2, ease: "power2.out" })
    .to(".layer--1",    { opacity: 1, duration: 1.0, ease: "power2.out" }, "<")
    .to(".layer--2",    { opacity: 0.6, duration: 1.4, ease: "power2.out" }, "<0.2")
    .to(".home__eyebrow", { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.6")
    .to(".char", {
      opacity: 1,
      y: 0,
      rotateX: 0,
      stagger: 0.07,
      duration: 0.85,
      ease: config.ease.bounce,
    }, "-=0.3")
    .to(".home__tagline", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.4")
    .to(".home__sub",     { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.4")
    .to(".home__actions .btn", {
      opacity: 1, scale: 1, stagger: 0.08, duration: 0.5, ease: config.ease.bounce,
    }, "-=0.3")
    .to(".stat", { opacity: 1, y: 0, stagger: 0.1, duration: 0.55, ease: "power2.out" }, "-=0.2")
    .to(".home__scroll-hint", { opacity: 1, duration: 0.5 }, "-=0.2");

  // Animated counters
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.6,
      delay: 1.2,
      ease: "power2.out",
      onUpdate: () => { el.textContent = Math.floor(obj.v); },
    });
  });

  // CTA pulse loop
  gsap.to(".home__cta", {
    boxShadow: "0 14px 50px -8px rgba(0, 245, 212, 0.85)",
    repeat: -1,
    yoyo: true,
    duration: 1.6,
    ease: "sine.inOut",
    delay: 2,
  });

  // Mouse-driven parallax on background layers + logo
  const layers = [
    { sel: ".layer--1",    factor: 0.022 },
    { sel: ".layer--2",    factor: 0.04  },
    { sel: ".layer--grid", factor: 0.012 },
    { sel: ".home__logo",  factor: 0.008 },
  ];
  const setters = layers.map(({ sel, factor }) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    return {
      setX: gsap.quickTo(el, "x", { duration: 0.85, ease: "power3" }),
      setY: gsap.quickTo(el, "y", { duration: 0.85, ease: "power3" }),
      factor,
    };
  }).filter(Boolean);

  window.addEventListener("mousemove", (e) => {
    const dx = e.clientX - window.innerWidth  / 2;
    const dy = e.clientY - window.innerHeight / 2;
    setters.forEach(({ setX, setY, factor }) => {
      setX(dx * factor);
      setY(dy * factor);
    });
  });

  // Scroll-based exit: content fades + scales as user scrolls past
  ScrollTrigger.create({
    trigger: "#home",
    start: "top top",
    end: "bottom top",
    scrub: true,
    onUpdate: (self) => {
      gsap.set(".home__content", {
        opacity: 1 - self.progress * 1.1,
        scale:   1 - self.progress * 0.08,
        y:       self.progress * -60,
      });
    },
  });
}
