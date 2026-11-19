// ============================================================
// JOURNAL — écran d'administration (lecture seule) et suivi des écrans d'administration
// Le journal lui-même (journalAdd, journalProduct, journalAdmin) est défini dans data.js.
// ============================================================

// ------------------------------------------------------------
// 1. Suivi automatique des enregistrements de l'administration
// ------------------------------------------------------------
// Avant et après chaque action d'administration, on compare l'état des éléments
// (catégories, attributs, groupes, alertes, etc.) et on écrit une ligne par différence.
const _jRowIds = new WeakMap();
let _jRowSeq = 1;
function _jRowKey(o) { if (!_jRowIds.has(o)) _jRowIds.set(o, _jRowSeq++); return 'r' + _jRowIds.get(o); }
const _jList = a => (a || []).map(String);
const _jYN = v => v ? 'Oui' : 'Non';
// Élément de liste lié à un identifiant : le libellé peut changer sans créer de fausse ligne
const _jK = (k, label) => k + '' + label;
const _jLab = s => String(s).split('').pop();

function _jItems() {
  const out = [];
  const add = (module, key, name, vals, attrCode) => out.push({ module, key: module + '|' + key, name: String(name == null ? '' : name), vals, attrCode });
  const attrName = c => (attributes.find(a => a.code === c) || {}).name || c || '';
  const grpName = id => (getGroupById(id) || {}).name || String(id);
  const affName = id => (affectGroups.find(g => g.id === id) || {}).name || String(id);
  const catName = id => (categories.find(c => c.id === id) || {}).name || String(id);

  categories.forEach(c => add('Catégories', c.id, c.name, {
    'Nom': c.name, 'Code': c.code, 'Couleur': c.color, 'Groupes d’attributs': (c.groupIds || []).map(id => _jK(id, grpName(id))) }));

  attrGroups.forEach(g => add('Groupes d’attributs', g.id, g.name, {
    'Nom': g.name, 'Code': g.code,
    'Attributs': (g.attrIds || []).map(x => isAttrSection(x) ? _jK(x, 'Intertitre « ' + x.slice(1) + ' »') : _jK(x, (getAttrById(x) || {}).name || x)),
    'Visible par': (g.audienceGroupIds || []).map(id => _jK(id, affName(id))) }));

  attributes.forEach(a => add('Attributs', a.id, a.name, {
    'Nom': a.name, 'Code technique': a.code, 'Type': a.type, 'Groupes': (attrGroups.filter(g => (g.attrIds || []).includes(a.id))).map(g => _jK(g.id, g.name)),
    'Obligatoire': _jYN(a.required), 'Compte dans la complétion': _jYN(a.inCompletion), 'Champ calculé': _jYN(a.calc),
    'Masque': a.mask || '', 'Longueur maximale': a.maxLength == null ? '' : a.maxLength,
    'Minimum': a.min == null ? '' : a.min, 'Maximum': a.max == null ? '' : a.max, 'Décimales': a.type === 'Nombre' ? (a.decimals || 0) : '',
    'Pas': a.step == null ? '' : a.step, 'Aide': a.helpText || '', 'Largeur': a.width || '', 'Suffixe de fichier': a.fileSuffix || '',
    'Affiché si (attribut)': a.showIfAttr ? attrName(a.showIfAttr) : '', 'Affiché si (valeur)': a.showIfValue || '',
    'Format': a.displayFormat || '', 'Options': _jList(a.options) }));

  add('Vue Synthèse', 'synth', 'Groupe Synthèse', { 'Colonnes': _jList((syntheseItems || []).map(i => i.label || i.code)) });

  add('Préférences', 'prefs', 'Application', {
    'Seuil de complétion (%)': seuilCompletion, 'Import de visuels : clé': appPrefs.visualKey, 'Import de visuels : séparateur': appPrefs.visualSep });

  (alerts || []).forEach(a => add('Alertes', a.id, a.name, {
    'Nom': a.name, 'Description': a.description || '', 'Conditions': typeof alertCondsText === 'function' ? alertCondsText(a) : '' }));

  (trames || []).forEach(t => add('Trames d’import / export', t.id, t.name, {
    'Nom': t.name, 'Export': _jYN(t.export), 'Import': _jYN(t.import), 'Feuille': t.sheet || '', 'Catégories': _jList(t.cats),
    'Colonnes': _jList((t.columns || []).map(c => (c.header || '') + (c.code ? ' [' + c.code + ']' : c.fixed ? ' = ' + c.fixed : '') + (c.required ? ' *' : ''))) }));

  (calcTables || []).forEach(t => add('Champs calculés', 'tab' + t.id, 'Tableau de ' + attrName(t.attrCode), {
    'Note': t.note || '',
    'Conditions': _jList((t.conditions || []).map(c => attrName(c.attrCode) + ' ' + (c.op || ''))),
    'Lignes': _jList((t.lines || []).map(l => (l.vals || []).join(' | ') + ' → ' + l.result)) }, t.attrCode));
  attributes.filter(a => a.calc || a.formula).forEach(a => add('Champs calculés', 'f' + a.id, a.name, {
    'Formule': a.formula || '', 'Libellé de la formule': a.formulaLabel || '' }, a.code));

  add('Workflow', 'wf', 'Workflow', { 'Activé': _jYN(workflowEnabled), 'Ordre des étapes': (workflowSteps || []).map(s => _jK(s.id, s.name)) });
  (workflowSteps || []).forEach(s => {
    const r = s.rule || {};
    const txt = r.kind === 'groups' ? 'Groupes ' + (r.groupIds || []).map(grpName).join(', ') + ' à ' + r.threshold + ' %'
      : r.kind === 'filled' ? attrName(r.attrCode) + ' renseigné'
      : r.kind === 'equals' ? attrName(r.attrCode) + ' = ' + (r.value == null ? '' : r.value) : JSON.stringify(r);
    add('Workflow', 's' + s.id, s.name, { 'Nom': s.name, 'Règle': txt, 'Groupes concernés': _jList((s.groupIds || []).map(grpName)) });
  });

  users.forEach(u => add('Utilisateurs & groupes', 'u' + u.id, u.name, {
    'Groupe d’affectation': u.groupId ? affName(u.groupId) : '' }));
  affectGroups.forEach(g => add('Utilisateurs & groupes', 'g' + g.id, g.name, {
    'Nom du groupe': g.name, 'Catégories': (g.catIds || []).map(id => _jK(id, catName(id))),
    'Menus': _jList((g.menuKeys || []).map(k => (NAV_MENUS.find(m => m.key === k) || {}).label || k)),
    'Modules': _jList((g.modKeys || []).map(k => (ADMIN_MODULES.find(m => m.key === k) || {}).label || k)) }));
  ACCESS_LEVELS.filter(l => l.key !== 'admin').forEach(l => {
    const vals = {};
    LEVEL_RIGHT_DEFS.forEach(r => { vals[r.label] = _jYN(levelCan(l.key, r.key)); });
    add('Utilisateurs & groupes', 'l' + l.key, 'Niveau ' + l.name, vals);
  });

  (refTables || []).forEach(t => {
    add('Référentiels', t.id, t.name, { 'Nom': t.name, 'Colonnes': _jList(t.columns) });
    (t.rows || []).forEach(r => {
      const first = t.columns && t.columns[0];
      add('Référentiels', _jRowKey(r), t.name + ' : ' + (first ? r[first] : ''), Object.fromEntries((t.columns || []).map(c => [c, r[c] == null ? '' : r[c]])));
    });
  });
  return out;
}

function _jSnapshot() {
  const m = new Map();
  try { _jItems().forEach(i => m.set(i.key, i)); } catch (e) { console.warn('journal : instantané impossible', e); }
  return m;
}

const _jEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function _jDiff(before, after) {
  const lines = [];
  const counts = {};
  const line = (it, field, o, n) => lines.push({ it, field, o, n });
  after.forEach((a, key) => {
    const b = before.get(key);
    if (!b) { counts[a.module] = counts[a.module] || { c: 0, d: 0 }; counts[a.module].c++; line(a, 'Création', '', a.name); return; }
    Object.keys(a.vals).forEach(f => {
      const av = a.vals[f], bv = b.vals[f];
      if (_jEq(av, bv)) return;
      if (Array.isArray(av)) {
        const bl = Array.isArray(bv) ? bv : [];
        const keyOf = s => String(s).split('')[0];
        const ak = av.map(keyOf), bk = bl.map(keyOf);
        const added = av.filter(x => !bk.includes(keyOf(x))), removed = bl.filter(x => !ak.includes(keyOf(x)));
        added.forEach(x => line(a, f + ' (ajout)', '', _jLab(x)));
        removed.forEach(x => line(a, f + ' (retrait)', _jLab(x), ''));
        if (!added.length && !removed.length && !_jEq(ak, bk)) line(a, f + ' (ordre)', bl.map(_jLab).join(' | '), av.map(_jLab).join(' | '));
      } else line(a, f, bv == null ? '' : bv, av);
    });
    if (b.name !== a.name && !('Nom' in a.vals) && !('Nom du groupe' in a.vals)) line(a, 'Nom', b.name, a.name);
  });
  before.forEach((b, key) => {
    if (after.has(key)) return;
    counts[b.module] = counts[b.module] || { c: 0, d: 0 }; counts[b.module].d++;
    line(b, 'Suppression', b.name, '');
  });
  // Import massif (ex. référentiel remplacé) : une ligne de synthèse par module
  const bulk = Object.keys(counts).filter(m => (counts[m].c || 0) > 10 || (counts[m].d || 0) > 10);
  const kept = lines.filter(l => !(bulk.includes(l.it.module) && (l.field === 'Création' || l.field === 'Suppression')));
  bulk.forEach(m => {
    if (counts[m].d) kept.push({ it: { module: m, name: 'Chargement de lignes' }, field: 'Suppression', o: counts[m].d + ' élément(s)', n: '' });
    if (counts[m].c) kept.push({ it: { module: m, name: 'Chargement de lignes' }, field: 'Création', o: '', n: counts[m].c + ' élément(s)' });
  });
  return kept;
}

// Le journal s'écrit à l'enregistrement, jamais à chaque modification intermédiaire.
// _jCommitted = dernier état enregistré ; journalCommit() compare l'état courant à cet état,
// écrit une ligne par différence, puis le remet à jour (filter limite la comparaison à certains éléments).
let _jCommitted = null;
function journalBase() { return _jCommitted || (_jCommitted = _jSnapshot()); }
function journalRebase() { _jCommitted = _jSnapshot(); }
function journalCommit(filter) {
  try {
    const before = journalBase(), after = _jSnapshot();
    let b = before, a = after;
    if (filter) {
      b = new Map([...before].filter(([, v]) => filter(v)));
      a = new Map([...after].filter(([, v]) => filter(v)));
    }
    _jDiff(b, a).forEach(l => journalAdmin(l.it.module, l.it.name, l.field, l.o, l.n));
    if (!filter) _jCommitted = after;
    else {
      b.forEach((v, k) => { if (!a.has(k)) _jCommitted.delete(k); });
      a.forEach((v, k) => _jCommitted.set(k, v));
    }
  } catch (e) { console.warn('journal : écriture impossible', e); }
}
function journalPending() {
  try { return _jDiff(journalBase(), _jSnapshot()); } catch (e) { return []; }
}
window.addEventListener('load', () => { if (!_jCommitted) _jCommitted = _jSnapshot(); });

// Actions qui enregistrent d'un coup (écrans à formulaire hors modules par brouillon) :
// le journal s'écrit à leur fin. Les autres écrans passent par draft.js ([Enregistrer] / [Annuler]).
const JOURNAL_WRAPPED = ['saveAttributeEdit', 'createNewAttribute'];
JOURNAL_WRAPPED.forEach(name => {
  const f = window[name];
  if (typeof f !== 'function') return;
  window[name] = function () {
    const r = f.apply(this, arguments);
    journalCommit();
    return r;
  };
});
// Champs calculés : enregistrement champ par champ
if (typeof window.calcCommit === 'function') {
  const _cc = window.calcCommit;
  window.calcCommit = function (code) {
    const r = _cc.apply(this, arguments);
    journalCommit(it => it.attrCode === code);
    return r;
  };
}

// ------------------------------------------------------------
// 2. Écran Journal (lecture seule)
// ------------------------------------------------------------
let _jf = { from: '', to: '', user: '', origin: '', obj: '', field: '' };
let _jPage = 1;
const J_PAGE_SIZE = 50;

function journalSorted() {
  return journal.slice().sort((a, b) => (b.t - a.t) || (b.id - a.id));
}

function journalFiltered() {
  const from = _jf.from ? new Date(_jf.from + 'T00:00:00').getTime() : null;
  const to = _jf.to ? new Date(_jf.to + 'T23:59:59').getTime() : null;
  const has = (v, q) => String(v || '').toLowerCase().includes(q.trim().toLowerCase());
  return journalSorted().filter(e =>
    (from === null || e.t >= from) && (to === null || e.t <= to) &&
    (!_jf.user || e.user === _jf.user) && (!_jf.origin || e.origin === _jf.origin) &&
    (!_jf.obj || has(e.obj, _jf.obj)) && (!_jf.field || has(e.field, _jf.field)));
}

function renderJournalPage() {
  const page = document.getElementById('page-admin-journal');
  if (!page) return;
  const users_ = [...new Set(journal.map(e => e.user))].sort();
  const opt = (list, cur) => '<option value="">Tous</option>' + list.map(v => `<option value="${escapeHtml(v)}"${v === cur ? ' selected' : ''}>${escapeHtml(v)}</option>`).join('');
  page.innerHTML = `
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px">
      <button class="btn btn-secondary" onclick="showPage('admin',null)">&larr; Administration</button>
      <span style="font-size:15px;font-weight:700;color:#1a2332">Journal des modifications</span>
      <span class="calc-meta" id="journal-count"></span>
      <span style="flex:1"></span>
      <button class="btn btn-secondary" id="journal-reset" onclick="journalResetFilters()">Effacer les filtres</button>
      <button class="btn btn-primary" id="journal-export" onclick="journalExport()">Exporter (.xlsx)</button>
    </div>
    <div class="table-container"><table class="history-table" id="journal-table">
      <thead>
        <tr><th>Date et heure</th><th>Auteur</th><th>Origine</th><th>Objet</th><th>Champ</th><th>Ancienne valeur</th><th>Nouvelle valeur</th></tr>
        <tr class="journal-filters">
          <th style="white-space:nowrap">
            <input type="date" class="field-input" id="jf-from" value="${_jf.from}" title="Du" style="width:132px;padding:4px 6px" onchange="journalSetFilter('from',this.value)">
            <input type="date" class="field-input" id="jf-to" value="${_jf.to}" title="Au" style="width:132px;padding:4px 6px;margin-top:4px" onchange="journalSetFilter('to',this.value)">
          </th>
          <th><select class="form-select" id="jf-user" onchange="journalSetFilter('user',this.value)">${opt(users_, _jf.user)}</select></th>
          <th><select class="form-select" id="jf-origin" onchange="journalSetFilter('origin',this.value)">${opt(JOURNAL_ORIGINS, _jf.origin)}</select></th>
          <th><input class="field-input" id="jf-obj" placeholder="Filtrer" value="${escapeHtml(_jf.obj)}" oninput="journalSetFilter('obj',this.value)"></th>
          <th><input class="field-input" id="jf-field" placeholder="Filtrer" value="${escapeHtml(_jf.field)}" oninput="journalSetFilter('field',this.value)"></th>
          <th></th><th></th>
        </tr>
      </thead>
      <tbody id="journal-body"></tbody>
    </table></div>
    <div id="journal-pager" style="margin-top:12px"></div>`;
  renderJournalRows();
}

function renderJournalRows() {
  const body = document.getElementById('journal-body');
  if (!body) return;
  const rows = journalFiltered();
  const pages = Math.max(1, Math.ceil(rows.length / J_PAGE_SIZE));
  if (_jPage > pages) _jPage = pages;
  const slice = rows.slice((_jPage - 1) * J_PAGE_SIZE, _jPage * J_PAGE_SIZE);
  body.innerHTML = slice.map(e => `<tr>
      <td style="white-space:nowrap;color:#607080">${escapeHtml(e.ts)}</td>
      <td><span style="font-weight:600;color:#1a2332">${escapeHtml(e.user)}</span></td>
      <td>${escapeHtml(e.origin)}</td>
      <td>${escapeHtml(e.obj)}</td>
      <td><span class="history-field-badge">${escapeHtml(e.field)}</span></td>
      <td><span class="history-val-old">${escapeHtml(e.old || '(vide)')}</span></td>
      <td><span class="history-val-new">${escapeHtml(e.new || '(vide)')}</span></td>
    </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;color:#a0b0c0;padding:24px">Aucune modification pour ces filtres.</td></tr>';
  const cnt = document.getElementById('journal-count');
  if (cnt) cnt.textContent = rows.length + ' ligne' + (rows.length > 1 ? 's' : '');
  const pager = document.getElementById('journal-pager');
  if (!pager) return;
  if (pages <= 1) { pager.innerHTML = ''; return; }
  let h = '<div class="page-btns">';
  h += `<button class="page-btn" onclick="journalGoPage(${_jPage - 1})" ${_jPage === 1 ? 'disabled' : ''}>&lsaquo;</button>`;
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= _jPage - 2 && i <= _jPage + 2)) h += `<button class="page-btn ${i === _jPage ? 'active' : ''}" onclick="journalGoPage(${i})">${i}</button>`;
    else if (i === _jPage - 3 || i === _jPage + 3) h += '<span style="padding:0 4px;color:#a0b0c0">…</span>';
  }
  h += `<button class="page-btn" onclick="journalGoPage(${_jPage + 1})" ${_jPage === pages ? 'disabled' : ''}>&rsaquo;</button></div>`;
  pager.innerHTML = h;
}

function journalSetFilter(key, val) { _jf[key] = val; _jPage = 1; renderJournalRows(); }
function journalGoPage(n) { _jPage = n; renderJournalRows(); }
function journalResetFilters() { _jf = { from: '', to: '', user: '', origin: '', obj: '', field: '' }; _jPage = 1; renderJournalPage(); }

function journalExport() {
  if (!requirePerm(canMod('mod_journal', 'r'))) return;
  const rows = journalFiltered();
  if (!rows.length) { showNotif('Aucune ligne à exporter', 'warn'); return; }
  const aoa = [['Date et heure', 'Auteur', 'Origine', 'Objet', 'Champ', 'Ancienne valeur', 'Nouvelle valeur']]
    .concat(rows.map(e => [e.ts, e.user, e.origin, e.obj, e.field, e.old, e.new]));
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 17 }, { wch: 14 }, { wch: 22 }, { wch: 44 }, { wch: 28 }, { wch: 30 }, { wch: 30 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Journal');
  const d = new Date(), pad = n => String(n).padStart(2, '0');
  XLSX.writeFile(wb, 'journal_' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '.xlsx');
  showNotif(rows.length + ' ligne(s) exportée(s)');
}
