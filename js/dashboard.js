// ============================================================
// DASHBOARD.JS
// ============================================================

function buildEvolutionData() {
  const current = getAccessibleProducts().length;
  const ratios  = [4 / 11, 5 / 11, 6 / 11, 7 / 11, 9 / 11, 1];
  const now     = new Date();
  const data    = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    let label = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
    label = label.charAt(0).toUpperCase() + label.slice(1);
    const isLast = i === 0;
    const value  = isLast ? current : Math.max(0, Math.round(ratios[5 - i] * current));
    data.push({ label, value });
  }
  return data;
}

// ============================================================
// POINT D'ENTREE
// ============================================================
function renderDashboard() {
  updateTopbarTitle('Dashboard');
  renderDashboardKpis();
  renderDashboardDonut();
  renderDashboardEvolution();
  renderDashboardCompletion();
  renderDashboardSuppliers();
}

// ============================================================
// TOPBAR TITLE
// ============================================================
function updateTopbarTitle(title) {
  const el = document.getElementById('topbar-title');
  if (el) el.textContent = title;
}

// ============================================================
// SECTION 1 — ANALYSE DES PRODUITS
// KPI Total + Donut + Evolution
// ============================================================
function renderDashboardKpis() {
  const catalog    = getAccessibleProducts();
  const total      = catalog.length;
  const incomplets = catalog.filter(p => calcCompletion(p) < seuilCompletion).length;

  const elTotal = document.getElementById('kpi-total');
  if (elTotal) elTotal.textContent = total;

  const elIncomplets = document.getElementById('kpi-incomplets');
  if (elIncomplets) elIncomplets.textContent = incomplets;

  const elSeuil = document.getElementById('seuil-label');
  if (elSeuil) elSeuil.textContent = seuilCompletion + '%';

  const elObjectif = document.getElementById('objectif-label');
  if (elObjectif) elObjectif.textContent = seuilCompletion + '%';
}

function showIncomplets() {
  _filterIncomplets = true;
  currentPage = 1;
  const navEl = document.querySelector('.nav-item[data-nav="products"]');
  showPage('products', navEl);
  renderProductsTable();
}

function openSeuilModal() {
  const el = document.getElementById('seuil-input');
  if (el) el.value = seuilCompletion;
  openModal('modal-seuil');
}

function saveSeuil() {
  const val = parseInt(document.getElementById('seuil-input').value);
  if (!isNaN(val) && val >= 0 && val <= 100) {
    seuilCompletion = val;
    closeModal('modal-seuil');
    renderDashboard();
    renderProductsTable();
    showNotif('Seuil mis a jour : ' + val + '%');
  }
}

// ============================================================
// DONUT — REPARTITION PAR CATEGORIE
// ============================================================
function renderDashboardDonut() {
  const svg    = document.getElementById('donut-svg');
  const legend = document.getElementById('donut-legend');
  if (!svg || !legend) return;

  const catalog = getAccessibleProducts();
  const visibleCats = getReadableCategories();
  const total = catalog.length;
  const counts = {};
  visibleCats.forEach(c => { counts[c.name] = 0; });
  catalog.forEach(p => { if (counts[p.cat] !== undefined) counts[p.cat]++; });

  const data = visibleCats
    .map(c => ({ name: c.name, count: counts[c.name] || 0, color: c.color }))
    .filter(d => d.count > 0);

  const cx = 80, cy = 80, r = 60, inner = 38;
  let startAngle = -Math.PI / 2;
  let paths = '';

  data.forEach(d => {
    const angle = (d.count / total) * 2 * Math.PI;
    const end   = startAngle + angle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const ix1 = cx + inner * Math.cos(startAngle);
    const iy1 = cy + inner * Math.sin(startAngle);
    const ix2 = cx + inner * Math.cos(end);
    const iy2 = cy + inner * Math.sin(end);
    const large = angle > Math.PI ? 1 : 0;
    paths += `<path d="M${ix1},${iy1} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2}
      L${ix2},${iy2} A${inner},${inner} 0 ${large},0 ${ix1},${iy1} Z"
      fill="${d.color}" opacity="0.9"/>`;
    startAngle = end;
  });

  svg.innerHTML = `
    ${paths}
    <circle cx="${cx}" cy="${cy}" r="${inner - 2}" fill="#fff"/>
    <text x="${cx}" y="${cy + 5}" text-anchor="middle"
      font-size="18" font-weight="800" fill="#1a2332">${total}</text>`;

  legend.innerHTML = data.map(d =>
    `<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#1a2332">
      <span style="width:10px;height:10px;border-radius:50%;background:${d.color};
        flex-shrink:0;display:inline-block"></span>
      <span>${d.name} — ${d.count}</span>
    </div>`
  ).join('');
}

// ============================================================
// EVOLUTION RECENTE — GRAPHIQUE BARRES SVG
// ============================================================
function renderDashboardEvolution() {
  const container = document.getElementById('dashboard-evolution-chart');
  if (!container) return;

  const data   = buildEvolutionData();
  const W      = container.clientWidth  || 340;
  const H      = 110;
  const padL   = 10;
  const padR   = 10;
  const padT   = 16;
  const padB   = 24;
  const maxVal = Math.max(1, ...data.map(d => d.value));
  const barW   = Math.floor((W - padL - padR) / data.length * 0.55);
  const gap    = Math.floor((W - padL - padR) / data.length);
  const chartH = H - padT - padB;

  let bars = '';
  data.forEach((d, i) => {
    const x   = padL + i * gap + (gap - barW) / 2;
    const bh  = Math.round((d.value / maxVal) * chartH);
    const y   = padT + chartH - bh;
    const isLast = i === data.length - 1;
    const fill   = isLast ? '#4caf50' : '#90caf9';

    bars += `
      <rect x="${x}" y="${y}" width="${barW}" height="${bh}"
        rx="3" fill="${fill}"/>
      <text x="${x + barW / 2}" y="${y - 4}"
        text-anchor="middle" font-size="10" font-weight="700"
        fill="${isLast ? '#2e7d32' : '#607080'}">${d.value}</text>
      <text x="${x + barW / 2}" y="${H - 4}"
        text-anchor="middle" font-size="10" fill="#a0b0c0">${d.label}</text>`;
  });

  container.innerHTML =
    `<svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none">${bars}</svg>`;
}

// ============================================================
// SECTION 2 — QUALITE DES PRODUITS
// Taux de completion global + detail par categorie
// ============================================================
function renderDashboardCompletion() {
  // Taux global
  const catalog = getAccessibleProducts();
  const total = catalog.length;
  if (!total) {
    const elPct = document.getElementById('kpi-completion-global');
    const elBar = document.getElementById('bar-global');
    if (elPct) { elPct.textContent = '—'; }
    if (elBar) { elBar.style.width = '0%'; }
    const container = document.getElementById('dashboard-completion-cats');
    if (container) container.innerHTML = '';
    return;
  }
  const globalComp = Math.round(
    catalog.reduce((sum, p) => sum + calcCompletion(p), 0) / total
  );
  const globalColor = getCompletionColor(globalComp);

  const elPct = document.getElementById('kpi-completion-global');
  const elBar = document.getElementById('bar-global');
  if (elPct) { elPct.textContent = globalComp + '%'; elPct.style.color = globalColor; }
  if (elBar) { elBar.style.width = globalComp + '%'; elBar.style.background = globalColor; }

  // Detail par categorie
  const container = document.getElementById('dashboard-completion-cats');
  if (!container) return;

  const rows = getReadableCategories().map(cat => {
    const catProds = catalog.filter(p => p.cat === cat.name);
    if (!catProds.length) return null;
    const avg   = Math.round(catProds.reduce((s, p) => s + calcCompletion(p), 0) / catProds.length);
    const color = getCompletionColor(avg);
    return { name: cat.name, color: cat.color, avg };
  }).filter(Boolean);

  container.innerHTML = rows.map(r => `
    <div class="completion-cat-row">
      <div class="cat-name" style="min-width:120px">
        <span style="width:10px;height:10px;border-radius:50%;background:${r.color};
          flex-shrink:0;display:inline-block"></span>
        <span style="font-size:13px;font-weight:600;color:#1a2332">${r.name}</span>
      </div>
      <div class="completion-bar-bg" style="flex:1;height:10px;background:#f0f4f8;
        border-radius:5px;overflow:hidden">
        <div class="completion-bar-fill"
          style="width:${r.avg}%;height:100%;background:${getCompletionColor(r.avg)};
          border-radius:5px;transition:width 0.4s ease"></div>
      </div>
      <span style="font-size:13px;font-weight:700;color:#1a2332;
        min-width:40px;text-align:right">${r.avg}%</span>
    </div>`
  ).join('');
}

// ============================================================
// SECTION 3 — VUE FOURNISSEUR
// ============================================================
function renderDashboardSuppliers() {
  const container = document.getElementById('supplier-chart-container');
  if (!container) return;

  const catalog = getAccessibleProducts();
  const totalProds = catalog.length;
  const data = {};
  const ensureRow = (name, code) => {
    if (!data[name]) data[name] = { code, cats: {}, marques: {} };
    return data[name];
  };

  brandSettings.forEach(b => {
    if (b.type && !canCat(b.type, 'r')) return;
    const sup = suppliers.find(s => s.code === b.fournisseurCode);
    const name = sup ? sup.name : (b.fournisseurCode || 'Inconnu');
    const row = ensureRow(name, b.fournisseurCode);
    if (b.marque) {
      if (!row.marques[b.marque]) row.marques[b.marque] = { combos: 0, products: 0 };
      row.marques[b.marque].combos++;
    }
  });

  catalog.forEach(p => {
    const code = p.fields.fournisseur_code || '';
    const sup  = code ? suppliers.find(s => s.code === code) : null;
    const name = code ? (sup ? sup.name : code) : 'Inconnu';
    const row  = ensureRow(name, code || 'Inconnu');
    row.cats[p.cat] = (row.cats[p.cat] || 0) + 1;
    if (p.fields.marque) {
      if (!row.marques[p.fields.marque]) row.marques[p.fields.marque] = { combos: 0, products: 0 };
      row.marques[p.fields.marque].products++;
    }
  });

  const supNames = Object.keys(data).sort((a, b) => {
    const ta = Object.values(data[a].cats).reduce((s, v) => s + v, 0);
    const tb = Object.values(data[b].cats).reduce((s, v) => s + v, 0);
    return tb - ta;
  });

  if (!supNames.length) {
    container.innerHTML =
      '<div style="font-size:13px;color:#a0b0c0;padding:16px">Aucune donnee fournisseur.</div>';
    return;
  }

  const catNames = getReadableCategories().map(c => c.name);
  const catColors = {};
  categories.forEach(c => { catColors[c.name] = c.color; });

  const W      = container.clientWidth || 500;
  const H      = supNames.length * 36 + 60;
  const padL   = 140;
  const padR   = 90;
  const padT   = 10;
  const barH   = 20;
  const gap    = 36;
  const maxVal = Math.max(1, ...supNames.map(n =>
    Object.values(data[n].cats).reduce((s, v) => s + v, 0)
  ));
  const chartW = W - padL - padR;

  let legendHtml = '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:8px">';
  catNames.forEach(cat => {
    if (catalog.some(p => p.cat === cat)) {
      legendHtml += `<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#607080">
        <span style="width:10px;height:10px;border-radius:2px;background:${catColors[cat]};
          display:inline-block;flex-shrink:0"></span>${cat}
      </div>`;
    }
  });
  legendHtml += `<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#1565c0">
    <span style="font-weight:700">%</span> part du catalogue
  </div></div>`;

  let bars = '';
  supNames.forEach((name, i) => {
    const y     = padT + i * gap;
    const total = Object.values(data[name].cats).reduce((s, v) => s + v, 0);
    let x = padL;
    const code = data[name].code;
    const pct = totalProds ? Math.round((total / totalProds) * 100) : 0;
    const marqueLines = Object.keys(data[name].marques).sort().map(m => {
      const row = data[name].marques[m];
      const bits = [];
      if (row.products) bits.push(row.products + ' produit' + (row.products > 1 ? 's' : ''));
      if (row.combos) bits.push(row.combos + ' condition' + (row.combos > 1 ? 's' : ''));
      return `${m}${bits.length ? ' : ' + bits.join(', ') : ''}`;
    }).join('&#10;');
    const title = `${name} — ${total}/${totalProds} produit${total > 1 ? 's' : ''} (${pct}%)&#10;${marqueLines || 'Aucune combinaison marque/fournisseur'}`;

    bars += `<text x="${padL - 8}" y="${y + barH / 2 + 4}"
      text-anchor="end" font-size="12" fill="#607080"
      font-family="Inter,sans-serif">${name}</text>`;

    catNames.forEach(cat => {
      const count = data[name].cats[cat] || 0;
      if (!count) return;
      const bw = Math.max(2, Math.round((count / maxVal) * chartW));
      bars += `<rect x="${x}" y="${y}" width="${bw}" height="${barH}"
        rx="0" fill="${catColors[cat]}" opacity="0.85"
        style="cursor:pointer"
        onclick="filterBySupplier('${code}')">
        <title>${title}</title>
      </rect>`;
      x += Math.max(bw, 2);
    });

    if (!total) {
      bars += `<rect x="${padL}" y="${y}" width="4" height="${barH}"
        rx="0" fill="#e0e8f0" opacity="0.9">
        <title>${title}</title>
      </rect>`;
    }

    bars += `<text x="${x + 5}" y="${y + barH / 2 + 4}"
      font-size="12" font-weight="700" fill="#1a2332"
      font-family="Inter,sans-serif">${total}</text>
      <text x="${W - 8}" y="${y + barH / 2 + 4}"
        text-anchor="end" font-size="11" font-weight="700" fill="#1565c0"
        font-family="Inter,sans-serif">${pct}%</text>`;
  });

  container.innerHTML = legendHtml + `
    <svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}"
      xmlns="http://www.w3.org/2000/svg">
      ${bars}
    </svg>`;
}

function filterBySupplier(codeOrName) {
  const navEl = document.querySelector('.nav-item[data-nav="products"]');
  showPage('products', navEl);
  const filterCat = document.getElementById('filter-cat');
  if (filterCat) filterCat.value = '';
  colFilters = {};
  _filterIncomplets = false;
  currentPage = 1;
  const search = document.getElementById('products-search');
  if (search) search.value = codeOrName;
  renderProductsTable();
  showNotif('Filtre fournisseur : ' + codeOrName);
}

// ============================================================
// SNAPSHOT EXPORT (appelé avant navigation vers exports)
// ============================================================
function captureExportSnapshot() {
  exportSnapshot = {
    catFilter:    (document.getElementById('filter-cat')      || {}).value || '',
    searchVal:    (document.getElementById('products-search') || {}).value || '',
    colFilters:   { ...colFilters },
    syntheseItems: [...syntheseItems],
  };
}
