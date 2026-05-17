import { getContent, getValue, subscribe } from "./contentStore.js";

/**
 * Hydration strategy:
 *  - Any element with [data-edit="path"] gets its innerHTML set to the value
 *    at that path in content.json.
 *  - Optional [data-edit-attr="attrName"] writes to an attribute instead of
 *    innerHTML (used for things like <a href> or data-count on counters).
 *  - Special handling:
 *      [data-edit="home.brand"] re-renders the per-letter span structure used
 *      by the home logo animation.
 *      [data-edit-meta]: nodes inside <head> (page title, meta description).
 */

export function hydrateAll() {
  const content = getContent();

  // --- Document <title> + meta tags
  document.title = content.meta?.title ?? document.title;
  setMeta('meta[name="description"]', content.meta?.description);
  setMeta('meta[property="og:title"]', content.meta?.ogTitle);
  setMeta('meta[property="og:description"]', content.meta?.ogDescription);

  // --- Body data-edit nodes
  document.querySelectorAll("[data-edit]").forEach((el) => {
    applyTo(el);
  });

  // --- Re-render brand chars (home logo)
  renderBrandChars();
}

function setMeta(selector, value) {
  if (!value) return;
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute("content", value);
}

function applyTo(el) {
  const path = el.dataset.edit;
  if (!path) return;
  const value = getValue(path);
  if (value == null) return;

  const attr = el.dataset.editAttr;
  if (attr) {
    el.setAttribute(attr, String(value));
    // Mirror into textContent for nodes like the stats counter that animate
    // from 0 → data-count; we want the visible label to match the new target
    // until the home animation overwrites it.
    if (attr === "data-count" && el.textContent === "0") {
      el.textContent = "0";
    }
    return;
  }

  // Default: innerHTML so embedded <em>, <a>, &nbsp; etc. work
  el.innerHTML = String(value);
}

function renderBrandChars() {
  const logo = document.querySelector(".home__logo");
  if (!logo) return;
  const brand = (getValue("home.brand") ?? "ZYNAPE").toString();
  logo.setAttribute("aria-label", brand);
  // Preserve existing animation hooks: each letter stays in its own .char
  logo.innerHTML = Array.from(brand)
    .map((c) => {
      const safe = c === " " ? "&nbsp;" : escapeHtml(c);
      return `<span class="char" data-char="${escapeAttr(c)}">${safe}</span>`;
    })
    .join("");
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[m]);
}
function escapeAttr(s) {
  return escapeHtml(s);
}

/* Re-hydrate when content changes (admin edits) */
let unsubscribe = null;
export function startLiveHydration() {
  if (unsubscribe) return;
  unsubscribe = subscribe((path) => {
    if (path === "*" || path === "home.brand") {
      hydrateAll();
      return;
    }
    // Targeted re-hydration of the changed node (cheaper than full pass)
    const escapedPath = String(path).replace(/(["\\])/g, "\\$1");
    document
      .querySelectorAll(`[data-edit="${escapedPath}"]`)
      .forEach((el) => applyTo(el));
  });
}
