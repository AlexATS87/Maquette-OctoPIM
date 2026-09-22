// ============================================================
// UTILS.JS — Fonctions utilitaires partagées
// ============================================================

// ============================================================
// NAVIGATION — PAGES
// ============================================================
function showPage(id, navEl) {
  // Interception dirty check si on quitte une fiche produit
  if (productDirty && currentProductId && id !== 'product-detail') {
    safeShowPage(id, navEl);
    return;
  }

  if (!sessionLoggedIn) {
    showLoginOverlay();
    return;
  }

  if (!canOpenPage(id)) {
    showNotif('Acces non autorise', 'warn');
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
  if (navEl)  navEl.classList.add('active');

  // Rendu conditionnel selon la page
  switch (id) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'products':
      currentProductId = null;
      productDirty     = false;
      renderProductsTable();
      break;
    case 'exports':
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
    case 'admin-attribute-edit':
      // Rendu géré par editAttribute()
      break;
    default:
      break;
  }
}

function renderAdminHome() {
  // Mise à jour des compteurs sur la page d'accueil admin
  const elCats   = document.getElementById('admin-count-cats');
  const elGroups = document.getElementById('admin-count-groups');
  const elAttrs  = document.getElementById('admin-count-attrs');
  const elRoles  = document.getElementById('admin-count-roles');
  const elSup    = document.getElementById('admin-count-suppliers');
  if (elCats)   elCats.textContent   = categories.length;
  if (elGroups) elGroups.textContent = attrGroups.length;
  if (elAttrs)  elAttrs.textContent  = attributes.length;
  if (elRoles)  elRoles.textContent  = roles.length;
  if (elSup)    elSup.textContent    = suppliers.length;
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
    showNotif('Aucune categorie accessible en modification', 'warn');
    return;
  }
  if (id === 'modal-create-category' && !canMod('mod_categories', 'w')) {
    showNotif('Action non autorisee', 'warn');
    return;
  }
  if (id === 'modal-create-attr' && !canMod('mod_attributes', 'w')) {
    showNotif('Action non autorisee', 'warn');
    return;
  }
  if (id === 'modal-create-group' && !canMod('mod_groups', 'w')) {
    showNotif('Action non autorisee', 'warn');
    return;
  }
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
// Attributs comptant dans la completion, limites aux groupes de la categorie
function getCompletionAttrs(product) {
  const cat = getCatByName(product.cat);
  return (cat ? getAttrsForCat(product.cat) : attributes).filter(a => a.inCompletion);
}

function calcCompletion(product) {
  const attrs = getCompletionAttrs(product);
  const total = attrs.length;
  if (!total) return 100;

  const filled = attrs.filter(a => {
    const v = product.fields[a.code];
    return v !== undefined && v !== null && String(v).trim() !== '';
  }).length;

  return Math.round((filled / total) * 100);
}

function getCompletionColor(pct) {
  if (pct >= seuilCompletion) return '#4caf50';
  if (pct >= seuilCompletion * 0.6) return '#ffa726';
  return '#ef5350';
}

// Taux de remplissage d'un attribut, limite aux produits des categories
// qui contiennent son groupe. Sert a reperer les attributs qui ne servent plus.
function isProtectedAttr(a) {
  return !!(a && a.system);
}

function isProtectedGroup(g) {
  return !!(g && (g.system || g.isBrandGroup));
}

function systemLockIcon() {
  return `<svg class="system-lock-icon" viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
    <path fill="currentColor" d="M5 7V5.2a3 3 0 016 0V7h.7c.7 0 1.3.6 1.3 1.3v5.4c0 .7-.6 1.3-1.3 1.3H4.3C3.6 15 3 14.4 3 13.7V8.3C3 7.6 3.6 7 4.3 7H5zm1.2 0h3.6V5.2a1.8 1.8 0 10-3.6 0V7z"/>
  </svg>`;
}

function systemLockBadge(kind) {
  const title = kind === 'group'
    ? 'Groupe systeme : impossible a supprimer'
    : 'Attribut systeme : impossible a supprimer';
  return `<span class="system-lock" title="${title}">${systemLockIcon()}</span>`;
}

function getConditionGroup() {
  return attrGroups.find(g => g.isBrandGroup || g.code === 'conditions_commerciales') || null;
}

function getConditionAttrs() {
  const g = getConditionGroup();
  return g ? g.attrIds.map(id => getAttrById(id)).filter(Boolean) : [];
}

function isPercentBrandAttr(a) {
  return !!(a && (a.displayFormat === 'percent' || a.code === 'rf' || a.code === 'rfa' || a.code === 'remiseEnseigne'));
}

function brandAttrStorageKey(attr) {
  if (!attr) return '';
  if (attr.code === 'fournisseur_code') return 'fournisseurCode';
  if (attr.code === 'cat') return 'type';
  return attr.code;
}

function getBrandSettingAttrValue(b, attr) {
  if (!b || !attr) return '';
  if (attr.code === 'fournisseur_code')
    return supplierNameByCode(b.fournisseurCode) || b.fournisseurCode || '';
  if (attr.code === 'marque') return b.marque || '';
  if (attr.code === 'cat') return b.type || '';
  if (attr.code === 'segmentation') {
    if (!b.segAttrCode) return '';
    const sa = attributes.find(x => x.code === b.segAttrCode);
    const label = sa ? sa.name : b.segAttrCode;
    return b.segAttrValue ? (label + ' = ' + b.segAttrValue) : label;
  }
  const key = brandAttrStorageKey(attr);
  const v = b[key];
  if (isPercentBrandAttr(attr)) {
    if (typeof v !== 'number') return '';
    const digits = attr.code === 'remiseEnseigne' ? 0 : 2;
    return (v * 100).toFixed(digits) + '%';
  }
  if (attr.type === 'Oui / Non' || attr.code === 'repriseEchange')
    return v ? 'Oui' : 'Non';
  if (v === undefined || v === null || v === '') return '';
  return String(v);
}

function getBrandSettingSortValue(b, attr) {
  if (!b || !attr) return '';
  if (attr.code === 'fournisseur_code')
    return supplierNameByCode(b.fournisseurCode) || b.fournisseurCode || '';
  if (attr.code === 'marque') return b.marque || '';
  if (attr.code === 'cat') return b.type || '';
  if (attr.code === 'segmentation') return getBrandSettingAttrValue(b, attr);
  const key = brandAttrStorageKey(attr);
  const v = b[key];
  if (isPercentBrandAttr(attr) || attr.type === 'Nombre') return typeof v === 'number' ? v : -1;
  if (attr.type === 'Oui / Non' || attr.code === 'repriseEchange') return v ? 1 : 0;
  return v == null ? '' : String(v);
}

function attrStoresInFields(a) {
  if (!a) return false;
  return a.code !== 'cat' && a.code !== 'completion'
    && a.code !== 'created_at' && a.code !== 'updated_at'
    && a.code !== 'segmentation';
}

function isConditionRowAttr(a) {
  return !!(a && a.code === 'segmentation');
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
  const mark = a.inCompletion ? completionMarkHtml() : '';
  const req  = a.required ? '<span class="field-required">*</span>' : '';
  return `${mark}<span>${escapeHtml(a.name)}</span>${req}${attrHelpTip(a)}`;
}

function attrFillRate(attr) {
  const scope = products.filter(p => {
    const cat = getCatByName(p.cat);
    if (!cat || !attr.groupId) return true;
    return cat.groupIds.includes(attr.groupId);
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
    <div class="field-label">${a ? attrLabelHtml(a) : 'Categorie <span class="field-required">*</span>'}</div>
    ${categorieSelectHtml(p)}
  </div>`;
}

function formatAttrListValue(p, attr) {
  if (attr.code === 'segmentation') {
    const info = getBrandInfoForProduct(p);
    return info ? (getBrandSettingAttrValue(info, attr) || '—') : '—';
  }
  if (attr.code === 'fournisseur_code') {
    const v = p.fields[attr.code];
    if (isEmptyFieldVal(v)) return '—';
    return supplierNameByCode(v) || String(v);
  }
  const v = getAttrFieldValue(p, attr);
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
  const s = suppliers.find(x => x.code === code);
  return s ? s.name : (code || '');
}

function resolveSupplierCode(inputVal) {
  const v = (inputVal || '').trim();
  if (!v) return '';
  const byName = suppliers.find(s => s.name.toLowerCase() === v.toLowerCase());
  if (byName) return byName.code;
  const byCode = suppliers.find(s => s.code.toLowerCase() === v.toLowerCase());
  if (byCode) return byCode.code;
  const m = v.match(/\(([^)]+)\)\s*$/);
  if (m) {
    const nested = suppliers.find(s => s.code === m[1]);
    if (nested) return nested.code;
  }
  return '';
}

function matchBrandType(brandType, catName) {
  if (!brandType) return true;
  const norm = s => String(s).toLowerCase().replace(/s$/, '').trim();
  return norm(brandType) === norm(catName || '');
}

function brandRowMatchesProduct(b, p) {
  if (!p) return true;
  if (b.type && p.cat && !matchBrandType(b.type, p.cat)) return false;
  if (b.segAttrCode && b.segAttrValue) {
    const seg = p.fields && p.fields[b.segAttrCode];
    if (seg && String(seg) !== String(b.segAttrValue)) return false;
  }
  return true;
}

function eligibleBrandRows(p) {
  return brandSettings.filter(b => brandRowMatchesProduct(b, p));
}

function suppliersForProduct(p) {
  let rows = eligibleBrandRows(p);
  const marque = ((p.fields || {}).marque || '').trim();
  if (marque) rows = rows.filter(b => b.marque === marque);
  const codes = [...new Set(rows.map(b => b.fournisseurCode))];
  return suppliers.filter(s => codes.includes(s.code));
}

function marquesForProduct(p) {
  let rows = eligibleBrandRows(p);
  const code = (p.fields || {}).fournisseur_code || '';
  if (code) rows = rows.filter(b => b.fournisseurCode === code);
  return [...new Set(rows.map(b => b.marque))].sort();
}

function marquesForSupplier(fournisseurCode, catName) {
  return [...new Set(
    brandSettings
      .filter(b =>
        (!fournisseurCode || b.fournisseurCode === fournisseurCode) &&
        (!catName || !b.type || matchBrandType(b.type, catName))
      )
      .map(b => b.marque)
  )].sort();
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
};

function getCurrentUser() {
  return users.find(u => u.id === currentUserId) || users[0] || null;
}

function getCurrentRole() {
  const u = getCurrentUser();
  if (!u) return roles[0] || null;
  return roles.find(r => r.id === u.roleId) || roles[0] || null;
}

function currentUserName() {
  const u = getCurrentUser();
  return u ? u.name : 'J. Doe';
}

function isTechAdmin() {
  const role = getCurrentRole();
  return !!(role && role.id === 1);
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
  showNotif(msg || 'Action non autorisee', 'warn');
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
  fillCatSelect(document.getElementById('filter-cat'), getReadableCategories(), 'Toutes categories');
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
      const r = roles.find(x => x.id === usr.roleId);
      const active = usr.id === currentUserId && sessionLoggedIn;
      return `<button type="button" class="account-dropdown-item${active ? ' is-active' : ''}"
        onclick="switchUser(${usr.id})">
        <span class="account-dropdown-avatar" style="background:${usr.color || '#1565c0'}">${usr.initials}</span>
        <span>
          <span class="account-dropdown-name">${escapeHtml(usr.name)}</span>
          <span class="account-dropdown-meta">${escapeHtml(r ? r.name : '')}</span>
        </span>
      </button>`;
    }).join('');
  }
  const loginList = document.getElementById('login-user-list');
  if (loginList) {
    loginList.innerHTML = users.map(usr => {
      const r = roles.find(x => x.id === usr.roleId);
      return `<button type="button" class="login-user-btn" onclick="switchUser(${usr.id})">
        <span class="account-dropdown-avatar" style="background:${usr.color || '#1565c0'}">${usr.initials}</span>
        <span>
          <div class="account-dropdown-name">${escapeHtml(usr.name)}</div>
          <div class="account-dropdown-meta">${escapeHtml(r ? r.name : '')}</div>
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
  updateTopbarTitle('Preferences d\'affichage');
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
              <div style="font-size:11px;color:#a0b0c0">Theme par defaut</div>
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
  showNotif('Theme enregistre (application a venir)');
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

function numberInput(p, a, val) {
  const bounded = k => a[k] !== undefined && a[k] !== null && a[k] !== '';
  let extra = '';
  if (a.stepEnabled) {
    if (bounded('step')) extra += ` step="${a.step}"`;
    if (bounded('min'))  extra += ` min="${a.min}"`;
    if (bounded('max'))  extra += ` max="${a.max}"`;
  }
  const typeAttr = a.stepEnabled ? 'type="number"' : 'type="text" inputmode="decimal"';
  return `<input class="field-input" ${typeAttr}${extra} value="${val}"
    data-field-code="${a.code}" onwheel="event.preventDefault();this.blur()"
    oninput="onNumberInput(${p.id},this,'${a.code}')"
    onblur="onNumberBlur(this,'${a.code}')">`;
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
  const n = parseFloat(el.value);
  if (isNaN(n)) return;
  let v = n;
  if (a.min !== undefined && a.min !== null && a.min !== '' && v < Number(a.min)) v = Number(a.min);
  if (a.max !== undefined && a.max !== null && a.max !== '' && v > Number(a.max)) v = Number(a.max);
  if (v === n) return;
  el.value = v;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  showNotif((a.name || code) + ' ramene a ' + v + ' (bornes ' + (a.min ?? '-') + ' a ' + (a.max ?? '-') + ')');
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
  const safeVal = escapeHtml(displayFieldVal(val));

  const field = forced
    ? `<input class="field-input" data-calc="${a.code}" value="${safeVal}"
         style="background:#e8f0fe;color:#1565c0;padding-right:32px"
         oninput="onForcedFieldInput(${p.id},this,'${a.code}')">
       <div style="${badgeStyle}background:#1565c0;color:#fff"
         title="Valeur forcee manuellement">&#9998;</div>`
    : `<input class="field-input" data-calc="${a.code}" value="${safeVal}" readonly
         style="background:#fffde7;color:#795548;padding-right:32px">
       <div style="${badgeStyle}background:#ffd54f;color:#5d4037"
         title="Champ calcule">&#9654;</div>`;

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
  showNotif('Retour a la valeur calculee sur ' + (attr ? attr.name : code));
}

function onForcedFieldInput(productId, el, code) {
  const p = products.find(x => x.id === productId);
  if (!p || !canEditProduct(p)) return;
  if (!p.forcedFields) p.forcedFields = {};
  p.forcedFields[code] = el.value;
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

function visualThumb(product, size, code) {
  size = size || 40;
  const field = code || 'visuel_face';
  if (product.fields && product.fields[field]) {
    return `<img src="${product.fields[field]}"
      style="width:${size}px;height:${size}px;object-fit:cover;border-radius:6px;
             border:1px solid #e8ecf0;cursor:pointer;display:block"
      onclick="openProductDetail(${product.id})"
      title="Voir la fiche">`;
  }
  return `<div style="width:${size}px;height:${size}px;border-radius:6px;
    border:1px dashed #c0d0e0;background:#f8fafc;display:flex;
    align-items:center;justify-content:center;cursor:pointer;color:#c0d0e0;font-size:${Math.round(size * 0.5)}px"
    onclick="openProductDetail(${product.id})" title="Voir la fiche">&#128247;</div>`;
}

// ============================================================
// RECHERCHE PRODUITS (barre de recherche globale)
// ============================================================
function onSearchInput() {
  _filterIncomplets = false;
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
document.addEventListener('DOMContentLoaded', function() {
  // Initialisation des filtres de groupes
  activeGroupFilters = new Set(attrGroups.map(g => g.id));

  // Mise en coherence des produits, puis calcul initial des champs calculés
  normalizeProducts();
  products.forEach(p => computeCalcFields(p));
  // Date dashboard
  const datEl = document.getElementById('dashboard-date');
  if (datEl) {
    const now  = new Date();
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    datEl.textContent = now.toLocaleDateString('fr-FR', opts);
  }
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
