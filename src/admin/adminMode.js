import {
  getContent, setValue, resetToDefaults, exportToFile, importFromFile,
  hasDraft, subscribe,
} from "./contentStore.js";
import { hydrateAll, startLiveHydration } from "./hydrate.js";

const PASS_KEY = "zynape:admin:authed";
const ADMIN_CLASS = "admin-mode";

/* ============================================================
 * Entry point — called from main.js on every page load
 * ============================================================ */
export function maybeInitAdmin() {
  if (!shouldEnter()) return;
  const authed = sessionStorage.getItem(PASS_KEY) === "1";
  if (authed) {
    activate();
  } else {
    promptPass();
  }
}

/* ============================================================
 * Keyboard shortcut: Ctrl+Shift+E anywhere on the page
 * ============================================================ */
export function registerAdminShortcut() {
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "E") {
      e.preventDefault();
      if (document.body.classList.contains(ADMIN_CLASS)) {
        deactivate();
      } else if (sessionStorage.getItem(PASS_KEY) === "1") {
        activate();
      } else {
        promptPass();
      }
    }
  });
}

function shouldEnter() {
  return new URLSearchParams(location.search).has("admin");
}

function promptPass() {
  const expected = import.meta.env.VITE_ADMIN_PASS || "zynape";
  const entered = window.prompt("Zynape admin — enter passphrase:");
  if (entered === null) return; // cancelled
  if (entered.trim() === expected) {
    sessionStorage.setItem(PASS_KEY, "1");
    activate();
  } else {
    alert("Incorrect passphrase.");
  }
}

/* ============================================================
 * Activate admin mode
 * ============================================================ */
function activate() {
  document.body.classList.add(ADMIN_CLASS);

  // Enable normal cursor so admin can interact
  document.documentElement.style.cursor = "auto";

  buildToolbar();
  enableEditableNodes();
  startLiveHydration();

  // Show draft badge if unsaved draft exists vs. fresh defaults
  if (hasDraft()) updateStatus("draft");
}

function deactivate() {
  document.body.classList.remove(ADMIN_CLASS);
  document.documentElement.style.cursor = "";
  document.getElementById("admin-toolbar")?.remove();
  document.querySelectorAll("[data-edit]").forEach(disableNode);
}

/* ============================================================
 * Toolbar
 * ============================================================ */
function buildToolbar() {
  if (document.getElementById("admin-toolbar")) return;

  const bar = document.createElement("div");
  bar.id = "admin-toolbar";
  bar.innerHTML = `
    <div class="adm-logo">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
      <span>Admin</span>
    </div>
    <div class="adm-status" id="adm-status">live</div>
    <div class="adm-sep"></div>
    <button class="adm-btn" id="adm-export" title="Export content.json">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Export JSON
    </button>
    <label class="adm-btn adm-btn--file" title="Import content.json">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      Import JSON
      <input type="file" accept=".json,application/json" style="display:none" id="adm-import-input">
    </label>
    <div class="adm-sep"></div>
    <button class="adm-btn adm-btn--danger" id="adm-reset" title="Reset all content to shipped defaults">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.49"/></svg>
      Reset
    </button>
    <button class="adm-btn adm-btn--close" id="adm-exit" title="Exit admin mode (Ctrl+Shift+E)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      Exit
    </button>
  `;
  document.body.appendChild(bar);

  // Wire buttons
  bar.querySelector("#adm-export").addEventListener("click", () => {
    exportToFile();
    flashStatus("exported ✓");
  });

  bar.querySelector("#adm-import-input").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importFromFile(file);
      hydrateAll();
      flashStatus("imported ✓");
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    }
    e.target.value = "";
  });

  bar.querySelector("#adm-reset").addEventListener("click", () => {
    if (!confirm("Reset all content to shipped defaults? This clears your saved draft.")) return;
    resetToDefaults();
    hydrateAll();
    flashStatus("reset ✓");
  });

  bar.querySelector("#adm-exit").addEventListener("click", deactivate);

  // Subscribe to store changes to update status badge
  subscribe(() => updateStatus("saved"));
}

function updateStatus(state) {
  const el = document.getElementById("adm-status");
  if (!el) return;
  el.textContent = state;
  el.className = `adm-status adm-status--${state}`;
}

function flashStatus(msg) {
  updateStatus(msg);
  setTimeout(() => updateStatus("saved"), 2200);
}

/* ============================================================
 * Editable nodes — contenteditable affordances
 * ============================================================ */
function enableEditableNodes() {
  document.querySelectorAll("[data-edit]").forEach(enableNode);

  // Re-enable any nodes injected after initial hydration (e.g., re-rendered
  // brand chars) whenever the DOM settles
  const mo = new MutationObserver((records) => {
    for (const r of records) {
      r.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (n.dataset?.edit) enableNode(n);
        n.querySelectorAll?.("[data-edit]").forEach(enableNode);
      });
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

function enableNode(el) {
  // Skip nodes that write to an attribute — editing them inline makes no sense
  if (el.dataset.editAttr) return;
  // Skip SVG descendants
  if (el.closest("svg")) return;

  el.setAttribute("contenteditable", "true");
  el.setAttribute("spellcheck", "false");
  el.classList.add("admin-editable");

  el.addEventListener("focus", onNodeFocus, { once: false });
  el.addEventListener("blur",  onNodeBlur,  { once: false });
  el.addEventListener("keydown", trapEnter,  { once: false });
  el.addEventListener("paste", pastePlain,   { once: false });
}

function disableNode(el) {
  el.removeAttribute("contenteditable");
  el.removeAttribute("spellcheck");
  el.classList.remove("admin-editable", "admin-editable--active");
  el.removeEventListener("focus", onNodeFocus);
  el.removeEventListener("blur",  onNodeBlur);
  el.removeEventListener("keydown", trapEnter);
  el.removeEventListener("paste", pastePlain);
}

function onNodeFocus(e) {
  e.currentTarget.classList.add("admin-editable--active");
}

function onNodeBlur(e) {
  const el = e.currentTarget;
  el.classList.remove("admin-editable--active");
  const path  = el.dataset.edit;
  const value = el.innerHTML;
  if (!path || value == null) return;
  setValue(path, value);
}

// Prevent inserting real newlines in single-line fields; allow in lede/text
function trapEnter(e) {
  if (e.key !== "Enter") return;
  const multiline = e.currentTarget.tagName === "P"
    && e.currentTarget.classList.contains("domain-detail__lede")
    || e.currentTarget.classList.contains("ops-panel__lede")
    || e.currentTarget.classList.contains("service-text")
    || e.currentTarget.classList.contains("section__lede")
    || e.currentTarget.classList.contains("contact__lede")
    || e.currentTarget.classList.contains("home__sub");
  if (!multiline) {
    e.preventDefault();
    e.currentTarget.blur();
  }
}

// Strip formatting on paste — keep only plain text so no Word garbage
function pastePlain(e) {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData("text/plain");
  document.execCommand("insertText", false, text);
}
