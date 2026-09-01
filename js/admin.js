// ============================================================
// ADMIN.JS
// ============================================================

// ============================================================
// ADMIN — SYNTHESE (groupe figé, transversal)
// ============================================================
function renderSyntheseAdmin() {
  const page = document.getElementById('page-admin-synthese');
  if (!page) return;

  const attrOptions = attributes.map(a =>
    `<option value="${a.id}">${a.name} (${a.code})</option>`
  ).join('');

  const actionOptions = `<option value="action_delete">Supprimer</option>`;

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
          <div class="field-group-title">Colonnes systeme</div>
          <div style="font-size:12px;color:#607080;margin-bottom:10px">
            Toujours disponibles, non supprimables.
          </div>
          ${[
            { code: 'visuel_face', label: 'Visuel'       },
            { code: 'cat',        label: 'Categorie'     },
            { code: 'completion', label: 'Completion'    },
            { code: 'createdAt',  label: 'Date creation' },
            { code: 'maj',        label: 'Derniere MAJ'  },
          ].map(s => `
            <div style="display:flex;align-items:center;justify-content:space-between;
              padding:5px 0;border-bottom:1px solid #f0f4f8">
              <span style="font-size:12px;color:#607080">${s.label}</span>
              <button class="btn btn-secondary"
                style="font-size:11px;padding:3px 10px"
                onclick="addSyntheseSystem('${s.code}','${s.label}')">
                + Ajouter
              </button>
            </div>`
          ).join('')}
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
  syntheseItems.splice(i, 1);
  renderSyntheseAdmin();
}

function addSyntheseSystem(code, label) {
  if (syntheseItems.find(x => x.code === code)) {
    showNotif(label + ' est deja dans la vue synthese', 'warn'); return;
  }
  syntheseItems.push({ code, label, kind: 'attr' });
  renderSyntheseAdmin();
  showNotif(label + ' ajoute');
}

function addSyntheseAttr() {
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

function renderSyntheseAttrSelect() {
  const sel = document.getElementById('synth-add-attr-select');
  if (!sel) return;
  const usedCodes = syntheseItems.filter(i => i.kind === 'attr').map(i => i.code);
  // Attributs standards + champs virtuels
  const virtualFields = [
    { code: 'cat',        name: 'Categorie'      },
    { code: 'createdAt',  name: 'Date creation'  },
    { code: 'maj',        name: 'Derniere MAJ'   },
    { code: 'miseEnLigne',name: 'Mise en ligne'  },
    { code: 'completion', name: 'Completion'     },
    { code: 'visuel_face',name: 'Visuel'         },
  ];
  sel.innerHTML = '<option value="">-- Choisir un attribut --</option>';
  // Champs virtuels
  virtualFields.forEach(f => {
    if (!usedCodes.includes(f.code))
      sel.innerHTML += `<option value="${f.code}" data-label="${f.name}">${f.name} (champ systeme)</option>`;
  });
  // Attributs réels
  attributes.filter(a => !a.calc && !usedCodes.includes(a.code)).forEach(a => {
    sel.innerHTML += `<option value="${a.code}" data-label="${a.name}">${a.name}</option>`;
  });
}

function renderSyntheseItemsList() {
  const list = document.getElementById('synthese-items-list');
  if (!list) return;
  list.innerHTML = '';
  syntheseItems.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'cat-group-order-item';
    div.dataset.idx = idx;
    div.draggable = true;
    div.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', String(idx));
      div.classList.add('dragging');
    });
    div.addEventListener('dragend', () => div.classList.remove('dragging'));
    div.addEventListener('dragover', e => { e.preventDefault(); div.classList.add('drag-over'); });
    div.addEventListener('dragleave', () => div.classList.remove('drag-over'));
    div.addEventListener('drop', e => {
      e.preventDefault();
      div.classList.remove('drag-over');
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
      const toIdx   = parseInt(div.dataset.idx);
      if (fromIdx === toIdx) return;
      const [moved] = syntheseItems.splice(fromIdx, 1);
      syntheseItems.splice(toIdx, 0, moved);
      renderSyntheseItemsList();
      renderProductsTable();
    });

    const kindBadge = item.kind === 'action'
      ? `<span class="attr-group-badge-system" style="background:#fce4ec;color:#880e4f;margin-left:8px">Action</span>`
      : `<span class="attr-group-badge-system" style="background:#e3f2fd;color:#1565c0;margin-left:8px">Attribut</span>`;

    div.innerHTML = `
      <span class="drag-handle">&#9776;</span>
      <span style="font-size:13px;flex:1">${item.label}</span>
      <span style="font-size:11px;color:#a0b0c0;font-family:monospace;margin-right:8px">${item.code}</span>
      ${kindBadge}
      <button class="action-btn-danger"
        style="margin-left:12px;font-size:11px;padding:3px 8px"
        onclick="removeSyntheseItem(${idx})">Retirer</button>`;
    list.appendChild(div);
  });

  if (!syntheseItems.length) {
    list.innerHTML = '<div style="font-size:13px;color:#a0b0c0;padding:16px;text-align:center">Aucun element dans la synthese.</div>';
  }
}

function removeSyntheseItem(idx) {
  syntheseItems.splice(idx, 1);
  renderSyntheseItemsList();
  renderSyntheseAttrSelect();
  renderProductsTable();
  showNotif('Element retire de la synthese');
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
    tb.innerHTML += `<tr>
      <td><strong>${cat.name}</strong></td>
      <td style="font-family:monospace;font-size:12px;color:#607080">${cat.code}</td>
      <td><span class="color-swatch" style="background:${cat.color}"></span>${cat.color}</td>
      <td>${nb} groupe${nb > 1 ? 's' : ''}</td>
      <td><div class="td-actions">
        <button class="action-btn" onclick="editCategory(${cat.id})">Editer</button>
        <button class="action-btn-danger"
          onclick="confirmDelete('cat',${cat.id},'${cat.name}')">Supprimer</button>
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
      ${g.isBrandGroup
        ? '<span class="attr-group-badge-system" style="margin-left:8px;background:#fce4ec;color:#880e4f">Marque/Fourn.</span>'
        : ''}
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
  const cat = categories.find(c => c.id === catId);
  if (!cat) return;
  if (!cat.groupIds.includes(groupId)) cat.groupIds.push(groupId);
  renderCatGroupOrder(cat);
  renderCatGroupAvailable(cat);
}

function saveCategoryEdit() {
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
    const tr    = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:600">
        ${a.name}
        ${a.calc || a.formula
          ? `<span style="display:inline-flex;align-items:center;justify-content:center;
               width:16px;height:16px;border-radius:50%;background:#ffd54f;color:#5d4037;
               font-size:10px;font-weight:700;margin-left:5px;cursor:help"
               title="Champ calcule : ${a.formula || ''}">&#9654;</span>`
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
      <td>
        <div class="td-actions">
          <button class="action-btn"
            onclick="editAttribute(${a.id})">Modifier</button>
          <button class="action-btn-danger"
            onclick="confirmDelete('attr',${a.id},'${a.name.replace(/'/g,"\\'")}')">
            Suppr.
          </button>
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
  document.getElementById('ea-formula').value  = a.formula || '';
  document.getElementById('ea-mask').value     = a.mask || '';

  // Code technique : lecture seule pour non-admin
  const codeEl = document.getElementById('ea-code');
  if (codeEl) codeEl.readOnly = currentUserRole !== 'admin';

  const gSel = document.getElementById('ea-group');
  if (gSel) {
    gSel.innerHTML = '<option value="">-- Choisir --</option>';
    attrGroups.forEach(g => {
      gSel.innerHTML += `<option value="${g.id}"${g.id === a.groupId ? ' selected' : ''}>${g.name}</option>`;
    });
  }
  const optWrap = document.getElementById('ea-options-wrap');
  if (optWrap) {
    optWrap.style.display = (a.type === 'Simple select' || a.type === 'Multi select') ? '' : 'none';
    document.getElementById('ea-options').value = (a.options || []).join('\n');
  }
  showPage('admin-attribute-edit', null);
}

function onEditAttrTypeChange() {
  const type    = document.getElementById('ea-type').value;
  const optWrap = document.getElementById('ea-options-wrap');
  if (optWrap) optWrap.style.display = (type === 'Simple select' || type === 'Multi select') ? '' : 'none';
}

function saveAttributeEdit() {
  const a = attributes.find(x => x.id === editingAttrId);
  if (!a) return;
  const newName = document.getElementById('ea-name').value.trim();
  const newCode = currentUserRole === 'admin'
    ? document.getElementById('ea-code').value.trim()
    : a.code; // non-admin ne peut pas modifier le code
  if (!newName || !newCode) { showNotif('Nom et code obligatoires'); return; }
  if (newCode !== a.code && attributes.find(x => x.code === newCode)) {
    showNotif('Code deja utilise par un autre attribut'); return;
  }
  const oldGroupId  = a.groupId;
  const newGroupId  = parseInt(document.getElementById('ea-group').value) || null;
  const newType     = document.getElementById('ea-type').value;
  const isCalc      = newType === 'Texte calcule' || newType === 'Nombre calcule';
  a.name     = newName;
  a.code     = newCode;
  a.type     = newType;
  a.required = document.getElementById('ea-required').value === '1';
  a.calc     = isCalc;
  a.formula  = document.getElementById('ea-formula').value.trim();
  a.mask     = document.getElementById('ea-mask').value.trim();
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

function createAttribute() {
  const nameEl    = document.getElementById('new-attr-name');
  const codeEl    = document.getElementById('new-attr-code');
  const typeEl    = document.getElementById('new-attr-type');
  const groupEl   = document.getElementById('new-attr-group');
  const reqEl     = document.getElementById('new-attr-required');
  const maskEl    = document.getElementById('new-attr-mask');
  const formulaEl = document.getElementById('new-attr-formula');

  if (!nameEl || !codeEl || !typeEl) {
    showNotif('Erreur : champs introuvables', 'error');
    return;
  }

  const name     = nameEl.value.trim();
  const code     = codeEl.value.trim();
  const type     = typeEl.value;
  const groupId  = groupEl && groupEl.value ? parseInt(groupEl.value) : null;
  const required = reqEl ? reqEl.value === '1' : false;
  const mask     = maskEl    ? maskEl.value.trim()    : '';
  const formula  = formulaEl ? formulaEl.value.trim() : '';

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
    mask,
    formula,
    calc:    !!formula,
    options: [],
  };
  attributes.push(newAttr);

  if (groupId) {
    const g = getGroupById(groupId);
    if (g && !g.attrIds.includes(newAttr.id)) g.attrIds.push(newAttr.id);
  }

  nameEl.value  = '';
  codeEl.value  = '';
  typeEl.value  = 'Texte';
  if (maskEl)    maskEl.value    = '';
  if (formulaEl) formulaEl.value = '';

  closeModal('modal-create-attr');
  renderAttrsTable();
  renderAdminHome();
  showNotif('Attribut "' + name + '" cree');
}

function onNewAttrTypeChange() {
  const type = (document.getElementById('new-attr-type') || {}).value || '';
  const wrap = document.getElementById('new-attr-formula-wrap');
  if (wrap) wrap.style.display = type === 'Image' ? 'none' : '';
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
          ${g.isBrandGroup
            ? '<span class="attr-group-badge-system" style="background:#fce4ec;color:#880e4f">Marque/Fourn.</span>'
            : ''}
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:12px;color:#a0b0c0">${attrs.length} attribut${attrs.length > 1 ? 's' : ''}</span>
          <button class="action-btn" onclick="editAttrGroup(${g.id})">Editer</button>
          <button class="action-btn-danger"
            onclick="confirmDelete('group',${g.id},'${g.name}')">Supprimer</button>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">
        ${g.isBrandGroup
          ? `<span class="attr-chip" style="background:#fce4ec;color:#880e4f">Fournisseur</span>
             <span class="attr-chip" style="background:#fce4ec;color:#880e4f">Marque</span>
             <span class="attr-chip" style="background:#fce4ec;color:#880e4f">Conditions commerciales</span>
             <em style="font-size:11px;color:#a0b0c0;margin-left:4px">Gere automatiquement</em>`
          : attrs.map(a =>
              `<span class="attr-chip" style="background:${color.bg};color:${color.text}">${a.name}</span>`
            ).join('')}
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
  if (g.isBrandGroup) {
    list.innerHTML = `<div style="font-size:13px;color:#880e4f;padding:12px;background:#fce4ec;border-radius:8px">
      Ce groupe est gere automatiquement (Fournisseur / Marque / Conditions commerciales).<br>
      Son contenu est parametrable depuis la section Marques / Fournisseurs.
    </div>`;
    return;
  }
  attributes.forEach(attr => {
    const isOn = g.attrIds.includes(attr.id);
    const row  = document.createElement('div');
    row.className         = 'attr-toggle-row';
    row.dataset.attrName  = attr.name.toLowerCase();
    row.innerHTML = `
      <div class="attr-toggle-info">
        <div class="attr-toggle-name">${attr.name}</div>
        <div class="attr-toggle-meta">${attr.type}</div>
      </div>
      <div class="toggle ${isOn ? 'on' : ''}" data-attr-id="${attr.id}"
        onclick="this.classList.toggle('on')"></div>`;
    list.appendChild(row);
  });
}

function filterGroupAttrToggles(v) {
  document.querySelectorAll('#group-attr-toggle-list .attr-toggle-row').forEach(r => {
    r.style.display = r.dataset.attrName.includes(v.toLowerCase()) ? '' : 'none';
  });
}

function saveGroupEdit() {
  const g = attrGroups.find(x => x.id === editingGroupId);
  if (!g) return;
  g.name = document.getElementById('edit-group-name').value.trim() || g.name;
  g.code = document.getElementById('edit-group-code').value.trim() || g.code;
  if (!g.isBrandGroup) {
    g.attrIds = [];
    document.querySelectorAll('#group-attr-toggle-list .toggle').forEach(t => {
      if (t.classList.contains('on')) g.attrIds.push(parseInt(t.dataset.attrId));
    });
  }
  renderAll();
  showPage('admin-groups', null);
  showNotif('Groupe mis a jour');
}

function createAttrGroup() {
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
  roles.forEach(role => {
    const card = document.createElement('div');
    card.className = 'role-card';
    let permsHtml = '<div class="perm-section-title">Administration</div>';
    permsHtml += permRow(role, 'gestion_roles', 'Gestion des roles', '');
    permsHtml += '<div class="perm-section-title">Categories de produit</div>';
    categories.forEach(cat => { permsHtml += permRow(role, 'cat_' + cat.id, cat.name, cat.color); });
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
  const rows = [
    { label: 'Fournisseur',          val: brandInfo.sup },
    { label: 'RF',                   val: brandInfo.rf > 0 ? (brandInfo.rf * 100).toFixed(2) + '%' : '—' },
    { label: 'RFA',                  val: brandInfo.rfa > 0 ? (brandInfo.rfa * 100).toFixed(2) + '%' : '—' },
    { label: 'Marge interne',        val: `<strong style="color:#1565c0;font-size:14px">${(brandInfo.margeInterne * 100).toFixed(0)}%</strong>` },
    { label: 'Reprise echange',      val: brandInfo.repriseEchange ? '<span class="badge-active-on">Oui</span>' : '<span class="badge-active-off">Non</span>' },
    { label: 'Conditions livraison', val: brandInfo.conditionsLivraison || '—' },
    { label: 'Commentaire',          val: brandInfo.commentaire ? `<span style="font-size:12px;color:#607080">${brandInfo.commentaire}</span>` : '—' },
  ];
  let html = `<div class="field-group-title">Conditions — ${brandInfo.marque}</div>`;
  rows.forEach(r => {
    html += `<div class="field-row" style="display:flex;justify-content:space-between;
      align-items:center;padding:5px 0;border-bottom:1px solid #f0f4f8">
      <div class="field-label" style="margin:0;flex:1">${r.label}</div>
      <div style="font-size:13px;color:#1a2332;text-align:right">${r.val}</div>
    </div>`;
  });
  return html;
}
function permRow(role, key, label, color) {
  const p   = role.perms[key] || { r: false, w: false, d: false };
  const dot = color ? `<span class="cat-dot" style="background:${color}"></span>` : '';
  return `<div class="perm-row">
    <span class="perm-label">${dot}${label}</span>
    <div class="perm-actions">
      <button class="perm-icon-btn ${p.r ? 'active-read' : ''}" title="Consulter"
        onclick="togglePerm(${role.id},'${key}','r',this)">&#128065;</button>
      <button class="perm-icon-btn ${p.w ? 'active-write' : ''}" title="Modifier"
        onclick="togglePerm(${role.id},'${key}','w',this)">&#9999;&#65039;</button>
      <button class="perm-icon-btn ${p.d ? 'active-delete' : ''}" title="Supprimer"
        onclick="togglePerm(${role.id},'${key}','d',this)">&#128465;&#65039;</button>
    </div>
  </div>`;
}

function togglePerm(roleId, key, type, btn) {
  const role = roles.find(r => r.id === roleId);
  if (!role) return;
  if (!role.perms[key]) role.perms[key] = { r: false, w: false, d: false };
  role.perms[key][type] = !role.perms[key][type];
  btn.classList.toggle(type === 'r' ? 'active-read' : type === 'w' ? 'active-write' : 'active-delete');
}

// ============================================================
// ADMIN — PRODUITS (creation via products.js)
// ============================================================
function confirmDelete(type, id, name) {
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
    attributes  = attributes.filter(a => a.id !== pendingDelete.id);
    attrGroups.forEach(g => { g.attrIds = g.attrIds.filter(id => id !== pendingDelete.id); });
    syntheseItems = syntheseItems.filter(i => !(i.kind === 'attr' && i.code === attributes.find(a => a.id === pendingDelete.id)?.code));
  }
  else if (pendingDelete.type === 'product')
    products = products.filter(p => p.id !== pendingDelete.id);
  else if (pendingDelete.type === 'group') {
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
            style="width:120px">
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
            style="width:120px">
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

function renderSuppliersPage() {
  const page = document.getElementById('page-admin-suppliers');
  if (!page) return;

  let rows = '';
  brandSettings.forEach((b, i) => {
    const sup = suppliers.find(s => s.code === b.fournisseurCode);
    const cat = categories.find(c => c.name === b.type);
    const typeBadge = cat
      ? `<span class="badge" style="background:${cat.color}22;color:${cat.color};
           border:1px solid ${cat.color}55">${b.type}</span>`
      : (b.type
          ? `<span class="badge badge-grey">${b.type}</span>`
          : '—');
    rows += `<tr>
      <td style="font-weight:600">${sup ? sup.name : b.fournisseurCode}</td>
      <td>${b.marque}</td>
      <td>${typeBadge}</td>
      <td>${b.rf > 0 ? (b.rf * 100).toFixed(2) + '%' : '—'}</td>
      <td>${b.rfa > 0 ? (b.rfa * 100).toFixed(2) + '%' : '—'}</td>
      <td><strong style="color:#1565c0">${(b.margeInterne * 100).toFixed(0)}%</strong></td>
      <td>${b.repriseEchange
        ? '<span class="badge-active-on">Oui</span>'
        : '<span class="badge-active-off">Non</span>'}</td>
      <td>
        <div class="td-actions">
          <button class="action-btn" onclick="editBrandSetting(${i})">Modifier</button>
          <button class="action-btn-danger"
            onclick="confirmDelete('brand',${i},'${b.marque}')">Suppr.</button>
        </div>
      </td>
    </tr>`;
  });

  page.innerHTML = `
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px">
      <button class="btn btn-secondary"
        onclick="showPage('admin',null)">&larr; Administration</button>
      <button class="btn btn-primary"
        onclick="openModal('modal-create-brand')">+ Nouvelle marque</button>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Fournisseur</th>
            <th>Marque</th>
            <th>Type</th>
            <th>RF</th>
            <th>RFA</th>
            <th>Marge interne</th>
            <th>Reprise echange</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
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
        ${b.remiseAts > 0 ? (b.remiseAts * 100).toFixed(0) + '%' : '—'}
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

function editBrandSetting(i) {
  const b = brandSettings[i];
  if (!b) return;

  // Construire la liste des fournisseurs et categories pour les selects
  const supOptions = suppliers.map(s =>
    `<option value="${s.code}" ${s.code === b.fournisseurCode ? 'selected' : ''}>
      ${s.name}
    </option>`
  ).join('');

  const catOptions = categories.map(c =>
    `<option value="${c.name}" ${c.name === b.type ? 'selected' : ''}>
      ${c.name}
    </option>`
  ).join('');

  // Ouvrir une modale generique de modification
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-title">Modifier — ${b.marque}</div>
      <div class="field-row">
        <div class="field-label">Fournisseur</div>
        <select class="form-select" id="eb-sup">${supOptions}</select>
      </div>
      <div class="field-row">
        <div class="field-label">Marque</div>
        <input class="field-input" id="eb-marque" value="${b.marque}">
      </div>
      <div class="field-row">
        <div class="field-label">Type</div>
        <select class="form-select" id="eb-type">${catOptions}</select>
      </div>
      <div class="field-row">
        <div class="field-label">RF (%)</div>
        <input class="field-input" id="eb-rf" type="number" step="0.01"
          value="${((b.rf || 0) * 100).toFixed(2)}">
      </div>
      <div class="field-row">
        <div class="field-label">RFA (%)</div>
        <input class="field-input" id="eb-rfa" type="number" step="0.01"
          value="${((b.rfa || 0) * 100).toFixed(2)}">
      </div>
      <div class="field-row">
        <div class="field-label">Marge interne (%)</div>
        <input class="field-input" id="eb-marge" type="number" step="1"
          value="${((b.margeInterne || 0) * 100).toFixed(0)}">
      </div>
      <div class="field-row">
        <div class="field-label">Reprise echange</div>
        <select class="form-select" id="eb-reprise">
          <option value="1" ${b.repriseEchange ? 'selected' : ''}>Oui</option>
          <option value="0" ${!b.repriseEchange ? 'selected' : ''}>Non</option>
        </select>
      </div>
      <div class="field-row">
        <div class="field-label">Conditions livraison</div>
        <input class="field-input" id="eb-livraison"
          value="${b.conditionsLivraison || ''}">
      </div>
      <div class="field-row">
        <div class="field-label">Commentaire</div>
        <input class="field-input" id="eb-commentaire"
          value="${b.commentaire || ''}">
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
          Annuler
        </button>
        <button class="btn btn-primary" onclick="saveBrandSetting(${i},this)">
          Enregistrer
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function saveBrandSetting(i, btn) {
  const b = brandSettings[i];
  if (!b) return;

  b.fournisseurCode     = document.getElementById('eb-sup').value;
  b.marque              = document.getElementById('eb-marque').value.trim();
  b.type                = document.getElementById('eb-type').value;
  b.rf                  = parseFloat(document.getElementById('eb-rf').value) / 100 || 0;
  b.rfa                 = parseFloat(document.getElementById('eb-rfa').value) / 100 || 0;
  b.margeInterne        = parseFloat(document.getElementById('eb-marge').value) / 100 || 0;
  b.repriseEchange      = document.getElementById('eb-reprise').value === '1';
  b.conditionsLivraison = document.getElementById('eb-livraison').value.trim();
  b.commentaire         = document.getElementById('eb-commentaire').value.trim();

  btn.closest('.modal-overlay').remove();
  renderSuppliersPage();
  showNotif('Marque "' + b.marque + '" mise a jour');
}

function filterSuppliersTable() {
  const q = (document.getElementById('supplier-search') || {}).value || '';
  renderSuppliersTable(q);
}

function openBrandEditor(idx) {
  editingBrandIdx = idx;
  const isNew = idx === -1;
  const b = isNew
    ? { fournisseurCode: '', marque: '', type: '', rf: 0, rfa: 0, remiseAts: 0,
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
          <input class="field-input" type="number" step="0.01" id="be-rf"
            value="${(b.rf * 100).toFixed(2)}">
        </div>
        <div class="form-field">
          <div class="form-label">RFA %</div>
          <input class="field-input" type="number" step="0.01" id="be-rfa"
            value="${(b.rfa * 100).toFixed(2)}">
        </div>
        <div class="form-field">
          <div class="form-label">Remise ATS %</div>
          <input class="field-input" type="number" step="0.01" id="be-remise-ats"
            value="${(b.remiseAts * 100).toFixed(2)}">
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
  const marque         = (document.getElementById('be-marque').value || '').trim();
  const fournisseurCode = document.getElementById('be-supplier').value;
  if (!marque || !fournisseurCode) { showNotif('Fournisseur et marque obligatoires'); return; }
  const entry = {
    marque, fournisseurCode,
    type:               document.getElementById('be-type').value,
    rf:                 parseFloat(document.getElementById('be-rf').value || 0) / 100,
    rfa:                parseFloat(document.getElementById('be-rfa').value || 0) / 100,
    remiseAts:          parseFloat(document.getElementById('be-remise-ats').value || 0) / 100,
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
