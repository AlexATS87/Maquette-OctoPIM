// ============================================================
// BAREMES-WORKFLOW.JS — Modules d'administration Champs calculés et Workflow
// ============================================================

// ============================================================
// CHAMPS CALCULES : tables de calcul
// Une table par champ. Colonnes = conditions (champ + operateur),
// lignes = valeurs puis resultat ; la premiere ligne vraie gagne.
// Le metier change une valeur ici, sans toucher a une formule.
// ============================================================

function calcAttrName(code) {
  if (code === 'cat') return 'Catégorie';
  const a = attributes.find(x => x.code === code);
  return a ? a.name : code;
}

// Champs proposés comme condition : tout sauf texte long, images et le champ calculé lui-même
function calcCondAttrs(t) {
  const list = [{ code: 'cat', name: 'Catégorie' }];
  attributes.forEach(a => {
    if (a.code === 'cat' || a.code === t.attrCode) return;
    if (a.type === 'Texte long' || a.type === 'Image') return;
    list.push({ code: a.code, name: a.name });
  });
  return list;
}

function calcProductsUsing(t) {
  const groupIds = new Set(attrGroups.filter(g => (g.attrIds || []).includes((attributes.find(a => a.code === t.attrCode) || {}).id)).map(g => g.id));
  return (products || []).filter(p => {
    if (p.deleted) return false;
    const cat = getCatByName(p.cat);
    return !cat || cat.groupIds.some(id => groupIds.has(id));
  });
}

// Lignes jamais atteintes : une ligne précédente vide partout (« sinon ») les masque
function calcDeadLines(t) {
  const out = [];
  let catchAll = -1;
  t.lines.forEach((l, i) => {
    if (catchAll >= 0) out.push(i);
    else if (l.vals.every(v => String(v || '').trim() === '')) catchAll = i;
  });
  return out;
}

function calcCellInput(t, li, ci, canW) {
  const c = t.conditions[ci];
  const v = t.lines[li].vals[ci] || '';
  if (!canW) return escapeHtml(v || '—');
  const a = attributes.find(x => x.code === c.attrCode);
  const opts = c.attrCode === 'cat' ? categories.map(x => x.name) : ((a && a.options) || []);
  const list = opts.length && (c.op === '=' || c.op === '≠') ? ` list="calc-dl-${t.id}-${ci}"` : '';
  return `<input class="field-input calc-cell" value="${escapeHtml(v)}" placeholder="peu importe"${list}
    onchange="setCalcCell(${t.id},${li},${ci},this.value)">`;
}

// Un seul module pour tous les champs calculés. Chaque champ a un mode :
// « Table » (correspondance, première ligne vraie) ou « Formule » (calcul).
let _openCalcCode = null;
let _calcSearch = '';
let _calcModeFilter = '';

function calcFieldMode(a) {
  if (isTableFormula(a.formula)) return 'table';
  if (a.formula) return 'formula';
  return 'todo';
}

let _calcReturnAttrId = null;

// Modifications non enregistrées : instantané de chaque champ touché, pour
// pouvoir annuler. On enregistre depuis la carte, ou depuis l'attribut
// quand on vient de sa fiche.
let _calcSnap = {};

function calcTouch(code) {
  if (_calcSnap[code]) return;
  const a = attributes.find(x => x.code === code); if (!a) return;
  const t = calcTables.find(x => x.attrCode === code);
  _calcSnap[code] = { calc: a.calc, formula: a.formula, formulaLabel: a.formulaLabel,
    alt: a._altFormula, altLabel: a._altLabel, table: t ? JSON.parse(JSON.stringify(t)) : null };
}

function calcHasPending(code) {
  return code ? !!_calcSnap[code] : Object.keys(_calcSnap).length > 0;
}

function calcRestore(code) {
  const snap = _calcSnap[code]; if (!snap) return;
  const a = attributes.find(x => x.code === code);
  if (a) Object.assign(a, { calc: snap.calc, formula: snap.formula, formulaLabel: snap.formulaLabel,
    _altFormula: snap.alt, _altLabel: snap.altLabel });
  calcTables = calcTables.filter(x => x.attrCode !== code);
  if (snap.table) calcTables.push(snap.table);
  delete _calcSnap[code];
}

function calcCommit(code) { delete _calcSnap[code]; }

function calcCancelField(code) {
  calcRestore(code);
  afterCalcChange('Modifications annulées');
}

function calcSaveField(code) {
  if (!requirePerm(canMod('mod_calc', 'w'))) return;
  calcCommit(code);
  afterCalcChange('Calcul enregistré');
}

// Appelée par showPage : on ne quitte pas le module (ou l'attribut qui y
// renvoie) en laissant des modifications non enregistrées.
function calcLeaveGuard(target) {
  const cur = (document.querySelector('.page.active') || {}).id || '';
  if (cur === 'page-admin-calc' && target !== 'admin-calc' && target !== 'admin-attribute-edit' && calcHasPending()) {
    if (!confirm('Abandonner les modifications non enregistrées des champs calculés ?')) return false;
    Object.keys(_calcSnap).forEach(calcRestore);
    (products || []).forEach(p => computeCalcFields(p));
    _calcReturnAttrId = null;
  }
  if (cur === 'page-admin-attribute-edit' && target !== 'admin-calc' && target !== 'admin-attribute-edit') {
    const a = attributes.find(x => x.id === editingAttrId);
    if (a && calcHasPending(a.code)) {
      if (!confirm('Abandonner les modifications du calcul de « ' + a.name + ' » ?')) return false;
      calcRestore(a.code);
      (products || []).forEach(p => computeCalcFields(p));
    }
    _calcReturnAttrId = null;
  }
  return true;
}

function calcFields() {
  return attributes.filter(a => a.calc || a.formula || a.id === _calcReturnAttrId);
}

// Les produits sont recalculés une fois par affichage (renderCalcTablesPage)
function calcFieldEmptyCount(a) {
  const used = calcProductsUsing({ attrCode: a.code });
  return used.filter(p => String(p.fields[a.code] ?? '') === '').length;
}

function calcModeChip(mode) {
  const label = { table: 'Table', formula: 'Formule', builtin: 'Intégré', todo: 'À régler' }[mode];
  return `<span class="calc-mode calc-mode-${mode}">${label}</span>`;
}

function renderCalcTableBody(t, canW) {
  const target = attributes.find(a => a.code === t.attrCode);
  const dead = calcDeadLines(t);
  const datalists = t.conditions.map((c, ci) => {
    const a = attributes.find(x => x.code === c.attrCode);
    const opts = c.attrCode === 'cat' ? categories.map(x => x.name) : ((a && a.options) || []);
    return opts.length ? `<datalist id="calc-dl-${t.id}-${ci}">${opts.map(o => `<option value="${escapeHtml(o)}">`).join('')}</datalist>` : '';
  }).join('');
  const condHead = t.conditions.map((c, ci) => {
    if (!canW) return `<th>${escapeHtml(calcAttrName(c.attrCode))} ${escapeHtml(c.op)}</th>`;
    const attrSel = `<select class="form-select" onchange="setCalcCond(${t.id},${ci},'attrCode',this.value)">
        ${calcCondAttrs(t).map(a => `<option value="${a.code}"${a.code === c.attrCode ? ' selected' : ''}>${escapeHtml(a.name)}</option>`).join('')}
      </select>`;
    const opSel = `<select class="form-select calc-op" data-combo="off" onchange="setCalcCond(${t.id},${ci},'op',this.value)">
        ${CALC_OPS.map(o => `<option${o === c.op ? ' selected' : ''}>${o}</option>`).join('')}
      </select>`;
    return `<th class="calc-cond-th"><div class="calc-cond">${attrSel}${opSel}
      <button class="action-btn-danger btn-trash" title="Supprimer la condition" onclick="removeCalcCond(${t.id},${ci})">${TRASH_ICON}</button></div></th>`;
  }).join('');
  const rows = t.lines.map((l, li) => {
    const cells = t.conditions.map((c, ci) => `<td>${calcCellInput(t, li, ci, canW)}</td>`).join('');
    const res = canW
      ? `<input class="field-input calc-cell calc-result" value="${escapeHtml(l.result)}" onchange="setCalcResult(${t.id},${li},this.value)">`
      : `<b>${escapeHtml(l.result)}</b>`;
    const actions = canW ? `<div class="wf-actions" style="margin:0">
        <button class="btn btn-secondary wf-btn" title="Monter" ${li === 0 ? 'disabled' : ''} onclick="moveCalcLine(${t.id},${li},-1)">&uarr;</button>
        <button class="btn btn-secondary wf-btn" title="Descendre" ${li === t.lines.length - 1 ? 'disabled' : ''} onclick="moveCalcLine(${t.id},${li},1)">&darr;</button>
        <button class="action-btn-danger btn-trash" title="Supprimer la ligne" onclick="removeCalcLine(${t.id},${li})">${TRASH_ICON}</button>
      </div>` : '';
    return `<tr class="${dead.includes(li) ? 'calc-dead' : ''}">
      <td style="color:#8a9bb0">${li + 1}</td>${cells}<td>${res}</td><td>${actions}</td></tr>`;
  }).join('');
  return `<div style="overflow-x:auto"><table class="calc-table">
        <thead><tr><th>#</th>${condHead}
          <th>Résultat : ${escapeHtml(target ? target.name : t.attrCode)}</th>
          <th>${canW ? `<button class="btn btn-secondary" style="white-space:nowrap" onclick="addCalcCond(${t.id})">+ Condition</button>` : ''}</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="${t.conditions.length + 3}" style="color:#a0b0c0">Aucune ligne.</td></tr>`}</tbody>
      </table></div>
      ${datalists}
      ${canW ? `<button class="btn btn-secondary" style="margin-top:8px" onclick="addCalcLine(${t.id})">+ Ligne</button>` : ''}
      ${dead.length ? `<div class="calc-warn">&#9888; ${dead.length} ligne${dead.length > 1 ? 's' : ''} jamais atteinte${dead.length > 1 ? 's' : ''}</div>` : ''}`;
}

function renderCalcFormulaBody(a, canW) {
  const ops = FORMULA_OPERATORS.filter(o => o.token !== 'TABLE()' && !o.token.startsWith('MAP(')).map(o =>
    `<span class="calc-token" title="${escapeHtml(o.help)}">${escapeHtml(o.token)}</span>`).join('');
  const codes = attributes.filter(x => x.code !== a.code && x.type !== 'Image').map(x =>
    `<span class="calc-token calc-token-code" title="${escapeHtml(x.name)}" onclick="insertCalcToken('${a.code}','[${x.code}]')">${x.code}</span>`).join('');
  if (!canW) return `<code class="calc-formula-ro">${escapeHtml(a.formula)}</code>`;
  return `
    <div class="form-field">
      <div class="form-label">Formule</div>
      <textarea class="field-input calc-formula" id="calc-f-${a.code}" rows="3" spellcheck="false"
        onchange="setCalcFormula('${a.code}',this.value)">${escapeHtml(a.formula || '')}</textarea>
    </div>
    <div class="form-field" style="margin-top:8px">
      <div class="form-label">Libellé du calcul</div>
      <input class="field-input" value="${escapeHtml(a.formulaLabel || '')}" onchange="setCalcFormulaLabel('${a.code}',this.value)">
    </div>
    <div class="calc-tokens"><b>Opérateurs</b> ${ops}</div>
    <details class="calc-tokens"><summary>Champs (${attributes.length - 1})</summary><div class="calc-codes">${codes}</div></details>`;
}

function renderCalcFieldCard(a, canW, canD) {
  const open = _openCalcCode === a.code;
  const mode = calcFieldMode(a);
  const t = calcTableFor(a.code);
  const empty = calcFieldEmptyCount(a);
  const dup = attributes.filter(x => x.name === a.name).length > 1;
  const meta = mode === 'table' && t
    ? `${t.conditions.length} condition${t.conditions.length > 1 ? 's' : ''} · ${t.lines.length} ligne${t.lines.length > 1 ? 's' : ''}`
    : escapeHtml(a.formulaLabel || '');
  const head = `<div class="calc-card-head" onclick="toggleCalcField('${a.code}')">
      <span class="calc-chevron">${open ? '&#9662;' : '&#9656;'}</span>
      <span style="font-weight:700;color:#1a2332">${escapeHtml(a.name)}</span>
      ${dup ? `<span class="calc-meta">· ${escapeHtml((getGroupById(a.groupId) || {}).name || '')}</span>` : ''}
      ${calcModeChip(mode)}
      ${calcHasPending(a.code) ? '<span class="calc-mode calc-mode-todo">Non enregistré</span>' : ''}
      <span class="calc-meta calc-meta-ell">${meta}</span>
      <span style="flex:1"></span>
      ${empty ? `<span class="calc-meta">${empty} sans résultat</span>` : ''}
    </div>`;
  if (!open) return `<div class="table-container calc-card${calcHasPending(a.code) ? ' calc-pending' : ''}">${head}</div>`;
  let body;
  if (mode === 'builtin') body = `<div class="calc-meta">${escapeHtml(a.formulaLabel || '')}</div>`;
  else {
    const sw = canW ? `<div class="calc-switch">
        <button class="${mode === 'table' ? 'on' : ''}" onclick="setCalcMode('${a.code}','table')">Table</button>
        <button class="${mode !== 'table' ? 'on' : ''}" onclick="setCalcMode('${a.code}','formula')">Formule</button>
      </div>` : '';
    body = sw + (mode === 'table' && t ? renderCalcTableBody(t, canW) : renderCalcFormulaBody(a, canW));
  }
  const fromAttr = _calcReturnAttrId === a.id;
  const bar = calcHasPending(a.code) && canW ? `<div class="calc-savebar">
      <button class="btn btn-secondary" onclick="calcCancelField('${a.code}')">Annuler</button>
      ${fromAttr
        ? `<button class="btn btn-primary" onclick="returnToAttrFromCalc()">&larr; Retour à l’attribut</button>`
        : `<button class="btn btn-primary" onclick="calcSaveField('${a.code}')">Enregistrer</button>`}
    </div>` : '';
  return `<div class="table-container calc-card open${calcHasPending(a.code) ? ' calc-pending' : ''}">${head}<div class="calc-body">${body}${bar}</div></div>`;
}

function renderCalcTablesPage() {
  const page = document.getElementById('page-admin-calc');
  if (!page) return;
  const canW = canMod('mod_calc', 'w');
  const canD = canMod('mod_calc', 'd');
  const q = _calcSearch.trim().toLowerCase();
  (products || []).forEach(p => computeCalcFields(p));
  const back = _calcReturnAttrId ? attributes.find(a => a.id === _calcReturnAttrId) : null;
  const list = calcFields()
    .filter(a => !_calcModeFilter || calcFieldMode(a) === _calcModeFilter || (_calcModeFilter === 'formula' && calcFieldMode(a) === 'todo'))
    .filter(a => !q || a.name.toLowerCase().includes(q) || a.code.includes(q))
    .sort((x, y) => (x.code === _openCalcCode ? -1 : y.code === _openCalcCode ? 1 : 0) || x.name.localeCompare(y.name, 'fr'));
  page.innerHTML = `
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <button class="btn btn-secondary" onclick="showPage('admin',null)">&larr; Administration</button>
      <span style="font-size:15px;font-weight:700;color:#1a2332">Champs calculés</span>
      <input class="field-input" style="max-width:220px" placeholder="Rechercher un champ" value="${escapeHtml(_calcSearch)}"
        oninput="_calcSearch=this.value;renderCalcTablesPage();const i=document.querySelector('#page-admin-calc input');i.focus();i.setSelectionRange(i.value.length,i.value.length)">
      <select class="form-select" data-combo="off" style="max-width:160px" onchange="_calcModeFilter=this.value;renderCalcTablesPage()">
        <option value="">Tous (${calcFields().length})</option>
        <option value="table"${_calcModeFilter === 'table' ? ' selected' : ''}>Tables</option>
        <option value="formula"${_calcModeFilter === 'formula' ? ' selected' : ''}>Formules</option>
      </select>
      ${back ? `<button class="btn btn-primary" style="margin-left:auto" onclick="returnToAttrFromCalc()">&larr; Retour à l’attribut « ${escapeHtml(back.name)} »</button>` : ''}
    </div>
    ${list.map(a => renderCalcFieldCard(a, canW, canD)).join('') || '<div style="color:#a0b0c0">Aucun champ.</div>'}`;
}

function toggleCalcField(code) {
  _openCalcCode = _openCalcCode === code ? null : code;
  renderCalcTablesPage();
}

// Depuis la fiche d'un attribut : ouvre le module sur ce champ
function openCalcFieldFromAttr(code) {
  const a = attributes.find(x => x.code === code);
  _openCalcCode = code;
  _calcSearch = '';
  _calcModeFilter = '';
  _calcReturnAttrId = a ? a.id : null;
  document.querySelectorAll('.modal-overlay').forEach(m => { if (m.id) m.style.display = 'none'; else m.remove(); });
  showPage('admin-calc', null);
}

// Retour à la fiche de l'attribut, restée ouverte avec ses modifications
function returnToAttrFromCalc() {
  const id = _calcReturnAttrId;
  _calcReturnAttrId = null;
  if (id && id === editingAttrId) showPage('admin-attribute-edit', null);
  else if (id) editAttribute(id);
  else showPage('admin-attributes', null);
}

function setCalcMode(code, mode) {
  if (!requirePerm(canMod('mod_calc', 'w'))) return;
  const a = attributes.find(x => x.code === code); if (!a) return;
  if ((mode === 'table') === isTableFormula(a.formula)) return;
  calcTouch(code);
  const t = calcTableFor(code);
  if (mode === 'table') {
    // la formule est mise de côté, pas effacée
    a._altFormula = a.formula || '';
    a._altLabel = a.formulaLabel || '';
    a.formula = '=TABLE()';
    a.formulaLabel = 'Table de calcul';
    if (!t) calcTables.push({ id: nextCalcTableId++, attrCode: code, note: '', conditions: [{ attrCode: 'cat', op: '=' }], lines: [{ vals: [''], result: '' }] });
  } else {
    // la table reste en mémoire : revenir sur « Table » la retrouve
    a.formula = a._altFormula || '';
    a.formulaLabel = a._altLabel || '';
  }
  a.calc = true;
  afterCalcChange();
}

function setCalcFormula(code, val) {
  if (!requirePerm(canMod('mod_calc', 'w'))) return;
  const a = attributes.find(x => x.code === code); if (!a) return;
  calcTouch(code);
  a.formula = String(val || '').trim();
  a.calc = true;
  afterCalcChange();
}

function setCalcFormulaLabel(code, val) {
  if (!requirePerm(canMod('mod_calc', 'w'))) return;
  const a = attributes.find(x => x.code === code); if (!a) return;
  calcTouch(code);
  a.formulaLabel = String(val || '').trim();
  afterCalcChange();
}

function insertCalcToken(code, token) {
  const el = document.getElementById('calc-f-' + code);
  if (!el) return;
  const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? el.value.length;
  el.value = el.value.slice(0, s) + token + el.value.slice(e);
  el.focus();
  el.setSelectionRange(s + token.length, s + token.length);
  setCalcFormula(code, el.value);
}

function uncalcField(code) {
  if (!requirePerm(canMod('mod_calc', 'd'))) return;
  const a = attributes.find(x => x.code === code); if (!a) return;
  if (!confirm('« ' + a.name + ' » ne sera plus calculé et redeviendra un champ saisi. Continuer ?')) return;
  calcTables = calcTables.filter(x => x.attrCode !== code);
  a.calc = false; a.formula = ''; a.formulaLabel = '';
  if (_openCalcCode === code) _openCalcCode = null;
  afterCalcChange('« ' + a.name + ' » redevient un champ saisi');
}

// Compatibilité : anciens appels par id de table
function deleteCalcTable(id) {
  const t = calcT(id); if (t) uncalcField(t.attrCode);
}

function calcTargetAttrs() {
  return attributes.filter(a => !a.system && !a.readonly && a.type !== 'Image' && a.type !== 'Texte long'
    && !a.calc && !a.formula && a.code !== 'cat');
}

function openCalcTableModal() {
  if (!requirePerm(canMod('mod_calc', 'w'))) return;
  const targets = calcTargetAttrs();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:480px;width:100%">
      <div class="modal-title">Nouveau champ calculé</div>
      <div class="form-field">
        <div class="form-label">Champ</div>
        <select class="form-select" id="calc-new-attr">
          ${targets.map(a => `<option value="${a.code}">${escapeHtml(a.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-field" style="margin-top:10px">
        <div class="form-label">Mode</div>
        <select class="form-select" id="calc-new-mode" data-combo="off">
          <option value="table">Table</option>
          <option value="formula">Formule</option>
        </select>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
        <button class="btn btn-primary" onclick="createCalcTable(this)">Créer</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function createCalcTable(btn) {
  if (!requirePerm(canMod('mod_calc', 'w'))) return;
  const code = document.getElementById('calc-new-attr').value;
  const mode = document.getElementById('calc-new-mode').value;
  const a = attributes.find(x => x.code === code);
  if (!a) return;
  a.calc = true;
  a.inCompletion = false;
  _openCalcCode = code;
  btn.closest('.modal-overlay').remove();
  if (mode === 'table') setCalcMode(code, 'table');
  else { a.formula = ''; afterCalcChange('Champ calculé ajouté'); }
}

function afterCalcChange(msg) {
  (products || []).forEach(p => computeCalcFields(p));
  renderCalcTablesPage();
  renderAdminHome();
  if (msg) showNotif(msg);
}

function calcT(id) { return calcTables.find(x => x.id === id); }

function setCalcCell(id, li, ci, raw) {
  if (!requirePerm(canMod('mod_calc', 'w'))) return;
  const t = calcT(id); if (!t) return;
  calcTouch(t.attrCode);
  t.lines[li].vals[ci] = String(raw || '').trim();
  afterCalcChange();
}

function setCalcResult(id, li, raw) {
  if (!requirePerm(canMod('mod_calc', 'w'))) return;
  const t = calcT(id); if (!t) return;
  calcTouch(t.attrCode);
  t.lines[li].result = String(raw || '').trim().replace(/^(-?\d+),(\d+)$/, '$1.$2');
  afterCalcChange();
}

function setCalcCond(id, ci, key, val) {
  if (!requirePerm(canMod('mod_calc', 'w'))) return;
  const t = calcT(id); if (!t) return;
  calcTouch(t.attrCode);
  t.conditions[ci][key] = val;
  afterCalcChange();
}

function addCalcCond(id) {
  if (!requirePerm(canMod('mod_calc', 'w'))) return;
  const t = calcT(id); if (!t) return;
  calcTouch(t.attrCode);
  t.conditions.push({ attrCode: 'cat', op: '=' });
  t.lines.forEach(l => l.vals.push(''));
  afterCalcChange();
}

function removeCalcCond(id, ci) {
  if (!requirePerm(canMod('mod_calc', 'w'))) return;
  const t = calcT(id); if (!t) return;
  calcTouch(t.attrCode);
  if (!confirm('Supprimer la condition « ' + calcAttrName(t.conditions[ci].attrCode) + ' » et sa colonne ?')) return;
  t.conditions.splice(ci, 1);
  t.lines.forEach(l => l.vals.splice(ci, 1));
  afterCalcChange();
}

function addCalcLine(id) {
  if (!requirePerm(canMod('mod_calc', 'w'))) return;
  const t = calcT(id); if (!t) return;
  calcTouch(t.attrCode);
  const line = { vals: t.conditions.map(() => ''), result: '' };
  // nouvelle ligne avant un éventuel « sinon » final
  const last = t.lines[t.lines.length - 1];
  if (last && last.vals.every(v => !String(v || '').trim())) t.lines.splice(t.lines.length - 1, 0, line);
  else t.lines.push(line);
  afterCalcChange();
}

function removeCalcLine(id, li) {
  if (!requirePerm(canMod('mod_calc', 'w'))) return;
  const t = calcT(id); if (!t) return;
  calcTouch(t.attrCode);
  t.lines.splice(li, 1);
  afterCalcChange();
}

function moveCalcLine(id, li, d) {
  if (!requirePerm(canMod('mod_calc', 'w'))) return;
  const t = calcT(id); if (!t) return;
  calcTouch(t.attrCode);
  const j = li + d;
  if (j < 0 || j >= t.lines.length) return;
  [t.lines[li], t.lines[j]] = [t.lines[j], t.lines[li]];
  afterCalcChange();
}

// ============================================================
// WORKFLOW : jalons et regle de chacun
// ============================================================
function workflowRuleAttrs() {
  return attributes.filter(a => a.type !== 'Texte long' && a.code !== 'etape_workflow' && a.code !== 'completion');
}

function workflowValueOptions(attrCode) {
  const a = attributes.find(x => x.code === attrCode);
  if (!a) return [];
  if (a.code === 'statut_publication' || a.type === 'Oui / Non') {
    return (a.options && a.options.length) ? a.options : ['Oui', 'Non'];
  }
  return a.options || [];
}

// Onglets proposés pour la règle « complétion des onglets » : ceux qui
// comptent dans la complétion (hors onglets système)
function workflowRuleGroups() {
  return attrGroups.filter(g => !g.system && !g.isSynthGroup);
}

function workflowRuleCell(s) {
  const r = s.rule || {};
  const kindSel = `<span class="wf-rule-kind"><select class="form-select" data-combo="off" onchange="setWorkflowRule(${s.id},'kind',this.value)">
    <option value="groups"${r.kind === 'groups' ? ' selected' : ''}>Complétion des onglets ≥</option>
    <option value="filled"${r.kind === 'filled' ? ' selected' : ''}>Champ renseigné</option>
    <option value="equals"${r.kind === 'equals' ? ' selected' : ''}>Champ égal à</option>
  </select></span>`;
  let rest = '';
  if (r.kind === 'groups') {
    const chosen = r.groupIds || [];
    const chips = workflowRuleGroups().map(g => `
      <label class="wf-group-chip${chosen.includes(g.id) ? ' on' : ''}">
        <input type="checkbox" ${chosen.includes(g.id) ? 'checked' : ''} onchange="toggleWorkflowGroup(${s.id},${g.id},this.checked)">
        ${escapeHtml(g.name)}
      </label>`).join('');
    rest = `<span class="wf-rule-thr"><input class="field-input" value="${Number(r.threshold) || 100}"
        onchange="setWorkflowRule(${s.id},'threshold',this.value)"> %</span>
      <div class="wf-group-chips">${chips}</div>`;
  } else {
    const attrOpts = workflowRuleAttrs()
      .map(a => `<option value="${a.code}"${a.code === r.attrCode ? ' selected' : ''}>${escapeHtml(a.name)}</option>`)
      .join('');
    rest = `<span class="wf-rule-attr"><select class="form-select" onchange="setWorkflowRule(${s.id},'attrCode',this.value)">${attrOpts}</select></span>`;
    if (r.kind === 'equals') {
      const vals = workflowValueOptions(r.attrCode);
      rest += vals.length
        ? `<span class="wf-rule-val"><select class="form-select" data-combo="off" onchange="setWorkflowRule(${s.id},'value',this.value)">
            ${vals.map(v => `<option${v === r.value ? ' selected' : ''}>${escapeHtml(v)}</option>`).join('')}
          </select></span>`
        : `<span class="wf-rule-val"><input class="field-input" value="${escapeHtml(r.value || '')}"
            onchange="setWorkflowRule(${s.id},'value',this.value)"></span>`;
    }
  }
  return `<div class="wf-rule">${kindSel}${rest}</div>`;
}

function renderWorkflowPage() {
  const page = document.getElementById('page-admin-workflow');
  if (!page) return;
  const canW = canMod('mod_workflow', 'w');
  const canD = canMod('mod_workflow', 'd');
  const on = !!workflowEnabled;
  const visible = getAccessibleProducts();
  visible.forEach(p => computeCalcFields(p));

  const rows = workflowSteps.map((s, i) => {
    const reached = visible.filter(p => workflowStepReached(p, s)).length;
    const atStep = on ? visible.filter(p => workflowState(p).index === i + 1).length : 0;
    const nameCell = canW
      ? `<input class="field-input" value="${escapeHtml(s.name)}" onchange="renameWorkflowStep(${s.id},this.value)">`
      : escapeHtml(s.name);
    const actions = `
      ${canW ? `<button class="btn btn-secondary wf-btn" title="Monter" ${i === 0 ? 'disabled' : ''} onclick="moveWorkflowStep(${s.id},-1)">&uarr;</button>
        <button class="btn btn-secondary wf-btn" title="Descendre" ${i === workflowSteps.length - 1 ? 'disabled' : ''} onclick="moveWorkflowStep(${s.id},1)">&darr;</button>` : ''}
      ${canD ? `<button class="action-btn-danger btn-trash" title="Supprimer ce jalon" onclick="deleteWorkflowStep(${s.id})">${TRASH_ICON}</button>` : ''}`;
    return `<tr>
      <td style="color:#8a9bb0">${i + 1}</td>
      <td style="min-width:200px">${nameCell}<div class="wf-actions">${actions}</div></td>
      <td>${canW ? workflowRuleCell(s) : escapeHtml(workflowRuleText(s))}</td>
      <td title="Produits dont la règle de ce jalon est vraie">${reached}</td>
      <td title="Produits dont l'étape est ce jalon">${on ? `<a href="#" onclick="showWorkflowProducts(${i + 1});return false">${atStep}</a>` : '—'}</td>
    </tr>`;
  }).join('');
  const atStart = on ? visible.filter(p => workflowState(p).index === 0).length : 0;

  const toggle = `<label class="wf-toggle${canW ? '' : ' disabled'}">
      <input type="checkbox" ${on ? 'checked' : ''} ${canW ? '' : 'disabled'} onchange="setWorkflowEnabled(this.checked)">
      <span class="wf-toggle-track"><span></span></span>
      ${on ? 'Workflow activé' : 'Workflow désactivé'}
    </label>`;
  const gapsN = visible.filter(p => workflowState(p).gaps.length).length;
  const intro = on
    ? `${WORKFLOW_START_LABEL} : <a href="#" onclick="showWorkflowProducts(0);return false">${atStart} produit${atStart > 1 ? 's' : ''}</a>
       · À régulariser : <b>${gapsN}</b>`
    : '';

  page.innerHTML = `
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <button class="btn btn-secondary" onclick="showPage('admin',null)">&larr; Administration</button>
      <span style="font-size:15px;font-weight:700;color:#1a2332">Workflow</span>
      ${toggle}
      ${canW ? `<button class="btn btn-primary" style="margin-left:auto" onclick="addWorkflowStep()">+ Jalon</button>` : ''}
    </div>
    ${intro ? `<div style="font-size:13px;color:#607080;margin-bottom:14px">${intro}</div>` : ''}
    <div class="table-container${on ? '' : ' wf-off'}"><table>
      <thead><tr><th>#</th><th>Jalon</th><th>Règle</th><th>Atteint</th><th>À cette étape</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" style="color:#a0b0c0">Aucun jalon.</td></tr>'}</tbody>
    </table></div>`;
}

function setWorkflowEnabled(on) {
  if (!requirePerm(canMod('mod_workflow', 'w'))) return;
  workflowEnabled = !!on;
  products.forEach(p => computeCalcFields(p));
  showNotif(on ? 'Workflow activé' : 'Workflow désactivé', 'success');
  afterWorkflowChange();
}

function toggleWorkflowGroup(stepId, groupId, checked) {
  if (!requirePerm(canMod('mod_workflow', 'w'))) return;
  const s = workflowSteps.find(x => x.id === stepId);
  if (!s) return;
  const ids = new Set(s.rule.groupIds || []);
  if (checked) ids.add(groupId); else ids.delete(groupId);
  if (!ids.size) { showNotif('Choisissez au moins un onglet', 'warn'); renderWorkflowPage(); return; }
  s.rule.groupIds = [...ids];
  afterWorkflowChange();
}

function afterWorkflowChange() {
  syncWorkflowAttrOptions();
  delete colFilters.etape_workflow;
  renderWorkflowPage();
  renderAdminHome();
}

function setWorkflowRule(stepId, key, raw) {
  if (!requirePerm(canMod('mod_workflow', 'w'))) return;
  const s = workflowSteps.find(x => x.id === stepId);
  if (!s) return;
  const r = s.rule = s.rule || {};
  if (key === 'kind') {
    r.kind = raw;
    if (raw === 'groups') {
      r.threshold = r.threshold || 100;
      r.groupIds = r.groupIds && r.groupIds.length ? r.groupIds : [4];
      delete r.attrCode;
      delete r.value;
    } else {
      r.attrCode = r.attrCode || 'sap';
      delete r.groupIds;
      delete r.threshold;
      if (raw === 'equals') r.value = workflowValueOptions(r.attrCode)[0] || '';
      else delete r.value;
    }
  } else if (key === 'threshold') {
    const n = parseFloat(String(raw).replace(',', '.'));
    if (!isFinite(n) || n <= 0 || n > 100) { showNotif('Seuil entre 1 et 100', 'warn'); renderWorkflowPage(); return; }
    r.threshold = n;
  } else if (key === 'attrCode') {
    r.attrCode = raw;
    if (r.kind === 'equals') r.value = workflowValueOptions(raw)[0] || '';
  } else if (key === 'value') {
    r.value = raw;
  }
  afterWorkflowChange();
}

function renameWorkflowStep(stepId, name) {
  if (!requirePerm(canMod('mod_workflow', 'w'))) return;
  const s = workflowSteps.find(x => x.id === stepId);
  const t = String(name || '').trim();
  if (!s) return;
  if (!t || t === WORKFLOW_START_LABEL || workflowSteps.some(x => x !== s && x.name === t)) {
    showNotif('Nom vide ou déjà utilisé', 'warn');
    renderWorkflowPage();
    return;
  }
  s.name = t;
  afterWorkflowChange();
}

function moveWorkflowStep(stepId, delta) {
  if (!requirePerm(canMod('mod_workflow', 'w'))) return;
  const i = workflowSteps.findIndex(x => x.id === stepId);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= workflowSteps.length) return;
  [workflowSteps[i], workflowSteps[j]] = [workflowSteps[j], workflowSteps[i]];
  afterWorkflowChange();
}

function addWorkflowStep() {
  if (!requirePerm(canMod('mod_workflow', 'w'))) return;
  let n = 2;
  let name = 'Nouveau jalon';
  while (workflowSteps.some(s => s.name === name)) name = 'Nouveau jalon ' + (n++);
  workflowSteps.push({ id: nextWorkflowStepId++, name, rule: { kind: 'filled', attrCode: 'sap' } });
  afterWorkflowChange();
}

function deleteWorkflowStep(stepId) {
  if (!requirePerm(canMod('mod_workflow', 'd'))) return;
  const s = workflowSteps.find(x => x.id === stepId);
  if (!s || !confirm('Supprimer le jalon « ' + s.name + ' » ? L\'étape des produits sera recalculée.')) return;
  workflowSteps = workflowSteps.filter(x => x.id !== stepId);
  afterWorkflowChange();
}

// Ouvre la liste filtree sur une etape : 0 = « En création », n = n-ieme jalon
function showWorkflowProducts(index) {
  const label = workflowLabels()[index];
  if (!label || !isWorkflowOn()) return;
  colFilters = { etape_workflow: new Set([label]) };
  _filterIncomplets = false;
  _filterAlertId = null;
  const search = document.getElementById('products-search');
  if (search) search.value = '';
  const cat = document.getElementById('filter-cat');
  if (cat) cat.value = '';
  currentPage = 1;
  showPage('products', document.querySelector('.nav-item[data-nav="products"]'));
}
