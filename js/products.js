// ============================================================
// PRODUCTS.JS — Liste produits + Fiche détail
// ============================================================

// ============================================================
// ETAT UI PRODUITS
// ============================================================
let sortState = {};

// ============================================================
// FILTRE COLONNE (style Excel)
// ============================================================
function getListColValue(p, code) {
  if (!p) return '';
  if (code === 'cat') return String(p.cat || '').trim();
  if (code === 'completion') return String(calcCompletion(p));
  if (code === 'createdAt' || code === 'created_at') return String(p.createdAt || '').trim();
  if (code === 'maj' || code === 'updated_at') return String(p.maj || '').trim();
  const attr = attributes.find(a => a.code === code);
  if (attr && isPercentAttr(attr)) {
    const raw = p.fields && p.fields[code];
    const d = formatPercentDisplay(raw);
    return d === '' ? '' : d + '%';
  }
  const v = p.fields && p.fields[code] !== undefined ? p.fields[code] : p[code];
  return v == null ? '' : String(v).trim();
}

const PRODUCT_SEARCH_FIELDS = ['sap', 'ean', 'nom', 'designation_magasin', 'marque'];

function productMatchesSearch(p, raw) {
  const q = String(raw || '').trim().toLowerCase();
  if (q.length < 2) return true;
  return PRODUCT_SEARCH_FIELDS.some(code => getListColValue(p, code).toLowerCase().includes(q));
}

const DATE_LIST_CODES = ['createdAt', 'created_at', 'maj', 'updated_at'];

function colFilterMode(code) {
  if (code === 'fournisseur_code' || code === 'marque') return 'suggest';
  if (code === 'cat') return 'list';
  if (code === 'completion') return 'number';
  if (DATE_LIST_CODES.includes(code)) return 'date';
  const attr = (attributes || []).find(a => a.code === code);
  if (!attr) return 'contains';
  if (attr.type === 'Nombre' || attr.type === 'Nombre decimal') return 'number';
  if (attr.type === 'Date') return 'date';
  if (attr.type === 'Simple select' || attr.type === 'Multi select' || attr.type === 'Oui / Non') {
    if (listOptions(code).length) return 'list';
  }
  return 'contains';
}

function listOptions(code) {
  if (code === 'cat') return getReadableCategories().map(c => c.name).sort((a, b) => a.localeCompare(b, 'fr'));
  const attr = (attributes || []).find(a => a.code === code);
  if (!attr) return [];
  if (attr.type === 'Oui / Non') return (attr.options && attr.options.length) ? attr.options.slice() : ['Oui', 'Non'];
  return (attr.options || []).slice();
}

function suggestSource(code) {
  if (code === 'fournisseur_code') return supplierList().map(s => s.name).filter(Boolean);
  if (code === 'marque') return getMarqueOptions();
  return [];
}

function displayedColValue(p, code) {
  const raw = getListColValue(p, code);
  if (code !== 'fournisseur_code') return raw;
  const s = supplierList().find(x => x.code === raw || x.name === raw);
  return s ? s.name : raw;
}

function valueMatchesColFilter(code, value, filter) {
  if (filter == null) return true;
  const text = value == null ? '' : String(value);
  const asSet = filter instanceof Set ? filter : (Array.isArray(filter) ? new Set(filter) : null);
  if (asSet) return asSet.has(text.trim());
  if (filter.kind === 'list') {
    const set = filter.values instanceof Set ? filter.values : new Set(filter.values || []);
    const attr = (attributes || []).find(a => a.code === code);
    if (attr && attr.type === 'Multi select') return [...set].some(opt => text.includes(opt));
    return set.has(text.trim());
  }
  if (filter.kind === 'contains') {
    const q = String(filter.q || '').trim().toLowerCase();
    if (!q) return true;
    return text.toLowerCase().includes(q);
  }
  if (filter.kind === 'suggest') {
    const q = String(filter.q || '').trim().toLowerCase();
    if (!q) return true;
    return text.trim().toLowerCase() === q;
  }
  if (filter.kind === 'range') return valueInRange(text, filter);
  return true;
}

// ============================================================
// FILTRE PAR COMPARAISON (nombres et dates)
// Une valeur vide ne passe jamais un filtre de comparaison.
// ============================================================
const RANGE_OPS = [
  { op: '=',  label: 'Égal à' },
  { op: '>',  label: 'Supérieur à' },
  { op: '>=', label: 'Supérieur ou égal à' },
  { op: '<',  label: 'Inférieur à' },
  { op: '<=', label: 'Inférieur ou égal à' },
  { op: 'between', label: 'Entre' },
];

// Nombre : « 25 », « 25,5 » ou « 25% ». Date : jj/mm/aaaa (heure ignoree)
// ou aaaa-mm-jj (champ date du navigateur) -> nombre aaaammjj.
function rangeKey(raw, type) {
  const t = String(raw == null ? '' : raw).trim();
  if (!t) return null;
  if (type === 'date') {
    let m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (m) return Number(m[3] + m[2] + m[1]);
    m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return Number(m[1] + m[2] + m[3]);
    return null;
  }
  const n = parseFloat(t.replace('%', '').replace(/\s/g, '').replace(',', '.'));
  return isFinite(n) ? n : null;
}

function valueInRange(text, f) {
  const v = rangeKey(text, f.type);
  const a = rangeKey(f.a, f.type);
  if (a === null) return true;
  if (v === null) return false;
  switch (f.op) {
    case '=':  return v === a;
    case '>':  return v > a;
    case '>=': return v >= a;
    case '<':  return v < a;
    case '<=': return v <= a;
    case 'between': {
      const b = rangeKey(f.b, f.type);
      if (b === null) return v >= a;
      return v >= Math.min(a, b) && v <= Math.max(a, b);
    }
    default: return true;
  }
}

function openRangeFilter(code, label, iconEl, type) {
  closeColFilter();
  const cur = colFilters[code] && colFilters[code].kind === 'range' ? colFilters[code] : { op: '>=', a: '', b: '' };
  const inputType = type === 'date' ? 'date' : 'number';
  const attr = (attributes || []).find(a => a.code === code);
  const unit = code === 'completion' || (attr && isPercentAttr(attr)) ? ' (en %)' : '';
  const dd = placeColFilter(iconEl);
  dd.innerHTML = `
    <div class="col-filter-dropdown-header">
      <span>${escapeHtml(label)}</span>
      <button onclick="clearColFilter('${code}')">Effacer</button>
    </div>
    <div class="col-filter-range">
      <select id="cfr-op" data-combo="off" onchange="setColRange('${code}','${type}')">
        ${RANGE_OPS.map(o => `<option value="${o.op}"${o.op === cur.op ? ' selected' : ''}>${o.label}</option>`).join('')}
      </select>
      <input id="cfr-a" type="${inputType}" step="any" value="${escapeHtml(cur.a || '')}"
        placeholder="Valeur${unit}" oninput="setColRange('${code}','${type}')">
      <input id="cfr-b" type="${inputType}" step="any" value="${escapeHtml(cur.b || '')}"
        placeholder="et${unit}" oninput="setColRange('${code}','${type}')"
        style="${cur.op === 'between' ? '' : 'display:none'}">
    </div>`;
  document.body.appendChild(dd);
  activeColFilterDropdown = dd;
  setTimeout(() => {
    const el = dd.querySelector('#cfr-a');
    if (el) el.focus();
    document.addEventListener('click', colFilterOutsideClick);
  }, 0);
}

function setColRange(code, type) {
  const dd = activeColFilterDropdown;
  if (!dd) return;
  const op = dd.querySelector('#cfr-op').value;
  const a = dd.querySelector('#cfr-a').value;
  const bEl = dd.querySelector('#cfr-b');
  bEl.style.display = op === 'between' ? '' : 'none';
  const b = op === 'between' ? bEl.value : '';
  if (String(a).trim() === '') delete colFilters[code];
  else colFilters[code] = { kind: 'range', type, op, a, b };
  currentPage = 1;
  renderProductsTable();
}

function productPassesColFilters(p, filters) {
  const map = filters || colFilters;
  for (const code in map) {
    if (!valueMatchesColFilter(code, displayedColValue(p, code), map[code])) return false;
  }
  return true;
}

function getColUniqueValues(code) {
  return listOptions(code);
}

function closeColFilter() {
  document.removeEventListener('click', colFilterOutsideClick);
  if (activeColFilterDropdown) { activeColFilterDropdown.remove(); activeColFilterDropdown = null; }
}

function placeColFilter(iconEl) {
  const rect = iconEl.getBoundingClientRect();
  const dd = document.createElement('div');
  dd.className = 'col-filter-dropdown';
  dd.style.top = (rect.bottom + 4) + 'px';
  dd.style.left = Math.min(rect.left, window.innerWidth - 270) + 'px';
  return dd;
}

function openContainsFilter(code, label, iconEl) {
  closeColFilter();
  const current = colFilters[code];
  const q = current && current.kind === 'contains' ? current.q : '';
  const dd = placeColFilter(iconEl);
  dd.innerHTML = `
    <div class="col-filter-dropdown-header">
      <span>${escapeHtml(label)}</span>
      <button onclick="clearColFilter('${code}')">Effacer</button>
    </div>
    <div class="col-filter-search-wrap">
      <input type="text" class="col-filter-search" placeholder="Contient…"
        value="${escapeHtml(q)}"
        oninput="setColContains('${code}', this.value)">
    </div>`;
  document.body.appendChild(dd);
  activeColFilterDropdown = dd;
  setTimeout(() => {
    const si = dd.querySelector('.col-filter-search');
    if (si) { si.focus(); si.setSelectionRange(si.value.length, si.value.length); }
    document.addEventListener('click', colFilterOutsideClick);
  }, 0);
}

function openSuggestFilter(code, label, iconEl) {
  closeColFilter();
  const current = colFilters[code];
  const q = current && current.kind === 'suggest' ? current.q : '';
  const dd = placeColFilter(iconEl);
  dd.innerHTML = `
    <div class="col-filter-dropdown-header">
      <span>${escapeHtml(label)}</span>
      <button onclick="clearColFilter('${code}')">Effacer</button>
    </div>
    <div class="col-filter-search-wrap">
      <input type="text" class="col-filter-search" placeholder="Au moins 2 caractères"
        value="${escapeHtml(q)}"
        oninput="onColSuggestInput('${code}', this.value)">
    </div>
    <div class="col-filter-list" id="col-suggest-list"></div>`;
  document.body.appendChild(dd);
  activeColFilterDropdown = dd;
  if (q.length >= 2) onColSuggestInput(code, q);
  setTimeout(() => {
    const si = dd.querySelector('.col-filter-search');
    if (si) { si.focus(); si.setSelectionRange(si.value.length, si.value.length); }
    document.addEventListener('click', colFilterOutsideClick);
  }, 0);
}

function setColContains(code, q) {
  const text = String(q || '');
  if (!text.trim()) delete colFilters[code];
  else colFilters[code] = { kind: 'contains', q: text };
  currentPage = 1;
  renderProductsTable();
}

function onColSuggestInput(code, q) {
  const box = document.getElementById('col-suggest-list');
  const text = String(q || '').trim();
  if (text.length < 2) {
    if (box) box.innerHTML = '';
    return;
  }
  const hits = suggestSource(code)
    .filter(n => n.toLowerCase().includes(text.toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'fr'))
    .slice(0, 8);
  if (!box) return;
  box.innerHTML = hits.length
    ? hits.map(n => `<div class="col-filter-item" onclick="pickColSuggest('${code}','${n.replace(/'/g, "\\'")}')">${escapeHtml(n)}</div>`).join('')
    : '<div class="col-filter-empty">Aucun résultat</div>';
}

function pickColSuggest(code, name) {
  colFilters[code] = { kind: 'suggest', q: name };
  currentPage = 1;
  closeColFilter();
  renderProductsTable();
}

function openColFilter(code, label, iconEl) {
  const mode = colFilterMode(code);
  if (mode === 'contains') { openContainsFilter(code, label, iconEl); return; }
  if (mode === 'suggest') { openSuggestFilter(code, label, iconEl); return; }
  if (mode === 'number' || mode === 'date') { openRangeFilter(code, label, iconEl, mode); return; }
  document.removeEventListener('click', colFilterOutsideClick);
  if (activeColFilterDropdown) { activeColFilterDropdown.remove(); activeColFilterDropdown = null; }
  const vals   = getColUniqueValues(code);
  const active = colFilters[code] || null;
  const rect   = iconEl.getBoundingClientRect();
  const dd     = document.createElement('div');
  dd.className = 'col-filter-dropdown';
  dd.style.top  = (rect.bottom + 4) + 'px';
  dd.style.left = Math.min(rect.left, window.innerWidth - 270) + 'px';
  let itemsHtml = '';
  if (!vals.length) {
    itemsHtml = '<div class="col-filter-empty">Aucune valeur disponible</div>';
  } else {
    const allChecked = !active || active.size === 0;
    itemsHtml += `<div class="col-filter-item" id="cfa-row-${code}">
      <input type="checkbox" id="cfa-${code}" ${allChecked ? 'checked' : ''}
        onchange="toggleColFilterAll('${code}',this)">
      <label for="cfa-${code}" style="font-weight:600">Tout sélectionner</label>
    </div>`;
    vals.forEach((v, i) => {
      const checked = !active || active.has(v);
      itemsHtml += `<div class="col-filter-item col-filter-val-item" data-val="${v.replace(/"/g, '&quot;')}">
        <input type="checkbox" id="cfv-${code}-${i}" ${checked ? 'checked' : ''}
          onchange="toggleColFilterVal('${code}','${v.replace(/'/g, "\\'")}',this)">
        <label for="cfv-${code}-${i}">${v}</label>
      </div>`;
    });
  }
  dd.innerHTML = `
    <div class="col-filter-dropdown-header">
      <span>${label}</span>
      <button onclick="clearColFilter('${code}')">Effacer</button>
    </div>
    <div class="col-filter-search-wrap">
      <input type="text" class="col-filter-search" placeholder="Rechercher..."
        oninput="filterColFilterList(this)"
        onkeydown="if(event.key==='Enter'){applyColFilterSearch(this);}">
    </div>
    <div class="col-filter-list">${itemsHtml}</div>`;
  document.body.appendChild(dd);
  activeColFilterDropdown = dd;
  setTimeout(() => {
    const si = dd.querySelector('.col-filter-search');
    if (si) si.focus();
    document.addEventListener('click', colFilterOutsideClick);
  }, 0);
}

function filterColFilterList(input) {
  const q  = input.value.toLowerCase().trim();
  const dd = input.closest('.col-filter-dropdown');
  if (!dd) return;
  dd.querySelectorAll('.col-filter-val-item').forEach(item => {
    const val = (item.getAttribute('data-val') || '').toLowerCase();
    item.style.display = (!q || val.includes(q)) ? '' : 'none';
  });
  const allVisible = [...dd.querySelectorAll('.col-filter-val-item')].filter(i => i.style.display !== 'none');
  const cbAll = dd.querySelector('input[id^="cfa-"]');
  if (cbAll) cbAll.checked = allVisible.length > 0 && allVisible.every(i => i.querySelector('input').checked);
}

function colFilterOutsideClick(e) {
  if (activeColFilterDropdown && !activeColFilterDropdown.contains(e.target)) {
    activeColFilterDropdown.remove();
    activeColFilterDropdown = null;
    document.removeEventListener('click', colFilterOutsideClick);
  }
}

function applyColFilterSearch(input) {
  const dd   = input.closest('.col-filter-dropdown');
  if (!dd) return;
  const cbAll = dd.querySelector('input[id^="cfa-"]');
  const code  = cbAll ? cbAll.id.replace('cfa-', '') : null;
  if (!code) return;
  const allItems = [...dd.querySelectorAll('.col-filter-val-item')];
  const visible  = allItems.filter(i => i.style.display !== 'none');
  const hidden   = allItems.filter(i => i.style.display === 'none');
  visible.forEach(item => item.querySelector('input').checked = true);
  hidden.forEach(item  => item.querySelector('input').checked = false);
  const vals = visible.map(i => i.getAttribute('data-val')).filter(Boolean);
  if (vals.length === 0) { delete colFilters[code]; }
  else { colFilters[code] = new Set(vals); }
  document.removeEventListener('click', colFilterOutsideClick);
  renderProductsTable();
  activeColFilterDropdown = dd;
  input.value = '';
  allItems.forEach(item => {
    item.style.display = '';
    const v = item.getAttribute('data-val');
    if (v) item.querySelector('input').checked = colFilters[code] ? colFilters[code].has(v) : true;
  });
  if (cbAll) cbAll.checked = !colFilters[code];
  setTimeout(() => document.addEventListener('click', colFilterOutsideClick), 0);
}

function toggleColFilterVal(code, val, cb) {
  const vals = getColUniqueValues(code);
  if (!colFilters[code]) colFilters[code] = new Set(vals);
  if (cb.checked) colFilters[code].add(val);
  else colFilters[code].delete(val);
  const dd = activeColFilterDropdown;
  document.removeEventListener('click', colFilterOutsideClick);
  renderProductsTable();
  activeColFilterDropdown = dd;
  if (dd) {
    dd.querySelectorAll('.col-filter-val-item input').forEach(input => {
      const v = input.closest('.col-filter-val-item') && input.closest('.col-filter-val-item').getAttribute('data-val');
      if (v) input.checked = !colFilters[code] || colFilters[code].has(v);
    });
    const cbAll = dd.querySelector('input[id^="cfa-"]');
    if (cbAll) cbAll.checked = !colFilters[code];
    setTimeout(() => document.addEventListener('click', colFilterOutsideClick), 0);
  }
}

function toggleColFilterAll(code, cb) {
  if (cb.checked) {
    delete colFilters[code];
    if (activeColFilterDropdown)
      activeColFilterDropdown.querySelectorAll('.col-filter-val-item input').forEach(c => c.checked = true);
  } else {
    colFilters[code] = new Set();
    if (activeColFilterDropdown)
      activeColFilterDropdown.querySelectorAll('.col-filter-val-item input').forEach(c => c.checked = false);
  }
  renderProductsTable();
}

function clearColFilter(code) {
  delete colFilters[code];
  if (activeColFilterDropdown) { activeColFilterDropdown.remove(); activeColFilterDropdown = null; }
  renderProductsTable();
}

// Liste des produits « neuve » : aucun filtre, aucune sélection, vue synthèse
function resetProductFilters() {
  colFilters = {};
  _filterIncomplets = false;
  _filterAlertId = null;
  selectedProductIds = [];
  compareMode = false;
  currentPage = 1;
  const search = document.getElementById('products-search');
  if (search) search.value = '';
  const cat = document.getElementById('filter-cat');
  if (cat) cat.value = '';
  if (typeof syncComboFromSelect === 'function' && cat) syncComboFromSelect(cat);
  if (currentView === 'detail') {
    currentView = 'synth';
    const bs = document.getElementById('btn-view-synth');
    const bd = document.getElementById('btn-view-detail');
    if (bs) bs.classList.add('active');
    if (bd) bd.classList.remove('active');
  }
}

// Menu Produits : la liste repart sans filtre. Tableau de bord : la liste
// repart sans filtre puis applique celui de la tuile cliquée.
let _productsReset = false, _productsPreset = null;
function openProductsList(navEl, preset) {
  _productsReset = true;
  _productsPreset = preset || null;
  showPage('products', navEl || document.querySelector('.nav-item[data-nav="products"]'));
}

function clearAllFilters() {
  colFilters = {};
  _filterIncomplets = false;
  _filterAlertId = null;
  const search = document.getElementById('products-search');
  if (search) search.value = '';
  const cat = document.getElementById('filter-cat');
  if (cat) cat.value = '';
  renderProductsTable();
  showNotif('Filtres réinitialisés');
}

function isColFilterActive(code) { return colFilters[code] !== undefined; }

function passesColFilters(product) {
  computeCalcFields(product);
  return productPassesColFilters(product, colFilters);
}

function hasActiveFilters() {
  const search = (document.getElementById('products-search') || {}).value || '';
  const cat    = (document.getElementById('filter-cat') || {}).value || '';
  return search.trim().length >= 2 || cat !== '' || Object.keys(colFilters).length > 0 || _filterIncomplets || _filterAlertId != null;
}

// ============================================================
// TABLEAU PRODUITS — POINT D'ENTREE
// ============================================================
function renderProductsTable() {
  const out = withCalcBatch(renderProductsTableNow);
  requestAnimationFrame(applyStickyTable);
  return out;
}

// Tableau des produits : en-têtes figés en haut, case à cocher, visuel et
// nom figés à gauche ; le tableau défile dans sa zone, la barre horizontale
// reste donc visible.
function applyStickyTable() {
  const table = document.getElementById('products-table');
  if (!table || !table.tHead || !table.tHead.rows.length) return;
  const head = table.tHead;
  const items = activeSynthItems();
  const titleIdx = items.indexOf(getSynthTitleItem());
  const n = 1 + (titleIdx >= 0 ? titleIdx + 1 : 0);
  if (head.rows.length > 1) {
    const h = head.rows[0].getBoundingClientRect().height;
    [...head.rows[1].cells].forEach(c => { c.style.top = h + 'px'; });
  }
  let left = 0;
  const lefts = [...head.rows[0].cells].slice(0, n).map(c => { const l = left; left += c.getBoundingClientRect().width; return l; });
  [...table.rows].forEach(tr => {
    if (tr.parentElement === head && tr !== head.rows[0]) return;
    [...tr.cells].slice(0, n).forEach((c, i) => {
      if (c.colSpan > 1) return;
      c.classList.add('sticky-col');
      c.classList.toggle('sticky-last', i === n - 1);
      c.style.left = lefts[i] + 'px';
    });
  });
}
window.addEventListener('resize', () => requestAnimationFrame(applyStickyTable));

function renderProductsTableNow() {
  const searchVal = (document.getElementById('products-search') || {}).value || '';
  const catFilter = (document.getElementById('filter-cat') || {}).value || '';

  let filtered = products.filter(p => {
    if (!canCat(p.cat, 'r')) return false;
    if (!(!catFilter || p.cat === catFilter)) return false;
    computeCalcFields(p);
    if (!productMatchesSearch(p, searchVal)) return false;
    if (!passesColFilters(p)) return false;
    if (_filterIncomplets && calcCompletion(p) >= seuilCompletion) return false;
    if (_filterAlertId != null) {
      const alert = (alerts || []).find(a => a.id === _filterAlertId);
      if (!alert || !productMatchesAlert(p, alert)) return false;
    }
    return true;
  });

  // La sélection ne garde que les produits affichés par les filtres en cours
  const shownIds = new Set(filtered.map(p => p.id));
  const before = selectedProductIds.length;
  selectedProductIds = selectedProductIds.filter(id => shownIds.has(id));
  if (selectedProductIds.length !== before && typeof renderCompareBar === 'function') setTimeout(renderCompareBar, 0);

  if (compareMode && selectedProductIds.length > 0)
    filtered = filtered.filter(p => selectedProductIds.includes(p.id));

  if (sortState.code) {
    const code = sortState.code;
    const dir = sortState.dir === 'desc' ? -1 : 1;
    const attr = (attributes || []).find(a => a.code === code);
    filtered.sort((a, b) => {
      if (code === 'completion' || (attr && attr.type === 'Nombre')) {
        const na = parseFloat(String(getListColValue(a, code)).replace('%', '').replace(',', '.'));
        const nb = parseFloat(String(getListColValue(b, code)).replace('%', '').replace(',', '.'));
        if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
      }
      return displayedColValue(a, code).localeCompare(displayedColValue(b, code), 'fr', { numeric: true }) * dir;
    });
  }

  const thead = document.getElementById('products-thead');
  const tbody = document.getElementById('products-tbody');
  if (!thead || !tbody) return;

  // Bouton effacer filtres
  const clearBtn = document.getElementById('btn-clear-filters');
  if (clearBtn) clearBtn.style.display = hasActiveFilters() ? '' : 'none';
  const chip = document.getElementById('alert-filter-chip');
  if (chip) {
    const alert = _filterAlertId != null ? (alerts || []).find(a => a.id === _filterAlertId) : null;
    chip.style.display = alert ? '' : 'none';
    chip.textContent = alert ? alertRuleText(alert) : '';
  }

  renderGroupFilterBar();

  // Pagination
  const pageSize  = appPrefs.pageSize || 0;
  const totalRows = filtered.length;
  const totalPages = pageSize > 0 ? Math.ceil(totalRows / pageSize) : 1;
  if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
  const paginated = pageSize > 0
    ? filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filtered;

  if (currentView === 'synth') {
    renderSynthHeader(thead);
    renderSynthRows(tbody, paginated);
  } else {
    initGroupFilters();
    renderDetailHeader(thead);
    renderDetailRows(tbody, paginated);
  }

  renderCompareBar();
  renderPagination(totalRows, totalPages);

  const pi = document.getElementById('pagination-info');
  if (pi) pi.textContent = `${totalRows} produit${totalRows > 1 ? 's' : ''}`;
}

// ============================================================
// PAGINATION
// ============================================================
function renderPagination(totalRows, totalPages) {
  const container = document.getElementById('pagination-container');
  if (!container) return;
  if (totalPages <= 1 && appPrefs.pageSize > 0) {
    container.innerHTML = '';
    return;
  }
  if (appPrefs.pageSize === 0) {
    container.innerHTML = '';
    return;
  }
  let html = '<div class="page-btns">';
  html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&lsaquo;</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || i === totalPages ||
      (i >= currentPage - 2 && i <= currentPage + 2)
    ) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += `<span style="padding:0 4px;color:#a0b0c0">…</span>`;
    }
  }
  html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>&rsaquo;</button>`;
  html += '</div>';
  container.innerHTML = html;
}

function goToPage(n) {
  currentPage = n;
  renderProductsTable();
}

// ============================================================
// EN-TETE TH AVEC TRI + FILTRE
// ============================================================
function makeSortFilterTh(label, code) {
  const th = document.createElement('th');
  th.className = 'th-sortable';
  const isFiltered = isColFilterActive(code);
  th.innerHTML = `<div style="display:flex;align-items:center;gap:4px;white-space:nowrap">
    <span class="sort-btn" onclick="sortTableByCode('${code}')" title="Trier"
      style="cursor:pointer;font-size:13px;color:#8a9bb0">&#8645;</span>
    <span onclick="sortTableByCode('${code}')" style="cursor:pointer;flex:1">${label}</span>
    <span class="th-filter-icon${isFiltered ? ' filter-active' : ''}"
      title="Filtrer" onclick="openColFilter('${code}','${label}',this)">&#9663;</span>
  </div>`;
  return th;
}

// ============================================================
// VUE SYNTHESE — HEADER
// Piloté par syntheseItems
// ============================================================
function renderSynthHeader(thead) {
  thead.innerHTML = '';
  const tr = document.createElement('tr');

  // Checkbox select all — toujours en premier
  const thCb = document.createElement('th');
  thCb.style.width = '36px';
  thCb.innerHTML = '<input type="checkbox" onchange="toggleSelectAll(this)">';
  tr.appendChild(thCb);

  activeSynthItems().forEach(item => {
    if (item.kind === 'action') {
      // Colonne action : pas de tri ni filtre
      const th = document.createElement('th');
      th.textContent = item.label;
      tr.appendChild(th);
    } else {
      // Colonne attribut
      if (isVisualCode(item.code)) {
        const th = document.createElement('th');
        th.textContent = item.label;
        tr.appendChild(th);
      } else {
        tr.appendChild(makeSortFilterTh(item.label, item.code));
      }
    }
  });

  thead.appendChild(tr);
}

// ============================================================
// VUE SYNTHESE — LIGNES
// ============================================================
function renderSynthRows(tbody, filtered) {
  tbody.innerHTML = '';
  filtered.forEach(p => {
    computeCalcFields(p);
    const comp       = calcCompletion(p);
    const isSelected = selectedProductIds.includes(p.id);
    const nom        = p.fields.nom || '—';
    const tr         = document.createElement('tr');
    if (isSelected) tr.className = 'row-selected';

    // Checkbox
    let cells = `<td class="td-check"><span class="td-check-in">
      <input type="checkbox" ${isSelected ? 'checked' : ''}
        onchange="toggleSelectProduct(${p.id},this)">${alertPictoHtml(p)}</span>
    </td>`;

    activeSynthItems().forEach(item => {
      if (item.kind === 'action' && item.code === 'delete') {
        cells += `<td>
          ${canDeleteProduct(p)
            ? `<button class="action-btn-danger btn-trash" title="Supprimer le produit"
            onclick="confirmDelete('product',${p.id},'${nom.replace(/'/g, "\\'")}')">${TRASH_ICON}</button>`
            : ''}
        </td>`;
      } else if (item.kind === 'attr') {
        cells += renderSynthCell(p, item, comp);
      }
    });

    tr.innerHTML = cells;
    tbody.appendChild(tr);
  });
}

function alertPictoHtml(p) {
  const hits = typeof productAlertHits === 'function' ? productAlertHits(p) : [];
  if (!hits.length) return '';
  const title = hits.map(a => alertRuleText(a)).join(' · ');
  return `<span class="alert-picto" title="${escapeHtml(title)}">&#9888;</span>`;
}

function renderSynthCell(p, item, comp) {
  const code = item.code;

  if (isVisualCode(code)) {
    return `<td style="padding:6px 10px">${visualThumb(p, 40, code)}</td>`;
  }

  let inner, style = 'white-space:nowrap';
  if (code === 'cat') {
    inner = `<span class="badge" style="${getCatBadgeStyle(p.cat)}">${p.cat}</span>`;
    style = '';
  } else if (code === 'completion') {
    inner = `<div class="inline-bar">
        <div class="inline-bar-bg">
          <div class="inline-bar-fill"
            style="width:${comp}%;background:${getCompletionColor(comp)}"></div>
        </div>
        <span style="font-size:12px;color:#607080">${comp}%</span>
      </div>`;
    style = '';
  } else {
    inner = getSynthValue(p, code) || '—';
  }

  // Premiere information de la synthese = colonne cliquable vers la fiche
  if (isSynthTitleCode(code)) {
    return `<td class="td-name">
      <span class="product-link"
        onclick="openProductDetail(${p.id})">${inner}</span>
    </td>`;
  }

  return `<td style="${style}">${inner}</td>`;
}

// ============================================================
// VUE DETAILLEE — groupes filtres par categorie
// ============================================================
function getGroupsForCurrentCat() {
  const catFilter = (document.getElementById('filter-cat') || {}).value || '';
  if (!catFilter) return getVisibleGroupsForUser();
  const cat = getCatByName(catFilter);
  if (!cat) return getVisibleGroupsForUser();
  return cat.groupIds.map(id => getGroupById(id)).filter(Boolean);
}

// Vue detaillee : un champ deja affiche (colonne de synthese ou groupe
// precedent) n'est pas repete dans les groupes suivants.
function detailGroupAttrs(visibleGroups) {
  // Les éléments système ont deux codes (createdAt / created_at, maj / updated_at)
  const seen = new Set();
  const mark = code => synthCodeAliases(code).forEach(c => seen.add(c));
  activeSynthItems().filter(i => i.kind === 'attr').forEach(i => mark(i.code));
  return visibleGroups.map(g => {
    const attrs = g.attrIds.map(id => getAttrById(id))
      .filter(a => a && attrShownInList(a) && !seen.has(a.code));
    attrs.forEach(a => mark(a.code));
    return { g, attrs };
  });
}

function renderDetailHeader(thead) {
  thead.innerHTML = '';
  initGroupFilters();
  const catGroups     = getGroupsForCurrentCat();
  const visibleGroups = catGroups.filter(g =>
    activeGroupFilters.has(g.id)
  );

  const row1 = document.createElement('tr');
  const row2 = document.createElement('tr');

  // Colonnes synthese fixes (checkbox)
  const thCb = document.createElement('th');
  thCb.rowSpan = 2;
  thCb.style.width = '36px';
  thCb.innerHTML = '<input type="checkbox" onchange="toggleSelectAll(this)">';
  row1.appendChild(thCb);

  // Colonnes synthese dynamiques
  activeSynthItems().forEach(item => {
    if (item.kind === 'action') {
      const th = document.createElement('th');
      th.rowSpan = 2;
      th.textContent = item.label;
      row1.appendChild(th);
    } else {
      const th = document.createElement('th');
      th.rowSpan = 2;
      if (isVisualCode(item.code)) {
        th.textContent = item.label;
      } else {
        th.appendChild(makeSortFilterTh(item.label, item.code));
      }
      row1.appendChild(th);
    }
  });

  // Colonnes groupes d'attributs
  detailGroupAttrs(visibleGroups).forEach(({ g, attrs: groupAttrs }) => {
    if (!groupAttrs.length) return;
    const color = getGroupColor(g);
    const th = document.createElement('th');
    th.colSpan = groupAttrs.length;
    th.className = 'double-header-group';
    th.style.background = color.bg;
    th.style.color = color.text;
    th.textContent = g.name;
    row1.appendChild(th);
    groupAttrs.forEach(attr => {
      const th2 = document.createElement('th');
      th2.style.background = color.bg + '99';
      th2.style.minWidth = '110px';
      const isFiltered = isColFilterActive(attr.code);
      th2.innerHTML = `<div style="display:flex;align-items:center;gap:4px;white-space:nowrap">
        <span class="sort-btn" onclick="sortTableByCode('${attr.code}')"
          title="Trier" style="cursor:pointer;font-size:13px;color:#8a9bb0">&#8645;</span>
        <span onclick="sortTableByCode('${attr.code}')"
          style="cursor:pointer;flex:1">${attr.name}</span>
        <span class="th-filter-icon${isFiltered ? ' filter-active' : ''}"
          title="Filtrer"
          onclick="openColFilter('${attr.code}','${attr.name}',this)">&#9663;</span>
      </div>`;
      row2.appendChild(th2);
    });
  });

  thead.appendChild(row1);
  thead.appendChild(row2);
}

function renderDetailRows(tbody, filtered) {
  tbody.innerHTML = '';
  initGroupFilters();
  const catGroups     = getGroupsForCurrentCat();
  const visibleGroups = catGroups.filter(g =>
    activeGroupFilters.has(g.id)
  );

  const allValues = {};
  if (compareMode && filtered.length > 1) {
    visibleGroups.forEach(g => g.attrIds.forEach(aid => {
      const attr = getAttrById(aid);
      if (!attr || !attrShownInList(attr)) return;
      allValues[attr.code] = filtered.map(p => p.fields[attr.code] || '');
    }));
  }

  filtered.forEach(p => {
    computeCalcFields(p);
    const comp       = calcCompletion(p);
    const isSelected = selectedProductIds.includes(p.id);
    const nom        = p.fields.nom || '—';
    const tr         = document.createElement('tr');
    if (isSelected) tr.className = 'row-selected';

    // Checkbox
    let cells = `<td class="td-check"><span class="td-check-in">
      <input type="checkbox" ${isSelected ? 'checked' : ''}
        onchange="toggleSelectProduct(${p.id},this)">${alertPictoHtml(p)}</span>
    </td>`;

    // Colonnes synthese (meme logique que renderSynthRows)
    activeSynthItems().forEach(item => {
      if (item.kind === 'action' && item.code === 'delete') {
        cells += `<td>
          ${canDeleteProduct(p)
            ? `<button class="action-btn-danger btn-trash" title="Supprimer le produit"
            onclick="confirmDelete('product',${p.id},'${nom.replace(/'/g,"\\'")}')">${TRASH_ICON}</button>`
            : ''}
        </td>`;
      } else if (item.kind === 'attr') {
        cells += renderSynthCell(p, item, comp);
      }
    });

    // Colonnes groupes d'attributs
    detailGroupAttrs(visibleGroups).forEach(({ g, attrs: groupAttrs }) => {
      const color = getGroupColor(g);
      groupAttrs.forEach(attr => {
        const val  = formatAttrListValue(p, attr);
        let isDiff = false;
        if (compareMode && allValues[attr.code])
          isDiff = new Set(allValues[attr.code].map(v => String(v == null ? '' : v).trim())).size > 1;
        cells += `<td class="${isDiff ? 'cell-diff' : ''}${attr.type === 'Image' ? ' td-thumb' : ''}" style="white-space:nowrap;font-size:12px;
          background:${isDiff ? '#fff9c4' : color.bg + '55'}">${val}</td>`;
      });
    });

    tr.innerHTML = cells;
    tbody.appendChild(tr);
  });
}

// ============================================================
// SELECTION ET COMPARAISON
// ============================================================
function toggleSelectAll(cb) {
  document.querySelectorAll('#products-tbody input[type=checkbox]').forEach(c => {
    const m = c.getAttribute('onchange') && c.getAttribute('onchange').match(/toggleSelectProduct\((\d+)/);
    if (m) {
      const id = parseInt(m[1]);
      if (cb.checked) { if (!selectedProductIds.includes(id)) selectedProductIds.push(id); }
      else selectedProductIds = selectedProductIds.filter(x => x !== id);
    }
    c.checked = cb.checked;
    const tr = c.closest('tr');
    if (tr) { if (cb.checked) tr.classList.add('row-selected'); else tr.classList.remove('row-selected'); }
  });
  renderCompareBar();
}

function toggleSelectProduct(id, cb) {
  if (cb.checked) { if (!selectedProductIds.includes(id)) selectedProductIds.push(id); }
  else selectedProductIds = selectedProductIds.filter(x => x !== id);
  const tr = cb.closest('tr');
  if (tr) { if (cb.checked) tr.classList.add('row-selected'); else tr.classList.remove('row-selected'); }
  renderCompareBar();
}

function renderCompareBar() {
  const container = document.getElementById('compare-bar-container');
  if (!container) return;
  if (!selectedProductIds.length) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = `
    <div class="compare-bar" style="display:flex;align-items:center;
      justify-content:space-between;background:#1565c0;color:#fff;
      padding:10px 16px;border-radius:8px;margin-bottom:10px;gap:12px">
      <span style="font-size:13px;font-weight:600">
        ${selectedProductIds.length} produit(s) sélectionné(s)
      </span>
      <div style="position:relative">
        <button class="btn" id="bulk-actions-btn"
          style="background:#fff;color:#1565c0;font-weight:700;
            border:none;padding:7px 18px;border-radius:6px;cursor:pointer;
            display:flex;align-items:center;gap:6px"
          onclick="toggleBulkActionsMenu(event)">
          Actions
          <span style="font-size:10px">&#9660;</span>
        </button>
        <div id="bulk-actions-menu"
          style="display:none;position:absolute;top:calc(100% + 6px);right:0;
            background:#fff;border:1px solid #e0e8f0;border-radius:8px;
            box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:9999;
            min-width:230px;padding:6px 0;white-space:nowrap">
          ${selectedProductIds.some(id => {
            const p = products.find(x => x.id === id);
            return p && canEditProduct(p);
          }) ? `<div onclick="openBulkEditModal();closeBulkActionsMenu()"
            style="padding:9px 16px;font-size:13px;color:#1a2332;cursor:pointer;
              display:flex;align-items:center;gap:8px"
            onmouseover="this.style.background='#f0f4f8'"
            onmouseout="this.style.background=''">
            &#9998; Modifier un attribut
          </div>` : ''}
          <div onclick="startCompare();closeBulkActionsMenu()"
            style="padding:9px 16px;font-size:13px;color:#1a2332;cursor:pointer;
              display:flex;align-items:center;gap:8px"
            onmouseover="this.style.background='#f0f4f8'"
            onmouseout="this.style.background=''">
            &#128269; Comparer les produits
          </div>
          <div onclick="bulkExport();closeBulkActionsMenu()"
            style="padding:9px 16px;font-size:13px;color:#1a2332;cursor:pointer;
              display:flex;align-items:center;gap:8px"
            onmouseover="this.style.background='#f0f4f8'"
            onmouseout="this.style.background=''">
            &#128229; Exporter la selection
          </div>
          <div style="border-top:1px solid #f0f4f8;margin:4px 0"></div>
          ${selectedProductIds.some(id => {
            const p = products.find(x => x.id === id);
            return p && canDeleteProduct(p);
          }) ? `<div onclick="bulkDelete();closeBulkActionsMenu()"
            style="padding:9px 16px;font-size:13px;color:#ef5350;cursor:pointer;
              display:flex;align-items:center;gap:8px"
            onmouseover="this.style.background='#fff5f5'"
            onmouseout="this.style.background=''">
            &#128465; Supprimer la selection
          </div>` : ''}
          <div style="border-top:1px solid #f0f4f8;margin:4px 0"></div>
          <div onclick="clearSelection();closeBulkActionsMenu()"
            style="padding:9px 16px;font-size:13px;color:#607080;cursor:pointer;
              display:flex;align-items:center;gap:8px"
            onmouseover="this.style.background='#f0f4f8'"
            onmouseout="this.style.background=''">
            &#10005; Désélectionner tout
          </div>
        </div>
      </div>
    </div>`;
}

function toggleBulkActionsMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('bulk-actions-menu');
  if (!menu) return;
  const isOpen = menu.style.display !== 'none';
  menu.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    setTimeout(() => {
      document.addEventListener('click', closeBulkActionsMenu, { once: true });
    }, 0);
  }
}

function closeBulkActionsMenu() {
  const menu = document.getElementById('bulk-actions-menu');
  if (menu) menu.style.display = 'none';
}
function toggleBulkActionsMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('bulk-actions-menu');
  if (!menu) return;
  const isOpen = menu.style.display !== 'none';
  menu.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    setTimeout(() => {
      document.addEventListener('click', closeBulkActionsMenu, { once: true });
    }, 0);
  }
}

function closeBulkActionsMenu() {
  const menu = document.getElementById('bulk-actions-menu');
  if (menu) menu.style.display = 'none';
}

function startCompare() {
  if (selectedProductIds.length < 2) {
    showNotif('Selectionnez au moins 2 produits pour comparer', 'warn');
    return;
  }
  compareMode = true;
  if (currentView !== 'detail') {
    const catFilter = (document.getElementById('filter-cat') || {}).value || '';
    if (!catFilter) {
      showNotif('Sélectionnez une catégorie pour activer la vue détaillée', 'warn');
      return;
    }
    switchView('detail');
  } else {
    renderProductsTable();
  }
  showNotif('Mode comparaison actif — differences surlignees en jaune');
}

function openBulkEditModal() {
  if (!selectedProductIds.length) return;

  const cats = [...new Set(selectedProductIds.map(id => {
    const p = products.find(x => x.id === id);
    return p ? p.cat : null;
  }).filter(Boolean))];

  const commonGroupIds = cats.reduce((acc, catName, idx) => {
    const cat = getCatByName(catName);
    if (!cat) return acc;
    return idx === 0 ? [...cat.groupIds] : acc.filter(gid => cat.groupIds.includes(gid));
  }, []);

  const availableAttrs = commonGroupIds
    .flatMap(gid => { const g = getGroupById(gid); return g ? g.attrIds : []; })
    .map(aid => getAttrById(aid))
    .filter(a => a && !a.calc);

  const attrOptions = availableAttrs.map(a =>
    `<option value="${a.id}">${a.name}</option>`).join('');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-title">
        Modifier un attribut — ${selectedProductIds.length} produit(s)
      </div>
      <div class="field-row">
        <div class="field-label">Attribut a modifier</div>
        <select class="form-select" id="bulk-attr-select"
          onchange="onBulkAttrChange(this)">
          <option value="">-- Choisir --</option>
          ${attrOptions}
        </select>
      </div>
      <div id="bulk-value-wrap" style="margin-top:12px"></div>
      <div class="modal-footer">
        <button class="btn btn-secondary"
          onclick="this.closest('.modal-overlay').remove()">Annuler</button>
        <button class="btn btn-primary"
          onclick="applyBulkEdit(this)">Appliquer</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function onBulkAttrChange(sel) {
  const wrap = document.getElementById('bulk-value-wrap');
  if (!wrap) return;
  const attr = attributes.find(a => a.id === parseInt(sel.value));
  if (!attr) { wrap.innerHTML = ''; return; }
  let input = '';
  if (attr.type === 'Simple select') {
    const opts = (attr.options || []).map(o => `<option>${o}</option>`).join('');
    input = `<select class="form-select" id="bulk-attr-value">
      <option value="">-- Choisir --</option>${opts}</select>`;
  } else if (attr.type === 'Oui / Non') {
    const yn = (attr.options && attr.options.length) ? attr.options : ['Oui', 'Non'];
    input = `<select class="form-select" id="bulk-attr-value">
      <option value="">-- Choisir --</option>
      ${yn.map(o => `<option>${o}</option>`).join('')}</select>`;
  } else if (attr.type === 'Nombre' || attr.type === 'Nombre decimal') {
    input = `<input class="field-input" id="bulk-attr-value" type="number" onwheel="event.preventDefault();this.blur()">`;
  } else {
    input = `<input class="field-input" id="bulk-attr-value" placeholder="Nouvelle valeur">`;
  }
  wrap.innerHTML = `<div class="field-row">
    <div class="field-label">Nouvelle valeur</div>${input}</div>`;
}

function applyBulkEdit(btn) {
  const attrSel = document.getElementById('bulk-attr-select');
  const valEl   = document.getElementById('bulk-attr-value');
  if (!attrSel || !attrSel.value || !valEl) {
    showNotif('Choisissez un attribut et une valeur', 'warn'); return;
  }
  const attr  = attributes.find(a => a.id === parseInt(attrSel.value));
  let value = valEl.value;
  if (!attr) return;
  if (isPercentAttr(attr)) value = coercePercentStored(value);
  const now = new Date().toLocaleDateString('fr-FR') + ' ' +
    new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  selectedProductIds.forEach(id => {
    const p = products.find(x => x.id === id);
    if (p && canEditProduct(p)) { p.fields[attr.code] = value; p.maj = now; }
  });
  btn.closest('.modal-overlay').remove();
  renderProductsTable();
  showNotif(selectedProductIds.length + ' produit(s) mis à jour : ' + attr.name);
}

// Actions groupees de la barre de selection
function bulkDelete() {
  if (!selectedProductIds.length) return;
  const ids = selectedProductIds.filter(id => {
    const p = products.find(x => x.id === id);
    return p && canDeleteProduct(p);
  });
  if (!ids.length) {
    showNotif('Aucun produit sélectionné ne peut être supprimé', 'warn');
    return;
  }
  pendingDelete = { type: 'mass', ids };
  document.getElementById('confirm-delete-text').textContent =
    `Supprimer ${ids.length} produit${ids.length > 1 ? 's' : ''} ?`;
  document.getElementById('confirm-delete-btn').onclick = executeMassDelete;
  openModal('modal-confirm-delete');
}

// La page Exports coche « Exporter uniquement la selection » des qu'une
// selection est active, et runExport filtre sur selectedProductIds.
function bulkExport() {
  if (!selectedProductIds.length) return;
  captureExportSnapshot();
  showPage('exports', document.querySelector('.nav-item[data-nav="exports"]'));
  showNotif('Export préparé sur ' + selectedProductIds.length + ' produit(s) sélectionné(s)');
}

function executeMassDelete() {
  if (!pendingDelete || pendingDelete.type !== 'mass') return;
  products = products.filter(p => !pendingDelete.ids.includes(p.id));
  selectedProductIds = [];
  compareMode = false;
  closeModal('modal-confirm-delete');
  renderAll();
  showNotif(pendingDelete.ids.length + ' produit(s) supprimés');
  pendingDelete = null;
}

function enterCompare() {
  compareMode = true;
  if (currentView === 'synth') switchView('detail');
  else renderProductsTable();
}

function exitCompare()    { compareMode = false; renderProductsTable(); }

function clearSelection() {
  selectedProductIds = [];
  compareMode = false;
  document.querySelectorAll('#products-tbody input[type=checkbox]').forEach(c => c.checked = false);
  document.querySelectorAll('#products-tbody tr').forEach(tr => tr.classList.remove('row-selected'));
  renderCompareBar();
}

// ============================================================
// SWITCH VUE
// ============================================================
function onCatFilterChange() {
  const v = (document.getElementById('filter-cat') || {}).value || '';
  _filterIncomplets = false;
  _filterAlertId = null;
  colFilters = {};
  currentPage = 1;
  if (!v && currentView === 'detail') {
    activeGroupFilters = null;
    switchView('synth');
  } else if (v && currentView === 'detail') {
    const cat = getCatByName(v);
    activeGroupFilters = new Set(cat ? cat.groupIds : getVisibleGroupsForUser().map(g => g.id));
    renderGroupFilterBar();
    renderProductsTable();
  } else {
    activeGroupFilters = null;
    filterTable();
  }
}

function switchView(mode) {
  if (mode === 'detail') {
    const catFilter = (document.getElementById('filter-cat') || {}).value || '';
    if (!catFilter) {
      const sel = document.getElementById('filter-cat');
      if (sel) {
        sel.classList.add('filter-cat-required');
        sel.focus();
        sel.addEventListener('change', function onceChange() {
          sel.classList.remove('filter-cat-required');
          sel.removeEventListener('change', onceChange);
        });
      }
      showNotif('Veuillez sélectionner une catégorie pour accéder à la vue détaillée');
      return;
    }
  }
  currentView = mode;
  currentPage = 1;

  const bs = document.getElementById('btn-view-synth');
  const bd = document.getElementById('btn-view-detail');
  if (bs) bs.classList.toggle('active', mode === 'synth');
  if (bd) bd.classList.toggle('active', mode === 'detail');

  if (mode === 'detail') {
    const cat = getCatByName((document.getElementById('filter-cat') || {}).value || '');
    activeGroupFilters = new Set(cat ? cat.groupIds : getVisibleGroupsForUser().map(g => g.id));
    renderGroupFilterBar();
  }
  renderProductsTable();
}

function filterTable() { _filterIncomplets = false; _filterAlertId = null; currentPage = 1; renderProductsTable(); }

// ============================================================
// TRI
// ============================================================
function sortTableByCode(code) {
  const dir = (sortState.code === code && sortState.dir === 'asc') ? 'desc' : 'asc';
  sortState = { code, dir };
  renderProductsTable();
}

// ============================================================
// GROUPES FILTRES (vue détaillée)
// ============================================================
function renderGroupFilterBar() {
  const bar = document.getElementById('group-filter-bar-container');
  if (!bar) return;
  const catName = (document.getElementById('filter-cat') || {}).value || '';
  if (currentView !== 'detail' || !catName) { bar.innerHTML = ''; return; }
  const cat = getCatByName(catName);
  const groups = cat ? cat.groupIds.map(id => getGroupById(id)).filter(Boolean) : [];
  if (!groups.length) { bar.innerHTML = ''; return; }
  initGroupFilters();
  let html = '<div class="group-filter-bar"><span style="font-size:12px;font-weight:600;color:#607080;margin-right:4px;white-space:nowrap">Groupes :</span>';
  groups.forEach(g => {
    const active = activeGroupFilters.has(g.id);
    const color  = getGroupColor(g);
    html += `<span class="group-filter-chip ${active ? 'active' : 'inactive'}"
      style="${active
        ? `background:${color.bg};color:${color.text};border-color:${color.text}`
        : 'background:#fff;color:#a0b0c0;border-color:#dde3ea'}"
      onclick="toggleGroupFilter(${g.id})">${g.name}</span>`;
  });
  html += '</div>';
  bar.innerHTML = html;
}

function toggleGroupFilter(groupId) {
  initGroupFilters();
  if (activeGroupFilters.has(groupId)) activeGroupFilters.delete(groupId);
  else activeGroupFilters.add(groupId);
  renderGroupFilterBar();
  renderProductsTable();
}

// ============================================================
// CREATION PRODUIT — ETAPE 1 (modale)
// ============================================================
function createProduct() {
  if (!getWritableCategories().length) {
    showNotif('Aucune catégorie accessible en modification', 'warn');
    return;
  }
  const sapEl  = document.getElementById('np-sap');
  const eanEl  = document.getElementById('np-ean');
  const nameEl = document.getElementById('np-name');
  const catEl  = document.getElementById('np-cat');
  const sap    = sapEl.value.trim();
  const ean    = eanEl.value.trim();
  const name   = nameEl.value.trim();
  const cat    = catEl.value;
  let valid    = true;

  ['np-ean', 'np-name', 'np-cat'].forEach(id => {
    const el    = document.getElementById(id);
    const errEl = document.getElementById('err-' + id);
    if (el)    el.classList.remove('field-error');
    if (errEl) errEl.classList.remove('show');
  });

  if (!ean)  { document.getElementById('np-ean').classList.add('field-error');  document.getElementById('err-np-ean').classList.add('show');  valid = false; }
  if (!name) { document.getElementById('np-name').classList.add('field-error'); document.getElementById('err-np-name').classList.add('show'); valid = false; }
  if (!cat)  { document.getElementById('np-cat').classList.add('field-error');  document.getElementById('err-np-cat').classList.add('show');  valid = false; }
  if (cat && !canCat(cat, 'w')) {
    showNotif('Création non autorisée sur cette catégorie', 'warn');
    return;
  }
  if (!valid) return;

  const today = todayStr();
  const newProduct = {
    id: nextProductId++,
    cat,
    createdAt: today,
    maj: nowStr(),
    visualSrc: null,
    visuals: 0,
    history: [],
    pendingChanges: [],
    fields: { sap, ean, nom: name, miseEnLigne: '', created_at: today },
  };
  products.push(newProduct);

  closeModal('modal-create-product');
  ['np-sap', 'np-ean', 'np-name'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('np-cat').value = '';

  renderAll();
  showNotif('Produit "' + name + '" créé — ouverture de la fiche');

  // Etape 2 : ouvre directement la fiche pour compléter
  setTimeout(() => openProductDetail(newProduct.id), 300);
}

// ============================================================
// FICHE PRODUIT — OUVERTURE
// ============================================================

// ============================================================
// INTERCEPTION NAVIGATION — POP-UP DIRTY
// ============================================================



// ============================================================
// HEADER PRODUIT
// ============================================================
// Une info du bloc resume, pilotee par un element de syntheseItems

// Vignette du bloc resume : attribut Image configure dans la vue synthese



// ============================================================
// UPLOAD VISUEL
// ============================================================


// ============================================================
// ONGLETS PRODUIT
// ============================================================

// ============================================================
// HISTORIQUE
// ============================================================




// ============================================================
// ONGLET VISUELS
// ============================================================

// ============================================================
// ONGLET MARQUE / FOURNISSEUR
// ============================================================







// ============================================================
// ONGLET GROUPE D'ATTRIBUTS GENERIQUE
// ============================================================

// ============================================================
// CHAMPS CALCULES — REFRESH
// ============================================================

// ============================================================
// EVENEMENTS CHAMPS
// ============================================================



// ============================================================
// COMPLETUDE
// ============================================================

// ============================================================
// SAUVEGARDE
// ============================================================
