import { gsap } from "gsap";
import { device } from "../utils/deviceDetection.js";

export function initCursor() {
  if (device.pointerCoarse) return;

  const outer = document.createElement("div");
  const inner = document.createElement("div");
  outer.className = "cursor-outer";
  inner.className = "cursor-inner";
  document.body.append(outer, inner);

  const setOuterX = gsap.quickTo(outer, "x", { duration: 0.6, ease: "power3" });
  const setOuterY = gsap.quickTo(outer, "y", { duration: 0.6, ease: "power3" });
  const setInnerX = gsap.quickTo(inner, "x", { duration: 0.12, ease: "power2" });
  const setInnerY = gsap.quickTo(inner, "y", { duration: 0.12, ease: "power2" });

  let visible = false;
  function show() {
    if (visible) return;
    visible = true;
    gsap.to([outer, inner], { opacity: 1, duration: 0.3 });
  }
  gsap.set([outer, inner], { opacity: 0 });

  window.addEventListener("mousemove", (e) => {
    show();
    setOuterX(e.clientX);
    setOuterY(e.clientY);
    setInnerX(e.clientX);
    setInnerY(e.clientY);
  });

  document.addEventListener("mouseleave", () => {
    gsap.to([outer, inner], { opacity: 0, duration: 0.3 });
    visible = false;
  });

  const hoverSelector = "a, button, .domain-card, .service-item, input, textarea, [data-cursor='hover']";

  const onEnter = (el) => () => {
    if (el.matches("input, textarea")) {
      outer.classList.add("is-text");
    } else {
      outer.classList.add("is-hover");
      gsap.to(outer, { scale: 2.2, duration: 0.3, ease: "power2.out" });
    }
  };
  const onLeave = (el) => () => {
    outer.classList.remove("is-hover", "is-text");
    gsap.to(outer, { scale: 1, duration: 0.3, ease: "power2.out" });
  };

  function bindAll() {
    document.querySelectorAll(hoverSelector).forEach((el) => {
      if (el.dataset._cursorBound) return;
      el.dataset._cursorBound = "1";
      el.addEventListener("mouseenter", onEnter(el));
      el.addEventListener("mouseleave", onLeave(el));
    });
  }

  bindAll();

  // Re-bind when DOM mutates (e.g. dynamically inserted nodes)
  const obs = new MutationObserver(() => bindAll());
  obs.observe(document.body, { childList: true, subtree: true });

  // Mouse-down feedback
  window.addEventListener("mousedown", () =>
    gsap.to(outer, { scale: 0.7, duration: 0.18 })
  );
  window.addEventListener("mouseup", () =>
    gsap.to(outer, { scale: outer.classList.contains("is-hover") ? 2.2 : 1, duration: 0.22 })
  );
}
