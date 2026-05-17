import { gsap } from "gsap";
import * as THREE from "three";

const bubble = document.getElementById("speech-bubble");
const textEl = bubble.querySelector(".speech-bubble__text");

let typeInterval = null;
let hideTimeout = null;
let visible = false;
let lastMessage = "";

export function showSpeechBubble(text, holdMs = 3500) {
  if (text === lastMessage && visible) return;
  lastMessage = text;

  if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
  if (typeInterval) { clearInterval(typeInterval); typeInterval = null; }

  bubble.classList.add("visible");
  gsap.to(bubble, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" });
  visible = true;

  textEl.textContent = "";
  let i = 0;
  typeInterval = setInterval(() => {
    textEl.textContent += text[i] ?? "";
    i++;
    if (i >= text.length) {
      clearInterval(typeInterval);
      typeInterval = null;
      hideTimeout = setTimeout(hideSpeechBubble, holdMs);
    }
  }, 32);
}

export function hideSpeechBubble() {
  if (!visible) return;
  visible = false;
  lastMessage = "";
  gsap.to(bubble, {
    opacity: 0,
    scale: 0.85,
    duration: 0.3,
    ease: "power2.in",
    onComplete: () => bubble.classList.remove("visible"),
  });
}

const _vec = new THREE.Vector3();

/** Project a 3D position to screen space and place the bubble. */
export function updateBubblePosition(target, camera) {
  if (!visible || !target) return;
  target.getWorldPosition(_vec);
  _vec.project(camera);

  const x = (_vec.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-_vec.y * 0.5 + 0.5) * window.innerHeight;

  // Clamp to viewport
  const w = bubble.offsetWidth;
  const h = bubble.offsetHeight;
  const px = Math.max(12, Math.min(window.innerWidth - w - 12, x + 30));
  const py = Math.max(12, Math.min(window.innerHeight - h - 12, y - h - 24));
  bubble.style.left = `${px}px`;
  bubble.style.top  = `${py}px`;
}
