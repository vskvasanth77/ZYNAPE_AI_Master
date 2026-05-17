import { gsap } from "gsap";
import { quality } from "../utils/deviceDetection.js";

const sceneLoaders = {
  ai:        () => import("../three/domainScenes/aiScene.js"),
  cloud:     () => import("../three/domainScenes/cloudScene.js"),
  cybersec:  () => import("../three/domainScenes/cybersecScene.js"),
  web:       () => import("../three/domainScenes/webScene.js"),
  data:      () => import("../three/domainScenes/dataScene.js"),
  design:    () => import("../three/domainScenes/designScene.js"),
};

let activeCard = null;
let activeScene = null;
let activeDetail = null;

/* Modal backdrop is created once and reused */
const backdrop = document.createElement("div");
backdrop.className = "domain-backdrop";
document.body.appendChild(backdrop);

export function initDomainCards() {
  const cards = document.querySelectorAll(".domain-card");

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      if (card.classList.contains("is-expanded")) return;
      if (e.target.closest(".domain-card__close")) return;
      expandCard(card);
    });

    card.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && !card.classList.contains("is-expanded")) {
        e.preventDefault();
        expandCard(card);
      }
    });

    // Bind close once — the button stays in the same DOM node when portal'd
    const closeBtn = card.querySelector(".domain-card__close");
    closeBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      collapseCard();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activeCard) collapseCard();
  });

  backdrop.addEventListener("click", () => collapseCard());
}

function expandCard(card) {
  activeCard = card;
  document.body.classList.add("card-expanded");

  const detail = card.querySelector(".domain-card__detail");
  activeDetail = detail;

  // Portal: lift the modal out of the (transformed) card into <body>
  // so position:fixed actually anchors to the viewport.
  document.body.appendChild(detail);

  // Reveal
  detail.style.display = "block";
  card.classList.add("is-expanded");

  // Backdrop fade
  gsap.set(backdrop, { display: "block", opacity: 0 });
  gsap.to(backdrop, { opacity: 1, duration: 0.4, ease: "power2.out" });

  // Modal entrance
  gsap.fromTo(detail,
    { opacity: 0, scale: 0.94, y: 24 },
    { opacity: 1, scale: 1, y: 0, duration: 0.65, ease: "expo.out" }
  );

  // Stagger interior content
  const items = detail.querySelectorAll(".domain-detail__copy > *");
  const viz = detail.querySelector(".domain-detail__viz");
  gsap.set(items, { opacity: 0, y: 28 });
  gsap.set(viz,   { opacity: 0, scale: 0.92 });

  gsap.to(items, {
    opacity: 1, y: 0, stagger: 0.07, duration: 0.55, ease: "power3.out", delay: 0.25,
  });
  gsap.to(viz, {
    opacity: 1, scale: 1, duration: 0.7, ease: "expo.out", delay: 0.35,
  });

  // Bind close button (re-bind because portal'd)
  const closeBtn = detail.querySelector(".domain-card__close");
  closeBtn?.addEventListener("click", onCloseClick, { once: true });

  // Lazy-load mini-scene
  if (quality.enableDomainViz) {
    const domain = card.dataset.domain;
    const canvas = detail.querySelector(`canvas[data-domain-canvas="${domain}"]`);
    if (canvas && sceneLoaders[domain]) {
      sceneLoaders[domain]().then((mod) => {
        if (activeCard !== card) return;
        activeScene = mod.default(canvas);
      });
    }
  }
}

function onCloseClick(e) {
  e.stopPropagation();
  collapseCard();
}

function collapseCard() {
  if (!activeCard || !activeDetail) return;
  const card = activeCard;
  const detail = activeDetail;

  if (activeScene) {
    activeScene.dispose?.();
    activeScene = null;
  }

  gsap.to(backdrop, { opacity: 0, duration: 0.35, ease: "power2.in",
    onComplete: () => gsap.set(backdrop, { display: "none" }) });

  gsap.to(detail, {
    opacity: 0,
    scale: 0.94,
    y: 18,
    duration: 0.45,
    ease: "power2.in",
    onComplete: () => {
      card.classList.remove("is-expanded");
      detail.style.display = "";
      gsap.set(detail, { clearProps: "all" });
      // Return detail to its original card so it can be opened again
      card.appendChild(detail);
      document.body.classList.remove("card-expanded");
    },
  });

  activeCard = null;
  activeDetail = null;
}

export function isCardExpanded() { return activeCard !== null; }
