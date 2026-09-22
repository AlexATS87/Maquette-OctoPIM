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
          <div style="font-size:12px;color:#607080;margin-bottom:10px">
            Image affichee en vignette dans la liste et sur la fiche resume.
          </div>
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
          <div style="font-size:12px;color:#607080;margin-bottom:10px">
            Toujours disponibles, non supprimables.
          </div>
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
        ${canD ? `<button class="action-btn-danger"
          onclick="confirmDelete('cat',${cat.id},'${cat.name}')">Supprimer</button>` : ''}
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
        <div class="attr-toggle-meta">${g.attrIds.length} attributs</div>
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
    <th>Actions</th>
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
        const ga = getGroupById(a.groupId);
        const gb = getGroupById(b.groupId);
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
    const group = getGroupById(a.groupId);
    const fill  = attrFillRate(a);
    const tr    = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:600">
        ${escapeHtml(a.name)}
        ${a.system ? systemLockBadge('attr') : ''}
        ${a.calc || a.formula
          ? `<span style="display:inline-flex;align-items:center;justify-content:center;
               width:16px;height:16px;border-radius:50%;background:#ffd54f;color:#5d4037;
               font-size:10px;font-weight:700;margin-left:5px;cursor:help"
               title="Champ calcule : ${escapeHtml(a.formula || '')}">&#9654;</span>`
          : ''}
      </td>
      <td><span class="badge badge-grey">${a.type}</span></td>
      <td>${group
        ? `<span class="attr-chip"
             style="background:${getGroupColor(group).bg};color:${getGroupColor(group).text}">
             ${group.name}
           </span>`
        : '—'}</td>
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
      <td>
        <div class="td-actions">
          <button class="action-btn"
            onclick="editAttribute(${a.id})">${canMod('mod_attributes','w') ? 'Modifier' : 'Voir'}</button>
          ${(!a.system && canMod('mod_attributes','d'))
            ? `<button class="action-btn-danger"
                onclick="confirmDelete('attr',${a.id},'${a.name.replace(/'/g,"\\'")}')">
                Suppr.
              </button>`
            : ''}
        </div>
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
  document.getElementById('ea-completion').value = a.inCompletion ? '1' : '0';
  document.getElementById('ea-formula').value  = a.formula || '';
  const helpEl = document.getElementById('ea-helptext');
  if (helpEl) helpEl.value = a.helpText || '';
  document.getElementById('ea-mask').value     = a.mask || '';
  document.getElementById('ea-maxlength').value = a.maxLength || '';
  document.getElementById('ea-step-enabled').value = a.stepEnabled ? '1' : '0';
  document.getElementById('ea-step').value = a.step ?? '';
  document.getElementById('ea-min').value  = a.min  ?? '';
  document.getElementById('ea-max').value  = a.max  ?? '';

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
  showPage('admin-attribute-edit', null);
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
  const newName = document.getElementById('ea-name').value.trim();
  const newCode = (isTechAdmin() && !a.system)
    ? document.getElementById('ea-code').value.trim()
    : a.code; // non-admin et attributs systeme : code fige
  if (!newName || !newCode) { showNotif('Nom et code obligatoires'); return; }
  if (newCode !== a.code && attributes.find(x => x.code === newCode)) {
    showNotif('Code deja utilise par un autre attribut'); return;
  }
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
  a.formula  = document.getElementById('ea-formula').value.trim();
  // Un attribut est calcule uniquement s'il porte une formule
  a.calc     = !!a.formula;
  const helpSaveEl = document.getElementById('ea-helptext');
  a.helpText = helpSaveEl ? helpSaveEl.value.trim() : (a.helpText || '');
  a.mask     = document.getElementById('ea-mask').value.trim();
  a.maxLength = parseInt(document.getElementById('ea-maxlength').value) || null;
  a.stepEnabled = document.getElementById('ea-step-enabled').value === '1';
  a.step = numOrNull(document.getElementById('ea-step').value);
  a.min  = numOrNull(document.getElementById('ea-min').value);
  a.max  = numOrNull(document.getElementById('ea-max').value);
  if (newType === 'Simple select' || newType === 'Multi select') {
    a.options = document.getElementById('ea-options').value.split('\n').map(s => s.trim()).filter(Boolean);
  } else { a.options = []; }
  if (oldGroupId !== newGroupId) {
    if (oldGroupId) { const og = getGroupById(oldGroupId); if (og) og.attrIds = og.attrIds.filter(id => id !== a.id); }
    if (newGroupId) { const ng = getGroupById(newGroupId); if (ng && !ng.attrIds.includes(a.id)) ng.attrIds.push(a.id); }
    a.groupId = newGroupId;
  }
  renderAll();
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
  const formulaEl = document.getElementById('new-attr-formula');
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
    formula,
    helpText,
    // Un attribut est calcule uniquement s'il porte une formule
    calc:    !!formula,
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
  if (formulaEl) formulaEl.value = '';
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
  if (type === 'Nombre')    return '=[prix_catalogue] * 1.2';
  if (type === 'Oui / Non') return '=SI([active_o]==VRAI OU [active_l]==VRAI)';
  if (type === 'Date')      return 'DATE_MAJ(statut_publication)';
  return 'CONCAT(nom, " - ", sap)';
}

// Operateurs du moteur de formules : libelle court + detail en infobulle
const FORMULA_OPERATORS = [
  { token: 'CONCAT(a, " x ", b)', help: 'Concatene des champs et du texte libre. Le texte libre est entre guillemets doubles, les codes de champs sans guillemets.' },
  { token: '[code]',              help: 'Valeur du champ dont le code technique est indique entre crochets.' },
  { token: '+ - * /',             help: 'Operations arithmetiques sur les champs numeriques. Exemple : =[prix_catalogue] * 1.2' },
  { token: 'SI(condition)',              help: 'Renvoie Oui si la condition est vraie, Non sinon. Exemple : =SI([active_o]==VRAI)' },
  { token: 'SI(cond, siVrai, siFaux)',   help: 'Renvoie siVrai ou siFaux. siFaux peut etre un autre SI. Exemple : =SI([largeur_verres]>=56,"Adulte L","Adulte M")' },
  { token: 'OU / ET',             help: 'Combine plusieurs conditions dans un SI. Exemple : =SI([a]==VRAI OU [b]==VRAI)' },
  { token: '== != > < >= <=',     help: 'Comparaisons utilisables dans un SI.' },
  { token: 'VRAI / FAUX',         help: 'Valeurs booleennes. Un champ Oui / Non vaut VRAI quand il contient Oui.' },
  { token: 'DATE_MAJ(code)',      help: 'Horodate la derniere modification du champ cite. Reserve aux attributs de type Date.' },
];

// Guide des formules, affiche des que le champ Formule est disponible
function renderFormulaHelp(targetId, type) {
  const box = document.getElementById(targetId);
  if (!box) return;
  if (!type || type === 'Image') { box.style.display = 'none'; box.innerHTML = ''; return; }

  const operators = FORMULA_OPERATORS.map(o =>
    `<span title="${o.help}"
      style="display:inline-block;margin:0 5px 4px 0;padding:1px 6px;border-radius:4px;
      background:#fff;border:1px solid #d0dae6;font-family:monospace;font-size:11px;
      color:#1565c0;cursor:help">${o.token}</span>`
  ).join('');

  const codes = attributes.filter(a => !a.calc).map(a =>
    `<span style="display:inline-block;margin:0 6px 4px 0;padding:1px 6px;border-radius:4px;
      background:#fff;border:1px solid #e0e8f0;font-family:monospace;font-size:11px;color:#1a2332">
      ${a.code} <span style="color:#8a9bb0;font-family:inherit">(${a.name})</span>
    </span>`
  ).join('');
  const nbCodes = attributes.filter(a => !a.calc).length;

  box.style.display = '';
  box.innerHTML = `
    <div style="background:#f8fafc;border:1px solid #e8ecf0;border-radius:8px;
      padding:10px 12px;margin-top:-4px;margin-bottom:12px">
      <div style="font-size:12px;color:#607080;margin-bottom:8px">
        Exemple pour un attribut ${type} :
        <code style="font-family:monospace;color:#1565c0">${formulaExampleFor(type)}</code>
      </div>
      <div style="font-size:12px;font-weight:700;color:#1a2332;margin-bottom:5px">
        Operateurs disponibles
        <span style="font-weight:400;color:#a0b0c0">(survoler pour le detail)</span>
      </div>
      <div style="margin-bottom:4px">${operators}</div>
      <details>
        <summary style="font-size:12px;color:#1565c0;cursor:pointer">
          Voir les codes de champs (${nbCodes})
        </summary>
        <div style="max-height:120px;overflow:auto;margin-top:6px">${codes}</div>
      </details>
    </div>`;
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
          ${g.system ? systemLockBadge('group') : ''}
          ${g.isBrandGroup
            ? '<span class="attr-group-badge-system" style="background:#fce4ec;color:#880e4f">Marque/Fourn.</span>'
            : ''}
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:12px;color:#a0b0c0">${attrs.length} attribut${attrs.length > 1 ? 's' : ''}</span>
          <button class="action-btn" onclick="editAttrGroup(${g.id})">${canMod('mod_groups','w') ? 'Editer' : 'Voir'}</button>
          ${(!isProtectedGroup(g) && canMod('mod_groups','d'))
            ? `<button class="action-btn-danger"
                onclick="confirmDelete('group',${g.id},'${g.name}')">Supprimer</button>`
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
  editingGroupId = id;
  const g = attrGroups.find(x => x.id === id);
  if (!g) return;
  document.getElementById('edit-group-name').value = g.name;
  document.getElementById('edit-group-code').value = g.code;
  renderGroupAttrToggles(g);
  showPage('admin-group-edit', null);
}

function renderGroupAttrToggles(g) {
  const list = document.getElementById('group-attr-toggle-list');
  if (!list) return;
  list.innerHTML = '';
  const ordered = g.attrIds.map(id => getAttrById(id)).filter(Boolean);
  const inGroup = new Set(g.attrIds);
  const others = attributes.filter(a => !inGroup.has(a.id));

  const structureHint = g.isBrandGroup
    ? `<div style="font-size:12px;color:#607080;padding:8px 10px;margin-bottom:12px;background:#f8fafc;border-radius:8px">
         Groupe systeme : vous pouvez ajouter ou retirer des attributs (hors attributs cadenasses).
         Les colonnes du tableau Conditions commerciales suivent cet ordre.
       </div>`
    : '';

  list.innerHTML = `
    ${structureHint}
    <div style="font-size:12px;font-weight:700;color:#1a2332;margin-bottom:8px">
      Ordre d'affichage
      <span style="font-weight:400;color:#a0b0c0">(glisser pour reordonner)</span>
    </div>
    <div id="group-attr-order-list" style="margin-bottom:16px">
      ${ordered.length
        ? ordered.map((a, i) => `
            <div class="cat-group-order-item" draggable="true"
              data-attr-name="${escapeHtml(a.name.toLowerCase())}"
              ondragstart="groupAttrDragStart(${i})"
              ondragover="groupAttrDragOver(event)"
              ondrop="groupAttrDrop(event,${i})">
              <span class="drag-handle">&#8942;&#8942;</span>
              <span style="flex:1;font-size:13px;font-weight:600;color:#1a2332">${escapeHtml(a.name)}</span>
              ${a.system ? systemLockBadge('attr') : ''}
              <span class="badge badge-grey" style="font-size:11px">${escapeHtml(a.code)}</span>
              ${a.system && (a.groupId === g.id || (g.isBrandGroup && a.code === 'cat'))
                ? ''
                : `<button class="action-btn-danger" style="padding:2px 8px;font-size:11px"
                    onclick="toggleGroupAttr(${a.id})">&#10005;</button>`}
            </div>`).join('')
        : '<div style="font-size:12px;color:#a0b0c0;padding:8px">Aucun attribut dans ce groupe.</div>'}
    </div>
    <div style="font-size:12px;font-weight:700;color:#1a2332;margin-bottom:8px">Ajouter un attribut</div>
    ${others.length
      ? others.map(attr => `
          <div class="attr-toggle-row" data-attr-name="${escapeHtml(attr.name.toLowerCase())}">
            <div class="attr-toggle-info">
              <div class="attr-toggle-name">${escapeHtml(attr.name)}</div>
              <div class="attr-toggle-meta">${escapeHtml(attr.type)}</div>
            </div>
            <div class="toggle" data-attr-id="${attr.id}"
              onclick="toggleGroupAttr(${attr.id})"></div>
          </div>`).join('')
      : '<div style="font-size:12px;color:#a0b0c0;padding:8px">Tous les attributs sont deja dans le groupe.</div>'}`;
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
  renderAll();
  showPage('admin-groups', null);
  showNotif('Groupe mis a jour');
}

function createAttrGroup() {
  if (!requirePerm(canMod('mod_groups', 'w'))) return;
  const name = document.getElementById('new-group-name').value.trim();
  const code = document.getElementById('new-group-code').value.trim();
  if (!name || !code) { showNotif('Nom et code obligatoires'); return; }
  attrGroups.push({ id: nextGroupId++, name, code, system: false, isBrandGroup: false, attrIds: [] });
  document.getElementById('new-group-name').value = '';
  document.getElementById('new-group-code').value = '';
  closeModal('modal-create-group');
  renderAll();
  showNotif('Groupe "' + name + '" cree');
}

// ============================================================
// ADMIN — ROLES
// ============================================================
function renderRoles() {
  const grid = document.getElementById('roles-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const adminModules = ADMIN_MODULES;

  roles.forEach(role => {
    const card = document.createElement('div');
    card.className = 'role-card';

    let permsHtml = '<div class="perm-section-title">Categories de produit</div>';
    categories.forEach(cat => {
      permsHtml += permRow(role, 'cat_' + cat.id, cat.name, cat.color);
    });

    permsHtml += '<div class="perm-section-title" style="margin-top:12px">Menus</div>';
    NAV_MENUS.forEach(m => {
      permsHtml += permRow(role, m.key, m.label, '', { visibilityOnly: true });
    });

    permsHtml += '<div class="perm-section-title" style="margin-top:12px">Modules administration</div>';
    adminModules.forEach(m => {
      permsHtml += permRow(role, m.key, m.label, '');
    });

    card.innerHTML = `
      <div class="role-card-header">
        <div class="role-name">${role.name}</div>
        <span class="badge badge-grey">${role.mode}</span>
      </div>
      <div class="perm-list">${permsHtml}</div>`;
    grid.appendChild(card);
  });
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
function permRow(role, key, label, color, opts) {
  const p   = role.perms[key] || { r: false, w: false, d: false };
  const canEdit = canMod('mod_roles', 'w');
  const click = (type) => canEdit
    ? `onclick="togglePerm(${role.id},'${key}','${type}',this)"`
    : 'disabled';
  const dot = color ? `<span class="cat-dot" style="background:${color}"></span>` : '';
  const visOnly = opts && opts.visibilityOnly;
  return `<div class="perm-row">
    <span class="perm-label">${dot}${label}</span>
    <div class="perm-actions">
      <button class="perm-icon-btn ${p.r ? 'active-read' : ''}" title="${visOnly ? 'Afficher le menu' : 'Consulter'}"
        ${click('r')}>&#128065;</button>
      ${visOnly ? '' : `<button class="perm-icon-btn ${p.w ? 'active-write' : ''}" title="Modifier"
        ${click('w')}>&#9999;&#65039;</button>
      <button class="perm-icon-btn ${p.d ? 'active-delete' : ''}" title="Supprimer"
        ${click('d')}>&#128465;&#65039;</button>`}
    </div>
  </div>`;
}

function togglePerm(roleId, key, type, btn) {
  if (!requirePerm(canMod('mod_roles', 'w'), 'Vous ne pouvez pas modifier les permissions')) return;
  const role = roles.find(r => r.id === roleId);
  if (!role) return;
  if (!role.perms[key]) role.perms[key] = { r: false, w: false, d: false };
  role.perms[key][type] = !role.perms[key][type];
  btn.classList.toggle(type === 'r' ? 'active-read' : type === 'w' ? 'active-write' : 'active-delete');
  const current = getCurrentRole();
  if (current && current.id === roleId) {
    applyAccessControl();
    const active = document.querySelector('.page.active');
    if (active && !canOpenPage(active.id.replace('page-', ''))) goToDefaultPage();
  }
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
        <div class="field-label" style="margin-bottom:6px">
          Nombre de produits par page
          <span style="font-size:11px;color:#a0b0c0;margin-left:6px">(0 = tout afficher)</span>
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <input type="number" class="field-input" id="pref-page-size"
            value="${appPrefs.pageSize}" min="0" max="500" step="10"
            style="width:120px" onwheel="event.preventDefault();this.blur()">
          <span style="font-size:12px;color:#a0b0c0">produits / page</span>
        </div>
        <div style="font-size:11px;color:#a0b0c0;margin-top:4px">
          Valeurs recommandees : 25, 50, 100. Mettre 0 pour desactiver la pagination.
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
  if (!isNaN(ps) && ps >= 0) { appPrefs.pageSize = ps; currentPage = 1; }
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
    return { i, b, supName: sup ? sup.name : b.fournisseurCode };
  });

  if (q) {
    list = list.filter(x =>
      condAttrs.some(a => getBrandSettingAttrValue(x.b, a).toLowerCase().includes(q)) ||
      (x.b.fournisseurCode || '').toLowerCase().includes(q) ||
      (x.supName || '').toLowerCase().includes(q)
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
  const colCount = attrs.length + 1;
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
      return `<td style="white-space:nowrap">${raw ? escapeHtml(raw) : '—'}</td>`;
    }).join('');

    rows += `<tr>
      ${cells}
      <td>
        <div class="td-actions">
          <button class="action-btn"
            onclick="editBrandSetting(${x.i})">${canMod('mod_conditions','w') ? 'Modifier' : 'Voir'}</button>
          ${canMod('mod_conditions','d')
            ? `<button class="action-btn-danger"
            onclick="confirmDelete('brand',${x.i},'${(x.b.marque || '').replace(/'/g, "\\'")}')">
            Suppr.
          </button>` : ''}
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
            ${condAttrs.map(a => makeBrandSortFilterTh(a)).join('')}
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
  if (!code || !name) { showNotif('Code et nom obligatoires', 'warn'); return; }
  if (suppliers.find(s => s.code === code)) {
    showNotif('Ce code fournisseur existe deja', 'error'); return;
  }
  suppliers.push({ code, name });
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
    const commentTrunc = b.commentaire && b.commentaire.length > 40
      ? b.commentaire.slice(0, 40) + '…'
      : b.commentaire || '';
    tb.innerHTML += `<tr>
      <td style="font-weight:600;white-space:nowrap">${supName}</td>
      <td style="font-family:monospace;font-size:11px;color:#607080">${b.fournisseurCode}</td>
      <td style="white-space:nowrap">${b.marque}</td>
      <td>${catBadgeHtml(b.type)}</td>
      <td style="text-align:right">${b.rf > 0 ? (b.rf * 100).toFixed(2) + '%' : '—'}</td>
      <td style="text-align:right">${b.rfa > 0 ? (b.rfa * 100).toFixed(2) + '%' : '—'}</td>
      <td style="text-align:right;font-weight:600;color:#1565c0">
        ${b.remiseEnseigne > 0 ? (b.remiseEnseigne * 100).toFixed(0) + '%' : '—'}
      </td>
      <td style="text-align:center">${repriseLabel}</td>
      <td style="font-size:12px;color:#607080;white-space:nowrap">${b.conditionsLivraison || '—'}</td>
      <td style="font-size:11px;color:#8090a0;max-width:180px"
        title="${b.commentaire || ''}">${commentTrunc || '—'}</td>
      <td><div class="td-actions">
        <button class="action-btn" onclick="openBrandEditor(${idx})">Editer</button>
        <button class="action-btn-danger"
          onclick="confirmDelete('brand',${idx},'${b.marque}')">Supprimer</button>
      </div></td>
    </tr>`;
  });
}

function isBrandSpecialFormAttr(a) {
  return !!(a && ['fournisseur_code', 'marque', 'cat', 'segmentation'].includes(a.code));
}

function brandExtraFieldsHtml(b, prefix) {
  const known = new Set(['rf', 'rfa', 'remiseEnseigne', 'repriseEchange', 'conditionsLivraison', 'commentaire']);
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
  const known = new Set(['rf', 'rfa', 'remiseEnseigne', 'repriseEchange', 'conditionsLivraison', 'commentaire']);
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

  const allMarques = [...new Set(brandSettings.map(x => x.marque))].sort();
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
    <div class="modal-box" style="max-width:560px;width:100%">
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
      <div class="field-row" style="margin-top:8px">
        <div class="field-label">Commentaire</div>
        <input class="field-input" id="eb-commentaire" value="${escapeHtml(b.commentaire || '')}">
      </div>
      <div class="form-grid" style="margin-top:8px">${brandExtraFieldsHtml(b, 'eb')}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary"
          onclick="this.closest('.modal-overlay').remove()">Annuler</button>
        <button class="btn btn-primary"
          onclick="saveBrandSetting(${i}, this)">Enregistrer</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function saveBrandSetting(i, btn) {
  if (!requirePerm(canMod('mod_conditions', 'w'))) return;
  const b = brandSettings[i];
  if (!b) return;
  b.fournisseurCode     = resolveSupplierCode(document.getElementById('eb-sup').value);
  if (!b.fournisseurCode) { showNotif('Fournisseur inconnu', 'warn'); return; }
  b.marque              = document.getElementById('eb-marque').value.trim();
  b.type                = document.getElementById('eb-type').value;
  b.segAttrCode         = document.getElementById('eb-seg-attr').value || null;
  const vSel            = document.getElementById('eb-seg-val');
  b.segAttrValue        = b.segAttrCode && vSel ? vSel.value : null;
  b.rf                  = parseFloat(document.getElementById('eb-rf').value) / 100 || 0;
  b.rfa                 = parseFloat(document.getElementById('eb-rfa').value) / 100 || 0;
  b.remiseEnseigne        = parseFloat(document.getElementById('eb-marge').value) / 100 || 0;
  b.repriseEchange      = document.getElementById('eb-reprise').value === '1';
  b.conditionsLivraison = document.getElementById('eb-livraison').value.trim();
  b.commentaire         = document.getElementById('eb-commentaire').value.trim();
  applyBrandExtraForm(b, 'eb');
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
  const allMarques = [...new Set(brandSettings.map(x => x.marque))].sort();
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
      <div class="field-row" style="margin-top:8px">
        <div class="field-label">Commentaire</div>
        <input class="field-input" id="nb-commentaire">
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
    commentaire:         document.getElementById('nb-commentaire').value.trim(),
  };
  applyBrandExtraForm(entry, 'nb');
  brandSettings.push(entry);
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
        repriseEchange: false, conditionsLivraison: 'Franco', commentaire: '' }
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
      <div class="form-field" style="margin-bottom:20px">
        <div class="form-label">Commentaire</div>
        <textarea class="field-input" id="be-commentaire" rows="2"
          style="resize:vertical">${b.commentaire || ''}</textarea>
      </div>
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
    commentaire:        document.getElementById('be-commentaire').value.trim(),
  };
  if (editingBrandIdx === -1) brandSettings.push(entry);
  else brandSettings[editingBrandIdx] = entry;
  document.getElementById('brand-editor-overlay').remove();
  renderSuppliersTable();
  showNotif(editingBrandIdx === -1 ? 'Entree creee : ' + marque : 'Entree mise a jour : ' + marque);
}
