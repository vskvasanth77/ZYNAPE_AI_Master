/**
 * Theme toggle — dark ↔ light
 *
 * Persists in localStorage. Syncs the CSS body class and Three.js
 * scene in one shot. Transitions are handled entirely in CSS on
 * specific elements (theme-toggle.css) — no JS wildcard class.
 */
import * as THREE from "three";

const STORAGE_KEY = "zynape:theme";
const LIGHT_CLASS  = "theme-light";

let _scene = null, _ambient = null, _hemi = null;
let _key   = null, _rim    = null, _accent = null;
let _fill  = null, _under  = null;

/* ============================================================
 * Init — call once after Three.js scene is ready
 * ============================================================ */
export function initThemeToggle({ scene, ambient, hemi, keyLight, rimLight, accentLight, fillLight, underGlow }) {
  _scene  = scene;
  _ambient = ambient; _hemi = hemi;
  _key    = keyLight; _rim  = rimLight;
  _accent = accentLight; _fill = fillLight; _under = underGlow;

  // Apply saved preference immediately (no animation on first load)
  applyTheme(getSaved(), false);
  buildButton();
}

/* ============================================================
 * Public helpers
 * ============================================================ */
export function isLight() { return document.body.classList.contains(LIGHT_CLASS); }

function getSaved() {
  try { return localStorage.getItem(STORAGE_KEY) || "dark"; } catch (_) { return "dark"; }
}
function save(t) { try { localStorage.setItem(STORAGE_KEY, t); } catch (_) { /* noop */ } }

function toggle() { applyTheme(isLight() ? "dark" : "light", true); }

/* ============================================================
 * Apply — CSS class + Three.js scene
 * Transitions are declared in CSS; we just flip the class.
 * Using requestAnimationFrame ensures the class change and the
 * Three.js update land in the same render frame.
 * ============================================================ */
function applyTheme(theme, animate) {
  const body = document.body;

  // If NOT animating (initial load): suppress transitions momentarily
  // so there's no flash of transitioning on first paint
  if (!animate) {
    body.style.transition = "none";
    // Force reflow so the no-transition applies before class change
    void body.offsetHeight;
  }

  if (theme === "light") {
    body.classList.add(LIGHT_CLASS);
    document.documentElement.setAttribute("data-color-scheme", "light");
    save("light");
    requestAnimationFrame(syncThreeLight);
  } else {
    body.classList.remove(LIGHT_CLASS);
    document.documentElement.setAttribute("data-color-scheme", "dark");
    save("dark");
    requestAnimationFrame(syncThreeDark);
  }

  // Restore transition after the no-transition frame settles
  if (!animate) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { body.style.transition = ""; });
    });
  }

  updateButton(theme);

  // Refresh ScrollTrigger after theme switch in the next frame
  // (sticky calculations can shift when backgrounds change)
  if (animate) {
    requestAnimationFrame(() => {
      try { window.__ST_refresh?.(); } catch (_) { /* noop if not ready */ }
    });
  }
}

/* ============================================================
 * Three.js scene — light preset
 * ============================================================ */
function syncThreeLight() {
  if (!_scene) return;
  // Fog: matches the mint body background
  _scene.fog = new THREE.FogExp2(0xc4ede5, 0.010);
  // Ambient: pure white, very high — fills dark material areas so robot isn't a silhouette
  if (_ambient) { _ambient.color.setHex(0xffffff); _ambient.intensity = 2.2; }
  // Hemisphere: bright sky-blue from above, soft lavender from below
  if (_hemi)    { _hemi.color.setHex(0xd8f0ff); _hemi.groundColor.setHex(0xe8d8ff); _hemi.intensity = 1.4; }
  // Key: strong white main light
  if (_key)     { _key.color.setHex(0xffffff);  _key.intensity = 1.8; }
  // Rim: soft purple edge highlight
  if (_rim)     { _rim.color.setHex(0xc0a0ff);  _rim.intensity = 0.7; }
  // Accent: vivid teal to make robot colours pop on the light canvas
  if (_accent)  { _accent.color.setHex(0x00d4c0); _accent.intensity = 1.8; }
  // Fill: purple fill to complement teal accent
  if (_fill)    { _fill.color.setHex(0x8040ff);   _fill.intensity = 1.0; }
  // Under-glow: bright teal from below
  if (_under)   { _under.color.setHex(0x00f0d8);  _under.intensity = 0.9; }
}

/* ============================================================
 * Three.js scene — dark preset
 * ============================================================ */
function syncThreeDark() {
  if (!_scene) return;
  _scene.fog = new THREE.FogExp2(0x050510, 0.03);
  if (_ambient) { _ambient.color.setHex(0x6677aa); _ambient.intensity = 0.5; }
  if (_hemi)    { _hemi.color.setHex(0x88e6ff); _hemi.groundColor.setHex(0x3a1a7a); _hemi.intensity = 0.45; }
  if (_key)     { _key.color.setHex(0xffffff);  _key.intensity = 1.2; }
  if (_rim)     { _rim.color.setHex(0xff77ee);  _rim.intensity = 0.8; }
  if (_accent)  { _accent.color.setHex(0x00f5d4); _accent.intensity = 1.6; }
  if (_fill)    { _fill.color.setHex(0x7b2ff7);   _fill.intensity = 1.0; }
  if (_under)   { _under.color.setHex(0x00d4ff);  _under.intensity = 0.85; }
}

/* ============================================================
 * Button
 * ============================================================ */
const MOON_SVG = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
       class="theme-icon theme-icon--moon" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>`;

const SUN_SVG = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
       class="theme-icon theme-icon--sun" aria-hidden="true">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1"  x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22"  y1="4.22"   x2="5.64"  y2="5.64"/>
    <line x1="18.36" y1="18.36"  x2="19.78" y2="19.78"/>
    <line x1="1"  y1="12" x2="3"  y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22"  y1="19.78"  x2="5.64"  y2="18.36"/>
    <line x1="18.36" y1="5.64"   x2="19.78" y2="4.22"/>
  </svg>`;

let _btn = null;

function buildButton() {
  if (document.getElementById("theme-toggle")) return;
  _btn = document.createElement("button");
  _btn.id = "theme-toggle";
  _btn.innerHTML = `<span class="theme-toggle__track">${MOON_SVG}${SUN_SVG}</span>`;
  _btn.addEventListener("click", toggle);
  document.body.appendChild(_btn);
  updateButton(getSaved());
}

function updateButton(theme) {
  if (!_btn) return;
  const light = theme === "light";
  _btn.setAttribute("data-theme", theme);
  _btn.setAttribute("aria-pressed", String(light));
  _btn.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
  _btn.setAttribute("title",      light ? "Switch to dark mode" : "Switch to light mode");
}
