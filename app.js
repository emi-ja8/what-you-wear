const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const SCORE_WEIGHTS = { material: .35, production: .30, social: .25, transparency: .10 };
const SCORE_VERSION = 2;
const EUROPEAN_PRODUCTION_COUNTRIES = ["Deutschland", "Italien", "Portugal"];

const defaultProducts = [
  { id: 1, name: "Hoodie Classic", sku: "SKU-001-HOOD-CL", category: "Oberteile", country: "Portugal", score: 82, grade: "B", status: "Veröffentlicht", completeness: 91, organic: 95, recycled: 5, certification: "GOTS", renewable: 75, co2: 6, transport: "LKW", materialScore: 92, productionScore: 80, socialScore: 68, transparencyScore: 91, material: "95 % Bio-Baumwolle · 5 % recyceltes Polyester", certificates: ["GOTS-Zertifikat_2026.pdf", "Social-Audit_Portugal.pdf"], supply: [true, true, true, true, false] },
  { id: 2, name: "Essential T-Shirt", sku: "SKU-002-TEE-ES", category: "Oberteile", country: "Portugal", score: 91, grade: "A", status: "Veröffentlicht", completeness: 96, organic: 100, recycled: 0, certification: "GOTS", renewable: 86, co2: 3.2, transport: "Bahn", materialScore: 98, productionScore: 90, socialScore: 84, transparencyScore: 96, material: "100 % Bio-Baumwolle", certificates: ["GOTS-Essential.pdf"], supply: [true, true, true, true, true] },
  { id: 3, name: "Straight Denim", sku: "SKU-003-DENIM-ST", category: "Hosen", country: "Türkei", score: 67, grade: "C", status: "In Prüfung", completeness: 74, organic: 42, recycled: 18, certification: "OEKO-TEX", renewable: 38, co2: 12.4, transport: "LKW", materialScore: 68, productionScore: 59, socialScore: 71, transparencyScore: 74, material: "82 % Baumwolle · 18 % recycelte Baumwolle", certificates: ["OEKO-TEX-Denim.pdf"], supply: [true, true, true, false, false] },
  { id: 4, name: "Light Field Jacket", sku: "SKU-004-JKT-LF", category: "Jacken", country: "Italien", score: 78, grade: "B", status: "Veröffentlicht", completeness: 88, organic: 55, recycled: 35, certification: "GRS", renewable: 70, co2: 8.1, transport: "Bahn", materialScore: 82, productionScore: 76, socialScore: 73, transparencyScore: 88, material: "55 % Bio-Baumwolle · 35 % Recyclingfaser · 10 % Elasthan", certificates: ["GRS-Jacket.pdf"], supply: [true, true, true, true, false] },
  { id: 5, name: "Everyday Cap", sku: "SKU-005-CAP-EV", category: "Accessoires", country: "Deutschland", score: 81, grade: "B", status: "Entwurf", completeness: 69, organic: 80, recycled: 20, certification: "Keine", renewable: 92, co2: 2.4, transport: "Bahn", materialScore: 84, productionScore: 90, socialScore: 70, transparencyScore: 69, material: "80 % Bio-Baumwolle · 20 % recycelte Baumwolle", certificates: [], supply: [true, true, false, false, false] },
  { id: 6, name: "Flow Dress", sku: "SKU-006-DRS-FL", category: "Oberteile", country: "Italien", score: 72, grade: "C", status: "In Prüfung", completeness: 79, organic: 0, recycled: 45, certification: "OEKO-TEX", renewable: 62, co2: 7.5, transport: "LKW", materialScore: 70, productionScore: 72, socialScore: 67, transparencyScore: 79, material: "55 % TENCEL™ · 45 % recyceltes Polyester", certificates: ["OEKO-TEX-Flow.pdf"], supply: [true, true, true, false, true] }
];

const state = {
  products: loadProducts(),
  currentPage: "overview",
  selectedProductId: 1,
  productSearch: "",
  categoryFilter: "Alle",
  statusFilter: "Alle"
};

function loadProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem("wyw-products-v2") || localStorage.getItem("wyw-products-v1"));
    const products = Array.isArray(saved) && saved.length ? saved : structuredClone(defaultProducts);
    return products.map(hydrateProduct);
  } catch (_) {
    return structuredClone(defaultProducts).map(hydrateProduct);
  }
}

function persist() {
  localStorage.setItem("wyw-products-v2", JSON.stringify(state.products));
  updateGlobalMetrics();
}

function selectedProduct() {
  return state.products.find(p => p.id === state.selectedProductId) || state.products[0];
}

function gradeFor(score) {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "E";
}

function gradeCopy(grade) {
  return {
    A: ["SEHR GUT", "Besonders bewusste Wahl."],
    B: ["GUT", "Bewusste Wahl."],
    C: ["SOLIDE", "Gute Basis."],
    D: ["AUSBAUFÄHIG", "Verbesserung nötig."],
    E: ["KRITISCH", "Nicht empfohlen."]
  }[grade];
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function bool(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function hydrateProduct(product) {
  const p = { ...product };
  p.scoreVersion = SCORE_VERSION;
  p.sustainablePercent = Number.isFinite(p.sustainablePercent) ? p.sustainablePercent : Math.min(100, (Number(p.organic) || 0) + (Number(p.recycled) || 0));
  p.recycledPolyester = bool(p.recycledPolyester, /recyceltes polyester/i.test(p.material || ""));
  p.highVirginPolyester = bool(p.highVirginPolyester);
  p.transportDistance = Number.isFinite(p.transportDistance) ? p.transportDistance : ({ Deutschland: 420, Italien: 1050, Portugal: 1800, Türkei: 2300 }[p.country] || 6500);
  p.wageStandard = p.wageStandard || ([1, 2, 4].includes(p.id) ? "living" : "minimum");
  p.iloWorkingHours = bool(p.iloWorkingHours, true);
  p.certifiedSafety = bool(p.certifiedSafety, [1, 2, 4, 5].includes(p.id));
  p.noChildLabor = bool(p.noChildLabor, true);
  p.transparentFacilities = bool(p.transparentFacilities, p.id !== 3);
  p.laborViolations = bool(p.laborViolations);
  p.materialOriginsTraceable = bool(p.materialOriginsTraceable, (p.supply || []).filter(Boolean).length >= 3);
  p.digitalProductPassport = bool(p.digitalProductPassport, [1, 2, 4, 6].includes(p.id));
  p.partialSupplierData = bool(p.partialSupplierData);
  recalculateProduct(p);
  return p;
}

function materialPoints(product) {
  const sustainable = Number(product.sustainablePercent) || 0;
  const base = sustainable >= 80 ? 60 : sustainable >= 50 ? 40 : sustainable >= 20 ? 20 : 0;
  return base + (product.certification && product.certification !== "Keine" ? 20 : 0) - (product.recycledPolyester ? 5 : 0) - (product.highVirginPolyester ? 20 : 0);
}

function productionPoints(product) {
  const renewable = Number(product.renewable) || 0;
  const energy = renewable > 80 ? 30 : renewable >= 50 ? 20 : 10;
  const co2 = Number(product.co2) || 0;
  const emissions = co2 < 5 ? 30 : co2 <= 10 ? 20 : co2 > 20 ? -25 : 0;
  const europe = EUROPEAN_PRODUCTION_COUNTRIES.includes(product.country) ? 20 : 0;
  const distance = Number(product.transportDistance) || 0;
  const route = distance < 2000 ? 20 : distance > 10000 ? -15 : 0;
  const air = product.transport === "Luftfracht" ? -20 : 0;
  return energy + emissions + europe + route + air;
}

function socialPoints(product) {
  const wage = product.wageStandard === "living" ? 25 : product.wageStandard === "minimum" ? 10 : 0;
  return wage + (product.iloWorkingHours ? 10 : 0) + (product.certifiedSafety ? 15 : 0) + (product.noChildLabor ? 20 : 0) + (product.transparentFacilities ? 15 : 0) - (product.laborViolations ? 30 : 0);
}

function transparencyPoints(product) {
  const completeChain = (product.supply || []).length === 5 && product.supply.every(Boolean);
  return (completeChain ? 40 : 0) + (product.materialOriginsTraceable ? 30 : 0) + (product.digitalProductPassport ? 30 : 0) - (product.partialSupplierData ? 20 : 0);
}

function normalizedScore(points, maximum) {
  return Math.max(0, Math.min(100, Math.round(points / maximum * 100)));
}

function recalculateProduct(product) {
  product.materialPoints = materialPoints(product);
  product.productionPoints = productionPoints(product);
  product.socialPoints = socialPoints(product);
  product.transparencyPoints = transparencyPoints(product);
  product.materialScore = normalizedScore(product.materialPoints, 80);
  product.productionScore = normalizedScore(product.productionPoints, 100);
  product.socialScore = normalizedScore(product.socialPoints, 85);
  product.transparencyScore = normalizedScore(product.transparencyPoints, 100);
  product.score = Math.round(product.materialScore * SCORE_WEIGHTS.material + product.productionScore * SCORE_WEIGHTS.production + product.socialScore * SCORE_WEIGHTS.social + product.transparencyScore * SCORE_WEIGHTS.transparency);
  product.grade = gradeFor(product.score);
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2800);
}

function openDashboard(page = "overview") {
  $("#landingView").hidden = true;
  $("#consumerView").hidden = true;
  $("#dashboardView").hidden = false;
  document.body.style.overflow = "";
  state.currentPage = page;
  history.replaceState(null, "", `#dashboard-${page}`);
  window.scrollTo(0, 0);
  renderDashboard();
}

function goHome() {
  $("#dashboardView").hidden = true;
  $("#consumerView").hidden = true;
  $("#landingView").hidden = false;
  document.title = "What You Wear — Ein Scan. Volle Transparenz.";
  history.replaceState(null, "", "#top");
  window.scrollTo(0, 0);
}

function consumerScoreDefinition(product, key) {
  const verifiedStages = (product.supply || []).filter(Boolean).length;
  const definitions = {
    material: {
      label: "Umwelt", title: "Materialien & Rohstoffe", icon: "♧", weight: 35, score: product.materialScore,
      description: "Bewertet werden Materialmix, nachhaltige Anteile und belegte Faserstandards.",
      facts: [["Zusammensetzung", product.material], ["Zertifizierung", product.certification || "Kein Nachweis"], ["Bio-Anteil", `${product.organic} %`], ["Recyclinganteil", `${product.recycled} %`]]
    },
    production: {
      label: "Herstellung", title: "Produktion & CO₂", icon: "◎", weight: 30, score: product.productionScore,
      description: "Einbezogen werden Emissionen, Energiemix, Produktionsort und Transportweg.",
      facts: [["Produktion", product.country], ["CO₂e pro Stück", `${Number(product.co2).toLocaleString("de-DE")} kg`], ["Erneuerbare Energie", `${product.renewable} %`], ["Transport", `${product.transport} · ${Number(product.transportDistance).toLocaleString("de-DE")} km`]]
    },
    social: {
      label: "Menschen", title: "Soziale Standards", icon: "♙", weight: 25, score: product.socialScore,
      description: "Geprüft werden Lohnstandard, Arbeitszeiten, Sicherheit und soziale Nachweise.",
      facts: [["Lohnstandard", product.wageStandard === "living" ? "Living Wage belegt" : product.wageStandard === "minimum" ? "Mindestlohn belegt" : "Nicht belegt"], ["ILO-Arbeitszeiten", product.iloWorkingHours ? "Nachgewiesen" : "Nicht nachgewiesen"], ["Arbeitssicherheit", product.certifiedSafety ? "Zertifiziert" : "Noch offen"], ["Soziale Nachweise", `${product.certificates.length} Dokumente`]]
    },
    transparency: {
      label: "Daten", title: "Transparenz & Lieferkette", icon: "◇", weight: 10, score: product.transparencyScore,
      description: "Dieser Wert zeigt, wie vollständig und nachvollziehbar die Produktdaten belegt sind.",
      facts: [["Daten vollständig", `${product.completeness} %`], ["Lieferstufen", `${verifiedStages} von 5 verifiziert`], ["Materialherkunft", product.materialOriginsTraceable ? "Nachvollziehbar" : "Teilweise offen"], ["Produktpass", product.digitalProductPassport ? "Vorhanden" : "Noch nicht vorhanden"]]
    }
  };
  return definitions[key];
}

function consumerScoreCard(definition, key) {
  return `<button class="consumer-score-card ${key}" data-consumer-score="${key}" aria-expanded="false">
    <span class="consumer-score-top"><i class="consumer-score-icon">${definition.icon}</i><span class="consumer-score-weight">GEWICHTUNG ${definition.weight} %</span></span>
    <h3>${definition.title}</h3>
    <span class="consumer-score-value"><strong>${definition.score}</strong><span>/ 100</span></span>
    <span class="consumer-score-grade">Note ${gradeFor(definition.score)} · ${gradeCopy(gradeFor(definition.score))[0]}</span>
    <span class="consumer-score-bar"><i style="--value:${definition.score}%"></i></span>
    <span class="consumer-score-more">Details ansehen <i>+</i></span>
  </button>`;
}

function consumerScoreDetail(definition, key) {
  return `<section class="consumer-score-detail" data-consumer-detail="${key}">
    <div class="consumer-detail-title"><span>${definition.label.toUpperCase()} · ${definition.weight} % DES GESAMTSCORES</span><h3>${definition.title}</h3><p>${definition.description}</p></div>
    <div class="consumer-detail-facts">${definition.facts.map(([label, value]) => `<div class="consumer-detail-fact"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}<p class="consumer-detail-note">Die Bewertung bezieht sich auf dieses konkrete Produkt. Fehlende oder nicht belegte Angaben werden im Score nicht als positiv gewertet.</p></div>
  </section>`;
}

function renderConsumerView(product) {
  const copy = gradeCopy(product.grade);
  const definitions = Object.fromEntries(["material", "production", "social", "transparency"].map(key => [key, consumerScoreDefinition(product, key)]));
  const scale = ["A", "B", "C", "D", "E"].map(grade => `<span class="${grade.toLowerCase()} ${grade === product.grade ? "active" : ""}">${grade}</span>`).join("");
  $("#consumerContent").innerHTML = `
    <section class="consumer-hero consumer-card">
      <div class="consumer-product-panel" aria-label="Beiger Hoodie Classic">
        <div class="consumer-art" aria-hidden="true"><i class="consumer-art-sleeve left"></i><i class="consumer-art-sleeve right"></i><i class="consumer-art-body"></i><i class="consumer-art-hood"></i><i class="consumer-art-string one"></i><i class="consumer-art-string two"></i><i class="consumer-art-pocket"></i></div>
        <span class="consumer-scan-pill">✓ QR-PRODUKTPROFIL</span>
      </div>
      <div class="consumer-summary">
        <span class="consumer-kicker">${escapeHtml(product.category)} · ${escapeHtml(product.sku)}</span>
        <h1>${escapeHtml(product.name)}</h1>
        <p class="consumer-product-meta">Produziert in ${escapeHtml(product.country)}</p>
        <div class="consumer-overall"><div class="consumer-grade">${product.grade}</div><div class="consumer-overall-copy"><small>NACHHALTIGKEITSSCORE</small><strong>${product.score} / 100</strong><p>${copy[0]} · ${copy[1]}</p></div></div>
        <div class="consumer-data-status"><i></i><span>Daten zu <b>${product.completeness} %</b> vollständig · Stand Juli 2026</span></div>
      </div>
    </section>
    <section class="consumer-message consumer-card"><span class="consumer-message-icon">♧</span><div><b>Das bedeutet dein Ergebnis</b><p>Der Score bündelt vier Bereiche. Öffne die Karten, um zu sehen, welche Produktdaten in die Bewertung eingeflossen sind.</p></div><span>↓</span></section>
    <section class="consumer-section">
      <div class="consumer-section-head"><div><span>Score im Überblick</span><h2>Vier Perspektiven. Ein Ergebnis.</h2></div><p>Jeder Teilscore bleibt sichtbar, damit ein guter Gesamtwert keine Schwäche verdeckt.</p></div>
      <div class="consumer-score-grid">${Object.entries(definitions).map(([key, definition]) => consumerScoreCard(definition, key)).join("")}${Object.entries(definitions).map(([key, definition]) => consumerScoreDetail(definition, key)).join("")}</div>
    </section>
    <section class="consumer-section">
      <div class="consumer-section-head"><div><span>Auf einen Blick</span><h2>Die wichtigsten Produktwerte.</h2></div></div>
      <div class="consumer-facts consumer-card">
        <article class="consumer-fact"><span>CO₂</span><small>CO₂-Fußabdruck</small><strong>${Number(product.co2).toLocaleString("de-DE")} kg</strong><em>CO₂e pro Produkt</em></article>
        <article class="consumer-fact"><span>☼</span><small>Erneuerbare Energie</small><strong>${product.renewable} %</strong><em>in der Produktion</em></article>
        <article class="consumer-fact"><span>⌁</span><small>Transportweg</small><strong>${Number(product.transportDistance).toLocaleString("de-DE")} km</strong><em>hauptsächlich per ${escapeHtml(product.transport)}</em></article>
        <article class="consumer-fact"><span>✓</span><small>Datenqualität</small><strong>${product.completeness} %</strong><em>vollständig belegt</em></article>
      </div>
    </section>
    <section class="consumer-section consumer-method consumer-card">
      <div class="consumer-method-copy"><span>SO WIRD BEWERTET</span><h2>Transparent gewichtet.</h2><p>Der Gesamtscore ist ein gewichteter Mittelwert der vier sichtbaren Bereiche. Er dient als verständliche Orientierung und ersetzt keine unabhängige Produktzertifizierung.</p></div>
      <div class="consumer-method-scale">
        <div class="consumer-weight-row"><span>Materialien</span><i><b style="width:100%"></b></i><strong>35 %</strong></div>
        <div class="consumer-weight-row"><span>Produktion & CO₂</span><i><b style="width:86%"></b></i><strong>30 %</strong></div>
        <div class="consumer-weight-row"><span>Soziale Standards</span><i><b style="width:71%"></b></i><strong>25 %</strong></div>
        <div class="consumer-weight-row"><span>Transparenz</span><i><b style="width:29%"></b></i><strong>10 %</strong></div>
        <div class="consumer-scale" aria-label="Bewertungsskala von A bis E">${scale}</div><div class="consumer-scale-note"><span>A · 90–100</span><span>E · 0–39</span></div>
      </div>
    </section>
    <p class="consumer-disclaimer"><span>ⓘ</span><span><b>Wichtig:</b> What You Wear ist ein interaktiver Hochschulprototyp und aktuell kein akkreditiertes Zertifizierungssystem. Der Score basiert auf den für dieses Produkt hinterlegten Demo-Daten und Nachweisen.</span></p>
    <footer class="consumer-footer"><b>WHAT YOU WEAR</b><span>Know what you wear.</span></footer>`;

  $$('[data-consumer-score]').forEach(button => button.addEventListener("click", () => {
    const key = button.dataset.consumerScore;
    const willOpen = button.getAttribute("aria-expanded") !== "true";
    $$('[data-consumer-score]').forEach(other => { other.setAttribute("aria-expanded", "false"); other.querySelector(".consumer-score-more i").textContent = "+"; });
    $$('[data-consumer-detail]').forEach(detail => detail.classList.remove("active"));
    if (willOpen) { button.setAttribute("aria-expanded", "true"); button.querySelector(".consumer-score-more i").textContent = "−"; $(`[data-consumer-detail="${key}"]`).classList.add("active"); }
  }));
}

function openConsumer(product = selectedProduct()) {
  state.selectedProductId = product.id;
  $("#landingView").hidden = true;
  $("#dashboardView").hidden = true;
  $("#consumerView").hidden = false;
  renderConsumerView(product);
  document.title = `${product.name} · What You Wear Score`;
  history.replaceState(null, "", `#product-${product.sku}`);
  window.scrollTo(0, 0);
}

function showProductModal() {
  $("#productModal").hidden = false;
  setTimeout(() => $("#newProductForm input[name='name']")?.focus(), 50);
}

function closeProductModal() {
  $("#productModal").hidden = true;
}

function updateGlobalMetrics() {
  $("#navProductCount").textContent = state.products.length;
  const completeness = Math.round(state.products.reduce((a, p) => a + p.completeness, 0) / state.products.length);
  $("#sidebarCompleteness").textContent = `${completeness} %`;
  $(".sidebar-progress .progress i").style.width = `${completeness}%`;
}

function dashboardPageHead(kicker, title, description, actions = "") {
  return `<div class="page-head"><div><span>${kicker}</span><h1>${title}</h1><p>${description}</p></div><div class="page-actions">${actions}</div></div>`;
}

function renderDashboard() {
  const titles = { overview: "Übersicht", products: "Produkte", materials: "Materialien", production: "Produktion & CO₂", social: "Soziale Standards", supply: "Lieferkette", analytics: "Analytics", reports: "Berichte & Labels" };
  $("#breadcrumbTitle").textContent = titles[state.currentPage];
  $$(".dash-nav button").forEach(btn => btn.classList.toggle("active", btn.dataset.page === state.currentPage));
  const renderers = { overview: renderOverview, products: renderProducts, materials: renderMaterials, production: renderProduction, social: renderSocial, supply: renderSupply, analytics: renderAnalytics, reports: renderReports };
  $("#dashboardContent").innerHTML = renderers[state.currentPage]();
  bindCurrentPage();
  updateGlobalMetrics();
}

function renderOverview() {
  const avg = Math.round(state.products.reduce((a, p) => a + p.score, 0) / state.products.length);
  const complete = Math.round(state.products.reduce((a, p) => a + p.completeness, 0) / state.products.length);
  const organic = Math.round(state.products.reduce((a, p) => a + p.organic, 0) / state.products.length);
  const categoryAverages = ["materialScore", "productionScore", "socialScore", "transparencyScore"].map(key => Math.round(state.products.reduce((sum, p) => sum + p[key], 0) / state.products.length));
  const latest = state.products.slice(0, 4);
  return `${dashboardPageHead("Dashboard", "Guten Morgen, Emilija", "Hier siehst du den aktuellen Stand eures Produktportfolios.", `<button class="button button-ghost" data-export="json">Daten exportieren</button><button class="button button-dark" data-open-modal>+ Produkt anlegen</button>`)}
    <div class="metric-grid">
      <article class="metric-card primary"><span>PORTFOLIO-SCORE</span><div class="metric-main"><strong>${gradeFor(avg)} · ${avg}</strong><div class="mini-donut" style="--portfolio-score:${avg}%"><span>${gradeFor(avg)}</span></div></div><small>Berechnet nach der neuen A–E-Skala</small></article>
      <article class="metric-card"><span>AKTIVE PRODUKTE</span><div class="metric-main"><strong>${state.products.length}</strong><small>Produkte</small></div><small class="metric-change">+ 2 im laufenden Semester</small></article>
      <article class="metric-card"><span>Ø BIO-ANTEIL</span><div class="metric-main"><strong>${organic} %</strong><small>im Portfolio</small></div><small>Gewichteter Demo-Mittelwert</small></article>
      <article class="metric-card"><span>DATENVOLLSTÄNDIGKEIT</span><div class="metric-main"><strong>${complete} %</strong><small>belegt</small></div><small class="metric-change">↑ 6 % durch neue Nachweise</small></article>
    </div>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-head"><h2>Scores nach Kategorie</h2><span>Portfolio-Durchschnitt</span></div><div class="category-bars">
        ${categoryBar("Materialien · 35 %", categoryAverages[0], gradeFor(categoryAverages[0]))}${categoryBar("Produktion · 30 %", categoryAverages[1], gradeFor(categoryAverages[1]))}${categoryBar("Soziales · 25 %", categoryAverages[2], gradeFor(categoryAverages[2]))}${categoryBar("Transparenz · 10 %", categoryAverages[3], gradeFor(categoryAverages[3]))}
      </div></section>
      <section class="panel"><div class="panel-head"><h2>Nächste Schritte</h2><button data-page-link="products">Alle ansehen →</button></div><div class="recommendation-list">
        <div class="recommendation"><span>!</span><div><b>3 Produkte mit Datenlücken</b><small>Lieferstufe 4 verifizieren</small></div><i>→</i></div>
        <div class="recommendation"><span>▤</span><div><b>2 Nachweise laufen aus</b><small>Innerhalb der nächsten 60 Tage</small></div><i>→</i></div>
        <div class="recommendation"><span>↗</span><div><b>Report bereit zum Export</b><small>Portfolio · Q2 2026</small></div><i>→</i></div>
      </div></section>
    </div>
    <section class="panel" style="margin-top:14px"><div class="panel-head"><h2>Neueste Produkte</h2><button data-page-link="products">Alle Produkte →</button></div>${productTable(latest)}</section>`;
}

function categoryBar(label, value, grade) {
  return `<div class="category-bar"><span>${label}</span><div class="bar-track"><i style="width:${value}%"></i></div><b>${grade} · ${value}</b></div>`;
}

function productTable(products) {
  if (!products.length) return `<div class="empty-state"><b>Keine Produkte gefunden</b>Ändere Suche oder Filter.</div>`;
  return `<table class="data-table"><thead><tr><th>PRODUKT</th><th>KATEGORIE</th><th>LAND</th><th>SCORE</th><th>DATEN</th><th>STATUS</th><th></th></tr></thead><tbody>${products.map(p => `<tr>
    <td><div class="product-cell"><span class="product-thumb"></span><div><b>${p.name}</b><small>${p.sku}</small></div></div></td><td>${p.category}</td><td>${p.country}</td><td><span class="table-grade ${p.grade.toLowerCase()}">${p.grade}</span></td><td>${p.completeness} %</td><td><span class="status ${p.status === "Entwurf" ? "draft" : ""}">${p.status}</span></td><td><button class="table-action" data-edit-product="${p.id}" aria-label="${p.name} bearbeiten">→</button></td>
  </tr>`).join("")}</tbody></table>`;
}

function renderProducts() {
  const categories = ["Alle", ...new Set(state.products.map(p => p.category))];
  const statuses = ["Alle", ...new Set(state.products.map(p => p.status))];
  const filtered = state.products.filter(p => {
    const q = state.productSearch.toLowerCase();
    return (!q || `${p.name} ${p.sku}`.toLowerCase().includes(q)) && (state.categoryFilter === "Alle" || p.category === state.categoryFilter) && (state.statusFilter === "Alle" || p.status === state.statusFilter);
  });
  return `${dashboardPageHead("Produktmanagement", "Produkte", "Verwalte Scores, Status und Datenvollständigkeit.", `<button class="button button-ghost" data-export="csv">CSV exportieren</button><button class="button button-dark" data-open-modal>+ Produkt anlegen</button>`)}
    <div class="toolbar"><div class="search-box">⌕<input id="productSearch" value="${state.productSearch}" placeholder="Produkt oder SKU suchen …" /></div><div class="filters"><select id="categoryFilter">${categories.map(x => `<option ${x === state.categoryFilter ? "selected" : ""}>${x}</option>`).join("")}</select><select id="statusFilter">${statuses.map(x => `<option ${x === state.statusFilter ? "selected" : ""}>${x}</option>`).join("")}</select></div></div>
    <section class="table-panel">${productTable(filtered)}<div class="table-footer"><span>${filtered.length} von ${state.products.length} Produkten</span><div><button>←</button> <button>1</button> <button>→</button></div></div></section>`;
}

function productSelector() {
  return `<select id="editorProductSelect">${state.products.map(p => `<option value="${p.id}" ${p.id === state.selectedProductId ? "selected" : ""}>${p.name} · ${p.sku}</option>`).join("")}</select>`;
}

function criterionCheckbox(name, title, points, checked, detail = "") {
  return `<label class="criterion-check full"><input type="checkbox" name="${name}" ${checked ? "checked" : ""} /><span><b>${title}</b>${detail ? `<small>${detail}</small>` : ""}</span><strong class="${String(points).startsWith("-") ? "negative" : ""}">${String(points).startsWith("-") ? points : `+${points}`}</strong></label>`;
}

function renderMaterials() {
  const p = selectedProduct();
  return `${dashboardPageHead("Produktdaten", "Materialien", "Materialmix, Herkunft und Zertifikate des gewählten Produkts.", `<label class="button button-ghost">Produkt: ${productSelector()}</label>`)}
    <div class="editor-layout">
      <section class="editor-card"><h2>Materialzusammensetzung</h2><p>Änderungen aktualisieren den Material- und Gesamtscore live.</p>
        <form id="materialForm" class="field-grid">
          <label class="full">Materialbeschreibung<input name="material" value="${p.material}" /></label>
          <label class="full">Anteil nachhaltiger Materialien in %<input type="number" min="0" max="100" name="sustainablePercent" value="${p.sustainablePercent}" /><small class="field-help">80–100 %: +60 · 50–79 %: +40 · 20–49 %: +20 · unter 20 %: 0 Punkte</small></label>
          <label>Bio-Anteil in %<input type="number" min="0" max="100" name="organic" value="${p.organic}" /></label>
          <label>Recyclinganteil in %<input type="number" min="0" max="100" name="recycled" value="${p.recycled}" /></label>
          <label>Hauptzertifizierung<select name="certification">${["Keine","GOTS","OEKO-TEX","GRS","EU Ecolabel"].map(c => `<option ${c===p.certification?"selected":""}>${c}</option>`).join("")}</select></label>
          <label>Herkunft Rohfaser<select name="origin"><option>Türkei</option><option>Portugal</option><option>Indien</option><option>Deutschland</option></select></label>
          ${criterionCheckbox("recycledPolyester", "Recycelter Polyesteranteil", -5, p.recycledPolyester, "Abzug laut Kriterienkatalog")}
          ${criterionCheckbox("highVirginPolyester", "Hoher Anteil neuer Polyesterfasern", -20, p.highVirginPolyester, "Abzug laut Kriterienkatalog")}
          <div class="form-divider"></div><span class="form-section-title">Nachweise</span>
          <label class="upload-zone full"><input type="file" id="certificateUpload" accept=".pdf,.jpg,.jpeg,.png" /><span>⇧</span><b>Zertifikat hochladen</b><small>PDF, JPG oder PNG · max. 10 MB</small></label>
        </form>
        <div class="certificate-list" id="certificateList">${certificateList(p)}</div>
        <div class="save-bar"><button class="button button-ghost" data-reset-demo>Zurücksetzen</button><button class="button button-dark" id="saveMaterial">Änderungen speichern</button></div>
      </section>${scorePreview(p, "MATERIALSCORE · 35 %", p.materialScore, p.materialPoints, 80)}
    </div>`;
}

function certificateList(p) {
  return p.certificates.length ? p.certificates.map(c => `<div class="certificate-item"><span>▤</span><div><b>${c}</b><small>Verknüpft mit ${p.name}</small></div><i>✓ gültig</i></div>`).join("") : `<div class="empty-state"><b>Noch kein Nachweis</b>Lade ein Zertifikat hoch, um die Datenlage zu verbessern.</div>`;
}

function scorePreview(p, label, score, points, maximum) {
  return `<aside class="score-preview" id="scorePreview"><span>${label}</span><div class="score-circle" style="--score:${score}%"><strong id="previewGrade">${gradeFor(score)}</strong></div><div class="score-number"><span id="previewScore">${score}</span> / 100</div><small><span id="previewPoints">${points}</span> von ${maximum} Rohpunkten · auf 100 normiert</small><div class="score-breakdown"><div><span>Gesamtscore</span><b>${p.grade} · ${p.score}</b></div><div><span>Daten vollständig</span><b>${p.completeness} %</b></div><div><span>Notenskala</span><b>A ab 90</b></div></div></aside>`;
}

function renderProduction() {
  const p = selectedProduct();
  return `${dashboardPageHead("Produktdaten", "Produktion & CO₂", "Energie, Emissionen, Standort und Transportwege.", `<label class="button button-ghost">Produkt: ${productSelector()}</label>`)}
    <div class="editor-layout"><section class="editor-card"><h2>Produktionsdaten</h2><p>Die Werte dienen der interaktiven Demonstration und sind keine Ökobilanz.</p>
      <form id="productionForm" class="field-grid">
        <label>Produktionsland<select name="country">${["Portugal","Türkei","Deutschland","Italien","Bangladesch"].map(c=>`<option ${c===p.country?"selected":""}>${c}</option>`).join("")}</select></label>
        <label>Fertigungsstätte<input value="Atelier Norte · Porto" /></label>
        <label>Erneuerbare Energie in %<input type="number" min="0" max="100" name="renewable" value="${p.renewable}" /></label>
        <label>CO₂e pro Produkt in kg<input type="number" min="0" max="50" step="0.1" name="co2" value="${p.co2}" /></label>
        <label>Haupttransport<select name="transport">${["Bahn","Schiff","LKW","Luftfracht"].map(c=>`<option ${c===p.transport?"selected":""}>${c}</option>`).join("")}</select></label>
        <label>Transportdistanz in km<input type="number" min="0" name="transportDistance" value="${p.transportDistance}" /></label>
        <div class="form-divider"></div><span class="form-section-title">Berechnungsstatus</span>
        <div class="full criteria-note"><b>Punkte werden direkt aus den Werten vergeben.</b><small>Energie bis +30 · CO₂ bis +30 · Produktion in Europa +20 · Lieferweg bis +20 · Luftfracht −20</small></div>
      </form><div class="save-bar"><button class="button button-ghost" data-page-link="supply">Lieferweg prüfen</button><button class="button button-dark" id="saveProduction">Änderungen speichern</button></div>
    </section>${scorePreview(p, "PRODUKTIONSSCORE · 30 %", p.productionScore, p.productionPoints, 100)}</div>`;
}

function renderSocial() {
  const p = selectedProduct();
  return `${dashboardPageHead("Produktdaten", "Soziale Standards", "Arbeitsbedingungen und soziale Verantwortung anhand der festgelegten Kriterien.", `<label class="button button-ghost">Produkt: ${productSelector()}</label>`)}
    <div class="editor-layout"><section class="editor-card"><h2>Soziale Nachweise</h2><p>Die Kriterien ergeben maximal 85 Rohpunkte und werden für den Teilscore auf 100 normiert.</p>
      <form id="socialForm" class="field-grid">
        <label class="full">Lohnstandard<select name="wageStandard"><option value="none" ${p.wageStandard === "none" ? "selected" : ""}>Nicht nachgewiesen · 0 Punkte</option><option value="minimum" ${p.wageStandard === "minimum" ? "selected" : ""}>Gesetzlicher Mindestlohn · +10</option><option value="living" ${p.wageStandard === "living" ? "selected" : ""}>Living Wage · +25</option></select></label>
        ${criterionCheckbox("iloWorkingHours", "Arbeitszeiten nach internationalen ILO-Standards", 10, p.iloWorkingHours)}
        ${criterionCheckbox("certifiedSafety", "Zertifizierte Arbeitssicherheit", 15, p.certifiedSafety)}
        ${criterionCheckbox("noChildLabor", "Keine Kinderarbeit nachgewiesen", 20, p.noChildLabor)}
        ${criterionCheckbox("transparentFacilities", "Transparente Produktionsstätten", 15, p.transparentFacilities)}
        ${criterionCheckbox("laborViolations", "Verstöße gegen Arbeitsrechte", -30, p.laborViolations)}
      </form><div class="save-bar"><button class="button button-dark" id="saveSocial">Änderungen speichern</button></div>
    </section>${scorePreview(p, "SOZIALSCORE · 25 %", p.socialScore, p.socialPoints, 85)}</div>`;
}

function renderSupply() {
  const p = selectedProduct();
  const stages = [
    ["Rohmaterial", "Izmir, Türkei"], ["Spinnerei", "Braga, Portugal"], ["Färberei", "Guimarães, Portugal"], ["Konfektion", "Porto, Portugal"], ["Logistik", "Berlin, Deutschland"]
  ];
  return `${dashboardPageHead("Transparenz", "Lieferkette", "Stufen prüfen, verifizieren und für den Produktpass freigeben.", `<label class="button button-ghost">Produkt: ${productSelector()}</label><button class="button button-dark" id="publishPassport">Produktpass veröffentlichen</button>`)}
    <section class="panel"><div class="panel-head"><h2>${p.name} · Lieferweg</h2><span>Klicke einen Punkt, um den Status zu ändern</span></div>
      <div class="supply-timeline">${stages.map((s,i)=>`<div class="supply-step ${p.supply[i]?"verified":""}"><button data-stage="${i}">${p.supply[i]?"✓":i+1}</button><b>${s[0]}</b><small>${s[1]}</small></div>`).join("")}</div>
      <div class="supply-card-grid">${stages.slice(0,3).map((s,i)=>`<article class="supply-card"><span>STUFE 0${i+1}</span><h3>${s[0]}</h3><p>${s[1]}<br />Partner-ID: WYW-${1840+i}</p><span class="verified-pill">${p.supply[i]?"✓ Verifiziert":"○ Nachweis fehlt"}</span></article>`).join("")}</div>
    </section>
    <div class="editor-layout supply-score-layout"><section class="editor-card"><h2>Transparenz-Kriterien</h2><p>Eine vollständig öffentlich einsehbare Lieferkette bringt +40 Punkte. Die übrigen Kriterien werden hier gepflegt.</p>
      <form id="transparencyForm" class="field-grid">
        <div class="full criteria-note"><b>${p.supply.every(Boolean) ? "✓ Vollständige Lieferkette öffentlich einsehbar · +40" : `Noch ${p.supply.filter(x => !x).length} Lieferstufe(n) fehlen · 0 Punkte`}</b><small>Alle fünf Stufen müssen verifiziert sein.</small></div>
        ${criterionCheckbox("materialOriginsTraceable", "Herkunft aller Materialien nachvollziehbar", 30, p.materialOriginsTraceable)}
        ${criterionCheckbox("digitalProductPassport", "Digitaler Produktpass vorhanden", 30, p.digitalProductPassport)}
        ${criterionCheckbox("partialSupplierData", "Teilweise fehlende Lieferantendaten", -20, p.partialSupplierData)}
      </form><div class="save-bar"><button class="button button-dark" id="saveTransparency">Kriterien speichern</button></div>
    </section>${scorePreview(p, "TRANSPARENZSCORE · 10 %", p.transparencyScore, p.transparencyPoints, 100)}</div>`;
}

function renderAnalytics() {
  const gradeColors = { A: "#315e4e", B: "#7e9a61", C: "#c6a653", D: "#d58245", E: "#b9564d" };
  let distributionStart = 0;
  const distributionSegments = ["A", "B", "C", "D", "E"].map(grade => {
    const count = state.products.filter(p => p.grade === grade).length;
    const start = distributionStart;
    distributionStart += count / state.products.length * 100;
    return `${gradeColors[grade]} ${start}% ${distributionStart}%`;
  }).join(",");
  return `${dashboardPageHead("Portfolioanalyse", "Analytics", "Score-Entwicklung, Verteilung und priorisierte Handlungsfelder.", `<button class="button button-ghost" data-export="csv">Daten herunterladen</button><button class="button button-dark" data-page-link="reports">Bericht erstellen</button>`)}
    <div class="analytics-cards"><section class="panel"><div class="panel-head"><h2>Score-Entwicklung</h2><span>Jan–Jul 2026</span></div><div class="chart-wrap"><svg class="line-chart" viewBox="0 0 600 210" preserveAspectRatio="none"><path class="chart-gridline" d="M0 42H600M0 84H600M0 126H600M0 168H600"/><polyline points="0,160 100,145 200,132 300,112 400,118 500,84 600,69"/><circle cx="0" cy="160" r="4"/><circle cx="100" cy="145" r="4"/><circle cx="200" cy="132" r="4"/><circle cx="300" cy="112" r="4"/><circle cx="400" cy="118" r="4"/><circle cx="500" cy="84" r="4"/><circle cx="600" cy="69" r="4"/></svg></div><div class="chart-labels"><span>JAN</span><span>FEB</span><span>MÄR</span><span>APR</span><span>MAI</span><span>JUN</span><span>JUL</span></div></section>
      <section class="panel"><div class="panel-head"><h2>Score-Verteilung</h2><span>${state.products.length} Produkte</span></div><div class="donut-large" data-total="${state.products.length}" style="background:conic-gradient(${distributionSegments})"></div><div class="legend"><span><i></i>A · 90–100</span><span><i style="background:#7e9a61"></i>B · 75–89</span><span><i style="background:#c6a653"></i>C · 60–74</span><span><i style="background:#d58245"></i>D · 40–59</span><span><i style="background:#b9564d"></i>E · 0–39</span></div></section></div>
    <div class="dashboard-grid"><section class="panel"><div class="panel-head"><h2>CO₂e nach Produkt</h2><span>kg pro Stück</span></div><div class="bar-chart">${state.products.map((p,i)=>`<div class="bar-group"><i style="height:${Math.min(95,p.co2*6)}%"></i><i style="height:${Math.min(95,(p.co2*.78)*6)}%"></i><span>${p.name.split(" ")[0]}</span></div>`).join("")}</div></section><section class="panel"><div class="panel-head"><h2>Empfehlungen</h2><span>Priorisiert</span></div><div class="insight-card"><span>GRÖSSTER HEBEL</span><h3>Denim: Produktionsenergie belegen</h3><p>Primärdaten könnten Produktionsscore und Nachweisqualität verbessern.</p></div><div class="insight-card"><span>SCHNELL UMSETZBAR</span><h3>Zertifikat der Field Jacket erneuern</h3><p>Der aktuelle GRS-Nachweis läuft in 43 Tagen aus.</p></div></section></div>`;
}

function renderReports() {
  const p = selectedProduct();
  return `${dashboardPageHead("Output", "Berichte & Labels", "Erzeuge konsistente Ausgaben aus dem aktuellen Datenstand.", `<label class="button button-ghost">Produkt: ${productSelector()}</label><button class="button button-dark" data-download="report">+ Bericht erstellen</button>`)}
    <div class="reports-grid"><section class="editor-card"><h2>Verfügbare Exporte</h2><p>Demo-Downloads werden lokal aus den eingegebenen Daten erzeugt.</p><div class="report-list">
      <div class="report-row"><span>▤</span><div><b>Produktdaten-Bericht</b><small>HTML · aktueller Stand</small></div><button data-download="report">Erstellen</button></div>
      <div class="report-row"><span>⌗</span><div><b>Transparenzlabel</b><small>SVG · druckfähige Vektordatei</small></div><button data-download="label">Download</button></div>
      <div class="report-row"><span>↗</span><div><b>B2C-Webansicht</b><small>QR-Ziel · Score und transparente Details</small></div><button data-open-consumer>Öffnen</button></div>
      <div class="report-row"><span>{ }</span><div><b>Produktpass-Daten</b><small>JSON · maschinenlesbar</small></div><button data-download="product-json">Download</button></div>
      <div class="report-row"><span>▦</span><div><b>Portfolio-Übersicht</b><small>CSV · ${state.products.length} Produkte</small></div><button data-export="csv">Download</button></div>
    </div></section>
    <section class="editor-card"><h2>Label-Vorschau</h2><p>${p.name} · ${p.sku}</p>${labelMarkup(p)}<div class="report-buttons"><button class="button button-ghost" data-download="label">SVG laden</button><button class="button button-dark" id="copyShareLink">Link kopieren</button></div></section></div>`;
}

function labelMarkup(p) {
  const copy = gradeCopy(p.grade);
  const category = (icon, title, score, tone) => `<div class="label-category ${tone}"><i>${icon}</i><span><small>${title}</small><b>${gradeFor(score)}</b></span></div>`;
  return `<div class="label-preview correct-label">
    <div class="label-logo"><span>W H A T&nbsp;&nbsp;Y O U&nbsp;&nbsp;W E A R</span><svg viewBox="0 0 80 42"><path d="M6 38 40 18l34 20M40 18V9c0-7 10-5 10-13 0-5-4-8-10-8-6 0-10 4-10 9" /></svg></div>
    <div class="label-title">TRANSPARENZ LABEL</div>
    <div class="label-main"><div class="label-leaf-grade">${p.grade}</div><div class="label-verdict"><b>${copy[0]}</b><span>${copy[1]}</span></div></div>
    <div class="label-category-grid">
      ${category("◒", "MATERIALIEN &<br>ROHSTOFFE", p.materialScore, "green")}
      ${category("♜", "PRODUKTION<br>& CO₂", p.productionScore, "amber")}
      ${category("♙", "SOZIALE<br>STANDARDS", p.socialScore, "green")}
      ${category("♢", "TRANSPARENZ &<br>LIEFERKETTE", p.transparencyScore, "amber")}
    </div>
    <div class="label-qr-footer"><i>♢</i><span>Scanne den QR-Code<br>für alle Details zu<br>diesem Produkt.</span><svg viewBox="0 0 60 60" aria-label="QR-Code Vorschau"><rect width="60" height="60" fill="#fff"/><path d="M2 2h18v18H2zm38 0h18v18H40zM2 40h18v18H2zM7 7v8h8V7zm38 0v8h8V7zM7 45v8h8v-8zM25 2h5v5h-5zm8 0h5v12h-5zM23 11h7v7h-7zm9 8h8v6h-8zm-9 3h6v10h-6zm12 6h7v7h-7zm10-6h6v10h-6zm8 3h5v13h-5zM23 36h9v6h-9zm12 2h6v12h-6zm9-2h6v7h-6zm9 8h5v14h-5zm-29 2h7v12h-7zm10 8h14v4H34z" fill="#111"/></svg></div>
  </div>`;
}

function bindCurrentPage() {
  $$('[data-open-modal]').forEach(btn => btn.addEventListener("click", showProductModal));
  $$('[data-page-link]').forEach(btn => btn.addEventListener("click", () => { state.currentPage = btn.dataset.pageLink; history.replaceState(null,"",`#dashboard-${state.currentPage}`); renderDashboard(); }));
  $$('[data-edit-product]').forEach(btn => btn.addEventListener("click", () => { state.selectedProductId = Number(btn.dataset.editProduct); state.currentPage = "materials"; renderDashboard(); }));
  $$('[data-export]').forEach(btn => btn.addEventListener("click", () => btn.dataset.export === "csv" ? downloadCSV() : downloadJSON(state.products, "what-you-wear-portfolio.json")));
  $$('[data-download]').forEach(btn => btn.addEventListener("click", () => handleDownload(btn.dataset.download)));
  $$('[data-open-consumer]').forEach(btn => btn.addEventListener("click", () => openConsumer(selectedProduct())));

  const search = $("#productSearch");
  if (search) search.addEventListener("input", e => { state.productSearch = e.target.value; renderProductsInPlace(); });
  $("#categoryFilter")?.addEventListener("change", e => { state.categoryFilter = e.target.value; renderDashboard(); });
  $("#statusFilter")?.addEventListener("change", e => { state.statusFilter = e.target.value; renderDashboard(); });
  $("#editorProductSelect")?.addEventListener("change", e => { state.selectedProductId = Number(e.target.value); renderDashboard(); });

  bindMaterialPage();
  bindProductionPage();
  bindSocialPage();
  bindSupplyPage();
  $("#copyShareLink")?.addEventListener("click", async () => {
    const link = `${location.origin}${location.pathname}#product-${selectedProduct().sku}`;
    try { await navigator.clipboard.writeText(link); toast("Freigabelink wurde kopiert."); } catch (_) { toast("Freigabelink: " + link); }
  });
}

function renderProductsInPlace() {
  const tablePanel = $(".table-panel");
  if (!tablePanel) return;
  const q = state.productSearch.toLowerCase();
  const filtered = state.products.filter(p => (!q || `${p.name} ${p.sku}`.toLowerCase().includes(q)) && (state.categoryFilter === "Alle" || p.category === state.categoryFilter) && (state.statusFilter === "Alle" || p.status === state.statusFilter));
  tablePanel.innerHTML = `${productTable(filtered)}<div class="table-footer"><span>${filtered.length} von ${state.products.length} Produkten</span><div><button>←</button> <button>1</button> <button>→</button></div></div>`;
  $$('[data-edit-product]', tablePanel).forEach(btn => btn.addEventListener("click", () => { state.selectedProductId = Number(btn.dataset.editProduct); state.currentPage = "materials"; renderDashboard(); }));
}

function bindMaterialPage() {
  const form = $("#materialForm");
  if (!form) return;
  const updatePreview = () => {
    const data = new FormData(form);
    const draft = { ...selectedProduct(), sustainablePercent: Number(data.get("sustainablePercent")), certification: data.get("certification"), recycledPolyester: form.elements.recycledPolyester.checked, highVirginPolyester: form.elements.highVirginPolyester.checked };
    const points = materialPoints(draft);
    updateLivePreview(normalizedScore(points, 80), points);
  };
  form.addEventListener("input", updatePreview);
  $("#certificateUpload")?.addEventListener("change", e => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast("Die Datei ist größer als 10 MB."); return; }
    const p = selectedProduct(); p.certificates.push(file.name); p.completeness = Math.min(100, p.completeness + 3); persist();
    $("#certificateList").innerHTML = certificateList(p); toast(`${file.name} wurde hinzugefügt.`);
  });
  $("#saveMaterial")?.addEventListener("click", () => {
    const p = selectedProduct(); const data = new FormData(form);
    p.material = data.get("material"); p.sustainablePercent = Number(data.get("sustainablePercent")); p.organic = Number(data.get("organic")); p.recycled = Number(data.get("recycled")); p.certification = data.get("certification"); p.recycledPolyester = form.elements.recycledPolyester.checked; p.highVirginPolyester = form.elements.highVirginPolyester.checked; recalculateProduct(p); persist(); renderDashboard(); toast("Materialkriterien und Score wurden gespeichert.");
  });
  $("[data-reset-demo]")?.addEventListener("click", () => { const original = defaultProducts.find(x => x.id === selectedProduct().id); if (original) Object.assign(selectedProduct(), hydrateProduct(structuredClone(original))); persist(); renderDashboard(); toast("Demo-Werte wurden zurückgesetzt."); });
}

function updateLivePreview(score, points) {
  $("#previewScore").textContent = score;
  $("#previewGrade").textContent = gradeFor(score);
  $("#previewPoints").textContent = points;
  $("#scorePreview .score-circle").style.setProperty("--score", `${score}%`);
}

function bindProductionPage() {
  const form = $("#productionForm"); if (!form) return;
  const update = () => {
    const data = new FormData(form);
    const draft = { ...selectedProduct(), country: data.get("country"), renewable: Number(data.get("renewable")), co2: Number(data.get("co2")), transport: data.get("transport"), transportDistance: Number(data.get("transportDistance")) };
    const points = productionPoints(draft);
    updateLivePreview(normalizedScore(points, 100), points);
  };
  form.addEventListener("input", update);
  $("#saveProduction")?.addEventListener("click", () => { const p=selectedProduct(), data=new FormData(form); p.country=data.get("country");p.renewable=Number(data.get("renewable"));p.co2=Number(data.get("co2"));p.transport=data.get("transport");p.transportDistance=Number(data.get("transportDistance"));recalculateProduct(p);persist();renderDashboard();toast("Produktionskriterien und Score wurden gespeichert."); });
}

function bindSocialPage() {
  const form = $("#socialForm"); if (!form) return;
  const readDraft = () => ({ ...selectedProduct(), wageStandard: form.elements.wageStandard.value, iloWorkingHours: form.elements.iloWorkingHours.checked, certifiedSafety: form.elements.certifiedSafety.checked, noChildLabor: form.elements.noChildLabor.checked, transparentFacilities: form.elements.transparentFacilities.checked, laborViolations: form.elements.laborViolations.checked });
  form.addEventListener("input", () => { const points = socialPoints(readDraft()); updateLivePreview(normalizedScore(points, 85), points); });
  $("#saveSocial")?.addEventListener("click", () => { Object.assign(selectedProduct(), readDraft()); recalculateProduct(selectedProduct()); persist(); renderDashboard(); toast("Soziale Kriterien und Score wurden gespeichert."); });
}

function bindSupplyPage() {
  $$('[data-stage]').forEach(btn => btn.addEventListener("click", () => {
    const p = selectedProduct(), index = Number(btn.dataset.stage); p.supply[index] = !p.supply[index];
    p.completeness = Math.min(100, Math.round((p.materialScore + p.productionScore + p.socialScore + p.supply.filter(Boolean).length * 20) / 4)); recalculateProduct(p); persist(); renderDashboard(); toast(p.supply[index] ? "Lieferstufe verifiziert." : "Verifizierung entfernt.");
  }));
  const form = $("#transparencyForm");
  if (form) {
    const readDraft = () => ({ ...selectedProduct(), materialOriginsTraceable: form.elements.materialOriginsTraceable.checked, digitalProductPassport: form.elements.digitalProductPassport.checked, partialSupplierData: form.elements.partialSupplierData.checked });
    form.addEventListener("input", () => { const points = transparencyPoints(readDraft()); updateLivePreview(normalizedScore(points, 100), points); });
    $("#saveTransparency")?.addEventListener("click", () => { Object.assign(selectedProduct(), readDraft()); recalculateProduct(selectedProduct()); persist(); renderDashboard(); toast("Transparenzkriterien und Score wurden gespeichert."); });
  }
  $("#publishPassport")?.addEventListener("click", () => { selectedProduct().status = "Veröffentlicht"; persist(); renderDashboard(); toast("Digitaler Produktpass wurde veröffentlicht."); });
}

function handleDownload(type) {
  const p = selectedProduct();
  if (type === "label") return downloadLabel(p);
  if (type === "product-json") return downloadJSON(p, `${slug(p.name)}-produktpass.json`);
  if (type === "report") return downloadReport(p);
}

function downloadBlob(content, mime, filename) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 500); toast(`${filename} wurde erstellt.`);
}

function downloadJSON(data, filename) { downloadBlob(JSON.stringify(data, null, 2), "application/json", filename); }
function downloadCSV() {
  const headers = ["Name","SKU","Kategorie","Land","Score","Grade","Datenvollständigkeit","Status"];
  const rows = state.products.map(p => [p.name,p.sku,p.category,p.country,p.score,p.grade,p.completeness,p.status]);
  const csv = [headers,...rows].map(row => row.map(v => `"${String(v).replaceAll('"','""')}"`).join(";")).join("\n");
  downloadBlob("\ufeff" + csv, "text/csv;charset=utf-8", "what-you-wear-portfolio.csv");
}

function downloadLabel(p) {
  const copy = gradeCopy(p.grade);
  const grade = (x, y, title, score, color, fill) => `<circle cx="${x}" cy="${y}" r="24" fill="${fill}"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="20">◇</text><text x="${x + 38}" y="${y - 6}" font-size="10" font-weight="700">${title}</text><text x="${x + 38}" y="${y + 27}" font-family="Georgia" font-size="34" font-weight="700" fill="${color}">${gradeFor(score)}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="720" viewBox="0 0 420 720"><rect width="420" height="720" rx="18" fill="#fbfaf7"/><g fill="#111" font-family="Arial"><text x="210" y="54" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="6">WHAT YOU WEAR</text><path d="M152 127 210 92l58 35M210 92V76c0-13 18-9 18-24 0-9-7-14-17-14-9 0-16 6-16 15" fill="none" stroke="#111" stroke-width="2.2" stroke-linecap="round"/><line x1="35" y1="147" x2="385" y2="147" stroke="#555"/><text x="210" y="177" text-anchor="middle" font-size="14" font-weight="700" letter-spacing="3">TRANSPARENZ LABEL</text><path d="M35 195h178v93a85 85 0 0 1-85 85H35z" fill="#3f6a3f"/><text x="118" y="333" text-anchor="middle" font-family="Georgia" font-size="120" fill="#fff">${p.grade}</text><text x="245" y="260" font-size="32" font-weight="700" fill="#3f6a3f">${copy[0]}</text><text x="245" y="291" font-size="16">${copy[1]}</text><line x1="35" y1="392" x2="385" y2="392" stroke="#777"/><line x1="210" y1="392" x2="210" y2="570" stroke="#777"/><line x1="35" y1="481" x2="385" y2="481" stroke="#777"/>${grade(66, 435, "MATERIALIEN &amp; ROHSTOFFE", p.materialScore, "#477745", "#dce2ca")}${grade(241, 435, "PRODUKTION &amp; CO₂", p.productionScore, "#efb94e", "#ffd284")}${grade(66, 524, "SOZIALE STANDARDS", p.socialScore, "#477745", "#dce2ca")}${grade(241, 524, "TRANSPARENZ &amp; LIEFERKETTE", p.transparencyScore, "#efb94e", "#ffd284")}<rect x="25" y="590" width="370" height="105" rx="15" fill="#f2efec"/><text x="53" y="655" font-size="42">♢</text><line x1="105" y1="608" x2="105" y2="678" stroke="#aaa"/><text x="125" y="625" font-size="11">Scanne den QR-Code</text><text x="125" y="643" font-size="11">für alle Details zu</text><text x="125" y="661" font-size="11">diesem Produkt.</text><g transform="translate(310 608)"><rect width="70" height="70" fill="#fff"/><path d="M2 2h21v21H2zm45 0h21v21H47zM2 47h21v21H2zM8 8v9h9V8zm45 0v9h9V8zM8 53v9h9v-9zM29 2h6v6h-6zm10 0h6v14h-6zM27 13h8v8h-8zm11 10h10v7H38zM27 27h7v12h-7zm14 7h8v8h-8zm12-7h7v12h-7zm9 4h6v15h-6zM27 43h11v7H27zm14 3h7v14h-7zm12-3h7v8h-7zm9 10h6v15h-6zm-34 1h8v14h-8zm12 9h17v5H40z" fill="#111"/></g></g></svg>`;
  downloadBlob(svg, "image/svg+xml", `${slug(p.name)}-transparenzlabel.svg`);
}

function downloadLegacyLabel(p) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="650" viewBox="0 0 420 650"><rect width="420" height="650" rx="20" fill="#f7f4eb"/><text x="210" y="55" text-anchor="middle" font-family="Arial" font-size="12" letter-spacing="5" fill="#12231e">WHAT YOU WEAR</text><path d="M145 118 L210 80 L275 118 M210 80 V70 C210 55 232 58 232 40 C232 27 221 20 210 20 C198 20 190 27 188 37" fill="none" stroke="#12231e" stroke-width="2"/><line x1="45" y1="140" x2="375" y2="140" stroke="#12231e"/><text x="210" y="168" text-anchor="middle" font-family="Arial" font-weight="700" font-size="13" letter-spacing="3">TRANSPARENZ LABEL</text><rect x="50" y="200" width="140" height="140" fill="#245a49"/><text x="120" y="304" text-anchor="middle" font-family="Georgia" font-size="95" fill="white">${p.grade}</text><text x="220" y="250" font-family="Arial" font-weight="700" font-size="30" fill="#12231e">${p.score >= 76 ? "GUT" : "SOLIDE"}</text><text x="220" y="278" font-family="Arial" font-size="14" fill="#12231e">${p.score} / 100 Punkte</text><text x="220" y="305" font-family="Arial" font-size="12" fill="#58635e">${p.name}</text><line x1="45" y1="375" x2="375" y2="375" stroke="#bac0ba"/><g font-family="Arial" text-anchor="middle" fill="#12231e"><text x="80" y="420" font-size="11">MATERIAL</text><text x="80" y="460" font-family="Georgia" font-size="36">${gradeFor(p.materialScore)}</text><text x="170" y="420" font-size="11">PRODUKTION</text><text x="170" y="460" font-family="Georgia" font-size="36">${gradeFor(p.productionScore)}</text><text x="260" y="420" font-size="11">SOZIALES</text><text x="260" y="460" font-family="Georgia" font-size="36">${gradeFor(p.socialScore)}</text><text x="350" y="420" font-size="11">DATEN</text><text x="350" y="460" font-family="Georgia" font-size="36">${gradeFor(p.transparencyScore)}</text></g><line x1="45" y1="500" x2="375" y2="500" stroke="#bac0ba"/><rect x="50" y="530" width="70" height="70" fill="#12231e"/><path d="M57 537h20v20H57zM93 537h20v20H93zM57 573h20v20H57zM83 563h10v10H83zM103 573h10v20h-20v-10h10z" fill="white"/><text x="140" y="555" font-family="Arial" font-size="11">SCAN IT. KNOW IT.</text><text x="140" y="578" font-family="Arial" font-size="10" fill="#6c756f">${p.sku} · ${p.completeness}% Daten</text><text x="210" y="630" text-anchor="middle" font-family="Arial" font-size="9" fill="#6c756f">DEMO · KEINE AKKREDITIERTE ZERTIFIZIERUNG</text></svg>`;
  downloadBlob(svg, "image/svg+xml", `${slug(p.name)}-transparenzlabel.svg`);
}

function downloadReport(p) {
  const html = `<!doctype html><html lang="de"><meta charset="utf-8"><title>${p.name} · What You Wear Bericht</title><style>body{font-family:Arial,sans-serif;color:#173f35;max-width:850px;margin:50px auto;padding:30px}h1{font-family:Georgia,serif;font-size:54px;font-weight:400}.score{font-size:80px;font-family:Georgia,serif}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.card{border:1px solid #d9ddd6;padding:20px}small{color:#6c756f}.note{margin-top:40px;border-top:1px solid #ddd;padding-top:20px;font-size:11px;color:#666}</style><body><small>WHAT YOU WEAR · PRODUKTDATEN-BERICHT · ${new Date().toLocaleDateString("de-DE")}</small><h1>${p.name}</h1><p>${p.sku} · ${p.category} · Produktion: ${p.country}</p><div class="score">${p.grade} <small>${p.score}/100</small></div><div class="grid"><div class="card"><b>Materialien</b><h2>${p.materialScore}/100</h2><p>${p.material}</p><small>${p.certification}</small></div><div class="card"><b>Produktion</b><h2>${p.productionScore}/100</h2><p>${p.co2} kg CO₂e · ${p.renewable}% erneuerbare Energie</p></div><div class="card"><b>Soziale Standards</b><h2>${p.socialScore}/100</h2><p>${p.certificates.length} verknüpfte Nachweise</p></div><div class="card"><b>Transparenz</b><h2>${p.transparencyScore}/100</h2><p>${p.completeness}% Datenvollständigkeit</p></div></div><p class="note">Interaktiver Hochschulprojekt-Prototyp. Die Bewertung ist eine Demonstration auf Basis des Konzeptdokuments und keine akkreditierte Zertifizierung, Ökobilanz oder Rechtsberatung.</p></body></html>`;
  downloadBlob(html, "text/html", `${slug(p.name)}-produktbericht.html`);
}

function slug(value) { return value.toLowerCase().replace(/[^a-z0-9äöüß]+/g,"-").replace(/^-|-$/g,""); }

// Global interactions
$$('[data-action="open-dashboard"]').forEach(btn => btn.addEventListener("click", () => openDashboard("overview")));
$$('[data-action="go-home"]').forEach(btn => btn.addEventListener("click", e => { e.preventDefault(); goHome(); }));
$$('[data-action="consumer-home"]').forEach(btn => btn.addEventListener("click", e => { e.preventDefault(); goHome(); }));
$$('[data-action="close-modal"]').forEach(btn => btn.addEventListener("click", closeProductModal));
$("#productModal").addEventListener("click", e => { if (e.target === $("#productModal")) closeProductModal(); });
$("#newProductForm").addEventListener("submit", e => {
  e.preventDefault(); const data = new FormData(e.currentTarget); const id = Math.max(0,...state.products.map(p=>p.id))+1;
  const product = hydrateProduct({ id, name:data.get("name"), sku:data.get("sku"), category:data.get("category"), country:data.get("country"), status:"Entwurf", completeness:0, organic:0, recycled:0, sustainablePercent:0, certification:"Keine", renewable:0, co2:0, transport:"LKW", transportDistance:6500, wageStandard:"none", iloWorkingHours:false, certifiedSafety:false, noChildLabor:false, transparentFacilities:false, laborViolations:false, materialOriginsTraceable:false, digitalProductPassport:false, partialSupplierData:false, material:"Noch nicht erfasst", certificates:[], supply:[false,false,false,false,false] });
  state.products.unshift(product); state.selectedProductId=id; persist(); closeProductModal(); e.currentTarget.reset(); state.currentPage="materials"; renderDashboard(); toast(`${product.name} wurde angelegt.`);
});

$("#topAddProduct").addEventListener("click", showProductModal);
$("#menuButton").addEventListener("click", e => { const header=$(".site-header"); header.classList.toggle("menu-open"); e.currentTarget.setAttribute("aria-expanded", String(header.classList.contains("menu-open"))); });
$$('.desktop-nav a').forEach(a => a.addEventListener("click",()=>$(".site-header").classList.remove("menu-open")));
$("#scanDemoButton")?.addEventListener("click", () => openConsumer(state.products.find(product => product.id === 1) || state.products[0]));
$$('.score-row').forEach(row => row.addEventListener("click", () => { const key=row.dataset.score; $$('.score-row').forEach(r=>{const active=r===row;r.classList.toggle("active",active);r.querySelector("i").textContent=active?"−":"+"});$$('.score-detail').forEach(d=>d.classList.toggle("active",d.dataset.detail===key)); }));
$$('.dash-nav button').forEach(btn => btn.addEventListener("click", () => { state.currentPage=btn.dataset.page; history.replaceState(null,"",`#dashboard-${state.currentPage}`); renderDashboard(); $("#dashboardSidebar").classList.remove("open"); }));
$("#sidebarToggle").addEventListener("click",()=>$("#dashboardSidebar").classList.add("open"));
$("#sidebarClose").addEventListener("click",()=>$("#dashboardSidebar").classList.remove("open"));
$("#searchFocus").addEventListener("click",()=>{state.currentPage="products";renderDashboard();setTimeout(()=>$("#productSearch")?.focus(),30)});

document.addEventListener("keydown", e => { if(e.key === "Escape"){ closeProductModal(); $("#dashboardSidebar").classList.remove("open"); } });

const requestedProductSku = location.hash.match(/^#product-(.+)$/)?.[1];
const requestedProduct = requestedProductSku ? state.products.find(product => product.sku === decodeURIComponent(requestedProductSku)) : null;
const requestedPage = location.hash.match(/^#dashboard-(.+)$/)?.[1];
if (requestedProduct) openConsumer(requestedProduct);
else if (requestedPage && ["overview","products","materials","production","social","supply","analytics","reports"].includes(requestedPage)) openDashboard(requestedPage);
else updateGlobalMetrics();
