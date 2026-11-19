// ============================================================
// ENREGISTREMENT EXPLICITE DANS L'ADMINISTRATION
// Sur chaque écran d'administration, les modifications restent en brouillon tant que la personne
// n'a pas cliqué sur [Enregistrer] ; [Annuler] revient à l'état d'ouverture de l'écran ;
// quitter l'écran avec des modifications ouvre « Modifications non enregistrées ».
// Principe : instantané de l'état à l'arrivée sur l'écran, comparaison à chaque action.
// Le journal des modifications s'écrit à l'enregistrement (journalCommit).
// ============================================================

// Écrans concernés. form : les champs du formulaire comptent aussi ; own : l'écran a ses propres
// boutons [Annuler] / [Enregistrer] (pas de barre flottante) ; save : fonction qui applique le formulaire.
const DRAFT_PAGES = {
  'admin-categories':     { label: 'Catégories', render: () => renderCatsTable() },
  'admin-category-edit':  { label: 'Catégorie', form: true, own: true, save: () => saveCategoryEdit(), render: () => editCategory(editingCatId) },
  'admin-attributes':     { label: 'Attributs', render: () => renderAttrsTable() },
  'admin-groups':         { label: 'Groupes d’attributs', render: () => renderAttrGroupsList() },
  'admin-group-edit':     { label: 'Groupe d’attributs', form: true, own: true, save: () => saveGroupEdit(), render: () => editAttrGroup(editingGroupId) },
  'admin-synthese':       { label: 'Vue de synthèse', render: () => renderSyntheseAdmin() },
  'admin-suppliers':      { label: 'Référentiels', render: () => renderSuppliersPage() },
  'admin-roles':          { label: 'Utilisateurs & groupes', render: () => renderRoles() },
  'admin-prefs':          { label: 'Préférences application', form: true, own: true, save: () => savePrefs(), render: () => renderPrefsPage() },
  'admin-alerts':         { label: 'Alertes', render: () => renderAlertsPage() },
  'admin-export-formats': { label: 'Trames d’import / export', render: () => renderExportFormatsPage() },
  'admin-workflow':       { label: 'Workflow', render: () => renderWorkflowPage() },
};

let _draft = null;   // { page, state (JSON), form (JSON) }

function _dState() {
  return JSON.stringify({ categories, attributes, attrGroups, syntheseItems, appPrefs, seuilCompletion, alerts, trames,
    calcTables, workflowEnabled, workflowSteps, users, affectGroups, levelRights, refTables });
}
function _dApply(s) {
  categories = s.categories; attributes = s.attributes; attrGroups = s.attrGroups; syntheseItems = s.syntheseItems;
  appPrefs = s.appPrefs; seuilCompletion = s.seuilCompletion; alerts = s.alerts; trames = s.trames;
  calcTables = s.calcTables; workflowEnabled = s.workflowEnabled; workflowSteps = s.workflowSteps;
  users = s.users; affectGroups = s.affectGroups; levelRights = s.levelRights; refTables = s.refTables;
}

// Valeurs des champs d'un écran à formulaire (les champs de recherche et de filtre ne comptent pas)
function _dForm(page) {
  const root = document.getElementById('page-' + page);
  const out = {};
  if (!root) return out;
  const count = {};
  root.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.type === 'hidden' || el.classList.contains('search-input') || /search|filter/i.test(el.id || '')) return;
    const holder = el.closest('[id]');
    const base = el.id || ((holder ? holder.id : 'page') + '#');
    const n = el.id ? '' : (count[base] = (count[base] || 0) + 1);
    const label = (() => {
      const row = el.closest('.field-row, .form-field');
      const lab = row && row.querySelector('.field-label, .form-label');
      return lab ? lab.textContent.replace('*', '').trim() : (el.id || '');
    })();
    let v = el.type === 'checkbox' || el.type === 'radio' ? (el.checked ? 'Oui' : 'Non') : el.value;
    if (el.tagName === 'SELECT' && el.selectedIndex >= 0) v = el.options[el.selectedIndex].textContent.trim();
    let lbl = label;
    if (el.type === 'checkbox') { const l = el.closest('label'); if (l) lbl += ' : ' + l.textContent.trim(); }
    out[base + n] = { label: lbl, val: v };
  });
  return out;
}

function _dBase() {
  const id = _dCurrent();
  const cfg = DRAFT_PAGES[id];
  if (!cfg) { _draft = null; adminDraftBar(); return; }
  _draft = { page: id, state: _dState(), form: cfg.form ? _dForm(id) : null };
  adminDraftBar();
}
function _dCurrent() { return ((document.querySelector('.page.active') || {}).id || '').replace('page-', ''); }

// Appelé par showPage à l'arrivée sur un écran
function adminDraftArrive(id) {
  if (!DRAFT_PAGES[id]) { _draft = null; adminDraftBar(); return; }
  if (_draft && _draft.page === id) return;
  if (typeof journalBase === 'function') journalBase();
  _dBase();
}

function adminDraftDirty() {
  if (!_draft) return false;
  if (_dState() !== _draft.state) return true;
  return _dFormChanges().length > 0;
}

function _dFormChanges() {
  if (!_draft || !_draft.form) return [];
  const now = _dForm(_draft.page), out = [];
  Object.keys(now).forEach(k => {
    const b = _draft.form[k];
    if (b && String(b.val) !== String(now[k].val)) out.push({ label: now[k].label || k, old: b.val, now: now[k].val });
  });
  return out;
}

// Liste des modifications en attente (pour la fenêtre de sortie)
function adminDraftChanges() {
  const out = _dFormChanges();
  if (_draft && _dState() !== _draft.state && typeof journalPending === 'function') {
    journalPending().forEach(l => out.push({ label: l.it.name + ' · ' + l.field, old: l.o == null ? '' : String(l.o), now: l.n == null ? '' : String(l.n) }));
  }
  return out;
}

function _dRerender() {
  try { renderAll(); } catch (e) { console.warn(e); }
  const cfg = _draft && DRAFT_PAGES[_draft.page];
  try { if (cfg && cfg.render) cfg.render(); } catch (e) { console.warn(e); }
  try { (products || []).forEach(p => computeCalcFields(p)); } catch (e) { /* sans effet */ }
  try { if (typeof refreshAccountMenu === 'function') refreshAccountMenu(); } catch (e) { /* sans effet */ }
}

// Revient à l'état d'ouverture de l'écran
function adminDraftRestore() {
  if (!_draft) return;
  _dApply(JSON.parse(_draft.state));
  if (typeof journalRebase === 'function') journalRebase();
  if (typeof _fmtSel !== 'undefined') { try { _fmtSel = null; } catch (e) { /* sans effet */ } }
  _dRerender();
  _dBase();
}

// [Annuler] : on revient à l'état d'ouverture ; avec une cible, on quitte l'écran
function adminDraftCancel(target) {
  adminDraftRestore();
  if (target) {
    _leaveBypass = true;
    try { showPage(target, null); } finally { _leaveBypass = false; }
  } else showNotif('Modifications annulées');
}

// [Enregistrer] : applique le formulaire s'il y en a un, écrit le journal, repart de l'état enregistré
function adminDraftSave() {
  const d = _draft;
  if (!d) return true;
  const cfg = DRAFT_PAGES[d.page] || {};
  const bypass = _leaveBypass;
  _leaveBypass = true;
  try { if (cfg.save) cfg.save(); } finally { _leaveBypass = bypass; }
  if (typeof journalCommit === 'function') journalCommit();
  if (_dCurrent() === d.page) {
    _dBase();
    showNotif('Modifications enregistrées');
  }
  return true;
}

// Barre flottante [Annuler] / [Enregistrer], visible tant qu'il y a des modifications
function adminDraftBar() {
  let bar = document.getElementById('draft-bar');
  const cfg = _draft && DRAFT_PAGES[_draft.page];
  const show = !!cfg && !cfg.own && adminDraftDirty();
  if (!show) { if (bar) bar.style.display = 'none'; return; }
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'draft-bar';
    bar.className = 'draft-bar';
    bar.innerHTML = `<span class="draft-bar-text">Modifications non enregistrées</span>
      <button class="btn btn-secondary" id="draft-cancel" onclick="adminDraftCancel()">Annuler</button>
      <button class="btn btn-primary" id="draft-save" onclick="adminDraftSave()">Enregistrer <span class="draft-bar-key">Ctrl+S</span></button>`;
    document.body.appendChild(bar);
  }
  bar.style.display = 'flex';
}

// Sortie d'un écran avec des modifications : appelé par leaveGuard
function adminDraftGuard(id, navEl) {
  const cur = _dCurrent();
  const cfg = DRAFT_PAGES[cur];
  if (!cfg || !_draft || _draft.page !== cur || id === cur) return true;
  if (!adminDraftDirty()) return true;
  const items = adminDraftChanges();
  const shown = items.slice(0, 12);
  if (items.length > 12) shown.push({ label: '… et ' + (items.length - 12) + ' autre(s) modification(s)', old: '', now: '' });
  openLeaveModal({ lead: cfg.label, items: shown.length ? shown : [{ label: 'Modifications en cours', old: '', now: '' }],
    target: { id, navEl },
    save: () => adminDraftSave(),
    discard: () => adminDraftRestore() });
  return false;
}

// Suivi des modifications : après chaque clic ou saisie, on met la barre à jour
let _dTimer = null;
['click', 'input', 'change', 'drop', 'keyup'].forEach(ev => document.addEventListener(ev, () => {
  if (!_draft) return;
  clearTimeout(_dTimer);
  _dTimer = setTimeout(adminDraftBar, 40);
}, true));
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S') && _draft && DRAFT_PAGES[_draft.page]) {
    e.preventDefault();
    if (adminDraftDirty()) adminDraftSave();
  }
});
