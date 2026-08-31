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

      <!-- Onglets export -->
      <div style="background:#fff;border-radius:12px;padding:20px;
        box-shadow:0 1px 6px rgba(0,0,0,0.07);margin-bottom:20px">
        <div style="font-size:13px;font-weight:600;color:#1a2332;margin-bottom:16px">
          Contenu des onglets
        </div>

        <!-- Onglet Synthese -->
        <div style="border:1px solid #e8ecf0;border-radius:10px;padding:16px;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="font-size:13px;font-weight:700;color:#1a2332">Onglet : Synthese</span>
            <span class="badge badge-green" style="font-size:11px">Toujours inclus</span>
          </div>
          <div style="font-size:12px;color:#607080;margin-bottom:10px">
            Colonnes issues du groupe Synthese, dans l'ordre configure.
            Les colonnes "Action" (ex : Supprimer) sont exclues de l'export.
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${synthCols.map(c =>
              `<span class="attr-chip" style="background:#e3f2fd;color:#1565c0;font-size:11px">${c.label}</span>`
            ).join('')}
          </div>
        </div>

        <!-- Onglet Informations generales -->
        <div style="border:1px solid #e8ecf0;border-radius:10px;padding:16px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="font-size:13px;font-weight:700;color:#1a2332">Onglet : Informations generales</span>
            ${catFilter
              ? `<span class="badge badge-green" style="font-size:11px">Inclus</span>`
              : `<span class="badge badge-grey" style="font-size:11px">Necessite une categorie</span>`}
          </div>
          <div style="font-size:12px;color:#607080;margin-bottom:10px">
            ${catFilter
              ? `Colonnes des groupes d'attributs associes a la categorie <strong>${catFilter}</strong>.`
              : 'Selectionnez une categorie dans la liste produits pour activer cet onglet.'}
          </div>
          ${catFilter && detailCols.length > 0
            ? `<div style="display:flex;flex-wrap:wrap;gap:6px">
                 ${detailCols.map(c =>
                   `<span class="attr-chip" style="background:#f3e5f5;color:#6a1b9a;font-size:11px">${c.label}</span>`
                 ).join('')}
               </div>`
            : ''}
        </div>
      </div>

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
          &#8681; Exporter .xlsx
        </button>
      </div>

    </div>`;
}

// ============================================================
// COLONNES SYNTHESE POUR EXPORT
// Actions exclues, attributs dans l'ordre de syntheseItems
// ============================================================
function getSyntheseExportCols() {
  const cols = [];
  exportSnapshot.syntheseItems.forEach(item => {
    if (item.kind === 'action') return; // exclure les actions
    cols.push({ code: item.code, label: item.label });
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
    if (g.isBrandGroup) {
      cols.push({ code: 'fournisseur_code', label: 'Fournisseur' });
      cols.push({ code: 'marque',           label: 'Marque'      });
      return;
    }
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
function runExport() {
  if (typeof XLSX === 'undefined') {
    showNotif('Erreur : librairie SheetJS non chargee');
    return;
  }

  const optSelection = document.getElementById('export-opt-selection');
  const optCalc      = document.getElementById('export-opt-calc');
  const optImages    = document.getElementById('export-opt-images');
  const inclCalc     = optCalc    ? optCalc.checked    : true;
  const inclImages   = optImages  ? optImages.checked  : false;
  const selOnly      = optSelection && optSelection.checked && selectedProductIds.length > 0;

  let prods = getFilteredProductsFromSnapshot();
  if (selOnly) prods = prods.filter(p => selectedProductIds.includes(p.id));
  if (!prods.length) { showNotif('Aucun produit a exporter'); return; }

  prods.forEach(p => computeCalcFields(p));

  const wb = XLSX.utils.book_new();

  // ---- Onglet Synthese ----
  const synthCols = getSyntheseExportCols().filter(c => {
    if (!inclCalc) {
      const a = attributes.find(x => x.code === c.code);
      if (a && a.calc) return false;
    }
    if (!inclImages) {
      const a = attributes.find(x => x.code === c.code);
      if (a && a.type === 'Image') return false;
    }
    return true;
  });

  const synthHeader = synthCols.map(c => c.label);
  const synthRows   = prods.map(p => synthCols.map(c => {
    if (c.code === 'cat')        return p.cat || '';
    if (c.code === 'createdAt')  return p.createdAt || '';
    if (c.code === 'maj')        return p.maj || '';
    if (c.code === 'miseEnLigne')return p.fields.miseEnLigne || '';
    if (c.code === 'completion') return calcCompletion(p) + '%';
    if (c.code === 'visuel_face')return inclImages ? (p.fields.visuel_face ? '(image)' : '') : '';
    const val = p.fields[c.code];
    return val !== undefined && val !== null ? String(val) : '';
  }));

  const synthData = [synthHeader, ...synthRows];
  const wsSynth   = XLSX.utils.aoa_to_sheet(synthData);
  applySheetStyles(wsSynth, synthHeader.length, synthRows.length);
  XLSX.utils.book_append_sheet(wb, wsSynth, 'Synthese');

  // ---- Onglet Informations generales ----
  const catFilter = exportSnapshot.catFilter || '';
  if (catFilter) {
    const detailCols = getDetailExportCols(catFilter).filter(c => {
      if (!inclCalc && c.calc) return false;
      return true;
    });
    if (detailCols.length > 0) {
      const detailHeader = detailCols.map(c => c.label);
      const detailRows   = prods.map(p => detailCols.map(c => {
        const val = p.fields[c.code];
        return val !== undefined && val !== null ? String(val) : '';
      }));
      const detailData = [detailHeader, ...detailRows];
      const wsDetail   = XLSX.utils.aoa_to_sheet(detailData);
      applySheetStyles(wsDetail, detailHeader.length, detailRows.length);
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Informations generales');
    }
  }

  // ---- Nom du fichier ----
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const catStr  = catFilter ? '_' + catFilter.replace(/\s+/g, '_') : '';
  const selStr  = selOnly   ? '_selection'                         : '';
  const fileName = `export_produits${catStr}${selStr}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
  showNotif('Export termine : ' + fileName);
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
