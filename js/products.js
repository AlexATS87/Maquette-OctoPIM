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
function getColUniqueValues(code) {
  const vals = new Set();
  const searchVal = (document.getElementById('products-search') || {}).value || '';
  const catFilter = (document.getElementById('filter-cat') || {}).value || '';
  products.filter(p => {
    if (catFilter && p.cat !== catFilter) return false;
    computeCalcFields(p);
    const allText = Object.values(p.fields).join(' ').toLowerCase() + ' ' + (p.cat || '').toLowerCase();
    if (searchVal && !allText.includes(searchVal.toLowerCase())) return false;
    for (const c in colFilters) {
      if (c === code) continue;
      const allowed = colFilters[c];
      const val = (p.fields[c] || p[c] || '').toString().trim();
      if (!allowed.has(val)) return false;
    }
    return true;
  }).forEach(p => {
    const v = p.fields[code] !== undefined ? p.fields[code] : p[code];
    if (v !== undefined && v !== null && v.toString().trim() !== '')
      vals.add(v.toString().trim());
  });
  return [...vals].sort((a, b) => a.localeCompare(b, 'fr'));
}

function openColFilter(code, label, iconEl) {
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
      <label for="cfa-${code}" style="font-weight:600">Tout selectionner</label>
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

function clearAllFilters() {
  colFilters = {};
  _filterIncomplets = false;
  const search = document.getElementById('products-search');
  if (search) search.value = '';
  const cat = document.getElementById('filter-cat');
  if (cat) cat.value = '';
  renderProductsTable();
  showNotif('Filtres reinitialises');
}

function isColFilterActive(code) { return colFilters[code] !== undefined; }

function passesColFilters(product) {
  computeCalcFields(product);
  for (const code in colFilters) {
    const allowed = colFilters[code];
    const val = (product.fields[code] !== undefined ? product.fields[code] : product[code] || '').toString().trim();
    if (!allowed.has(val)) return false;
  }
  return true;
}

function hasActiveFilters() {
  const search = (document.getElementById('products-search') || {}).value || '';
  const cat    = (document.getElementById('filter-cat') || {}).value || '';
  return search !== '' || cat !== '' || Object.keys(colFilters).length > 0 || _filterIncomplets;
}

// ============================================================
// TABLEAU PRODUITS — POINT D'ENTREE
// ============================================================
function renderProductsTable() {
  const searchVal = (document.getElementById('products-search') || {}).value || '';
  const catFilter = (document.getElementById('filter-cat') || {}).value || '';

  let filtered = products.filter(p => {
    if (!(!catFilter || p.cat === catFilter)) return false;
    computeCalcFields(p);
    const allText = Object.values(p.fields).join(' ').toLowerCase() + ' ' + (p.cat || '').toLowerCase();
    if (searchVal && !allText.includes(searchVal.toLowerCase())) return false;
    if (!passesColFilters(p)) return false;
    if (_filterIncomplets && calcCompletion(p) >= seuilCompletion) return false;
    return true;
  });

  if (compareMode && selectedProductIds.length > 0)
    filtered = filtered.filter(p => selectedProductIds.includes(p.id));

  const thead = document.getElementById('products-thead');
  const tbody = document.getElementById('products-tbody');
  if (!thead || !tbody) return;

  // Bouton effacer filtres
  const clearBtn = document.getElementById('btn-clear-filters');
  if (clearBtn) clearBtn.style.display = hasActiveFilters() ? '' : 'none';

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
  const pageSize   = appPrefs.pageSize || 0;
  if (pageSize === 0) return;
  const totalPages = Math.ceil(products.length / pageSize);
  currentPage = Math.max(1, Math.min(n, totalPages));
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

  syntheseItems.forEach(item => {
    if (item.kind === 'action') {
      // Colonne action : pas de tri ni filtre
      const th = document.createElement('th');
      th.textContent = item.label;
      tr.appendChild(th);
    } else {
      // Colonne attribut
      const noSortCodes = ['visuel_face', 'cat'];
      if (noSortCodes.includes(item.code)) {
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
    let cells = `<td style="width:36px;text-align:center">
      <input type="checkbox" ${isSelected ? 'checked' : ''}
        onchange="toggleSelectProduct(${p.id},this)">
    </td>`;

    syntheseItems.forEach(item => {
      if (item.kind === 'action' && item.code === 'delete') {
        cells += `<td>
          <button class="action-btn-danger"
            onclick="confirmDelete('product',${p.id},'${nom.replace(/'/g, "\\'")}')">
            Suppr.
          </button>
        </td>`;
      } else if (item.kind === 'attr') {
        cells += renderSynthCell(p, item, comp);
      }
    });

    tr.innerHTML = cells;
    tbody.appendChild(tr);
  });
}

function renderSynthCell(p, item, comp) {
  const code = item.code;

  // Cas spéciaux
  if (code === 'visuel_face') {
    return `<td style="padding:6px 10px">${visualThumb(p, 40)}</td>`;
  }
  if (code === 'cat') {
    return `<td><span class="badge" style="${getCatBadgeStyle(p.cat)}">${p.cat}</span></td>`;
  }
  if (code === 'completion') {
    return `<td>
      <div class="inline-bar">
        <div class="inline-bar-bg">
          <div class="inline-bar-fill" style="width:${comp}%;background:${getCompletionColor(comp)}"></div>
        </div>
        <span style="font-size:12px;color:#607080">${comp}%</span>
      </div>
    </td>`;
  }
  if (code === 'createdAt' || code === 'maj') {
    return `<td style="white-space:nowrap">${p[code] || '—'}</td>`;
  }
  if (code === 'miseEnLigne') {
    return `<td style="white-space:nowrap">${p.fields.miseEnLigne || '—'}</td>`;
  }

  // Attribut cliquable (ouvre la fiche)
  const attr = attributes.find(a => a.code === code);
  const val  = p.fields[code] || '—';
  if (attr && attr.clickToOpen) {
    return `<td class="td-name">
      <span class="product-link" onclick="openProductDetail(${p.id})">${val}</span>
    </td>`;
  }

  return `<td style="white-space:nowrap">${val}</td>`;
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

function renderDetailHeader(thead) {
  thead.innerHTML = '';
  initGroupFilters();
  const catGroups    = getGroupsForCurrentCat();
  const visibleGroups = catGroups.filter(g => activeGroupFilters.has(g.id) && g.code !== 'visuels');
  const row1 = document.createElement('tr');
  const row2 = document.createElement('tr');

  // Colonnes fixes
  [
    { label: '',           cb: true,   noSort: true },
    { label: 'Visuel',     noSort: true },
    { label: 'Code SAP',   code: 'sap' },
    { label: 'Nom produit',code: 'nom' },
    { label: 'Categorie',  noSort: true },
    { label: 'Completion', code: 'completion' },
    { label: 'Actions',    noSort: true },
  ].forEach(col => {
    const th = document.createElement('th');
    th.rowSpan = 2;
    if (col.cb) {
      th.style.width = '36px';
      th.innerHTML = '<input type="checkbox" onchange="toggleSelectAll(this)">';
    } else if (col.noSort || !col.code) {
      th.textContent = col.label;
    } else {
      th.appendChild(makeSortFilterTh(col.label, col.code));
    }
    row1.appendChild(th);
  });

  // Groupes d'attributs
  visibleGroups.forEach(g => {
    const groupAttrs = g.attrIds.map(id => getAttrById(id)).filter(Boolean);
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
        <span onclick="sortTableByCode('${attr.code}')" style="cursor:pointer;flex:1">
          ${attr.name}${attr.calc ? `<span style="font-size:10px;color:#ffa726" title="${attr.formulaLabel || ''}">&#9654;</span>` : ''}
        </span>
        <span class="th-filter-icon${isFiltered ? ' filter-active' : ''}"
          title="Filtrer" onclick="openColFilter('${attr.code}','${attr.name}',this)">&#9663;</span>
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
  const visibleGroups = catGroups.filter(g => activeGroupFilters.has(g.id) && g.code !== 'visuels');

  // Valeurs pour comparaison
  const allValues = {};
  if (compareMode && filtered.length > 1) {
    visibleGroups.forEach(g => g.attrIds.forEach(aid => {
      const attr = getAttrById(aid);
      if (!attr) return;
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

    let cells = `
      <td style="width:36px;text-align:center">
        <input type="checkbox" ${isSelected ? 'checked' : ''}
          onchange="toggleSelectProduct(${p.id},this)">
      </td>
      <td style="padding:6px 10px">${visualThumb(p, 36)}</td>
      <td style="white-space:nowrap;font-size:12px">${p.fields.sap || '—'}</td>
      <td class="td-name">
        <span class="product-link" onclick="openProductDetail(${p.id})">${nom}</span>
      </td>
      <td><span class="badge" style="${getCatBadgeStyle(p.cat)}">${p.cat}</span></td>
      <td>
        <div class="inline-bar">
          <div class="inline-bar-bg">
            <div class="inline-bar-fill" style="width:${comp}%;background:${getCompletionColor(comp)}"></div>
          </div>
          <span style="font-size:12px;color:#607080">${comp}%</span>
        </div>
      </td>
      <td>
        <div class="td-actions">
          <button class="action-btn-danger"
            onclick="confirmDelete('product',${p.id},'${nom.replace(/'/g, "\\'")}')">
            Suppr.
          </button>
        </div>
      </td>`;

    visibleGroups.forEach(g => {
      const color = getGroupColor(g);
      g.attrIds.map(id => getAttrById(id)).filter(Boolean).forEach(attr => {
        const val    = p.fields[attr.code] !== undefined && p.fields[attr.code] !== '' ? p.fields[attr.code] : '—';
        let isDiff   = false;
        if (compareMode && allValues[attr.code])
          isDiff = new Set(allValues[attr.code].map(v => v.toString().trim())).size > 1;
        cells += `<td style="white-space:nowrap;font-size:12px;background:${isDiff ? '#fff9c4' : color.bg + '55'}">${val}</td>`;
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
  if (selectedProductIds.length < 1) { container.innerHTML = ''; compareMode = false; return; }

  const massActions = selectedProductIds.length >= 1 ? `
    <div style="display:flex;gap:8px;align-items:center">
      <select id="mass-action-select" class="filter-select" style="font-size:12px;padding:5px 10px">
        <option value="">-- Action groupee --</option>
        <option value="delete">Supprimer la selection</option>
        <option value="export">Exporter la selection</option>
      </select>
      <button class="btn btn-primary" style="font-size:12px;padding:6px 14px"
        onclick="applyMassAction()">Appliquer</button>
    </div>` : '';

  container.innerHTML = `<div class="compare-bar">
    <span>${selectedProductIds.length} produit${selectedProductIds.length > 1 ? 's' : ''} selectionne${selectedProductIds.length > 1 ? 's' : ''}</span>
    <div style="display:flex;gap:10px;align-items:center">
      ${massActions}
      ${selectedProductIds.length >= 2
        ? compareMode
          ? `<button class="btn btn-secondary" style="font-size:12px;padding:6px 14px"
               onclick="exitCompare()">Quitter la comparaison</button>`
          : `<button class="btn btn-primary" style="font-size:12px;padding:6px 14px"
               onclick="enterCompare()">Comparer</button>`
        : ''}
      <button class="btn btn-secondary" style="font-size:12px;padding:6px 14px"
        onclick="clearSelection()">Effacer</button>
    </div>
  </div>`;
}

function applyMassAction() {
  const sel = document.getElementById('mass-action-select');
  if (!sel || !sel.value) { showNotif('Veuillez choisir une action'); return; }
  if (sel.value === 'delete') {
    if (!selectedProductIds.length) return;
    pendingDelete = { type: 'mass', ids: [...selectedProductIds] };
    document.getElementById('confirm-delete-text').textContent =
      `Supprimer ${selectedProductIds.length} produit${selectedProductIds.length > 1 ? 's' : ''} ?`;
    document.getElementById('confirm-delete-btn').onclick = executeMassDelete;
    openModal('modal-confirm-delete');
  } else if (sel.value === 'export') {
    captureExportSnapshot();
    showPage('exports', document.querySelector('.nav-item[onclick*="exports"]'));
    showNotif('Selection exportable : ' + selectedProductIds.length + ' produits');
  }
}

function executeMassDelete() {
  if (!pendingDelete || pendingDelete.type !== 'mass') return;
  products = products.filter(p => !pendingDelete.ids.includes(p.id));
  selectedProductIds = [];
  compareMode = false;
  closeModal('modal-confirm-delete');
  renderAll();
  showNotif(pendingDelete.ids.length + ' produit(s) supprimes');
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
      showNotif('Veuillez selectionner une categorie pour acceder a la vue detaillee');
      return;
    }
  }
  currentView = mode;
  currentPage = 1;

  // Toggle pill
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

function filterTable() { _filterIncomplets = false; currentPage = 1; renderProductsTable(); }

// ============================================================
// TRI
// ============================================================
function sortTableByCode(code) {
  const tb = document.getElementById('products-tbody');
  if (!tb) return;
  const rows = Array.from(tb.querySelectorAll('tr'));
  const dir  = (sortState.code === code && sortState.dir === 'asc') ? 'desc' : 'asc';
  sortState  = { code, dir };
  rows.sort((a, b) => {
    const getCb = row => row.querySelector('input[type=checkbox]');
    const ma = getCb(a) && getCb(a).getAttribute('onchange') && getCb(a).getAttribute('onchange').match(/\d+/);
    const mb = getCb(b) && getCb(b).getAttribute('onchange') && getCb(b).getAttribute('onchange').match(/\d+/);
    const pa = ma ? products.find(p => p.id === parseInt(ma[0])) : null;
    const pb = mb ? products.find(p => p.id === parseInt(mb[0])) : null;
    if (!pa || !pb) return 0;
    let va, vb;
    if (code === 'completion') {
      va = calcCompletion(pa); vb = calcCompletion(pb);
      return dir === 'asc' ? va - vb : vb - va;
    }
    va = pa.fields[code] !== undefined ? pa.fields[code] : (pa[code] || '');
    vb = pb.fields[code] !== undefined ? pb.fields[code] : (pb[code] || '');
    const na = parseFloat(va), nb = parseFloat(vb);
    if (!isNaN(na) && !isNaN(nb)) return dir === 'asc' ? na - nb : nb - na;
    return dir === 'asc'
      ? va.toString().localeCompare(vb.toString(), 'fr')
      : vb.toString().localeCompare(va.toString(), 'fr');
  });
  rows.forEach(r => tb.appendChild(r));
}

// ============================================================
// GROUPES FILTRES (vue détaillée)
// ============================================================
function renderGroupFilterBar() {
  const bar = document.getElementById('group-filter-bar-container');
  if (!bar) return;
  if (currentView !== 'detail') { bar.innerHTML = ''; return; }
  initGroupFilters();
  const groups = getVisibleGroupsForUser();
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
  const sapEl  = document.getElementById('np-sap');
  const eanEl  = document.getElementById('np-ean');
  const nameEl = document.getElementById('np-name');
  const catEl  = document.getElementById('np-cat');
  const sap    = sapEl.value.trim();
  const ean    = eanEl.value.trim();
  const name   = nameEl.value.trim();
  const cat    = catEl.value;
  let valid    = true;

  ['np-sap', 'np-ean', 'np-name', 'np-cat'].forEach(id => {
    const el    = document.getElementById(id);
    const errEl = document.getElementById('err-' + id);
    if (el)    el.classList.remove('field-error');
    if (errEl) errEl.classList.remove('show');
  });

  if (!sap)  { document.getElementById('np-sap').classList.add('field-error');  document.getElementById('err-np-sap').classList.add('show');  valid = false; }
  if (!ean)  { document.getElementById('np-ean').classList.add('field-error');  document.getElementById('err-np-ean').classList.add('show');  valid = false; }
  if (!name) { document.getElementById('np-name').classList.add('field-error'); document.getElementById('err-np-name').classList.add('show'); valid = false; }
  if (!cat)  { document.getElementById('np-cat').classList.add('field-error');  document.getElementById('err-np-cat').classList.add('show');  valid = false; }
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
  showNotif('Produit "' + name + '" cree — ouverture de la fiche');

  // Etape 2 : ouvre directement la fiche pour compléter
  setTimeout(() => openProductDetail(newProduct.id), 300);
}

// ============================================================
// FICHE PRODUIT — OUVERTURE
// ============================================================
function openProductDetail(id) {
  currentProductId = id;
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (!p.history)        p.history = [];
  if (!p.pendingChanges) p.pendingChanges = [];
  computeCalcFields(p);
  productDirty = false;
  const cat = getCatByName(p.cat);
  renderProductHeader(p, cat);
  renderProductTabs(p, cat);
  updateDetailCompletion(p);
  showPage('product-detail', null);
}

// ============================================================
// INTERCEPTION NAVIGATION — POP-UP DIRTY
// ============================================================
function safeShowPage(id, navEl) {
  if (productDirty && currentProductId) {
    pendingNavTarget = { id, navEl };
    openModal('modal-unsaved');
  } else {
    productDirty = false;
    currentProductId = null;
    showPage(id, navEl);
  }
}

function confirmLeaveUnsaved() {
  const p = products.find(x => x.id === currentProductId);
  if (p) p.pendingChanges = [];
  productDirty = false;
  currentProductId = null;
  closeModal('modal-unsaved');
  if (pendingNavTarget) {
    showPage(pendingNavTarget.id, pendingNavTarget.navEl);
    pendingNavTarget = null;
  }
}

function cancelLeaveUnsaved() {
  closeModal('modal-unsaved');
  pendingNavTarget = null;
}

// ============================================================
// HEADER PRODUIT
// ============================================================
function renderProductHeader(p, cat) {
  const headerLeft = document.getElementById('product-header-left');
  if (!headerLeft) return;
  const nom          = p.fields.nom || '—';
  const activeGlobal = calcActiveGlobal(p);
  const etatVisuel   = calcEtatVisuel(p);
  const brandInfo    = getBrandInfoForProduct(p);

  headerLeft.innerHTML = `<div style="display:flex;align-items:flex-start;gap:16px">
    <div onclick="triggerVisualUpload(${p.id},'visuel_face')"
      style="width:90px;height:90px;border-radius:10px;border:2px dashed #c0d0e0;overflow:hidden;
             cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;
             background:#f8fafc;" title="Cliquer pour modifier le visuel face">
      ${p.fields.visuel_face
        ? `<img src="${p.fields.visuel_face}" style="width:100%;height:100%;object-fit:cover;">`
        : `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;color:#c0d0e0">
             <span style="font-size:28px">&#128247;</span>
             <span style="font-size:10px">Ajouter</span>
           </div>`}
    </div>
    <div style="flex:1">
      <div class="product-title">${nom}</div>
      <div class="product-meta">
        <span>SAP : ${p.fields.sap || '—'}</span>
        <span>EAN : ${p.fields.ean || '—'}</span>
        <span><span class="badge" style="${getCatBadgeStyle(p.cat)}">${p.cat}</span></span>
        <span><span class="${activeGlobal === 'Actif' ? 'badge-active-on' : 'badge-active-off'}">${activeGlobal}</span></span>
        <span><span class="${etatVisuel === 'Oui' ? 'badge-etat-ok' : 'badge-etat-ko'}">Visuels : ${etatVisuel}</span></span>
        ${brandInfo
          ? `<span style="font-size:12px;color:#607080">${brandInfo.sup} / ${brandInfo.marque} —
               Remise ATS : <strong style="color:#1565c0">${(brandInfo.remiseAts * 100).toFixed(0)}%</strong>
             </span>`
          : ''}
        <span style="color:#a0b0c0">Cree le ${p.createdAt || '—'}</span>
      </div>
    </div>
  </div>`;
}

function getBrandInfoForProduct(p) {
  if (!p.fields.fournisseur_code || !p.fields.marque) return null;
  const b = brandSettings.find(x => x.fournisseurCode === p.fields.fournisseur_code && x.marque === p.fields.marque);
  if (!b) return null;
  const sup = suppliers.find(s => s.code === b.fournisseurCode);
  return { ...b, sup: sup ? sup.name : b.fournisseurCode };
}

function calcActiveGlobal(p) {
  const f = p.fields;
  return ((f.active_o2 || '').toLowerCase() === 'oui' || (f.active_lissac || '').toLowerCase() === 'oui') ? 'Actif' : 'Inactif';
}

function calcEtatVisuel(p) {
  return (p.fields.visuel_face && p.fields.visuel_tq && p.fields.visuel_profil) ? 'Oui' : 'Non';
}

// ============================================================
// UPLOAD VISUEL
// ============================================================
function triggerVisualUpload(productId, attrCode) {
  const input   = document.createElement('input');
  input.type    = 'file';
  input.accept  = 'image/*';
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      const p = products.find(x => x.id === productId);
      if (!p) return;
      const old = p.fields[attrCode] ? '(visuel existant)' : '(vide)';
      p.fields[attrCode] = ev.target.result;
      if (attrCode === 'visuel_face') p.visualSrc = ev.target.result;
      const visualCodes = ['visuel_face', 'visuel_tq', 'visuel_profil', 'visuel_ambiance', 'visuel_fournisseur'];
      p.visuals = visualCodes.filter(c => p.fields[c]).length;
      const attr = attributes.find(a => a.code === attrCode);
      addPendingChange(p, attr ? attr.name : attrCode, old, '(visuel uploade)');
      renderProductHeader(p, getCatByName(p.cat));
      refreshVisuelSlot(p, attrCode);
      updateDetailCompletion(p);
      renderProductsTable();
      productDirty = true;
      showNotif('Visuel mis a jour : ' + (attr ? attr.name : attrCode));
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function refreshVisuelSlot(p, attrCode) {
  const slot = document.querySelector(`[data-visuel-code="${attrCode}"]`);
  if (!slot) return;
  const img         = slot.querySelector('.image-attr-preview');
  const placeholder = slot.querySelector('.image-attr-placeholder');
  if (p.fields[attrCode]) {
    if (img) { img.src = p.fields[attrCode]; }
    else if (placeholder) {
      const newImg    = document.createElement('img');
      newImg.src      = p.fields[attrCode];
      newImg.className = 'image-attr-preview';
      newImg.onclick  = () => triggerVisualUpload(p.id, attrCode);
      placeholder.replaceWith(newImg);
    }
  }
}

// ============================================================
// ONGLETS PRODUIT
// ============================================================
function renderProductTabs(p, cat) {
  const tabsEl     = document.getElementById('product-tabs');
  const contentsEl = document.getElementById('product-tab-contents');
  tabsEl.innerHTML = '';
  contentsEl.innerHTML = '';
  const groupIds = cat ? cat.groupIds : [1];
  const tabs     = groupIds.map(gid => getGroupById(gid)).filter(Boolean);
  const allTabs  = [...tabs, { id: 'hist', name: 'Historique', _isHist: true }];

  allTabs.forEach((g, i) => {
    const tabEl       = document.createElement('div');
    tabEl.className   = 'tab' + (i === 0 ? ' active' : '');
    tabEl.textContent = g.name;
    tabEl.onclick     = (function(gid) {
      return function() {
        document.querySelectorAll('#product-tabs .tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#product-tab-contents .tab-content').forEach(t => t.classList.remove('active'));
        tabEl.classList.add('active');
        const c = document.getElementById('tab-group-' + gid);
        if (c) c.classList.add('active');
      };
    })(g.id);
    tabsEl.appendChild(tabEl);

    const content     = document.createElement('div');
    content.className = 'tab-content' + (i === 0 ? ' active' : '');
    content.id        = 'tab-group-' + g.id;

    if (g._isHist)              content.innerHTML = renderTabHistory(p);
    else if (g.code === 'infos_generales') content.innerHTML = renderTabGeneral(p);
    else if (g.code === 'visuels')         content.innerHTML = renderTabVisuels(p);
    else if (g.isBrandGroup)               content.innerHTML = renderTabMarque(p, g);
    else                                   content.innerHTML = renderTabAttrGroup(p, g);

    contentsEl.appendChild(content);
  });
}

// ============================================================
// HISTORIQUE
// ============================================================
function renderTabHistory(p) {
  const history = p.history || [];
  if (!history.length)
    return '<div style="color:#a0b0c0;font-size:13px;padding:20px">Aucune modification enregistree.</div>';
  let rows = '';
  [...history].reverse().forEach(h => {
    rows += `<tr>
      <td style="white-space:nowrap;color:#607080">${h.ts}</td>
      <td><span style="font-weight:600;color:#1a2332">${h.user}</span></td>
      <td><span class="history-field-badge">${h.field}</span></td>
      <td>
        <span class="history-val-old">${h.old || '(vide)'}</span>
        <span class="history-arrow">→</span>
        <span class="history-val-new">${h.new || '(vide)'}</span>
      </td>
    </tr>`;
  });
  return `<div style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,0.07)">
    <table class="history-table">
      <thead><tr><th>Date</th><th>Utilisateur</th><th>Champ</th><th>Modification</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function addPendingChange(p, fieldName, oldVal, newVal) {
  if (!p.pendingChanges) p.pendingChanges = [];
  if (String(oldVal || '') === String(newVal || '')) return;
  const existing = p.pendingChanges.find(c => c.field === fieldName);
  if (existing) { existing.new = String(newVal || ''); }
  else { p.pendingChanges.push({ field: fieldName, old: String(oldVal || ''), new: String(newVal || '') }); }
}

function flushPendingChanges(p) {
  if (!p.pendingChanges || !p.pendingChanges.length) return;
  const ts = nowStr();
  p.pendingChanges.forEach(c => {
    if (c.old !== c.new) p.history.push({ ts, user: 'J. Doe', field: c.field, old: c.old, new: c.new });
  });
  p.pendingChanges = [];
}

// ============================================================
// ONGLET INFOS GENERALES
// ============================================================
function renderTabGeneral(p) {
  return `<div class="fields-grid">
    <div class="field-group">
      <div class="field-group-title">Identification</div>
      <div class="field-row">
        <div class="field-label">Code SAP <span class="field-required">*</span></div>
        <input class="field-input" id="fi-sap-${p.id}" value="${p.fields.sap || ''}"
          oninput="onFieldChange(${p.id},this,'sap')">
      </div>
      <div class="field-row">
        <div class="field-label">Code EAN <span class="field-required">*</span></div>
        <input class="field-input" id="fi-ean-${p.id}" value="${p.fields.ean || ''}"
          oninput="onFieldChange(${p.id},this,'ean')">
      </div>
      <div class="field-row">
        <div class="field-label">Nom produit <span class="field-required">*</span></div>
        <input class="field-input" value="${p.fields.nom || ''}"
          oninput="onFieldChange(${p.id},this,'nom')">
      </div>
      <div class="field-row">
        <div class="field-label">Categorie</div>
        <select class="field-input form-select" onchange="onCatChange(${p.id},this)">
          ${categories.map(c => `<option${c.name === p.cat ? ' selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="field-group">
      <div class="field-group-title">Dates</div>
      <div class="field-row">
        <div class="field-label">Date de creation</div>
        <input class="field-input" style="background:#f0f4f8;color:#a0b0c0"
          value="${p.createdAt || ''}" readonly>
      </div>
      <div class="field-row">
        <div class="field-label">Date de mise en ligne</div>
        <input class="field-input" style="font-family:monospace"
          value="${p.fields.miseEnLigne || ''}" placeholder="jj/mm/aaaa" maxlength="10"
          oninput="onDateMaskInput(this);onFieldChange(${p.id},this,'miseEnLigne')">
      </div>
      <div class="field-row">
        <div class="field-label">Derniere MAJ</div>
        <input class="field-input" style="background:#f0f4f8;color:#a0b0c0"
          value="${p.maj || ''}" readonly>
      </div>
    </div>
  </div>`;
}

// Applique les masques de saisie après rendu de l'onglet général
function applyGeneralMasks(p) {
  const sapEl = document.getElementById('fi-sap-' + p.id);
  const eanEl = document.getElementById('fi-ean-' + p.id);
  const sapAttr = attributes.find(a => a.code === 'sap');
  const eanAttr = attributes.find(a => a.code === 'ean');
  if (sapEl && sapAttr && sapAttr.mask) applyInputMask(sapEl, sapAttr.mask);
  if (eanEl && eanAttr && eanAttr.mask) applyInputMask(eanEl, eanAttr.mask);
}

function onDateMaskInput(el) {
  let v = el.value.replace(/\D/g, '');
  if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
  if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5);
  el.value = v.slice(0, 10);
}

// ============================================================
// ONGLET VISUELS
// ============================================================
function renderTabVisuels(p) {
  const visualAttrs = [
    { code: 'visuel_face',        name: 'Vue de face',         required: true  },
    { code: 'visuel_tq',          name: 'Vue 3/4',             required: true  },
    { code: 'visuel_profil',      name: 'Vue de profil',       required: true  },
    { code: 'visuel_ambiance',    name: 'Visuel ambiance',     required: false },
    { code: 'visuel_fournisseur', name: 'Visuel fournisseur',  required: false },
  ];
  let slots = '';
  visualAttrs.forEach(va => {
    const hasImg = !!p.fields[va.code];
    slots += `<div class="image-attr-slot" data-visuel-code="${va.code}">
      ${hasImg
        ? `<img src="${p.fields[va.code]}" class="image-attr-preview"
             onclick="triggerVisualUpload(${p.id},'${va.code}')" title="Cliquer pour modifier">`
        : `<div class="image-attr-placeholder" onclick="triggerVisualUpload(${p.id},'${va.code}')">
             <span style="font-size:32px">&#128247;</span>
             <span style="font-size:12px">Cliquer pour ajouter</span>
           </div>`}
      <div class="image-attr-label">${va.name}</div>
      <div class="image-attr-badges">
        ${va.required
          ? '<span class="visual-badge-required">Obligatoire</span>'
          : '<span class="visual-badge-optional">Optionnel</span>'}
      </div>
    </div>`;
  });
  return `<div style="background:#fff3e0;border-radius:8px;padding:12px 16px;margin-bottom:20px;
    font-size:13px;color:#e65100;border-left:4px solid #ffa726">
    3 visuels obligatoires (Face, 3/4, Profil). Formats : JPG, PNG — 2000x2000px minimum.
  </div>
  <div class="image-attrs-grid">${slots}</div>`;
}

// ============================================================
// ONGLET MARQUE / FOURNISSEUR
// ============================================================
function matchBrandType(brandType, catName) {
  if (!brandType) return true;
  const norm = s => s.toLowerCase().replace(/s$/, '').trim();
  return norm(brandType) === norm(catName);
}

function renderTabMarque(p, g) {
  computeCalcFields(p);
  const catName = p.cat;
  const eligibleSupCodes = [...new Set(
    brandSettings.filter(b => !b.type || matchBrandType(b.type, catName)).map(b => b.fournisseurCode)
  )];
  const eligibleSuppliers = suppliers.filter(s => eligibleSupCodes.includes(s.code));
  const supOptions = eligibleSuppliers.map(s =>
    `<option value="${s.code}"${p.fields.fournisseur_code === s.code ? ' selected' : ''}>${s.name} (${s.code})</option>`
  ).join('');
  const currentSup = p.fields.fournisseur_code || '';
  const availableMarques = [...new Set(
    brandSettings
      .filter(b => (!currentSup || b.fournisseurCode === currentSup) && (!b.type || matchBrandType(b.type, catName)))
      .map(b => b.marque)
  )].sort();
  const marqueOptions = availableMarques.map(m =>
    `<option${p.fields.marque === m ? ' selected' : ''}>${m}</option>`
  ).join('');
  const brandInfo = getBrandInfoForProduct(p);

  return `<div class="fields-grid">
    <div class="field-group">
      <div class="field-group-title">Couple Fournisseur / Marque</div>
      <div style="font-size:12px;color:#a0b0c0;margin-bottom:12px">
        Filtre sur la categorie : <strong style="color:#607080">${catName}</strong>
      </div>
      <div class="field-row">
        <div class="field-label">Fournisseur</div>
        <select class="field-input form-select" id="detail-fournisseur-${p.id}"
          onchange="onFournisseurChange(${p.id},this)">
          <option value="">-- Choisir --</option>${supOptions}
        </select>
      </div>
      <div class="field-row">
        <div class="field-label">Marque <span class="field-required">*</span></div>
        <select class="field-input form-select" id="detail-marque-${p.id}"
          onchange="onMarqueChange(${p.id},this)">
          <option value="">-- Choisir --</option>${marqueOptions}
        </select>
      </div>
    </div>
    <div class="field-group" id="brand-info-panel-${p.id}">
      ${renderBrandInfoPanel(brandInfo)}
    </div>
  </div>`;
}

function renderBrandInfoPanel(brandInfo) {
  if (!brandInfo) {
    return `<div class="field-group-title">Conditions commerciales</div>
      <div style="color:#a0b0c0;font-size:13px;padding:8px">
        Selectionnez un fournisseur et une marque pour afficher les conditions.
      </div>`;
  }
  const rows = [
    { label: 'Fournisseur',          val: brandInfo.sup },
    { label: 'RF',                   val: brandInfo.rf > 0 ? (brandInfo.rf * 100).toFixed(2) + '%' : '—' },
    { label: 'RFA',                  val: brandInfo.rfa > 0 ? (brandInfo.rfa * 100).toFixed(2) + '%' : '—' },
    { label: 'Remise ATS',           val: `<strong style="color:#1565c0;font-size:14px">${(brandInfo.remiseAts * 100).toFixed(0)}%</strong>` },
    { label: 'Reprise echange',      val: brandInfo.repriseEchange ? '<span class="badge-active-on">Oui</span>' : '<span class="badge-active-off">Non</span>' },
    { label: 'Conditions livraison', val: brandInfo.conditionsLivraison || '—' },
    { label: 'Commentaire',          val: brandInfo.commentaire ? `<span style="font-size:12px;color:#607080">${brandInfo.commentaire}</span>` : '—' },
  ];
  let html = `<div class="field-group-title">Conditions — ${brandInfo.marque}</div>`;
  rows.forEach(r => {
    html += `<div class="field-row" style="display:flex;justify-content:space-between;align-items:center;
      padding:5px 0;border-bottom:1px solid #f0f4f8">
      <div class="field-label" style="margin:0;flex:1">${r.label}</div>
      <div style="font-size:13px;color:#1a2332;text-align:right">${r.val}</div>
    </div>`;
  });
  return html;
}

function onFournisseurChange(productId, el) {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  const oldVal = p.fields.fournisseur_code || '';
  p.fields.fournisseur_code = el.value;
  addPendingChange(p, 'Fournisseur', oldVal, el.value);
  productDirty = true;
  const catName      = p.cat;
  const marqueSelect = document.getElementById('detail-marque-' + productId);
  if (marqueSelect) {
    const available = [...new Set(
      brandSettings
        .filter(b => (!el.value || b.fournisseurCode === el.value) && (!b.type || matchBrandType(b.type, catName)))
        .map(b => b.marque)
    )].sort();
    marqueSelect.innerHTML = '<option value="">-- Choisir --</option>' +
      available.map(m => `<option${p.fields.marque === m ? ' selected' : ''}>${m}</option>`).join('');
  }
  const stillValid = brandSettings.some(b => b.fournisseurCode === el.value && b.marque === p.fields.marque);
  if (!stillValid) p.fields.marque = '';
  refreshBrandInfoPanel(p);
  renderProductHeader(p, getCatByName(p.cat));
}

function onMarqueChange(productId, el) {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  const oldVal = p.fields.marque || '';
  p.fields.marque = el.value;
  addPendingChange(p, 'Marque', oldVal, el.value);
  productDirty = true;
  refreshBrandInfoPanel(p);
  renderProductHeader(p, getCatByName(p.cat));
}

function refreshBrandInfoPanel(p) {
  const panel = document.getElementById('brand-info-panel-' + p.id);
  if (!panel) return;
  panel.innerHTML = renderBrandInfoPanel(getBrandInfoForProduct(p));
}

// ============================================================
// ONGLET GROUPE D'ATTRIBUTS GENERIQUE
// ============================================================
function renderTabAttrGroup(p, g) {
  const attrs = g.attrIds.map(id => getAttrById(id)).filter(Boolean);
  if (!attrs.length)
    return '<div style="color:#a0b0c0;font-size:13px;padding:20px">Aucun attribut pour ce groupe.</div>';
  computeCalcFields(p);
  let html = '<div class="fields-grid"><div class="field-group">';
  attrs.forEach(a => {
    const val = p.fields[a.code] !== undefined ? p.fields[a.code] : '';
    let input = '';

    if (a.type === 'Image') {
      const hasImg = !!val;
      input = `<div class="image-attr-slot" data-visuel-code="${a.code}" style="max-width:200px">
        ${hasImg
          ? `<img src="${val}" class="image-attr-preview"
               onclick="triggerVisualUpload(${p.id},'${a.code}')" title="Cliquer pour modifier">`
          : `<div class="image-attr-placeholder" onclick="triggerVisualUpload(${p.id},'${a.code}')">
               <span style="font-size:28px">&#128247;</span>
               <span style="font-size:11px">Cliquer pour ajouter</span>
             </div>`}
        <div class="image-attr-badges">
          ${a.required
            ? '<span class="visual-badge-required">Obligatoire</span>'
            : '<span class="visual-badge-optional">Optionnel</span>'}
        </div>
      </div>`;
    } else if (a.calc) {
      input = `<div style="position:relative">
        <input class="field-input" style="background:#fffde7;color:#795548;padding-right:32px"
          value="${val}" readonly data-calc="${a.code}">
        <div style="position:absolute;right:8px;top:50%;transform:translateY(-50%);
          width:18px;height:18px;border-radius:50%;background:#ffd54f;color:#5d4037;
          font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;
          cursor:help" title="${a.formulaLabel || 'Champ calcule'}">&#9654;</div>
      </div>`;
    } else if (a.readonly) {
      input = `<input class="field-input" style="background:#f0f4f8;color:#a0b0c0" value="${val}" readonly>`;
    } else if (a.type === 'Simple select') {
      const opts = (a.options || []).map(o => `<option${o === val ? ' selected' : ''}>${o}</option>`).join('');
      input = `<select class="field-input form-select"
        onchange="onFieldChange(${p.id},this,'${a.code}');refreshCalcFields(${p.id})">
        <option value="">-- Choisir --</option>${opts}
      </select>`;
    } else if (a.type === 'Multi select') {
      const opts = (a.options || []).map(o => `<option${(val || '').includes(o) ? ' selected' : ''}>${o}</option>`).join('');
      input = `<select class="field-input form-select" multiple
        onchange="onMultiSelectChange(${p.id},this,'${a.code}')">${opts}</select>`;
    } else if (a.type === 'Oui / Non') {
      input = `<select class="field-input form-select"
        onchange="onFieldChange(${p.id},this,'${a.code}')">
        <option value="">-- Choisir --</option>
        <option${val === 'Oui' ? ' selected' : ''}>Oui</option>
        <option${val === 'Non' ? ' selected' : ''}>Non</option>
      </select>`;
    } else if (a.type === 'Texte long') {
      input = `<textarea class="field-input" rows="3"
        oninput="onFieldChange(${p.id},this,'${a.code}')">${val}</textarea>`;
    } else if (a.type === 'Nombre' || a.type === 'Nombre decimal') {
      input = `<input class="field-input" type="number" value="${val}"
        oninput="onFieldChange(${p.id},this,'${a.code}');refreshCalcFields(${p.id})">`;
    } else if (a.type === 'Date') {
      input = `<input class="field-input" style="font-family:monospace" value="${val}"
        placeholder="jj/mm/aaaa" maxlength="10"
        oninput="onDateMaskInput(this);onFieldChange(${p.id},this,'${a.code}')">`;
    } else {
      // Texte avec masque éventuel
      const maskAttr = a.mask ? `id="fi-${a.code}-${p.id}"` : '';
      input = `<input class="field-input" ${maskAttr} value="${val}"
        oninput="onFieldChange(${p.id},this,'${a.code}');refreshCalcFields(${p.id})">`;
    }

    html += `<div class="field-row">
      <div class="field-label">${a.name}${a.required ? ' <span class="field-required">*</span>' : ''}</div>
      ${input}
    </div>`;
  });

  html += '</div></div>';

  // Applique les masques après rendu (via setTimeout pour laisser le DOM se mettre à jour)
  setTimeout(() => {
    attrs.forEach(a => {
      if (a.mask && !a.calc && !a.readonly) {
        const el = document.getElementById('fi-' + a.code + '-' + p.id);
        if (el) applyInputMask(el, a.mask);
      }
    });
  }, 0);

  return html;
}

// ============================================================
// CHAMPS CALCULES — REFRESH
// ============================================================
function refreshCalcFields(productId) {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  computeCalcFields(p);
  document.querySelectorAll('[data-calc]').forEach(el => {
    const code = el.getAttribute('data-calc');
    if (p.fields[code] !== undefined) el.value = p.fields[code];
  });
  updateDetailCompletion(p);
}

// ============================================================
// EVENEMENTS CHAMPS
// ============================================================
function onFieldChange(productId, el, fieldKey) {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  const oldVal = p.fields[fieldKey] !== undefined ? p.fields[fieldKey] : '';
  const newVal = el.value;
  p.fields[fieldKey] = newVal;
  const attr = attributes.find(a => a.code === fieldKey);
  addPendingChange(p, attr ? attr.name : fieldKey, oldVal, newVal);
  productDirty = true;
  if (fieldKey === 'nom') {
    const t = document.querySelector('.product-title');
    if (t) t.textContent = newVal;
  }
  computeCalcFields(p);
  updateDetailCompletion(p);
  renderProductHeader(p, getCatByName(p.cat));
}

function onMultiSelectChange(productId, el, fieldKey) {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  const oldVal = p.fields[fieldKey] || '';
  const newVal = Array.from(el.selectedOptions).map(o => o.value).join(', ');
  p.fields[fieldKey] = newVal;
  const attr = attributes.find(a => a.code === fieldKey);
  addPendingChange(p, attr ? attr.name : fieldKey, oldVal, newVal);
  productDirty = true;
  updateDetailCompletion(p);
}

function onCatChange(productId, el) {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  const oldCat = p.cat;
  p.cat = el.value;
  addPendingChange(p, 'Categorie', oldCat, el.value);
  productDirty = true;
  renderProductTabs(p, getCatByName(p.cat));
  renderProductHeader(p, getCatByName(p.cat));
  updateDetailCompletion(p);
}

// ============================================================
// COMPLETUDE
// ============================================================
function updateDetailCompletion(p) {
  const comp  = calcCompletion(p);
  const color = getCompletionColor(comp);
  const pctEl = document.getElementById('detail-completion-pct');
  const barEl = document.getElementById('detail-completion-bar');
  const subEl = document.getElementById('detail-completion-sub');
  if (pctEl) { pctEl.textContent = comp + '%'; pctEl.style.color = color; }
  if (barEl) { barEl.style.width = comp + '%'; barEl.style.background = color; }
  const attrs = getAttrsForCat(p.cat).filter(a => !a.calc && !a.readonly && a.required);
  const total  = attrs.length + 1;
  const filled = Math.round(comp * total / 100);
  if (subEl) subEl.textContent = `${filled} / ${total} champs renseignes`;
}

// ============================================================
// SAUVEGARDE
// ============================================================
function saveProduct() {
  const p = products.find(x => x.id === currentProductId);
  if (!p) return;
  p.maj = nowStr();
  flushPendingChanges(p);
  productDirty = false;
  const histTab = document.getElementById('tab-group-hist');
  if (histTab) histTab.innerHTML = renderTabHistory(p);
  renderProductsTable();
  renderDashboard();
  showNotif('Produit enregistre — ' + p.maj);
}
