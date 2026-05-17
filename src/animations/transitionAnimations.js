import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initTransitions() {
  // Section background tone shifts as the user moves between sections
  gsap.timeline({
    scrollTrigger: {
      trigger: "#solutions",
      start: "top 60%",
      end: "bottom 40%",
      scrub: 0.8,
    },
  }).to(document.body, {
    backgroundColor: "#08082a",
    ease: "none",
  });

  gsap.timeline({
    scrollTrigger: {
      trigger: "#service",
      start: "top 60%",
      end: "bottom 40%",
      scrub: 0.8,
    },
  }).to(document.body, {
    backgroundColor: "#0a0a24",
    ease: "none",
  });

  // Diagonal wipe entry for solutions
  gsap.fromTo("#solutions",
    { clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)" },
    {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      duration: 1.1,
      ease: "expo.out",
      scrollTrigger: {
        trigger: "#solutions",
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
    }
  );

  // Scroll progress bar
  const progressEl = document.querySelector(".scroll-progress span");
  if (progressEl) {
    gsap.to(progressEl, {
      width: "100%",
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: true },
    });
  }
}
