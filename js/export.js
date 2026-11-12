// ============================================================
// EXPORT.JS — Export .xlsx via SheetJS
// ============================================================

// ============================================================
// POINT D'ENTREE — RENDU PAGE EXPORT
// ============================================================
function renderExportPage() { return withCalcBatch(renderExportPageNow); }
function renderExportPageNow() {
  captureExportSnapshot();
  const page = document.getElementById('page-exports');
  if (!page) return;

  const catFilter  = exportSnapshot.catFilter  || '';
  const searchVal  = exportSnapshot.searchVal  || '';

  const filtered = exportScopeProducts();
  const total    = filtered.length;

  page.innerHTML = `
    <div style="max-width:900px;margin:0 auto">

      <div style="margin-bottom:24px">
        <div style="font-size:18px;font-weight:700;color:#1a2332">Export produits</div>
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
            : ''}
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
          ${selectedProductIds.length > 0 && !exportIgnoreSelection
            ? `<div class="export-context-chip" style="background:#e3f2fd;border-color:#90caf9">
                 <span style="color:#1565c0">Selection : ${selectedProductIds.length} produit(s)</span>
                 <button type="button" class="btn btn-secondary" style="margin-left:8px;padding:2px 8px" onclick="useFullExportScope()">Tout exporter</button>
               </div>`
            : ''}
        </div>
      </div>

      ${exportPickerHtml()}

      <!-- Bouton export -->
      <div style="display:flex;justify-content:flex-end;align-items:center;gap:12px">
        <button class="btn btn-secondary"
          onclick="showPage('products', document.querySelector('.nav-item[onclick*=\\'products\\']'))">
          Retour a la liste
        </button>
        <select class="form-select" style="max-width:110px" onchange="setExportFormat(this.value)">
          <option value="xlsx" ${(exportPick && exportPick.format) === 'csv' || (exportPick && exportPick.format) === 'zip' ? '' : 'selected'}>.xlsx</option>
          <option value="csv" ${exportPick && exportPick.format === 'csv' ? 'selected' : ''}>.csv</option>
          <option value="zip" ${exportPick && exportPick.format === 'zip' ? 'selected' : ''}>.zip</option>
        </select>
        <button class="btn btn-primary" style="padding:10px 28px;font-size:14px"
          onclick="runExport()">
          &#8681; Exporter
        </button>
      </div>

    </div>`;
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
    if (!g) return;
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
    if (!productMatchesSearch(p, searchVal)) return false;
    if (!productPassesColFilters(p, snap.colFilters)) return false;
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
}

function setExportFormat(v) {
  ensureExportPick();
  exportPick.format = v;
}

function useFullExportScope() {
  exportIgnoreSelection = true;
  renderExportPage();
}

function toggleExportSection(key) {
  if (exportOpenGroups.has(String(key))) exportOpenGroups.delete(String(key));
  else exportOpenGroups.add(String(key));
  renderExportPage();
}

function exportScopeProducts() {
  let prods = getFilteredProductsFromSnapshot();
  if (!exportIgnoreSelection && selectedProductIds.length) {
    prods = prods.filter(p => selectedProductIds.includes(p.id));
  }
  return prods;
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

function exportFormatBlocs() {
  return [...new Set(exportFormatCols().map(c => c.bloc || ''))];
}
function toggleExportIwiGroup(blocIdx, on) {
  ensureExportPick();
  const bloc = exportFormatBlocs()[blocIdx];
  if (bloc === undefined) return;
  if (on) exportPick.groups.add(bloc);
  else exportPick.groups.delete(bloc);
  exportPick.attrs = new Set();
  exportFormatCols().forEach((col, i) => {
    if (exportPick.groups.has(col.bloc || '')) exportPick.attrs.add(String(i));
  });
  renderExportPage();
}

function toggleExportIwiCol(index, on) {
  ensureExportPick();
  const col = exportFormatCols()[index];
  if (!col) return;
  if (on) {
    exportPick.groups.add(col.bloc || '');
    exportPick.attrs.add(String(index));
  } else {
    exportPick.attrs.delete(String(index));
  }
  renderExportPage();
}

// Enregistre la sélection comme trame (droit sur le volet Trames) : colonnes
// cochées, dans l'ordre ; depuis Catalogue, en-tête = code technique
function saveExportTemplate() {
  if (!requirePerm(canMod('mod_trames', 'w'))) return;
  const input = document.getElementById('export-template-name');
  const name = input ? input.value.trim() : '';
  if (!name) { showNotif('Donnez un nom à la trame', 'warn'); return; }
  if (trames.some(t => t.name.toLowerCase() === name.toLowerCase())) { showNotif('Cette trame existe déjà', 'error'); return; }
  ensureExportPick();
  let columns;
  if (exportPick.mode === 'format') {
    columns = iwiSelectedColumns().map(x => JSON.parse(JSON.stringify(x.c)));
  } else {
    const seen = new Set(); columns = [];
    exportPick.groups.forEach(gid => {
      const g = getGroupById(gid);
      (g && g.attrIds || []).forEach(id => {
        const a = getAttrById(id);
        if (!a || seen.has(a.code) || !exportPick.attrs.has(a.code)) return;
        seen.add(a.code);
        columns.push({ bloc: g.name, header: a.code, code: a.code });
      });
    });
  }
  if (!columns.length) { showNotif('Aucune colonne cochée', 'warn'); return; }
  const src = currentExportFormat();
  const t = { id: 'trm_' + (nextTrameId++), name, export: true, import: true,
    cats: exportPick.cat ? [exportPick.cat] : [], sheet: (src && src.sheet) || 'Export', columns };
  trames.push(t);
  activeExportTemplate = t.id;
  exportPick = null;
  showNotif('Trame enregistrée : ' + name);
  renderExportPage();
}

// Cellule d'une colonne de modèle d'export : valeur fixe, attribut, ou vide
function iwiCell(p, col) {
  if (col.fixed != null && col.fixed !== '') return col.fixed;
  if (!col.code) return '';
  computeCalcFields(p);
  const attr = attributes.find(a => a.code === col.code);
  const val = attr ? getAttrFieldValue(p, attr) : (col.code ? (p.fields[col.code] || '') : '');
  if (attr && (attr.type === 'Nombre' || attr.type === 'Nombre decimal')) return formatAttrNumber(attr, val);
  return val !== undefined && val !== null ? String(val) : '';
}

function exportAttrCell(p, a) {
  const val = getAttrFieldValue(p, a);
  if (a.type === 'Nombre' || a.type === 'Nombre decimal') return formatAttrNumber(a, val);
  return val !== undefined && val !== null ? String(val) : '';
}

function iwiMissingCounts(prods) { return withCalcBatch(() => iwiMissingCountsNow(prods)); }
function iwiMissingCountsNow(prods) {
  const counts = {};
  prods.forEach(p => {
    exportFormatCols().forEach((col, i) => {
      if (!exportPick || !exportPick.attrs.has(String(i))) return;
      if (!col.required || (col.fixed != null && col.fixed !== '')) return;
      if (!String(iwiCell(p, col) || '').trim()) counts[i] = (counts[i] || 0) + 1;
    });
  });
  return counts;
}

function sheetToCsv(aoa) {
  return aoa.map(row => row.map(cell => {
    const s = cell == null ? '' : String(cell);
    if (/[;"\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }).join(';')).join('\r\n');
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function iwiSelectedColumns() {
  return exportFormatCols().map((c, i) => ({ c, i })).filter(x =>
    exportPick.groups.has(x.c.bloc || '') && exportPick.attrs.has(String(x.i))
  );
}

function iwiSheet(prods) { return withCalcBatch(() => iwiSheetNow(prods)); }
function iwiSheetNow(prods) {
  const cols = iwiSelectedColumns();
  if (!cols.length) { showNotif('Aucun champ coche'); return null; }
  const sections = cols.map((x, n) => (n === 0 || x.c.bloc !== cols[n - 1].c.bloc) ? (x.c.bloc || '') : '');
  const header = cols.map(x => x.c.header);
  const rows = prods.map(p => cols.map(x => iwiCell(p, x.c)));
  return [sections, header, ...rows];
}

function catalogueSheet(prods) { return withCalcBatch(() => catalogueSheetNow(prods)); }
function catalogueSheetNow(prods) {
  const seen = new Set();
  const cols = [];
  exportPick.groups.forEach(gid => {
    const g = getGroupById(gid);
    (g && g.attrIds || []).forEach(id => {
      const a = getAttrById(id);
      if (!a || seen.has(a.code) || !exportPick.attrs.has(a.code)) return;
      seen.add(a.code);
      cols.push({ attr: a, group: g.name });
    });
  });
  if (!cols.length) { showNotif('Aucun champ coche'); return null; }
  const groups = cols.map((c, i) => (i === 0 || c.group !== cols[i - 1].group) ? c.group : '');
  const header = cols.map(c => c.attr.code);
  const rows = prods.map(p => cols.map(c => exportAttrCell(p, c.attr)));
  return [groups, header, ...rows];
}

function runExport() {
  if (typeof XLSX === 'undefined') {
    showNotif('Erreur : librairie SheetJS non chargee');
    return;
  }
  ensureExportPick();
  const prods = exportScopeProducts();
  if (!prods.length) { showNotif('Aucun produit a exporter'); return; }
  prods.forEach(p => computeCalcFields(p));

  const iwi = exportPick.mode === 'format';
  const fmt = iwi ? currentExportFormat() : null;
  if (iwi && Object.keys(iwiMissingCounts(prods)).length) {
    renderExportPage();
    showNotif('Export « ' + (fmt ? fmt.name : '') + ' » bloqué : des colonnes bloquantes sont vides', 'warn');
    return;
  }

  const aoa = iwi ? iwiSheet(prods) : catalogueSheet(prods);
  if (!aoa) return;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const slug = t => String(t || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const base = 'export_' + (fmt ? slug(fmt.name) : 'produits') + '_';
  const format = exportPick.format || 'xlsx';
  if (format === 'csv') {
    downloadBlob(new Blob(['\uFEFF' + sheetToCsv(aoa)], { type: 'text/csv;charset=utf-8' }), base + dateStr + '.csv');
    showNotif('Export termine : ' + base + dateStr + '.csv');
    return;
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  applySheetStyles(ws, aoa[0].length, aoa.length - 1, 2);
  XLSX.utils.book_append_sheet(wb, ws, (fmt && fmt.sheet) || 'Export');
  const xlsxName = base + dateStr + '.xlsx';
  if (format === 'zip') {
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
function applySheetStyles(ws, nbCols, nbRows, headerRows) {
  if (!ws['!ref']) return;
  headerRows = headerRows || 1;

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

  for (let r = 0; r < headerRows; r++) {
    for (let c = 0; c < nbCols; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellAddr]) ws[cellAddr] = { t: 's', v: '' };
      ws[cellAddr].s = {
        font:    { bold: true, color: { rgb: 'FFFFFF' } },
        fill:    { fgColor: { rgb: '1A2332' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }
  }

  ws['!freeze'] = { xSplit: 0, ySplit: headerRows, topLeftCell: 'A' + (headerRows + 1), activePane: 'bottomLeft' };
}
