// ============================================================
// ADMIN.JS
// ============================================================

// ============================================================
// ADMIN — SYNTHESE (groupe figé, transversal)
// ============================================================
function renderSyntheseAdmin() {
  const page = document.getElementById('page-admin-synthese');
  if (!page) return;

  // Les attributs Image passent par le selecteur de visuel dedie
  const attrOptions = attributes.filter(a => a.type !== 'Image' && !a.system).map(a =>
    `<option value="${a.id}">${a.name} (${a.code})</option>`
  ).join('');

  const actionOptions = `<option value="action_delete">Supprimer</option>`;

  const visualItem = getSynthVisualItem();

  page.innerHTML = `
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px">
      <button class="btn btn-secondary"
        onclick="showPage('admin',null)">&larr; Administration</button>
      <span style="font-size:15px;font-weight:700;color:#1a2332">
        Vue Synthese — colonnes
      </span>
    </div>

    <div style="display:grid;grid-template-columns:1fr 320px;gap:20px;max-width:1000px">

      <div class="field-group">
        <div class="field-group-title">
          Colonnes actives
          <span style="font-size:12px;font-weight:400;color:#a0b0c0">
            (glisser pour reordonner)
          </span>
        </div>
        <div id="synthese-items-list">
          ${syntheseItems.map((item, i) => `
            <div class="cat-group-order-item" draggable="true"
              ondragstart="synthDragStart(${i})"
              ondragover="synthDragOver(event,${i})"
              ondrop="synthDrop(event,${i})">
              <span class="drag-handle">&#8942;&#8942;</span>
              <span style="flex:1;font-size:13px;font-weight:600;color:#1a2332">
                ${item.label}
              </span>
              ${isSynthTitleCode(item.code) && item.kind === 'attr'
                ? `<span class="badge" style="font-size:11px;background:#e3f2fd;color:#1565c0">
                     Titre &amp; lien
                   </span>`
                : ''}
              ${isVisualCode(item.code)
                ? `<span class="badge" style="font-size:11px;background:#f3e5f5;color:#7b1fa2">
                     Vignette
                   </span>`
                : ''}
              <span class="badge badge-grey" style="font-size:11px">
                ${item.kind === 'action' ? 'Action' : item.code}
              </span>
              <button class="action-btn-danger"
                style="padding:2px 8px;font-size:11px"
                onclick="removeSyntheseItem(${i})">&#10005;</button>
            </div>`
          ).join('')}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:14px">

        <div class="field-group">
          <div class="field-group-title">Ajouter un attribut</div>
          <select class="form-select" id="synth-add-attr" style="margin-bottom:10px">
            <option value="">-- Choisir --</option>
            ${attrOptions}
          </select>
          <button class="btn btn-primary" style="width:100%"
            onclick="addSyntheseAttr()">+ Ajouter</button>
        </div>

        <div class="field-group">
          <div class="field-group-title">Ajouter une action</div>
          <select class="form-select" id="synth-add-action" style="margin-bottom:10px">
            <option value="">-- Choisir --</option>
            ${actionOptions}
          </select>
          <button class="btn btn-primary" style="width:100%"
            onclick="addSyntheseAction()">+ Ajouter</button>
        </div>

        <div class="field-group">
          <div class="field-group-title">Visuel de la synthese</div>
          <select class="form-select" id="synth-visual" onchange="setSyntheseVisual()">
            <option value="">-- Aucun --</option>
            ${attributes.filter(a => a.type === 'Image').map(a =>
              `<option value="${a.code}"
                ${visualItem && visualItem.code === a.code ? 'selected' : ''}>
                ${a.name}
              </option>`
            ).join('')}
          </select>
        </div>

        <div class="field-group">
          <div class="field-group-title">Attributs systeme</div>
          ${attributes.filter(a => a.system).map(s => {
            const already = isInSynthese(s.code);
            return `
            <div style="display:flex;align-items:center;justify-content:space-between;
              padding:5px 0;border-bottom:1px solid #f0f4f8">
              <span style="font-size:12px;color:#607080;display:inline-flex;align-items:center;gap:6px">
                ${escapeHtml(s.name)}${systemLockBadge('attr')}
              </span>
              ${already
                ? `<span style="font-size:11px;color:#a0b0c0">Deja ajoute</span>`
                : `<button class="btn btn-secondary"
                    style="font-size:11px;padding:3px 10px"
                    onclick="addSyntheseSystem('${s.code}','${escapeHtml(s.name)}')">
                    + Ajouter
                  </button>`}
            </div>`;
          }).join('')}
        </div>

      </div>
    </div>`;
}

let synthDragIdx = null;

function synthDragStart(i) { synthDragIdx = i; }

function synthDragOver(e, i) { e.preventDefault(); }

function synthDrop(e, i) {
  e.preventDefault();
  if (synthDragIdx === null || synthDragIdx === i) return;
  const moved = syntheseItems.splice(synthDragIdx, 1)[0];
  syntheseItems.splice(i, 0, moved);
  synthDragIdx = null;
  renderSyntheseAdmin();
}

function removeSyntheseItem(i) {
  if (!requirePerm(canMod('mod_synthese', 'w'))) return;
  syntheseItems.splice(i, 1);
  renderSyntheseAdmin();
  renderProductsTable();
}

// Un seul visuel dans la synthese : le select remplace celui en place
function setSyntheseVisual() {
  const code = (document.getElementById('synth-visual') || {}).value || '';
  const idx  = syntheseItems.findIndex(i => i.kind === 'attr' && isVisualCode(i.code));

  if (!code) {
    if (idx >= 0) syntheseItems.splice(idx, 1);
  } else {
    const a    = attributes.find(x => x.code === code);
    const item = { kind: 'attr', code: a.code, label: a.name };
    if (idx >= 0) syntheseItems[idx] = item;
    else {
      const firstAttr = syntheseItems.findIndex(i => i.kind === 'attr');
      syntheseItems.splice(firstAttr < 0 ? syntheseItems.length : firstAttr, 0, item);
    }
  }

  renderSyntheseAdmin();
  renderProductsTable();
  showNotif(code ? 'Visuel de la synthese mis a jour' : 'Visuel retire de la synthese', 'ok');
}

function synthCodeAliases(code) {
  if (code === 'created_at' || code === 'createdAt') return ['created_at', 'createdAt'];
  if (code === 'updated_at' || code === 'maj') return ['updated_at', 'maj'];
  return [code];
}

function isInSynthese(code) {
  const codes = synthCodeAliases(code);
  return syntheseItems.some(x => codes.includes(x.code));
}

function addSyntheseSystem(code, label) {
  if (isInSynthese(code)) {
    showNotif(label + ' est deja dans la vue synthese', 'warn'); return;
  }
  syntheseItems.push({ code, label, kind: 'attr' });
  renderSyntheseAdmin();
  showNotif(label + ' ajoute');
}

function addSyntheseAttr() {
  if (!requirePerm(canMod('mod_synthese', 'w'))) return;
  const sel = document.getElementById('synth-add-attr');
  if (!sel || !sel.value) { showNotif('Choisissez un attribut', 'warn'); return; }
  const attr = attributes.find(a => a.id === parseInt(sel.value));
  if (!attr) return;
  if (syntheseItems.find(x => x.code === attr.code)) {
    showNotif('Cet attribut est deja dans la vue synthese', 'warn'); return;
  }
  syntheseItems.push({ code: attr.code, label: attr.name, kind: 'attr' });
  renderSyntheseAdmin();
  showNotif(attr.name + ' ajoute a la vue synthese');
}

function addSyntheseAction() {
  if (!requirePerm(canMod('mod_synthese', 'w'))) return;
  const sel = document.getElementById('synth-add-action');
  if (!sel || !sel.value) { showNotif('Choisissez une action', 'warn'); return; }
  const code  = sel.value.replace('action_', '');
  const label = sel.options[sel.selectedIndex].text;
  if (syntheseItems.find(x => x.code === code && x.kind === 'action')) {
    showNotif('Cette action est deja presente', 'warn'); return;
  }
  syntheseItems.push({ code, label, kind: 'action' });
  renderSyntheseAdmin();
  showNotif('Action "' + label + '" ajoutee');
}

// ============================================================
// ADMIN — CATEGORIES
// ============================================================
function renderCatsTable() {
  const tb = document.getElementById('cats-tbody');
  if (!tb) return;
  tb.innerHTML = '';
  categories.forEach(cat => {
    const nb = cat.groupIds.length;
    const canW = canMod('mod_categories', 'w');
    const canD = canMod('mod_categories', 'd');
    tb.innerHTML += `<tr>
      <td><strong>${cat.name}</strong></td>
      <td style="font-family:monospace;font-size:12px;color:#607080">${cat.code}</td>
      <td><span class="color-swatch" style="background:${cat.color}"></span>${cat.color}</td>
      <td>${nb} groupe${nb > 1 ? 's' : ''}</td>
      <td><div class="td-actions">
        ${canW ? `<button class="action-btn" onclick="editCategory(${cat.id})">Editer</button>`
               : `<button class="action-btn" onclick="editCategory(${cat.id})">Voir</button>`}
        ${canD ? `<button class="action-btn-danger btn-trash" title="Supprimer la catégorie"
          onclick="confirmDelete('cat',${cat.id},'${cat.name}')">${TRASH_ICON}</button>` : ''}
      </div></td>
    </tr>`;
  });
}

function editCategory(id) {
  editingCatId = id;
  const cat = categories.find(c => c.id === id);
  if (!cat) return;
  document.getElementById('edit-cat-name').value  = cat.name;
  document.getElementById('edit-cat-code').value  = cat.code;
  document.getElementById('edit-cat-color').value = cat.color;
  renderCatGroupOrder(cat);
  renderCatGroupAvailable(cat);
  showPage('admin-category-edit', null);
}

function renderCatGroupOrder(cat) {
  const list = document.getElementById('cat-group-order-list');
  if (!list) return;
  list.innerHTML = '';
  cat.groupIds.forEach(gid => {
    const g = getGroupById(gid);
    if (!g) return;
    const item = document.createElement('div');
    item.className      = 'cat-group-order-item';
    item.dataset.groupId = gid;
    item.draggable      = true;
    item.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', String(gid));
      item.classList.add('dragging');
    });
    item.addEventListener('dragend',  () => item.classList.remove('dragging'));
    item.addEventListener('dragover', e => { e.preventDefault(); item.classList.add('drag-over'); });
    item.addEventListener('dragleave',() => item.classList.remove('drag-over'));
    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const fromId = parseInt(e.dataTransfer.getData('text/plain'));
      const toId   = parseInt(item.dataset.groupId);
      if (fromId === toId) return;
      const fi = cat.groupIds.indexOf(fromId);
      const ti = cat.groupIds.indexOf(toId);
      cat.groupIds.splice(fi, 1);
      cat.groupIds.splice(ti, 0, fromId);
      renderCatGroupOrder(cat);
    });
    item.innerHTML = `
      <span class="drag-handle">&#9776;</span>
      <span style="font-size:13px">${g.name}</span>
      ${g.system ? systemLockBadge('group') : ''}
      <button class="action-btn-danger"
        style="margin-left:auto;font-size:11px;padding:3px 8px"
        onclick="removeCatGroup(${cat.id},${gid})">Retirer</button>`;
    list.appendChild(item);
  });
}

function removeCatGroup(catId, groupId) {
  const cat = categories.find(c => c.id === catId);
  if (!cat) return;
  cat.groupIds = cat.groupIds.filter(id => id !== groupId);
  renderCatGroupOrder(cat);
  renderCatGroupAvailable(cat);
}

function renderCatGroupAvailable(cat) {
  const list = document.getElementById('cat-group-available-list');
  if (!list) return;
  list.innerHTML = '';
  const available = attrGroups.filter(g => !cat.groupIds.includes(g.id));
  if (!available.length) {
    list.innerHTML = '<div style="font-size:12px;color:#a0b0c0;padding:8px">Tous les groupes sont deja associes.</div>';
    return;
  }
  available.forEach(g => {
    const row = document.createElement('div');
    row.className          = 'attr-toggle-row';
    row.dataset.groupName  = g.name.toLowerCase();
    row.innerHTML = `
      <div class="attr-toggle-info">
        <div class="attr-toggle-name">${g.name}</div>
        <div class="attr-toggle-meta">${g.attrIds.filter(id => !isAttrSection(id)).length} attributs</div>
      </div>
      <button class="action-btn" onclick="addCatGroup(${cat.id},${g.id})">Ajouter</button>`;
    list.appendChild(row);
  });
}

function filterCatGroupToggles(v) {
  document.querySelectorAll('#cat-group-available-list .attr-toggle-row').forEach(r => {
    r.style.display = r.dataset.groupName.includes(v.toLowerCase()) ? '' : 'none';
  });
}

function addCatGroup(catId, groupId) {
  if (!requirePerm(canMod('mod_categories', 'w'))) return;
  const cat = categories.find(c => c.id === catId);
  if (!cat) return;
  if (!cat.groupIds.includes(groupId)) cat.groupIds.push(groupId);
  renderCatGroupOrder(cat);
  renderCatGroupAvailable(cat);
}

function saveCategoryEdit() {
  if (!requirePerm(canMod('mod_categories', 'w'))) return;
  const cat = categories.find(c => c.id === editingCatId);
  if (!cat) return;
  cat.name  = document.getElementById('edit-cat-name').value.trim()  || cat.name;
  cat.code  = document.getElementById('edit-cat-code').value.trim()  || cat.code;
  cat.color = document.getElementById('edit-cat-color').value;
  renderAll();
  showPage('admin-categories', null);
  showNotif('Categorie mise a jour');
}

function createCategory() {
  if (!requirePerm(canMod('mod_categories', 'w'))) return;
  const nameEl  = document.getElementById('new-cat-name');
  const codeEl  = document.getElementById('new-cat-code');
  const colorEl = document.getElementById('new-cat-color');
  const name    = nameEl.value.trim();
  const code    = codeEl.value.trim();
  const color   = colorEl.value || '#4fc3f7';

  if (!name) { showNotif('Le nom est obligatoire', 'error'); nameEl.focus(); return; }
  if (!code) { showNotif('Le code est obligatoire', 'error'); codeEl.focus(); return; }
  if (categories.find(c => c.code === code)) {
    showNotif('Ce code existe deja', 'error'); codeEl.focus(); return;
  }

  const newCat = {
    id:       Math.max(0, ...categories.map(c => c.id)) + 1,
    name,
    code,
    color,
    groupIds: [],
  };
  categories.push(newCat);
  grantPermsForNewCategory(newCat);

  nameEl.value  = '';
  codeEl.value  = '';
  colorEl.value = '#4fc3f7';

  closeModal('modal-create-category');
  renderCatsTable();
  renderAdminHome();
  showNotif('Categorie "' + name + '" creee');
}

// ============================================================
// ADMIN — ATTRIBUTS — TRI
// ============================================================
let attrSortState = { code: null, dir: 'asc' };

function renderAttrsTable() {
  const thead = document.getElementById('attrs-thead');
  const tbody = document.getElementById('attrs-tbody');
  if (!thead || !tbody) return;

  thead.innerHTML = `<tr>
    <th class="th-sortable" onclick="sortAttrsTable('name')">
      Nom <span style="color:#8a9bb0;font-size:11px">&#8645;</span>
    </th>
    <th class="th-sortable" onclick="sortAttrsTable('type')">
      Type <span style="color:#8a9bb0;font-size:11px">&#8645;</span>
    </th>
    <th class="th-sortable" onclick="sortAttrsTable('group')">
      Groupe <span style="color:#8a9bb0;font-size:11px">&#8645;</span>
    </th>
    <th class="th-sortable" onclick="sortAttrsTable('required')">
      Obligatoire <span style="color:#8a9bb0;font-size:11px">&#8645;</span>
    </th>
    <th class="th-sortable" onclick="sortAttrsTable('inCompletion')">
      Completion <span style="color:#8a9bb0;font-size:11px">&#8645;</span>
    </th>
    <th class="th-sortable" onclick="sortAttrsTable('fill')"
      title="Part des produits concernes qui ont une valeur pour cet attribut">
      Rempli <span style="color:#8a9bb0;font-size:11px">&#8645;</span>
    </th>
    <th class="th-icon"></th>
  </tr>`;

  const search = (document.getElementById('attrs-search') || {}).value || '';
  const q      = search.toLowerCase();

  let list = [...attributes];
  if (q) list = list.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.code.toLowerCase().includes(q) ||
    a.type.toLowerCase().includes(q)
  );

  if (_attrSortState.col) {
    list.sort((a, b) => {
      let va, vb;
      if (_attrSortState.col === 'name')     { va = a.name;  vb = b.name; }
      if (_attrSortState.col === 'type')     { va = a.type;  vb = b.type; }
      if (_attrSortState.col === 'required') { va = a.required ? 1 : 0; vb = b.required ? 1 : 0; }
      if (_attrSortState.col === 'inCompletion') { va = a.inCompletion ? 1 : 0; vb = b.inCompletion ? 1 : 0; }
      if (_attrSortState.col === 'fill')     { va = attrFillRate(a).pct; vb = attrFillRate(b).pct; }
      if (_attrSortState.col === 'group')    {
        const ga = getGroupsForAttr(a)[0];
        const gb = getGroupsForAttr(b)[0];
        va = ga ? ga.name : ''; vb = gb ? gb.name : '';
      }
      if (typeof va === 'string')
        return _attrSortState.dir === 'asc'
          ? va.localeCompare(vb, 'fr') : vb.localeCompare(va, 'fr');
      return _attrSortState.dir === 'asc' ? va - vb : vb - va;
    });
  }

  tbody.innerHTML = '';
  list.forEach(a => {
    const fill  = attrFillRate(a);
    const tr    = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:600">
        <button class="cell-link" onclick="editAttribute(${a.id})"
          title="${canEditAttr(a) ? 'Ouvrir et modifier' : 'Consulter'}">${escapeHtml(a.name)}</button>
        ${a.system ? systemLockBadge('attr') : ''}
        ${calcBadgeHtml(a)}
      </td>
      <td><span class="badge badge-grey">${a.type}</span></td>
      <td>${(() => {
        const gs = getGroupsForAttr(a);
        if (!gs.length) return '—';
        return gs.map(g => `<span class="attr-chip"
             style="background:${getGroupColor(g).bg};color:${getGroupColor(g).text};margin:1px 2px 1px 0">
             ${escapeHtml(g.name)}
           </span>`).join('');
      })()}</td>
      <td>${a.required
        ? '<span class="badge-active-on">Oui</span>'
        : '<span class="badge-active-off">Non</span>'}</td>
      <td>${a.inCompletion
        ? '<span class="badge-active-on">Oui</span>'
        : '<span class="badge-active-off">Non</span>'}</td>
      <td style="white-space:nowrap"
        title="${fill.filled} produit(s) renseigne(s) sur ${fill.total} concerne(s)${
          fill.pct === 0 ? ' — attribut candidat a la suppression' : ''}">
        <strong style="color:${fill.pct === 0 ? '#ef5350' : getCompletionColor(fill.pct)}">
          ${fill.pct}%
        </strong>
      </td>
      <td class="td-icon">
        ${(!a.system && canMod('mod_attributes','d'))
          ? `<button class="action-btn-danger btn-trash" title="Supprimer l'attribut"
              aria-label="Supprimer ${escapeHtml(a.name)}"
              onclick="confirmDelete('attr',${a.id},'${a.name.replace(/'/g,"\\'")}')">${TRASH_ICON}</button>`
          : ''}
      </td>`;
    tbody.appendChild(tr);
  });
}

let _attrSortState = { col: null, dir: 'asc' };

function sortAttrsTable(col) {
  if (_attrSortState.col === col) {
    _attrSortState.dir = _attrSortState.dir === 'asc' ? 'desc' : 'asc';
  } else {
    _attrSortState = { col, dir: 'asc' };
  }
  renderAttrsTable();
}

function sortAttrsBy(code) {
  if (attrSortState.code === code) {
    attrSortState.dir = attrSortState.dir === 'asc' ? 'desc' : 'asc';
  } else {
    attrSortState = { code, dir: 'asc' };
  }
  renderAttrsTable();
}

function setAttrClickToOpen(attrId, cb) {
  if (cb.checked) { attributes.forEach(a => { a.clickToOpen = a.id === attrId; }); }
  else { const a = attributes.find(x => x.id === attrId); if (a) a.clickToOpen = false; }
  renderAttrsTable();
  renderProductsTable();
  showNotif(cb.checked
    ? 'Clic actif sur : ' + (attributes.find(x => x.id === attrId) || {}).name
    : 'Option clic desactivee');
}

// ============================================================
// ADMIN — ATTRIBUTS — EDITION
// ============================================================
let editingAttrId = null;

function editAttribute(id) {
  editingAttrId = id;
  const a = attributes.find(x => x.id === id);
  if (!a) return;
  document.getElementById('ea-name').value     = a.name;
  document.getElementById('ea-code').value     = a.code;
  document.getElementById('ea-type').value     = a.type;
  document.getElementById('ea-required').value = a.required ? '1' : '0';
  const compEl = document.getElementById('ea-completion');
  if (compEl) {
    compEl.value = isAutoFilled(a) ? '0' : (a.inCompletion ? '1' : '0');
    compEl.disabled = isAutoFilled(a);
  }
  document.getElementById('ea-formula').value  = a.formula || '';
  const widthEl = document.getElementById('ea-width');
  if (widthEl) widthEl.value = a.width || '';
  const calcEl = document.getElementById('ea-calc');
  if (calcEl) { calcEl.value = (a.calc || a.formula) ? '1' : '0'; calcEl.disabled = !!a.system; }
  onEaCalcChange();
  const maskEl = document.getElementById('ea-mask');
  if (maskEl) maskEl.readOnly = !!a.system;
  const helpEl = document.getElementById('ea-helptext');
  if (helpEl) helpEl.value = a.helpText || '';
  document.getElementById('ea-mask').value     = a.mask || '';
  document.getElementById('ea-maxlength').value = a.maxLength || '';
  document.getElementById('ea-step-enabled').value = a.stepEnabled ? '1' : '0';
  document.getElementById('ea-step').value = a.step ?? '';
  document.getElementById('ea-min').value  = a.min  ?? '';
  document.getElementById('ea-max').value  = a.max  ?? '';
  const decEl = document.getElementById('ea-decimals');
  if (decEl) decEl.value = String(a.decimals === 1 || a.decimals === 2 ? a.decimals : 0);

  // Code technique : lecture seule pour non-admin
  const codeEl = document.getElementById('ea-code');
  if (codeEl) codeEl.readOnly = !isTechAdmin() || !!a.system;
  const typeEl = document.getElementById('ea-type');
  if (typeEl) typeEl.disabled = !!a.system;

  const gSel = document.getElementById('ea-group');
  if (gSel) {
    gSel.innerHTML = '<option value="">-- Choisir --</option>';
    attrGroups.forEach(g => {
      gSel.innerHTML += `<option value="${g.id}"${g.id === a.groupId ? ' selected' : ''}>${g.name}</option>`;
    });
    gSel.disabled = !!a.system;
  }
  const otherWrap = document.getElementById('ea-other-groups');
  if (otherWrap) {
    const extras = getGroupsForAttr(a).filter(g => g.id !== a.groupId);
    otherWrap.innerHTML = extras.length
      ? '<div style="font-size:11px;color:#607080;margin-bottom:4px">Aussi dans :</div>' +
        extras.map(g => `<span class="attr-chip"
          style="background:${getGroupColor(g).bg};color:${getGroupColor(g).text};margin:1px 4px 1px 0">
          ${escapeHtml(g.name)}</span>`).join('')
      : '';
  }
  const optWrap = document.getElementById('ea-options-wrap');
  if (optWrap) {
    optWrap.style.display = (!a.system && (a.type === 'Simple select' || a.type === 'Multi select')) ? '' : 'none';
    document.getElementById('ea-options').value = (a.options || []).join('\n');
  }
  const lenWrap = document.getElementById('ea-maxlength-wrap');
  if (lenWrap) lenWrap.style.display = a.type === 'Texte long' ? '' : 'none';
  const numWrap = document.getElementById('ea-number-wrap');
  if (numWrap) numWrap.style.display = a.type === 'Nombre' ? '' : 'none';
  renderFormulaHelp('ea-formula-help', a.type);
  renderMaskHelp('ea-mask-help', a.type);
  fillShowIfControls('ea', a.code, a.showIfAttr || '', a.showIfValue || '');
  const locked = !canEditAttr(a);
  lockAttrEditor(locked, a.system
    ? 'Attribut systeme : consultation seule.'
    : 'Consultation seule : votre role ne permet pas de modifier les attributs.');
  // Un champ rempli automatiquement ne compte jamais : la case reste grisee
  if (compEl) compEl.disabled = locked || isAutoFilled(a);
  attrFormDirty = false;
  const editPage = document.getElementById('page-admin-attribute-edit');
  // Les listes avec recherche affichent la valeur qui vient d'etre posee
  if (editPage && typeof syncComboFromSelect === 'function') {
    editPage.querySelectorAll('select').forEach(syncComboFromSelect);
  }
  if (editPage) {
    editPage.oninput = locked ? null : function () { attrFormDirty = true; };
    editPage.onchange = locked ? null : function () { attrFormDirty = true; };
  }
  showPage('admin-attribute-edit', null);
}

function canEditAttr(a) {
  return !a.system && canMod('mod_attributes', 'w');
}

function lockAttrEditor(locked, message) {
  const note = document.getElementById('ea-system-note');
  if (note) {
    note.style.display = locked ? '' : 'none';
    if (message) note.textContent = message;
  }
  const save = document.getElementById('ea-save');
  if (save) save.style.display = locked ? 'none' : '';
  const page = document.getElementById('page-admin-attribute-edit');
  if (!page) return;
  page.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.id === 'ea-code') return;
    el.disabled = !!locked;
  });
}

function onEditAttrTypeChange() {
  const type    = document.getElementById('ea-type').value;
  const optWrap = document.getElementById('ea-options-wrap');
  if (optWrap) optWrap.style.display = (type === 'Simple select' || type === 'Multi select') ? '' : 'none';
  const lenWrap = document.getElementById('ea-maxlength-wrap');
  if (lenWrap) lenWrap.style.display = type === 'Texte long' ? '' : 'none';
  const numWrap = document.getElementById('ea-number-wrap');
  if (numWrap) numWrap.style.display = type === 'Nombre' ? '' : 'none';
  renderFormulaHelp('ea-formula-help', type);
  renderMaskHelp('ea-mask-help', type);
}

function refreshConditionalRows(p) {
  if (!p) return;
  document.querySelectorAll('[data-attr-row]').forEach(row => {
    const code = row.getAttribute('data-attr-row');
    const attr = attributes.find(a => a.code === code);
    if (!attr) return;
    const shown = isAttrShown(p, attr);
    row.style.display = shown ? '' : 'none';
    const missing = shown && countsInCompletion(attr)
      && !isCompletionFilled(p, attr);
    row.classList.toggle('field-missing', missing);
  });
  updateDetailCompletion(p);
}

function showIfValueOptions(pilot) {
  if (!pilot) return [];
  if (pilot.type === 'Oui / Non') return ['Oui', 'Non'];
  return pilot.options || [];
}

function fillShowIfControls(prefix, currentCode, showIfAttr, showIfValue) {
  const sel = document.getElementById(prefix + '-show-if');
  const wrap = document.getElementById(prefix + '-show-if-value-wrap');
  const valSel = document.getElementById(prefix + '-show-if-value');
  if (!sel || !wrap || !valSel) return;
  const pilots = attributes.filter(a =>
    a.code !== currentCode && (a.type === 'Simple select' || a.type === 'Oui / Non')
  );
  sel.innerHTML = '<option value="">Toujours affiche</option>' +
    pilots.map(a => `<option value="${a.code}"${a.code === showIfAttr ? ' selected' : ''}>${escapeHtml(a.name)}</option>`).join('');
  onShowIfAttrChange(prefix, showIfValue);
}

function onShowIfAttrChange(prefix, selectedValue) {
  const sel = document.getElementById(prefix + '-show-if');
  const wrap = document.getElementById(prefix + '-show-if-value-wrap');
  const valSel = document.getElementById(prefix + '-show-if-value');
  if (!sel || !wrap || !valSel) return;
  const pilot = attributes.find(a => a.code === sel.value);
  if (!pilot) {
    wrap.style.display = 'none';
    valSel.innerHTML = '';
    return;
  }
  wrap.style.display = '';
  const wanted = selectedValue != null ? selectedValue : valSel.value;
  valSel.innerHTML = showIfValueOptions(pilot).map(o =>
    `<option${o === wanted ? ' selected' : ''}>${escapeHtml(o)}</option>`
  ).join('');
}

function readShowIf(prefix) {
  const sel = document.getElementById(prefix + '-show-if');
  const valSel = document.getElementById(prefix + '-show-if-value');
  if (!sel || !sel.value) return { showIfAttr: '', showIfValue: '' };
  return { showIfAttr: sel.value, showIfValue: valSel ? valSel.value : '' };
}

function onEditAttrTypeChange() {
  const type    = document.getElementById('ea-type').value;
  const optWrap = document.getElementById('ea-options-wrap');
  if (optWrap) optWrap.style.display = (type === 'Simple select' || type === 'Multi select') ? '' : 'none';
  const lenWrap = document.getElementById('ea-maxlength-wrap');
  if (lenWrap) lenWrap.style.display = type === 'Texte long' ? '' : 'none';
  const numWrap = document.getElementById('ea-number-wrap');
  if (numWrap) numWrap.style.display = type === 'Nombre' ? '' : 'none';
  renderFormulaHelp('ea-formula-help', type);
  renderMaskHelp('ea-mask-help', type);
}

function saveAttributeEdit() {
  if (!requirePerm(canMod('mod_attributes', 'w'))) return;
  const a = attributes.find(x => x.id === editingAttrId);
  if (!a) return;
  if (a.system) {
    showNotif('Attribut systeme : modification impossible', 'warn');
    return;
  }
  const newName = document.getElementById('ea-name').value.trim();
  const newCode = (isTechAdmin() && !a.system)
    ? document.getElementById('ea-code').value.trim()
    : a.code; // non-admin et attributs systeme : code fige
  if (!newName || !newCode) { showNotif('Nom et code obligatoires'); return; }
  if (newCode !== a.code && attributes.find(x => x.code === newCode)) {
    showNotif('Code deja utilise par un autre attribut'); return;
  }
  if (typeof calcCommit === 'function') calcCommit(a.code);
  const widthSave = document.getElementById('ea-width');
  if (widthSave) a.width = widthSave.value || undefined;
  const oldCode     = a.code;
  const oldGroupId  = a.groupId;
  const newGroupId  = a.system ? a.groupId : (parseInt(document.getElementById('ea-group').value) || null);
  const newType     = a.system ? a.type : document.getElementById('ea-type').value;
  a.name     = newName;
  a.code     = newCode;
  syntheseItems.forEach(i => {
    if (i.kind === 'attr' && i.code === oldCode) {
      i.code = newCode;
      i.label = newName;
    }
  });
  a.type     = newType;
  a.required = document.getElementById('ea-required').value === '1';
  a.inCompletion = document.getElementById('ea-completion').value === '1';
  const showIf = readShowIf('ea');
  a.showIfAttr = a.system ? '' : showIf.showIfAttr;
  a.showIfValue = a.system ? '' : showIf.showIfValue;
  if (!a.system) {
    const calcOn = document.getElementById('ea-calc').value === '1';
    if (calcOn) { a.calc = true; a.inCompletion = false; }
    else if (a.calc || a.formula) {
      calcTables = calcTables.filter(t => t.attrCode !== a.code);
      a.calc = false; a.formula = ''; a.formulaLabel = '';
    }
    a.mask     = document.getElementById('ea-mask').value.trim();
    a.stepEnabled = document.getElementById('ea-step-enabled').value === '1';
    a.step = numOrNull(document.getElementById('ea-step').value);
    a.min  = numOrNull(document.getElementById('ea-min').value);
    a.max  = numOrNull(document.getElementById('ea-max').value);
    const dec = parseInt(document.getElementById('ea-decimals').value, 10);
    a.decimals = dec === 1 || dec === 2 ? dec : 0;
  }
  const helpSaveEl = document.getElementById('ea-helptext');
  a.helpText = helpSaveEl ? helpSaveEl.value.trim() : (a.helpText || '');
  a.maxLength = parseInt(document.getElementById('ea-maxlength').value) || null;
  if (!a.system) {
    if (newType === 'Simple select' || newType === 'Multi select') {
      a.options = document.getElementById('ea-options').value.split('\n').map(s => s.trim()).filter(Boolean);
    } else { a.options = []; }
  }
  if (oldGroupId !== newGroupId) {
    if (oldGroupId) { const og = getGroupById(oldGroupId); if (og) og.attrIds = og.attrIds.filter(id => id !== a.id); }
    if (newGroupId) { const ng = getGroupById(newGroupId); if (ng && !ng.attrIds.includes(a.id)) ng.attrIds.push(a.id); }
    a.groupId = newGroupId;
  }
  renderAll();
  attrFormDirty = false;
  showPage('admin-attributes', null);
  showNotif('Attribut "' + newName + '" mis a jour');
}

function createNewAttribute() {
  if (!requirePerm(canMod('mod_attributes', 'w'))) return;
  const nameEl    = document.getElementById('new-attr-name');
  const codeEl    = document.getElementById('new-attr-code');
  const typeEl    = document.getElementById('new-attr-type');
  const groupEl   = document.getElementById('new-attr-group');
  const reqEl     = document.getElementById('new-attr-required');
  const compEl    = document.getElementById('new-attr-completion');
  const maskEl    = document.getElementById('new-attr-mask');
  const maxLenEl  = document.getElementById('new-attr-maxlength');
  const stepOnEl  = document.getElementById('new-attr-step-enabled');
  const stepEl    = document.getElementById('new-attr-step');
  const minEl     = document.getElementById('new-attr-min');
  const maxEl     = document.getElementById('new-attr-max');
  const formulaEl = null;
  const calcNewEl = document.getElementById('new-attr-calc');
  const helpEl    = document.getElementById('new-attr-helptext');

  if (!nameEl || !codeEl || !typeEl) {
    showNotif('Erreur : champs introuvables', 'error');
    return;
  }

  const name     = nameEl.value.trim();
  const code     = codeEl.value.trim();
  const type     = typeEl.value;
  const groupId  = groupEl && groupEl.value ? parseInt(groupEl.value) : null;
  const required = reqEl ? reqEl.value === '1' : false;
  const inCompletion = compEl ? compEl.value === '1' : true;
  const mask     = maskEl    ? maskEl.value.trim()    : '';
  const maxLength   = maxLenEl ? (parseInt(maxLenEl.value) || null) : null;
  const stepEnabled = stepOnEl ? stepOnEl.value === '1' : false;
  const step        = stepEl ? numOrNull(stepEl.value) : null;
  const min         = minEl  ? numOrNull(minEl.value)  : null;
  const max         = maxEl  ? numOrNull(maxEl.value)  : null;
  const decEl       = document.getElementById('new-attr-decimals');
  const decimals    = decEl && (decEl.value === '1' || decEl.value === '2') ? parseInt(decEl.value, 10) : 0;
  const formula  = formulaEl ? formulaEl.value.trim() : '';
  const helpText = helpEl ? helpEl.value.trim() : '';

  let valid = true;
  const errName = document.getElementById('err-attr-name');
  const errCode = document.getElementById('err-attr-code');
  if (errName) errName.classList.remove('show');
  if (errCode) errCode.classList.remove('show');
  nameEl.classList.remove('field-error');
  codeEl.classList.remove('field-error');

  if (!name) {
    nameEl.classList.add('field-error');
    if (errName) errName.classList.add('show');
    valid = false;
  }
  if (!code) {
    codeEl.classList.add('field-error');
    if (errCode) errCode.classList.add('show');
    valid = false;
  }
  if (!valid) return;

  if (attributes.find(a => a.code === code)) {
    showNotif('Ce code technique existe deja', 'error');
    codeEl.classList.add('field-error');
    return;
  }

  const newAttr = {
    id:      Math.max(0, ...attributes.map(a => a.id)) + 1,
    name,
    code,
    type,
    groupId,
    required,
    inCompletion,
    mask,
    maxLength,
    stepEnabled,
    step,
    min,
    max,
    decimals,
    formula,
    helpText,
    showIfAttr: readShowIf('new-attr').showIfAttr,
    showIfValue: readShowIf('new-attr').showIfValue,
    // Calcul réglé ensuite dans Administration > Champs calculés
    calc:    !!(calcNewEl && calcNewEl.value === '1'),
    system:  false,
    options: [],
  };
  attributes.push(newAttr);
  nextAttrId = Math.max(nextAttrId, newAttr.id + 1);

  if (groupId) {
    const g = getGroupById(groupId);
    if (g && !g.attrIds.includes(newAttr.id)) g.attrIds.push(newAttr.id);
  }
  products.forEach(p => {
    if (p.fields && !Object.prototype.hasOwnProperty.call(p.fields, code)) p.fields[code] = '';
  });

  nameEl.value  = '';
  codeEl.value  = '';
  typeEl.value  = 'Texte';
  if (compEl)    compEl.value    = '1';
  if (maskEl)    maskEl.value    = '';
  if (maxLenEl)  maxLenEl.value  = '';
  if (stepOnEl)  stepOnEl.value  = '0';
  if (stepEl)    stepEl.value    = '';
  if (minEl)     minEl.value     = '';
  if (maxEl)     maxEl.value     = '';
  if (calcNewEl) calcNewEl.value = '0';
  if (helpEl)    helpEl.value    = '';
  onNewAttrTypeChange();

  closeModal('modal-create-attr');
  renderAll();
  showNotif('Attribut "' + name + '" cree');
}

function onNewAttrTypeChange() {
  const type = (document.getElementById('new-attr-type') || {}).value || '';
  const wrap = document.getElementById('new-attr-formula-wrap');
  if (wrap) wrap.style.display = type === 'Image' ? 'none' : '';
  const lenWrap = document.getElementById('new-attr-maxlength-wrap');
  if (lenWrap) lenWrap.style.display = type === 'Texte long' ? '' : 'none';
  const numWrap = document.getElementById('new-attr-number-wrap');
  if (numWrap) numWrap.style.display = type === 'Nombre' ? '' : 'none';
  renderFormulaHelp('new-attr-formula-help', type);
  renderMaskHelp('new-attr-mask-help', type);
}

// Exemple de formule adapte au type de l'attribut
function formulaExampleFor(type) {
  if (type === 'Nombre')    return '=[prix_catalogue_monture] * 1.2';
  if (type === 'Oui / Non') return '=SI([active_o]=="Actif" OU [active_l]=="Actif")';
  if (type === 'Date')      return 'DATE_MAJ(statut_publication)';
  return 'CONCAT(nom, " - ", sap)';
}

// Operateurs du moteur de formules : libelle court + detail en infobulle
const FORMULA_OPERATORS = [
  { token: 'CONCAT(a, " x ", b)', help: 'Concatene des champs et du texte libre. Le texte libre est entre guillemets doubles, les codes de champs sans guillemets.' },
  { token: '[code]',              help: 'Valeur du champ dont le code technique est indique entre crochets.' },
  { token: '+ - * /',             help: 'Operations arithmetiques sur les champs numeriques. Exemple : =[prix_catalogue_monture] * 1.2' },
  { token: 'SI(condition)',              help: 'Renvoie Oui si la condition est vraie, Non sinon. Exemple : =SI([active_o]=="Actif")' },
  { token: 'SI(cond, siVrai, siFaux)',   help: 'Renvoie siVrai ou siFaux. siFaux peut etre un autre SI. Exemple : =SI([largeur_verres]>=56,"Adulte L","Adulte M")' },
  { token: 'OU / ET',             help: 'Combine plusieurs conditions dans un SI. Exemple : =SI([a]==VRAI OU [b]==VRAI)' },
  { token: '== != > < >= <=',     help: 'Comparaisons utilisables dans un SI.' },
  { token: 'VRAI / FAUX',         help: 'Valeurs booleennes. Un champ Oui / Non vaut VRAI quand il contient Oui.' },
  { token: 'DATE_MAJ(code)',      help: 'Horodate la derniere modification du champ cite. Reserve aux attributs de type Date.' },
  { token: 'MAP(code,"A"="1")',  help: 'Remplace une valeur par une autre, sur un seul champ. Exemple : MAP(optique_solaire,"Optique"="A","Solaire"="B")' },
  { token: 'ROUNDUP(n, 0)',      help: 'Arrondit a l entier superieur, ou au nombre de decimales indique. Exemple : ROUNDUP([prix_base]*[coefficient], 0)' },
  { token: 'RECHERCHE("réf", [champ], "colonne")', help: 'Valeur d’une colonne d’un référentiel, pour la ligne qui correspond au champ. Référentiels : Fournisseurs (Code → Nom, Trigramme), Marques (Marque → Code IWI, Fournisseur). Exemple : RECHERCHE("Fournisseurs",[fournisseur_code],"Trigramme")' },
  { token: 'TABLE()',            help: 'Le champ est calculé par une table du module Champs calculés (conditions sur d\'autres champs, première ligne vraie). La table se crée et se modifie dans ce module, pas ici.' },
];

// Guide des formules, affiche des que le champ Formule est disponible
// Le calcul se règle dans le module Champs calculés : plus d'aide ici
function renderFormulaHelp(targetId) {
  const box = document.getElementById(targetId);
  if (box) { box.style.display = 'none'; box.innerHTML = ''; }
}

function onEaCalcChange() {
  const on = (document.getElementById('ea-calc') || {}).value === '1';
  const btn = document.getElementById('ea-calc-open');
  if (btn) btn.style.display = on && canMod('mod_calc', 'r') ? '' : 'none';
}

// Aide au masque de saisie : infobulle a cote du champ, memes regles que applyInputMask
const MASK_HELP_TITLE =
  'A : une lettre obligatoire, mise en majuscule\n' +
  '9 : un chiffre obligatoire\n' +
  '* : un caractere alphanumerique obligatoire\n' +
  'Tout autre caractere est repris tel quel (tiret, point, espace...)\n' +
  'Exemple : A999999999999 = une lettre suivie de douze chiffres.';

function renderMaskHelp(targetId, type) {
  const box = document.getElementById(targetId);
  if (box) { box.style.display = 'none'; box.innerHTML = ''; }

  const inputId = targetId === 'ea-mask-help' ? 'ea-mask' : 'new-attr-mask';
  const input = document.getElementById(inputId);
  if (!input) return;
  const row = input.closest('.field-row, .form-field');
  const label = row && row.querySelector('.field-label, .form-label');
  if (!label) return;

  let tip = label.querySelector('.mask-help-tip');
  const masquable = type === 'Texte' || type === 'Nombre';
  if (!masquable) {
    if (tip) tip.style.display = 'none';
    return;
  }
  if (!tip) {
    tip = document.createElement('span');
    tip.className = 'mask-help-tip';
    tip.textContent = '?';
    tip.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;' +
      'width:16px;height:16px;margin-left:6px;border-radius:50%;' +
      'background:#e8eef5;color:#1565c0;font-size:11px;font-weight:700;' +
      'cursor:help;vertical-align:middle';
    label.appendChild(tip);
  }
  tip.title = MASK_HELP_TITLE;
  tip.style.display = 'inline-flex';
  input.title = MASK_HELP_TITLE;
}
// ============================================================
// ADMIN — GROUPES D'ATTRIBUTS
// ============================================================
function renderAttrGroupsList() {
  const list = document.getElementById('attr-groups-list');
  if (!list) return;
  list.innerHTML = '';
  attrGroups.forEach(g => {
    const attrs = g.attrIds.map(id => getAttrById(id)).filter(Boolean);
    const color = getGroupColor(g);
    const card  = document.createElement('div');
    card.className      = 'attr-group-card';
    card.dataset.groupId = g.id;
    card.draggable      = true;
    card.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', String(g.id));
      card.classList.add('dragging');
    });
    card.addEventListener('dragend',  () => card.classList.remove('dragging'));
    card.addEventListener('dragover', e => { e.preventDefault(); card.classList.add('drag-over-card'); });
    card.addEventListener('dragleave',() => card.classList.remove('drag-over-card'));
    card.addEventListener('drop', e => {
      e.preventDefault();
      card.classList.remove('drag-over-card');
      const fromId = parseInt(e.dataTransfer.getData('text/plain'));
      const toId   = g.id;
      if (fromId === toId) return;
      const fi = attrGroups.findIndex(x => x.id === fromId);
      const ti = attrGroups.findIndex(x => x.id === toId);
      const [moved] = attrGroups.splice(fi, 1);
      attrGroups.splice(ti, 0, moved);
      renderAttrGroupsList();
      renderProductsTable();
    });
    card.innerHTML = `
      <div class="attr-group-card-header">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="drag-handle" style="cursor:grab;font-size:18px;color:#c0d0e0">&#9776;</span>
          <div class="attr-group-card-title">${g.name}</div>
          ${audienceLabel(g)}
          ${g.system ? systemLockBadge('group') : ''}
          ${g.isBrandGroup
            ? '<span class="attr-group-badge-system" style="background:#fce4ec;color:#880e4f">Marque/Fourn.</span>'
            : ''}
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:12px;color:#a0b0c0">${attrs.length} attribut${attrs.length > 1 ? 's' : ''}</span>
          <button class="action-btn" onclick="editAttrGroup(${g.id})">${canMod('mod_groups','w') ? 'Editer' : 'Voir'}</button>
          ${(!isProtectedGroup(g) && canMod('mod_groups','d'))
            ? `<button class="action-btn-danger btn-trash" title="Supprimer le groupe"
                onclick="confirmDelete('group',${g.id},'${g.name}')">${TRASH_ICON}</button>`
            : ''}
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">
        ${attrs.length
          ? attrs.map(a =>
              `<span class="attr-chip" style="background:${g.isBrandGroup ? '#fce4ec' : color.bg};color:${g.isBrandGroup ? '#880e4f' : color.text}">${a.system ? systemLockIcon() + ' ' : ''}${a.name}</span>`
            ).join('')
          : (g.isBrandGroup
            ? `<span class="attr-chip" style="background:#fce4ec;color:#880e4f">Fournisseur</span>
               <span class="attr-chip" style="background:#fce4ec;color:#880e4f">Marque</span>`
            : '')}
      </div>`;
    list.appendChild(card);
  });
}

function editAttrGroup(id) {
  _grpSel = null;
  editingGroupId = id;
  const g = attrGroups.find(x => x.id === id);
  if (!g) return;
  document.getElementById('edit-group-name').value = g.name;
  document.getElementById('edit-group-code').value = g.code;
  renderAudienceChecks('edit-group-audience', g.audienceGroupIds || []);
  renderGroupAttrToggles(g);
  showPage('admin-group-edit', null);
}

// Contenu d'un groupe : barre d'ajout en haut (attribut ou intertitre),
// puis la liste ordonnée de ce qui s'affiche dans l'onglet.
function renderGroupAttrToggles(g, flashIdx) {
  const list = document.getElementById('group-attr-toggle-list');
  if (!list) return;
  const entries = g.attrIds.map((id, i) => ({ id, i, a: isAttrSection(id) ? null : getAttrById(id) }))
    .filter(e => e.a || isAttrSection(e.id));
  const inGroup = new Set(g.attrIds);
  const others = attributes.filter(a => !inGroup.has(a.id))
    .sort((x, y) => x.name.localeCompare(y.name, 'fr'));
  const nAttrs = entries.filter(e => e.a).length;
  const nSec = entries.length - nAttrs;

  const rows = entries.map(({ id, i, a }) => {
    const drag = `draggable="true" ondragstart="groupAttrDragStart(${i})" ondragover="groupAttrDragOver(event)" ondrop="groupAttrDrop(event,${i})" onclick="selectGroupRow(event,${i})"`;
    const flash = (i === flashIdx ? ' field-flash' : '') + (i === _grpSel ? ' grp-selected' : '');
    if (!a) return `
      <div class="grp-item grp-section${flash}" ${drag}>
        <span class="drag-handle">&#8942;&#8942;</span>
        <input class="field-input group-section-input" value="${escapeHtml(attrSectionTitle(id))}"
          onchange="renameGroupSection(${i},this.value)">
        <button class="action-btn-danger btn-trash" title="Supprimer l'intertitre" onclick="removeGroupSection(${i})">${TRASH_ICON}</button>
      </div>`;
    const locked = a.system && (a.groupId === g.id || (g.isBrandGroup && a.code === 'cat'));
    return `
      <div class="grp-item${flash}" ${drag}>
        <span class="drag-handle">&#8942;&#8942;</span>
        <span class="grp-name">${escapeHtml(a.name)}${a.system ? systemLockBadge('attr') : ''}</span>
        <span class="grp-type">${escapeHtml(a.type)}${a.width ? ' · ' + ({ narrow: 'étroite', normal: 'normale', wide: 'large', full: 'pleine ligne' }[a.width] || '') : ''}</span>
        ${locked ? '<span class="grp-x-spacer"></span>'
          : `<button class="grp-x" title="Retirer du groupe" onclick="toggleGroupAttr(${a.id})">&#10005;</button>`}
      </div>`;
  }).join('');

  list.innerHTML = `
    <div class="grp-add">
      <select class="form-select" id="grp-add-attr" onchange="addAttrToGroup(this.value)">
        <option value="">Ajouter un attribut…</option>
        ${others.map(a => {
          const where = attrGroups.filter(x => x.attrIds.includes(a.id)).map(x => x.name).join(', ');
          return `<option value="${a.id}">${escapeHtml(a.name)}${where ? ' (' + escapeHtml(where) + ')' : ''}</option>`;
        }).join('')}
      </select>
      <button class="btn btn-secondary" onclick="addGroupSection()">+ Intertitre</button>
    </div>
    <div class="grp-head">
      <span>${nAttrs} attribut${nAttrs > 1 ? 's' : ''}${nSec ? ' · ' + nSec + ' intertitre' + (nSec > 1 ? 's' : '') : ''}</span>
      <span class="grp-hint">glisser pour réordonner</span>
    </div>
    <div id="group-attr-order-list">${rows || '<div class="grp-empty">Aucun attribut.</div>'}</div>`;

  if (flashIdx != null) {
    const el = list.querySelector('.field-flash');
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

// Ligne sélectionnée : les ajouts s'insèrent juste après (sinon en fin de liste)
let _grpSel = null;
function selectGroupRow(e, i) {
  if (e.target.closest('input, button')) return;
  const g = attrGroups.find(x => x.id === editingGroupId);
  _grpSel = _grpSel === i ? null : i;
  if (g) renderGroupAttrToggles(g);
}
function insertInGroup(g, item) {
  const at = _grpSel != null && _grpSel < g.attrIds.length ? _grpSel + 1 : g.attrIds.length;
  g.attrIds.splice(at, 0, item);
  _grpSel = at;
  return at;
}

function addAttrToGroup(val) {
  const g = attrGroups.find(x => x.id === editingGroupId);
  const id = parseInt(val, 10);
  if (!g || !id || g.attrIds.includes(id)) return;
  const attr = getAttrById(id);
  const at = insertInGroup(g, id);
  if (g.code === 'conditions_commerciales' && attr) attr.isConditionCommerciale = true;
  renderGroupAttrToggles(g, at);
}

let groupAttrDragIdx = null;

function groupAttrDragStart(i) { groupAttrDragIdx = i; }

function groupAttrDragOver(e) { e.preventDefault(); }

function groupAttrDrop(e, i) {
  e.preventDefault();
  const g = attrGroups.find(x => x.id === editingGroupId);
  if (!g || groupAttrDragIdx === null || groupAttrDragIdx === i) return;
  const moved = g.attrIds.splice(groupAttrDragIdx, 1)[0];
  g.attrIds.splice(i, 0, moved);
  groupAttrDragIdx = null;
  _grpSel = null;
  renderGroupAttrToggles(g);
}

function addGroupSection() {
  const g = attrGroups.find(x => x.id === editingGroupId);
  if (!g) return;
  const at = insertInGroup(g, '§Nouvel intertitre');
  renderGroupAttrToggles(g, at);
  const el = document.querySelector('.grp-item.field-flash .group-section-input');
  if (el) { el.focus(); el.select(); }
}

function renameGroupSection(i, val) {
  const g = attrGroups.find(x => x.id === editingGroupId);
  if (!g || !isAttrSection(g.attrIds[i])) return;
  const t = String(val || '').trim();
  if (t) g.attrIds[i] = '§' + t;
  renderGroupAttrToggles(g);
}

function removeGroupSection(i) {
  const g = attrGroups.find(x => x.id === editingGroupId);
  if (!g || !isAttrSection(g.attrIds[i])) return;
  g.attrIds.splice(i, 1);
  _grpSel = null;
  renderGroupAttrToggles(g);
}

function toggleGroupAttr(attrId) {
  const g = attrGroups.find(x => x.id === editingGroupId);
  if (!g) return;
  const attr = getAttrById(attrId);
  const idx = g.attrIds.indexOf(attrId);
  if (idx >= 0) {
    if (isProtectedAttr(attr) && (attr.groupId === g.id || (g.isBrandGroup && attr.code === 'cat'))) {
      showNotif('Attribut systeme : impossible de le retirer du groupe', 'warn');
      return;
    }
    g.attrIds.splice(idx, 1);
    _grpSel = null;
    if (g.code === 'conditions_commerciales' && attr) attr.isConditionCommerciale = false;
  } else {
    g.attrIds.push(attrId);
    if (g.code === 'conditions_commerciales' && attr) attr.isConditionCommerciale = true;
  }
  renderGroupAttrToggles(g);
}

function filterGroupAttrToggles(v) {
  const q = (v || '').toLowerCase();
  document.querySelectorAll('#group-attr-toggle-list .attr-toggle-row, #group-attr-toggle-list .cat-group-order-item').forEach(r => {
    const name = r.dataset.attrName || '';
    r.style.display = name.includes(q) ? '' : 'none';
  });
}

function saveGroupEdit() {
  if (!requirePerm(canMod('mod_groups', 'w'))) return;
  const g = attrGroups.find(x => x.id === editingGroupId);
  if (!g) return;
  g.name = document.getElementById('edit-group-name').value.trim() || g.name;
  g.code = document.getElementById('edit-group-code').value.trim() || g.code;
  g.audienceGroupIds = readAudienceChecks('edit-group-audience');
  renderAll();
  showPage('admin-groups', null);
  showNotif('Groupe mis a jour');
}

function createAttrGroup() {
  if (!requirePerm(canMod('mod_groups', 'w'))) return;
  const name = document.getElementById('new-group-name').value.trim();
  const code = document.getElementById('new-group-code').value.trim();
  if (!name || !code) { showNotif('Nom et code obligatoires'); return; }
  attrGroups.push({
    id: nextGroupId++, name, code, system: false, isBrandGroup: false, attrIds: [],
    audienceGroupIds: readAudienceChecks('new-group-audience')
  });
  document.getElementById('new-group-name').value = '';
  document.getElementById('new-group-code').value = '';
  closeModal('modal-create-group');
  renderAll();
  showNotif('Groupe "' + name + '" cree');
}

// ============================================================
// ADMIN — ROLES
// ============================================================
function audienceLabel(g) {
  const ids = g.audienceGroupIds || [];
  if (!ids.length) return '';
  const names = ids.map(id => (affectGroups.find(r => r.id === id) || {}).name).filter(Boolean);
  return names.map(n => `<span class="badge badge-grey">${escapeHtml(n)}</span>`).join(' ');
}

function renderAudienceChecks(containerId, selected) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const set = new Set(selected || []);
  el.innerHTML = affectGroups.map(r => `<label style="display:flex;align-items:center;gap:8px;font-size:13px;margin:4px 0">
    <input type="checkbox" value="${r.id}" ${set.has(r.id) ? 'checked' : ''}>
    ${escapeHtml(r.name)}
  </label>`).join('');
}

function readAudienceChecks(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return [];
  return [...el.querySelectorAll('input:checked')].map(i => parseInt(i.value)).filter(n => !isNaN(n));
}

// ============================================================
// ADMIN — UTILISATEURS, GROUPES D'AFFECTATION, NIVEAUX DE DROITS
// Trois onglets. Okta dit qui a quel niveau ; tout le reste se règle ici.
// ============================================================
let _accTab = 'users';
let _onlyUngrouped = false;
let _accSearch = '';
let _accLevelFilter = '';
let _accGroupSel = null;

function setAccTab(t) { _accTab = t; renderRoles(); }

function renderRoles() {
  const page = document.getElementById('roles-grid');
  if (!page) return;
  page.style.display = 'block';
  const ungrouped = users.filter(u => !u.groupId && u.levelKey !== 'admin');
  const tabs = [
    { key: 'users',  label: 'Utilisateurs', badge: ungrouped.length ? `<span class="acc-nogroup" style="margin-left:6px">${ungrouped.length} sans groupe</span>` : '' },
    { key: 'groups', label: 'Groupes d’affectation', badge: `<span class="calc-meta" style="margin-left:6px">${affectGroups.length}</span>` },
    { key: 'levels', label: 'Niveaux de droits', badge: '' },
  ];
  const bar = `<div class="product-tabs-bar acc-tabs">${tabs.map(t =>
    `<div class="tab${_accTab === t.key ? ' active' : ''}" onclick="setAccTab('${t.key}')">${t.label}${t.badge}</div>`).join('')}</div>`;
  const body = _accTab === 'groups' ? renderAccGroups() : _accTab === 'levels' ? renderAccLevels() : renderAccUsers(ungrouped);
  page.innerHTML = bar + `<div class="acc-tab-body">${body}</div>`;
}

// ---------- Onglet Utilisateurs ----------
function renderAccUsers(ungrouped) {
  const canW = canMod('mod_roles', 'w');
  const q = _accSearch.trim().toLowerCase();
  const shown = users.filter(u =>
    (!_onlyUngrouped || (!u.groupId && u.levelKey !== 'admin')) &&
    (!_accLevelFilter || u.levelKey === _accLevelFilter) &&
    (!q || u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)));
  const rows = shown.map(u => {
    const l = accessLevel(u.levelKey);
    const isAdm = u.levelKey === 'admin';
    const groupCell = isAdm
      ? '<span class="calc-meta">—</span>'
      : canW
        ? `<select class="form-select" data-combo="off" onchange="setUserGroup(${u.id},this.value)">
            <option value=""${!u.groupId ? ' selected' : ''}>— Aucun groupe —</option>
            ${affectGroups.map(g => `<option value="${g.id}"${g.id === u.groupId ? ' selected' : ''}>${escapeHtml(g.name)}</option>`).join('')}
          </select>`
        : escapeHtml((affectGroupOf(u) || {}).name || '—');
    const noGroup = !u.groupId && !isAdm;
    return `<tr class="${noGroup ? 'acc-row-nogroup' : ''}">
      <td style="width:40px"><span class="account-dropdown-avatar" style="background:${u.color || '#1565c0'}">${u.initials}</span></td>
      <td><div style="font-weight:600">${escapeHtml(u.name)}</div><div class="calc-meta">${escapeHtml(u.email || '')}</div></td>
      <td><span class="badge badge-grey" title="Donné par le groupe Okta ${escapeHtml(l.okta)}">${escapeHtml(l.name)}</span></td>
      <td style="min-width:220px">${groupCell}
        ${noGroup ? `<div style="margin-top:4px"><span class="acc-nogroup">Sans groupe : voit tout</span></div>` : ''}</td>
      <td class="calc-meta">${escapeHtml(u.lastLogin || '—')}</td>
    </tr>`;
  }).join('');
  return `
    <div class="acc-toolbar">
      <input class="field-input" style="max-width:240px" placeholder="Rechercher un nom ou un e-mail" value="${escapeHtml(_accSearch)}"
        oninput="_accSearch=this.value;renderRoles();const i=document.querySelector('.acc-toolbar input');i.focus();i.setSelectionRange(i.value.length,i.value.length)">
      <select class="form-select" data-combo="off" style="max-width:200px" onchange="_accLevelFilter=this.value;renderRoles()">
        <option value="">Tous les niveaux</option>
        ${ACCESS_LEVELS.map(l => `<option value="${l.key}"${_accLevelFilter === l.key ? ' selected' : ''}>${l.name}</option>`).join('')}
      </select>
      <label class="acc-check"><input type="checkbox" ${_onlyUngrouped ? 'checked' : ''} onchange="_onlyUngrouped=this.checked;renderRoles()">
        Sans groupe uniquement ${ungrouped.length ? `<span class="acc-nogroup">${ungrouped.length}</span>` : ''}</label>
    </div>
    <div class="table-container"><table>
      <thead><tr><th></th><th>Nom</th><th>Niveau (Okta)</th><th>Groupe d’affectation</th><th>Dernière connexion</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" style="color:#a0b0c0">Personne.</td></tr>'}</tbody>
    </table></div>`;
}

// ---------- Onglet Groupes ----------
function accNames(list, ids, keyName) {
  if (!ids || !ids.length) return '<span class="calc-meta">aucun</span>';
  return ids.map(id => (list.find(x => x[keyName] === id) || {})).filter(x => x.name || x.label)
    .map(x => escapeHtml(x.name || x.label)).join(', ');
}

function renderAccGroups() {
  const canW = canMod('mod_roles', 'w');
  const canD = canMod('mod_roles', 'd');
  if (_accGroupSel && !affectGroups.some(g => g.id === _accGroupSel)) _accGroupSel = null;
  const rows = affectGroups.map(g => {
    const n = users.filter(u => u.groupId === g.id).length;
    return `<tr class="acc-group-row${_accGroupSel === g.id ? ' row-selected' : ''}" onclick="_accGroupSel=${_accGroupSel === g.id ? 'null' : g.id};renderRoles()">
      <td style="font-weight:600">${escapeHtml(g.name)}</td>
      <td>${n}</td>
      <td>${g.catIds.length === categories.length ? 'Toutes' : accNames(categories, g.catIds, 'id')}</td>
      <td>${accNames(NAV_MENUS, g.menuKeys, 'key')}</td>
      <td>${accNames(ADMIN_MODULES, g.modKeys, 'key')}</td>
      <td style="white-space:nowrap" onclick="event.stopPropagation()">
        <button class="btn btn-secondary" style="padding:3px 10px" onclick="_accGroupSel=${g.id};renderRoles()">${canW ? 'Régler' : 'Voir'}</button>
        ${canD ? `<button class="action-btn-danger btn-trash" title="Supprimer le groupe" onclick="deleteAffectGroup(${g.id})">${TRASH_ICON}</button>` : ''}
      </td>
    </tr>`;
  }).join('');

  let editor = '';
  const g = affectGroups.find(x => x.id === _accGroupSel);
  if (g) {
    const chk = (list, key, label) => `<label class="wf-group-chip${(g[list] || []).includes(key) ? ' on' : ''}">
        <input type="checkbox" ${(g[list] || []).includes(key) ? 'checked' : ''} ${canW ? '' : 'disabled'}
          onchange="toggleAffectVis(${g.id},'${list}',${typeof key === 'number' ? key : `'${key}'`},this.checked)"> ${escapeHtml(label)}</label>`;
    const members = users.filter(u => u.groupId === g.id);
    editor = `<div class="table-container acc-group">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        ${canW ? `<input class="field-input" style="max-width:260px;font-weight:700" value="${escapeHtml(g.name)}" onchange="renameAffectGroup(${g.id},this.value)">`
               : `<b>${escapeHtml(g.name)}</b>`}
        <span class="calc-meta">${members.length} membre${members.length > 1 ? 's' : ''}${members.length ? ' : ' + members.map(u => escapeHtml(u.name)).join(', ') : ''}</span>
        <span style="flex:1"></span>
        <button class="btn btn-secondary" style="padding:3px 10px" onclick="_accGroupSel=null;renderRoles()">Fermer</button>
      </div>
      <div class="acc-vis-title">Catégories visibles</div>
      <div class="wf-group-chips">${categories.map(c => chk('catIds', c.id, c.name)).join('')}</div>
      <div class="acc-vis-title">Menus visibles</div>
      <div class="wf-group-chips">${NAV_MENUS.map(m => chk('menuKeys', m.key, m.label)).join('')}</div>
      <div class="acc-vis-title">Modules d’administration ouverts</div>
      <div class="wf-group-chips">${ADMIN_MODULES.filter(m => m.key !== 'mod_roles').map(m => chk('modKeys', m.key, m.label)).join('')}</div>
    </div>`;
  }

  return `
    <div class="acc-toolbar">
      ${canW ? `<button class="btn btn-primary" style="margin-left:auto" onclick="addAffectGroup()">+ Groupe</button>` : ''}
    </div>
    <div class="table-container" style="margin-bottom:14px"><table>
      <thead><tr><th>Groupe</th><th>Membres</th><th>Catégories</th><th>Menus</th><th>Modules ouverts</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="color:#a0b0c0">Aucun groupe : tout le monde voit tout.</td></tr>'}</tbody>
    </table></div>
    ${editor}`;
}

// ---------- Onglet Niveaux de droits ----------
function renderAccLevels() {
  const canW = canMod('mod_roles', 'w');
  const head = ACCESS_LEVELS.map(l => {
    const n = users.filter(u => u.levelKey === l.key).length;
    return `<th style="text-align:center;min-width:130px">${escapeHtml(l.name)}
      <div class="calc-meta" style="font-weight:400">${escapeHtml(l.okta)}</div>
      <div class="acc-level-count" style="font-weight:400">${n} personne${n > 1 ? 's' : ''}</div></th>`;
  }).join('');
  const cell = (l, r) => {
    if (l.key === 'admin') return `<td style="text-align:center"><input type="checkbox" checked disabled></td>`;
    return `<td style="text-align:center"><input type="checkbox" ${levelCan(l.key, r.key) ? 'checked' : ''} ${canW ? '' : 'disabled'}
      onchange="toggleLevelRight('${l.key}','${r.key}',this.checked)"></td>`;
  };
  const fixed = (label, vals) => `<tr class="acc-fixed"><td>${label}</td>${vals.map(v =>
    `<td style="text-align:center"><input type="checkbox" ${v ? 'checked' : ''} disabled></td>`).join('')}</tr>`;
  const rows = LEVEL_RIGHT_DEFS.map(r => `<tr><td>${escapeHtml(r.label)}</td>${ACCESS_LEVELS.map(l => cell(l, r)).join('')}</tr>`).join('')
    + fixed('Gérer les utilisateurs, les groupes et les niveaux', [1, 0, 0, 0]);
  return `
    <div class="table-container"><table class="acc-matrix">
      <thead><tr><th>Droit</th>${head}</tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

function toggleLevelRight(levelKey, right, on) {
  if (!requirePerm(canMod('mod_roles', 'w'))) return;
  if (!levelRights[levelKey]) return;
  levelRights[levelKey][right] = !!on;
  const l = accessLevel(levelKey);
  const r = LEVEL_RIGHT_DEFS.find(x => x.key === right);
  showNotif(l.name + ' : ' + (r ? r.label.toLowerCase() : right) + (on ? ' autorisé' : ' retiré'));
  afterAccessChange();
}

function afterAccessChange() {
  renderRoles();
  renderAdminHome();
  applyAccessControl();
  refreshAccountMenu();
  const active = document.querySelector('.page.active');
  if (active && !canOpenPage(active.id.replace('page-', ''))) goToDefaultPage();
}

function setUserGroup(userId, val) {
  if (!requirePerm(canMod('mod_roles', 'w'))) return;
  const u = users.find(x => x.id === userId);
  if (!u) return;
  u.groupId = val ? parseInt(val, 10) : null;
  showNotif(u.name + ' : ' + (affectGroupOf(u) ? 'groupe ' + affectGroupOf(u).name : 'sans groupe, voit tout'));
  afterAccessChange();
}

function toggleAffectVis(groupId, list, key, on) {
  if (!requirePerm(canMod('mod_roles', 'w'))) return;
  const g = affectGroups.find(x => x.id === groupId);
  if (!g) return;
  const s = new Set(g[list] || []);
  if (on) s.add(key); else s.delete(key);
  g[list] = [...s];
  afterAccessChange();
}

function renameAffectGroup(groupId, name) {
  if (!requirePerm(canMod('mod_roles', 'w'))) return;
  const g = affectGroups.find(x => x.id === groupId);
  const t = String(name || '').trim();
  if (!g || !t) { renderRoles(); return; }
  g.name = t;
  afterAccessChange();
}

function addAffectGroup() {
  if (!requirePerm(canMod('mod_roles', 'w'))) return;
  _accGroupSel = nextAffectGroupId;
  affectGroups.push({ id: nextAffectGroupId++, name: 'Nouveau groupe', catIds: [],
    menuKeys: ['menu_dashboard', 'menu_products', 'menu_exports'], modKeys: [] });
  afterAccessChange();
}

function deleteAffectGroup(groupId) {
  if (!requirePerm(canMod('mod_roles', 'd'))) return;
  const g = affectGroups.find(x => x.id === groupId);
  if (!g) return;
  const n = users.filter(u => u.groupId === groupId).length;
  if (!confirm('Supprimer le groupe « ' + g.name + ' » ?' + (n ? ' Ses ' + n + ' membres n\'auront plus de groupe et verront tout.' : ''))) return;
  users.forEach(u => { if (u.groupId === groupId) u.groupId = null; });
  affectGroups = affectGroups.filter(x => x.id !== groupId);
  attrGroups.forEach(ag => { ag.audienceGroupIds = (ag.audienceGroupIds || []).filter(id => id !== groupId); });
  afterAccessChange();
}


function renderBrandInfoPanel(brandInfo) {
  if (!brandInfo) {
    return `<div class="field-group-title">Conditions commerciales</div>
      <div style="color:#a0b0c0;font-size:13px;padding:8px">
        Selectionnez un fournisseur et une marque pour afficher les conditions.
      </div>`;
  }
  const skip = new Set(['fournisseur_code', 'marque', 'cat', 'segmentation']);
  const rows = getConditionAttrs()
    .filter(a => !skip.has(a.code))
    .map(a => ({ label: a.name, val: getBrandSettingAttrValue(brandInfo, a) || '—' }));
  if (!rows.length) {
    rows.push({ label: 'Fournisseur', val: brandInfo.sup || '—' });
  }
  let html = `<div class="field-group-title">Conditions — ${escapeHtml(brandInfo.marque || '')}</div>`;
  rows.forEach(r => {
    html += `<div class="field-row" style="display:flex;justify-content:space-between;
      align-items:center;padding:5px 0;border-bottom:1px solid #f0f4f8">
      <div class="field-label" style="margin:0;flex:1">${escapeHtml(r.label)}</div>
      <div style="font-size:13px;color:#1a2332;text-align:right">${escapeHtml(r.val)}</div>
    </div>`;
  });
  return html;
}
// ============================================================
// ADMIN — PRODUITS (creation via products.js)
// ============================================================
function confirmDelete(type, id, name) {
  if (type === 'product') {
    const p = products.find(x => x.id === id);
    if (!requirePerm(canDeleteProduct(p), 'Suppression produit non autorisee')) return;
  } else if (type === 'cat') {
    if (!requirePerm(canMod('mod_categories', 'd'), 'Suppression categorie non autorisee')) return;
  } else if (type === 'attr') {
    if (!requirePerm(canMod('mod_attributes', 'd'), 'Suppression attribut non autorisee')) return;
    const a = attributes.find(x => x.id === id);
    if (isProtectedAttr(a)) {
      showNotif('Attribut systeme : suppression impossible', 'warn');
      return;
    }
  } else if (type === 'group') {
    if (!requirePerm(canMod('mod_groups', 'd'), 'Suppression groupe non autorisee')) return;
    const g = attrGroups.find(x => x.id === id);
    if (isProtectedGroup(g)) {
      showNotif('Groupe systeme : suppression impossible', 'warn');
      return;
    }
  } else if (type === 'brand' || type === 'supplier') {
    if (!requirePerm(canMod('mod_conditions', 'd'), 'Suppression non autorisee')) return;
  }
  pendingDelete = { type, id };
  document.getElementById('confirm-delete-text').textContent = 'Supprimer "' + name + '" ?';
  document.getElementById('confirm-delete-btn').onclick = executeDelete;
  openModal('modal-confirm-delete');
}

function executeDelete() {
  if (!pendingDelete) return;
  if (pendingDelete.type === 'cat')
    categories = categories.filter(c => c.id !== pendingDelete.id);
  else if (pendingDelete.type === 'attr') {
    const deleted = attributes.find(a => a.id === pendingDelete.id);
    if (isProtectedAttr(deleted)) {
      closeModal('modal-confirm-delete');
      showNotif('Attribut systeme : suppression impossible', 'warn');
      pendingDelete = null;
      return;
    }
    const deletedCode = deleted ? deleted.code : null;
    attributes  = attributes.filter(a => a.id !== pendingDelete.id);
    attrGroups.forEach(g => { g.attrIds = g.attrIds.filter(id => id !== pendingDelete.id); });
    if (deletedCode) syntheseItems = syntheseItems.filter(i => !(i.kind === 'attr' && i.code === deletedCode));
  }
  else if (pendingDelete.type === 'product')
    products = products.filter(p => p.id !== pendingDelete.id);
  else if (pendingDelete.type === 'group') {
    const gDel = attrGroups.find(g => g.id === pendingDelete.id);
    if (isProtectedGroup(gDel)) {
      closeModal('modal-confirm-delete');
      showNotif('Groupe systeme : suppression impossible', 'warn');
      pendingDelete = null;
      return;
    }
    attrGroups = attrGroups.filter(g => g.id !== pendingDelete.id);
    categories.forEach(c => { c.groupIds = c.groupIds.filter(id => id !== pendingDelete.id); });
  }
  else if (pendingDelete.type === 'brand')
    brandSettings = brandSettings.filter((_, i) => i !== pendingDelete.id);
  else if (pendingDelete.type === 'supplier') {
    suppliers     = suppliers.filter(s => s.code !== pendingDelete.id);
    brandSettings = brandSettings.filter(b => b.fournisseurCode !== pendingDelete.id);
  }
  closeModal('modal-confirm-delete');
  renderAll();
  showNotif('Element supprime');
  pendingDelete = null;
}

// ============================================================
// ADMIN — PREFERENCES
// ============================================================
function renderPrefsPage() {
  const page = document.getElementById('page-admin-prefs');
  if (!page) return;
  page.innerHTML = `
    <div style="margin-bottom:16px">
      <button class="btn btn-secondary" onclick="showPage('admin',null)">&larr; Administration</button>
    </div>
    <div style="background:#fff;border-radius:12px;padding:28px;box-shadow:0 1px 6px rgba(0,0,0,0.07);max-width:560px">
      <div style="font-size:15px;font-weight:700;color:#1a2332;margin-bottom:20px">Preferences application</div>

      <div class="field-row" style="margin-bottom:20px">
        <div class="field-label" style="margin-bottom:6px">Nombre de produits par page</div>
        <div style="display:flex;gap:10px;align-items:center">
          <select class="field-input form-select" id="pref-page-size" style="width:120px">
            ${[25, 50, 100].map(n => `<option value="${n}" ${Number(appPrefs.pageSize) === n ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
          <span style="font-size:12px;color:#a0b0c0">produits / page</span>
        </div>
      </div>

      <div class="field-row" style="margin-bottom:24px">
        <div class="field-label" style="margin-bottom:6px">Seuil de completion</div>
        <div style="display:flex;gap:10px;align-items:center">
          <input type="number" class="field-input" id="pref-seuil"
            value="${seuilCompletion}" min="0" max="100" step="5"
            style="width:120px" onwheel="event.preventDefault();this.blur()">
          <span style="font-size:12px;color:#a0b0c0">%</span>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px">
        <button class="btn btn-secondary" onclick="showPage('admin',null)">Annuler</button>
        <button class="btn btn-primary" onclick="savePrefs()">Enregistrer</button>
      </div>
    </div>`;
}

function savePrefs() {
  if (!requirePerm(canMod('mod_prefs', 'w'))) return;
  const ps = parseInt(document.getElementById('pref-page-size').value);
  const sc = parseInt(document.getElementById('pref-seuil').value);
  if (ps === 25 || ps === 50 || ps === 100) { appPrefs.pageSize = ps; currentPage = 1; }
  if (!isNaN(sc) && sc >= 0 && sc <= 100) seuilCompletion = sc;
  showPage('admin', null);
  renderAll();
  showNotif('Preferences enregistrees');
}

// ============================================================
// ADMIN — MARQUES / FOURNISSEURS
// ============================================================
let editingBrandIdx = null;

function catBadgeHtml(typeName) {
  const cat = categories.find(c => c.name === typeName);
  if (!cat) return `<span class="badge badge-grey" style="font-size:11px">${typeName || '—'}</span>`;
  return `<span class="badge" style="font-size:11px;background:${cat.color}22;color:${cat.color};border:1px solid ${cat.color}55">${typeName}</span>`;
}

function getBrandSettingsFilteredList() {
  const searchVal = (document.getElementById('brand-settings-search') || {}).value || '';
  const q = searchVal.toLowerCase();
  const condAttrs = getConditionAttrs();

  let list = brandSettings.map((b, i) => {
    const sup = suppliers.find(s => s.code === b.fournisseurCode);
    return { i, b, supName: sup ? sup.name : b.fournisseurCode, trigram: sup ? (sup.trigram || '') : '' };
  });

  if (q) {
    list = list.filter(x =>
      condAttrs.some(a => getBrandSettingAttrValue(x.b, a).toLowerCase().includes(q)) ||
      (x.b.fournisseurCode || '').toLowerCase().includes(q) ||
      (x.supName || '').toLowerCase().includes(q) ||
      (x.trigram || '').toLowerCase().includes(q)
    );
  }

  for (const code in brandColFilters) {
    const allowed = brandColFilters[code];
    const attr = attributes.find(a => a.code === code);
    list = list.filter(x => allowed.has(getBrandSettingAttrValue(x.b, attr || { code }).toString().trim()));
  }

  if (_brandSortState.col) {
    const attr = attributes.find(a => a.code === _brandSortState.col);
    list.sort((a, b) => {
      const va = getBrandSettingSortValue(a.b, attr || { code: _brandSortState.col });
      const vb = getBrandSettingSortValue(b.b, attr || { code: _brandSortState.col });
      if (typeof va === 'number' && typeof vb === 'number')
        return _brandSortState.dir === 'asc' ? va - vb : vb - va;
      return _brandSortState.dir === 'asc'
        ? String(va).localeCompare(String(vb), 'fr')
        : String(vb).localeCompare(String(va), 'fr');
    });
  }
  return { list, q, condAttrs };
}

function brandSettingsRowsHtml(list, q, condAttrs) {
  const attrs = condAttrs || getConditionAttrs();
  const colCount = attrs.length + 1 + (attrs.some(a => a.code === 'fournisseur_code') ? 2 : 0);
  let rows = '';
  list.forEach(x => {
    const cells = attrs.map(a => {
      const raw = getBrandSettingAttrValue(x.b, a);
      if (a.code === 'cat' && x.b.type) {
        const cat = categories.find(c => c.name === x.b.type);
        return cat
          ? `<td><span class="badge" style="background:${cat.color}22;color:${cat.color};
               border:1px solid ${cat.color}55;padding:2px 8px;border-radius:4px;
               font-size:11px;font-weight:600">${escapeHtml(x.b.type)}</span></td>`
          : `<td>${escapeHtml(raw) || '—'}</td>`;
      }
      if (a.code === 'repriseEchange' || a.type === 'Oui / Non') {
        return `<td>${raw === 'Oui'
          ? '<span class="badge-active-on">Oui</span>'
          : '<span class="badge-active-off">Non</span>'}</td>`;
      }
      if (a.code === 'remiseEnseigne')
        return `<td><strong style="color:#1565c0">${raw || '—'}</strong></td>`;
      if (a.code === 'fournisseur_code') {
        const code = getBrandSettingAttrValue(x.b, { code: '_supplierCode' });
        const tri = getBrandSettingAttrValue(x.b, { code: '_supplierTrigram' });
        return `<td style="white-space:nowrap">${raw ? escapeHtml(raw) : '—'}</td>`
          + `<td style="white-space:nowrap;font-family:monospace">${code ? escapeHtml(code) : '—'}</td>`
          + `<td style="white-space:nowrap;font-family:monospace">${tri ? escapeHtml(tri) : '—'}</td>`;
      }
      return `<td style="white-space:nowrap">${raw ? escapeHtml(raw) : '—'}</td>`;
    }).join('');

    rows += `<tr>
      ${cells}
      <td>
        <div class="td-actions">
          <button class="action-btn"
            onclick="editBrandSetting(${x.i})">${canMod('mod_conditions','w') ? 'Modifier' : 'Voir'}</button>
          ${canMod('mod_conditions','d')
            ? `<button class="action-btn-danger btn-trash" title="Supprimer"
            onclick="confirmDelete('brand',${x.i},'${(x.b.marque || '').replace(/'/g, "\\'")}')">${TRASH_ICON}</button>` : ''}
        </div>
      </td>
    </tr>`;
  });

  if (!rows) {
    rows = `<tr><td colspan="${colCount}" style="text-align:center;color:#a0b0c0;padding:24px">
      Aucune condition commerciale${q ? ' pour cette recherche' : ''}.
    </td></tr>`;
  }
  return rows;
}

function fillBrandSettingsTbody() {
  const tbody = document.getElementById('brand-settings-tbody');
  if (!tbody) { renderSuppliersPage(); return; }
  const { list, q, condAttrs } = getBrandSettingsFilteredList();
  tbody.innerHTML = brandSettingsRowsHtml(list, q, condAttrs);
}

function makeBrandSortFilterTh(attr) {
  const isFiltered = !!brandColFilters[attr.code];
  return `<th class="th-sortable" style="white-space:nowrap;min-width:120px">
    <div style="display:flex;align-items:center;gap:4px;white-space:nowrap">
      <span class="sort-btn" onclick="sortBrandSettingsTable('${attr.code}')" title="Trier"
        style="cursor:pointer;font-size:13px;color:#8a9bb0">&#8645;</span>
      <span onclick="sortBrandSettingsTable('${attr.code}')" style="cursor:pointer;flex:1">${escapeHtml(attr.name)}</span>
      <span class="th-filter-icon${isFiltered ? ' filter-active' : ''}"
        title="Filtrer" onclick="openBrandColFilter('${attr.code}','${escapeHtml(attr.name)}',this)">&#9663;</span>
    </div>
  </th>`;
}

function renderSuppliersPage() {
  const page = document.getElementById('page-admin-suppliers');
  if (!page) return;

  const searchVal = (document.getElementById('brand-settings-search') || {}).value || '';
  const condGroup = getConditionGroup();
  const condAttrs = getConditionAttrs();

  page.innerHTML = `
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <button class="btn btn-secondary"
        onclick="showPage('admin',null)">&larr; Administration</button>
      <span style="font-size:15px;font-weight:700;color:#1a2332">
        Conditions commerciales
      </span>
      <input class="field-input" id="brand-settings-search"
        placeholder="Rechercher un fournisseur, une marque..."
        value="${escapeHtml(searchVal)}"
        oninput="fillBrandSettingsTbody()"
        style="flex:1;min-width:220px;max-width:340px">
      <div style="flex:1"></div>
      ${condGroup && canMod('mod_groups', 'w')
        ? `<button class="btn btn-secondary"
             onclick="editAttrGroup(${condGroup.id})">Modifier la structure</button>`
        : ''}
      ${canMod('mod_conditions', 'w')
        ? `<button class="btn btn-secondary"
        onclick="openCreateSupplierModal()">+ Fournisseur</button>
      <button class="btn btn-primary"
        onclick="openCreateBrandModal()">+ Nouvelle condition commerciale</button>`
        : ''}
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            ${condAttrs.map(a => makeBrandSortFilterTh(a) + (a.code === 'fournisseur_code'
              ? makeBrandSortFilterTh({ code: '_supplierCode', name: 'Code fournisseur' })
                + makeBrandSortFilterTh({ code: '_supplierTrigram', name: 'Trigramme' })
              : '')).join('')}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="brand-settings-tbody"></tbody>
      </table>
    </div>`;
  fillBrandSettingsTbody();
}

let _brandSortState = { col: null, dir: 'asc' };
let brandColFilters = {};

function sortBrandSettingsTable(col) {
  if (_brandSortState.col === col) {
    _brandSortState.dir = _brandSortState.dir === 'asc' ? 'desc' : 'asc';
  } else {
    _brandSortState = { col, dir: 'asc' };
  }
  fillBrandSettingsTbody();
}

function getBrandColUniqueValues(code) {
  const attr = attributes.find(a => a.code === code) || { code };
  const vals = new Set();
  brandSettings.forEach(b => {
    const v = getBrandSettingAttrValue(b, attr).toString().trim();
    if (v && v !== '—') vals.add(v);
  });
  return [...vals].sort((a, b) => a.localeCompare(b, 'fr'));
}

function openBrandColFilter(code, label, iconEl) {
  document.removeEventListener('click', colFilterOutsideClick);
  if (activeColFilterDropdown) { activeColFilterDropdown.remove(); activeColFilterDropdown = null; }
  const vals   = getBrandColUniqueValues(code);
  const active = brandColFilters[code] || null;
  const rect   = iconEl.getBoundingClientRect();
  const dd     = document.createElement('div');
  dd.className = 'col-filter-dropdown';
  dd.style.top  = (rect.bottom + 4) + 'px';
  dd.style.left = Math.min(rect.left, window.innerWidth - 270) + 'px';
  let itemsHtml = '';
  if (!vals.length) {
    itemsHtml = '<div class="col-filter-empty">Aucune valeur disponible</div>';
  } else {
    const allChecked = !active || active.size === 0;
    itemsHtml += `<div class="col-filter-item">
      <input type="checkbox" id="bcfa-${code}" ${allChecked ? 'checked' : ''}
        onchange="toggleBrandColFilterAll('${code}',this)">
      <label for="bcfa-${code}" style="font-weight:600">Tout selectionner</label>
    </div>`;
    vals.forEach((v, i) => {
      const checked = !active || active.has(v);
      itemsHtml += `<div class="col-filter-item col-filter-val-item" data-val="${escapeHtml(v)}">
        <input type="checkbox" id="bcfv-${code}-${i}" ${checked ? 'checked' : ''}
          onchange="toggleBrandColFilterVal('${code}',this)">
        <label for="bcfv-${code}-${i}">${escapeHtml(v)}</label>
      </div>`;
    });
  }
  dd.innerHTML = `
    <div class="col-filter-dropdown-header">
      <span>${escapeHtml(label)}</span>
      <button onclick="clearBrandColFilter('${code}')">Effacer</button>
    </div>
    <div class="col-filter-search-wrap">
      <input type="text" class="col-filter-search" placeholder="Rechercher..."
        oninput="filterColFilterList(this)">
    </div>
    <div class="col-filter-list">${itemsHtml}</div>`;
  document.body.appendChild(dd);
  activeColFilterDropdown = dd;
  setTimeout(() => document.addEventListener('click', colFilterOutsideClick), 0);
}

function toggleBrandColFilterVal(code, cb) {
  const item = cb.closest('.col-filter-val-item');
  const val = item ? item.getAttribute('data-val') : '';
  const vals = getBrandColUniqueValues(code);
  if (!brandColFilters[code]) brandColFilters[code] = new Set(vals);
  if (cb.checked) brandColFilters[code].add(val);
  else brandColFilters[code].delete(val);
  fillBrandSettingsTbody();
}

function toggleBrandColFilterAll(code, cb) {
  if (cb.checked) delete brandColFilters[code];
  else brandColFilters[code] = new Set();
  if (activeColFilterDropdown)
    activeColFilterDropdown.querySelectorAll('.col-filter-val-item input')
      .forEach(c => { c.checked = cb.checked; });
  fillBrandSettingsTbody();
}

function clearBrandColFilter(code) {
  delete brandColFilters[code];
  if (activeColFilterDropdown) { activeColFilterDropdown.remove(); activeColFilterDropdown = null; }
  renderSuppliersPage();
}

function openCreateSupplierModal() {
  if (!requirePerm(canMod('mod_conditions', 'w'))) return;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:420px;width:100%">
      <div class="modal-title">Nouveau fournisseur</div>
      <div class="form-grid">
        <div class="form-field">
          <div class="form-label">Code *</div>
          <input class="field-input" id="ns-code" placeholder="ex: R00999"
            style="font-family:monospace">
        </div>
        <div class="form-field">
          <div class="form-label">Nom *</div>
          <input class="field-input" id="ns-name" placeholder="ex: ESSILOR">
        </div>
        <div class="form-field">
          <div class="form-label">Trigramme</div>
          <input class="field-input" id="ns-trigram" maxlength="3" placeholder="ex: ESS"
            style="font-family:monospace;text-transform:uppercase">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary"
          onclick="this.closest('.modal-overlay').remove()">Annuler</button>
        <button class="btn btn-primary" onclick="createSupplier(this)">Creer</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function createSupplier(btn) {
  if (!requirePerm(canMod('mod_conditions', 'w'))) return;
  const code = (document.getElementById('ns-code').value || '').trim().toUpperCase();
  const name = (document.getElementById('ns-name').value || '').trim();
  const trigram = (document.getElementById('ns-trigram').value || '').trim().toUpperCase().slice(0, 3);
  if (!code || !name) { showNotif('Code et nom obligatoires', 'warn'); return; }
  if (suppliers.find(s => s.code === code)) {
    showNotif('Ce code fournisseur existe deja', 'error'); return;
  }
  suppliers.push({ code, name, trigram });
  btn.closest('.modal-overlay').remove();
  renderSuppliersPage();
  renderAdminHome();
  showNotif('Fournisseur "' + name + '" cree');
}

function renderSuppliersTable(filter) {
  const tb = document.getElementById('suppliers-tbody');
  if (!tb) return;
  const q = (filter || '').toLowerCase();
  tb.innerHTML = '';
  brandSettings.forEach((b, idx) => {
    const sup     = suppliers.find(s => s.code === b.fournisseurCode);
    const supName = sup ? sup.name : b.fournisseurCode;
    if (q && !supName.toLowerCase().includes(q) && !b.marque.toLowerCase().includes(q)) return;
    const repriseLabel = b.repriseEchange
      ? '<span class="badge badge-green" style="font-size:11px">Oui</span>'
      : '<span class="badge badge-grey" style="font-size:11px">Non</span>';
    const tri = sup && sup.trigram ? sup.trigram : '—';
    tb.innerHTML += `<tr>
      <td style="font-weight:600;white-space:nowrap">${supName}</td>
      <td style="font-family:monospace;font-size:11px;color:#607080">${b.fournisseurCode}</td>
      <td style="font-family:monospace">${tri}</td>
      <td style="white-space:nowrap">${b.marque}</td>
      <td>${catBadgeHtml(b.type)}</td>
      <td style="text-align:right">${b.rf > 0 ? (b.rf * 100).toFixed(2) + '%' : '—'}</td>
      <td style="text-align:right">${b.rfa > 0 ? (b.rfa * 100).toFixed(2) + '%' : '—'}</td>
      <td style="text-align:right;font-weight:600;color:#1565c0">
        ${b.remiseEnseigne > 0 ? (b.remiseEnseigne * 100).toFixed(0) + '%' : '—'}
      </td>
      <td style="text-align:center">${repriseLabel}</td>
      <td style="font-size:12px;color:#607080;white-space:nowrap">${b.conditionsLivraison || '—'}</td>
      <td><div class="td-actions">
        <button class="action-btn" onclick="openBrandEditor(${idx})">Editer</button>
        <button class="action-btn-danger btn-trash" title="Supprimer"
          onclick="confirmDelete('brand',${idx},'${b.marque}')">${TRASH_ICON}</button>
      </div></td>
    </tr>`;
  });
}

function isBrandSpecialFormAttr(a) {
  return !!(a && ['fournisseur_code', 'marque', 'cat', 'segmentation'].includes(a.code));
}

function brandExtraFieldsHtml(b, prefix) {
  const known = new Set(['rf', 'rfa', 'remiseEnseigne', 'repriseEchange', 'conditionsLivraison']);
  const extras = getConditionAttrs().filter(a => !isBrandSpecialFormAttr(a) && !known.has(a.code));
  if (!extras.length) return '';
  return extras.map(a => {
    const id = prefix + '-attr-' + a.code;
    const key = brandAttrStorageKey(a);
    const val = b ? b[key] : '';
    let input;
    if (isPercentBrandAttr(a)) {
      const n = typeof val === 'number' ? (val * 100) : 0;
      input = `<input class="field-input" id="${id}" type="number" step="0.01" value="${n}"
        onwheel="event.preventDefault();this.blur()">`;
    } else if (a.type === 'Oui / Non' || a.code === 'repriseEchange') {
      input = `<select class="form-select" id="${id}">
        <option value="0"${!val ? ' selected' : ''}>Non</option>
        <option value="1"${val ? ' selected' : ''}>Oui</option>
      </select>`;
    } else if (a.type === 'Simple select') {
      const opts = (a.options || []).map(o =>
        `<option${o === val ? ' selected' : ''}>${escapeHtml(o)}</option>`
      ).join('');
      input = `<select class="form-select" id="${id}">
        <option value="">-- Choisir --</option>${opts}
      </select>`;
    } else {
      input = `<input class="field-input" id="${id}" value="${escapeHtml(val == null ? '' : val)}">`;
    }
    return `<div class="form-field">
      <div class="form-label">${escapeHtml(a.name)}</div>
      ${input}
    </div>`;
  }).join('');
}

function applyBrandExtraForm(b, prefix) {
  const known = new Set(['rf', 'rfa', 'remiseEnseigne', 'repriseEchange', 'conditionsLivraison']);
  getConditionAttrs().forEach(a => {
    if (isBrandSpecialFormAttr(a) || known.has(a.code)) return;
    const el = document.getElementById(prefix + '-attr-' + a.code);
    if (!el) return;
    const key = brandAttrStorageKey(a);
    if (isPercentBrandAttr(a)) b[key] = parseFloat(el.value) / 100 || 0;
    else if (a.type === 'Oui / Non' || a.code === 'repriseEchange') b[key] = el.value === '1' || el.value === 'Oui';
    else b[key] = el.value;
  });
}

function editBrandSetting(i) {
  const b = brandSettings[i];
  if (!b) return;

  const allMarques = getMarqueOptions();
  const catOptions = categories.map(c =>
    `<option value="${c.name}" ${c.name === b.type ? 'selected' : ''}>${c.name}</option>`
  ).join('');

  const cat = categories.find(c => c.name === b.type);
  const segAttrs = _getSegAttrsForCat(cat);
  const segAttrOptions = `<option value="">-- Aucune --</option>` +
    segAttrs.map(a =>
      `<option value="${a.code}" ${a.code === b.segAttrCode ? 'selected' : ''}>${a.name}</option>`
    ).join('');
  const segAttr = b.segAttrCode ? attributes.find(a => a.code === b.segAttrCode) : null;
  const segValOptions = segAttr
    ? (segAttr.options || []).map(o =>
        `<option ${o === b.segAttrValue ? 'selected' : ''}>${o}</option>`
      ).join('') : '';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:720px;width:100%">
      <div class="modal-title">Modifier — ${b.marque}</div>
      <div class="form-grid">
        <div class="form-field">
          <div class="form-label">Fournisseur</div>
          ${autocompleteInput('eb-sup', 'eb-sup-list',
            supplierNameByCode(b.fournisseurCode),
            suppliers.map(s => s.name),
            '', 'Rechercher un fournisseur')}
        </div>
        <div class="form-field">
          <div class="form-label">Marque</div>
          ${autocompleteInput('eb-marque', 'eb-marque-list', b.marque,
            allMarques, '', 'Rechercher une marque')}
        </div>
        <div class="form-field">
          <div class="form-label">Code IWI (3 caracteres max)</div>
          <input class="field-input" id="eb-iwi" maxlength="3" value="${escapeHtml(b.iwiCode || '')}">
        </div>
        <div class="form-field">
          <div class="form-label">Type (categorie)</div>
          <select class="form-select" id="eb-type"
            onchange="onEditBrandCatChange(this)">${catOptions}</select>
        </div>
        <div class="form-field">
          <div class="form-label">Segmentation</div>
          <select class="form-select" id="eb-seg-attr"
            onchange="onEditBrandSegAttrChange(this)">${segAttrOptions}</select>
        </div>
        <div class="form-field" id="eb-seg-val-wrap"
          style="${segAttr ? '' : 'display:none'}">
          <div class="form-label">Valeur</div>
          <select class="form-select" id="eb-seg-val">${segValOptions}</select>
        </div>
        <div class="form-field">
          <div class="form-label">RF (%)</div>
          <input class="field-input" id="eb-rf" type="number" step="0.01" onwheel="event.preventDefault();this.blur()"
            value="${((b.rf || 0) * 100).toFixed(2)}">
        </div>
        <div class="form-field">
          <div class="form-label">RFA (%)</div>
          <input class="field-input" id="eb-rfa" type="number" step="0.01" onwheel="event.preventDefault();this.blur()"
            value="${((b.rfa || 0) * 100).toFixed(2)}">
        </div>
        <div class="form-field">
          <div class="form-label">Remise interne %</div>
          <input class="field-input" id="eb-marge" type="number" step="1" onwheel="event.preventDefault();this.blur()"
            value="${((b.remiseEnseigne || 0) * 100).toFixed(0)}">
        </div>
        <div class="form-field">
          <div class="form-label">Reprise echange</div>
          <select class="form-select" id="eb-reprise">
            <option value="1" ${b.repriseEchange ? 'selected' : ''}>Oui</option>
            <option value="0" ${!b.repriseEchange ? 'selected' : ''}>Non</option>
          </select>
        </div>
        <div class="form-field">
          <div class="form-label">Conditions livraison</div>
          <input class="field-input" id="eb-livraison"
            value="${b.conditionsLivraison || ''}">
        </div>
      </div>
      <div class="form-grid" style="margin-top:8px">${brandExtraFieldsHtml(b, 'eb')}</div>
      ${brandHistoryHtml(b)}
      <div class="modal-footer">
        <button class="btn btn-secondary"
          onclick="this.closest('.modal-overlay').remove()">Annuler</button>
        <button class="btn btn-primary"
          onclick="saveBrandSetting(${i}, this)">Enregistrer</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function brandChangeSnapshot(b) {
  const pct = (n, digits) => (typeof n === 'number' ? (n * 100).toFixed(digits) + '%' : '');
  return {
    Fournisseur: supplierNameByCode(b.fournisseurCode) || b.fournisseurCode || '',
    'Code fournisseur': b.fournisseurCode || '',
    Trigramme: getBrandSettingAttrValue(b, { code: '_supplierTrigram' }),
    Marque: b.marque || '',
    'Code IWI': b.iwiCode || '',
    Type: b.type || '',
    Segmentation: getBrandSettingAttrValue(b, { code: 'segmentation' }),
    RF: pct(b.rf, 2),
    RFA: pct(b.rfa, 2),
    'Remise interne': pct(b.remiseEnseigne, 0),
    'Reprise echange': b.repriseEchange ? 'Oui' : 'Non',
    'Conditions livraison': b.conditionsLivraison || '',
  };
}

function pushBrandHistory(b, before) {
  const after = brandChangeSnapshot(b);
  if (!b.history) b.history = [];
  const ts = typeof nowStr === 'function' ? nowStr() : '';
  const user = typeof currentUserName === 'function' ? currentUserName() : '';
  Object.keys(before).forEach(field => {
    const oldVal = before[field] || '';
    const newVal = after[field] || '';
    if (oldVal !== newVal) b.history.push({ ts, user, field, old: oldVal, new: newVal });
  });
}

function brandHistoryHtml(b) {
  const history = (b && b.history) || [];
  const title = `<div class="field-group-title" style="margin-top:16px">Historique</div>`;
  if (!history.length) {
    return title + `<div style="color:#a0b0c0;font-size:13px">Aucune modification enregistree.</div>`;
  }
  const rows = [...history].reverse().map(h => `<tr>
      <td style="white-space:nowrap;color:#607080">${escapeHtml(h.ts || '')}</td>
      <td>${escapeHtml(h.user || '')}</td>
      <td>${escapeHtml(h.field || '')}</td>
      <td><span class="history-val-old">${escapeHtml(h.old || '(vide)')}</span><span class="history-arrow">→</span><span class="history-val-new">${escapeHtml(h.new || '(vide)')}</span></td>
    </tr>`).join('');
  return title + `<div style="max-height:180px;overflow:auto;border:1px solid #e6edf5;border-radius:8px">
    <table class="history-table"><thead><tr><th>Date</th><th>Utilisateur</th><th>Champ</th><th>Modification</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

function saveBrandSetting(i, btn) {
  if (!requirePerm(canMod('mod_conditions', 'w'))) return;
  const b = brandSettings[i];
  if (!b) return;
  const before = brandChangeSnapshot(b);
  b.fournisseurCode     = resolveSupplierCode(document.getElementById('eb-sup').value);
  if (!b.fournisseurCode) { showNotif('Fournisseur inconnu', 'warn'); return; }
  b.marque              = document.getElementById('eb-marque').value.trim();
  b.iwiCode             = (document.getElementById('eb-iwi').value || '').trim().slice(0, 3);
  b.type                = document.getElementById('eb-type').value;
  b.segAttrCode         = document.getElementById('eb-seg-attr').value || null;
  const vSel            = document.getElementById('eb-seg-val');
  b.segAttrValue        = b.segAttrCode && vSel ? vSel.value : null;
  b.rf                  = parseFloat(document.getElementById('eb-rf').value) / 100 || 0;
  b.rfa                 = parseFloat(document.getElementById('eb-rfa').value) / 100 || 0;
  b.remiseEnseigne        = parseFloat(document.getElementById('eb-marge').value) / 100 || 0;
  b.repriseEchange      = document.getElementById('eb-reprise').value === '1';
  b.conditionsLivraison = document.getElementById('eb-livraison').value.trim();
  applyBrandExtraForm(b, 'eb');
  pushBrandHistory(b, before);
  registerMarque(b.marque);
  btn.closest('.modal-overlay').remove();
  renderSuppliersPage();
  showNotif('Condition "' + b.marque + '" mise a jour');
}

function _getSegAttrsForCat(cat) {
  if (!cat) return [];
  return cat.groupIds
    .flatMap(gid => { const g = getGroupById(gid); return g ? g.attrIds : []; })
    .map(aid => getAttrById(aid))
    .filter(a => a && (a.type === 'Simple select' || a.type === 'Oui / Non'));
}

function onEditBrandCatChange(sel) {
  const cat      = categories.find(c => c.name === sel.value);
  const segAttrs = _getSegAttrsForCat(cat);
  const segSel   = document.getElementById('eb-seg-attr');
  if (segSel) {
    segSel.innerHTML = `<option value="">-- Aucune --</option>` +
      segAttrs.map(a => `<option value="${a.code}">${a.name}</option>`).join('');
  }
  const wrap = document.getElementById('eb-seg-val-wrap');
  if (wrap) wrap.style.display = 'none';
}

function onEditBrandSegAttrChange(sel) {
  const attr = sel.value ? attributes.find(a => a.code === sel.value) : null;
  const wrap = document.getElementById('eb-seg-val-wrap');
  const vSel = document.getElementById('eb-seg-val');
  if (!wrap || !vSel) return;
  if (attr && attr.options && attr.options.length) {
    vSel.innerHTML = attr.options.map(o => `<option>${o}</option>`).join('');
    wrap.style.display = '';
  } else {
    wrap.style.display = 'none';
  }
}

function onNewBrandCatChange(sel) {
  const cat      = categories.find(c => c.name === sel.value);
  const segAttrs = _getSegAttrsForCat(cat);
  const segSel   = document.getElementById('nb-seg-attr');
  if (segSel) {
    segSel.innerHTML = `<option value="">-- Aucune --</option>` +
      segAttrs.map(a => `<option value="${a.code}">${a.name}</option>`).join('');
  }
  const wrap = document.getElementById('nb-seg-val-wrap');
  if (wrap) wrap.style.display = 'none';
}

function onNewBrandSegAttrChange(sel) {
  const attr = sel.value ? attributes.find(a => a.code === sel.value) : null;
  const wrap = document.getElementById('nb-seg-val-wrap');
  const vSel = document.getElementById('nb-seg-val');
  if (!wrap || !vSel) return;
  if (attr && attr.options && attr.options.length) {
    vSel.innerHTML = attr.options.map(o => `<option>${o}</option>`).join('');
    wrap.style.display = '';
  } else {
    wrap.style.display = 'none';
  }
}

function openCreateBrandModal() {
  if (!requirePerm(canMod('mod_conditions', 'w'))) return;
  const allMarques = getMarqueOptions();
  const catOptions = categories.map(c =>
    `<option value="${c.name}">${c.name}</option>`).join('');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:560px;width:100%">
      <div class="modal-title">Nouvelle condition commerciale</div>
      <div class="form-grid">
        <div class="form-field">
          <div class="form-label">Fournisseur *</div>
          ${autocompleteInput('nb-sup', 'nb-sup-list', '',
            suppliers.map(s => s.name),
            '', 'Rechercher un fournisseur')}
        </div>
        <div class="form-field">
          <div class="form-label">Marque *</div>
          ${autocompleteInput('nb-marque', 'nb-marque-list', '',
            allMarques, '', 'Rechercher une marque')}
        </div>
        <div class="form-field">
          <div class="form-label">Type (categorie) *</div>
          <select class="form-select" id="nb-type"
            onchange="onNewBrandCatChange(this)">${catOptions}</select>
        </div>
        <div class="form-field">
          <div class="form-label">Segmentation</div>
          <select class="form-select" id="nb-seg-attr"
            onchange="onNewBrandSegAttrChange(this)">
            <option value="">-- Aucune --</option>
          </select>
        </div>
        <div class="form-field" id="nb-seg-val-wrap" style="display:none">
          <div class="form-label">Valeur</div>
          <select class="form-select" id="nb-seg-val"></select>
        </div>
        <div class="form-field">
          <div class="form-label">RF (%)</div>
          <input class="field-input" id="nb-rf" type="number" step="0.01" value="0" onwheel="event.preventDefault();this.blur()">
        </div>
        <div class="form-field">
          <div class="form-label">RFA (%)</div>
          <input class="field-input" id="nb-rfa" type="number" step="0.01" value="0" onwheel="event.preventDefault();this.blur()">
        </div>
        <div class="form-field">
          <div class="form-label">Remise interne %</div>
          <input class="field-input" id="nb-marge" type="number" step="1" value="0" onwheel="event.preventDefault();this.blur()">
        </div>
        <div class="form-field">
          <div class="form-label">Reprise echange</div>
          <select class="form-select" id="nb-reprise">
            <option value="0">Non</option>
            <option value="1">Oui</option>
          </select>
        </div>
        <div class="form-field">
          <div class="form-label">Conditions livraison</div>
          <input class="field-input" id="nb-livraison" placeholder="ex: Franco">
        </div>
      </div>
      <div class="form-grid" style="margin-top:8px">${brandExtraFieldsHtml({}, 'nb')}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary"
          onclick="this.closest('.modal-overlay').remove()">Annuler</button>
        <button class="btn btn-primary"  
          onclick="createBrandSetting(this)">Creer</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  onNewBrandCatChange(document.getElementById('nb-type'));
}

function createBrandSetting(btn) {
  if (!requirePerm(canMod('mod_conditions', 'w'))) return;
  const marque        = (document.getElementById('nb-marque').value || '').trim();
  const fournisseurCode = resolveSupplierCode(document.getElementById('nb-sup').value);
  const type          = document.getElementById('nb-type').value;
  const segAttrCode   = document.getElementById('nb-seg-attr').value || null;
  const vSel          = document.getElementById('nb-seg-val');
  const segAttrValue  = segAttrCode && vSel ? vSel.value : null;

  if (!marque) { showNotif('Marque obligatoire', 'error'); return; }
  if (!fournisseurCode) { showNotif('Fournisseur inconnu', 'warn'); return; }

  // Controle doublon
  const exists = brandSettings.some(b =>
    b.fournisseurCode === fournisseurCode &&
    b.marque          === marque &&
    b.type            === type &&
    (b.segAttrCode    || null) === segAttrCode &&
    (b.segAttrValue   || null) === segAttrValue
  );
  if (exists) {
    const segLabel = segAttrCode
      ? ` / ${(attributes.find(a => a.code === segAttrCode) || {}).name || segAttrCode} = ${segAttrValue}`
      : '';
    const supName = (suppliers.find(s => s.code === fournisseurCode) || {}).name || fournisseurCode;
    showNotif(
      `Une condition existe deja : ${supName} — ${marque} — ${type}${segLabel}`,
      'error'
    );
    return;
  }

  const entry = {
    marque,
    fournisseurCode,
    type,
    segAttrCode,
    segAttrValue,
    rf:                  parseFloat(document.getElementById('nb-rf').value)    / 100 || 0,
    rfa:                 parseFloat(document.getElementById('nb-rfa').value)   / 100 || 0,
    remiseEnseigne:        parseFloat(document.getElementById('nb-marge').value) / 100 || 0,
    repriseEchange:      document.getElementById('nb-reprise').value === '1',
    conditionsLivraison: document.getElementById('nb-livraison').value.trim(),
    history: [],
  };
  applyBrandExtraForm(entry, 'nb');
  brandSettings.push(entry);
  registerMarque(marque);
  btn.closest('.modal-overlay').remove();
  renderSuppliersPage();
  showNotif('Condition "' + marque + '" creee');
}

function filterSuppliersTable() {
  renderSuppliersPage();
}

function openBrandEditor(idx) {
  editingBrandIdx = idx;
  const isNew = idx === -1;
  const b = isNew
    ? { fournisseurCode: '', marque: '', type: '', rf: 0, rfa: 0, remiseEnseigne: 0,
        repriseEchange: false, conditionsLivraison: 'Franco' }
    : brandSettings[idx];
  const existing = document.getElementById('brand-editor-overlay');
  if (existing) existing.remove();
  const supOptions  = suppliers.map(s =>
    `<option value="${s.code}"${s.code === b.fournisseurCode ? ' selected' : ''}>${s.name} (${s.code})</option>`
  ).join('');
  const typeOptions = categories.map(c =>
    `<option value="${c.name}"${c.name === b.type ? ' selected' : ''}>${c.name}</option>`
  ).join('');
  const overlay = document.createElement('div');
  overlay.id = 'brand-editor-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:2000;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:28px;width:560px;max-width:95vw;
      max-height:90vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,0.18)">
      <div style="font-size:15px;font-weight:700;color:#1a2332;margin-bottom:20px">
        ${isNew ? 'Nouvelle entree fournisseur / marque' : 'Modifier : ' + b.marque + (b.type ? ' — ' + b.type : '')}
      </div>
      <div class="form-grid" style="margin-bottom:16px">
        <div class="form-field">
          <div class="form-label">Fournisseur *</div>
          <select class="form-select" id="be-supplier">${supOptions}</select>
        </div>
        <div class="form-field">
          <div class="form-label">Marque *</div>
          <input class="field-input" id="be-marque" value="${b.marque}" placeholder="ex : Ray-Ban">
        </div>
        <div class="form-field">
          <div class="form-label">Type (categorie)</div>
          <select class="form-select" id="be-type">
            <option value="">-- Choisir --</option>${typeOptions}
          </select>
        </div>
        <div class="form-field">
          <div class="form-label">RF %</div>
          <input class="field-input" type="number" step="0.01" id="be-rf" onwheel="event.preventDefault();this.blur()"
            value="${(b.rf * 100).toFixed(2)}">
        </div>
        <div class="form-field">
          <div class="form-label">RFA %</div>
          <input class="field-input" type="number" step="0.01" id="be-rfa" onwheel="event.preventDefault();this.blur()"
            value="${(b.rfa * 100).toFixed(2)}">
        </div>
        <div class="form-field">
          <div class="form-label">Remise interne %</div>
          <input class="field-input" type="number" step="0.01" id="be-remise-enseigne" onwheel="event.preventDefault();this.blur()"
            value="${(b.remiseEnseigne * 100).toFixed(2)}">
        </div>
        <div class="form-field">
          <div class="form-label">Reprise echange</div>
          <select class="form-select" id="be-reprise">
            <option value="1"${b.repriseEchange ? ' selected' : ''}>Oui</option>
            <option value="0"${!b.repriseEchange ? ' selected' : ''}>Non</option>
          </select>
        </div>
        <div class="form-field">
          <div class="form-label">Conditions de livraison</div>
          <input class="field-input" id="be-conditions" value="${b.conditionsLivraison || ''}">
        </div>
      </div>
      ${brandHistoryHtml(b)}
      <div style="display:flex;justify-content:flex-end;gap:10px">
        <button class="btn btn-secondary"
          onclick="document.getElementById('brand-editor-overlay').remove()">Annuler</button>
        <button class="btn btn-primary" onclick="saveBrandEditor()">Enregistrer</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function saveBrandEditor() {
  if (!requirePerm(canMod('mod_conditions', 'w'))) return;
  const marque         = (document.getElementById('be-marque').value || '').trim();
  const fournisseurCode = document.getElementById('be-supplier').value;
  if (!marque || !fournisseurCode) { showNotif('Fournisseur et marque obligatoires'); return; }
  const entry = {
    marque, fournisseurCode,
    type:               document.getElementById('be-type').value,
    rf:                 parseFloat(document.getElementById('be-rf').value || 0) / 100,
    rfa:                parseFloat(document.getElementById('be-rfa').value || 0) / 100,
    remiseEnseigne:          parseFloat(document.getElementById('be-remise-enseigne').value || 0) / 100,
    repriseEchange:     document.getElementById('be-reprise').value === '1',
    conditionsLivraison:document.getElementById('be-conditions').value.trim(),
    history: (editingBrandIdx >= 0 && brandSettings[editingBrandIdx] && brandSettings[editingBrandIdx].history) || [],
  };
  if (editingBrandIdx === -1) brandSettings.push(entry);
  else brandSettings[editingBrandIdx] = entry;
  registerMarque(marque);
  document.getElementById('brand-editor-overlay').remove();
  renderSuppliersTable();
  showNotif(editingBrandIdx === -1 ? 'Entree creee : ' + marque : 'Entree mise a jour : ' + marque);
}

function numericAlertAttrs() {
  return attributes.filter(a => a.type === 'Nombre' || a.type === 'Nombre decimal' || isPercentAttr(a));
}

function renderAlertsPage() {
  const page = document.getElementById('page-admin-alerts');
  if (!page) return;
  const canW = canMod('mod_alerts', 'w');
  const canD = canMod('mod_alerts', 'd');
  const rows = (alerts || []).map(alert => {
    const attr = attributes.find(a => a.code === alert.attrCode);
    const rule = alert.conds
      ? `<td colspan="3">${escapeHtml(alertCondsText(alert))}</td>`
      : `<td>${escapeHtml(attr ? attr.name : alert.attrCode)}</td>
      <td>${escapeHtml(alertOpLabel(alert.op))}</td>
      <td>${escapeHtml(alertThresholdText(alert))}</td>`;
    return `<tr>
      <td>${escapeHtml(alert.name || '')}</td>
      ${rule}
      <td>${productsForAlert(alert).length}</td>
      <td>${canD ? `<button class="action-btn-danger btn-trash" title="Supprimer l'alerte" onclick="deleteAlert(${alert.id})">${TRASH_ICON}</button>` : ''}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="6" style="text-align:center;color:#a0b0c0;padding:24px">Aucune alerte.</td></tr>`;
  page.innerHTML = `
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px">
      <button class="btn btn-secondary" onclick="showPage('admin',null)">&larr; Administration</button>
      <span style="font-size:15px;font-weight:700;color:#1a2332">Alertes</span>
      ${canW ? `<button class="btn btn-primary" onclick="openAlertModal()">+ Alerte</button>` : ''}
    </div>
    <div class="table-container"><table>
      <thead><tr><th>Nom</th><th>Attribut</th><th>Sens</th><th>Seuil</th><th>Produits</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

function openAlertModal() {
  if (!requirePerm(canMod('mod_alerts', 'w'))) return;
  const opts = numericAlertAttrs().map(a =>
    `<option value="${a.code}">${escapeHtml(a.name)}</option>`
  ).join('');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:460px;width:100%">
      <div class="modal-title">Nouvelle alerte</div>
      <div class="form-grid">
        <div class="form-field">
          <div class="form-label">Nom</div>
          <input class="field-input" id="al-name" placeholder="Taux de marque faible">
        </div>
        <div class="form-field">
          <div class="form-label">Attribut</div>
          <select class="form-select" id="al-attr">${opts}</select>
        </div>
        <div class="form-field">
          <div class="form-label">Sens</div>
          <select class="form-select" id="al-op">
            <option value="<">Inférieur à</option>
            <option value=">">Supérieur à</option>
          </select>
        </div>
        <div class="form-field">
          <div class="form-label">Seuil</div>
          <input class="field-input" id="al-threshold" type="number" step="any" placeholder="20">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
        <button class="btn btn-primary" onclick="createAlert(this)">Creer</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function createAlert(btn) {
  if (!requirePerm(canMod('mod_alerts', 'w'))) return;
  const attrCode = document.getElementById('al-attr').value;
  const attr = attributes.find(a => a.code === attrCode);
  const op = document.getElementById('al-op').value === '>' ? '>' : '<';
  const raw = parseFloat(String(document.getElementById('al-threshold').value).replace(',', '.'));
  if (!attr || !isFinite(raw)) { showNotif('Attribut et seuil numeriques obligatoires', 'warn'); return; }
  const threshold = isPercentAttr(attr) ? raw / 100 : raw;
  const typed = (document.getElementById('al-name').value || '').trim();
  alerts.push({
    id: nextAlertId++,
    name: typed,
    attrCode,
    op,
    threshold,
  });
  btn.closest('.modal-overlay').remove();
  renderAlertsPage();
  renderAdminHome();
  renderDashboard();
  showNotif('Alerte creee');
}

function deleteAlert(id) {
  if (!requirePerm(canMod('mod_alerts', 'd'))) return;
  const alert = (alerts || []).find(a => a.id === id);
  if (!alert) return;
  if (!confirm('Supprimer l\'alerte « ' + (alert.name || alertRuleText(alert)) + ' » ?')) return;
  const idx = alerts.findIndex(a => a.id === id);
  if (idx >= 0) alerts.splice(idx, 1);
  if (_filterAlertId === id) _filterAlertId = null;
  renderAlertsPage();
  renderAdminHome();
  renderDashboard();
  showNotif('Alerte supprimee');
}
