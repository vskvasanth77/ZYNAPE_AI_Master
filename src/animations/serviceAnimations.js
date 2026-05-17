import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STEP_NAMES = ["Discover", "Design", "Build", "Validate", "Scale"];

export function initServiceAnimations() {
  // ===== Header reveal =====
  gsap.set(".service__head .section__eyebrow", { opacity: 0, y: 18 });
  gsap.set(".service__head .section__title",   { opacity: 0, y: 28 });

  ScrollTrigger.create({
    trigger: "#service",
    start: "top 72%",
    onEnter: () => {
      gsap.to(".service__head .section__eyebrow", { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" });
      gsap.to(".service__head .section__title",   { opacity: 1, y: 0, duration: 0.75, delay: 0.1, ease: "power3.out" });
    },
  });

  // ===== Inject watermark numbers =====
  document.querySelectorAll(".service-item").forEach((item) => {
    const front = item.querySelector(".service-card__front");
    if (!front || !item.dataset.step) return;
    const num = document.createElement("span");
    num.className = "service-card__num";
    num.setAttribute("aria-hidden", "true");
    num.textContent = item.dataset.step;
    front.appendChild(num);
  });

  // ===== Mobile fallback =====
  if (window.matchMedia("(max-width: 720px)").matches) {
    gsap.utils.toArray(".service-item").forEach((item, i) => {
      gsap.from(item, {
        opacity: 0, y: 40, duration: 0.7, delay: i * 0.06,
        ease: "power2.out",
        scrollTrigger: { trigger: item, start: "top 85%" },
      });
    });
    return;
  }

  const section      = document.getElementById("service");
  const pin          = document.querySelector(".service__pin");
  const track        = document.querySelector(".service-track");
  const progressFill = document.getElementById("svc-progress-fill");
  const activeLabel  = document.getElementById("svc-active-step");
  const dots         = Array.from(document.querySelectorAll(".svc-dot"));
  const items        = gsap.utils.toArray(".service-item");

  /* ============================================================
   * Single source of truth for scroll distance.
   *
   * _dist is computed by computeDist() and cached. BOTH the
   * section height setter AND the ScrollTrigger end callback read
   * _dist, so they can never be out of sync.
   *
   * Race-condition fix: we register a "refreshInit" listener so
   * computeDist() runs BEFORE ScrollTrigger recalculates any
   * trigger positions on ST.refresh(). Without this, fonts loading
   * can cause ST to recalculate with a stale section height.
   * ============================================================ */
  let _dist = 0;

  function computeDist() {
    _dist = Math.max(track.scrollWidth - window.innerWidth, 0);
  }

  function setSectionHeight() {
    computeDist();
    section.style.height = `${_dist + window.innerHeight}px`;
  }

  // Run before ScrollTrigger recalculates on every refresh cycle
  ScrollTrigger.addEventListener("refreshInit", setSectionHeight);

  // Also set once immediately and once after layout settles
  setSectionHeight();
  requestAnimationFrame(() => {
    setSectionHeight();
    ScrollTrigger.refresh();
  });

  window.addEventListener("resize", () => {
    setSectionHeight();
    ScrollTrigger.refresh();
  });

  // ===== Progress helpers =====
  function setActiveStep(idx) {
    const i = Math.max(0, Math.min(items.length - 1, idx));
    dots.forEach((d, j) => {
      d.classList.toggle("is-active", j === i);
      d.classList.toggle("is-past",   j < i);
    });
    if (activeLabel) {
      const name = STEP_NAMES[i] || "";
      if (activeLabel.textContent !== name) {
        activeLabel.textContent = name;
        activeLabel.classList.add("is-visible");
      }
    }
  }

  // ===== Core horizontal tween =====
  const scrollTween = gsap.to(track, {
    x: () => -_dist,
    ease: "none",
    scrollTrigger: {
      trigger: pin,
      start: "top top",
      end: () => `+=${_dist}`,          // always equal to setSectionHeight's _dist
      scrub: 1.0,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (progressFill) progressFill.style.width = `${self.progress * 100}%`;
        setActiveStep(Math.round(self.progress * items.length - 0.5));
      },
    },
  });

  // ===== Dot click — jump to that step =====
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const idx = parseInt(dot.dataset.svcDot, 10);
      if (isNaN(idx)) return;
      const fraction = idx / Math.max(items.length - 1, 1);
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      gsap.to(window, {
        scrollTo: { y: sectionTop + fraction * _dist },
        duration: 1.0, ease: "expo.inOut",
      });
    });
  });

  // ===== Per-card reveal =====
  items.forEach((item) => {
    const icon      = item.querySelector(".service-icon");
    const title     = item.querySelector(".service-title");
    const text      = item.querySelector(".service-text");
    const step      = item.querySelector(".service-step");
    const line      = item.querySelector(".service-line");
    const drawPaths = item.querySelectorAll(".draw-path");
    const num       = item.querySelector(".service-card__num");

    gsap.set(drawPaths, { strokeDashoffset: 100 });
    gsap.set([title, text, step], { opacity: 0, y: 18 });
    gsap.set(line,  { scaleX: 0 });
    gsap.set(icon,  { scale: 0.7, opacity: 0 });
    if (num) gsap.set(num, { opacity: 0, scale: 0.85 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: item,
        containerAnimation: scrollTween,
        start: "left 78%",
        end:   "right 55%",
        toggleActions: "play none none reverse",
      },
    });

    tl.to(icon,      { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" })
      .to(drawPaths, { strokeDashoffset: 0, duration: 0.9, stagger: 0.08, ease: "power2.out" }, "<")
      .to(step,      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.5")
      .to(title,     { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.35")
      .to(text,      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.38")
      .to(line,      { scaleX: 1,  duration: 0.6, ease: "expo.out" },         "-=0.3");
    if (num) tl.to(num, { opacity: 1, scale: 1, duration: 0.7, ease: "power2.out" }, "-=0.6");
  });

  // ===== Thread draw-on =====
  const threadPath = document.getElementById("thread-path");
  if (threadPath) {
    const len = threadPath.getTotalLength();
    gsap.set(threadPath, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(threadPath, {
      strokeDashoffset: 0, ease: "none",
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: () => `+=${_dist}`,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
  }

  setActiveStep(0);
}
