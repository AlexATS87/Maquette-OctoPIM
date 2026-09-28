// ============================================================
// EXPORT.JS — Export .xlsx via SheetJS
// ============================================================

// ============================================================
// POINT D'ENTREE — RENDU PAGE EXPORT
// ============================================================
function renderExportPage() {
  captureExportSnapshot();
  const page = document.getElementById('page-exports');
  if (!page) return;

  const catFilter  = exportSnapshot.catFilter  || '';
  const searchVal  = exportSnapshot.searchVal  || '';
  const hasFilters = catFilter || searchVal || Object.keys(exportSnapshot.colFilters).length > 0;

  // Produits correspondant au snapshot
  const filtered = getFilteredProductsFromSnapshot();
  const total    = filtered.length;

  // Colonnes disponibles selon la vue
  const synthCols  = getSyntheseExportCols();
  const detailCols = catFilter ? getDetailExportCols(catFilter) : [];

  page.innerHTML = `
    <div style="max-width:900px;margin:0 auto">

      <!-- En-tete -->
      <div style="margin-bottom:24px">
        <div style="font-size:18px;font-weight:700;color:#1a2332;margin-bottom:6px">Export produits</div>
        <div style="font-size:13px;color:#607080">
          Genere un fichier <strong>.xlsx</strong> avec les onglets
          <strong>Synthese</strong> et <strong>Informations generales</strong>.
          Export IWI : distributeur fixe
          <strong>${IWI_EXPORT_CONSTANTS.codeDistributeur}</strong>
          — ${IWI_EXPORT_CONSTANTS.nomDistributeur}.
          Prix 1 = PA ATS, prix 2 = prix catalogue.
        </div>
      </div>

      <!-- Contexte filtres -->
      <div style="background:#fff;border-radius:12px;padding:20px;
        box-shadow:0 1px 6px rgba(0,0,0,0.07);margin-bottom:20px">
        <div style="font-size:13px;font-weight:600;color:#1a2332;margin-bottom:12px">
          Perimetre de l'export
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
          <div class="export-context-chip">
            <span style="color:#607080">Produits</span>
            <strong style="color:#1a2332;margin-left:6px">${total}</strong>
          </div>
          ${catFilter
            ? `<div class="export-context-chip">
                 <span style="color:#607080">Categorie</span>
                 <span class="badge" style="${getCatBadgeStyle(catFilter)};margin-left:6px">${catFilter}</span>
               </div>`
            : '<div class="export-context-chip" style="color:#a0b0c0">Toutes categories</div>'}
          ${searchVal
            ? `<div class="export-context-chip">
                 <span style="color:#607080">Recherche</span>
                 <strong style="color:#1a2332;margin-left:6px">"${searchVal}"</strong>
               </div>`
            : ''}
          ${Object.keys(exportSnapshot.colFilters).length > 0
            ? `<div class="export-context-chip">
                 <span style="color:#ffa726">&#9660; ${Object.keys(exportSnapshot.colFilters).length} filtre(s) colonne actif(s)</span>
               </div>`
            : ''}
          ${selectedProductIds.length > 0
            ? `<div class="export-context-chip" style="background:#e3f2fd;border-color:#90caf9">
                 <span style="color:#1565c0">Selection : ${selectedProductIds.length} produit(s)</span>
               </div>`
            : ''}
        </div>
        ${!hasFilters && selectedProductIds.length === 0
          ? `<div style="font-size:12px;color:#a0b0c0;margin-top:10px">
               Aucun filtre actif — tous les produits seront exportes.
             </div>`
          : ''}
      </div>

      ${exportPickerHtml()}

      <!-- Options export -->
      <div style="background:#fff;border-radius:12px;padding:20px;
        box-shadow:0 1px 6px rgba(0,0,0,0.07);margin-bottom:24px">
        <div style="font-size:13px;font-weight:600;color:#1a2332;margin-bottom:14px">Options</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:13px">
            <input type="checkbox" id="export-opt-selection" ${selectedProductIds.length > 0 ? 'checked' : ''}>
            Exporter uniquement la selection (${selectedProductIds.length} produit${selectedProductIds.length > 1 ? 's' : ''})
            ${selectedProductIds.length === 0 ? '<span style="color:#a0b0c0;font-size:11px">(aucune selection active)</span>' : ''}
          </label>
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:13px">
            <input type="checkbox" id="export-opt-calc" checked>
            Inclure les champs calcules
          </label>
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:13px">
            <input type="checkbox" id="export-opt-images">
            Inclure les URLs des visuels (si disponibles)
          </label>
        </div>
      </div>

      <!-- Bouton export -->
      <div style="display:flex;justify-content:flex-end;gap:12px">
        <button class="btn btn-secondary"
          onclick="showPage('products', document.querySelector('.nav-item[onclick*=\\'products\\']'))">
          Retour a la liste
        </button>
        <button class="btn btn-primary" style="padding:10px 28px;font-size:14px"
          onclick="runExport()">
          &#8681; Exporter
        </button>
      </div>

    </div>`;
  fillIwiMissing();
}

// ============================================================
// COLONNES SYNTHESE POUR EXPORT
// Actions exclues, attributs dans l'ordre de syntheseItems
// ============================================================
function exportTechCode(code) {
  if (code === 'createdAt') return 'created_at';
  if (code === 'maj') return 'updated_at';
  return code;
}

function getSyntheseExportCols() {
  const cols = [];
  exportSnapshot.syntheseItems.forEach(item => {
    if (item.kind === 'action') return; // exclure les actions
    cols.push({ code: exportTechCode(item.code), label: item.label, src: item.code });
  });
  return cols;
}

// ============================================================
// COLONNES DETAIL POUR EXPORT
// Groupes associes a la categorie, hors visuels (sauf option)
// ============================================================
function getDetailExportCols(catName) {
  const cat = getCatByName(catName);
  if (!cat) return [];
  const cols = [];
  cat.groupIds.forEach(gid => {
    const g = getGroupById(gid);
    if (!g || g.code === 'visuels') return;
    g.attrIds.forEach(aid => {
      const a = getAttrById(aid);
      if (!a) return;
      cols.push({ code: a.code, label: a.name, calc: a.calc });
    });
  });
  return cols;
}

// ============================================================
// PRODUITS FILTRES DEPUIS LE SNAPSHOT
// ============================================================
function getFilteredProductsFromSnapshot() {
  const snap      = exportSnapshot;
  const catFilter = snap.catFilter  || '';
  const searchVal = snap.searchVal  || '';
  return products.filter(p => {
    if (!canCat(p.cat, 'r')) return false;
    if (catFilter && p.cat !== catFilter) return false;
    computeCalcFields(p);
    const allText = Object.values(p.fields).join(' ').toLowerCase() + ' ' + (p.cat || '').toLowerCase();
    if (searchVal && !allText.includes(searchVal.toLowerCase())) return false;
    for (const code in snap.colFilters) {
      const allowed = snap.colFilters[code];
      const val     = (p.fields[code] !== undefined ? p.fields[code] : p[code] || '').toString().trim();
      if (!allowed.has(val)) return false;
    }
    return true;
  });
}

// ============================================================
// EXECUTION EXPORT
// ============================================================
function selectExportTemplate(id) {
  activeExportTemplate = id;
  exportPick = null;
  renderExportPage();
  const saved = exportTemplates.find(t => t.id === id);
  if (saved && saved.pick && exportPick) {
    exportPick.groups = new Set(saved.pick.groups);
    exportPick.attrs = new Set(saved.pick.attrs);
    exportPick.single = !!saved.pick.single;
    exportPick.zip = !!saved.pick.zip;
    renderExportPage();
  }
}

function toggleExportGroup(gid, on) {
  ensureExportPick();
  if (on) exportPick.groups.add(gid);
  else exportPick.groups.delete(gid);
  exportPick.attrs = new Set();
  exportPick.groups.forEach(id => {
    const g = getGroupById(id);
    (g && g.attrIds || []).forEach(aid => {
      const a = getAttrById(aid);
      if (a && a.code !== 'completion') exportPick.attrs.add(a.code);
    });
  });
  renderExportPage();
}

function toggleExportAttr(gid, code, on) {
  ensureExportPick();
  if (on) {
    exportPick.groups.add(gid);
    exportPick.attrs.add(code);
  } else {
    exportPick.attrs.delete(code);
  }
  renderExportPage();
}

function saveExportTemplate() {
  const input = document.getElementById('export-template-name');
  const name = input ? input.value.trim() : '';
  if (!name) { showNotif('Donnez un nom a la trame', 'warn'); return; }
  ensureExportPick();
  const id = 'tpl_' + Date.now();
  exportTemplates.push({
    id, name, builtin: false,
    pick: {
      groups: [...exportPick.groups],
      attrs: [...exportPick.attrs],
      single: !!exportPick.single,
      zip: !!exportPick.zip,
    },
  });
  activeExportTemplate = id;
  showNotif('Trame enregistree : ' + name);
  renderExportPage();
}

function iwiCell(p, col) {
  if (col.constant) return col.constant;
  const attr = attributes.find(a => a.code === col.code);
  if (col.code === 'pa_interne') computeCalcFields(p);
  const val = attr ? getAttrFieldValue(p, attr) : (p.fields[col.code] || '');
  if (col.code === 'marque' && val && typeof IWI_BRAND_CODES !== 'undefined') {
    const code = IWI_BRAND_CODES[val];
    if (code) return code + ' - ' + val;
  }
  return val !== undefined && val !== null ? String(val) : '';
}

function iwiMissingCounts(prods) {
  const counts = {};
  prods.forEach(p => {
    IWI_COLUMNS.forEach(col => {
      if (!col.required || col.constant) return;
      if (!String(iwiCell(p, col) || '').trim()) counts[col.header] = (counts[col.header] || 0) + 1;
    });
  });
  return counts;
}

function fillIwiMissing() {
  const el = document.getElementById('iwi-missing');
  if (!el || activeExportTemplate !== 'iwi') return;
  let prods = getFilteredProductsFromSnapshot();
  const opt = document.getElementById('export-opt-selection');
  if (opt && opt.checked && selectedProductIds.length) prods = prods.filter(p => selectedProductIds.includes(p.id));
  const counts = iwiMissingCounts(prods);
  const keys = Object.keys(counts);
  el.textContent = keys.length
    ? 'Manquants : ' + keys.map(k => counts[k] + ' ' + k).join(', ') + '. L\'export IWI reste bloque.'
    : 'Toutes les colonnes IWI exigees sont remplies.';
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function runExport() {
  if (typeof XLSX === 'undefined') {
    showNotif('Erreur : librairie SheetJS non chargee');
    return;
  }
  ensureExportPick();
  const optSelection = document.getElementById('export-opt-selection');
  const selOnly = optSelection && optSelection.checked && selectedProductIds.length > 0;
  let prods = getFilteredProductsFromSnapshot();
  if (selOnly) prods = prods.filter(p => selectedProductIds.includes(p.id));
  if (!prods.length) { showNotif('Aucun produit a exporter'); return; }
  prods.forEach(p => computeCalcFields(p));

  if (activeExportTemplate === 'iwi') {
    const counts = iwiMissingCounts(prods);
    const keys = Object.keys(counts);
    fillIwiMissing();
    if (keys.length) {
      showNotif('Export IWI bloque : des colonnes exigees sont vides', 'warn');
      return;
    }
  }

  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  if (activeExportTemplate === 'iwi') {
    const header = IWI_COLUMNS.map(c => c.header);
    const rows = prods.map(p => IWI_COLUMNS.map(c => iwiCell(p, c)));
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    applySheetStyles(ws, header.length, rows.length);
    XLSX.utils.book_append_sheet(wb, ws, 'Montures');
  } else if (exportPick.single) {
    const seen = new Set();
    const cols = [];
    exportPick.groups.forEach(gid => {
      const g = getGroupById(gid);
      (g && g.attrIds || []).forEach(id => {
        const a = getAttrById(id);
        if (!a || seen.has(a.code) || !exportPick.attrs.has(a.code)) return;
        seen.add(a.code);
        cols.push(a);
      });
    });
    const header = cols.map(a => a.code);
    const rows = prods.map(p => cols.map(a => {
      const val = getAttrFieldValue(p, a);
      return val !== undefined && val !== null ? String(val) : '';
    }));
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    applySheetStyles(ws, header.length, rows.length);
    XLSX.utils.book_append_sheet(wb, ws, 'Export');
  } else {
    let sheets = 0;
    exportPick.groups.forEach(gid => {
      const g = getGroupById(gid);
      if (!g) return;
      const cols = (g.attrIds || []).map(id => getAttrById(id)).filter(a => a && exportPick.attrs.has(a.code));
      if (!cols.length) return;
      const header = cols.map(a => a.code);
      const rows = prods.map(p => cols.map(a => {
        const val = getAttrFieldValue(p, a);
        return val !== undefined && val !== null ? String(val) : '';
      }));
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
      applySheetStyles(ws, header.length, rows.length);
      XLSX.utils.book_append_sheet(wb, ws, g.name.slice(0, 31));
      sheets++;
    });
    if (!sheets) { showNotif('Aucun champ coche'); return; }
  }

  const base = activeExportTemplate === 'iwi' ? 'export_iwi_' : 'export_produits_';
  const xlsxName = base + dateStr + '.xlsx';
  if (exportPick.zip) {
    if (typeof JSZip === 'undefined') { showNotif('Librairie ZIP non chargee'); return; }
    const zip = new JSZip();
    zip.file(xlsxName, XLSX.write(wb, { bookType: 'xlsx', type: 'array' }));
    zip.generateAsync({ type: 'blob' }).then(blob => {
      downloadBlob(blob, base + dateStr + '.zip');
      showNotif('Export termine : ' + base + dateStr + '.zip');
    });
    return;
  }
  XLSX.writeFile(wb, xlsxName);
  showNotif('Export termine : ' + xlsxName);
}

// ============================================================
// STYLES FEUILLE — EN-TETE GRAS + LARGEURS AUTO
// ============================================================
function applySheetStyles(ws, nbCols, nbRows) {
  if (!ws['!ref']) return;

  // Largeurs colonnes
  const colWidths = [];
  for (let c = 0; c < nbCols; c++) {
    let maxLen = 10;
    for (let r = 0; r <= nbRows; r++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      const cell     = ws[cellAddr];
      if (cell && cell.v) {
        const len = String(cell.v).length;
        if (len > maxLen) maxLen = len;
      }
    }
    colWidths.push({ wch: Math.min(maxLen + 2, 50) });
  }
  ws['!cols'] = colWidths;

  // Gras sur la ligne d'en-tete
  for (let c = 0; c < nbCols; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[cellAddr]) continue;
    ws[cellAddr].s = {
      font:    { bold: true, color: { rgb: 'FFFFFF' } },
      fill:    { fgColor: { rgb: '1A2332' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }

  // Freeze de la premiere ligne
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' };
}
