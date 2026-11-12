// ============================================================
// UTILS.JS — Fonctions utilitaires partagées
// ============================================================

// ============================================================
// NAVIGATION — PAGES
// ============================================================
// ------------------------------------------------------------
// QUITTER UNE PAGE AVEC DES MODIFICATIONS NON ENREGISTRÉES
// Une seule fenêtre (fiche produit, fiche attribut, champs calculés) :
// elle liste les champs réellement modifiés (un champ remis à sa valeur
// d'origine n'y figure plus) ; sans modification, on part directement.
// ------------------------------------------------------------
let _leaveCtx = null;
let _leaveBypass = false;

function leaveVal(v) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function snapshotProduct(p) {
  p._orig = { cat: p.cat, fields: JSON.parse(JSON.stringify(p.fields || {})),
    forced: JSON.parse(JSON.stringify(p.forcedFields || {})), images: p.images ? Object.assign({}, p.images) : undefined,
    thumbs: p.thumbs ? JSON.parse(JSON.stringify(p.thumbs)) : undefined };
}

function restoreProductSnapshot(p) {
  const o = p && p._orig; if (!o) return;
  p.cat = o.cat;
  p.fields = JSON.parse(JSON.stringify(o.fields));
  p.forcedFields = JSON.parse(JSON.stringify(o.forced));
  p.images = o.images; p.thumbs = o.thumbs;
  p.pendingChanges = [];
  computeCalcFields(p);
}

// Champs modifiés depuis l'ouverture de la fiche
function productChangeList(p) {
  const o = p && p._orig;
  if (!o) return [];
  const out = [];
  if (o.cat !== p.cat) out.push({ label: 'Catégorie', old: o.cat, now: p.cat });
  const has = (obj, k) => Object.prototype.hasOwnProperty.call(obj || {}, k);
  attributes.forEach(a => {
    if (a.code === 'cat' || a.system) return;   // calculés par l'application (étape, dates, complétion)
    const fNow = has(p.forcedFields, a.code), fBefore = has(o.forced, a.code);
    if ((a.calc || a.formula) && !fNow && !fBefore) return;
    const ov = leaveVal(o.fields[a.code]), nv = leaveVal(p.fields[a.code]);
    if (ov !== nv) {
      out.push({ label: a.name, old: ov, now: nv });
    } else if (fNow !== fBefore) {
      out.push({ label: a.name, old: fBefore ? 'valeur forcée' : 'calculée', now: fNow ? 'valeur forcée' : 'calculée' });
    }
  });
  return out;
}

// Formulaire de la fiche attribut : instantané des valeurs à l'ouverture
let _attrFormSnap = null;
function readAttrForm() {
  const page = document.getElementById('page-admin-attribute-edit');
  const out = {};
  if (!page) return out;
  page.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
    if (el.type === 'hidden') return;
    let shown = el.type === 'checkbox' ? (el.checked ? 'Oui' : 'Non') : el.value;
    if (el.tagName === 'SELECT' && el.selectedIndex >= 0) shown = el.options[el.selectedIndex].textContent.trim();
    const row = el.closest('.field-row, .form-field');
    const lab = row && row.querySelector('.field-label, .form-label');
    let label = lab ? lab.textContent.replace('*', '').trim() : el.id;
    // Case à cocher d'une liste de valeurs : « Afficher seulement si : Masque »
    const own = el.type === 'checkbox' && el.closest('label');
    if (own) label += ' : ' + own.textContent.trim();
    out[el.id] = { label, val: shown };
  });
  return out;
}
function snapshotAttrForm() { _attrFormSnap = readAttrForm(); }
function attrFormChangeList() {
  if (!_attrFormSnap) return [];
  const now = readAttrForm();
  const out = [];
  Object.keys(now).forEach(id => {
    const b = _attrFormSnap[id];
    if (b && leaveVal(b.val) !== leaveVal(now[id].val)) out.push({ label: now[id].label, old: b.val, now: now[id].val });
  });
  const a = attributes.find(x => x.id === editingAttrId);
  if (a && typeof calcHasPending === 'function' && calcHasPending(a.code)) out.push({ label: 'Calcul', old: '', now: 'modifié (non enregistré)' });
  return out;
}

function calcChangeList() {
  if (typeof calcHasPending !== 'function' || !calcHasPending()) return [];
  return Object.keys(_calcSnap).map(code => {
    const a = attributes.find(x => x.code === code);
    return { label: 'Calcul de « ' + (a ? a.name : code) + ' »', old: '', now: 'modifié' };
  });
}

function leaveGuard(id, navEl) {
  if (_leaveBypass) return true;
  const cur = ((document.querySelector('.page.active') || {}).id || '').replace('page-', '');
  if (!cur || id === cur) return true;

  if (cur === 'product-detail' && id !== 'product-detail' && currentProductId) {
    const p = products.find(x => x.id === currentProductId);
    const items = p ? productChangeList(p) : [];
    if (!items.length) {
      if (p) p.pendingChanges = [];
      productDirty = false; currentProductId = null;
      return true;
    }
    openLeaveModal({ lead: 'Fiche « ' + ((p.fields && p.fields.nom) || '') + ' »', items, target: { id, navEl },
      save: () => { saveProduct(); return !productDirty; },
      discard: () => { restoreProductSnapshot(p); productDirty = false; currentProductId = null; } });
    return false;
  }

  if (cur === 'admin-attribute-edit' && id !== 'admin-calc') {
    const a = editingAttrId === 'new' ? { name: 'nouvel attribut', code: '' } : attributes.find(x => x.id === editingAttrId);
    const items = attrFormChangeList();
    if (items.length) {
      openLeaveModal({ lead: 'Attribut « ' + (a ? a.name : '') + ' »', items, target: { id, navEl },
        save: () => { saveAttributeEdit(); return !attrFormDirty; },
        discard: () => {
          if (a && typeof calcRestore === 'function') { calcRestore(a.code); (products || []).forEach(p => computeCalcFields(p)); }
          attrFormDirty = false; _attrFormSnap = null; _calcReturnAttrId = null;
        } });
      return false;
    }
    _attrFormSnap = null;
    if (typeof _calcReturnAttrId !== 'undefined') _calcReturnAttrId = null;
  }

  if (cur === 'admin-calc' && id !== 'admin-attribute-edit') {
    const fromAttr = typeof _calcReturnAttrId !== 'undefined' && _calcReturnAttrId;
    const items = calcChangeList().concat(fromAttr ? attrFormChangeList().filter(x => x.label !== 'Calcul') : []);
    if (items.length) {
      openLeaveModal({ lead: 'Champs calculés', items, target: { id, navEl },
        save: () => {
          Object.keys(_calcSnap).forEach(calcCommit);
          if (fromAttr && attrFormChangeList().length) { _leaveBypass = true; try { saveAttributeEdit(); } finally { _leaveBypass = false; } }
          (products || []).forEach(p => computeCalcFields(p));
          return true;
        },
        discard: () => {
          Object.keys(_calcSnap).forEach(calcRestore);
          (products || []).forEach(p => computeCalcFields(p));
          attrFormDirty = false; _attrFormSnap = null; _calcReturnAttrId = null;
        } });
      return false;
    }
    _calcReturnAttrId = null;
  }
  return true;
}

function openLeaveModal(ctx) {
  _leaveCtx = ctx;
  const esc = v => v === '' ? '<i>(vide)</i>' : escapeHtml(String(v).length > 60 ? String(v).slice(0, 57) + '…' : v);
  document.getElementById('unsaved-lead').textContent = ctx.lead;
  document.getElementById('unsaved-list').innerHTML = ctx.items.map(it =>
    `<li><b>${escapeHtml(it.label)}</b>${it.old !== '' || it.now !== '' ? ` : ${it.old !== '' ? `<span class="unsaved-old">${esc(it.old)}</span> → ` : ''}${esc(it.now)}` : ''}</li>`).join('');
  openModal('modal-unsaved');
}

// Fenêtre de confirmation générique (pas de boîte du navigateur)
let _confirmCtx = null;
function openConfirmModal(ctx) {
  _confirmCtx = ctx;
  document.getElementById('confirm-title').textContent = ctx.title;
  document.getElementById('confirm-lead').textContent = ctx.lead || '';
  document.getElementById('confirm-list').innerHTML = (ctx.items || []).map(it =>
    `<li><b>${escapeHtml(it.label)}</b>${it.now ? ' : ' + escapeHtml(it.now) : ''}</li>`).join('');
  document.getElementById('confirm-list').style.display = (ctx.items || []).length ? '' : 'none';
  document.getElementById('confirm-ok').textContent = ctx.okLabel || 'Confirmer';
  openModal('modal-confirm');
}
function confirmModalOk() {
  const ctx = _confirmCtx; _confirmCtx = null;
  closeModal('modal-confirm');
  if (ctx && ctx.onOk) ctx.onOk();
}
function confirmModalCancel() { _confirmCtx = null; closeModal('modal-confirm'); }

function leaveStay() { closeModal('modal-unsaved'); _leaveCtx = null; _productsReset = false; _productsPreset = null; }

function leaveContinue(mode) {
  const ctx = _leaveCtx; if (!ctx) return;
  if (mode === 'save') {
    const ok = ctx.save();
    if (ok === false) { closeModal('modal-unsaved'); _leaveCtx = null; return; }
  } else {
    ctx.discard();
  }
  closeModal('modal-unsaved');
  _leaveCtx = null;
  _leaveBypass = true;
  try { showPage(ctx.target.id, ctx.target.navEl); } finally { _leaveBypass = false; }
}

function setUnsavedPrompt(kind) {
  const lead = document.getElementById('unsaved-lead');
  const stay = document.getElementById('unsaved-stay');
  if (kind === 'attribut') {
    if (lead) lead.textContent = 'Des modifications sont en cours sur cet attribut.';
    if (stay) stay.textContent = 'Rester sur l\'attribut';
  } else {
    if (lead) lead.textContent = 'Des modifications sont en cours sur cette fiche produit.';
    if (stay) stay.textContent = 'Rester sur la fiche';
  }
}

function showPage(id, navEl) {
  if (!leaveGuard(id, navEl)) return;

  if (!sessionLoggedIn) {
    showLoginOverlay();
    return;
  }

  if (!canOpenPage(id)) {
    showNotif('Accès non autorisé', 'warn');
    const home = getDefaultNavPage();
    if (home && id !== home.page) {
      showPage(home.page, document.querySelector('.nav-item[data-nav="' + home.nav + '"]'));
    }
    return;
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const target = document.getElementById('page-' + id);
  if (target) target.classList.add('active');
  document.body.classList.toggle('on-detail', id === 'product-detail');
  if (navEl)  navEl.classList.add('active');
  const pageTitles = {
    dashboard: 'Dashboard',
    products: 'Produits',
    exports: 'Exports',
    imports: 'Imports',
    'user-prefs': 'Preferences',
    admin: 'Administration',
    'admin-categories': 'Categories',
    'admin-attributes': 'Attributs',
    'admin-groups': 'Groupes d\'attributs',
    'admin-synthese': 'Vue synthese',
    'admin-suppliers': 'Référentiels',
    'admin-prefs': 'Preferences',
    'admin-roles': 'Utilisateurs & groupes',
    'admin-alerts': 'Alertes',
    'admin-export-formats': 'Trames d’import / export',
    'admin-calc': 'Champs calculés',
    'admin-workflow': 'Workflow',
    'product-detail': 'Produit',
  };
  if (pageTitles[id]) updateTopbarTitle(pageTitles[id]);

  // Rendu conditionnel selon la page
  switch (id) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'products':
      currentProductId = null;
      productDirty     = false;
      if (_productsReset) resetProductFilters();
      if (_productsPreset) _productsPreset();
      _productsReset = false; _productsPreset = null;
      renderProductsTable();
      break;
    case 'exports':
      exportIgnoreSelection = false;
      renderExportPage();
      break;
    case 'imports':
      renderImportPage();
      break;
    case 'user-prefs':
      renderUserPrefsPage();
      break;
    case 'admin':
      renderAdminHome();
      break;
    case 'admin-categories':
      renderCatsTable();
      break;
    case 'admin-attributes':
      renderAttrsTable();
      break;
    case 'admin-groups':
      renderAttrGroupsList();
      break;
    case 'admin-synthese':
      renderSyntheseAdmin();
      break;
    case 'admin-suppliers':
      renderSuppliersPage();
      break;
    case 'admin-prefs':
      renderPrefsPage();
      break;
    case 'admin-roles':
      renderRoles();
      break;
    case 'admin-category-edit':
      // Rendu géré par editCategory()
      break;
    case 'admin-group-edit':
      // Rendu géré par editAttrGroup()
      break;
    case 'admin-alerts':
      renderAlertsPage();
      break;
    case 'admin-export-formats':
      renderExportFormatsPage();
      break;
    case 'admin-calc':
      renderCalcTablesPage();
      break;
    case 'admin-workflow':
      renderWorkflowPage();
      break;
    case 'admin-attribute-edit':
      // Rendu géré par editAttribute()
      break;
    default:
      break;
  }
}

// Alertes : une ou plusieurs conditions, toutes vraies (mêmes opérateurs
// que les tables de calcul ; « = » et « ≠ » acceptent plusieurs valeurs
// séparées par « ; »). Un champ vide ne déclenche jamais l'alerte.
// Attribut affiché en pourcentage : la valeur se saisit en % (20 = 20 %).
function alertCondValueText(c) {
  const a = attributes.find(x => x.code === c.attrCode);
  return String(c.value == null ? '' : c.value) + (a && isPercentAttr(a) ? ' %' : '');
}

function alertCondsText(alert) {
  return ((alert && alert.conds) || []).map(c => {
    const a = attributes.find(x => x.code === c.attrCode);
    return (a ? a.name : c.attrCode) + ' ' + c.op + ' ' + alertCondValueText(c);
  }).join(' et ');
}

function alertRuleText(alert) {
  if (!alert) return '';
  return alert.name || alertCondsText(alert);
}

// Texte du survol : la description écrite, sinon les conditions telles quelles
function alertDescText(alert) {
  return (alert && alert.description) || alertCondsText(alert);
}

function alertCondTrue(p, c) {
  const a = attributes.find(x => x.code === c.attrCode) || { code: c.attrCode };
  const pct = isPercentAttr(a);
  const v = pct ? p.fields[a.code] : getAttrFieldValue(p, a);
  if (v === undefined || v === null || String(v).trim() === '') return false;
  let cell = c.value;
  if (pct) {
    const n = calcNum(cell);
    if (n !== null) cell = String(n / 100);
  }
  return calcCondTrue(c.op, cell, v);
}

function productMatchesAlert(p, alert) {
  if (!p || !alert || !(alert.conds || []).length) return false;
  computeCalcFields(p);
  return alert.conds.every(c => alertCondTrue(p, c));
}

function productAlertHits(p) {
  return (alerts || []).filter(a => productMatchesAlert(p, a));
}

function productsForAlert(alert) {
  return getAccessibleProducts().filter(p => productMatchesAlert(p, alert));
}

function renderAdminHome() {
  const elCats   = document.getElementById('admin-count-cats');
  const elGroups = document.getElementById('admin-count-groups');
  const elAttrs  = document.getElementById('admin-count-attrs');
  const elRoles  = document.getElementById('admin-count-roles');
  const elSup    = document.getElementById('admin-count-suppliers');
  const elAlerts = document.getElementById('admin-count-alerts');
  if (elCats)   elCats.textContent   = categories.length;
  if (elGroups) elGroups.textContent = attrGroups.length;
  if (elAttrs)  elAttrs.textContent  = attributes.length;
  if (elRoles)  elRoles.textContent  = users.length;
  if (elSup)    elSup.textContent    = 1 + allReferentials().length;
  if (elAlerts) elAlerts.textContent = (alerts || []).length;
  const elFmt = document.getElementById('admin-count-export-formats');
  if (elFmt) elFmt.textContent = (trames || []).length;
  const elBar = document.getElementById('admin-count-calc');
  const elWf  = document.getElementById('admin-count-workflow');
  if (elBar) elBar.textContent = (calcTables || []).length;
  if (elWf)  elWf.textContent  = isWorkflowOn() ? (workflowSteps || []).length : 'Off';
}

// ============================================================
// RENDU GLOBAL
// ============================================================
function renderAll() {
  applyAccessControl();
  renderDashboard();
  renderProductsTable();
  renderAdminHome();
  // Rafraichit la page admin active si elle est visible
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  const id = activePage.id.replace('page-', '');
  switch (id) {
    case 'admin-categories':   renderCatsTable();       break;
    case 'admin-attributes':   renderAttrsTable();      break;
    case 'admin-groups':       renderAttrGroupsList();  break;
    case 'admin-synthese':     renderSyntheseAdmin();   break;
    case 'admin-suppliers':    renderSuppliersPage();   break;
    case 'admin-prefs':        renderPrefsPage();       break;
    case 'admin-alerts':       renderAlertsPage();      break;
    case 'admin-export-formats': renderExportFormatsPage(); break;
    case 'admin-roles':        renderRoles();           break;
    case 'product-detail':
      if (currentProductId) {
        const p = products.find(x => x.id === currentProductId);
        if (p) {
          const cat = getCatByName(p.cat);
          renderProductHeader(p, cat);
          renderProductTabs(p, cat);
          updateDetailCompletion(p);
        }
      }
      break;
    default: break;
  }
}

// ============================================================
// MODALES
// ============================================================
function openModal(id) {
  if (id === 'modal-create-product' && !getWritableCategories().length) {
    showNotif('Aucune catégorie accessible en modification', 'warn');
    return;
  }
  if (id === 'modal-create-category' && !canMod('mod_categories', 'w')) {
    showNotif('Action non autorisée', 'warn');
    return;
  }
  if (id === 'modal-create-attr' && !canMod('mod_attributes', 'w')) {
    showNotif('Action non autorisée', 'warn');
    return;
  }
  if (id === 'modal-create-attr') fillShowIfControls('new-attr', '', '', '');
  if (id === 'modal-create-product') {
    ['np-ean', 'np-name', 'np-sap', 'np-cat'].forEach(f => {
      const el = document.getElementById(f);
      if (!el) return;
      el.value = '';
      el.classList.remove('field-error');
      const err = document.getElementById('err-' + f);
      if (err) err.classList.remove('show');
      if (el.tagName === 'SELECT' && typeof syncComboFromSelect === 'function') syncComboFromSelect(el);
    });
  }
  if (id === 'modal-create-group' && !canMod('mod_groups', 'w')) {
    showNotif('Action non autorisée', 'warn');
    return;
  }
  if (id === 'modal-create-group') renderAudienceChecks('new-group-audience', []);
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('active');
}

// Fermeture modale au clic sur l'overlay
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// Fermeture modale à la touche Echap
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => {
      // Ne pas fermer la modale unsaved via Echap
      if (m.id !== 'modal-unsaved') m.classList.remove('active');
    });
    if (activeColFilterDropdown) {
      activeColFilterDropdown.remove();
      activeColFilterDropdown = null;
      document.removeEventListener('click', colFilterOutsideClick);
    }
  }
});

// ============================================================
// NOTIFICATIONS TOAST
// ============================================================
function showNotif(msg, type) {
  const existing = document.getElementById('notif-toast');
  if (existing) existing.remove();
  const toast       = document.createElement('div');
  toast.id          = 'notif-toast';
  toast.className   = 'notif-toast' + (type === 'error' ? ' notif-error' : type === 'warn' ? ' notif-warn' : '');
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================
// DATES ET HEURES
// ============================================================
function todayStr() {
  const d = new Date();
  return String(d.getDate()).padStart(2, '0') + '/' +
         String(d.getMonth() + 1).padStart(2, '0') + '/' +
         d.getFullYear();
}

function nowStr() {
  const d = new Date();
  return todayStr() + ' ' +
         String(d.getHours()).padStart(2, '0') + ':' +
         String(d.getMinutes()).padStart(2, '0');
}

// ============================================================
// COMPLETION
// ============================================================
// Un champ rempli automatiquement (calcule, en lecture seule, ou repris de l'accord)
// ne compte jamais dans la completion. Un champ saisi a la main compte s'il est coche.
function isAutoFilled(a) {
  return !!(a && (a.calc || a.formula || a.readonly));
}

function countsInCompletion(a) {
  return !!(a && a.inCompletion && !isAutoFilled(a));
}

// Attributs comptant dans la completion, limites aux groupes de la categorie
function groupCountsForRole(group, role) {
  const ids = (group && group.audienceGroupIds) || [];
  if (!ids.length) return true;
  if (!role || role.all || role.level === 'admin' || !role.groupId) return true;
  return ids.includes(role.groupId);
}

// role : celui de la personne connectee par defaut. Le workflow passe
// ALL_GROUPS_ROLE pour compter tous les groupes, quel que soit le role.
const ALL_GROUPS_ROLE = { all: true };

function getCompletionGroups(product, roleArg) {
  const cat = getCatByName(product && product.cat);
  const ids = cat ? cat.groupIds : attrGroups.map(g => g.id);
  const role = roleArg || (typeof getCurrentRole === 'function' ? getCurrentRole() : null);
  return ids
    .map(id => getGroupById(id))
    .filter(g => g && groupCountsForRole(g, role));
}

function getCompletionAttrs(product, roleArg) {
  const seen = new Set();
  const list = [];
  getCompletionGroups(product, roleArg).forEach(g => {
    (g.attrIds || []).forEach(id => {
      const a = getAttrById(id);
      if (!a || seen.has(a.id)) return;
      seen.add(a.id);
      if (!countsInCompletion(a)) return;
      if (!isAttrShown(product, a)) return;
      list.push(a);
    });
  });
  return list;
}

function showIfValues(v) {
  return String(v || '').split(';').map(x => x.trim()).filter(Boolean);
}

function isAttrShown(product, attr) {
  if (!attr) return true;
  if (attr.code === 'etape_workflow' && typeof isWorkflowOn === 'function' && !isWorkflowOn()) return false;
  if (attr.showIfCat) {
    const allowed = Array.isArray(attr.showIfCat) ? attr.showIfCat : [attr.showIfCat];
    if (!product || !allowed.includes(product.cat)) return false;
  }
  if (!attr.showIfAttr) return true;
  const pilot = attributes.find(a => a.code === attr.showIfAttr);
  if (!pilot) return true;
  const current = product && product.fields ? (product.fields[attr.showIfAttr] || '') : '';
  // Plusieurs valeurs possibles, séparées par « ; »
  return showIfValues(attr.showIfValue).includes(String(current));
}

function isCompletionValueFilled(v) {
  return v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '—';
}

function isCompletionFilled(product, attr) {
  return isCompletionValueFilled(getAttrFieldValue(product, attr));
}

function calcCompletion(product, roleArg) {
  const attrs = getCompletionAttrs(product, roleArg);
  const total = attrs.length;
  if (!total) return 100;
  const filled = attrs.filter(a => isCompletionFilled(product, a)).length;
  return Math.round((filled / total) * 100);
}

// ============================================================
// WORKFLOW
// ============================================================
// Picto corbeille des boutons de suppression (meme bouton partout)
const TRASH_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';

// Pictos des champs calcules : table de calcul (bleu) ou formule simple (jaune)
function calcTableIcon(size) {
  const n = size || 14;
  return '<svg class="calc-ico-table" width="' + n + '" height="' + n + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M10 4v16"/></svg>';
}
function calcFormulaIcon() {
  return '<span class="calc-ico-fx">ƒx</span>';
}
// Badge a cote du libelle d'un champ calcule, avec son origine en infobulle
// Contenu du survol du picto ƒx : libellé du calcul, puis formule ou conditions de la table
function calcTitleText(a) {
  if (!a) return '';
  if (isTableFormula(a.formula)) {
    const t = typeof calcTableFor === 'function' ? calcTableFor(a.code) : null;
    const conds = t ? t.conditions.map(c => (c.attrCode === 'cat' ? 'Catégorie' : ((attributes.find(x => x.code === c.attrCode) || {}).name || c.attrCode)) + ' ' + c.op).join(', ') : '';
    return 'Table de calcul' + (conds ? ' : ' + conds : '') + (t ? ' (' + t.lines.length + ' lignes)' : '');
  }
  // Un seul texte : le libellé s'il est renseigné, sinon la formule
  return a.formulaLabel || a.formula || '';
}

function calcBadgeHtml(a) {
  if (!a || !(a.calc || a.formula)) return '';
  return '<span class="calc-badge calc-badge-fx" title="' + escapeHtml(calcTitleText(a)) + '">ƒx</span>';
}

function isWorkflowOn() {
  return !!workflowEnabled && workflowSteps.length > 0;
}

// Colonnes / infos du résumé : sans l'étape quand le workflow est désactivé
// Le libellé d'un élément de synthèse est toujours le nom de son attribut
function activeSynthItems() {
  syntheseItems.forEach(i => {
    if (i.kind !== 'attr') return;
    const codes = typeof synthCodeAliases === 'function' ? synthCodeAliases(i.code) : [i.code];
    const a = attributes.find(x => codes.includes(x.code));
    if (a) i.label = a.name;
  });
  return isWorkflowOn() ? syntheseItems : syntheseItems.filter(i => i.code !== 'etape_workflow');
}

// Intertitre dans la liste d'un groupe d'attributs : chaîne « §Titre »
function isAttrSection(id) { return typeof id === 'string' && id.charAt(0) === '§'; }
function attrSectionTitle(id) { return String(id).slice(1); }

// Largeur d'un attribut sur la fiche (grille de 12 colonnes)
function fieldWidthClass(a) {
  const w = a.width || (a.type === 'Texte long' ? 'full' : 'normal');
  return 'fw-' + w;
}

// Complétion des seuls onglets choisis qui existent dans la catégorie du
// produit, tous rôles confondus. Aucun onglet concerné : 100 (rien à remplir).
function groupsCompletion(p, groupIds) {
  const cat = getCatByName(p && p.cat);
  const ids = (groupIds || []).filter(id => !cat || cat.groupIds.includes(id));
  const seen = new Set();
  const attrs = [];
  ids.forEach(id => {
    const g = getGroupById(id);
    ((g && g.attrIds) || []).forEach(aid => {
      const a = getAttrById(aid);
      if (!a || seen.has(a.id)) return;
      seen.add(a.id);
      if (countsInCompletion(a) && isAttrShown(p, a)) attrs.push(a);
    });
  });
  if (!attrs.length) return 100;
  return Math.round(attrs.filter(a => isCompletionFilled(p, a)).length / attrs.length * 100);
}

function workflowStepReached(p, step) {
  const r = (step && step.rule) || {};
  if (r.kind === 'groups') {
    return groupsCompletion(p, r.groupIds) >= (Number(r.threshold) || 100);
  }
  const raw = r.attrCode === 'cat' ? p.cat : (p.fields || {})[r.attrCode];
  const v = raw == null ? '' : String(raw).trim();
  if (r.kind === 'filled') return v !== '';
  if (r.kind === 'equals') return v === String(r.value == null ? '' : r.value);
  return false;
}

// reached : un booleen par jalon. index : rang (1 a n) du jalon le plus
// avance atteint, 0 si aucun. gaps : jalons precedents non atteints, a
// regulariser (ex. produit publie sans commande). label : nom de l'etape.
function workflowState(p) {
  const reached = workflowSteps.map(s => workflowStepReached(p, s));
  const index = reached.lastIndexOf(true) + 1;
  const gaps = [];
  for (let i = 0; i < index - 1; i++) if (!reached[i]) gaps.push(i);
  const label = index === 0 ? WORKFLOW_START_LABEL : workflowSteps[index - 1].name;
  return { reached, index, gaps, label };
}

function workflowStateLabel(p) {
  return workflowState(p).label;
}

function workflowRuleText(step) {
  const r = (step && step.rule) || {};
  if (r.kind === 'groups') {
    const names = (r.groupIds || []).map(id => { const g = getGroupById(id); return g ? g.name : ''; }).filter(Boolean);
    return 'Complétion de ' + (names.join(', ') || 'aucun onglet') + ' ≥ ' + (Number(r.threshold) || 100) + ' %';
  }
  const a = attributes.find(x => x.code === r.attrCode);
  const name = a ? a.name : (r.attrCode || '?');
  if (r.kind === 'filled') return name + ' renseigné';
  if (r.kind === 'equals') return name + ' = ' + (r.value || '');
  return '';
}

// Frise des jalons sur la fiche : atteint (vert), a regulariser (orange :
// non atteint alors qu'un jalon suivant l'est), a venir (gris).
function workflowStepperHtml(p) {
  if (!isWorkflowOn()) return '';
  const st = workflowState(p);
  const items = workflowSteps.map((s, i) => {
    const ok = st.reached[i];
    const gap = st.gaps.includes(i);
    const cls = ok ? 'wf-step done' : (gap ? 'wf-step gap' : 'wf-step');
    const tip = workflowRuleText(s) + (gap ? ' — à régulariser : un jalon suivant est déjà atteint' : '');
    return `<div class="${cls}" title="${escapeHtml(tip)}">
      <span class="wf-dot">${ok ? '&#10003;' : (gap ? '!' : i + 1)}</span>
      <span class="wf-name">${escapeHtml(s.name)}</span>
    </div>`;
  }).join('<span class="wf-sep"></span>');
  const note = st.gaps.length
    ? `<div class="wf-note">${st.gaps.length} jalon${st.gaps.length > 1 ? 's' : ''} à régulariser</div>` : '';
  return `<div class="wf-label">Workflow</div><div class="wf-steps">${items}</div>${note}`;
}

// Version condensée pour le bandeau de la fiche : une pastille par jalon
// (nom au survol), puis l'étape atteinte et les jalons à régulariser.
function workflowCompactHtml(p) {
  if (!isWorkflowOn()) return '';
  const st = workflowState(p);
  const dots = workflowSteps.map((s, i) => {
    const ok = st.reached[i], gap = st.gaps.includes(i);
    return `<span class="wfc-dot${ok ? ' done' : gap ? ' gap' : ''}" title="${escapeHtml(s.name)}">${ok ? '&#10003;' : gap ? '!' : ''}</span>`;
  }).join('');
  const stage = p.fields.etape_workflow || WORKFLOW_START_LABEL;
  const gaps = st.gaps.length ? `<span class="wfc-gap">${st.gaps.length} à régulariser</span>` : '';
  return `<div class="ps-item ps-wf">
      <span class="ps-label">Workflow</span>
      <span class="wfc-dots">${dots}</span>
      <span class="ps-sub">${escapeHtml(stage)}${gaps ? ' · ' + gaps : ''}</span>
    </div>`;
}

function getCompletionColor(pct) {
  if (pct >= seuilCompletion) return '#4caf50';
  if (pct >= seuilCompletion * 0.6) return '#ffa726';
  return '#ef5350';
}

// Taux de remplissage d'un attribut, limite aux produits des categories
// qui contiennent son groupe. Sert a reperer les attributs qui ne servent plus.
// Un attribut verrouillé : calculé par l'application ou structure du produit
// (attributs système), ou clé d'un référentiel. La raison s'affiche au survol.
function attrRefKeyOf(a) {
  if (!a) return null;
  return (refTables || []).find(t => Object.keys(t.keys || {}).some(c => t.keys[c] === a.code)) || null;
}
function attrLockReason(a) {
  if (!a) return '';
  if (a.system) return a.code === 'cat' ? 'Structure du produit : impossible à supprimer' : 'Calculé par l’application : impossible à supprimer';
  const t = attrRefKeyOf(a);
  return t ? 'Clé du référentiel ' + t.name + ' : impossible à supprimer tant que le référentiel l’utilise' : '';
}
function isProtectedAttr(a) {
  return !!(a && (a.system || attrRefKeyOf(a)));
}
function attrLockBadge(a) {
  const t = attrLockReason(a);
  return t ? `<span class="system-lock" title="${escapeHtml(t)}">${systemLockIcon()}</span>` : '';
}

function isProtectedGroup(g) {
  return !!(g && g.system);
}

function systemLockIcon() {
  return `<svg class="system-lock-icon" viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
    <path fill="currentColor" d="M5 7V5.2a3 3 0 016 0V7h.7c.7 0 1.3.6 1.3 1.3v5.4c0 .7-.6 1.3-1.3 1.3H4.3C3.6 15 3 14.4 3 13.7V8.3C3 7.6 3.6 7 4.3 7H5zm1.2 0h3.6V5.2a1.8 1.8 0 10-3.6 0V7z"/>
  </svg>`;
}

function systemLockBadge(kind) {
  const title = kind === 'group' ? 'Groupe système : impossible à supprimer'
    : kind === 'trame' ? 'Trame système : impossible à supprimer'
    : 'Attribut système : impossible à supprimer';
  return `<span class="system-lock" title="${title}">${systemLockIcon()}</span>`;
}



function isPercentAttr(a) {
  return !!(a && a.displayFormat === 'percent');
}

function isPercentBrandAttr(a) {
  return isPercentAttr(a);
}

function formatPercentDisplay(stored) {
  if (stored === undefined || stored === null || String(stored).trim() === '') return '';
  const unit = parseFloat(typeof coercePercentStored === 'function'
    ? coercePercentStored(stored) : stored);
  if (isNaN(unit)) return '';
  const pct = unit * 100;
  return String(parseFloat(pct.toFixed(4)));
}

function percentFromDisplay(input) {
  if (input === undefined || input === null || String(input).trim() === '') return '';
  const n = parseFloat(String(input).replace('%', '').replace(',', '.').trim());
  if (isNaN(n)) return '';
  const unit = n / 100;
  return String(parseFloat(Math.max(0, Math.min(1, unit)).toFixed(6)));
}

function formatCalcFieldDisplay(attr, stored) {
  if (attr && isPercentAttr(attr)) {
    const d = formatPercentDisplay(stored);
    return d === '' ? '' : d + '%';
  }
  if (attr && (attr.type === 'Nombre' || attr.type === 'Nombre decimal')) return formatAttrNumber(attr, stored);
  return stored == null ? '' : String(stored);
}

function getGroupsForAttr(attr) {
  if (!attr) return [];
  const seen = new Set();
  const list = [];
  attrGroups.forEach(g => {
    if ((g.attrIds || []).includes(attr.id) && !seen.has(g.id)) {
      seen.add(g.id);
      list.push(g);
    }
  });
  if (attr.groupId && !seen.has(attr.groupId)) {
    const home = getGroupById(attr.groupId);
    if (home) list.unshift(home);
  }
  return list;
}

function getMarqueAttr() {
  return attributes.find(a => a.code === 'marque') || null;
}

// Valeurs d'une liste : celles de l'attribut, ou la colonne clé d'un
// référentiel (avec, au besoin, une autre colonne comme libellé)
function attrSelectOptions(a) {
  if (a && a.listRef && typeof findReferential === 'function') {
    const R = findReferential(a.listRef.ref);
    if (R) {
      const key = R.cols[0];
      const lab = a.listRef.label ? R.cols.find(c => refNorm(c.name) === refNorm(a.listRef.label)) : null;
      return R.data().filter(r => String(r[key.prop] || '').trim())
        .map(r => ({ v: String(r[key.prop]), l: lab && r[lab.prop] ? String(r[lab.prop]) : String(r[key.prop]) }))
        .sort((x, y) => x.l.localeCompare(y.l, 'fr'));
    }
  }
  return ((a && a.options) || []).map(o => ({ v: o, l: o }));
}

function getMarqueOptions() {
  return [...new Set(refTableRows('Marques').map(b => String(b['Marque'] || '')))].filter(Boolean)
    .sort((x, y) => x.localeCompare(y, 'fr'));
}
// Liste des marques de la fiche produit = référentiel Marques
function syncMarqueOptions() {
  const a = getMarqueAttr();
  if (a) a.options = getMarqueOptions();
}

function registerMarque(name) {
  const n = (name || '').trim();
  if (!n) return;
  const rows = refTableRows('Marques');
  if (!rows.some(b => String(b['Marque'] || '').toLowerCase() === n.toLowerCase())) rows.push({ 'Marque': n, 'Code IWI': '', 'Fabricant': '' });
  syncMarqueOptions();
}

function syncMarqueOptionsFromBrandSettings() {
  (products || []).forEach(p => {
    if (p.fields && p.fields.marque) registerMarque(p.fields.marque);
  });
}




function attrStoresInFields(a) {
  if (!a) return false;
  return a.code !== 'cat' && a.code !== 'completion'
    && a.code !== 'created_at' && a.code !== 'updated_at';
}


function attrHelpTip(a) {
  const text = a && a.helpText ? String(a.helpText).trim() : '';
  if (!text) return '';
  return ` <span class="help-tip" title="${escapeHtml(text)}">?</span>`;
}

function completionMarkHtml() {
  return `<span class="completion-mark" title="Compte dans le taux de completion" aria-label="Compte dans le taux de completion"></span>`;
}

function attrLabelHtml(a) {
  if (!a) return '';
  const mark = countsInCompletion(a) ? completionMarkHtml() : '';
  const req  = a.required ? '<span class="field-required">*</span>' : '';
  return `${mark}<span>${escapeHtml(a.name)}</span>${req}${attrHelpTip(a)}`;
}

function attrFillRate(attr) {
  const attrGroupsIds = new Set(getGroupsForAttr(attr).map(g => g.id));
  const scope = products.filter(p => {
    const cat = getCatByName(p.cat);
    if (!cat || !attrGroupsIds.size) return true;
    return (cat.groupIds || []).some(id => attrGroupsIds.has(id));
  });
  if (!scope.length) return { pct: 0, filled: 0, total: 0 };

  const filled = scope.filter(p => {
    if (attr.code === 'completion') return true;
    const v = getAttrFieldValue(p, attr);
    return v !== undefined && v !== null && String(v).trim() !== '';
  }).length;

  return { pct: Math.round((filled / scope.length) * 100), filled, total: scope.length };
}

// ============================================================
// VUE SYNTHESE — regles partagees liste produits / fiche resume
// ============================================================
// Un attribut Image s'affiche en vignette, jamais en texte
function isVisualCode(code) {
  const a = attributes.find(x => x.code === code);
  return !!a && a.type === 'Image';
}

// Visuel de la synthese : premier attribut Image configure
function getSynthVisualItem() {
  return syntheseItems.find(i => i.kind === 'attr' && isVisualCode(i.code)) || null;
}

// Premiere information de la synthese : titre de la fiche resume,
// et seule colonne cliquable de la liste produits
function getSynthTitleItem() {
  return syntheseItems.find(i => i.kind === 'attr' && !isVisualCode(i.code)) || null;
}

function isSynthTitleCode(code) {
  const t = getSynthTitleItem();
  return !!t && t.code === code;
}

// Valeur affichable d'une colonne synthese
function getSynthValue(p, code) {
  if (code === 'cat') return p.cat;
  if (code === 'completion') return calcCompletion(p) + '%';
  if (code === 'createdAt' || code === 'created_at') return p.createdAt || '';
  if (code === 'maj' || code === 'updated_at') return p.maj || '';
  const attr = attributes.find(a => a.code === code);
  if (attr && isPercentAttr(attr)) {
    const d = formatPercentDisplay(p.fields[code]);
    return d === '' ? '' : d + '%';
  }
  return displayFieldVal(p.fields[code]);
}

function isEmptyFieldVal(v) {
  return v === undefined || v === null || String(v).trim() === '' || String(v) === 'null';
}

function displayFieldVal(v) {
  if (isEmptyFieldVal(v)) return '';
  return String(v);
}

function getAttrFieldValue(p, a) {
  if (!a) return '';
  if (a.code === 'cat') return p.cat || '';
  if (a.code === 'completion') return String(calcCompletion(p));
  if (a.code === 'created_at' || a.code === 'createdAt') return p.createdAt || '';
  if (a.code === 'updated_at' || a.code === 'maj') return p.maj || '';
  return displayFieldVal(p.fields[a.code]);
}

function categorieSelectHtml(p) {
  if (!canEditProduct(p)) {
    return `<input class="field-input" style="background:#f0f4f8;color:#a0b0c0"
      value="${escapeHtml(p.cat || '')}" readonly>`;
  }
  const opts = categories.filter(c => c.name === p.cat || canCat(c.id, 'w'));
  return `<select class="field-input form-select" onchange="onCatChange(${p.id},this)">
    ${opts.map(c => `<option${c.name === p.cat ? ' selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
  </select>`;
}

function categorieFieldHtml(p) {
  const a = attributes.find(x => x.code === 'cat');
  return `<div class="field-row">
    <div class="field-label">${a ? attrLabelHtml(a) : 'Catégorie <span class="field-required">*</span>'}</div>
    ${categorieSelectHtml(p)}
  </div>`;
}

function formatAttrListValue(p, attr) {
  if (attr.type === 'Image') return p.fields[attr.code] ? visualThumb(p, 32, attr.code) : '—';
  if (attr.code === 'fournisseur_code') {
    const v = p.fields[attr.code];
    if (isEmptyFieldVal(v)) return '—';
    return supplierNameByCode(v) || String(v);
  }
  const v = getAttrFieldValue(p, attr);
  if (isPercentAttr(attr)) {
    const d = formatPercentDisplay(v);
    return d === '' ? '—' : d + '%';
  }
  return isEmptyFieldVal(v) ? '—' : String(v);
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function datalistHtml(id, values) {
  return `<datalist id="${id}">${(values || []).map(v =>
    `<option value="${escapeHtml(v)}">`
  ).join('')}</datalist>`;
}

function supplierNameByCode(code) {
  const s = supplierList().find(x => x.code === code);
  return s ? s.name : (code || '');
}

function resolveSupplierCode(inputVal) {
  const v = (inputVal || '').trim();
  if (!v) return '';
  const byName = supplierList().find(s => s.name.toLowerCase() === v.toLowerCase());
  if (byName) return byName.code;
  const byCode = supplierList().find(s => s.code.toLowerCase() === v.toLowerCase());
  if (byCode) return byCode.code;
  const m = v.match(/\(([^)]+)\)\s*$/);
  if (m) {
    const nested = supplierList().find(s => s.code === m[1]);
    if (nested) return nested.code;
  }
  return '';
}




function attrShownInList(attr) {
  if (!attr || !attr.showIfCat) return true;
  const catFilter = (document.getElementById('filter-cat') || {}).value || '';
  if (!catFilter) return true;
  const allowed = Array.isArray(attr.showIfCat) ? attr.showIfCat : [attr.showIfCat];
  return allowed.includes(catFilter);
}




function autocompleteInput(id, listId, value, values, onchange, placeholder) {
  return `<input class="field-input" id="${id}" list="${listId}"
    value="${escapeHtml(value || '')}" placeholder="${escapeHtml(placeholder || 'Rechercher...')}"
    autocomplete="off" onchange="${onchange}" onblur="${onchange}">
    ${datalistHtml(listId, values)}`;
}

// ============================================================
// ACCESSEURS DONNEES
// ============================================================
function getCatById(id) {
  return categories.find(c => c.id === id) || null;
}

function getCatByName(name) {
  return categories.find(c => c.name === name) || null;
}

function getGroupById(id) {
  return attrGroups.find(g => g.id === id) || null;
}

function getAttrById(id) {
  return attributes.find(a => a.id === id) || null;
}

function getAttrsForCat(catName) {
  const cat = getCatByName(catName);
  if (!cat) return [];
  return cat.groupIds
    .map(gid => getGroupById(gid))
    .filter(Boolean)
    .flatMap(g => g.attrIds.map(id => getAttrById(id)).filter(Boolean));
}

function getVisibleGroupsForUser() {
  const readable = getReadableCategories();
  const ids = new Set();
  readable.forEach(c => (c.groupIds || []).forEach(id => ids.add(id)));
  if (!ids.size) return attrGroups.slice();
  return attrGroups.filter(g => ids.has(g.id));
}

// ============================================================
// RBAC — COMPTES, PERMISSIONS, MENU PROFIL
// ============================================================
const PAGE_MOD_MAP = {
  'admin':               '__any_admin__',
  'admin-categories':    'mod_categories',
  'admin-category-edit': 'mod_categories',
  'admin-attributes':    'mod_attributes',
  'admin-attribute-edit':'mod_attributes',
  'admin-groups':        'mod_groups',
  'admin-group-edit':    'mod_groups',
  'admin-synthese':      'mod_synthese',
  'admin-suppliers':     'mod_conditions',
  'admin-roles':         'mod_roles',
  'admin-prefs':         'mod_prefs',
  'admin-alerts':        'mod_alerts',
  'admin-export-formats':'mod_trames',
  'admin-calc':          'mod_calc',
  'admin-workflow':      'mod_workflow',
};

function getCurrentUser() {
  return users.find(u => u.id === currentUserId) || users[0] || null;
}

// « Rôle » de la personne connectée : niveau Okta + groupe d'affectation
function userAccessLabel(u) {
  if (!u) return '';
  const g = affectGroupOf(u);
  return accessLevel(u.levelKey).name + (g ? ' · ' + g.name : (u.levelKey === 'admin' ? '' : ' · sans groupe'));
}

function getCurrentRole() {
  const u = getCurrentUser();
  if (!u) return null;
  return { id: u.id, name: userAccessLabel(u), level: u.levelKey, groupId: u.groupId || null, perms: effectivePerms(u) };
}

function currentUserName() {
  const u = getCurrentUser();
  return u ? u.name : 'J. Doe';
}

function isTechAdmin() {
  const role = getCurrentRole();
  return !!(role && role.level === 'admin');
}

function getPerm(key) {
  if (!sessionLoggedIn) return permNone();
  const role = getCurrentRole();
  if (!role || !role.perms) return permNone();
  return role.perms[key] || permNone();
}

function canPerm(key, action) {
  return !!getPerm(key)[action];
}

function resolveCategory(catRef) {
  if (catRef == null || catRef === '') return null;
  if (typeof catRef === 'number') return getCatById(catRef);
  if (typeof catRef === 'object') return catRef.id ? catRef : getCatByName(catRef.name);
  return getCatByName(catRef) || getCatById(parseInt(catRef, 10));
}

function canCat(catRef, action) {
  const cat = resolveCategory(catRef);
  if (!cat) return false;
  return canPerm('cat_' + cat.id, action);
}

function canMod(modKey, action) {
  return canPerm(modKey, action);
}

function canSeeAnyAdmin() {
  return ADMIN_MODULES.some(m => canMod(m.key, 'r'));
}

function canEditProduct(p) {
  return !!(p && canCat(p.cat, 'w'));
}

function canDeleteProduct(p) {
  return !!(p && canCat(p.cat, 'd'));
}

function getReadableCategories() {
  return categories.filter(c => canCat(c.id, 'r'));
}

function getWritableCategories() {
  return categories.filter(c => canCat(c.id, 'w'));
}

function getAccessibleProducts() {
  return products.filter(p => canCat(p.cat, 'r'));
}

function requirePerm(ok, msg) {
  if (ok) return true;
  showNotif(msg || 'Action non autorisée', 'warn');
  return false;
}

function canMenu(navOrKey) {
  const m = NAV_MENUS.find(x => x.key === navOrKey || x.nav === navOrKey || x.page === navOrKey);
  if (!m) return true;
  return canPerm(m.key, 'r');
}

function getDefaultNavPage() {
  return NAV_MENUS.find(m => canMenu(m.key)) || null;
}

function goToDefaultPage() {
  const home = getDefaultNavPage();
  if (!home) return;
  showPage(home.page, document.querySelector('.nav-item[data-nav="' + home.nav + '"]'));
}

function canOpenPage(id) {
  if (!sessionLoggedIn) return false;
  if (id === 'product-detail') {
    if (!canMenu('menu_products')) return false;
    const p = products.find(x => x.id === currentProductId);
    return !!(p && canCat(p.cat, 'r'));
  }
  if (id === 'user-prefs') return true;
  if (id === 'dashboard') return canMenu('menu_dashboard');
  if (id === 'products')  return canMenu('menu_products');
  if (id === 'imports')   return canMenu('menu_imports');
  if (id === 'exports')   return canMenu('menu_exports');
  const mod = PAGE_MOD_MAP[id];
  if (mod) {
    if (!canMenu('menu_admin')) return false;
    if (mod === '__any_admin__') return true;
    return canMod(mod, 'r');
  }
  return true;
}

function refreshCategorySelects() {
  fillCatSelect(document.getElementById('filter-cat'), getReadableCategories(), 'Toutes catégories');
  fillCatSelect(document.getElementById('np-cat'), getWritableCategories(), '-- Choisir --');
}

function fillCatSelect(sel, cats, emptyLabel) {
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = emptyLabel ? `<option value="">${emptyLabel}</option>` : '';
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });
  if ([...sel.options].some(o => o.value === current)) sel.value = current;
  else sel.value = '';
}

function applyAccessControl() {
  refreshAccountMenu();
  const showNav = (key, show) => {
    document.querySelectorAll('.nav-item[data-nav="' + key + '"]').forEach(el => {
      el.style.display = show ? '' : 'none';
    });
  };
  NAV_MENUS.forEach(m => showNav(m.nav, canMenu(m.key)));
  document.querySelectorAll('.nav-section-label').forEach(el => {
    const txt = el.textContent || '';
    if (txt.indexOf('Configuration') !== -1) {
      el.style.display = canMenu('menu_admin') ? '' : 'none';
    }
    if (txt.indexOf('Principal') !== -1) {
      const any = NAV_MENUS.some(m => m.nav !== 'admin' && canMenu(m.key));
      el.style.display = any ? '' : 'none';
    }
  });

  document.querySelectorAll('.admin-card[data-mod]').forEach(card => {
    card.style.display = canMod(card.dataset.mod, 'r') ? '' : 'none';
  });

  const newProd = document.getElementById('btn-new-product');
  if (newProd) newProd.style.display = getWritableCategories().length ? '' : 'none';

  const save = document.getElementById('btn-save-product');
  const hint = document.getElementById('btn-save-hint');
  const p = currentProductId ? products.find(x => x.id === currentProductId) : null;
  const canSave = !!(p && canEditProduct(p));
  if (save) save.style.display = canSave ? '' : 'none';
  if (hint) hint.style.display = canSave ? '' : 'none';

  const setBtn = (id, show) => {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? '' : 'none';
  };
  setBtn('btn-new-category', canMod('mod_categories', 'w'));
  setBtn('btn-new-attr', canMod('mod_attributes', 'w'));
  setBtn('btn-new-group', canMod('mod_groups', 'w'));

  refreshCategorySelects();
  if (sessionLoggedIn) hideLoginOverlay();
  else showLoginOverlay();
}

function lockProductSheet(p) {
  const root = document.getElementById('page-product-detail');
  if (!root) return;
  const locked = !(p && canEditProduct(p));
  root.classList.toggle('sheet-readonly', locked);
  root.querySelectorAll('input:not([type=hidden]), select, textarea').forEach(el => {
    if (el.getAttribute('data-formula-lock') === '1') { el.disabled = true; return; }
    el.disabled = locked;
  });
}

function refreshAccountMenu() {
  const u = getCurrentUser();
  const role = getCurrentRole();
  const nameEl = document.getElementById('account-name');
  const roleEl = document.getElementById('account-role');
  const avEl = document.getElementById('account-avatar');
  if (nameEl) nameEl.textContent = sessionLoggedIn && u ? u.name : '—';
  if (roleEl) roleEl.textContent = sessionLoggedIn && role ? role.name : 'Deconnecte';
  if (avEl) {
    avEl.textContent = sessionLoggedIn && u ? u.initials : '?';
    avEl.style.background = sessionLoggedIn && u ? (u.color || '#1565c0') : '#90a4ae';
  }
  const switchList = document.getElementById('account-switch-list');
  if (switchList) {
    switchList.innerHTML = users.map(usr => {
      const active = usr.id === currentUserId && sessionLoggedIn;
      return `<button type="button" class="account-dropdown-item${active ? ' is-active' : ''}"
        onclick="switchUser(${usr.id})">
        <span class="account-dropdown-avatar" style="background:${usr.color || '#1565c0'}">${usr.initials}</span>
        <span>
          <span class="account-dropdown-name">${escapeHtml(usr.name)}</span>
          <span class="account-dropdown-meta">${escapeHtml(userAccessLabel(usr))}</span>
        </span>
      </button>`;
    }).join('');
  }
  const loginList = document.getElementById('login-user-list');
  if (loginList) {
    loginList.innerHTML = users.map(usr => {
      return `<button type="button" class="login-user-btn" onclick="switchUser(${usr.id})">
        <span class="account-dropdown-avatar" style="background:${usr.color || '#1565c0'}">${usr.initials}</span>
        <span>
          <div class="account-dropdown-name">${escapeHtml(usr.name)}</div>
          <div class="account-dropdown-meta">${escapeHtml(userAccessLabel(usr))}</div>
        </span>
      </button>`;
    }).join('');
  }
}

function toggleAccountMenu(ev) {
  if (ev) ev.stopPropagation();
  const dd = document.getElementById('account-dropdown');
  if (!dd) return;
  dd.hidden = !dd.hidden;
}

function closeAccountMenu() {
  const dd = document.getElementById('account-dropdown');
  if (dd) dd.hidden = true;
}

function openPreferencesFromMenu() {
  closeAccountMenu();
  showPage('user-prefs', null);
}

function renderUserPrefsPage() {
  updateTopbarTitle('Préférences d\'affichage');
  const page = document.getElementById('page-user-prefs');
  if (!page) return;
  const theme = userPrefs.theme === 'dark' ? 'dark' : 'light';
  page.innerHTML = `
    <div style="max-width:520px">
      <div style="font-size:18px;font-weight:700;color:#1a2332;margin-bottom:8px">
        Preferences d'affichage
      </div>
      <div style="font-size:13px;color:#607080;margin-bottom:20px">
        Options personnelles du compte. Les parametres d'application
        (pagination, seuils) se configurent dans Administration.
      </div>
      <div style="background:#fff;border-radius:12px;padding:28px;
        box-shadow:0 1px 6px rgba(0,0,0,0.07)">
        <div class="field-label" style="margin-bottom:10px">Theme</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <label class="import-action-radio ${theme === 'light' ? 'selected' : ''}"
            onclick="setUserTheme('light')">
            <input type="radio" name="user-theme" value="light"
              ${theme === 'light' ? 'checked' : ''} style="display:none">
            <span style="font-size:16px">&#9728;</span>
            <div>
              <div style="font-size:13px;font-weight:700;color:#1a2332">Clair</div>
              <div style="font-size:11px;color:#a0b0c0">Thème par défaut</div>
            </div>
          </label>
          <label class="import-action-radio ${theme === 'dark' ? 'selected' : ''}"
            style="opacity:0.7">
            <input type="radio" name="user-theme" value="dark" disabled style="display:none">
            <span style="font-size:16px">&#9790;</span>
            <div>
              <div style="font-size:13px;font-weight:700;color:#1a2332">Sombre</div>
              <div style="font-size:11px;color:#a0b0c0">Bientot disponible</div>
            </div>
          </label>
        </div>
      </div>
    </div>`;
}

function setUserTheme(theme) {
  userPrefs.theme = theme === 'dark' ? 'dark' : 'light';
  renderUserPrefsPage();
  showNotif('Thème enregistré (application à venir)');
}

function switchUser(userId) {
  const u = users.find(x => x.id === userId);
  if (!u) return;
  sessionLoggedIn = true;
  currentUserId = userId;
  productDirty = false;
  currentProductId = null;
  closeAccountMenu();
  hideLoginOverlay();
  applyAccessControl();
  goToDefaultPage();
  const role = getCurrentRole();
  showNotif('Connecte en tant que ' + u.name + ' (' + (role ? role.name : '') + ')');
}

function logoutUser() {
  sessionLoggedIn = false;
  productDirty = false;
  currentProductId = null;
  closeAccountMenu();
  applyAccessControl();
  showLoginOverlay();
  showNotif('Deconnecte');
}

function showLoginOverlay() {
  const el = document.getElementById('login-overlay');
  if (el) el.hidden = false;
  refreshAccountMenu();
}

function hideLoginOverlay() {
  const el = document.getElementById('login-overlay');
  if (el) el.hidden = true;
}

document.addEventListener('click', function(e) {
  const menu = document.getElementById('account-menu');
  if (menu && !menu.contains(e.target)) closeAccountMenu();
});

function initGroupFilters() {
  if (!activeGroupFilters) {
    activeGroupFilters = new Set(attrGroups.map(g => g.id));
  }
}

// ============================================================
// COULEURS GROUPES
// ============================================================
const GROUP_COLORS = [
  { bg: '#e3f2fd', text: '#1565c0' },
  { bg: '#f3e5f5', text: '#6a1b9a' },
  { bg: '#e8f5e9', text: '#2e7d32' },
  { bg: '#fff3e0', text: '#e65100' },
  { bg: '#fce4ec', text: '#880e4f' },
  { bg: '#e0f7fa', text: '#006064' },
  { bg: '#f9fbe7', text: '#558b2f' },
  { bg: '#ede7f6', text: '#4527a0' },
  { bg: '#e8eaf6', text: '#283593' },
  { bg: '#fff8e1', text: '#f57f17' },
  { bg: '#efebe9', text: '#4e342e' },
  { bg: '#e0f2f1', text: '#004d40' },
];

function getGroupColor(g) {
  const idx = attrGroups.findIndex(x => x.id === g.id);
  return GROUP_COLORS[idx % GROUP_COLORS.length];
}

// ============================================================
// BADGES CATEGORIES
// ============================================================
function getCatBadgeStyle(catName) {
  const cat = getCatByName(catName);
  if (!cat) return 'background:#f0f4f8;color:#607080';
  return `background:${cat.color}22;color:${cat.color};border:1px solid ${cat.color}55`;
}

// ============================================================
// VISUEL MINIATURE
// ============================================================
// ============================================================
// CHAMP NOMBRE
// La molette est neutralisee pour eviter de modifier une valeur en
// faisant defiler la page. Les fleches d'increment n'apparaissent que si
// l'attribut active stepEnabled, sinon le champ est un texte numerique.
// ============================================================
// Champ de saisie numerique vide = propriete non definie
function numOrNull(v) {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function attrDecimals(a) {
  if (!a || isPercentAttr(a)) return null;
  if (a.type !== 'Nombre' && a.type !== 'Nombre decimal') return null;
  return a.decimals === 1 || a.decimals === 2 ? a.decimals : 0;
}

function formatAttrNumber(a, val) {
  if (val === undefined || val === null || String(val).trim() === '') return '';
  if (isPercentAttr(a)) return formatPercentDisplay(val);
  const d = attrDecimals(a);
  const n = parseFloat(String(val).replace(',', '.'));
  if (isNaN(n) || d == null) return String(val);
  return n.toFixed(d);
}

function numberInput(p, a, val) {
  const percent = isPercentAttr(a);
  const bounded = k => a[k] !== undefined && a[k] !== null && a[k] !== '';
  let extra = '';
  const step = percent && bounded('step') ? a.step * 100 : a.step;
  const min  = percent && bounded('min')  ? a.min * 100  : a.min;
  const max  = percent && bounded('max')  ? a.max * 100  : a.max;
  if (a.stepEnabled) {
    if (bounded('step')) extra += ` step="${step}"`;
    if (bounded('min'))  extra += ` min="${min}"`;
    if (bounded('max'))  extra += ` max="${max}"`;
  }
  const typeAttr = a.stepEnabled ? 'type="number"' : 'type="text" inputmode="decimal"';
  const display  = percent ? formatPercentDisplay(val) : formatAttrNumber(a, val);
  const input = `<input class="field-input" ${typeAttr}${extra} value="${display}"
    data-field-code="${a.code}" ${percent ? 'data-percent-display="1"' : ''}
    onwheel="event.preventDefault();this.blur()"
    oninput="onNumberInput(${p.id},this,'${a.code}')"
    onblur="onNumberBlur(this,'${a.code}')">`;
  if (!percent) return input;
  return `<div style="display:flex;align-items:center;gap:6px">${input}
    <span style="font-size:12px;color:#607080">%</span></div>`;
}

function onNumberInput(productId, el, code) {
  const a = attributes.find(x => x.code === code) || {};
  if (!a.stepEnabled) {
    const clean = el.value.replace(/[^0-9.,-]/g, '').replace(',', '.');
    if (clean !== el.value) el.value = clean;
  }
  onFieldChange(productId, el, code);
  refreshCalcFields(productId);
}

// Recadre la valeur dans les bornes de l'attribut
function onNumberBlur(el, code) {
  const a = attributes.find(x => x.code === code) || {};
  const percent = isPercentAttr(a) || el.getAttribute('data-percent-display') === '1';
  const n = parseFloat(String(el.value).replace(',', '.'));
  if (isNaN(n)) return;
  let v = n;
  const min = percent && a.min != null && a.min !== '' ? Number(a.min) * 100 : Number(a.min);
  const max = percent && a.max != null && a.max !== '' ? Number(a.max) * 100 : Number(a.max);
  if (a.min !== undefined && a.min !== null && a.min !== '' && v < min) v = min;
  if (a.max !== undefined && a.max !== null && a.max !== '' && v > max) v = max;
  const shown = percent ? String(v) : formatAttrNumber(a, v);
  if (String(el.value) === shown) return;
  el.value = shown;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  if (v === n) return;
  showNotif((a.name || code) + ' ramene a ' + v + (percent ? '%' : '')
    + ' (bornes ' + (percent ? min : a.min) + ' a ' + (percent ? max : a.max) + ')');
}

// ============================================================
// CHAMP CALCULE
// La valeur vient de la formule, mais peut etre forcee manuellement
// produit par produit (cas d'usage : imposer un PVMC).
// ============================================================
function isFieldForced(p, code) {
  return !!p.forcedFields && Object.prototype.hasOwnProperty.call(p.forcedFields, code);
}

function calcFieldInput(p, a, val) {
  const forced = isFieldForced(p, a.code);
  const badgeStyle = `position:absolute;right:8px;top:50%;transform:translateY(-50%);
    width:18px;height:18px;border-radius:50%;font-size:11px;font-weight:700;
    display:flex;align-items:center;justify-content:center;cursor:help;`;
  const safeVal = (a.type === 'Nombre' || a.type === 'Nombre decimal' || isPercentAttr(a))
    ? escapeHtml(formatCalcFieldDisplay(a, val))
    : escapeHtml(displayFieldVal(val));

  const field = forced
    ? `<input class="field-input" data-calc="${a.code}" value="${safeVal}"
         style="background:#e8f0fe;color:#1565c0;padding-right:32px"
         oninput="onForcedFieldInput(${p.id},this,'${a.code}')">
       <div style="${badgeStyle}background:#1565c0;color:#fff"
         title="Valeur forcee manuellement">&#9998;</div>`
    : `<input class="field-input" data-calc="${a.code}" value="${safeVal}" readonly
         style="background:#fffde7;color:#795548;padding-right:32px">
       <div style="${badgeStyle}background:#ffd54f;color:#5d4037;cursor:help" title="${escapeHtml(calcTitleText(a))}">ƒx</div>`;

  const action = forced
    ? `<button class="action-btn" style="font-size:11px;padding:2px 8px"
         onclick="unforceCalcField(${p.id},'${a.code}')">Revenir au calcul</button>`
    : `<button class="action-btn" style="font-size:11px;padding:2px 8px"
         onclick="forceCalcField(${p.id},'${a.code}')">Forcer la valeur</button>`;

  return `<div id="calcfield-${p.id}-${a.code}">
    <div style="position:relative">${field}</div>
    <div style="text-align:right;margin-top:3px">${action}</div>
  </div>`;
}

// Remplace la cellule en place, pour ne pas perdre l'onglet actif
function refreshCalcFieldCell(p, code) {
  const cell = document.getElementById('calcfield-' + p.id + '-' + code);
  const attr = attributes.find(a => a.code === code);
  if (cell && attr) cell.outerHTML = calcFieldInput(p, attr, p.fields[code] || '');
}

function forceCalcField(productId, code) {
  const p = products.find(x => x.id === productId);
  if (!p || !requirePerm(canEditProduct(p))) return;
  if (!p.forcedFields) p.forcedFields = {};
  p.forcedFields[code] = p.fields[code] || '';
  const attr = attributes.find(a => a.code === code);
  addPendingChange(p, (attr ? attr.name : code) + ' (mode)', 'Calcule', 'Force');
  productDirty = true;
  refreshCalcFieldCell(p, code);
  showNotif('Valeur forcee sur ' + (attr ? attr.name : code) + ' : la formule est ignoree', 'warn');
}

function unforceCalcField(productId, code) {
  const p = products.find(x => x.id === productId);
  if (!p || !requirePerm(canEditProduct(p))) return;
  if (p.forcedFields) delete p.forcedFields[code];
  const attr = attributes.find(a => a.code === code);
  addPendingChange(p, (attr ? attr.name : code) + ' (mode)', 'Force', 'Calcule');
  productDirty = true;
  computeCalcFields(p);
  refreshCalcFieldCell(p, code);
  refreshCalcFields(productId);
  showNotif('Retour à la valeur calculée sur ' + (attr ? attr.name : code));
}

function onForcedFieldInput(productId, el, code) {
  const p = products.find(x => x.id === productId);
  if (!p || !canEditProduct(p)) return;
  if (!p.forcedFields) p.forcedFields = {};
  const attr = attributes.find(a => a.code === code);
  p.forcedFields[code] = (attr && isPercentAttr(attr))
    ? percentFromDisplay(el.value)
    : el.value;
  onFieldChange(productId, el, code);
}

// ============================================================
// CHAMP TEXTE LONG
// Zone redimensionnable, longueur maximale optionnelle et compteur
// ============================================================
function charCountLabel(len, max) {
  return max ? `${len} / ${max} caracteres` : `${len} caracteres`;
}

function longTextInput(p, a, val) {
  const max     = a.maxLength || 0;
  const maxAttr = max ? ` maxlength="${max}"` : '';
  return `<div>
    <textarea class="field-input" rows="4"${maxAttr} data-field-code="${a.code}"
      style="resize:vertical;min-height:90px"
      oninput="onLongTextInput(${p.id},this,'${a.code}',${max})">${val}</textarea>
    <div class="char-count"
      style="font-size:11px;color:#a0b0c0;text-align:right;margin-top:2px">
      ${charCountLabel(String(val || '').length, max)}
    </div>
  </div>`;
}

function onLongTextInput(productId, el, code, max) {
  onFieldChange(productId, el, code);
  const counter = el.parentNode.querySelector('.char-count');
  if (counter) counter.textContent = charCountLabel(el.value.length, max);
}

// Miniature de liste : on affiche la vignette réduite (96 px) produite à
// l'envoi du visuel, jamais l'image d'origine ; taille fixe, chargement différé.
// Image d'un attribut de type Image : l'image chargée, ou la valeur si c'est
// une adresse (http…, data:) ; sinon seulement le nom du fichier
function imageSrc(p, code) {
  if (!p) return '';
  if (p.images && p.images[code]) return p.images[code];
  const v = String((p.fields && p.fields[code]) || '');
  return /^(https?:|data:image)/i.test(v) ? v : '';
}

function visualThumb(product, size, code) {
  size = size || 40;
  const field = code || (getSynthVisualItem() || {}).code || '';
  const src = (product.thumbs && product.thumbs[field]) || imageSrc(product, field);
  if (src) {
    return `<img src="${src}" width="${size}" height="${size}" loading="lazy" decoding="async"
      class="list-thumb" style="width:${size}px;height:${size}px"
      onclick="openProductDetail(${product.id})" alt="">`;
  }
  return `<div class="list-thumb list-thumb-empty" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.5)}px"
    onclick="openProductDetail(${product.id})">&#128247;</div>`;
}

// Réduit un visuel envoyé à une vignette (côté le plus long : 96 px)
function makeThumb(dataUrl, cb) {
  const img = new Image();
  img.onload = () => {
    const k = 96 / Math.max(img.width, img.height, 1);
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * Math.min(1, k)));
    c.height = Math.max(1, Math.round(img.height * Math.min(1, k)));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    cb(c.toDataURL('image/jpeg', 0.8));
  };
  img.onerror = () => cb(dataUrl);
  img.src = dataUrl;
}

// ============================================================
// RECHERCHE PRODUITS (barre de recherche globale)
// ============================================================
function onSearchInput() {
  _filterIncomplets = false;
  _filterAlertId = null;
  currentPage = 1;
  renderProductsTable();
}
// ============================================================
// AUTO-SLUG CODE TECHNIQUE
// ============================================================
function autoSlug(sourceId, targetId) {
  const src = document.getElementById(sourceId);
  const tgt = document.getElementById(targetId);
  if (!src || !tgt) return;
  tgt.value = src.value
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
// ============================================================
// INITIALISATION APPLICATION
// ============================================================
function comboNorm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function comboLabel(sel) {
  const opt = sel.options[sel.selectedIndex];
  if (!opt || opt.value === '') return '';
  return opt.text;
}

function syncComboFromSelect(sel) {
  if (!sel || !sel.dataset || !sel.dataset.combo) return;
  const input = sel.parentElement && sel.parentElement.querySelector('.combo-input');
  if (!input || input === document.activeElement) return;
  input.value = comboLabel(sel);
  input.disabled = sel.disabled;
  input.title = sel.title || '';
}

function comboRenderList(sel, input, list, query) {
  const q = comboNorm(query);
  const items = [];
  for (let i = 0; i < sel.options.length; i++) {
    const o = sel.options[i];
    const text = o.text || '';
    if (q && !comboNorm(text).includes(q) && !comboNorm(o.value).includes(q)) continue;
    items.push(o);
  }
  const shown = items.slice(0, 50);
  list.innerHTML = '';
  if (!shown.length) {
    const empty = document.createElement('div');
    empty.className = 'combo-empty';
    empty.textContent = 'Aucun résultat';
    list.appendChild(empty);
  }
  shown.forEach(function(o, idx) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'combo-opt' + (o.value === sel.value ? ' is-current' : '') + (idx === 0 ? ' is-active' : '');
    b.textContent = o.value === '' ? '— Aucun —' : (o.text || o.value);
    b.addEventListener('mousedown', function(e) {
      e.preventDefault();
      sel.value = o.value;
      input.value = comboLabel(sel);
      list.hidden = true;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    list.appendChild(b);
  });
  if (items.length > shown.length) {
    const more = document.createElement('div');
    more.className = 'combo-empty';
    more.textContent = 'Continuez a saisir pour affiner';
    list.appendChild(more);
  }
  list.hidden = false;
}

function enhanceSelect(sel) {
  if (!sel || sel.dataset.combo || sel.multiple || !sel.parentNode) return;
  if (sel.closest && sel.closest('.combo')) return;
  sel.dataset.combo = '1';
  const wrap = document.createElement('div');
  wrap.className = 'combo';
  sel.parentNode.insertBefore(wrap, sel);
  wrap.appendChild(sel);
  sel.classList.add('combo-native');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'field-input combo-input';
  input.autocomplete = 'off';
  input.spellcheck = false;
  // Libellé de l'option vide s'il est parlant (« Ajouter un attribut… »), sinon « Choisir… »
  const emptyOpt = sel.querySelector('option[value=""]');
  const emptyTxt = emptyOpt ? emptyOpt.textContent.trim() : '';
  input.placeholder = emptyTxt && !emptyTxt.startsWith('--') ? emptyTxt : 'Choisir…';
  input.value = comboLabel(sel);
  input.disabled = sel.disabled;
  input.title = sel.title || '';
  const list = document.createElement('div');
  list.className = 'combo-list';
  list.hidden = true;
  wrap.appendChild(input);
  wrap.appendChild(list);
  input.addEventListener('focus', function() {
    input.select();
    comboRenderList(sel, input, list, '');
  });
  input.addEventListener('input', function() {
    comboRenderList(sel, input, list, input.value);
  });
  input.addEventListener('keydown', function(e) {
    const opts = Array.from(list.querySelectorAll('.combo-opt'));
    if (!opts.length) return;
    let i = opts.findIndex(function(b) { return b.classList.contains('is-active'); });
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (i < 0) i = 0;
      else i = e.key === 'ArrowDown' ? Math.min(opts.length - 1, i + 1) : Math.max(0, i - 1);
      opts.forEach(function(b) { b.classList.remove('is-active'); });
      opts[i].classList.add('is-active');
      opts[i].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      (opts[i] || opts[0]).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    } else if (e.key === 'Escape') {
      list.hidden = true;
      input.value = comboLabel(sel);
    }
  });
  input.addEventListener('blur', function() {
    list.hidden = true;
    input.value = comboLabel(sel);
  });
}

function upgradeNewSelects(root) {
  const scope = root && root.querySelectorAll ? root : document;
  scope.querySelectorAll('select.form-select:not([data-combo]):not([multiple])').forEach(enhanceSelect);
}

function installComboSelects() {
  if (window._comboObs || !document.body) return;
  window._comboObs = new MutationObserver(function() { upgradeNewSelects(); });
  window._comboObs.observe(document.body, { childList: true, subtree: true });
  upgradeNewSelects();
}

document.addEventListener('DOMContentLoaded', function() {
  // Initialisation des filtres de groupes
  activeGroupFilters = new Set(attrGroups.map(g => g.id));

  // Mise en coherence des produits, puis calcul initial des champs calculés
  normalizeProducts();
  syncMarqueOptionsFromBrandSettings();
  products.forEach(p => computeCalcFields(p));
  // Date dashboard
  const datEl = document.getElementById('dashboard-date');
  if (datEl) {
    const now  = new Date();
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    datEl.textContent = now.toLocaleDateString('fr-FR', opts);
  }
  installComboSelects();
  applyAccessControl();
  const home = getDefaultNavPage();
  if (home) {
    showPage(home.page, document.querySelector('.nav-item[data-nav="' + home.nav + '"]'));
  }

  // Molette : ne jamais incrementer un champ nombre, laisser defiler la page
  document.addEventListener('wheel', function(e) {
    const t = e.target;
    if (!t || t.tagName !== 'INPUT' || t.type !== 'number') return;
    e.preventDefault();
    t.blur();
  }, { passive: false, capture: true });

  // Raccourci clavier Ctrl+S sur la fiche produit
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      if (currentProductId) {
        e.preventDefault();
        const p = products.find(x => x.id === currentProductId);
        if (p && canEditProduct(p)) saveProduct();
      }
    }
  });

  // Fermeture dropdown filtre colonne au scroll du tableau
  const tableWrap = document.querySelector('.table-container');
  if (tableWrap) {
    tableWrap.addEventListener('scroll', function() {
      if (activeColFilterDropdown) {
        activeColFilterDropdown.remove();
        activeColFilterDropdown = null;
        document.removeEventListener('click', colFilterOutsideClick);
      }
    });
  }
});
