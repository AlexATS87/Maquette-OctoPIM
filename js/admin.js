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
        Vue Synthèse — colonnes
      </span>
    </div>

    <div style="display:grid;grid-template-columns:1fr 320px;gap:20px;max-width:1000px">

      <div class="field-group">
        <div class="field-group-title">
          Colonnes actives
          <span class="tab-count${syntheseItems.filter(x => x.kind === 'attr').length >= SYNTH_MAX_FIELDS ? ' synth-full' : ''}">${syntheseItems.filter(x => x.kind === 'attr').length} / ${SYNTH_MAX_FIELDS}</span>
          <span style="font-size:12px;font-weight:400;color:#a0b0c0">
            (glisser pour réordonner)
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
          <div class="field-group-title">Visuel de la synthèse</div>
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
          <div class="field-group-title">Attributs système</div>
          ${attributes.filter(a => a.system).map(s => {
            const already = isInSynthese(s.code);
            return `
            <div style="display:flex;align-items:center;justify-content:space-between;
              padding:5px 0;border-bottom:1px solid #f0f4f8">
              <span style="font-size:12px;color:#607080;display:inline-flex;align-items:center;gap:6px">
                ${escapeHtml(s.name)}${attrLockBadge(s)}
              </span>
              ${already
                ? `<span style="font-size:11px;color:#a0b0c0">Déjà ajouté</span>`
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
  showNotif(code ? 'Visuel de la synthèse mis à jour' : 'Visuel retiré de la synthèse', 'ok');
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
  if (syntheseItems.filter(x => x.kind === 'attr').length >= SYNTH_MAX_FIELDS) {
    showNotif('La vue synthèse est limitée à ' + SYNTH_MAX_FIELDS + ' champs : retirez-en un avant d’en ajouter un autre', 'warn'); return;
  }
  if (isInSynthese(code)) {
    showNotif(label + ' est déjà dans la vue synthèse', 'warn'); return;
  }
  syntheseItems.push({ code, label, kind: 'attr' });
  renderSyntheseAdmin();
  showNotif(label + ' ajouté');
}

function addSyntheseAttr() {
  if (!requirePerm(canMod('mod_synthese', 'w'))) return;
  const sel = document.getElementById('synth-add-attr');
  if (!sel || !sel.value) { showNotif('Choisissez un attribut', 'warn'); return; }
  const attr = attributes.find(a => a.id === parseInt(sel.value));
  if (!attr) return;
  if (syntheseItems.find(x => x.code === attr.code)) {
    showNotif('Cet attribut est déjà dans la vue synthèse', 'warn'); return;
  }
  if (syntheseItems.filter(x => x.kind === 'attr').length >= SYNTH_MAX_FIELDS) {
    showNotif('La vue synthèse est limitée à ' + SYNTH_MAX_FIELDS + ' champs : retirez-en un avant d’en ajouter un autre', 'warn'); return;
  }
  syntheseItems.push({ code: attr.code, label: attr.name, kind: 'attr' });
  renderSyntheseAdmin();
  showNotif(attr.name + ' ajouté à la vue synthèse');
}

function addSyntheseAction() {
  if (!requirePerm(canMod('mod_synthese', 'w'))) return;
  const sel = document.getElementById('synth-add-action');
  if (!sel || !sel.value) { showNotif('Choisissez une action', 'warn'); return; }
  const code  = sel.value.replace('action_', '');
  const label = sel.options[sel.selectedIndex].text;
  if (syntheseItems.find(x => x.code === code && x.kind === 'action')) {
    showNotif('Cette action est déjà présente', 'warn'); return;
  }
  syntheseItems.push({ code, label, kind: 'action' });
  renderSyntheseAdmin();
  showNotif('Action "' + label + '" ajoutée');
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
        ${canW ? `<button class="action-btn" onclick="editCategory(${cat.id})">Modifier</button>`
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
    list.innerHTML = '<div style="font-size:12px;color:#a0b0c0;padding:8px">Tous les groupes sont déjà associés.</div>';
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
  showNotif('Catégorie mise à jour');
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
    showNotif('Ce code existe déjà', 'error'); codeEl.focus(); return;
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
  showNotif('Catégorie "' + name + '" créée');
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
      Complétion <span style="color:#8a9bb0;font-size:11px">&#8645;</span>
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
        ${attrLockBadge(a)}
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
          fill.pct === 0 ? ' — attribut candidat à la suppression' : ''}">
        <strong style="color:${fill.pct === 0 ? '#ef5350' : getCompletionColor(fill.pct)}">
          ${fill.pct}%
        </strong>
      </td>
      <td class="td-icon">
        ${(!isProtectedAttr(a) && canMod('mod_attributes','d'))
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
    : 'Option clic désactivée');
}

// ============================================================
// ADMIN — ATTRIBUTS — EDITION
// ============================================================
let editingAttrId = null;

function editAttribute(id, draft) {
  editingAttrId = id;
  const a = draft || attributes.find(x => x.id === id);
  if (!a) return;
  if (!draft) _newAttrDraft = null;
  // Création : le code se déduit du nom ; modification : il ne bouge plus seul
  const nameInput = document.getElementById('ea-name');
  if (nameInput) nameInput.oninput = draft ? () => autoSlug('ea-name', 'ea-code') : null;
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
  const sheetEl = document.getElementById('ea-onsheet');
  if (sheetEl) sheetEl.value = a.hideOnSheet ? '0' : '1';
  const calcEl = document.getElementById('ea-calc');
  if (calcEl) { calcEl.value = (a.calc || a.formula) ? '1' : '0'; calcEl.disabled = !!a.system; }
  onEaCalcChange();
  const maskEl = document.getElementById('ea-mask');
  if (maskEl) maskEl.readOnly = !!a.system;
  const helpEl = document.getElementById('ea-helptext');
  if (helpEl) helpEl.value = a.helpText || '';
  const sufEl = document.getElementById('ea-file-suffix');
  if (sufEl) sufEl.value = a.fileSuffix || '';
  const imgWrap = document.getElementById('ea-img-wrap');
  if (imgWrap) imgWrap.style.display = a.type === 'Image' ? '' : 'none';
  document.getElementById('ea-mask').value     = a.mask || '';
  document.getElementById('ea-maxlength').value = a.maxLength || '';
  document.getElementById('ea-step-enabled').value = a.stepEnabled ? '1' : '0';
  document.getElementById('ea-step').value = a.step ?? '';
  document.getElementById('ea-min').value  = a.min  ?? '';
  document.getElementById('ea-max').value  = a.max  ?? '';
  const fmtEl = document.getElementById('ea-format');
  if (fmtEl) fmtEl.value = a.displayFormat === 'percent' ? 'percent' : '';
  const decEl = document.getElementById('ea-decimals');
  if (decEl) decEl.value = String(a.decimals === 1 || a.decimals === 2 ? a.decimals : 0);

  // Code technique : lecture seule pour non-admin
  const codeEl = document.getElementById('ea-code');
  if (codeEl) codeEl.readOnly = draft ? false : (!isTechAdmin() || !!a.system);
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
    ? 'Attribut système : consultation seule.'
    : 'Consultation seule : votre rôle ne permet pas de modifier les attributs.');
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
  updateTopbarTitle(draft ? 'Nouvel attribut' : 'Attribut « ' + a.name + ' »');
  setTimeout(snapshotAttrForm, 0);
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
  const imgWrapT = document.getElementById('ea-img-wrap');
  if (imgWrapT) imgWrapT.style.display = type === 'Image' ? '' : 'none';
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
  sel.innerHTML = '<option value="">Toujours affiché</option>' +
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
  const wanted = selectedValue != null ? showIfValues(selectedValue) : readShowIfChecked(prefix);
  valSel.innerHTML = showIfValueOptions(pilot).map((o, i) =>
    `<label class="showif-val"><input type="checkbox" id="${prefix}-siv-${i}" value="${escapeHtml(o)}"${wanted.includes(o) ? ' checked' : ''}> ${escapeHtml(o)}</label>`
  ).join('');
}

function readShowIfChecked(prefix) {
  const box = document.getElementById(prefix + '-show-if-value');
  return box ? [...box.querySelectorAll('input[type=checkbox]:checked')].map(x => x.value) : [];
}

// Affichage conditionnel : une ou plusieurs valeurs du champ pilote
function readShowIf(prefix) {
  const sel = document.getElementById(prefix + '-show-if');
  if (!sel || !sel.value) return { showIfAttr: '', showIfValue: '' };
  const vals = readShowIfChecked(prefix);
  return vals.length ? { showIfAttr: sel.value, showIfValue: vals.join(' ; ') } : { showIfAttr: '', showIfValue: '' };
}

function onEditAttrTypeChange() {
  const type    = document.getElementById('ea-type').value;
  const optWrap = document.getElementById('ea-options-wrap');
  if (optWrap) optWrap.style.display = (type === 'Simple select' || type === 'Multi select') ? '' : 'none';
  const lenWrap = document.getElementById('ea-maxlength-wrap');
  if (lenWrap) lenWrap.style.display = type === 'Texte long' ? '' : 'none';
  const imgWrapT = document.getElementById('ea-img-wrap');
  if (imgWrapT) imgWrapT.style.display = type === 'Image' ? '' : 'none';
  const numWrap = document.getElementById('ea-number-wrap');
  if (numWrap) numWrap.style.display = type === 'Nombre' ? '' : 'none';
  renderFormulaHelp('ea-formula-help', type);
  renderMaskHelp('ea-mask-help', type);
}

// ------------------------------------------------------------
// CODE TECHNIQUE : où il est utilisé, et report d'un nouveau code partout
// ------------------------------------------------------------
// Codes cités dans une formule hors des textes entre guillemets
function formulaUsesCode(f, code) {
  if (!f) return false;
  const re = new RegExp('(^|[^A-Za-z0-9_])' + code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z0-9_])');
  return String(f).split(/("[^"]*")/).some((part, i) => i % 2 === 0 && re.test(part));
}
function replaceCodeInFormula(f, oldC, newC) {
  if (!f) return f;
  const re = new RegExp('(^|[^A-Za-z0-9_])' + oldC.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z0-9_])', 'g');
  return String(f).split(/("[^"]*")/).map((part, i) => i % 2 ? part : part.replace(re, '$1' + newC)).join('');
}

function attrCodeUsages(code) {
  const out = [];
  const names = list => list.map(x => x.name).join(', ');
  const f = attributes.filter(x => x.code !== code && formulaUsesCode(x.formula, code));
  if (f.length) out.push({ label: f.length + ' formule' + (f.length > 1 ? 's' : ''), now: names(f) });
  const t = calcTables.filter(x => x.attrCode === code || x.conditions.some(c => c.attrCode === code));
  if (t.length) out.push({ label: t.length + ' table' + (t.length > 1 ? 's' : '') + ' de calcul', now: t.map(x => calcAttrName(x.attrCode)).join(', ') });
  const w = workflowSteps.filter(x => x.rule && x.rule.attrCode === code);
  if (w.length) out.push({ label: 'Workflow', now: names(w) });
  const al = alerts.filter(x => x.attrCode === code || (x.conds || []).some(c => c.attrCode === code));
  if (al.length) out.push({ label: 'Alertes', now: names(al) });
  const sh = attributes.filter(x => x.showIfAttr === code);
  if (sh.length) out.push({ label: 'Affichage conditionnel', now: names(sh) });
  if (syntheseItems.some(i => synthCodeAliases(i.code).includes(code))) out.push({ label: 'Vue synthèse', now: 'colonne de la liste' });
  (refTables || []).forEach(t => {
    const ks = Object.keys(t.keys || {}).filter(c => t.keys[c] === code);
    if (ks.length) out.push({ label: 'Référentiel « ' + t.name + ' »', now: 'colonne clé ' + ks.join(', ') });
  });
  (trames || []).forEach(f => {
    const n = (f.columns || []).filter(c => c.code === code).length;
    if (n) out.push({ label: 'Trame « ' + f.name + ' »', now: n + ' colonne' + (n > 1 ? 's' : '') });
  });
  const n = products.filter(p => p.fields && String(p.fields[code] ?? '').trim() !== '').length;
  if (n) out.push({ label: n + ' produit' + (n > 1 ? 's' : ''), now: 'valeurs déplacées sous le nouveau code' });
  return out;
}

function renameAttrCodeEverywhere(oldC, newC) {
  products.forEach(p => {
    if (p.fields && Object.prototype.hasOwnProperty.call(p.fields, oldC)) { p.fields[newC] = p.fields[oldC]; delete p.fields[oldC]; }
    if (p.forcedFields && Object.prototype.hasOwnProperty.call(p.forcedFields, oldC)) { p.forcedFields[newC] = p.forcedFields[oldC]; delete p.forcedFields[oldC]; }
  });
  attributes.forEach(x => {
    if (x.formula) x.formula = replaceCodeInFormula(x.formula, oldC, newC);
    if (x._altFormula) x._altFormula = replaceCodeInFormula(x._altFormula, oldC, newC);
    if (x.showIfAttr === oldC) x.showIfAttr = newC;
  });
  calcTables.forEach(t => {
    if (t.attrCode === oldC) t.attrCode = newC;
    t.conditions.forEach(c => { if (c.attrCode === oldC) c.attrCode = newC; });
  });
  workflowSteps.forEach(w => { if (w.rule && w.rule.attrCode === oldC) w.rule.attrCode = newC; });
  alerts.forEach(al => {
    if (al.attrCode === oldC) al.attrCode = newC;
    (al.conds || []).forEach(c => { if (c.attrCode === oldC) c.attrCode = newC; });
  });
  (refTables || []).forEach(t => Object.keys(t.keys || {}).forEach(c => { if (t.keys[c] === oldC) t.keys[c] = newC; }));
  (trames || []).forEach(f => (f.columns || []).forEach(c => { if (c.code === oldC) c.code = newC; }));
  syntheseItems.forEach(i => { if (i.kind === 'attr' && i.code === oldC) i.code = newC; });
}

let _codeChangeOk = false;

// Création d'un attribut : même page que la modification
let _newAttrDraft = null;
function openNewAttribute() {
  if (!requirePerm(canMod('mod_attributes', 'w'))) return;
  _newAttrDraft = { id: 'new', name: '', code: '', type: '', groupId: null, required: false, inCompletion: true,
    calc: false, formula: '', mask: '', options: [], system: false };
  editAttribute('new', _newAttrDraft);
}

function saveAttributeEdit() {
  if (!requirePerm(canMod('mod_attributes', 'w'))) return;
  const isNew = editingAttrId === 'new';
  const a = isNew ? _newAttrDraft : attributes.find(x => x.id === editingAttrId);
  if (!a) return;
  if (a.system) {
    showNotif('Attribut système : modification impossible', 'warn');
    return;
  }
  const newName = document.getElementById('ea-name').value.trim();
  const newCode = isNew || (isTechAdmin() && !a.system)
    ? document.getElementById('ea-code').value.trim()
    : a.code; // non-admin et attributs systeme : code fige
  const typeChosen = a.system ? a.type : document.getElementById('ea-type').value;
  if (!newName || !newCode || !typeChosen) { showNotif('Nom, code technique et type obligatoires', 'error'); return; }
  if (!/^[a-z0-9_]+$/.test(newCode)) { showNotif('Code technique : minuscules, chiffres et _ seulement', 'error'); return; }
  if (newCode !== a.code && attributes.find(x => x.code === newCode)) {
    showNotif('Code déjà utilisé par un autre attribut', 'error'); return;
  }
  // Changement de code d'un attribut existant : cas d'urgence, impacts affichés
  if (!isNew && newCode !== a.code && !_codeChangeOk) {
    const items = attrCodeUsages(a.code);
    items.push({ label: 'Fichiers d\'import et d\'export existants', now: 'à mettre à jour hors d\'OctoPIM' });
    openConfirmModal({ title: 'Changer le code technique',
      lead: '« ' + a.code + ' » devient « ' + newCode + ' ». Le nouveau code sera reporté partout dans OctoPIM :',
      items, okLabel: 'Changer le code',
      onOk: () => { _codeChangeOk = true; try { saveAttributeEdit(); } finally { _codeChangeOk = false; } } });
    return;
  }
  if (isNew) {
    a.id = Math.max(nextAttrId, ...attributes.map(x => x.id + 1));
    nextAttrId = a.id + 1;
    attributes.push(a);
    products.forEach(p => { if (p.fields && !Object.prototype.hasOwnProperty.call(p.fields, newCode)) p.fields[newCode] = ''; });
  }
  if (typeof calcCommit === 'function') calcCommit(a.code);
  const widthSave = document.getElementById('ea-width');
  if (widthSave) a.width = widthSave.value || undefined;
  const sheetSave = document.getElementById('ea-onsheet');
  if (sheetSave) a.hideOnSheet = sheetSave.value === '0' || undefined;
  const oldCode     = a.code;
  const oldGroupId  = a.groupId;
  const newGroupId  = a.system ? a.groupId : (parseInt(document.getElementById('ea-group').value) || null);
  const newType     = a.system ? a.type : document.getElementById('ea-type').value;
  if (!isNew && oldCode !== newCode) renameAttrCodeEverywhere(oldCode, newCode);
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
  const fmtSave = document.getElementById('ea-format');
  if (fmtSave) a.displayFormat = (newType === 'Nombre' && fmtSave.value === 'percent') ? 'percent' : undefined;
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
  const sufSave = document.getElementById('ea-file-suffix');
  if (sufSave) {
    const suf = sufSave.value.trim();
    const dup = suf && attributes.find(x => x !== a && x.type === 'Image' && importNorm(x.fileSuffix || '') === importNorm(suf));
    if (dup) { showNotif('Suffixe « ' + suf + ' » déjà utilisé par ' + dup.name, 'error'); return; }
    a.fileSuffix = newType === 'Image' && suf ? suf : undefined;
  }
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
  if (typeof _attrFormSnap !== 'undefined') _attrFormSnap = null; // enregistré : plus rien à signaler
  if (isNew) { editingAttrId = a.id; _newAttrDraft = null; }
  showPage('admin-attributes', null);
  showNotif('Attribut « ' + newName + ' » ' + (isNew ? 'créé' : 'mis à jour'));
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
    showNotif('Ce code technique existe déjà', 'error');
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
  showNotif('Attribut "' + name + '" créé');
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
  { token: '+ - * /',             help: 'Opérations arithmétiques sur les champs numériques. Exemple : =[prix_catalogue_monture] * 1.2' },
  { token: 'SI(condition)',              help: 'Renvoie Oui si la condition est vraie, Non sinon. Exemple : =SI([active_o]=="Actif")' },
  { token: 'SI(cond, siVrai, siFaux)',   help: 'Renvoie siVrai ou siFaux. siFaux peut etre un autre SI. Exemple : =SI([largeur_verres]>=56,"Adulte L","Adulte M")' },
  { token: 'OU / ET',             help: 'Combine plusieurs conditions dans un SI. Exemple : =SI([a]==VRAI OU [b]==VRAI)' },
  { token: '== != > < >= <=',     help: 'Comparaisons utilisables dans un SI.' },
  { token: 'VRAI / FAUX',         help: 'Valeurs booleennes. Un champ Oui / Non vaut VRAI quand il contient Oui.' },
  { token: 'DATE_MAJ(code)',      help: 'Horodate la derniere modification du champ cite. Reserve aux attributs de type Date.' },
  { token: 'MAP(code,"A"="1")',  help: 'Remplace une valeur par une autre, sur un seul champ. Exemple : MAP(optique_solaire,"Optique"="A","Solaire"="B")' },
  { token: 'ROUNDUP(n, 0)',      help: 'Arrondit a l entier superieur, ou au nombre de decimales indique. Exemple : ROUNDUP([prix_base]*[coefficient], 0)' },
  { token: 'RECHERCHE("réf", [champ], "colonne")', help: 'Valeur d’une colonne d’un référentiel, pour la ligne qui correspond au champ. Référentiels : ceux d’Administration > Référentiels (Fournisseurs, Marques et ceux créés), la première colonne est la clé. Exemple : RECHERCHE("Fournisseurs",[fournisseur_code],"Trigramme")' },
  { token: 'TABLE()',            help: 'Le champ est calculé par une table du module Champs calculés (conditions sur d\'autres champs, première ligne vraie). La table se crée et se modifié dans ce module, pas ici.' },
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
  // Un attribut pas encore créé n'a pas de calcul à régler
  if (btn) btn.style.display = on && canMod('mod_calc', 'r') && editingAttrId !== 'new' ? '' : 'none';
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
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:12px;color:#a0b0c0">${attrs.length} attribut${attrs.length > 1 ? 's' : ''}</span>
          <button class="action-btn" onclick="editAttrGroup(${g.id})">${canMod('mod_groups','w') ? 'Modifier' : 'Voir'}</button>
          ${(!isProtectedGroup(g) && canMod('mod_groups','d'))
            ? `<button class="action-btn-danger btn-trash" title="Supprimer le groupe"
                onclick="confirmDelete('group',${g.id},'${g.name}')">${TRASH_ICON}</button>`
            : ''}
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">
        ${attrs.length
          ? attrs.map(a =>
              `<span class="attr-chip" style="background:${color.bg};color:${color.text}">${isProtectedAttr(a) ? systemLockIcon() : ''}${escapeHtml(a.name)}</span>`
            ).join('')
          : ''}
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
    const locked = isProtectedAttr(a) && a.groupId === g.id;
    return `
      <div class="grp-item${flash}" ${drag}>
        <span class="drag-handle">&#8942;&#8942;</span>
        <span class="grp-name">${escapeHtml(a.name)}${attrLockBadge(a)}</span>
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
    if (isProtectedAttr(attr) && attr.groupId === g.id) {
      showNotif('Attribut système : impossible de le retirer du groupe', 'warn');
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
  showNotif('Groupe mis à jour');
}

function createAttrGroup() {
  if (!requirePerm(canMod('mod_groups', 'w'))) return;
  const name = document.getElementById('new-group-name').value.trim();
  const code = document.getElementById('new-group-code').value.trim();
  if (!name || !code) { showNotif('Nom, code technique et type obligatoires'); return; }
  attrGroups.push({
    id: nextGroupId++, name, code, system: false, attrIds: [],
    audienceGroupIds: readAudienceChecks('new-group-audience')
  });
  document.getElementById('new-group-name').value = '';
  document.getElementById('new-group-code').value = '';
  closeModal('modal-create-group');
  renderAll();
  showNotif('Groupe "' + name + '" créé');
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
    { key: 'groups', label: 'Groupes d’affectation', badge: `<span class="tab-count">${affectGroups.length}</span>` },
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
      <select class="form-select" style="max-width:200px" onchange="_accLevelFilter=this.value;renderRoles()">
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
  openConfirmModal({ title: 'Supprimer le groupe d’affectation', okLabel: 'Supprimer',
    lead: '« ' + g.name + ' » sera supprimé.' + (n ? ' Ses ' + n + ' membres n’auront plus de groupe et verront tout.' : ''),
    onOk: () => {
      users.forEach(u => { if (u.groupId === groupId) u.groupId = null; });
      affectGroups = affectGroups.filter(x => x.id !== groupId);
      attrGroups.forEach(ag => { ag.audienceGroupIds = (ag.audienceGroupIds || []).filter(id => id !== groupId); });
      afterAccessChange();
    } });
}


// ============================================================
// ADMIN — PRODUITS (creation via products.js)
// ============================================================
function confirmDelete(type, id, name) {
  if (type === 'product') {
    const p = products.find(x => x.id === id);
    if (!requirePerm(canDeleteProduct(p), 'Suppression produit non autorisée')) return;
  } else if (type === 'cat') {
    if (!requirePerm(canMod('mod_categories', 'd'), 'Suppression catégorie non autorisée')) return;
  } else if (type === 'attr') {
    if (!requirePerm(canMod('mod_attributes', 'd'), 'Suppression attribut non autorisée')) return;
    const a = attributes.find(x => x.id === id);
    if (isProtectedAttr(a)) {
      showNotif('Attribut système : suppression impossible', 'warn');
      return;
    }
  } else if (type === 'group') {
    if (!requirePerm(canMod('mod_groups', 'd'), 'Suppression groupe non autorisée')) return;
    const g = attrGroups.find(x => x.id === id);
    if (isProtectedGroup(g)) {
      showNotif('Groupe système : suppression impossible', 'warn');
      return;
    }
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
      showNotif('Attribut système : suppression impossible', 'warn');
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
      showNotif('Groupe système : suppression impossible', 'warn');
      pendingDelete = null;
      return;
    }
    attrGroups = attrGroups.filter(g => g.id !== pendingDelete.id);
    categories.forEach(c => { c.groupIds = c.groupIds.filter(id => id !== pendingDelete.id); });
  }
  closeModal('modal-confirm-delete');
  renderAll();
  showNotif('Élément supprimé');
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
      <div style="font-size:15px;font-weight:700;color:#1a2332;margin-bottom:20px">Préférences application</div>

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
        <div class="field-label" style="margin-bottom:6px">Seuil de complétion</div>
        <div style="display:flex;gap:10px;align-items:center">
          <input type="number" class="field-input" id="pref-seuil"
            value="${seuilCompletion}" min="0" max="100" step="5"
            style="width:120px" onwheel="event.preventDefault();this.blur()">
          <span style="font-size:12px;color:#a0b0c0">%</span>
        </div>
      </div>

      <div class="field-row" style="margin-bottom:24px">
        <div class="field-label" style="margin-bottom:6px">Import de visuels : nom des fichiers</div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <select class="form-select" id="pref-visual-key" style="width:160px">
            <option value="sap"${appPrefs.visualKey === 'sap' ? ' selected' : ''}>Code SAP</option>
            <option value="ean"${appPrefs.visualKey === 'ean' ? ' selected' : ''}>Code EAN/GTIN</option>
          </select>
          <span style="font-size:13px">+</span>
          <input class="field-input" id="pref-visual-sep" value="${escapeHtml(appPrefs.visualSep || '_')}" maxlength="3" style="width:60px;text-align:center" title="Séparateur">
          <span style="font-size:13px">+ suffixe du visuel</span>
          <span class="calc-meta">ex. ${escapeHtml(appPrefs.visualKey === 'ean' ? '200000636122' : 'M90538400001')}${escapeHtml(appPrefs.visualSep || '_')}face.jpg</span>
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
  const vk = (document.getElementById('pref-visual-key') || {}).value;
  const vs = ((document.getElementById('pref-visual-sep') || {}).value || '').trim();
  if (vk === 'sap' || vk === 'ean') appPrefs.visualKey = vk;
  if (vs) appPrefs.visualSep = vs;
  showPage('admin', null);
  renderAll();
  showNotif('Préférences enregistrées');
}

// ============================================================
// ADMIN — MARQUES / FOURNISSEURS
// ============================================================
function catBadgeHtml(typeName) {
  const cat = categories.find(c => c.name === typeName);
  if (!cat) return `<span class="badge badge-grey" style="font-size:11px">${typeName || '—'}</span>`;
  return `<span class="badge" style="font-size:11px;background:${cat.color}22;color:${cat.color};border:1px solid ${cat.color}55">${typeName}</span>`;
}

let _refTab = 'ref_conditions';
const _refSearch = {};
function setRefTab(id) {
  // une ligne ajoutée sans clé est abandonnée en changeant d'onglet
  allReferentials().forEach(R => {
    const data = R.data();
    for (let i = data.length - 1; i >= 0; i--) if (data[i]._new && R.cols.every(c => !String(data[i][c.prop] || '').trim())) data.splice(i, 1);
  });
  _refTab = id;
  renderSuppliersPage();
}

function renderSuppliersPage() {
  const page = document.getElementById('page-admin-suppliers');
  if (!page) return;
  const refs = allReferentials();
  if (!refs.some(x => x.id === _refTab)) _refTab = refs.length ? refs[0].id : null;
  page.innerHTML = `
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px">
      <button class="btn btn-secondary" onclick="showPage('admin',null)">&larr; Administration</button>
      <span style="font-size:15px;font-weight:700;color:#1a2332">Référentiels</span>
    </div>
    <div class="product-tabs-bar acc-tabs">
      ${refs.map(t => `<div class="tab${t.id === _refTab ? ' active' : ''}" onclick="setRefTab('${t.id}')">${escapeHtml(t.name)}<span class="tab-count">${t.data().length}</span></div>`).join('')}
      ${canMod('mod_conditions', 'w') ? `<div class="tab ref-tab-add" onclick="openNewReferentialModal()">+ Référentiel</div>` : ''}
    </div>
    <div class="acc-tab-body">${referentialTabHtml(refs.find(x => x.id === _refTab))}</div>`;
}

// ============================================================
// RÉFÉRENTIELS : onglets Fournisseurs, Marques et référentiels créés ici.
// Saisie dans le tableau, import d'un fichier (colonnes reconnues par leur
// nom), suppression refusée tant qu'une ligne ou une colonne est utilisée.
// ============================================================
function refKeyRows(attrCode, value) {
  let n = 0;
  (refTables || []).forEach(t => Object.keys(t.keys || {}).forEach(c => {
    if (t.keys[c] !== attrCode) return;
    n += t.rows.filter(r => refNorm(r[c]) === refNorm(value)).length;
  }));
  return n;
}
// Une ligne dont la clé unique est reliée à un attribut est « utilisée » par
// les produits qui ont cette valeur et par les autres référentiels qui ont
// une colonne clé sur le même attribut
function refRowUsage(R, row) {
  const keys = refKeysOf(R);
  const cols = Object.keys(keys);
  if (cols.length !== 1) return null;
  const code = keys[cols[0]], value = row[cols[0]];
  if (!String(value || '').trim()) return null;
  let rows = 0;
  (refTables || []).forEach(t => {
    if (t === R.table) return;
    Object.keys(t.keys || {}).forEach(c => { if (t.keys[c] === code) rows += t.rows.filter(x => refNorm(x[c]) === refNorm(value)).length; });
  });
  return { conds: rows, prods: products.filter(p => p.fields && refNorm(p.fields[code]) === refNorm(value)).length };
}
// Formules qui lisent un référentiel (et, au besoin, une de ses colonnes)
const REF_FORMULA_RES = [/RECHERCHE\s*\(\s*"([^"]+)"\s*,[^,]+,\s*"([^"]+)"\s*\)/gi, /R[EÉ]F[EÉ]RENTIEL\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/gi];
function refFormulaUsers(refName, colName) {
  return attributes.filter(a => [a.formula, a._altFormula].some(f => REF_FORMULA_RES.some(re0 => {
    const re = new RegExp(re0.source, 'gi');
    let m;
    while ((m = re.exec(f || ''))) {
      if (refNorm(m[1]) === refNorm(refName) && (!colName || refNorm(m[2]) === refNorm(colName))) return true;
    }
    return false;
  })));
}
// Attribut qui lit une colonne (formule REFERENTIEL) : il donne le format
function refColAttr(refName, colName) {
  return attributes.find(a => {
    const m = /^=?\s*R[EÉ]F[EÉ]RENTIEL\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)\s*$/i.exec(a.formula || '');
    return m && refNorm(m[1]) === refNorm(refName) && refNorm(m[2]) === refNorm(colName);
  }) || null;
}
function refAfterChange(msg) {
  (products || []).forEach(p => computeCalcFields(p));
  renderSuppliersPage();
  renderAdminHome();
  if (msg) showNotif(msg);
}

function refKeysOf(R) { return (R && R.table && R.table.keys) || {}; }
function refHasKeys(R) { return Object.keys(refKeysOf(R)).length > 0; }
function refRowUsageShown(R) { return Object.keys(refKeysOf(R)).length === 1; }
// Identifiant unique : la première colonne d'un référentiel qui a au plus une
// colonne clé (Fournisseurs, Marques, Pays…) ; en lecture seule une fois saisie
function refIsSoleKey(R, c) { return c.key && Object.keys(refKeysOf(R)).length <= 1; }
// La colonne qui définit elle-même la liste d'un attribut (Code des
// Fournisseurs pour l'attribut Fournisseur) se saisit en texte
function refDefinesList(R, attr) { return !!(attr && attr.listRef && refNorm(attr.listRef.ref) === refNorm(R.name)); }

function refCellHtml(R, row, i, c, ci, ro) {
  const v = row[c.prop] == null ? '' : String(row[c.prop]);
  const keyAttr = attributes.find(a => a.code === refKeysOf(R)[c.name]) || null;
  const valAttr = refColAttr(R.name, c.name);
  const on = `onchange="setRefCell('${R.id}',${i},${ci},this.value)"${ro}`;
  if (refIsSoleKey(R, c) && !row._new) return `<td style="font-weight:600">${escapeHtml(v)}</td>`;
  if (keyAttr && !refDefinesList(R, keyAttr)) {
    const opts = keyAttr.code === 'cat' ? categories.map(x => ({ v: x.name, l: x.name })) : attrSelectOptions(keyAttr);
    const known = !v || opts.some(o => o.v === v);
    return `<td><select class="form-select ref-cell-select" ${on}>
      <option value="">Toutes</option>
      ${known ? '' : `<option value="${escapeHtml(v)}" selected>${escapeHtml(v)}</option>`}
      ${opts.map(o => `<option value="${escapeHtml(o.v)}"${o.v === v ? ' selected' : ''}>${escapeHtml(o.l === o.v ? o.v : o.v + ' — ' + o.l)}</option>`).join('')}
    </select></td>`;
  }
  if (valAttr && valAttr.type === 'Oui / Non') {
    return `<td><select class="form-select ref-cell-select" ${on}>
      <option value=""></option>${['Oui', 'Non'].map(o => `<option${o === v ? ' selected' : ''}>${o}</option>`).join('')}</select></td>`;
  }
  if (valAttr && isPercentAttr(valAttr)) {
    const shown = v === '' ? '' : formatPercentDisplay(v);
    return `<td><span class="ref-pct"><input class="field-input" value="${escapeHtml(shown)}" ${on}><span>%</span></span></td>`;
  }
  return `<td><input class="field-input${c.mono ? ' ref-mono' : ''}" value="${escapeHtml(v)}"${c.max ? ` maxlength="${c.max}"` : ''} ${on}></td>`;
}

function referentialTabHtml(R) {
  if (!R) return '';
  const canW = canMod('mod_conditions', 'w'), canD = canMod('mod_conditions', 'd');
  const ro = canW ? '' : ' disabled';
  const q = refNorm(_refSearch[R.id] || '');
  const data = R.data();
  const rows = data.map((row, i) => ({ row, i }))
    .filter(({ row }) => row._new || !q || R.cols.some(c => refNorm(row[c.prop]).includes(q)));
  const users = refFormulaUsers(R.name);
  const keys = refKeysOf(R);
  const keyable = attributes.filter(a => a.type === 'Simple select' || a.type === 'Oui / Non' || a.code === 'cat')
    .sort((x, y) => x.name.localeCompare(y.name, 'fr'));
  const head = R.cols.map((c, ci) => {
    if (!canW) {
      const k = keys[c.name] ? attributes.find(a => a.code === keys[c.name]) : null;
      return `<th>${escapeHtml(c.name)}${k ? ` <span class="ref-key">clé : ${escapeHtml(k.name)}</span>` : (refIsSoleKey(R, c) ? ' <span class="calc-meta">(clé)</span>' : '')}</th>`;
    }
    return `<th><div class="ref-col-head">
      <input class="field-input" value="${escapeHtml(c.name)}" onchange="renameRefColumn('${R.id}',${ci},this.value)">
      ${canD && ci > 0 ? `<button class="grp-x" title="Supprimer la colonne" onclick="removeRefColumn('${R.id}',${ci})">&#10005;</button>` : ''}
    </div>
    <select class="form-select ref-key-select" onchange="setRefKey('${R.id}',${ci},this.value)">
      <option value="">${refIsSoleKey(R, c) ? 'Clé' : 'Valeur'}</option>
      ${keyable.map(a => `<option value="${a.code}"${keys[c.name] === a.code ? ' selected' : ''}>Clé : ${escapeHtml(a.name)}</option>`).join('')}
    </select></th>`;
  }).join('');
  const body = rows.map(({ row, i }) => {
    const u = refRowUsage(R, row);
    const cells = R.cols.map((c, ci) => refCellHtml(R, row, i, c, ci, ro)).join('');
    const nh = (row._hist || []).length;
    return `<tr>${cells}
      ${refRowUsageShown(R) ? `<td class="calc-meta" style="white-space:nowrap">${u ? u.conds + ' lignes · ' + u.prods + ' produits' : ''}</td>` : ''}
      <td style="white-space:nowrap">${nh ? `<button class="grp-x" title="Historique (${nh})" onclick="openRefRowHistory('${R.id}',${i})">&#8635;</button>` : ''}
        ${canD ? `<button class="action-btn-danger btn-trash" title="Supprimer la ligne" onclick="deleteRefRow('${R.id}',${i})">${TRASH_ICON}</button>` : ''}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="${R.cols.length + 2}" style="color:#a0b0c0;padding:16px">Aucune ligne.</td></tr>`;
  const grp = R.table.groupId ? getGroupById(R.table.groupId) : null;
  return `
    <div class="acc-toolbar">
      <input class="field-input" style="max-width:260px" placeholder="Rechercher" value="${escapeHtml(_refSearch[R.id] || '')}"
        oninput="_refSearch['${R.id}']=this.value;renderSuppliersPage();const i=document.querySelector('.acc-tab-body .acc-toolbar input');i.focus();i.setSelectionRange(i.value.length,i.value.length)">
      <label class="ref-group-check"><input type="checkbox"${grp ? ' checked' : ''}${canW ? '' : ' disabled'} onchange="this.checked ? createRefGroup('${R.id}') : removeRefGroup('${R.id}', this)"> Groupe d’attributs</label>
        ${grp ? `<button class="cell-link" onclick="editAttrGroup(${grp.id})">${escapeHtml(grp.name)}</button>` : ''}
      <div style="flex:1"></div>
      ${canW ? `<button class="btn btn-secondary" onclick="addRefRow('${R.id}')">+ Ligne</button>
        <button class="btn btn-secondary" onclick="addRefColumn('${R.id}')">+ Colonne</button>
        <label class="btn btn-secondary" style="margin:0">Importer un fichier<input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="importRefFile('${R.id}',this)"></label>` : ''}
      ${canW ? `<input class="field-input" style="max-width:200px" value="${escapeHtml(R.name)}" title="Nom du référentiel" onchange="renameReferential('${R.id}',this.value)">` : ''}
      ${canD ? `<button class="action-btn-danger btn-trash" title="Supprimer le référentiel" onclick="deleteReferential('${R.id}')">${TRASH_ICON}</button>` : ''}
    </div>
    ${users.length ? `<div class="calc-meta" style="margin-bottom:8px">Lu par : ${users.map(a => escapeHtml(a.name)).join(', ')}</div>` : ''}
    <div class="table-container"><table class="ref-table">
      <thead><tr>${head}${refRowUsageShown(R) ? '<th>Utilisé par</th>' : ''}<th></th></tr></thead>
      <tbody>${body}</tbody>
    </table></div>`;
}

// Colonne clé : reliée à un attribut du produit (la ligne la plus précise
// s'applique ; case vide = toutes)
function setRefKey(refId, ci, code) {
  if (!requirePerm(canMod('mod_conditions', 'w'))) return;
  const t = refTable(refId); if (!t) return;
  const col = t.columns[ci];
  if (!t.keys) t.keys = {};
  if (code) t.keys[col] = code; else delete t.keys[col];
  refAfterChange(code ? '« ' + col + ' » devient une colonne clé' : '« ' + col + ' » devient une colonne de valeur');
}

// Case « Groupe d'attributs » : un groupe ordinaire, un attribut calculé
// =REFERENTIEL(...) par colonne de valeur ; il se règle ensuite comme les autres
function refAttrCode(name) {
  let base = refNorm(name).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'champ';
  let code = base, n = 2;
  while (attributes.some(a => a.code === code)) code = base + '_' + (n++);
  return code;
}
function addRefAttr(t, col) {
  const g = getGroupById(t.groupId); if (!g) return;
  const a = { id: Math.max(nextAttrId, ...attributes.map(x => x.id + 1)), name: col, code: refAttrCode(col), type: 'Texte',
    groupId: g.id, required: false, calc: true, inCompletion: false,
    formula: '=REFERENTIEL("' + t.name + '","' + col + '")', formulaLabel: 'Lu dans le référentiel ' + t.name,
    mask: '', showInSynth: false, clickToOpen: false };
  nextAttrId = a.id + 1;
  attributes.push(a);
  g.attrIds.push(a.id);
}
function createRefGroup(refId) {
  if (!requirePerm(canMod('mod_conditions', 'w'))) return;
  const t = refTable(refId); if (!t || t.groupId) return;
  if (!Object.keys(t.keys || {}).length) {
    showNotif('Reliez d’abord au moins une colonne clé à un attribut du produit', 'warn'); renderSuppliersPage(); return;
  }
  const g = { id: nextGroupId++, name: t.name, code: refAttrCode(t.name), system: false, attrIds: [], audienceGroupIds: [] };
  attrGroups.push(g);
  t.groupId = g.id;
  t.columns.filter(c => !(t.keys || {})[c] && !refColAttr(t.name, c)).forEach(c => addRefAttr(t, c));
  refAfterChange('Groupe « ' + g.name + ' » créé : ' + g.attrIds.length + ' champs. Rattachez-le aux catégories dans Catégories.');
}

function removeRefGroup(refId, box) {
  if (!requirePerm(canMod('mod_conditions', 'w'))) { if (box) box.checked = true; return; }
  const t = refTable(refId); if (!t || !t.groupId) return;
  const g = getGroupById(t.groupId);
  const fields = (g ? g.attrIds : []).map(getAttrById).filter(a => a && /R[EÉ]F[EÉ]RENTIEL\s*\(/i.test(a.formula || ''));
  const own = new Set(fields.map(a => a.code));
  const blocking = [];
  fields.forEach(a => attrCodeUsages(a.code).forEach(u => {
    if (/produit/.test(u.label)) return;
    const users = String(u.now || '');
    if (/formule/.test(u.label) && users.split(', ').every(n => fields.some(x => x.name === n))) return;
    blocking.push({ label: a.name, now: u.label + ' : ' + users });
  }));
  if (box) box.checked = true;
  if (blocking.length) {
    openConfirmModal({ title: 'Groupe d’attributs utilisé', okLabel: 'Compris',
      lead: 'Les champs du groupe « ' + (g ? g.name : t.name) + ' » servent ailleurs. Modifiez d’abord :', items: blocking, onOk: () => {} });
    return;
  }
  openConfirmModal({ title: 'Retirer le groupe d’attributs', okLabel: 'Retirer',
    lead: 'Le groupe « ' + (g ? g.name : t.name) + ' » et ses champs seront supprimés des fiches produit :',
    items: fields.map(a => ({ label: a.name, now: '' })),
    onOk: () => {
      attributes = attributes.filter(a => !own.has(a.code));
      products.forEach(p => { own.forEach(c => { if (p.fields) delete p.fields[c]; if (p.forcedFields) delete p.forcedFields[c]; }); });
      if (g) {
        g.attrIds = g.attrIds.filter(id => getAttrById(id));
        if (!g.attrIds.some(id => !isAttrSection(id))) {
          attrGroups = attrGroups.filter(x => x !== g);
          categories.forEach(c => { c.groupIds = c.groupIds.filter(id => id !== g.id); });
        }
      }
      t.groupId = null;
      refAfterChange('Groupe d’attributs retiré');
    } });
}

function openRefRowHistory(refId, i) {
  const R = refById(refId); const row = R && R.data()[i]; if (!row) return;
  const hist = [...(row._hist || [])].reverse();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay'; overlay.style.display = 'flex';
  overlay.innerHTML = `<div class="modal-box" style="max-width:640px;width:100%">
    <div class="modal-title">Historique — ${escapeHtml(R.cols.map(c => row[c.prop]).filter(Boolean).slice(0, 3).join(' · '))}</div>
    <div style="max-height:50vh;overflow:auto"><table class="history-table">
      <thead><tr><th>Date</th><th>Utilisateur</th><th>Colonne</th><th>Modification</th></tr></thead>
      <tbody>${hist.map(h => `<tr><td style="white-space:nowrap;color:#607080">${escapeHtml(h.ts)}</td><td>${escapeHtml(h.user)}</td><td>${escapeHtml(h.col)}</td>
        <td><span class="history-val-old">${escapeHtml(h.old || '(vide)')}</span><span class="history-arrow">→</span><span class="history-val-new">${escapeHtml(h.new || '(vide)')}</span></td></tr>`).join('')}</tbody>
    </table></div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Fermer</button></div>
  </div>`;
  document.body.appendChild(overlay);
}

function refById(id) { return allReferentials().find(x => x.id === id) || null; }

function setRefCell(refId, i, ci, val) {
  if (!requirePerm(canMod('mod_conditions', 'w'))) return;
  const R = refById(refId); if (!R) return;
  const row = R.data()[i]; if (!row) return;
  const c = R.cols[ci]; if (!c) return;
  const prop = c.prop;
  let v = String(val == null ? '' : val).trim();
  if (c.upper) v = v.toUpperCase();
  if (c.max) v = v.slice(0, c.max);
  const valAttr = refColAttr(R.name, c.name);
  if (valAttr && isPercentAttr(valAttr) && v !== '') {
    const n = parseFloat(v.replace(',', '.').replace('%', ''));
    if (!isFinite(n)) { showNotif('Pourcentage illisible', 'warn'); renderSuppliersPage(); return; }
    v = String(parseFloat((n / 100).toFixed(6)));
  }
  if (refIsSoleKey(R, c)) {
    if (!v) { showNotif(c.name + ' obligatoire', 'warn'); renderSuppliersPage(); return; }
    if (R.data().some((x, k) => k !== i && refNorm(x[prop]) === refNorm(v))) {
      showNotif('« ' + v + ' » existe déjà', 'error'); renderSuppliersPage(); return;
    }
    delete row._new;
  }

  if (!row._new && String(row[prop] == null ? '' : row[prop]) !== v) {
    if (!row._hist) row._hist = [];
    row._hist.push({ ts: typeof nowStr === 'function' ? nowStr() : '', user: typeof currentUserName === 'function' ? currentUserName() : '', col: c.name, old: String(row[prop] == null ? '' : row[prop]), new: v });
  }
  if (refHasKeys(R)) delete row._new;
  row[prop] = v;
  refAfterChange(R.name + ' : ligne enregistrée');
}

function addRefRow(refId) {
  if (!requirePerm(canMod('mod_conditions', 'w'))) return;
  const R = refById(refId); if (!R) return;
  const row = { _new: true };
  R.cols.forEach(c => { row[c.prop] = ''; });
  R.data().unshift(row);
  _refSearch[refId] = '';
  renderSuppliersPage();
  const first = document.querySelector('.ref-table tbody input');
  if (first) first.focus();
}

function deleteRefRow(refId, i) {
  if (!requirePerm(canMod('mod_conditions', 'd'))) return;
  const R = refById(refId); if (!R) return;
  const row = R.data()[i]; if (!row) return;
  const key = row[R.cols[0].prop];
  const u = refRowUsage(R, row);
  if (u && (u.conds || u.prods)) {
    showNotif('« ' + key + ' » est utilisé (' + u.conds + ' lignes de référentiels, ' + u.prods + ' produits) : suppression impossible', 'warn');
    return;
  }
  const remove = () => {
    R.data().splice(i, 1);
    refAfterChange('Ligne supprimée');
  };
  if (row._new) { remove(); return; }
  openConfirmModal({ title: 'Supprimer la ligne', okLabel: 'Supprimer',
    lead: '« ' + key + ' » sera supprimé du référentiel ' + R.name + '.', onOk: remove });
}

// Import : colonnes reconnues par leur nom (casse et accents ignorés) ;
// la clé met à jour une ligne existante ou en crée une
const REF_ALIASES = {
  ref_fournisseurs: { 'Code': ['code fournisseur', 'fournisseur code'], 'Nom': ['fournisseur', 'nom fournisseur'], 'Trigramme': ['trigram', 'fab', 'fab.'] },
  ref_marques: { 'Marque': ['description', 'nom'], 'Code IWI': ['code', 'code marque'], 'Fabricant': ['fab', 'fab.', 'code fabricant'] },
};
function importRefFile(refId, input) {
  if (!requirePerm(canMod('mod_conditions', 'w'))) return;
  const R = refById(refId); const file = input.files && input.files[0];
  if (!R || !file) return;
  const csv = /\.csv$/i.test(file.name);
  const reader = new FileReader();
  reader.onload = e => {
    let rows;
    try {
      if (csv) {
        let text = e.target.result;
        rows = parseCSV(text);
      } else {
        const wb = XLSX.read(e.target.result, { type: 'binary' });
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      }
    } catch (err) { showNotif('Fichier illisible : ' + err.message, 'error'); return; }
    if (!rows.length) { showNotif('Fichier vide', 'warn'); return; }
    const headers = Object.keys(rows[0]);
    const alias = REF_ALIASES[R.id] || {};
    const map = {};
    R.cols.forEach(c => {
      const names = [c.name].concat(alias[c.name] || []).map(refNorm);
      const h = headers.find(x => names.includes(refNorm(x)));
      if (h) map[c.prop] = h;
    });
    const key = R.cols[0];
    const multi = refHasKeys(R);
    if (!multi && !map[key.prop]) { showNotif('Colonne « ' + key.name + ' » introuvable dans le fichier', 'error'); return; }
    const keyCols = multi ? R.cols.filter(c => refKeysOf(R)[c.name]) : [key];
    let added = 0, updated = 0;
    rows.forEach(src => {
      const val = c => String(map[c.prop] && src[map[c.prop]] != null ? src[map[c.prop]] : '').trim();
      const k = val(key);
      if (!multi && !k) return;
      let row = R.data().find(x => keyCols.every(c => refNorm(x[c.prop]) === refNorm(val(c))));
      if (!row) { row = {}; R.cols.forEach(c => { row[c.prop] = ''; }); keyCols.forEach(c => { row[c.prop] = val(c); }); R.data().push(row); added++; }
      else updated++;
      R.cols.forEach(c => {
        if (keyCols.includes(c) || !map[c.prop]) return;
        let v = String(src[map[c.prop]] == null ? '' : src[map[c.prop]]).trim();
        if (c.upper) v = v.toUpperCase();
        if (c.max) v = v.slice(0, c.max);
        if (v !== '') row[c.prop] = v;
      });
    });
    refAfterChange(R.name + ' : ' + added + ' ligne' + (added > 1 ? 's' : '') + ' ajoutée' + (added > 1 ? 's' : '') + ', ' + updated + ' mise' + (updated > 1 ? 's' : '') + ' à jour');
  };
  if (csv) {
    // fichier en UTF-8, sinon en Windows-1252 (exports Excel)
    const r2 = new FileReader();
    r2.onload = ev => {
      const t = ev.target.result;
      if (t.includes('\uFFFD')) reader.readAsText(file, 'windows-1252'); else reader.onload({ target: { result: t } });
    };
    r2.readAsText(file, 'UTF-8');
  } else reader.readAsBinaryString(file);
  input.value = '';
}

// Référentiels créés dans l'administration
function openNewReferentialModal() {
  if (!requirePerm(canMod('mod_conditions', 'w'))) return;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:460px;width:100%">
      <div class="modal-title">Nouveau référentiel</div>
      <div class="form-field">
        <div class="form-label">Nom <span class="field-required">*</span></div>
        <input class="field-input" id="nr-name">
      </div>
      <div class="form-field" style="margin-top:12px">
        <div class="form-label">Colonnes, une par ligne ; la première est la clé <span class="field-required">*</span></div>
        <textarea class="field-input" id="nr-cols" rows="4"></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
        <button class="btn btn-primary" onclick="createReferential(this)">Créer</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('nr-name').focus();
}
function createReferential(btn) {
  const name = (document.getElementById('nr-name').value || '').trim();
  const cols = [...new Set((document.getElementById('nr-cols').value || '').split('\n').map(x => x.trim()).filter(Boolean))];
  if (!name || !cols.length) { showNotif('Nom et au moins une colonne obligatoires', 'warn'); return; }
  if (findReferential(name)) { showNotif('Ce référentiel existe déjà', 'error'); return; }
  const t = { id: 'ref_' + Date.now(), name, columns: cols, rows: [] };
  refTables.push(t);
  btn.closest('.modal-overlay').remove();
  _refTab = t.id;
  refAfterChange('Référentiel « ' + name + ' » créé');
}
function refTable(id) { return (refTables || []).find(t => t.id === id) || null; }
function replaceRefInFormulas(oldRef, newRef, oldCol, newCol) {
  const res = [[/RECHERCHE\s*\(\s*"([^"]+)"(\s*,[^,]+,\s*)"([^"]+)"\s*\)/gi, 'RECHERCHE'],
               [/R[EÉ]F[EÉ]RENTIEL\s*\(\s*"([^"]+)"(\s*,\s*)"([^"]+)"\s*\)/gi, 'REFERENTIEL']];
  attributes.forEach(a => ['formula', '_altFormula'].forEach(k => {
    if (!a[k]) return;
    res.forEach(([re, fn]) => {
      a[k] = a[k].replace(re, (m, r, mid, c) => {
        if (refNorm(r) !== refNorm(oldRef)) return m;
        const col = oldCol != null && refNorm(c) === refNorm(oldCol) ? newCol : c;
        return fn + '("' + (newRef || r) + '"' + mid + '"' + col + '")';
      });
    });
  }));
}
function renameReferential(id, val) {
  const t = refTable(id); const v = String(val || '').trim(); if (!t) return;
  if (!v) { renderSuppliersPage(); return; }
  if (findReferential(v) && refNorm(v) !== refNorm(t.name)) { showNotif('Ce nom existe déjà', 'error'); renderSuppliersPage(); return; }
  replaceRefInFormulas(t.name, v);
  attributes.forEach(a => { if (a.listRef && refNorm(a.listRef.ref) === refNorm(t.name)) a.listRef.ref = v; });
  t.name = v;
  refAfterChange('Référentiel renommé, formules mises à jour');
}
function addRefColumn(id) {
  const t = refTable(id); if (!t) return;
  let n = 1, name = 'Colonne';
  while (t.columns.includes(name)) name = 'Colonne ' + (++n);
  t.columns.push(name);
  t.rows.forEach(r => { r[name] = ''; });
  if (t.groupId) addRefAttr(t, name);
  renderSuppliersPage();
}
function renameRefColumn(id, ci, val) {
  const t = refTable(id); if (!t) return;
  const old = t.columns[ci], v = String(val || '').trim();
  if (!v || v === old) { renderSuppliersPage(); return; }
  if (t.columns.some((c, k) => k !== ci && refNorm(c) === refNorm(v))) { showNotif('Cette colonne existe déjà', 'error'); renderSuppliersPage(); return; }
  t.columns[ci] = v;
  t.rows.forEach(r => { r[v] = r[old]; delete r[old]; });
  if (t.keys && t.keys[old]) { t.keys[v] = t.keys[old]; delete t.keys[old]; }
  replaceRefInFormulas(t.name, null, old, v);
  refAfterChange('Colonne renommée');
}
function removeRefColumn(id, ci) {
  const t = refTable(id); if (!t || ci === 0) return;
  const col = t.columns[ci];
  const users = refFormulaUsers(t.name, col);
  if (users.length) { showNotif('Colonne lue par ' + users.map(a => a.name).join(', ') + ' : suppression impossible', 'warn'); return; }
  openConfirmModal({ title: 'Supprimer la colonne', okLabel: 'Supprimer', lead: 'La colonne « ' + col + ' » et ses valeurs seront supprimées.',
    onOk: () => { t.columns.splice(ci, 1); t.rows.forEach(r => delete r[col]); refAfterChange('Colonne supprimée'); } });
}
function deleteReferential(id) {
  const t = refTable(id); if (!t) return;
  const users = refFormulaUsers(t.name).concat(attributes.filter(a => a.listRef && refNorm(a.listRef.ref) === refNorm(t.name)));
  if (users.length) { showNotif('Référentiel lu par ' + users.map(a => a.name).join(', ') + ' : suppression impossible', 'warn'); return; }
  openConfirmModal({ title: 'Supprimer le référentiel', okLabel: 'Supprimer', lead: '« ' + t.name + ' » et ses ' + t.rows.length + ' lignes seront supprimés.',
    onOk: () => { refTables = refTables.filter(x => x.id !== id); _refTab = 'conditions'; refAfterChange('Référentiel supprimé'); } });
}

function renderAlertsPage() {
  const page = document.getElementById('page-admin-alerts');
  if (!page) return;
  const canW = canMod('mod_alerts', 'w');
  const canD = canMod('mod_alerts', 'd');
  const rows = (alerts || []).map(alert => `<tr>
      <td style="font-weight:600">${escapeHtml(alert.name || '')}</td>
      <td>${escapeHtml(alertCondsText(alert))}</td>
      <td class="calc-meta">${escapeHtml(alert.description || '')}</td>
      <td>${productsForAlert(alert).length}</td>
      <td><div class="td-actions">
        <button class="action-btn" onclick="openAlertModal(${alert.id})">${canW ? 'Modifier' : 'Voir'}</button>
        ${canD ? `<button class="action-btn-danger btn-trash" title="Supprimer l'alerte" onclick="deleteAlert(${alert.id})">${TRASH_ICON}</button>` : ''}
      </div></td>
    </tr>`).join('') || `<tr><td colspan="5" style="text-align:center;color:#a0b0c0;padding:24px">Aucune alerte.</td></tr>`;
  page.innerHTML = `
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px">
      <button class="btn btn-secondary" onclick="showPage('admin',null)">&larr; Administration</button>
      <span style="font-size:15px;font-weight:700;color:#1a2332">Alertes</span>
      ${canW ? `<button class="btn btn-primary" onclick="openAlertModal()">+ Alerte</button>` : ''}
    </div>
    <div class="table-container"><table>
      <thead><tr><th>Nom</th><th>Conditions (toutes vraies)</th><th>Description</th><th>Produits</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

// Fenêtre de création / modification d'une alerte
let _alertDraft = null;
function alertAttrChoices() {
  return attributes
    .sort((x, y) => x.name.localeCompare(y.name, 'fr'));
}
function alertValueChoices(a) {
  if (!a) return [];
  if (a.code === 'cat') return categories.map(c => c.name);
  if (a.code === 'etape_workflow' && typeof workflowLabels === 'function') return workflowLabels();
  if (a.type === 'Oui / Non') return ['Oui', 'Non'];
  return a.options || [];
}

function openAlertModal(id) {
  const src = id ? (alerts || []).find(a => a.id === id) : null;
  if (id && !src) return;
  _alertDraft = {
    id: src ? src.id : null,
    readonly: !canMod('mod_alerts', 'w'),
    name: src ? (src.name || '') : '',
    description: src ? (src.description || '') : '',
    conds: src ? src.conds.map(c => ({ ...c })) : [{ attrCode: '', op: '=', value: '' }],
  };
  renderAlertModal();
}

function renderAlertModal() {
  const d = _alertDraft; if (!d) return;
  const old = document.getElementById('alert-modal');
  if (old) old.remove();
  const ro = d.readonly ? ' disabled' : '';
  const condRows = d.conds.map((c, i) => {
    const a = attributes.find(x => x.code === c.attrCode);
    const choices = alertValueChoices(a);
    return `<div class="alert-cond-row">
      <select class="form-select" onchange="_alertDraft.conds[${i}].attrCode=this.value;renderAlertModal()"${ro}>
        <option value="">Attribut…</option>
        ${alertAttrChoices().map(x => `<option value="${x.code}"${x.code === c.attrCode ? ' selected' : ''}>${escapeHtml(x.name)}</option>`).join('')}
      </select>
      <select class="form-select alert-cond-op" onchange="_alertDraft.conds[${i}].op=this.value;alertDescPlaceholder()"${ro}>
        ${CALC_OPS.map(o => `<option${o === c.op ? ' selected' : ''}>${o}</option>`).join('')}
      </select>
      <input class="field-input" value="${escapeHtml(c.value || '')}"${choices.length ? ` list="alert-dl-${i}"` : ''}
        oninput="_alertDraft.conds[${i}].value=this.value;alertDescPlaceholder()"${ro}>
      ${choices.length ? `<datalist id="alert-dl-${i}">${choices.map(o => `<option value="${escapeHtml(o)}">`).join('')}</datalist>` : ''}
      <span class="alert-cond-unit">${a && isPercentAttr(a) ? '%' : ''}</span>
      ${!d.readonly && d.conds.length > 1
        ? `<button class="action-btn-danger btn-trash" title="Retirer la condition" onclick="_alertDraft.conds.splice(${i},1);renderAlertModal()">${TRASH_ICON}</button>`
        : '<span class="grp-x-spacer"></span>'}
    </div>`;
  }).join('');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'alert-modal';
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:640px;width:100%">
      <div class="modal-title">${d.id ? (d.readonly ? 'Alerte' : 'Modifier l’alerte') : 'Nouvelle alerte'}</div>
      <div class="form-field">
        <div class="form-label">Nom <span class="field-required">*</span></div>
        <input class="field-input" id="al-name" value="${escapeHtml(d.name)}" oninput="_alertDraft.name=this.value"${ro}>
      </div>
      <div class="form-field" style="margin-top:12px">
        <div class="form-label">Conditions, toutes vraies <span class="field-required">*</span></div>
        ${condRows}
        ${d.readonly ? '' : `<button class="btn btn-secondary" style="margin-top:6px" onclick="_alertDraft.conds.push({attrCode:'',op:'=',value:''});renderAlertModal()">+ Condition</button>`}
      </div>
      <div class="form-field" style="margin-top:12px">
        <div class="form-label">Description</div>
        <input class="field-input" id="al-desc" value="${escapeHtml(d.description)}" oninput="_alertDraft.description=this.value"${ro}>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeAlertModal()">${d.readonly ? 'Fermer' : 'Annuler'}</button>
        ${d.readonly ? '' : `<button class="btn btn-primary" onclick="saveAlertModal()">${d.id ? 'Enregistrer' : 'Créer'}</button>`}
      </div>
    </div>`;
  document.body.appendChild(overlay);
  alertDescPlaceholder();
}

function alertDescPlaceholder() {
  const el = document.getElementById('al-desc');
  if (el && _alertDraft) el.placeholder = alertCondsText({ conds: _alertDraft.conds.filter(c => c.attrCode) });
}

function closeAlertModal() {
  const m = document.getElementById('alert-modal');
  if (m) m.remove();
  _alertDraft = null;
}

function saveAlertModal() {
  if (!requirePerm(canMod('mod_alerts', 'w'))) return;
  const d = _alertDraft; if (!d) return;
  const name = (d.name || '').trim();
  const conds = d.conds.map(c => ({ attrCode: c.attrCode, op: c.op, value: String(c.value || '').trim() }));
  if (!name || conds.some(c => !c.attrCode || c.value === '')) {
    showNotif('Nom et conditions complètes obligatoires', 'warn'); return;
  }
  const bad = conds.find(c => !['=', '≠'].includes(c.op) && calcNum(c.value) === null);
  if (bad) { showNotif('« ' + bad.op + ' » demande une valeur numérique', 'warn'); return; }
  const description = (d.description || '').trim();
  if (d.id) {
    const a = alerts.find(x => x.id === d.id);
    if (a) { a.name = name; a.conds = conds; a.description = description; }
  } else {
    alerts.push({ id: nextAlertId++, name, conds, description });
  }
  closeAlertModal();
  renderAlertsPage();
  renderAdminHome();
  renderDashboard();
  showNotif(d.id ? 'Alerte enregistrée' : 'Alerte créée');
}

function deleteAlert(id) {
  if (!requirePerm(canMod('mod_alerts', 'd'))) return;
  const alert = (alerts || []).find(a => a.id === id);
  if (!alert) return;
  openConfirmModal({ title: 'Supprimer l’alerte', lead: '« ' + alertRuleText(alert) + ' » sera supprimée.', okLabel: 'Supprimer',
    onOk: () => {
      alerts = alerts.filter(a => a.id !== id);
      if (_filterAlertId === id) _filterAlertId = null;
      renderAlertsPage();
      renderAdminHome();
      renderDashboard();
      showNotif('Alerte supprimée');
    } });
}


// ============================================================
// ADMINISTRATION > TRAMES D'IMPORT / EXPORT
// ============================================================
let _fmtSel = null;
function renderExportFormatsPage() {
  const page = document.getElementById('page-admin-export-formats');
  if (!page) return;
  if (!trameById(_fmtSel)) _fmtSel = null;
  const canW = canMod('mod_trames', 'w'), canD = canMod('mod_trames', 'd');
  const f = trameById(_fmtSel);
  const ro = canW && f && !f.system ? '' : ' disabled';
  const attrOpts = [...attributes].sort((x, y) => x.name.localeCompare(y.name, 'fr'));
  const srcSel = (c, i) => {
    const v = c.fixed != null ? '__fixed' : (c.code || '');
    return `<select class="form-select" onchange="setFmtColSource(${i},this.value)"${ro}>
      <option value="">Vide</option>
      <option value="__fixed"${v === '__fixed' ? ' selected' : ''}>Valeur fixe</option>
      ${attrOpts.map(a => `<option value="${a.code}"${a.code === v ? ' selected' : ''}>${escapeHtml(a.name)}</option>`).join('')}
    </select>`;
  };
  const rows = f && !f.system ? f.columns.map((c, i) => `<tr>
      <td class="calc-meta">${i + 1}</td>
      <td><input class="field-input" value="${escapeHtml(c.bloc || '')}" onchange="setFmtCol(${i},'bloc',this.value)"${ro}></td>
      <td><input class="field-input" value="${escapeHtml(c.header || '')}" onchange="setFmtCol(${i},'header',this.value)"${ro}></td>
      <td style="min-width:240px">${srcSel(c, i)}</td>
      <td>${c.fixed != null ? `<input class="field-input" value="${escapeHtml(c.fixed)}" onchange="setFmtCol(${i},'fixed',this.value)"${ro}>` : ''}</td>
      <td style="text-align:center"><input type="checkbox"${c.required ? ' checked' : ''} onchange="setFmtCol(${i},'required',this.checked)"${ro}></td>
      <td style="white-space:nowrap">${canW ? `<button class="grp-x" title="Monter" onclick="moveFmtCol(${i},-1)">&#8593;</button><button class="grp-x" title="Descendre" onclick="moveFmtCol(${i},1)">&#8595;</button>` : ''}
        ${canD ? `<button class="action-btn-danger btn-trash" title="Supprimer la colonne" onclick="removeFmtCol(${i})">${TRASH_ICON}</button>` : ''}</td>
    </tr>`).join('') : '';
  const filled = f && !f.system ? f.columns.filter(c => c.code || c.fixed != null).length : 0;
  const usage = t => [t.import ? 'Import' : '', t.export ? 'Export' : ''].filter(Boolean).join(' · ');
  const systemBody = f && f.system ? `
      <div class="calc-meta" style="margin:4px 0 10px">Colonnes automatiques : tous les attributs des onglets de la catégorie exportée, en-tête = code technique.</div>
      <div class="table-container"><table class="ref-table">
        <thead><tr><th>Catégorie</th><th>Onglets</th><th>Colonnes</th></tr></thead>
        <tbody>${categories.map(c => {
          const gs = (c.groupIds || []).map(getGroupById).filter(Boolean);
          const n = new Set(gs.flatMap(g => (g.attrIds || []).filter(x => typeof x === 'number'))).size;
          return `<tr><td>${escapeHtml(c.name)}</td><td>${gs.map(g => escapeHtml(g.name)).join(', ')}</td><td>${n}</td></tr>`;
        }).join('')}</tbody>
      </table></div>` : '';
  if (!f) { page.innerHTML = tramesListHtml(canW, canD, usage); return; }
  page.innerHTML = `
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px">
      <button class="btn btn-secondary" onclick="_fmtSel=null;renderExportFormatsPage()">&larr; Trames</button>
      <span style="font-size:15px;font-weight:700;color:#1a2332">${f ? escapeHtml(f.name) : ''}</span>
    </div>
    ${f ? `<div>
      <div class="acc-toolbar">
        <div class="form-field" style="margin:0"><div class="form-label">Nom de la trame</div>
          <input class="field-input" value="${escapeHtml(f.name)}" onchange="setFmtProp('name',this.value)"${ro}></div>
        ${f.system ? '' : `<div class="form-field" style="margin:0"><div class="form-label">Nom de la feuille</div>
          <input class="field-input" value="${escapeHtml(f.sheet || '')}" onchange="setFmtProp('sheet',this.value)"${ro}></div>`}
      </div>
      <div class="trame-settings">
        <div class="trame-box"><div class="form-label">Usage</div>
          <div class="trame-checks">
            <label><input type="checkbox"${f.import ? ' checked' : ''} onchange="setFmtProp('import',this.checked)"${ro}> Import</label>
            <label><input type="checkbox"${f.export ? ' checked' : ''} onchange="setFmtProp('export',this.checked)"${ro}> Export</label>
          </div></div>
        <div class="trame-box"><div class="form-label">Catégories (aucune = toutes)</div>
          <div class="trame-checks">${categories.map(c => `<label><input type="checkbox"${(f.cats || []).includes(c.name) ? ' checked' : ''} onchange="toggleFmtCat('${escapeHtml(c.name)}',this.checked)"${ro}> ${escapeHtml(c.name)}</label>`).join('')}</div></div>
        <div style="flex:1"></div>
        ${f.system ? '' : `<div class="calc-meta" style="align-self:flex-end;padding-bottom:8px">${f.columns.length} colonnes, ${filled} remplies</div>`}
        ${canW && !f.system ? `<button class="btn btn-secondary" style="align-self:flex-end" onclick="addFmtCol()">+ Colonne</button>` : ''}
        ${canD && !f.system ? `<button class="action-btn-danger btn-trash" style="align-self:flex-end" title="Supprimer la trame" onclick="deleteExportFormat()">${TRASH_ICON}</button>` : ''}
      </div>
      ${f.system ? systemBody : `<div class="table-container"><table class="ref-table fmt-table">
        <thead><tr><th>#</th><th>Bloc</th><th>Intitulé de la colonne</th><th>Source</th><th>Valeur fixe</th><th>Bloquante à l’export</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="7" style="color:#a0b0c0;padding:16px">Aucune colonne.</td></tr>'}</tbody>
      </table></div>`}
    </div>` : '<div class="calc-meta" style="padding:16px">Aucune trame.</div>'}`;
}

// Liste des trames : un clic ouvre la trame
function tramesListHtml(canW, canD, usage) {
  const rows = trames.map(t => `<tr>
      <td><button class="cell-link" onclick="_fmtSel='${t.id}';renderExportFormatsPage()">${escapeHtml(t.name)}</button>${t.system ? systemLockBadge('trame') : ''}</td>
      <td>${usage(t) || '—'}</td>
      <td>${(t.cats || []).length ? t.cats.map(c => catBadgeHtml(c)).join(' ') : '<span class="calc-meta">Toutes</span>'}</td>
      <td>${t.system ? '<span class="calc-meta">automatiques</span>' : t.columns.length}</td>
      <td>${canD && !t.system ? `<button class="action-btn-danger btn-trash" title="Supprimer la trame" onclick="_fmtSel='${t.id}';deleteExportFormat()">${TRASH_ICON}</button>` : ''}</td>
    </tr>`).join('');
  return `
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px">
      <button class="btn btn-secondary" onclick="showPage('admin',null)">&larr; Administration</button>
      <span style="font-size:15px;font-weight:700;color:#1a2332">Trames d’import / export</span>
      ${canW ? `<button class="btn btn-primary" onclick="addExportFormat()">+ Trame</button>` : ''}
    </div>
    <div class="table-container"><table>
      <thead><tr><th>Nom</th><th>Usage</th><th>Catégories</th><th>Colonnes</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" style="color:#a0b0c0;padding:16px">Aucune trame.</td></tr>'}</tbody>
    </table></div>`;
}

function toggleFmtCat(name, on) {
  if (!requirePerm(canMod('mod_trames', 'w'))) return;
  const f = trameById(_fmtSel); if (!f || f.system) return;
  f.cats = (f.cats || []).filter(x => x !== name);
  if (on) f.cats.push(name);
  fmtAfterChange();
}
function fmtAfterChange(msg) {
  if (typeof exportPick !== 'undefined') exportPick = null;
  renderExportFormatsPage();
  renderAdminHome();
  if (msg) showNotif(msg);
}
function setFmtProp(prop, val) {
  if (!requirePerm(canMod('mod_trames', 'w'))) return;
  const f = trameById(_fmtSel); if (!f || f.system) return;
  if (prop === 'import' || prop === 'export') { f[prop] = !!val; fmtAfterChange(); return; }
  const v = String(val || '').trim();
  if (prop === 'name') {
    if (!v) { renderExportFormatsPage(); return; }
    if (trames.some(x => x !== f && x.name.toLowerCase() === v.toLowerCase())) { showNotif('Ce nom existe déjà', 'error'); renderExportFormatsPage(); return; }
  }
  f[prop] = v;
  fmtAfterChange('Trame enregistrée');
}
function setFmtCol(i, prop, val) {
  if (!requirePerm(canMod('mod_trames', 'w'))) return;
  const f = trameById(_fmtSel); const c = f && f.columns[i]; if (!c) return;
  c[prop] = prop === 'required' ? !!val : String(val == null ? '' : val).trim();
  if (prop === 'required' && !val) delete c.required;
  fmtAfterChange();
}
function setFmtColSource(i, val) {
  if (!requirePerm(canMod('mod_trames', 'w'))) return;
  const f = trameById(_fmtSel); const c = f && f.columns[i]; if (!c) return;
  delete c.code; delete c.fixed;
  if (val === '__fixed') c.fixed = '';
  else if (val) c.code = val;
  fmtAfterChange();
}
function moveFmtCol(i, d) {
  const f = trameById(_fmtSel); if (!f) return;
  const j = i + d; if (j < 0 || j >= f.columns.length) return;
  const [c] = f.columns.splice(i, 1); f.columns.splice(j, 0, c);
  fmtAfterChange();
}
function addFmtCol() {
  if (!requirePerm(canMod('mod_trames', 'w'))) return;
  const f = trameById(_fmtSel); if (!f) return;
  const last = f.columns[f.columns.length - 1];
  f.columns.push({ bloc: last ? last.bloc : '', header: 'Nouvelle colonne' });
  fmtAfterChange();
  const inputs = document.querySelectorAll('.fmt-table tbody tr:last-child input');
  if (inputs[1]) { inputs[1].focus(); inputs[1].select(); }
}
function removeFmtCol(i) {
  if (!requirePerm(canMod('mod_trames', 'd'))) return;
  const f = trameById(_fmtSel); const c = f && f.columns[i]; if (!c) return;
  openConfirmModal({ title: 'Supprimer la colonne', okLabel: 'Supprimer', lead: 'La colonne « ' + (c.header || '') + ' » sera retirée de la trame ' + f.name + '.',
    onOk: () => { f.columns.splice(i, 1); fmtAfterChange('Colonne supprimée'); } });
}
function addExportFormat() {
  if (!requirePerm(canMod('mod_trames', 'w'))) return;
  let n = 1, name = 'Nouvelle trame';
  while (trames.some(x => x.name === name)) name = 'Nouvelle trame ' + (++n);
  const f = { id: 'trm_' + (nextTrameId++), name, sheet: 'Export', import: true, export: true, cats: [], columns: [] };
  trames.push(f);
  _fmtSel = f.id;
  fmtAfterChange('Trame créée');
}
function deleteExportFormat() {
  if (!requirePerm(canMod('mod_trames', 'd'))) return;
  const f = trameById(_fmtSel); if (!f || f.system) return;
  openConfirmModal({ title: 'Supprimer la trame', okLabel: 'Supprimer', lead: 'La trame « ' + f.name + ' » et ses ' + f.columns.length + ' colonnes seront supprimées.',
    onOk: () => {
      trames = trames.filter(x => x !== f);
      if (activeExportTemplate === f.id) activeExportTemplate = 'catalogue';
      if (typeof importTrameId !== 'undefined' && importTrameId === f.id) importTrameId = '';
      _fmtSel = null;
      fmtAfterChange('Trame supprimée');
    } });
}
