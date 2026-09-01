// ============================================================
// DASHBOARD.JS
// ============================================================

// Fausses données historiques pour le graphique évolution
const evolutionData = [
  { label: 'Fév', value: 4  },
  { label: 'Mar', value: 5  },
  { label: 'Avr', value: 6  },
  { label: 'Mai', value: 7  },
  { label: 'Jun', value: 9  },
  { label: 'Jul', value: 11 },
];

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
  const total      = products.length;
  const incomplets = products.filter(p => calcCompletion(p) < seuilCompletion).length;

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
  const navEl = document.querySelector('.nav-item[onclick*="products"]');
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

  const total = products.length;
  const counts = {};
  categories.forEach(c => { counts[c.name] = 0; });
  products.forEach(p => { if (counts[p.cat] !== undefined) counts[p.cat]++; });

  const data = categories
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

  const data   = evolutionData;
  const W      = container.clientWidth  || 340;
  const H      = 110;
  const padL   = 10;
  const padR   = 10;
  const padT   = 16;
  const padB   = 24;
  const maxVal = Math.max(...data.map(d => d.value));
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
  const total = products.length;
  if (!total) return;
  const globalComp = Math.round(
    products.reduce((sum, p) => sum + calcCompletion(p), 0) / total
  );
  const globalColor = getCompletionColor(globalComp);

  const elPct = document.getElementById('kpi-completion-global');
  const elBar = document.getElementById('bar-global');
  if (elPct) { elPct.textContent = globalComp + '%'; elPct.style.color = globalColor; }
  if (elBar) { elBar.style.width = globalComp + '%'; elBar.style.background = globalColor; }

  // Detail par categorie
  const container = document.getElementById('dashboard-completion-cats');
  if (!container) return;

  const rows = categories.map(cat => {
    const catProds = products.filter(p => p.cat === cat.name);
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

  const counts = {};
  products.forEach(p => {
    const code = p.fields.fournisseur_code || 'Inconnu';
    const sup  = suppliers.find(s => s.code === code);
    const name = sup ? sup.name : code;
    counts[name] = (counts[name] || 0) + 1;
  });

  const data = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  if (!data.length) {
    container.innerHTML =
      '<div style="font-size:13px;color:#a0b0c0;padding:16px">Aucune donnee fournisseur.</div>';
    return;
  }

  const W      = container.clientWidth || 500;
  const H      = data.length * 36 + 20;
  const padL   = 140;
  const padR   = 50;
  const padT   = 10;
  const barH   = 20;
  const gap    = 36;
  const maxVal = Math.max(...data.map(d => d.count));
  const chartW = W - padL - padR;
  const COLORS = ['#4fc3f7','#81c784','#ffb74d','#e57373','#ba68c8','#4db6ac','#f06292'];

  let bars = '';
  data.forEach((d, i) => {
    const y    = padT + i * gap;
    const bw   = Math.round((d.count / maxVal) * chartW);
    const fill = COLORS[i % COLORS.length];
    const sup  = suppliers.find(s => s.name === d.name);
    const code = sup ? sup.code : '';

    bars += `
      <g style="cursor:pointer" onclick="filterBySupplier('${code || d.name}')"
        title="Voir les produits ${d.name}">
        <text x="${padL - 8}" y="${y + barH / 2 + 4}"
          text-anchor="end" font-size="12" fill="#607080"
          font-family="Inter,sans-serif">${d.name}</text>
        <rect x="${padL}" y="${y}" width="${bw}" height="${barH}"
          rx="4" fill="${fill}" opacity="0.85"/>
        <rect x="${padL}" y="${y}" width="${bw}" height="${barH}"
          rx="4" fill="transparent" class="bar-hover"/>
        <text x="${padL + bw + 6}" y="${y + barH / 2 + 4}"
          font-size="12" font-weight="700" fill="#1a2332"
          font-family="Inter,sans-serif">${d.count}</text>
      </g>`;
  });

  container.innerHTML = `
    <svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}"
      xmlns="http://www.w3.org/2000/svg">
      <style>
        .bar-hover:hover { fill: rgba(0,0,0,0.06); }
      </style>
      ${bars}
    </svg>`;
}

function filterBySupplier(codeOrName) {
  const navEl = document.querySelector('.nav-item[onclick*="products"]');
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
