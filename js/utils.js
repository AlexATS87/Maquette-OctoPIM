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
    default: break;
  }
}

// ============================================================
// MODALES
// ============================================================
function openModal(id) {
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
function calcCompletion(product) {
  const cat   = getCatByName(product.cat);
  const attrs = cat
    ? cat.groupIds
        .map(gid => getGroupById(gid))
        .filter(Boolean)
        .flatMap(g => g.attrIds.map(id => getAttrById(id)).filter(Boolean))
        .filter(a => !a.calc && !a.readonly && a.required)
    : attributes.filter(a => !a.calc && !a.readonly && a.required);

  // Visuels obligatoires comptent comme 1 champ
  const visualRequired = ['visuel_face', 'visuel_tq', 'visuel_profil'];
  const hasVisuals     = visualRequired.every(c => !!product.fields[c]);
  const nonVisualAttrs = attrs.filter(a => !visualRequired.includes(a.code));
  const total          = nonVisualAttrs.length + 1; // +1 pour le bloc visuels
  if (total === 0) return 100;

  const filled = nonVisualAttrs.filter(a => {
    const v = product.fields[a.code];
    return v !== undefined && v !== null && String(v).trim() !== '';
  }).length + (hasVisuals ? 1 : 0);

  return Math.round((filled / total) * 100);
}

function getCompletionColor(pct) {
  if (pct >= seuilCompletion) return '#4caf50';
  if (pct >= seuilCompletion * 0.6) return '#ffa726';
  return '#ef5350';
}

// ============================================================
// ACCESSEURS DONNEES
// ============================================================
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
  // Tous les groupes pour l'instant — filtrage par role à brancher ici
  return attrGroups;
}

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
function visualThumb(product, size) {
  size = size || 40;
  if (product.fields && product.fields.visuel_face) {
    return `<img src="${product.fields.visuel_face}"
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
// INITIALISATION APPLICATION
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  // Initialisation des filtres de groupes
  activeGroupFilters = new Set(attrGroups.map(g => g.id));

  // Calcul initial des champs calculés sur tous les produits
  products.forEach(p => computeCalcFields(p));
  // Date dashboard
  const datEl = document.getElementById('dashboard-date');
  if (datEl) {
    const now  = new Date();
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    datEl.textContent = now.toLocaleDateString('fr-FR', opts);
  }
  // Affichage de la page dashboard par défaut
  const defaultNav = document.querySelector('.nav-item[onclick*="dashboard"]');
  showPage('dashboard', defaultNav);

  // Raccourci clavier Ctrl+S sur la fiche produit
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      if (currentProductId) {
        e.preventDefault();
        saveProduct();
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
