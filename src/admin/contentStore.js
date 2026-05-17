import defaults from "../content.json";

const STORAGE_KEY = "zynape:content:v1";

/* Tiny path utility — supports "a.b[0].c" style paths */
function tokens(path) {
  return String(path).split(/[\.\[\]]+/).filter(Boolean);
}

export function get(obj, path) {
  return tokens(path).reduce((o, k) => (o == null ? o : o[k]), obj);
}

export function set(obj, path, value) {
  const keys = tokens(path);
  const last = keys.pop();
  const parent = keys.reduce((o, k) => {
    if (o[k] == null) o[k] = isNaN(k) ? {} : [];
    return o[k];
  }, obj);
  parent[last] = value;
}

/* Deep clone via JSON — content is plain JSON */
const clone = (x) => JSON.parse(JSON.stringify(x));

let current = loadInitial();
const subscribers = new Set();

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return mergeDefaults(JSON.parse(raw), defaults);
  } catch (_) {
    // Invalid JSON in localStorage — fall back to defaults
  }
  return clone(defaults);
}

/* Shallow-merge so newly added defaults appear even if user has a saved draft */
function mergeDefaults(saved, def) {
  if (Array.isArray(def)) return saved ?? clone(def);
  if (def && typeof def === "object") {
    const out = {};
    for (const k of Object.keys(def)) {
      out[k] = mergeDefaults(saved?.[k], def[k]);
    }
    // Preserve keys the user added that aren't in defaults
    for (const k of Object.keys(saved || {})) {
      if (!(k in out)) out[k] = saved[k];
    }
    return out;
  }
  return saved !== undefined ? saved : def;
}

export function getContent() {
  return current;
}

export function getValue(path) {
  return get(current, path);
}

export function setValue(path, value) {
  set(current, path, value);
  persist();
  notify(path);
}

export function replaceContent(next) {
  current = clone(next);
  persist();
  notify("*");
}

export function resetToDefaults() {
  current = clone(defaults);
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* storage unavailable */ }
  notify("*");
}

export function hasDraft() {
  try { return !!localStorage.getItem(STORAGE_KEY); } catch (_) { return false; }
}

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch (_) {
    // Quota exceeded or storage unavailable — edit still applies in-memory
  }
}

function notify(path) {
  subscribers.forEach((fn) => {
    try { fn(path, current); } catch (_) { /* subscriber error — ignore */ }
  });
}

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/* ============================================================
 * Export / Import
 * ============================================================ */
export function exportToFile(filename = "content.json") {
  const blob = new Blob([JSON.stringify(current, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importFromFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  replaceContent(mergeDefaults(parsed, defaults));
}
