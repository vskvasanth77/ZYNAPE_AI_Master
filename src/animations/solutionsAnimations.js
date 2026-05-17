import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initSolutionsAnimations() {
  gsap.set(".section--solutions .section__eyebrow", { opacity: 0, y: 18 });
  gsap.set(".section--solutions .section__title", { opacity: 0, y: 28 });
  gsap.set(".section--solutions .section__lede", { opacity: 0, y: 18 });
  gsap.set(".domain-card", { opacity: 0, rotateY: 70, transformPerspective: 1200 });

  ScrollTrigger.create({
    trigger: "#solutions",
    start: "top 75%",
    onEnter: () => {
      const tl = gsap.timeline();
      tl.to(".section--solutions .section__eyebrow", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" })
        .to(".section--solutions .section__title", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.3")
        .to(".section--solutions .section__lede", { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.4")
        .to(".domain-card", {
          opacity: 1,
          rotateY: 0,
          stagger: { each: 0.1, from: "start" },
          duration: 0.85,
          ease: "back.out(1.5)",
          transformOrigin: "left center",
        }, "-=0.3");
    },
  });

  // Card hover micro-interactions
  document.querySelectorAll(".domain-card").forEach((card) => {
    const icon = card.querySelector(".domain-card__icon");
    card.addEventListener("mouseenter", () => {
      if (card.classList.contains("is-expanded")) return;
      gsap.to(card, { y: -8, scale: 1.02, duration: 0.4, ease: "power2.out" });
      gsap.to(icon, { rotate: 360, duration: 0.7, ease: "back.out(1.5)" });
    });
    card.addEventListener("mouseleave", () => {
      if (card.classList.contains("is-expanded")) return;
      gsap.to(card, { y: 0, scale: 1, duration: 0.4, ease: "power2.out" });
      gsap.set(icon, { rotate: 0 });
    });

    // Subtle 3D tilt on mousemove
    card.addEventListener("mousemove", (e) => {
      if (card.classList.contains("is-expanded")) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(card, {
        rotateY: x * 8,
        rotateX: -y * 8,
        duration: 0.5,
        ease: "power2.out",
        transformPerspective: 1200,
      });
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: "power2.out" });
    });
  });
}
