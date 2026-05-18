/**
 * adminPanel.js — Zynape CMS Admin Panel
 *
 * Architecture:
 *  - Reads from localStorage key "zynape:content:v1" (same key the
 *    site's hydrate.js reads on page load)
 *  - Drafts saved under "zynape:content:draft"
 *  - "Publish" copies draft → "zynape:content:v1"
 *  - Password matches existing adminMode.js (env var or "zynape")
 */

// ── Constants ──────────────────────────────────────────────
const CONTENT_KEY  = "zynape:content:v1";
const DRAFT_KEY    = "zynape:content:draft";
const AUTH_KEY     = "zynape:admin:authed";
const SUBMIT_KEY   = "zynape:submissions";
const PASS         = (typeof import.meta !== "undefined" && import.meta.env?.VITE_ADMIN_PASS) || "zynape";

// ── State ──────────────────────────────────────────────────
let content   = {};   // working copy (latest draft or published)
let isDirty   = false;
let activePanel = "dashboard";

// ── Boot ───────────────────────────────────────────────────
(async function boot() {
  // Check auth
  if (sessionStorage.getItem(AUTH_KEY) === "1") {
    await initApp();
  }

  // Login handlers
  document.getElementById("admLoginBtn").addEventListener("click", handleLogin);
  document.getElementById("admPwd").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });
  document.getElementById("admTogglePwd").addEventListener("click", () => {
    const f = document.getElementById("admPwd");
    f.type = f.type === "password" ? "text" : "password";
  });
})();

function handleLogin() {
  const val = document.getElementById("admPwd").value;
  if (val === PASS) {
    sessionStorage.setItem(AUTH_KEY, "1");
    document.getElementById("admLoginErr").style.display = "none";
    initApp();
  } else {
    const err = document.getElementById("admLoginErr");
    err.style.display = "block";
    document.getElementById("admPwd").value = "";
    document.getElementById("admPwd").focus();
  }
}

// ── Init application ───────────────────────────────────────
async function initApp() {
  document.getElementById("admLogin").style.display = "none";
  document.getElementById("admApp").style.display   = "";

  // Load content: draft > published > defaults from content.json
  await loadContent();

  // Wire sidebar navigation
  document.querySelectorAll(".adm-nav-item[data-panel]").forEach(btn => {
    btn.addEventListener("click", () => switchPanel(btn.dataset.panel));
  });

  // Quick action buttons on dashboard
  document.querySelectorAll(".adm-quick-btn[data-panel]").forEach(btn => {
    btn.addEventListener("click", () => switchPanel(btn.dataset.panel));
  });

  // Top-bar actions
  document.getElementById("admDraftBtn").addEventListener("click",   saveDraft);
  document.getElementById("admPublishBtn").addEventListener("click", publish);
  document.getElementById("admPreviewBtn").addEventListener("click", preview);
  document.getElementById("admLogout").addEventListener("click",     logout);

  // Modal
  document.getElementById("admModalCancel").addEventListener("click", closeModal);

  // Build all panels
  buildDashboard();
  buildHomePanel();
  buildSolutionsPanel();
  buildContactPanel();
  buildNavigationPanel();
  buildSettingsPanel();

  setStatus("ready");
}

// ── Content loading ────────────────────────────────────────
async function loadContent() {
  // Try draft first, then published, then fetch defaults
  const draft     = safeParse(localStorage.getItem(DRAFT_KEY));
  const published = safeParse(localStorage.getItem(CONTENT_KEY));

  let defaults = {};
  try {
    const res = await fetch("/src/content.json");
    defaults = await res.json();
  } catch { /* offline or missing */ }

  content = deepMerge(defaults, published || {});
  if (draft) content = deepMerge(content, draft);

  if (draft)      setStatus("draft",     "Draft loaded");
  else if (published) setStatus("published", "Published content loaded");
  else            setStatus("ready",     "Default content loaded");
}

// ── Panel switching ────────────────────────────────────────
const PANEL_TITLES = {
  dashboard:  "Dashboard",
  home:       "Home Page Editor",
  solutions:  "Solutions Page Editor",
  contact:    "Contact & Enquiries",
  navigation: "Navigation Editor",
  media:      "Media Library",
  settings:   "Global Settings",
};

function switchPanel(id) {
  activePanel = id;

  document.querySelectorAll(".adm-nav-item").forEach(b =>
    b.classList.toggle("is-active", b.dataset.panel === id));

  document.querySelectorAll(".adm-panel").forEach(p =>
    p.classList.toggle("adm-panel--active", p.id === `panel-${id}`));

  document.getElementById("admPanelTitle").textContent = PANEL_TITLES[id] || id;
}

// ── Save / Publish / Preview ───────────────────────────────
function saveDraft() {
  collectFormData();
  localStorage.setItem(DRAFT_KEY, JSON.stringify(content));
  isDirty = false;
  setStatus("draft", "Draft saved");
  toast("Draft saved successfully", "success");
}

function publish() {
  collectFormData();
  localStorage.setItem(DRAFT_KEY,    JSON.stringify(content));
  localStorage.setItem(CONTENT_KEY,  JSON.stringify(content));
  isDirty = false;
  setStatus("published", "Published");
  toast("Changes published — site updated", "success");
}

function preview() {
  collectFormData();
  localStorage.setItem(DRAFT_KEY, JSON.stringify(content));
  window.open("/?preview=1", "_blank");
}

function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  window.location.reload();
}

// ── Form → content collector ───────────────────────────────
function collectFormData() {
  document.querySelectorAll("[data-content-path]").forEach(el => {
    const path = el.dataset.contentPath;
    const val  = el.tagName === "INPUT" && el.type === "checkbox" ? el.checked : el.value;
    setPath(content, path, val);
  });
}

// ── Status helper ──────────────────────────────────────────
function setStatus(state, text) {
  const chip   = document.getElementById("admStatusChip");
  const label  = document.getElementById("admStatusText");
  chip.className = "adm-status-chip";
  if (state === "draft")     { chip.classList.add("is-draft");     label.textContent = text || "Draft"; }
  else if (state === "published") { chip.classList.add("is-published"); label.textContent = text || "Published"; }
  else { label.textContent = text || "Ready"; }
}

// ── Toast ──────────────────────────────────────────────────
let toastTimer;
function toast(msg, type = "success") {
  const el   = document.getElementById("admToast");
  const icon = document.getElementById("admToastIcon");
  const text = document.getElementById("admToastMsg");
  el.className = `adm-toast adm-toast--${type}`;
  text.textContent = msg;
  icon.innerHTML = type === "success"
    ? `<path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
  el.style.display = "flex";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = "none"; }, 3000);
}

// ── Modal ──────────────────────────────────────────────────
function openModal(title, body, onConfirm, confirmLabel = "Delete", danger = true) {
  document.getElementById("admModalTitle").textContent   = title;
  document.getElementById("admModalBody").textContent    = body;
  document.getElementById("admModalConfirm").textContent = confirmLabel;
  document.getElementById("admModalConfirm").className   = `adm-btn ${danger ? "adm-btn--danger" : "adm-btn--primary"}`;
  document.getElementById("admModal").style.display      = "flex";
  const btn = document.getElementById("admModalConfirm");
  btn.onclick = () => { closeModal(); onConfirm(); };
}

function closeModal() {
  document.getElementById("admModal").style.display = "none";
}

// ═══════════════════════════════════════════════════════════
// PANEL BUILDERS
// ═══════════════════════════════════════════════════════════

// ── DASHBOARD ─────────────────────────────────────────────
function buildDashboard() {
  const hasDraft     = !!localStorage.getItem(DRAFT_KEY);
  const hasPublished = !!localStorage.getItem(CONTENT_KEY);
  const subs         = safeParse(localStorage.getItem(SUBMIT_KEY)) || [];
  const domains      = content?.solutions?.domains?.length || 6;

  document.getElementById("admDashStats").innerHTML = `
    <div class="adm-stat-chip">
      <div class="adm-stat-chip__num">${domains}</div>
      <div class="adm-stat-chip__label">Domain Cards</div>
    </div>
    <div class="adm-stat-chip">
      <div class="adm-stat-chip__num">${content?.home?.stats?.length || 3}</div>
      <div class="adm-stat-chip__label">Home Stats</div>
    </div>
    <div class="adm-stat-chip">
      <div class="adm-stat-chip__num">${content?.operations?.panels?.length || 3}</div>
      <div class="adm-stat-chip__label">Ops Panels</div>
    </div>
    <div class="adm-stat-chip">
      <div class="adm-stat-chip__num">${subs.length}</div>
      <div class="adm-stat-chip__label">Submissions</div>
    </div>
  `;

  document.getElementById("admContentStatus").innerHTML = `
    <div class="adm-content-status-row">
      <span>Home Page</span>
      <span class="adm-pill ${hasPublished ? "adm-pill--live" : "adm-pill--none"}">${hasPublished ? "LIVE" : "DEFAULT"}</span>
    </div>
    <div class="adm-content-status-row">
      <span>Solutions Page</span>
      <span class="adm-pill ${hasPublished ? "adm-pill--live" : "adm-pill--none"}">${hasPublished ? "LIVE" : "DEFAULT"}</span>
    </div>
    <div class="adm-content-status-row">
      <span>Draft</span>
      <span class="adm-pill ${hasDraft ? "adm-pill--draft" : "adm-pill--none"}">${hasDraft ? "PENDING" : "NONE"}</span>
    </div>
    <div class="adm-content-status-row">
      <span>Enquiries</span>
      <span class="adm-pill adm-pill--none">${subs.length} received</span>
    </div>
  `;
}

// ── HOME PAGE ──────────────────────────────────────────────
function buildHomePanel() {
  const tabs = [
    { id: "hero",       label: "Hero"         },
    { id: "stats",      label: "Stats"        },
    { id: "visibility", label: "Visibility"   },
    { id: "ops",        label: "Operations"   },
    { id: "footer",     label: "Footer"       },
    { id: "robot",      label: "🤖 Robot"     },
  ];
  buildTabs("homeTabBar", "homeTabContent", tabs, {
    hero:       buildHeroTab,
    stats:      buildStatsTab,
    visibility: buildVisibilityTab,
    ops:        buildOpsTab,
    footer:     buildFooterTab,
    robot:      buildHomeRobotTab,
  });
}

function buildHomeRobotTab(container) {
  const r = content.robotMessages || {};
  container.innerHTML = `
    <div class="adm-card">
      <div class="adm-card__header">
        <span class="adm-card__title">Robot Speech Bubbles — Home Page</span>
      </div>
      <p class="adm-muted" style="margin-bottom:1rem">These are the messages the robot says as visitors scroll through each section of the home page.</p>
      ${field("Home section",       "robotMessages.home",       r.home       || "")}
      ${field("Solutions section",  "robotMessages.solutions",  r.solutions  || "")}
      ${field("Operations section", "robotMessages.operations", r.operations || "")}
      ${field("Service section",    "robotMessages.service",    r.service    || "")}
      ${field("Contact section",    "robotMessages.contact",    r.contact    || "")}
    </div>
    <div class="adm-publish-note">
      Changes take effect after <strong>Publish</strong>. The robot reads these values on page load.
    </div>
  `;
  bindFields(container);
}

function buildHeroTab(container) {
  const h = content.home || {};
  container.innerHTML = `
    <div class="adm-card">
      <div class="adm-card__header">
        <span class="adm-card__title">Hero Section</span>
      </div>
      ${field("Eyebrow text",    "home.eyebrow",     h.eyebrow    || "")}
      ${field("Brand / Logo text","home.brand",      h.brand      || "ZYNAPE")}
      ${field("Tagline",         "home.tagline",     h.tagline    || "", "textarea")}
      ${field("Sub-heading",     "home.sub",         h.sub        || "", "textarea")}
      ${field("Primary CTA text","home.ctaPrimary",  h.ctaPrimary || "")}
      ${field("Secondary CTA text","home.ctaSecondary",h.ctaSecondary || "")}
      ${field("Scroll hint",     "home.scrollHint",  h.scrollHint || "Scroll")}
    </div>
    <div class="adm-publish-note">
      <strong>Note:</strong> HTML tags like <code>&lt;em&gt;</code> are supported in text fields for italic/coloured highlights.
    </div>
  `;
  bindFields(container);
}

function buildStatsTab(container) {
  const stats = content.home?.stats || [];
  let rows = stats.map((s, i) => `
    <div class="adm-stat-item">
      <div class="adm-field adm-mb-0">
        <label class="adm-label">Number</label>
        <input type="number" class="adm-input" data-content-path="home.stats[${i}].num" value="${s.num}" />
      </div>
      <div class="adm-field adm-mb-0">
        <label class="adm-label">Label</label>
        <input type="text" class="adm-input" data-content-path="home.stats[${i}].label" value="${s.label}" />
      </div>
      <button class="adm-btn adm-btn--icon adm-btn--sm" onclick="deleteStat(${i})" title="Delete stat">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  `).join("");

  container.innerHTML = `
    <div class="adm-card">
      <div class="adm-card__header">
        <span class="adm-card__title">Home Stats <span class="adm-card__badge">${stats.length} items</span></span>
      </div>
      <div class="adm-stats-list" id="statsList">${rows}</div>
      <button class="adm-add-btn adm-mt-1" onclick="addStat()">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Add Stat
      </button>
    </div>
  `;
  bindFields(container);
}

window.addStat = function() {
  if (!content.home) content.home = {};
  if (!content.home.stats) content.home.stats = [];
  content.home.stats.push({ num: 0, label: "New metric" });
  buildStatsTab(document.querySelector("#homeTabContent .adm-tab-content.is-active") || document.getElementById("homeTabContent"));
  rebuildHomePanel();
};

window.deleteStat = function(i) {
  openModal("Delete Stat", "Remove this stat from the home page?", () => {
    content.home.stats.splice(i, 1);
    rebuildHomePanel();
  });
};

function rebuildHomePanel() {
  const active = document.querySelector("#homeTabContent .adm-tab-content.is-active");
  const id = active?.dataset.tabId;
  buildHomePanel();
  if (id) {
    const t = document.querySelector(`[data-tab-id="${id}"]`);
    if (t) { document.querySelector("#homeTabContent .adm-tab-content.is-active")?.classList.remove("is-active"); t.classList.add("is-active"); }
  }
}

function buildVisibilityTab(container) {
  const vis = content._visibility || {};
  const sections = [
    { key: "solutions",   label: "Solutions Section",  sub: "6 domain cards on home page" },
    { key: "operations",  label: "Operations Section", sub: "Cloud, SOC, NOC panels" },
    { key: "contact",     label: "Contact Section",    sub: "Enquiry form + aside" },
    { key: "footer",      label: "Footer",             sub: "Brand + copyright" },
  ];

  container.innerHTML = `
    <div class="adm-card">
      <div class="adm-card__header">
        <span class="adm-card__title">Section Visibility</span>
      </div>
      ${sections.map(s => `
        <div class="adm-toggle-wrap">
          <div>
            <span class="adm-toggle-label">${s.label}</span>
            <span class="adm-toggle-sub">${s.sub}</span>
          </div>
          <label class="adm-toggle">
            <input type="checkbox" data-content-path="_visibility.${s.key}" ${vis[s.key] !== false ? "checked" : ""} />
            <span class="adm-toggle-slider"></span>
          </label>
        </div>
      `).join("")}
    </div>
    <div class="adm-publish-note">
      Visibility changes take effect after <strong>Publish</strong>. Hidden sections are removed from the page but not deleted.
    </div>
  `;
  bindFields(container);
}

function buildOpsTab(container) {
  const ops = content.operations || {};
  const panels = ops.panels || [];

  container.innerHTML = `
    <div class="adm-card">
      <div class="adm-card__header">
        <span class="adm-card__title">Operations Header</span>
      </div>
      ${field("Eyebrow",   "operations.eyebrow", ops.eyebrow || "")}
      ${field("Title",     "operations.title",   ops.title   || "", "textarea", "sm")}
      ${field("Sub-text",  "operations.lede",    ops.lede    || "", "textarea")}
    </div>
    ${panels.map((p, i) => `
      <div class="adm-card">
        <div class="adm-card__header">
          <span class="adm-card__title">Panel ${i+1}: ${p.tag || p.id}</span>
        </div>
        ${field("Tag label",  `operations.panels[${i}].tag`,   p.tag   || "")}
        ${field("Title",      `operations.panels[${i}].title`, p.title || "", "textarea", "sm")}
        ${field("Sub-text",   `operations.panels[${i}].lede`,  p.lede  || "", "textarea")}
        <div class="adm-field">
          <label class="adm-label">Bullet Points (one per line)</label>
          <textarea class="adm-textarea" data-content-path="operations.panels[${i}]._listText">${(p.list||[]).join("\n")}</textarea>
        </div>
      </div>
    `).join("")}
  `;
  bindFields(container);
}

function buildFooterTab(container) {
  const f = content.footer || {};
  container.innerHTML = `
    <div class="adm-card">
      <div class="adm-card__header"><span class="adm-card__title">Footer</span></div>
      ${field("Brand name",     "footer.brand", f.brand || "Zynape")}
      ${field("Copyright line", "footer.line",  f.line  || "")}
    </div>
  `;
  bindFields(container);
}

// ── SOLUTIONS PAGE ────────────────────────────────────────
function buildSolutionsPanel() {
  const tabs = [
    { id: "header",  label: "Page Header" },
    { id: "domains", label: "Domain Cards" },
    { id: "solops",  label: "OPS Section"  },
    { id: "meta",    label: "SEO / Meta"   },
    { id: "solrobot",label: "🤖 Robot"     },
  ];
  buildTabs("solTabBar", "solTabContent", tabs, {
    header:   buildSolHeaderTab,
    domains:  buildDomainsTab,
    solops:   buildSolOpsTab,
    meta:     buildMetaTab,
    solrobot: buildSolRobotTab,
  });
}

function buildSolRobotTab(container) {
  const r = content.solRobotMessages || {};
  container.innerHTML = `
    <div class="adm-card">
      <div class="adm-card__header">
        <span class="adm-card__title">Robot Speech Bubbles — Solutions Page</span>
      </div>
      <p class="adm-muted" style="margin-bottom:1rem">These are the messages the robot says as visitors scroll through each section of the solutions page.</p>
      ${field("Hero section",           "solRobotMessages.solHero",      r.solHero      || "")}
      ${field("Migration section",      "solRobotMessages.solMigration", r.solMigration || "")}
      ${field("OPS Solar section",      "solRobotMessages.solOpsSolar",  r.solOpsSolar  || "")}
      ${field("Agentic Voice Bot",      "solRobotMessages.solAgentic",   r.solAgentic   || "")}
      ${field("AI & Automation",        "solRobotMessages.solAi",        r.solAi        || "")}
      ${field("SOC section",            "solRobotMessages.solSoc",       r.solSoc       || "")}
    </div>
    <div class="adm-publish-note">
      Changes take effect after <strong>Publish</strong>. The robot reads these values on page load.
    </div>
  `;
  bindFields(container);
}

function buildSolHeaderTab(container) {
  const s = content.solutions || {};
  container.innerHTML = `
    <div class="adm-card">
      <div class="adm-card__header"><span class="adm-card__title">Solutions Section Header</span></div>
      ${field("Eyebrow",  "solutions.eyebrow", s.eyebrow || "")}
      ${field("Title",    "solutions.title",   s.title   || "", "textarea", "sm")}
      ${field("Sub-text", "solutions.lede",    s.lede    || "", "textarea")}
    </div>
  `;
  bindFields(container);
}

function buildDomainsTab(container) {
  const domains = content.solutions?.domains || [];
  container.innerHTML = `
    <div class="adm-section-head">
      <div>
        <h2>Domain Cards</h2>
        <p>Shown on the home page as the 6 expandable domain cards.</p>
      </div>
      <button class="adm-btn adm-btn--secondary adm-btn--sm" onclick="addDomain()">+ Add Card</button>
    </div>
    <div class="adm-domain-list" id="domainList">
      ${domains.map((d, i) => buildDomainItem(d, i)).join("")}
    </div>
  `;
  bindFields(container);
}

function buildDomainItem(d, i) {
  const det = d.detail || {};
  const list = (det.list || []).join("\n");
  const metrics = (det.metrics || []).map(m => `${m.strong}|${m.label}`).join("\n");
  return `
    <div class="adm-domain-item" id="domain-${i}">
      <div class="adm-domain-item__header" onclick="toggleDomain(${i})">
        <svg class="adm-domain-item__drag" viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M3 5h10M3 8h10M3 11h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        <span class="adm-domain-item__title">${d.title || "Unnamed"}</span>
        <div class="adm-domain-item__actions">
          <button class="adm-btn adm-btn--icon adm-btn--sm" onclick="moveDomain(event,${i},-1)" title="Move up">↑</button>
          <button class="adm-btn adm-btn--icon adm-btn--sm" onclick="moveDomain(event,${i},1)"  title="Move down">↓</button>
          <button class="adm-btn adm-btn--icon adm-btn--sm" onclick="deleteDomain(event,${i})" title="Delete">
            <svg viewBox="0 0 16 16" width="12" fill="none"><path d="M2 4h12M5 4V2h6v2M3 4l1 9h8l1-9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
      <div class="adm-domain-item__body" id="domain-body-${i}">
        ${field("Card title",       `solutions.domains[${i}].title`, d.title || "")}
        ${field("Card description", `solutions.domains[${i}].desc`,  d.desc  || "", "textarea", "sm")}
        <hr class="adm-divider" />
        <p class="adm-muted" style="margin-bottom:.75rem">Expanded card (modal) content</p>
        ${field("Modal eyebrow",    `solutions.domains[${i}].detail.eyebrow`, det.eyebrow || "")}
        ${field("Modal title",      `solutions.domains[${i}].detail.title`,   det.title   || "", "textarea", "sm")}
        ${field("Modal sub-text",   `solutions.domains[${i}].detail.lede`,    det.lede    || "", "textarea")}
        <div class="adm-field">
          <label class="adm-label">Bullet points (one per line)</label>
          <textarea class="adm-textarea" data-content-path="solutions.domains[${i}].detail._listText">${list}</textarea>
        </div>
        <div class="adm-field">
          <label class="adm-label">Metrics (format: value|label — one per line)</label>
          <textarea class="adm-textarea adm-textarea--sm" data-content-path="solutions.domains[${i}].detail._metricsText" placeholder="99.99%|uptime SLO">${metrics}</textarea>
        </div>
      </div>
    </div>
  `;
}

window.toggleDomain = function(i) {
  const body = document.getElementById(`domain-body-${i}`);
  if (body) body.classList.toggle("is-open");
};

window.addDomain = function() {
  if (!content.solutions) content.solutions = {};
  if (!content.solutions.domains) content.solutions.domains = [];
  content.solutions.domains.push({
    id: `domain-${Date.now()}`,
    title: "New Domain",
    desc:  "Short description of this service area.",
    detail: { eyebrow: "", title: "New Domain.", lede: "", list: [], metrics: [] }
  });
  rebuildSolPanel();
  toast("New domain card added", "success");
};

window.deleteDomain = function(e, i) {
  e.stopPropagation();
  openModal("Delete Domain Card", `Delete "${content.solutions?.domains?.[i]?.title}"? This cannot be undone.`, () => {
    content.solutions.domains.splice(i, 1);
    rebuildSolPanel();
    toast("Domain card deleted", "success");
  });
};

window.moveDomain = function(e, i, dir) {
  e.stopPropagation();
  const arr = content.solutions?.domains;
  if (!arr) return;
  const j = i + dir;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  rebuildSolPanel();
};

function rebuildSolPanel() {
  buildSolutionsPanel();
}

function buildSolOpsTab(container) {
  const ops = content.solOps || {};
  container.innerHTML = `
    <div class="adm-card">
      <div class="adm-card__header"><span class="adm-card__title">OPS Solar Section</span></div>
      ${field("Eyebrow",  "solOps.eyebrow", ops.eyebrow || "02 · Ops")}
      ${field("Title",    "solOps.title",   ops.title   || "Unified <em>Ops</em> Intelligence", "textarea", "sm")}
      ${field("Sub-text", "solOps.lede",    ops.lede    || "", "textarea")}
      <hr class="adm-divider" />
      <p class="adm-muted" style="margin-bottom:.75rem">OPS Planet cards (DevOps, ITOps, SecOps, FinOps) are defined in solutions.html directly.</p>
    </div>
  `;
  bindFields(container);
}

function buildMetaTab(container) {
  const m = content.meta || {};
  container.innerHTML = `
    <div class="adm-card">
      <div class="adm-card__header"><span class="adm-card__title">SEO & Meta</span></div>
      ${field("Page title",       "meta.title",       m.title       || "")}
      ${field("Meta description", "meta.description", m.description || "", "textarea", "sm")}
      ${field("OG title",         "meta.ogTitle",     m.ogTitle     || "")}
      ${field("OG description",   "meta.ogDescription",m.ogDescription || "", "textarea", "sm")}
    </div>
  `;
  bindFields(container);
}

// ── CONTACT & ENQUIRIES ────────────────────────────────────
function buildContactPanel() {
  const c    = content.contact   || {};
  const subs = safeParse(localStorage.getItem(SUBMIT_KEY)) || [];
  const flds = c.fields || {};
  const aside= c.aside  || [];

  const subHTML = subs.length === 0
    ? `<div class="adm-empty-state">
         <svg viewBox="0 0 64 64" width="48" height="48" fill="none"><rect x="4" y="12" width="56" height="40" rx="6" stroke="currentColor" stroke-width="2.5"/><path d="M4 22l28 18 28-18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
         <p>No enquiries received yet. They will appear here when users submit the contact form.</p>
       </div>`
    : subs.map((s, i) => `
        <div class="adm-submission">
          <div class="adm-submission__meta">
            <span>${new Date(s.ts||Date.now()).toLocaleString()}</span>
            ${s.company ? `<span>${s.company}</span>` : ""}
          </div>
          <div class="adm-submission__name">${s.name||"—"} <span class="adm-submission__email">&lt;${s.email||"—"}&gt;</span></div>
          <div class="adm-submission__msg">${s.message||"—"}</div>
          <div style="margin-top:.75rem">
            <button class="adm-btn adm-btn--icon adm-btn--sm adm-btn--danger" onclick="deleteSubmission(${i})">Delete</button>
          </div>
        </div>
      `).join("");

  document.getElementById("contactContent").innerHTML = `
    <div class="adm-card">
      <div class="adm-card__header"><span class="adm-card__title">Contact Section Header</span></div>
      ${field("Eyebrow",       "contact.eyebrow",  c.eyebrow  || "")}
      ${field("Heading",       "contact.heading",  c.heading  || "", "textarea", "sm")}
      ${field("Sub-text",      "contact.lede",     c.lede     || "", "textarea")}
      ${field("Submit button", "contact.submit",   c.submit   || "Send message")}
      ${field("Success message","contact.successText", c.successText || "", "textarea", "sm")}
    </div>
    <div class="adm-card">
      <div class="adm-card__header"><span class="adm-card__title">Form Field Labels</span></div>
      <div class="adm-field-row">
        ${field("Name field",    "contact.fields.name",    flds.name    || "Your name")}
        ${field("Email field",   "contact.fields.email",   flds.email   || "Email address")}
      </div>
      <div class="adm-field-row">
        ${field("Company field", "contact.fields.company", flds.company || "Company")}
        ${field("Message field", "contact.fields.message", flds.message || "What would you like to build?")}
      </div>
    </div>
    <div class="adm-card">
      <div class="adm-card__header"><span class="adm-card__title">Aside Info</span></div>
      ${(aside).map((a, i) => `
        <div class="adm-field-row">
          ${field("Label", `contact.aside[${i}].label`, a.label || "")}
          ${field("Value", `contact.aside[${i}].value`, a.value || "")}
        </div>
      `).join("")}
    </div>
    <div class="adm-card">
      <div class="adm-card__header">
        <span class="adm-card__title">Enquiries <span class="adm-card__badge">${subs.length} received</span></span>
        ${subs.length > 0 ? `<button class="adm-btn adm-btn--ghost adm-btn--sm" onclick="clearAllSubmissions()">Clear All</button>` : ""}
      </div>
      ${subHTML}
    </div>
  `;
  bindFields(document.getElementById("contactContent"));
}

window.deleteSubmission = function(i) {
  openModal("Delete Enquiry", "Permanently delete this enquiry?", () => {
    const subs = safeParse(localStorage.getItem(SUBMIT_KEY)) || [];
    subs.splice(i, 1);
    localStorage.setItem(SUBMIT_KEY, JSON.stringify(subs));
    buildContactPanel();
    toast("Enquiry deleted", "success");
  });
};

window.clearAllSubmissions = function() {
  openModal("Clear All Enquiries", "Delete all received enquiries permanently?", () => {
    localStorage.removeItem(SUBMIT_KEY);
    buildContactPanel();
    toast("All enquiries cleared", "success");
  });
};

// ── NAVIGATION ────────────────────────────────────────────
function buildNavigationPanel() {
  const nav = content.nav || {};
  const links = [
    { key: "home",       label: "Home",       href: "#home"          },
    { key: "solutions",  label: "Solutions",  href: "/solutions.html"},
    { key: "operations", label: "Operations", href: "#operations"    },
    { key: "contact",    label: "Contact",    href: "#contact"       },
  ];

  document.getElementById("navContent").innerHTML = `
    <div class="adm-card">
      <div class="adm-card__header"><span class="adm-card__title">Navigation Items</span></div>
      <div class="adm-nav-editor">
        ${links.map(l => `
          <div class="adm-nav-editor-item">
            <div class="adm-field adm-mb-0">
              <label class="adm-label">Label</label>
              <input type="text" class="adm-input" data-content-path="nav.${l.key}" value="${nav[l.key] || l.label}" />
            </div>
            <div class="adm-field adm-mb-0">
              <label class="adm-label">Link (current: ${l.href})</label>
              <input type="text" class="adm-input" value="${l.href}" disabled style="opacity:.45" />
            </div>
          </div>
        `).join("")}
      </div>
      <p class="adm-muted adm-mt-1">Navigation link destinations are controlled via code. Only labels are editable here.</p>
    </div>
  `;
  bindFields(document.getElementById("navContent"));
}

// ── SETTINGS ──────────────────────────────────────────────
function buildSettingsPanel() {
  document.getElementById("settingsContent").innerHTML = `
    <div class="adm-card">
      <div class="adm-card__header"><span class="adm-card__title">Admin Settings</span></div>
      <div class="adm-field">
        <label class="adm-label">Admin Password</label>
        <input type="password" class="adm-input" value="${PASS}" disabled style="opacity:.45" />
        <p class="adm-field-hint">Change via VITE_ADMIN_PASS environment variable in .env</p>
      </div>
    </div>
    <div class="adm-card">
      <div class="adm-card__header"><span class="adm-card__title">Content Actions</span></div>
      <div style="display:flex;flex-direction:column;gap:.75rem;">
        <button class="adm-btn adm-btn--secondary" onclick="exportContent()">
          Export Content as JSON
        </button>
        <button class="adm-btn adm-btn--ghost" onclick="triggerImport()">
          Import Content from JSON
        </button>
        <input type="file" id="importFile" accept=".json" style="display:none" onchange="importContent(event)" />
        <button class="adm-btn adm-btn--danger" onclick="resetContent()">
          Reset to Default Content
        </button>
      </div>
      <div class="adm-publish-note adm-mt-1">
        <strong>Export</strong> downloads a JSON backup of all published content.<br>
        <strong>Import</strong> loads content from a previously exported JSON file.<br>
        <strong>Reset</strong> removes all saved changes and returns to default content.json.
      </div>
    </div>
  `;
}

window.exportContent = function() {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: "zynape-content.json" });
  a.click();
  URL.revokeObjectURL(url);
  toast("Content exported as JSON", "success");
};

window.triggerImport = function() {
  document.getElementById("importFile").click();
};

window.importContent = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const imported = JSON.parse(ev.target.result);
      content = deepMerge(content, imported);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(content));
      buildDashboard(); buildHomePanel(); buildSolutionsPanel(); buildContactPanel(); buildNavigationPanel();
      setStatus("draft", "Imported as draft");
      toast("Content imported — review and publish", "success");
    } catch { toast("Invalid JSON file", "error"); }
  };
  reader.readAsText(file);
  e.target.value = "";
};

window.resetContent = function() {
  openModal(
    "Reset All Content",
    "This removes all saved changes and resets to the default content.json. This cannot be undone.",
    async () => {
      localStorage.removeItem(CONTENT_KEY);
      localStorage.removeItem(DRAFT_KEY);
      await loadContent();
      buildDashboard(); buildHomePanel(); buildSolutionsPanel(); buildContactPanel(); buildNavigationPanel();
      setStatus("ready", "Reset to defaults");
      toast("Content reset to defaults", "success");
    },
    "Reset",
    true
  );
};

// ═══════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════

function field(label, path, value, type = "input", size = "") {
  if (type === "textarea") {
    return `<div class="adm-field">
      <label class="adm-label">${label}</label>
      <textarea class="adm-textarea ${size ? "adm-textarea--" + size : ""}" data-content-path="${path}">${escHtml(value)}</textarea>
    </div>`;
  }
  return `<div class="adm-field">
    <label class="adm-label">${label}</label>
    <input type="text" class="adm-input" data-content-path="${path}" value="${escAttr(value)}" />
  </div>`;
}

function buildTabs(barId, contentId, tabs, builders) {
  const bar     = document.getElementById(barId);
  const content = document.getElementById(contentId);

  bar.innerHTML = tabs.map((t, i) =>
    `<button class="adm-tab ${i === 0 ? "is-active" : ""}" data-tab="${t.id}">${t.label}</button>`
  ).join("");

  content.innerHTML = tabs.map((t, i) =>
    `<div class="adm-tab-content ${i === 0 ? "is-active" : ""}" data-tab-id="${t.id}" id="tabContent-${t.id}"></div>`
  ).join("");

  bar.querySelectorAll(".adm-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      bar.querySelectorAll(".adm-tab").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      content.querySelectorAll(".adm-tab-content").forEach(c => c.classList.remove("is-active"));
      const tc = document.getElementById(`tabContent-${btn.dataset.tab}`);
      if (tc) {
        tc.classList.add("is-active");
        if (!tc._built) { tc._built = true; builders[btn.dataset.tab]?.(tc); }
      }
    });
  });

  // Build first tab
  const first = document.getElementById(`tabContent-${tabs[0].id}`);
  if (first && !first._built) { first._built = true; builders[tabs[0].id]?.(first); }
}

function bindFields(container) {
  container.querySelectorAll("[data-content-path]").forEach(el => {
    const handler = () => {
      isDirty = true;
      setStatus("draft", "Unsaved changes");
    };
    el.addEventListener("input",  handler);
    el.addEventListener("change", handler);
  });
}

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

function safeParse(str) {
  try { return str ? JSON.parse(str) : null; } catch { return null; }
}

function deepMerge(target, source) {
  const out = Object.assign({}, target);
  for (const k in source) {
    if (source[k] && typeof source[k] === "object" && !Array.isArray(source[k])) {
      out[k] = deepMerge(out[k] || {}, source[k]);
    } else {
      out[k] = source[k];
    }
  }
  return out;
}

function setPath(obj, path, value) {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (!(k in cur) || typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escAttr(str) {
  return String(str || "").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
