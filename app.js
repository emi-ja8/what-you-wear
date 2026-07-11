const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

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
    const saved = JSON.parse(localStorage.getItem("wyw-products-v1"));
    return Array.isArray(saved) && saved.length ? saved : structuredClone(defaultProducts);
  } catch (_) {
    return structuredClone(defaultProducts);
  }
}

function persist() {
  localStorage.setItem("wyw-products-v1", JSON.stringify(state.products));
  updateGlobalMetrics();
}

function selectedProduct() {
  return state.products.find(p => p.id === state.selectedProductId) || state.products[0];
}

function gradeFor(score) {
  if (score >= 88) return "A";
  if (score >= 76) return "B";
  if (score >= 62) return "C";
  if (score >= 48) return "D";
  return "E";
}

function recalculateProduct(product) {
  product.score = Math.round(product.materialScore * .30 + product.productionScore * .30 + product.socialScore * .25 + product.transparencyScore * .15);
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
  $("#dashboardView").hidden = false;
  document.body.style.overflow = "";
  state.currentPage = page;
  history.replaceState(null, "", `#dashboard-${page}`);
  window.scrollTo(0, 0);
  renderDashboard();
}

function goHome() {
  $("#dashboardView").hidden = true;
  $("#landingView").hidden = false;
  history.replaceState(null, "", "#top");
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
  const titles = { overview: "Übersicht", products: "Produkte", materials: "Materialien", production: "Produktion & CO₂", supply: "Lieferkette", analytics: "Analytics", reports: "Berichte & Labels" };
  $("#breadcrumbTitle").textContent = titles[state.currentPage];
  $$(".dash-nav button").forEach(btn => btn.classList.toggle("active", btn.dataset.page === state.currentPage));
  const renderers = { overview: renderOverview, products: renderProducts, materials: renderMaterials, production: renderProduction, supply: renderSupply, analytics: renderAnalytics, reports: renderReports };
  $("#dashboardContent").innerHTML = renderers[state.currentPage]();
  bindCurrentPage();
  updateGlobalMetrics();
}

function renderOverview() {
  const avg = Math.round(state.products.reduce((a, p) => a + p.score, 0) / state.products.length);
  const complete = Math.round(state.products.reduce((a, p) => a + p.completeness, 0) / state.products.length);
  const organic = Math.round(state.products.reduce((a, p) => a + p.organic, 0) / state.products.length);
  const latest = state.products.slice(0, 4);
  return `${dashboardPageHead("Dashboard", "Guten Morgen, Emilija", "Hier siehst du den aktuellen Stand eures Produktportfolios.", `<button class="button button-ghost" data-export="json">Daten exportieren</button><button class="button button-dark" data-open-modal>+ Produkt anlegen</button>`)}
    <div class="metric-grid">
      <article class="metric-card primary"><span>PORTFOLIO-SCORE</span><div class="metric-main"><strong>${gradeFor(avg)} · ${avg}</strong><div class="mini-donut"><span>${gradeFor(avg)}</span></div></div><small class="metric-change">↑ 3 Punkte seit letztem Monat</small></article>
      <article class="metric-card"><span>AKTIVE PRODUKTE</span><div class="metric-main"><strong>${state.products.length}</strong><small>Produkte</small></div><small class="metric-change">+ 2 im laufenden Semester</small></article>
      <article class="metric-card"><span>Ø BIO-ANTEIL</span><div class="metric-main"><strong>${organic} %</strong><small>im Portfolio</small></div><small>Gewichteter Demo-Mittelwert</small></article>
      <article class="metric-card"><span>DATENVOLLSTÄNDIGKEIT</span><div class="metric-main"><strong>${complete} %</strong><small>belegt</small></div><small class="metric-change">↑ 6 % durch neue Nachweise</small></article>
    </div>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-head"><h2>Scores nach Kategorie</h2><span>Portfolio-Durchschnitt</span></div><div class="category-bars">
        ${categoryBar("Materialien & Rohstoffe", 84, "A")}${categoryBar("Produktion & CO₂", 78, "B")}${categoryBar("Soziale Standards", 72, "C")}${categoryBar("Transparenz", complete, gradeFor(complete))}
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

function renderMaterials() {
  const p = selectedProduct();
  return `${dashboardPageHead("Produktdaten", "Materialien", "Materialmix, Herkunft und Zertifikate des gewählten Produkts.", `<label class="button button-ghost">Produkt: ${productSelector()}</label>`)}
    <div class="editor-layout">
      <section class="editor-card"><h2>Materialzusammensetzung</h2><p>Änderungen aktualisieren den Material- und Gesamtscore live.</p>
        <form id="materialForm" class="field-grid">
          <label class="full">Materialbeschreibung<input name="material" value="${p.material}" /></label>
          <label>Bio-Anteil in %<input type="number" min="0" max="100" name="organic" value="${p.organic}" /></label>
          <label>Recyclinganteil in %<input type="number" min="0" max="100" name="recycled" value="${p.recycled}" /></label>
          <label>Hauptzertifizierung<select name="certification">${["Keine","GOTS","OEKO-TEX","GRS","EU Ecolabel"].map(c => `<option ${c===p.certification?"selected":""}>${c}</option>`).join("")}</select></label>
          <label>Herkunft Rohfaser<select name="origin"><option>Türkei</option><option>Portugal</option><option>Indien</option><option>Deutschland</option></select></label>
          <div class="form-divider"></div><span class="form-section-title">Nachweise</span>
          <label class="upload-zone full"><input type="file" id="certificateUpload" accept=".pdf,.jpg,.jpeg,.png" /><span>⇧</span><b>Zertifikat hochladen</b><small>PDF, JPG oder PNG · max. 10 MB</small></label>
        </form>
        <div class="certificate-list" id="certificateList">${certificateList(p)}</div>
        <div class="save-bar"><button class="button button-ghost" data-reset-demo>Zurücksetzen</button><button class="button button-dark" id="saveMaterial">Änderungen speichern</button></div>
      </section>${scorePreview(p, "MATERIALSCORE", p.materialScore)}
    </div>`;
}

function certificateList(p) {
  return p.certificates.length ? p.certificates.map(c => `<div class="certificate-item"><span>▤</span><div><b>${c}</b><small>Verknüpft mit ${p.name}</small></div><i>✓ gültig</i></div>`).join("") : `<div class="empty-state"><b>Noch kein Nachweis</b>Lade ein Zertifikat hoch, um die Datenlage zu verbessern.</div>`;
}

function scorePreview(p, label, score) {
  return `<aside class="score-preview" id="scorePreview"><span>${label}</span><div class="score-circle" style="--score:${score}%"><strong id="previewGrade">${gradeFor(score)}</strong></div><div class="score-number"><span id="previewScore">${score}</span> / 100</div><small>Live-Demo auf Basis der Konzeptgewichtung</small><div class="score-breakdown"><div><span>Gesamtscore</span><b>${p.grade} · ${p.score}</b></div><div><span>Daten vollständig</span><b>${p.completeness} %</b></div><div><span>Status</span><b>${p.status}</b></div></div></aside>`;
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
        <label>Transportdistanz in km<input type="number" value="2160" /></label>
        <div class="form-divider"></div><span class="form-section-title">Berechnungsstatus</span>
        <div class="full recommendation"><span>i</span><div><b>Primärdaten für Energie vorhanden</b><small>CO₂e-Wert zuletzt am 08.07.2026 aktualisiert</small></div><i>✓</i></div>
      </form><div class="save-bar"><button class="button button-ghost" data-page-link="supply">Lieferweg prüfen</button><button class="button button-dark" id="saveProduction">Änderungen speichern</button></div>
    </section>${scorePreview(p, "PRODUKTIONSSCORE", p.productionScore)}</div>`;
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
    <div class="dashboard-grid"><section class="panel"><div class="panel-head"><h2>Datenvollständigkeit</h2><span>${p.completeness} %</span></div>${categoryBar("Lieferstufen", p.supply.filter(Boolean).length*20, `${p.supply.filter(Boolean).length}/5`)}${categoryBar("Nachweise", p.transparencyScore, gradeFor(p.transparencyScore))}</section><section class="panel"><div class="panel-head"><h2>Digitaler Produktpass</h2></div><div class="recommendation"><span>⌗</span><div><b>QR-Profil ist vorbereitet</b><small>${p.supply.filter(Boolean).length} von 5 Stufen verifiziert</small></div><i>→</i></div></section></div>`;
}

function renderAnalytics() {
  return `${dashboardPageHead("Portfolioanalyse", "Analytics", "Score-Entwicklung, Verteilung und priorisierte Handlungsfelder.", `<button class="button button-ghost" data-export="csv">Daten herunterladen</button><button class="button button-dark" data-page-link="reports">Bericht erstellen</button>`)}
    <div class="analytics-cards"><section class="panel"><div class="panel-head"><h2>Score-Entwicklung</h2><span>Jan–Jul 2026</span></div><div class="chart-wrap"><svg class="line-chart" viewBox="0 0 600 210" preserveAspectRatio="none"><path class="chart-gridline" d="M0 42H600M0 84H600M0 126H600M0 168H600"/><polyline points="0,160 100,145 200,132 300,112 400,118 500,84 600,69"/><circle cx="0" cy="160" r="4"/><circle cx="100" cy="145" r="4"/><circle cx="200" cy="132" r="4"/><circle cx="300" cy="112" r="4"/><circle cx="400" cy="118" r="4"/><circle cx="500" cy="84" r="4"/><circle cx="600" cy="69" r="4"/></svg></div><div class="chart-labels"><span>JAN</span><span>FEB</span><span>MÄR</span><span>APR</span><span>MAI</span><span>JUN</span><span>JUL</span></div></section>
      <section class="panel"><div class="panel-head"><h2>Score-Verteilung</h2><span>${state.products.length} Produkte</span></div><div class="donut-large"></div><div class="legend"><span><i></i>A · Sehr gut</span><span><i style="background:#7e9a61"></i>B · Gut</span><span><i style="background:#c6a653"></i>C · Solide</span><span><i style="background:#d4d8d2"></i>In Prüfung</span></div></section></div>
    <div class="dashboard-grid"><section class="panel"><div class="panel-head"><h2>CO₂e nach Produkt</h2><span>kg pro Stück</span></div><div class="bar-chart">${state.products.map((p,i)=>`<div class="bar-group"><i style="height:${Math.min(95,p.co2*6)}%"></i><i style="height:${Math.min(95,(p.co2*.78)*6)}%"></i><span>${p.name.split(" ")[0]}</span></div>`).join("")}</div></section><section class="panel"><div class="panel-head"><h2>Empfehlungen</h2><span>Priorisiert</span></div><div class="insight-card"><span>GRÖSSTER HEBEL</span><h3>Denim: Produktionsenergie belegen</h3><p>Primärdaten könnten Produktionsscore und Nachweisqualität verbessern.</p></div><div class="insight-card"><span>SCHNELL UMSETZBAR</span><h3>Zertifikat der Field Jacket erneuern</h3><p>Der aktuelle GRS-Nachweis läuft in 43 Tagen aus.</p></div></section></div>`;
}

function renderReports() {
  const p = selectedProduct();
  return `${dashboardPageHead("Output", "Berichte & Labels", "Erzeuge konsistente Ausgaben aus dem aktuellen Datenstand.", `<label class="button button-ghost">Produkt: ${productSelector()}</label><button class="button button-dark" data-download="report">+ Bericht erstellen</button>`)}
    <div class="reports-grid"><section class="editor-card"><h2>Verfügbare Exporte</h2><p>Demo-Downloads werden lokal aus den eingegebenen Daten erzeugt.</p><div class="report-list">
      <div class="report-row"><span>▤</span><div><b>Produktdaten-Bericht</b><small>HTML · aktueller Stand</small></div><button data-download="report">Erstellen</button></div>
      <div class="report-row"><span>⌗</span><div><b>Transparenzlabel</b><small>SVG · druckfähige Vektordatei</small></div><button data-download="label">Download</button></div>
      <div class="report-row"><span>{ }</span><div><b>Produktpass-Daten</b><small>JSON · maschinenlesbar</small></div><button data-download="product-json">Download</button></div>
      <div class="report-row"><span>▦</span><div><b>Portfolio-Übersicht</b><small>CSV · ${state.products.length} Produkte</small></div><button data-export="csv">Download</button></div>
    </div></section>
    <section class="editor-card"><h2>Label-Vorschau</h2><p>${p.name} · ${p.sku}</p><div class="label-preview"><small>WHAT YOU WEAR</small><div class="label-hanger"><svg viewBox="0 0 80 38"><path d="M4 34 40 12l36 22M40 12V7c0-6 10-5 10-12 0-5-4-8-10-8-5 0-9 3-10 7" fill="none" stroke="currentColor"/></svg></div><div class="label-title">TRANSPARENZ LABEL</div><div class="label-score-row"><div class="grade big">${p.grade}</div><div><b>${p.score >= 76 ? "GUT" : "SOLIDE"}</b><small>${p.score} von 100 Punkten</small></div></div><div class="label-categories"><span>MAT.<br /><b>${gradeFor(p.materialScore)}</b></span><span>PROD.<br /><b>${gradeFor(p.productionScore)}</b></span><span>SOZ.<br /><b>${gradeFor(p.socialScore)}</b></span><span>TRANS.<br /><b>${gradeFor(p.transparencyScore)}</b></span></div></div><div class="report-buttons"><button class="button button-ghost" data-download="label">SVG laden</button><button class="button button-dark" id="copyShareLink">Link kopieren</button></div></section></div>`;
}

function bindCurrentPage() {
  $$('[data-open-modal]').forEach(btn => btn.addEventListener("click", showProductModal));
  $$('[data-page-link]').forEach(btn => btn.addEventListener("click", () => { state.currentPage = btn.dataset.pageLink; history.replaceState(null,"",`#dashboard-${state.currentPage}`); renderDashboard(); }));
  $$('[data-edit-product]').forEach(btn => btn.addEventListener("click", () => { state.selectedProductId = Number(btn.dataset.editProduct); state.currentPage = "materials"; renderDashboard(); }));
  $$('[data-export]').forEach(btn => btn.addEventListener("click", () => btn.dataset.export === "csv" ? downloadCSV() : downloadJSON(state.products, "what-you-wear-portfolio.json")));
  $$('[data-download]').forEach(btn => btn.addEventListener("click", () => handleDownload(btn.dataset.download)));

  const search = $("#productSearch");
  if (search) search.addEventListener("input", e => { state.productSearch = e.target.value; renderProductsInPlace(); });
  $("#categoryFilter")?.addEventListener("change", e => { state.categoryFilter = e.target.value; renderDashboard(); });
  $("#statusFilter")?.addEventListener("change", e => { state.statusFilter = e.target.value; renderDashboard(); });
  $("#editorProductSelect")?.addEventListener("change", e => { state.selectedProductId = Number(e.target.value); renderDashboard(); });

  bindMaterialPage();
  bindProductionPage();
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
    const organic = Number(data.get("organic")) || 0;
    const recycled = Number(data.get("recycled")) || 0;
    const cert = data.get("certification") !== "Keine" ? 20 : 0;
    const score = Math.min(100, Math.round(organic * .62 + recycled * .18 + cert));
    $("#previewScore").textContent = score;
    $("#previewGrade").textContent = gradeFor(score);
    $("#scorePreview .score-circle").style.setProperty("--score", `${score}%`);
    form.dataset.liveScore = score;
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
    p.material = data.get("material"); p.organic = Number(data.get("organic")); p.recycled = Number(data.get("recycled")); p.certification = data.get("certification"); p.materialScore = Number(form.dataset.liveScore || p.materialScore); recalculateProduct(p); persist(); renderDashboard(); toast("Materialdaten und Score wurden gespeichert.");
  });
  $("[data-reset-demo]")?.addEventListener("click", () => { const original = defaultProducts.find(x => x.id === selectedProduct().id); if (original) Object.assign(selectedProduct(), structuredClone(original)); persist(); renderDashboard(); toast("Demo-Werte wurden zurückgesetzt."); });
}

function bindProductionPage() {
  const form = $("#productionForm"); if (!form) return;
  const update = () => {
    const data = new FormData(form); const renewable = Number(data.get("renewable")) || 0; const co2 = Number(data.get("co2")) || 0; const transport = { Bahn: 100, Schiff: 84, LKW: 58, Luftfracht: 12 }[data.get("transport")] || 50;
    const score = Math.max(0, Math.min(100, Math.round(renewable * .42 + Math.max(0, 100 - co2 * 6) * .38 + transport * .20)));
    $("#previewScore").textContent = score; $("#previewGrade").textContent = gradeFor(score); $("#scorePreview .score-circle").style.setProperty("--score", `${score}%`); form.dataset.liveScore = score;
  };
  form.addEventListener("input", update);
  $("#saveProduction")?.addEventListener("click", () => { const p=selectedProduct(), data=new FormData(form); p.country=data.get("country");p.renewable=Number(data.get("renewable"));p.co2=Number(data.get("co2"));p.transport=data.get("transport");p.productionScore=Number(form.dataset.liveScore||p.productionScore);recalculateProduct(p);persist();renderDashboard();toast("Produktionsdaten und Score wurden gespeichert."); });
}

function bindSupplyPage() {
  $$('[data-stage]').forEach(btn => btn.addEventListener("click", () => {
    const p = selectedProduct(), index = Number(btn.dataset.stage); p.supply[index] = !p.supply[index];
    const verified = p.supply.filter(Boolean).length; p.transparencyScore = Math.min(100, verified * 18 + (p.certificates.length ? 8 : 0)); p.completeness = Math.min(100, Math.round((p.materialScore + p.productionScore + p.transparencyScore) / 3)); recalculateProduct(p); persist(); renderDashboard(); toast(p.supply[index] ? "Lieferstufe verifiziert." : "Verifizierung entfernt.");
  }));
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
$$('[data-action="close-modal"]').forEach(btn => btn.addEventListener("click", closeProductModal));
$("#productModal").addEventListener("click", e => { if (e.target === $("#productModal")) closeProductModal(); });
$("#newProductForm").addEventListener("submit", e => {
  e.preventDefault(); const data = new FormData(e.currentTarget); const id = Math.max(0,...state.products.map(p=>p.id))+1;
  const product = { id, name:data.get("name"), sku:data.get("sku"), category:data.get("category"), country:data.get("country"), score:50, grade:"D", status:"Entwurf", completeness:24, organic:0, recycled:0, certification:"Keine", renewable:0, co2:0, transport:"LKW", materialScore:40, productionScore:40, socialScore:60, transparencyScore:24, material:"Noch nicht erfasst", certificates:[], supply:[false,false,false,false,false] };
  recalculateProduct(product); state.products.unshift(product); state.selectedProductId=id; persist(); closeProductModal(); e.currentTarget.reset(); state.currentPage="materials"; renderDashboard(); toast(`${product.name} wurde angelegt.`);
});

$("#topAddProduct").addEventListener("click", showProductModal);
$("#menuButton").addEventListener("click", e => { const header=$(".site-header"); header.classList.toggle("menu-open"); e.currentTarget.setAttribute("aria-expanded", String(header.classList.contains("menu-open"))); });
$$('.desktop-nav a').forEach(a => a.addEventListener("click",()=>$(".site-header").classList.remove("menu-open")));
$("#scanDemoButton")?.addEventListener("click", () => { $("#phoneShell").classList.add("scanned"); toast("Scan erfolgreich: Hoodie Classic · Score B · 82/100"); setTimeout(()=>$("#phoneShell").classList.remove("scanned"),2200); });
$$('.score-row').forEach(row => row.addEventListener("click", () => { const key=row.dataset.score; $$('.score-row').forEach(r=>{const active=r===row;r.classList.toggle("active",active);r.querySelector("i").textContent=active?"−":"+"});$$('.score-detail').forEach(d=>d.classList.toggle("active",d.dataset.detail===key)); }));
$$('.dash-nav button').forEach(btn => btn.addEventListener("click", () => { state.currentPage=btn.dataset.page; history.replaceState(null,"",`#dashboard-${state.currentPage}`); renderDashboard(); $("#dashboardSidebar").classList.remove("open"); }));
$("#sidebarToggle").addEventListener("click",()=>$("#dashboardSidebar").classList.add("open"));
$("#sidebarClose").addEventListener("click",()=>$("#dashboardSidebar").classList.remove("open"));
$("#searchFocus").addEventListener("click",()=>{state.currentPage="products";renderDashboard();setTimeout(()=>$("#productSearch")?.focus(),30)});

document.addEventListener("keydown", e => { if(e.key === "Escape"){ closeProductModal(); $("#dashboardSidebar").classList.remove("open"); } });

const requestedPage = location.hash.match(/^#dashboard-(.+)$/)?.[1];
if (requestedPage && ["overview","products","materials","production","supply","analytics","reports"].includes(requestedPage)) openDashboard(requestedPage);
else updateGlobalMetrics();
