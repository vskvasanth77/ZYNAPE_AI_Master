import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export function initNav() {
  const nav = document.getElementById("main-nav");
  const indicator = nav.querySelector(".nav-indicator");
  const items = Array.from(nav.querySelectorAll(".nav-item"));

  // Reveal nav after scroll
  ScrollTrigger.create({
    start: 80,
    onEnter: () => gsap.to(nav, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }),
    onLeaveBack: () => gsap.to(nav, { opacity: 0, y: -20, duration: 0.4 }),
  });

  function moveIndicatorTo(item) {
    if (!item) return;
    const navRect = nav.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    gsap.to(indicator, {
      left: itemRect.left - navRect.left,
      width: itemRect.width,
      duration: 0.6,
      ease: "expo.out",
    });
  }

  function setActive(id) {
    items.forEach((it) => it.classList.toggle("is-active", it.dataset.section === id));
    moveIndicatorTo(items.find((it) => it.dataset.section === id));
  }

  // Initial measurement
  requestAnimationFrame(() => {
    const initial = items.find((it) => it.classList.contains("is-active")) || items[0];
    moveIndicatorTo(initial);
  });

  window.addEventListener("resize", () => {
    moveIndicatorTo(items.find((it) => it.classList.contains("is-active")));
  });

  // Click → smooth scroll or page navigate
  items.forEach((item) => {
    item.addEventListener("click", (e) => {
      const href = item.getAttribute("href");
      if (!href.startsWith("#")) {
        window.location.href = href;
        return;
      }
      e.preventDefault();
      gsap.to(window, {
        scrollTo: { y: href, offsetY: 0 },
        duration: 1.1,
        ease: "expo.inOut",
      });
    });
  });

  // ScrollTriggers per section update active.
  // "solutions" is intentionally excluded — it is a separate page (/solutions.html),
  // not a scroll section on the home page. Clicking it navigates to that page.
  // Home page scroll sequence: home → operations → contact.
  // Guard: skip any section ID that doesn't exist on the current page.
  ["home", "operations", "contact"].forEach((id) => {
    if (!document.getElementById(id)) return;
    ScrollTrigger.create({
      trigger: `#${id}`,
      start: "top center",
      end: "bottom center",
      onToggle: (self) => self.isActive && setActive(id),
    });
  });
}
