import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

let confettiSceneRef = null;
export function setConfettiScene(scene) { confettiSceneRef = scene; }

export function initContactAnimations() {
  gsap.set(".contact__head", { opacity: 0, y: 30 });
  gsap.set(".contact__form .field-group", { opacity: 0, y: 30 });
  gsap.set(".contact__submit", { opacity: 0, y: 20 });
  gsap.set(".contact__aside > div", { opacity: 0, y: 20 });
  gsap.set(".footer", { opacity: 0 });

  // Portal clip-path expansion when entering contact
  ScrollTrigger.create({
    trigger: "#contact",
    start: "top 80%",
    onEnter: () => {
      gsap.fromTo("#contact",
        { clipPath: "circle(0% at 50% 50%)" },
        { clipPath: "circle(140% at 50% 50%)", duration: 1.2, ease: "expo.out" }
      );
      gsap.to(document.body, { backgroundColor: "#020210", duration: 1.2 });
    },
    onLeaveBack: () => {
      gsap.to(document.body, { backgroundColor: "#050510", duration: 0.8 });
    },
  });

  ScrollTrigger.create({
    trigger: "#contact",
    start: "top 60%",
    onEnter: () => {
      const tl = gsap.timeline();
      tl.to(".contact__head", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" })
        .to(".contact__form .field-group", {
          opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power2.out",
        }, "-=0.3")
        .to(".contact__submit", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.2")
        .to(".contact__aside > div", {
          opacity: 1, y: 0, stagger: 0.1, duration: 0.55, ease: "power2.out",
        }, "-=0.5")
        .to(".footer", { opacity: 1, duration: 0.5 }, "-=0.2");
    },
  });

  // Floating-label fallback for inputs prefilled by browser autofill
  document.querySelectorAll(".field-group input, .field-group textarea").forEach((el) => {
    const update = () => {
      el.parentElement.classList.toggle("is-filled", !!el.value);
    };
    el.addEventListener("input", update);
    el.addEventListener("change", update);
    requestAnimationFrame(update);
  });

  // Submit form
  const form = document.querySelector(".contact__form");
  const btn = form.querySelector(".contact__submit");
  const successEl = form.querySelector(".contact__success");
  const checkPath = btn.querySelector(".btn-check path");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (btn.classList.contains("is-loading") || btn.classList.contains("is-success")) return;
    if (!form.checkValidity()) {
      gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
      form.querySelectorAll("input:invalid, textarea:invalid").forEach((el) => {
        gsap.fromTo(el, { borderColor: "#ff6b6b" }, { borderColor: "rgba(232,232,240,0.18)", duration: 1, delay: 0.4 });
      });
      return;
    }

    btn.classList.add("is-loading");
    gsap.to(btn.querySelector(".btn-text"), { opacity: 0, duration: 0.25 });
    gsap.fromTo(btn.querySelector(".btn-spinner"),
      { opacity: 0, rotation: 0 },
      { opacity: 1, duration: 0.25 }
    );
    const spinTween = gsap.to(btn.querySelector(".btn-spinner"), {
      rotation: 360, repeat: -1, duration: 0.85, ease: "none", transformOrigin: "50% 50%",
    });

    // Simulate request — replace with real API call
    await new Promise((r) => setTimeout(r, 1300));

    spinTween.kill();
    btn.classList.remove("is-loading");
    btn.classList.add("is-success");

    gsap.to(btn.querySelector(".btn-spinner"), { opacity: 0, duration: 0.3 });
    gsap.fromTo(btn.querySelector(".btn-check"),
      { opacity: 0, scale: 0.6 },
      { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.8)" }
    );
    if (checkPath) {
      gsap.fromTo(checkPath, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.5, delay: 0.15, ease: "power2.out" });
    }

    successEl.textContent = "Message received — we'll be in touch shortly.";
    gsap.to(successEl, { opacity: 1, duration: 0.4 });

    fireConfetti();
    form.reset();
    document.querySelectorAll(".field-group").forEach((g) => g.classList.remove("is-filled"));

    setTimeout(() => {
      btn.classList.remove("is-success");
      gsap.to(btn.querySelector(".btn-text"), { opacity: 1, duration: 0.4 });
      gsap.to(btn.querySelector(".btn-check"), { opacity: 0, duration: 0.3 });
      gsap.to(successEl, { opacity: 0, duration: 0.4, onComplete: () => (successEl.textContent = "") });
    }, 4500);
  });
}

function fireConfetti() {
  if (!confettiSceneRef) return;
  const count = 220;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const velocities = [];
  const palette = [
    new THREE.Color(0x00f5d4),
    new THREE.Color(0x7b2ff7),
    new THREE.Color(0xff6b6b),
    new THREE.Color(0xffe066),
    new THREE.Color(0xffffff),
  ];

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 0.5;
    positions[i * 3 + 1] = -1;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    velocities.push({
      x: (Math.random() - 0.5) * 6,
      y: 4 + Math.random() * 5,
      z: (Math.random() - 0.5) * 6,
      rot: (Math.random() - 0.5) * 4,
    });
  }
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.07,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  confettiSceneRef.add(points);

  let t = 0;
  const arr = geo.attributes.position.array;
  const tween = gsap.to({}, {
    duration: 3,
    ease: "none",
    onUpdate() {
      const dt = 0.016;
      t += dt;
      for (let i = 0; i < count; i++) {
        const v = velocities[i];
        v.y -= 9.8 * dt;
        arr[i * 3]     += v.x * dt;
        arr[i * 3 + 1] += v.y * dt;
        arr[i * 3 + 2] += v.z * dt;
      }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = Math.max(0, 1 - t / 3);
    },
    onComplete() {
      confettiSceneRef.remove(points);
      geo.dispose();
      mat.dispose();
    },
  });
  return tween;
}
