// ============================================================
// IMPORT.JS — Import Excel / CSV avec trames
// ============================================================

// ============================================================
// ETAT IMPORT
// ============================================================
let importStep        = 1;       // 1 = config, 2 = apercu, 3 = résultat
let importParsedRows  = [];      // lignes parsées depuis le fichier
let importMappedRows  = [];      // lignes après mapping colonnes
let importAction      = 'add';   // 'add' | 'update' | 'delete'
let importCategory    = '';      // categorie cible
let importColMapping  = {};      // { colFichier: codeAttribut }
let importTrameId     = '';      // trame d'import choisie (correspondance d'office)

// ============================================================
// RENDU PAGE IMPORT
// ============================================================
function renderImportPage() {
  updateTopbarTitle('Imports');
  importStep = 1;
  const page = document.getElementById('page-imports');
  if (!page) return;

  page.innerHTML = `
    <div style="max-width:960px;margin:0 auto">

      <!-- En-tete -->
      <div style="margin-bottom:24px">
        <div style="font-size:18px;font-weight:700;color:#1a2332;margin-bottom:6px">
          Import produits
        </div>
        <div style="font-size:13px;color:#607080">
          Importez un fichier <strong>Excel (.xlsx)</strong> ou <strong>CSV (.csv)</strong>
          pour ajouter, modifier ou supprimer des produits en masse.
        </div>
      </div>

      <!-- Stepper -->
      <div class="import-stepper" id="import-stepper">
        ${importStepperHtml(1)}
      </div>

      <!-- Contenu step 1 -->
      <div id="import-step-content">
        ${renderImportStep1()}
      </div>

    </div>`;
}

// ============================================================
// STEPPER HTML
// ============================================================
function importStepperHtml(active) {
  const steps = [
    { n: 1, label: 'Configuration' },
    { n: 2, label: 'Aperçu & Mapping' },
    { n: 3, label: 'Résultat' },
  ];
  return `<div class="import-stepper-inner">
    ${steps.map(s => `
      <div class="import-step ${s.n === active ? 'active' : s.n < active ? 'done' : ''}">
        <div class="import-step-circle">${s.n < active ? '&#10003;' : s.n}</div>
        <div class="import-step-label">${s.label}</div>
      </div>
      ${s.n < steps.length ? '<div class="import-step-line"></div>' : ''}
    `).join('')}
  </div>`;
}

// ============================================================
// STEP 1 — CONFIGURATION
// ============================================================
function renderImportStep1() {
  const writable = getWritableCategories();
  const deletable = categories.filter(c => canCat(c.id, 'd'));
  const catOptions = (importAction === 'delete' ? deletable : writable).map(c =>
    `<option value="${c.name}">${c.name}</option>`
  ).join('');

  const actions = [
    { val: 'add',    label: 'Ajout',        sub: 'Créer les produits du fichier',           icon: '&#10133;', show: writable.length > 0 },
    { val: 'update', label: 'Modification',  sub: 'Mettre à jour les produits existants',    icon: '&#9999;&#65039;', show: writable.length > 0 },
    { val: 'delete', label: 'Suppression',   sub: 'Supprimer les produits identifiés',       icon: '&#128465;&#65039;', show: deletable.length > 0 },
  ].filter(a => a.show);

  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">

      <!-- Colonne gauche : parametres -->
      <div class="field-group">
        <div class="field-group-title">Paramètres de l'import</div>

        <div class="field-row">
          <div class="field-label">Action <span class="field-required">*</span></div>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
            ${actions.map(a => `
              <label class="import-action-radio ${importAction === a.val ? 'selected' : ''}"
                onclick="selectImportAction('${a.val}')">
                <input type="radio" name="import-action" value="${a.val}"
                  ${importAction === a.val ? 'checked' : ''} style="display:none">
                <span style="font-size:16px">${a.icon}</span>
                <div>
                  <div style="font-size:13px;font-weight:700;color:#1a2332">${a.label}</div>
                  <div style="font-size:11px;color:#a0b0c0">${a.sub}</div>
                </div>
              </label>`
            ).join('') || '<div style="font-size:13px;color:#a0b0c0">Aucune action disponible.</div>'}
          </div>
        </div>

        <div class="field-row" style="margin-top:16px">
          <div class="field-label">Catégorie cible <span class="field-required" id="import-cat-req"${importAction === 'add' ? '' : ' style="display:none"'}>*</span></div>
          <select class="form-select" id="import-cat" onchange="onImportCatChange(this.value)">
            <option value="">-- Choisir --</option>
            ${catOptions}
          </select>
        </div>

        <div class="field-row">
          <div class="field-label">Trame</div>
          <div style="display:flex;gap:8px;align-items:center">
            <div style="flex:1;min-width:0">
              <select class="form-select" id="import-trame" onchange="onImportTrameChange(this.value)">
                <option value="">Aucune</option>
                ${tramesFor('import', importCategory).map(t => `<option value="${t.id}"${t.id === importTrameId ? ' selected' : ''}>${escapeHtml(t.name)}</option>`).join('')}
              </select>
            </div>
            <button class="btn btn-secondary" title="Télécharger la trame choisie (sans trame : Catalogue de la catégorie)" onclick="downloadTrame()">&#8681; Télécharger</button>
          </div>
        </div>

        <div class="field-row">
          <div class="field-label">Champs obligatoires</div>
          <div id="import-required-list">${renderImportRequiredListHtml()}</div>
        </div>
      </div>

      <!-- Colonne droite : upload + trame -->
      <div style="display:flex;flex-direction:column;gap:16px">

        <!-- Zone upload -->
        <div class="field-group" style="flex:1">
          <div class="field-group-title">Fichier à importer</div>
          <div class="import-dropzone" id="import-dropzone"
            ondragover="event.preventDefault();this.classList.add('drag-over')"
            ondragleave="this.classList.remove('drag-over')"
            ondrop="onImportFileDrop(event)">
            <div style="font-size:32px;margin-bottom:8px">&#128196;</div>
            <div style="font-size:13px;font-weight:600;color:#1a2332;margin-bottom:4px">
              Glisser-déposer votre fichier ici
            </div>
            <div style="font-size:12px;color:#a0b0c0;margin-bottom:12px">
              ou
            </div>
            <button class="btn btn-secondary" style="font-size:12px"
              onclick="document.getElementById('import-file-input').click()">
              Parcourir...
            </button>
            <input type="file" id="import-file-input" accept=".xlsx,.csv"
              style="display:none" onchange="onImportFileSelect(this)">
            <div style="font-size:11px;color:#a0b0c0;margin-top:10px">
              Formats acceptés : .xlsx, .csv — 10 Mo max
            </div>
          </div>
          <div id="import-file-info" style="display:none;margin-top:10px">
            <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;
              background:#e8f5e9;border-radius:8px;border:1px solid #a5d6a7">
              <span style="font-size:18px">&#128196;</span>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:600;color:#2e7d32"
                  id="import-file-name"></div>
                <div style="font-size:11px;color:#607080"
                  id="import-file-meta"></div>
              </div>
              <button onclick="clearImportFile()"
                style="background:none;border:none;color:#a0b0c0;font-size:16px;
                cursor:pointer">&#10005;</button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Bouton suivant -->
    <div style="display:flex;justify-content:flex-end">
      <button class="btn btn-primary" style="padding:10px 28px"
        onclick="goToImportStep2()">
        Suivant &rarr;
      </button>
    </div>`;
}

function selectImportAction(val) {
  importAction = val;
  document.querySelectorAll('.import-action-radio').forEach(el => {
    el.classList.toggle('selected', el.querySelector('input').value === val);
  });
  const req = document.getElementById('import-cat-req');
  if (req) req.style.display = val === 'add' ? '' : 'none';
}

// Une trame limitée à une seule catégorie la présélectionne
function onImportTrameChange(val) {
  importTrameId = val;
  const t = trameById(val);
  const sel = document.getElementById('import-cat');
  if (t && (t.cats || []).length === 1 && sel && !sel.value && [...sel.options].some(o => o.value === t.cats[0])) {
    sel.value = t.cats[0];
    if (typeof syncComboFromSelect === 'function') syncComboFromSelect(sel);
    onImportCatChange(sel.value);
  }
}

function onImportCatChange(val) {
  if (importTrameId) {
    const t = trameById(importTrameId);
    if (t && val && (t.cats || []).length && !t.cats.includes(val)) importTrameId = '';
  }
  const sel = document.getElementById('import-trame');
  if (sel) {
    sel.innerHTML = '<option value="">Aucune</option>' + tramesFor('import', val).map(t =>
      `<option value="${t.id}"${t.id === importTrameId ? ' selected' : ''}>${escapeHtml(t.name)}</option>`).join('');
    if (typeof syncComboFromSelect === 'function') syncComboFromSelect(sel);
  }
  importCategory = val || '';
  refreshImportRequiredList();
}

function getImportTargetAttrs() {
  return getImportTargetAttrsFor(importCategory);
}

function importableAttr(a) {
  return a && !a.readonly && !['completion', 'created_at', 'updated_at', 'etape_workflow'].includes(a.code);
}
function isCalcAttr(a) { return !!(a && (a.calc || a.formula)); }

function getImportTargetAttrsFor(catName) {
  if (!catName) return attributes.filter(importableAttr);
  const cat = getCatByName(catName);
  if (!cat) return attributes.filter(importableAttr);
  const seen = new Set();
  return cat.groupIds
    .map(gid => getGroupById(gid))
    .filter(Boolean)
    .flatMap(g => g.attrIds.map(id => getAttrById(id)).filter(Boolean))
    .filter(a => {
      if (!importableAttr(a)) return false;
      if (seen.has(a.code)) return false;
      seen.add(a.code);
      return true;
    });
}

function getRequiredImportAttrs(catName) {
  const pool = getImportTargetAttrsFor(catName || importCategory);
  const req  = pool.filter(a => a.required);
  const catAttr = attributes.find(a => a.code === 'cat');
  if (catAttr && catAttr.required && !req.some(a => a.code === 'cat')) req.unshift(catAttr);
  const seen = new Set();
  return req.filter(a => {
    if (seen.has(a.code)) return false;
    seen.add(a.code);
    return true;
  });
}

function renderImportRequiredListHtml() {
  const req = getRequiredImportAttrs(importCategory);
  if (!req.length) {
    return `<div style="font-size:13px;color:#a0b0c0;margin-top:6px">
      Aucun champ obligatoire. Choisissez une catégorie pour affiner la liste.
    </div>`;
  }
  return `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
    ${req.map(a =>
      `<span class="attr-chip" style="background:#fce4ec;color:#c62828;font-size:11px">
        <span class="field-required">*</span>
        <span style="font-family:monospace;font-weight:700">${escapeHtml(a.code)}</span>
        <span style="opacity:.75;font-weight:400"> — ${escapeHtml(a.name)}</span>
      </span>`
    ).join('')}
  </div>`;
}

function refreshImportRequiredList() {
  const box = document.getElementById('import-required-list');
  if (box) box.innerHTML = renderImportRequiredListHtml();
}

// ============================================================
// UPLOAD FICHIER
// ============================================================
function onImportFileDrop(e) {
  e.preventDefault();
  const dz = document.getElementById('import-dropzone');
  if (dz) dz.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleImportFile(file);
}

function onImportFileSelect(input) {
  const file = input.files[0];
  if (file) handleImportFile(file);
}

function handleImportFile(file) {
  const allowed = ['xlsx', 'csv'];
  const ext     = file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) {
    showNotif('Format non supporte. Utilisez .xlsx ou .csv', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showNotif('Fichier trop volumineux (max 10 Mo)', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      if (ext === 'csv') {
        importParsedRows = parseCSV(e.target.result);
      } else {
        const wb   = XLSX.read(e.target.result, { type: 'binary', cellDates: true });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        importParsedRows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      }
      showImportFileInfo(file, importParsedRows.length);
    } catch(err) {
      showNotif('Erreur de lecture du fichier : ' + err.message, 'error');
    }
  };
  if (ext === 'csv') reader.readAsText(file, 'UTF-8');
  else reader.readAsBinaryString(file);
}

function showImportFileInfo(file, nbRows) {
  const dz   = document.getElementById('import-dropzone');
  const info = document.getElementById('import-file-info');
  const name = document.getElementById('import-file-name');
  const meta = document.getElementById('import-file-meta');
  if (dz)   dz.style.display   = 'none';
  if (info) info.style.display = '';
  if (name) name.textContent   = file.name;
  if (meta) meta.textContent   = `${nbRows} ligne${nbRows > 1 ? 's' : ''} detectee${nbRows > 1 ? 's' : ''} — ${(file.size / 1024).toFixed(1)} Ko`;
}

function clearImportFile() {
  importParsedRows = [];
  const dz    = document.getElementById('import-dropzone');
  const info  = document.getElementById('import-file-info');
  const input = document.getElementById('import-file-input');
  if (dz)    dz.style.display    = '';
  if (info)  info.style.display  = 'none';
  if (input) input.value         = '';
}

function parseCSV(text) {
  const lines  = text.split('\n').filter(l => l.trim());
  if (!lines.length) return [];
  const sep    = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(sep).map(v => v.trim().replace(/^"|"$/g, ''));
    const obj  = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
}

// ============================================================
// STEP 2 — APERCU & MAPPING
// ============================================================
function goToImportStep2() {
  importCategory = (document.getElementById('import-cat') || {}).value || '';

  if (!importParsedRows.length) {
    showNotif('Veuillez charger un fichier avant de continuer', 'error');
    return;
  }

  importStep = 2;
  const stepper = document.getElementById('import-stepper');
  const content = document.getElementById('import-step-content');
  if (stepper) stepper.innerHTML = importStepperHtml(2);
  if (content) content.innerHTML = renderImportStep2();
}

function renderImportStep2() {
  const fileHeaders = Object.keys(importParsedRows[0] || {});
  const targetAttrs = getImportTargetAttrs();
  const preview     = importParsedRows.slice(0, 5);

  // Mapping auto : si le header du fichier correspond exactement au code ou nom d'un attribut
  importColMapping = {};
  const trame = importTrameId ? trameById(importTrameId) : null;
  fileHeaders.forEach(h => {
    const hNorm = importNorm(h);
    const col = trame ? trame.columns.find(c => c.code && importNorm(c.header) === hNorm) : null;
    const match = (col && targetAttrs.find(a => a.code === col.code))
      || targetAttrs.find(a => importNorm(a.code) === hNorm)
      || targetAttrs.find(a => importNorm(a.name) === hNorm);
    if (match) importColMapping[h] = match.code;
  });

  const reqCodes = getRequiredImportAttrs(importCategory).map(a => a.code);

  const attrOptionsFor = (selected) =>
    `<option value="">-- Ignorer --</option>` +
    targetAttrs.map(a =>
      `<option value="${a.code}"${a.code === selected ? ' selected' : ''}>${a.code} — ${a.name}${a.required ? ' *' : ''}${isCalcAttr(a) ? ' (calculé : forcé si différent)' : ''}</option>`
    ).join('');

  return `
    <!-- Recap -->
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
      ${[
        { label: 'Action',      val: importAction === 'add' ? 'Ajout' : importAction === 'update' ? 'Modification' : 'Suppression' },
        { label: 'Obligatoires', val: reqCodes.length ? reqCodes.join(', ') : '—' },
        { label: 'Catégorie',   val: importCategory || 'Toutes' },
        { label: 'Lignes',      val: importParsedRows.length },
      ].map(r => `
        <div class="export-context-chip">
          <span style="color:#607080">${r.label}</span>
          <strong style="color:#1a2332;margin-left:6px">${r.val}</strong>
        </div>`
      ).join('')}
    </div>

    <!-- Mapping colonnes -->
    <div class="field-group" style="margin-bottom:20px">
      <div class="field-group-title">Mapping des colonnes</div>
      <div style="display:grid;grid-template-columns:1fr auto 1fr;
        gap:8px;align-items:center;margin-bottom:8px">
        <div style="font-size:11px;font-weight:700;color:#a0b0c0;
          text-transform:uppercase">Colonne fichier</div>
        <div></div>
        <div style="font-size:11px;font-weight:700;color:#a0b0c0;
          text-transform:uppercase">Attribut OctoPIM</div>
      </div>
      ${fileHeaders.map(h => `
        <div style="display:grid;grid-template-columns:1fr auto 1fr;
          gap:8px;align-items:center;margin-bottom:6px">
          <div style="padding:8px 12px;background:#f8fafc;border-radius:8px;
            font-size:13px;font-weight:600;color:#1a2332;
            border:1px solid #e8ecf0;white-space:nowrap;
            overflow:hidden;text-overflow:ellipsis">${h}</div>
          <div style="color:#a0b0c0;font-size:16px">&rarr;</div>
          <select class="form-select" id="map-${h.replace(/\s/g,'_')}"
            onchange="importColMapping['${h}']=this.value">
            ${attrOptionsFor(importColMapping[h] || '')}
          </select>
        </div>`
      ).join('')}
    </div>

    <!-- Apercu donnees -->
    <div class="field-group" style="margin-bottom:20px">
      <div class="field-group-title">
        Aperçu — ${Math.min(5, importParsedRows.length)} première${importParsedRows.length > 1 ? 's' : ''} ligne${importParsedRows.length > 1 ? 's' : ''}
      </div>
      <div class="table-container" style="max-height:220px;overflow:auto">
        <table>
          <thead>
            <tr>${fileHeaders.map(h =>
              `<th style="white-space:nowrap;font-size:11px">${h}</th>`
            ).join('')}</tr>
          </thead>
          <tbody>
            ${preview.map(row => `
              <tr>${fileHeaders.map(h =>
                `<td style="font-size:12px;white-space:nowrap;
                  max-width:160px;overflow:hidden;text-overflow:ellipsis">
                  ${row[h] || '—'}
                </td>`
              ).join('')}</tr>`
            ).join('')}
          </tbody>
        </table>
      </div>
    </div>

    ${canMod('mod_trames', 'w') ? `
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-bottom:16px">
      <input class="field-input" id="import-trame-name" placeholder="Nom d'une nouvelle trame" style="max-width:240px">
      <button class="btn btn-secondary" onclick="saveImportTrame()">Enregistrer la correspondance comme trame</button>
    </div>` : ''}

    <!-- Navigation -->
    <div style="display:flex;justify-content:space-between">
      <button class="btn btn-secondary"
        onclick="backToImportStep1()">&larr; Retour</button>
      <button class="btn btn-primary" style="padding:10px 28px"
        onclick="runImport()">
        Lancer l'import &rarr;
      </button>
    </div>`;
}

function backToImportStep1() {
  importStep = 1;
  const stepper = document.getElementById('import-stepper');
  const content = document.getElementById('import-step-content');
  if (stepper) stepper.innerHTML = importStepperHtml(1);
  if (content) content.innerHTML = renderImportStep1();
}

// ============================================================
// EXECUTION IMPORT
// ============================================================
function importRowHint(fields) {
  if (fields.ean) return 'ean=' + fields.ean;
  if (fields.sap) return 'sap=' + fields.sap;
  if (fields.nom) return 'nom=' + fields.nom;
  return 'ligne';
}

function findImportedProduct(fields) {
  const tryCode = (code) => {
    const val = (fields[code] || '').toString().trim();
    if (!val) return null;
    const attr = attributes.find(a => a.code === code);
    return products.find(p => String(getAttrFieldValue(p, attr || { code }) || '').trim() === val) || null;
  };
  const byEan = tryCode('ean');
  if (byEan) return byEan;
  const bySap = tryCode('sap');
  if (bySap) return bySap;
  const keys = getRequiredImportAttrs(importCategory)
    .filter(a => a.code !== 'cat' && (fields[a.code] || '').toString().trim());
  if (!keys.length) return null;
  const catHint = (fields.cat || importCategory || '').toString().trim();
  return products.find(p => {
    if (catHint && p.cat !== catHint) return false;
    return keys.every(a =>
      String(getAttrFieldValue(p, a) || '').trim() === String(fields[a.code]).trim()
    );
  }) || null;
}

// ============================================================
// CONVERSION SOUPLE DES VALEURS
// Casse, accents, apostrophes et espaces ignorés pour retrouver une valeur
// de liste ; OUI / NON, O / N, 1 / 0 ; dates Excel, AAAA-MM-JJ ou JJ/MM/AAAA ;
// nombres avec virgule, espaces, € ou %. « - », « N/A », « #N/A » = vide.
// Une valeur qui ne correspond à rien n'est pas reprise et est signalée.
// ============================================================
function importNorm(v) {
  return String(v == null ? '' : v).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[’'`]/g, ' ').replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim();
}
const IMPORT_EMPTY = new Set(['', '-', '—', 'n/a', 'na', '#n/a', '#value!', '#ref!', 'null']);
const IMPORT_YES = new Set(['oui', 'o', 'yes', 'y', '1', 'vrai', 'true', 'x']);
const IMPORT_NO = new Set(['non', 'n', 'no', '0', 'faux', 'false']);

function importDate(raw) {
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  if (raw instanceof Date && !isNaN(raw)) return fmt(raw);
  if (typeof raw === 'number' && raw > 20000 && raw < 80000) {
    return fmt(new Date(Math.round((raw - 25569) * 86400000) + new Date().getTimezoneOffset() * 60000));
  }
  const t = String(raw).trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return pad(m[3]) + '/' + pad(m[2]) + '/' + m[1];
  m = t.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);
  if (m) return pad(m[1]) + '/' + pad(m[2]) + '/' + (m[3].length === 2 ? '20' + m[3] : m[3]);
  return null;
}

function importListMatch(opts, raw) {
  const k = importNorm(raw);
  return (opts || []).find(o => importNorm(o) === k);
}

function importCoerce(attr, raw) {
  if (raw === undefined || raw === null) return { value: '' };
  if (!(raw instanceof Date) && IMPORT_EMPTY.has(importNorm(raw))) return { value: '' };
  if (!attr) return { value: String(raw).trim() };
  const txt = raw instanceof Date ? importDate(raw) : String(raw).trim();
  if (attr.code === 'cat') {
    const c = importListMatch(categories.map(x => x.name), txt);
    return c ? { value: c } : { value: '', warn: 'catégorie inconnue' };
  }
  switch (attr.type) {
    case 'Date': {
      const d = importDate(raw);
      return d ? { value: d } : { value: '', warn: 'date illisible' };
    }
    case 'Nombre':
    case 'Nombre decimal': {
      if (typeof raw === 'number') return { value: isPercentAttr(attr) ? coercePercentStored(raw) : String(raw) };
      const pct = /%/.test(txt);
      const n = parseFloat(txt.replace(/[\s\u00a0€]/g, '').replace('%', '').replace(',', '.'));
      if (!isFinite(n)) return { value: '', warn: 'nombre illisible' };
      if (isPercentAttr(attr)) return { value: coercePercentStored(pct ? n / 100 : n) };
      return { value: String(n) };
    }
    case 'Oui / Non': {
      const opts = (attr.options && attr.options.length) ? attr.options : ['Oui', 'Non'];
      const hit = importListMatch(opts, txt);
      if (hit) return { value: hit };
      const k = importNorm(txt);
      if (IMPORT_YES.has(k)) return { value: opts[0] };
      if (IMPORT_NO.has(k)) return { value: opts[1] || 'Non' };
      return { value: '', warn: 'ni oui ni non' };
    }
    case 'Simple select': {
      if (attr.listRef) {
        const hit = attrSelectOptions(attr).find(o => importNorm(o.v) === importNorm(txt) || importNorm(o.l) === importNorm(txt));
        return hit ? { value: hit.v } : { value: '', warn: 'absent du référentiel ' + attr.listRef.ref };
      }
      if (!(attr.options || []).length) return { value: txt };
      const hit = importListMatch(attr.options, txt);
      return hit ? { value: hit } : { value: '', warn: 'hors liste' };
    }
    case 'Multi select': {
      const parts = txt.split(/[;,|]/).map(x => x.trim()).filter(Boolean);
      const hits = parts.map(x => importListMatch(attr.options, x));
      if (hits.some(h => !h)) return { value: '', warn: 'hors liste' };
      return { value: [...new Set(hits)].join(', ') };
    }
    default:
      return { value: typeof raw === 'number' ? String(raw) : txt };
  }
}

// Champ calculé lu dans le fichier : identique au calcul = rien ; différent =
// valeur forcée (comme « Forcer la valeur » sur la fiche)
function importSameCalc(attr, a, b) {
  const x = String(a == null ? '' : a).trim(), y = String(b == null ? '' : b).trim();
  if (x === y) return true;
  const nx = parseFloat(x.replace(',', '.')), ny = parseFloat(y.replace(',', '.'));
  return isFinite(nx) && isFinite(ny) && Math.abs(nx - ny) < 0.005;
}
function importApplyCalc(p, calcVals, report) {
  const codes = Object.keys(calcVals);
  if (!codes.length) return;
  if (p.forcedFields) codes.forEach(c => delete p.forcedFields[c]);
  computeCalcFields(p);
  codes.forEach(code => {
    const v = calcVals[code];
    if (v === '') return;
    const attr = attributes.find(a => a.code === code);
    if (importSameCalc(attr, p.fields[code], v)) { report.same[code] = (report.same[code] || 0) + 1; return; }
    const r = report.forced[code] = report.forced[code] || { n: 0, ex: [] };
    r.n++;
    if (r.ex.length < 3) r.ex.push((p.fields.sap || p.fields.ean || p.fields.nom || '') + ' : ' + (p.fields[code] || '(vide)') + ' → ' + v);
    if (!p.forcedFields) p.forcedFields = {};
    p.forcedFields[code] = v;
    p.fields[code] = v;
  });
}

function runImport() {
  if (importAction === 'delete' && !categories.some(c => canCat(c.id, 'd'))) {
    showNotif('Suppression par import non autorisée', 'warn');
    return;
  }
  if ((importAction === 'add' || importAction === 'update') && !getWritableCategories().length) {
    showNotif('Import non autorisé', 'warn');
    return;
  }
  const targetCat = importCategory;
  if (targetCat) {
    if (importAction === 'delete' && !canCat(targetCat, 'd')) {
      showNotif('Suppression non autorisée sur cette catégorie', 'warn');
      return;
    }
    if (importAction !== 'delete' && !canCat(targetCat, 'w')) {
      showNotif('Import non autorisé sur cette catégorie', 'warn');
      return;
    }
  }
  const mappedCodes = Object.values(importColMapping).filter(Boolean);
  if (importAction === 'add' && !importCategory && !mappedCodes.includes('cat')) {
    showNotif('Choisissez la catégorie des produits à créer, ou reliez une colonne Catégorie', 'error');
    return;
  }
  const requiredAttrs = getRequiredImportAttrs(importCategory);
  const missingReq = requiredAttrs.filter(a => !mappedCodes.includes(a.code));
  // En ajout, toutes les colonnes obligatoires ; en modification, seules
  // les colonnes présentes sont contrôlées (on ne vide pas un obligatoire)
  if (importAction === 'add' && missingReq.length) {
    showNotif('Champs obligatoires non mappees : ' + missingReq.map(a => a.code).join(', '), 'error');
    return;
  }
  if (importAction === 'delete' && !mappedCodes.includes('ean') && !mappedCodes.includes('sap')) {
    showNotif('Mappez ean ou sap pour identifier les produits à supprimer', 'error');
    return;
  }

  let added = 0, updated = 0, deleted = 0, errors = [];
  const report = { warns: {}, forced: {}, same: {} };

  importParsedRows.forEach((row, idx) => {
    const fields = {}, calcVals = {};
    Object.keys(importColMapping).forEach(col => {
      const attrCode = importColMapping[col];
      if (!attrCode) return;
      const attr = attributes.find(a => a.code === attrCode);
      const res = importCoerce(attr, row[col]);
      if (res.warn) {
        const key = (attr ? attr.name : attrCode) + ' — « ' + String(row[col]).trim() + ' » (' + res.warn + ')';
        const w = report.warns[key] = report.warns[key] || { n: 0, first: idx + 2 };
        w.n++;
        if (importAction === 'update') return;          // valeur actuelle gardée
      }
      if (isCalcAttr(attr)) calcVals[attrCode] = res.value;
      else fields[attrCode] = res.value;
    });
    Object.keys(fields).forEach(code => {
      if (code === 'marque' && fields[code]) registerMarque(fields[code]);
    });

    if (importAction !== 'delete') {
      const checked = importAction === 'update' ? requiredAttrs.filter(a => mappedCodes.includes(a.code)) : requiredAttrs;
      const emptyReq = checked.filter(a => !(fields[a.code] || '').toString().trim());
      if (emptyReq.length) {
        errors.push(`Ligne ${idx + 2} : champs obligatoires manquants (${emptyReq.map(a => a.code).join(', ')})`);
        return;
      }
    }

    const existing = findImportedProduct(fields);
    const keyHint  = importRowHint(fields);

    if (importAction === 'delete') {
      if (existing) {
        if (!canDeleteProduct(existing)) {
          errors.push(`Ligne ${idx + 2} : suppression non autorisee (${keyHint})`);
          return;
        }
        products = products.filter(p => p.id !== existing.id);
        deleted++;
      } else {
        errors.push(`Ligne ${idx + 2} : produit introuvable (${keyHint})`);
      }
      return;
    }

    if (importAction === 'add') {
      if (existing) {
        errors.push(`Ligne ${idx + 2} : produit déjà existant (${keyHint}), ignoré`);
        return;
      }
      const catName = fields.cat || importCategory;
      if (!catName) {
        errors.push(`Ligne ${idx + 2} : catégorie manquante, produit non créé`);
        return;
      }
      if (!canCat(catName, 'w')) {
        errors.push(`Ligne ${idx + 2} : création non autorisée`);
        return;
      }
      const storeFields = {};
      Object.keys(fields).forEach(code => {
        const attr = attributes.find(a => a.code === code);
        if (attrStoresInFields(attr)) storeFields[code] = fields[code];
      });
      const today = todayStr();
      products.push({
        id: nextProductId++,
        cat: catName,
        createdAt: today,
        maj: nowStr(),
        visualSrc: null,
        visuals: 0,
        history: [],
        pendingChanges: [],
        fields: storeFields,
      });
      importApplyCalc(products[products.length - 1], calcVals, report);
      added++;
    } else if (importAction === 'update') {
      if (!existing) {
        errors.push(`Ligne ${idx + 2} : produit introuvable (${keyHint})`);
        return;
      }
      if (!canEditProduct(existing)) {
        errors.push(`Ligne ${idx + 2} : modification non autorisee (${keyHint})`);
        return;
      }
      Object.keys(fields).forEach(code => {
        const attr = attributes.find(a => a.code === code);
        if (code === 'cat') {
          if (existing.cat !== fields.cat) {
            existing.history.push({
              ts: nowStr(), user: 'Import', field: 'Catégorie',
              old: existing.cat, new: fields.cat,
            });
            existing.cat = fields.cat;
          }
          return;
        }
        if (!attrStoresInFields(attr)) return;
        const old = existing.fields[code] || '';
        if (old !== fields[code]) {
          existing.history.push({
            ts:    nowStr(),
            user:  'Import',
            field: attr ? attr.name : code,
            old,
            new:   fields[code],
          });
          existing.fields[code] = fields[code];
        }
      });
      importApplyCalc(existing, calcVals, report);
      existing.maj = nowStr();
      updated++;
    }
  });

  importStep = 3;
  const stepper = document.getElementById('import-stepper');
  const content = document.getElementById('import-step-content');
  if (stepper) stepper.innerHTML = importStepperHtml(3);
  if (content) content.innerHTML = renderImportStep3(added, updated, deleted, errors, report);

  renderAll();
}

// ============================================================
// STEP 3 — RESULTAT
// ============================================================
function renderImportStep3(added, updated, deleted, errors, report) {
  report = report || { warns: {}, forced: {}, same: {} };
  const warnKeys = Object.keys(report.warns).sort((a, b) => report.warns[b].n - report.warns[a].n);
  const forcedCodes = Object.keys(report.forced);
  const attrName = c => (attributes.find(a => a.code === c) || {}).name || c;
  const total   = added + updated + deleted;
  const hasErr  = errors.length > 0;
  const success = total > 0;

  return `
    <div style="text-align:center;padding:32px 0 24px">
      <div style="font-size:52px;margin-bottom:12px">
        ${success ? '&#9989;' : '&#9888;&#65039;'}
      </div>
      <div style="font-size:18px;font-weight:700;color:#1a2332;margin-bottom:6px">
        Import ${success ? 'terminé' : 'sans résultat'}
      </div>
      <div style="font-size:13px;color:#607080">
        ${total} opération${total > 1 ? 's' : ''} effectuée${total > 1 ? 's' : ''}
      </div>
    </div>

    <!-- Compteurs -->
    <div style="display:flex;justify-content:center;gap:16px;
      flex-wrap:wrap;margin-bottom:24px">
      ${[
        { label: 'Ajoutés',    val: added,   color: '#2e7d32', bg: '#e8f5e9' },
        { label: 'Modifiés',   val: updated, color: '#1565c0', bg: '#e3f2fd' },
        { label: 'Supprimés',  val: deleted, color: '#c62828', bg: '#fce4ec' },
        { label: 'Erreurs',    val: errors.length, color: '#e65100', bg: '#fff3e0' },
      ].map(r => `
        <div style="background:${r.bg};border-radius:12px;padding:16px 24px;
          text-align:center;min-width:100px">
          <div style="font-size:28px;font-weight:800;color:${r.color}">${r.val}</div>
          <div style="font-size:12px;font-weight:600;color:${r.color};
            text-transform:uppercase;letter-spacing:0.5px">${r.label}</div>
        </div>`
      ).join('')}
    </div>

    ${warnKeys.length ? `
      <div class="field-group" style="margin-bottom:20px">
        <div class="field-group-title" style="color:#e65100">Valeurs non reprises (${warnKeys.length})</div>
        <div style="max-height:220px;overflow-y:auto">
          ${warnKeys.map(k => `<div class="import-report-line"><span>${escapeHtml(k)}</span><b>${report.warns[k].n} ligne${report.warns[k].n > 1 ? 's' : ''}</b></div>`).join('')}
        </div>
      </div>` : ''}
    ${forcedCodes.length ? `
      <div class="field-group" style="margin-bottom:20px">
        <div class="field-group-title" style="color:#1565c0">Champs calculés forcés (valeur du fichier différente du calcul)</div>
        ${forcedCodes.map(c => `<div class="import-report-line"><span><b>${escapeHtml(attrName(c))}</b> : ${report.forced[c].n} forcé${report.forced[c].n > 1 ? 's' : ''}, ${report.same[c] || 0} identique${(report.same[c] || 0) > 1 ? 's' : ''} au calcul
          <span class="calc-meta">${report.forced[c].ex.map(escapeHtml).join(' · ')}</span></span></div>`).join('')}
      </div>` : ''}

    <!-- Erreurs -->
    ${hasErr ? `
      <div class="field-group" style="margin-bottom:20px">
        <div class="field-group-title" style="color:#e65100">
          &#9888;&#65039; ${errors.length} avertissement${errors.length > 1 ? 's' : ''}
        </div>
        <div style="max-height:180px;overflow-y:auto">
          ${errors.map(e => `
            <div style="font-size:12px;color:#607080;padding:5px 0;
              border-bottom:1px solid #f0f4f8">${e}</div>`
          ).join('')}
        </div>
      </div>` : ''}

    <!-- Actions -->
    <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap">
      <button class="btn btn-secondary"
        onclick="renderImportPage()">
        Nouvel import
      </button>
      <button class="btn btn-primary"
        onclick="showPage('products',
          document.querySelector('.nav-item[onclick*=\'products\']'))">
        Voir les produits
      </button>
    </div>`;
}

// ============================================================
// TRAME EXCEL
// ============================================================
// Enregistre la correspondance de l'étape 2 comme trame d'import (et d'export)
function saveImportTrame() {
  if (!requirePerm(canMod('mod_trames', 'w'))) return;
  const name = ((document.getElementById('import-trame-name') || {}).value || '').trim();
  if (!name) { showNotif('Donnez un nom à la trame', 'warn'); return; }
  if (trames.some(t => t.name.toLowerCase() === name.toLowerCase())) { showNotif('Cette trame existe déjà', 'error'); return; }
  const columns = Object.keys(importParsedRows[0] || {}).filter(h => importColMapping[h])
    .map(h => ({ header: h, code: importColMapping[h] }));
  if (!columns.length) { showNotif('Aucune colonne reliée', 'warn'); return; }
  const t = { id: 'trm_' + (nextTrameId++), name, import: true, export: true,
    cats: importCategory ? [importCategory] : [], sheet: 'Import', columns };
  trames.push(t);
  importTrameId = t.id;
  showNotif('Trame enregistrée : ' + name);
}

function downloadTrame() {
  if (typeof XLSX === 'undefined') {
    showNotif('Erreur : librairie SheetJS non chargee', 'error');
    return;
  }

  // Trame choisie dans la liste « Trame » ; sans trame, Catalogue de la catégorie
  const chosen = trameById(importTrameId) || trameById('catalogue');
  if (chosen && !chosen.dynamic) {
    const t = chosen;
    const ws = XLSX.utils.aoa_to_sheet([t.columns.map(c => c.header)]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t.sheet || 'Import');
    XLSX.writeFile(wb, 'trame_' + t.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_') + '.xlsx');
    showNotif('Trame téléchargée : ' + t.name);
    return;
  }
  // Catalogue : champs de la catégorie choisie à gauche (toutes sinon)
  const catName = (document.getElementById('import-cat') || {}).value || '';
  const req     = getRequiredImportAttrs(catName);
  const rest    = getImportTargetAttrsFor(catName)
    .map(a => a.code)
    .filter(c => !req.some(a => a.code === c));
  const headers = [...req.map(a => a.code), ...rest];

  const exampleRow = headers.map(h => {
    if (h === 'ean') return '02000000079688';
    if (h === 'sap') return 'M908642300001';
    if (h === 'nom') return 'Exemple produit';
    if (h === 'cat') return catName || (categories[0] ? categories[0].name : '');
    return '';
  });

  const wb = XLSX.utils.book_new();

  // Onglet Donnees
  const wsData = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  wsData['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 16) }));
  // Style en-tete
  headers.forEach((_, c) => {
    const cell = wsData[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) cell.s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1A2332' } },
    };
  });
  XLSX.utils.book_append_sheet(wb, wsData, 'Donnees');

  // Onglet Notice
  const noticeRows = [
    ['OctoPIM — Trame d\'import', ''],
    ['', ''],
    ['Catégorie cible', catName || 'Toutes'],
    ['Date generation', todayStr()],
    ['', ''],
    ['CHAMPS OBLIGATOIRES (codes techniques en en-tete)', ''],
    ...req.map(a => [a.code, 'Obligatoire — ' + a.name]),
    ['', ''],
    ['ACTIONS DISPONIBLES', ''],
    ['Ajout',       'Créer de nouveaux produits — matching sur ean puis sap'],
    ['Modification','Mettre à jour des produits existants — matching sur ean puis sap'],
    ['Suppression', 'Supprimer des produits — matching sur ean puis sap'],
    ['', ''],
    ['NOTES', ''],
    ['- Ne pas modifier les en-tetes de colonnes (codes techniques)', ''],
    ['- Laisser vide les colonnes non renseignees', ''],
    ['- Encodage UTF-8 pour les fichiers CSV', ''],
  ];
  const wsNotice = XLSX.utils.aoa_to_sheet(noticeRows);
  wsNotice['!cols'] = [{ wch: 30 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsNotice, 'Notice');

  const catStr  = catName ? '_' + catName.replace(/\s+/g, '_') : '';
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  XLSX.writeFile(wb, `trame_import${catStr}_${dateStr}.xlsx`);
  showNotif('Trame téléchargée');
}
