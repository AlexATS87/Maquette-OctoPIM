// ============================================================
// ADMIN — CATEGORIES
// ============================================================
function renderCatsTable(){
  const tb=document.getElementById('cats-tbody');if(!tb)return;tb.innerHTML='';
  categories.forEach(cat=>{
    const nb=cat.groupIds.length;
    tb.innerHTML+=`<tr>
      <td><strong>${cat.name}</strong></td>
      <td style="font-family:monospace;font-size:12px;color:#607080">${cat.code}</td>
      <td><span class="color-swatch" style="background:${cat.color}"></span>${cat.color}</td>
      <td>${nb} groupe${nb>1?'s':''}</td>
      <td><div class="td-actions">
        <button class="action-btn" onclick="editCategory(${cat.id})">Editer</button>
        <button class="action-btn-danger" onclick="confirmDelete('cat',${cat.id},'${cat.name}')">Supprimer</button>
      </div></td>
    </tr>`;
  });
}
function editCategory(id){
  editingCatId=id;const cat=categories.find(c=>c.id===id);if(!cat)return;
  document.getElementById('edit-cat-name').value=cat.name;
  document.getElementById('edit-cat-code').value=cat.code;
  document.getElementById('edit-cat-color').value=cat.color;
  renderCatGroupOrder(cat);renderCatGroupAvailable(cat);showPage('admin-category-edit',null);
}
function renderCatGroupOrder(cat){
  const list=document.getElementById('cat-group-order-list');if(!list)return;list.innerHTML='';
  cat.groupIds.forEach(gid=>{
    const g=getGroupById(gid);if(!g)return;
    const item=document.createElement('div');
    item.className='cat-group-order-item'+(g.system?' system-group':'');item.dataset.groupId=gid;
    if(!g.system){
      item.draggable=true;
      item.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',String(gid));item.classList.add('dragging');});
      item.addEventListener('dragend',()=>item.classList.remove('dragging'));
      item.addEventListener('dragover',e=>{e.preventDefault();item.classList.add('drag-over');});
      item.addEventListener('dragleave',()=>item.classList.remove('drag-over'));
      item.addEventListener('drop',e=>{
        e.preventDefault();item.classList.remove('drag-over');
        const fromId=parseInt(e.dataTransfer.getData('text/plain'));const toId=parseInt(item.dataset.groupId);
        if(fromId===toId)return;
        const fi=cat.groupIds.indexOf(fromId);const ti=cat.groupIds.indexOf(toId);
        cat.groupIds.splice(fi,1);cat.groupIds.splice(ti,0,fromId);renderCatGroupOrder(cat);
      });
    }
    item.innerHTML=`${!g.system?'<span class="drag-handle">&#9776;</span>':'<span style="width:22px;display:inline-block"></span>'}
      <span style="font-size:13px;font-weight:${g.system?'600':'400'}">${g.name}</span>
      ${g.system?'<span class="attr-group-badge-system" style="margin-left:8px">Systeme</span>':''}
      ${!g.system?`<button class="action-btn-danger" style="margin-left:auto;font-size:11px;padding:3px 8px" onclick="removeCatGroup(${cat.id},${gid})">Retirer</button>`:''}`;
    list.appendChild(item);
  });
}
function removeCatGroup(catId,groupId){
  const cat=categories.find(c=>c.id===catId);if(!cat)return;
  const g=getGroupById(groupId);if(g&&g.system)return;
  cat.groupIds=cat.groupIds.filter(id=>id!==groupId);renderCatGroupOrder(cat);renderCatGroupAvailable(cat);
}
function renderCatGroupAvailable(cat){
  const list=document.getElementById('cat-group-available-list');if(!list)return;list.innerHTML='';
  const available=attrGroups.filter(g=>!g.system&&!cat.groupIds.includes(g.id));
  if(!available.length){list.innerHTML='<div style="font-size:12px;color:#a0b0c0;padding:8px">Tous les groupes sont deja associes.</div>';return;}
  available.forEach(g=>{
    const row=document.createElement('div');row.className='attr-toggle-row';row.dataset.groupName=g.name.toLowerCase();
    row.innerHTML=`<div class="attr-toggle-info"><div class="attr-toggle-name">${g.name}</div><div class="attr-toggle-meta">${g.attrIds.length} attributs</div></div>
    <button class="action-btn" onclick="addCatGroup(${cat.id},${g.id})">Ajouter</button>`;
    list.appendChild(row);
  });
}
function filterCatGroupToggles(v){document.querySelectorAll('#cat-group-available-list .attr-toggle-row').forEach(r=>{r.style.display=r.dataset.groupName.includes(v.toLowerCase())?'':'none';});}
function addCatGroup(catId,groupId){
  const cat=categories.find(c=>c.id===catId);if(!cat)return;
  if(!cat.groupIds.includes(groupId))cat.groupIds.push(groupId);
  renderCatGroupOrder(cat);renderCatGroupAvailable(cat);
}
function saveCategoryEdit(){
  const cat=categories.find(c=>c.id===editingCatId);if(!cat)return;
  cat.name=document.getElementById('edit-cat-name').value.trim()||cat.name;
  cat.code=document.getElementById('edit-cat-code').value.trim()||cat.code;
  cat.color=document.getElementById('edit-cat-color').value;
  renderAll();showPage('admin-categories',null);showNotif('Categorie mise a jour');
}
function createCategory(){
  const name=document.getElementById('new-cat-name').value.trim();
  const code=document.getElementById('new-cat-code').value.trim();
  const color=document.getElementById('new-cat-color').value;
  if(!name||!code){showNotif('Nom et code obligatoires');return;}
  categories.push({id:nextCatId++,name,code,color,groupIds:[1,2]});
  closeModal('modal-create-category');
  document.getElementById('new-cat-name').value='';document.getElementById('new-cat-code').value='';
  renderAll();showNotif('Categorie "'+name+'" creee');
}

// ============================================================
// ADMIN — ATTRIBUTS — TRI
// ============================================================
let attrSortState={code:null,dir:'asc'};

function renderAttrsTable(){
  const tb=document.getElementById('attrs-tbody');if(!tb)return;
  const thead=document.getElementById('attrs-thead');
  if(thead){
    const cols=[
      {label:'Nom',code:'name'},{label:'Code',code:'code'},
      {label:'Type',code:'type'},{label:'Groupe',code:'group'},
      {label:'Obligatoire',noSort:true},
      {label:'Options',noSort:true},{label:'Actions',noSort:true}
    ];
    thead.innerHTML='';
    const tr=document.createElement('tr');
    cols.forEach(col=>{
      const th=document.createElement('th');
      if(col.noSort){th.textContent=col.label;th.className='no-sort';}
      else{
        const dir=(attrSortState.code===col.code)?attrSortState.dir:null;
        th.innerHTML=`<div style="display:flex;align-items:center;gap:4px;cursor:pointer" onclick="sortAttrsBy('${col.code}')">
          <span>${col.label}</span>
          <span style="font-size:11px;color:${dir?'#1a2332':'#c0d0e0'}">${dir==='asc'?'▲':dir==='desc'?'▼':'⇅'}</span>
        </div>`;
      }
      tr.appendChild(th);
    });
    thead.appendChild(tr);
  }
  let sorted=[...attributes];
  if(attrSortState.code){
    sorted.sort((a,b)=>{
      let va='',vb='';
      if(attrSortState.code==='name'){va=a.name;vb=b.name;}
      else if(attrSortState.code==='code'){va=a.code;vb=b.code;}
      else if(attrSortState.code==='type'){va=a.type;vb=b.type;}
      else if(attrSortState.code==='group'){
        const ga=getGroupById(a.groupId);const gb=getGroupById(b.groupId);
        va=ga?ga.name:'';vb=gb?gb.name:'';
      }
      const cmp=va.localeCompare(vb,'fr');
      return attrSortState.dir==='asc'?cmp:-cmp;
    });
  }
  tb.innerHTML='';
  sorted.forEach(a=>{
    const g=getGroupById(a.groupId);
    const clickCheck=a.type==='Texte'
      ?`<label class="attr-option-row" title="Clic sur valeur = ouvrir produit">
          <input type="checkbox" ${a.clickToOpen?'checked':''} onchange="setAttrClickToOpen(${a.id},this)"> Clic
        </label>`
      :'';
    tb.innerHTML+=`<tr>
      <td>
        <span class="product-link" onclick="editAttribute(${a.id})" title="Cliquer pour modifier">
          ${a.name}${a.calc?' <span style="font-size:10px;color:#ffa726">&#9654;</span>':''}
        </span>
      </td>
      <td style="font-family:monospace;font-size:12px;color:#607080">${a.code}</td>
      <td>${a.type}</td>
      <td>${g?g.name:'—'}</td>
      <td><span class="badge ${a.required?'badge-green':'badge-grey'}">${a.required?'Oui':'Non'}</span></td>
      <td>${clickCheck}</td>
      <td><div class="td-actions">
        <button class="action-btn" onclick="editAttribute(${a.id})">Editer</button>
        <button class="action-btn-danger" onclick="confirmDelete('attr',${a.id},'${a.name}')">Supprimer</button>
      </div></td>
    </tr>`;
  });
}

function sortAttrsBy(code){
  if(attrSortState.code===code){
    attrSortState.dir=attrSortState.dir==='asc'?'desc':'asc';
  }else{
    attrSortState={code,dir:'asc'};
  }
  renderAttrsTable();
}

function setAttrClickToOpen(attrId,cb){
  if(cb.checked){
    attributes.forEach(a=>{a.clickToOpen=a.id===attrId;});
  }else{
    const a=attributes.find(x=>x.id===attrId);if(a)a.clickToOpen=false;
  }
  renderAttrsTable();
  renderProductsTable();
  showNotif(cb.checked?'Clic actif sur : '+(attributes.find(x=>x.id===attrId)||{}).name:'Option clic desactivee');
}

// ============================================================
// ADMIN — ATTRIBUTS — EDITION
// ============================================================
let editingAttrId=null;

function editAttribute(id){
  editingAttrId=id;
  const a=attributes.find(x=>x.id===id);if(!a)return;
  document.getElementById('ea-name').value=a.name;
  document.getElementById('ea-code').value=a.code;
  document.getElementById('ea-type').value=a.type;
  document.getElementById('ea-required').value=a.required?'1':'0';
  document.getElementById('ea-formula').value=a.formula||'';
  const gSel=document.getElementById('ea-group');
  if(gSel){
    gSel.innerHTML='<option value="">-- Choisir --</option>';
    attrGroups.forEach(g=>{gSel.innerHTML+=`<option value="${g.id}"${g.id===a.groupId?' selected':''}>${g.name}</option>`;});
  }
  const optWrap=document.getElementById('ea-options-wrap');
  if(optWrap){
    const showOpts=a.type==='Simple select'||a.type==='Multi select';
    optWrap.style.display=showOpts?'':'none';
    document.getElementById('ea-options').value=(a.options||[]).join('\n');
  }
  const formulaWrap=document.getElementById('ea-formula-wrap');
  if(formulaWrap)formulaWrap.style.display=a.calc?'':'none';
  showPage('admin-attribute-edit',null);
}

function onEditAttrTypeChange(){
  const type=document.getElementById('ea-type').value;
  const optWrap=document.getElementById('ea-options-wrap');
  const formulaWrap=document.getElementById('ea-formula-wrap');
  if(optWrap)optWrap.style.display=(type==='Simple select'||type==='Multi select')?'':'none';
  if(formulaWrap)formulaWrap.style.display=(type==='Texte calcule'||type==='Nombre calcule')?'':'none';
}

function saveAttributeEdit(){
  const a=attributes.find(x=>x.id===editingAttrId);if(!a)return;
  const newName=document.getElementById('ea-name').value.trim();
  const newCode=document.getElementById('ea-code').value.trim();
  if(!newName||!newCode){showNotif('Nom et code obligatoires');return;}
  if(newCode!==a.code&&attributes.find(x=>x.code===newCode)){showNotif('Code deja utilise par un autre attribut');return;}
  const oldGroupId=a.groupId;
  const newGroupId=parseInt(document.getElementById('ea-group').value)||null;
  const newType=document.getElementById('ea-type').value;
  const isCalc=newType==='Texte calcule'||newType==='Nombre calcule';
  a.name=newName;
  a.code=newCode;
  a.type=newType;
  a.required=document.getElementById('ea-required').value==='1';
  a.calc=isCalc;
  a.formula=isCalc?document.getElementById('ea-formula').value.trim():'';
  if(newType==='Simple select'||newType==='Multi select'){
    a.options=document.getElementById('ea-options').value.split('\n').map(s=>s.trim()).filter(Boolean);
  }else{a.options=[];}
  if(oldGroupId!==newGroupId){
    if(oldGroupId){const og=getGroupById(oldGroupId);if(og)og.attrIds=og.attrIds.filter(id=>id!==a.id);}
    if(newGroupId){const ng=getGroupById(newGroupId);if(ng&&!ng.attrIds.includes(a.id))ng.attrIds.push(a.id);}
    a.groupId=newGroupId;
  }
  renderAll();showPage('admin-attributes',null);showNotif('Attribut "'+newName+'" mis a jour');
}

function createAttribute(){
  const nEl=document.getElementById('new-attr-name'),cEl=document.getElementById('new-attr-code');
  const name=nEl.value.trim(),code=cEl.value.trim();let valid=true;
  nEl.classList.remove('field-error');cEl.classList.remove('field-error');
  document.getElementById('err-attr-name').classList.remove('show');
  document.getElementById('err-attr-code').classList.remove('show');
  if(!name){nEl.classList.add('field-error');document.getElementById('err-attr-name').classList.add('show');valid=false;}
  if(!code){cEl.classList.add('field-error');document.getElementById('err-attr-code').classList.add('show');valid=false;}
  if(code&&attributes.find(a=>a.code===code)){
    cEl.classList.add('field-error');
    document.getElementById('err-attr-code').textContent='Code deja existant.';
    document.getElementById('err-attr-code').classList.add('show');valid=false;
  }
  if(!valid)return;
  const type=document.getElementById('new-attr-type').value;
  const groupId=parseInt(document.getElementById('new-attr-group').value)||null;
  const required=document.getElementById('new-attr-required').value==='1';
  const formula=document.getElementById('new-attr-formula').value.trim();
  const isCalc=type==='Texte calcule'||type==='Nombre calcule';
  const newAttr={id:nextAttrId++,name,code,type,groupId,required,calc:isCalc,formula:isCalc?formula:'',options:[],clickToOpen:false};
  attributes.push(newAttr);
  if(groupId){const g=getGroupById(groupId);if(g)g.attrIds.push(newAttr.id);}
  nEl.value='';cEl.value='';
  renderAll();showPage('admin-attributes',null);showNotif('Attribut "'+name+'" cree');
}

// ============================================================
// ADMIN — GROUPES D'ATTRIBUTS — DRAG & DROP VERTICAL
// ============================================================
function renderAttrGroupsList(){
  const list=document.getElementById('attr-groups-list');if(!list)return;list.innerHTML='';
  attrGroups.forEach(g=>{
    const attrs=g.attrIds.map(id=>getAttrById(id)).filter(Boolean);
    const color=getGroupColor(g);
    const card=document.createElement('div');
    card.className='attr-group-card';
    card.dataset.groupId=g.id;
    if(!g.system){
      card.draggable=true;
      card.addEventListener('dragstart',e=>{
        e.dataTransfer.setData('text/plain',String(g.id));
        card.classList.add('dragging');
      });
      card.addEventListener('dragend',()=>card.classList.remove('dragging'));
      card.addEventListener('dragover',e=>{e.preventDefault();card.classList.add('drag-over-card');});
      card.addEventListener('dragleave',()=>card.classList.remove('drag-over-card'));
      card.addEventListener('drop',e=>{
        e.preventDefault();card.classList.remove('drag-over-card');
        const fromId=parseInt(e.dataTransfer.getData('text/plain'));
        const toId=g.id;
        if(fromId===toId)return;
        const fi=attrGroups.findIndex(x=>x.id===fromId);
        const ti=attrGroups.findIndex(x=>x.id===toId);
        const [moved]=attrGroups.splice(fi,1);
        attrGroups.splice(ti,0,moved);
        renderAttrGroupsList();
        renderProductsTable();
      });
    }
    card.innerHTML=`<div class="attr-group-card-header">
      <div style="display:flex;align-items:center;gap:10px">
        ${!g.system?'<span class="drag-handle" style="cursor:grab;font-size:18px;color:#c0d0e0">&#9776;</span>':''}
        <div class="attr-group-card-title">${g.name}</div>
        ${g.system?'<span class="attr-group-badge-system">Systeme</span>':''}
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;color:#a0b0c0">${attrs.length} attribut${attrs.length>1?'s':''}</span>
        ${!g.system?`<button class="action-btn" onclick="editAttrGroup(${g.id})">Editer</button><button class="action-btn-danger" onclick="confirmDelete('group',${g.id},'${g.name}')">Supprimer</button>`:''}
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">
      ${attrs.map(a=>`<span class="attr-chip" style="background:${color.bg};color:${color.text}">${a.name}</span>`).join('')}
    </div>`;
    list.appendChild(card);
  });
}

function editAttrGroup(id){
  editingGroupId=id;const g=attrGroups.find(x=>x.id===id);if(!g)return;
  document.getElementById('edit-group-name').value=g.name;
  document.getElementById('edit-group-code').value=g.code;
  renderGroupAttrToggles(g);showPage('admin-group-edit',null);
}
function renderGroupAttrToggles(g){
  const list=document.getElementById('group-attr-toggle-list');if(!list)return;list.innerHTML='';
  attributes.forEach(attr=>{
    const isOn=g.attrIds.includes(attr.id);
    const row=document.createElement('div');row.className='attr-toggle-row';row.dataset.attrName=attr.name.toLowerCase();
    row.innerHTML=`<div class="attr-toggle-info"><div class="attr-toggle-name">${attr.name}</div><div class="attr-toggle-meta">${attr.type}</div></div>
    <div class="toggle ${isOn?'on':''}" data-attr-id="${attr.id}" onclick="this.classList.toggle('on')"></div>`;
    list.appendChild(row);
  });
}
function filterGroupAttrToggles(v){
  document.querySelectorAll('#group-attr-toggle-list .attr-toggle-row').forEach(r=>{
    r.style.display=r.dataset.attrName.includes(v.toLowerCase())?'':'none';
  });
}
function saveGroupEdit(){
  const g=attrGroups.find(x=>x.id===editingGroupId);if(!g)return;
  g.name=document.getElementById('edit-group-name').value.trim()||g.name;
  g.code=document.getElementById('edit-group-code').value.trim()||g.code;
  g.attrIds=[];
  document.querySelectorAll('#group-attr-toggle-list .toggle').forEach(t=>{
    if(t.classList.contains('on'))g.attrIds.push(parseInt(t.dataset.attrId));
  });
  renderAll();showPage('admin-groups',null);showNotif('Groupe mis a jour');
}
function createAttrGroup(){
  const name=document.getElementById('new-group-name').value.trim();
  const code=document.getElementById('new-group-code').value.trim();
  if(!name||!code){showNotif('Nom et code obligatoires');return;}
  attrGroups.push({id:nextGroupId++,name,code,system:false,attrIds:[]});
  document.getElementById('new-group-name').value='';document.getElementById('new-group-code').value='';
  closeModal('modal-create-group');renderAll();showNotif('Groupe "'+name+'" cree');
}

// ============================================================
// ADMIN — ROLES
// ============================================================
function renderRoles(){
  const grid=document.getElementById('roles-grid');if(!grid)return;grid.innerHTML='';
  roles.forEach(role=>{
    const card=document.createElement('div');card.className='role-card';
    let permsHtml='<div class="perm-section-title">Administration</div>';
    permsHtml+=permRow(role,'gestion_roles','Gestion des roles','');
    permsHtml+='<div class="perm-section-title">Categories de produit</div>';
    categories.forEach(cat=>{permsHtml+=permRow(role,'cat_'+cat.id,cat.name,cat.color);});
    card.innerHTML=`<div class="role-card-header"><div class="role-name">${role.name}</div><span class="badge badge-grey">${role.mode}</span></div><div class="perm-list">${permsHtml}</div>`;
    grid.appendChild(card);
  });
}
function permRow(role,key,label,color){
  const p=role.perms[key]||{r:false,w:false,d:false};
  const dot=color?`<span class="cat-dot" style="background:${color}"></span>`:'';
  return`<div class="perm-row"><span class="perm-label">${dot}${label}</span>
  <div class="perm-actions">
  <button class="perm-icon-btn ${p.r?'active-read':''}" title="Consulter" onclick="togglePerm(${role.id},'${key}','r',this)">&#128065;</button>
  <button class="perm-icon-btn ${p.w?'active-write':''}" title="Modifier" onclick="togglePerm(${role.id},'${key}','w',this)">&#9999;&#65039;</button>
  <button class="perm-icon-btn ${p.d?'active-delete':''}" title="Supprimer" onclick="togglePerm(${role.id},'${key}','d',this)">&#128465;&#65039;</button>
  </div></div>`;
}
function togglePerm(roleId,key,type,btn){
  const role=roles.find(r=>r.id===roleId);if(!role)return;
  if(!role.perms[key])role.perms[key]={r:false,w:false,d:false};
  role.perms[key][type]=!role.perms[key][type];
  btn.classList.toggle(type==='r'?'active-read':type==='w'?'active-write':'active-delete');
}

// ============================================================
// ADMIN — PRODUITS
// ============================================================
function createProduct(){
  const sap=document.getElementById('np-sap').value.trim();
  const ean=document.getElementById('np-ean').value.trim();
  const name=document.getElementById('np-name').value.trim();
  const cat=document.getElementById('np-cat').value;
  let valid=true;
  ['np-sap','np-ean','np-name','np-cat'].forEach(id=>{
    const el=document.getElementById(id);const errEl=document.getElementById('err-'+id);
    if(el)el.classList.remove('field-error');if(errEl)errEl.classList.remove('show');
  });
  if(!sap){document.getElementById('np-sap').classList.add('field-error');document.getElementById('err-np-sap').classList.add('show');valid=false;}
  if(!ean){document.getElementById('np-ean').classList.add('field-error');document.getElementById('err-np-ean').classList.add('show');valid=false;}
  if(!name){document.getElementById('np-name').classList.add('field-error');document.getElementById('err-np-name').classList.add('show');valid=false;}
  if(!cat){document.getElementById('np-cat').classList.add('field-error');document.getElementById('err-np-cat').classList.add('show');valid=false;}
  if(!valid)return;
  const today=todayStr();
  products.push({id:nextProductId++,cat,createdAt:today,maj:nowStr(),visualSrc:null,visuals:0,history:[],
    fields:{sap,ean,nom:name,miseEnLigne:'',created_at:today}});
  closeModal('modal-create-product');
  ['np-sap','np-ean','np-name'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('np-cat').value='';
  renderAll();showNotif('Produit "'+name+'" cree');
}

// ============================================================
// ADMIN — SUPPRESSIONS / DIVERS
// ============================================================
function confirmDelete(type,id,name){
  pendingDelete={type,id};
  document.getElementById('confirm-delete-text').textContent='Supprimer "'+name+'" ?';
  document.getElementById('confirm-delete-btn').onclick=executeDelete;
  openModal('modal-confirm-delete');
}
function executeDelete(){
  if(!pendingDelete)return;
  if(pendingDelete.type==='cat')categories=categories.filter(c=>c.id!==pendingDelete.id);
  else if(pendingDelete.type==='attr'){attributes=attributes.filter(a=>a.id!==pendingDelete.id);attrGroups.forEach(g=>{g.attrIds=g.attrIds.filter(id=>id!==pendingDelete.id);});}
  else if(pendingDelete.type==='product')products=products.filter(p=>p.id!==pendingDelete.id);
  else if(pendingDelete.type==='group'){attrGroups=attrGroups.filter(g=>g.id!==pendingDelete.id);categories.forEach(c=>{c.groupIds=c.groupIds.filter(id=>id!==pendingDelete.id);});}
  else if(pendingDelete.type==='brand'){brandSettings=brandSettings.filter((_,i)=>i!==pendingDelete.id);}
  else if(pendingDelete.type==='supplier'){
    suppliers=suppliers.filter(s=>s.code!==pendingDelete.id);
    brandSettings=brandSettings.filter(b=>b.fournisseurCode!==pendingDelete.id);
  }
  closeModal('modal-confirm-delete');renderAll();showNotif('Element supprime');pendingDelete=null;
}
function saveSeuil(){
  const v=parseInt(document.getElementById('seuil-input').value);
  if(!isNaN(v)&&v>=0&&v<=100)seuilCompletion=v;
  closeModal('modal-seuil');showNotif('Seuil mis a jour : '+seuilCompletion+'%');renderDashboard();
}

// ============================================================
// ADMIN — MARQUES / FOURNISSEURS
// ============================================================
let editingBrandIdx=null;

// Badge type dynamique base sur la couleur de la categorie
function catBadgeHtml(typeName){
  const cat=categories.find(c=>c.name===typeName);
  if(!cat)return`<span class="badge badge-grey" style="font-size:11px">${typeName||'—'}</span>`;
  return`<span class="badge" style="font-size:11px;background:${cat.color}22;color:${cat.color};border:1px solid ${cat.color}55">${typeName}</span>`;
}

function renderSuppliersPage(){
  const page=document.getElementById('page-admin-suppliers');if(!page)return;
  let html=`<div style="display:flex;gap:12px;margin-bottom:20px;align-items:center">
    <input class="search-input" type="text" id="supplier-search" placeholder="Rechercher une marque ou un fournisseur..." oninput="filterSuppliersTable()" style="flex:1">
    <button class="btn btn-primary" onclick="openBrandEditor(-1)">+ Nouvelle entree</button>
  </div>`;
  html+=`<div class="table-container"><table id="suppliers-table">
    <thead><tr>
      <th>Fournisseur</th><th>Code</th><th>Marque</th><th>Type</th>
      <th>RF</th><th>RFA</th><th>Remise ATS</th><th>Reprise</th>
      <th>Conditions livraison</th><th>Commentaire</th><th>Actions</th>
    </tr></thead>
    <tbody id="suppliers-tbody"></tbody>
  </table></div>`;
  page.innerHTML=`<div style="margin-bottom:16px"><button class="btn btn-secondary" onclick="showPage('admin',null)">&larr; Administration</button></div>${html}`;
  renderSuppliersTable();
}
function renderSuppliersTable(filter){
  const tb=document.getElementById('suppliers-tbody');if(!tb)return;
  const q=(filter||'').toLowerCase();
  tb.innerHTML='';
  brandSettings.forEach((b,idx)=>{
    const sup=suppliers.find(s=>s.code===b.fournisseurCode);
    const supName=sup?sup.name:b.fournisseurCode;
    if(q&&!supName.toLowerCase().includes(q)&&!b.marque.toLowerCase().includes(q))return;
    const repriseLabel=b.repriseEchange
      ?`<span class="badge badge-green" style="font-size:11px">Oui</span>`
      :`<span class="badge badge-grey" style="font-size:11px">Non</span>`;
    const commentTrunc=b.commentaire&&b.commentaire.length>40?b.commentaire.slice(0,40)+'…':b.commentaire||'';
    tb.innerHTML+=`<tr>
      <td style="font-weight:600;white-space:nowrap">${supName}</td>
      <td style="font-family:monospace;font-size:11px;color:#607080">${b.fournisseurCode}</td>
      <td style="white-space:nowrap">${b.marque}</td>
      <td>${catBadgeHtml(b.type)}</td>
      <td style="text-align:right">${b.rf>0?(b.rf*100).toFixed(2)+'%':'—'}</td>
      <td style="text-align:right">${b.rfa>0?(b.rfa*100).toFixed(2)+'%':'—'}</td>
      <td style="text-align:right;font-weight:600;color:#1565c0">${b.remiseAts>0?(b.remiseAts*100).toFixed(0)+'%':'—'}</td>
      <td style="text-align:center">${repriseLabel}</td>
      <td style="font-size:12px;color:#607080;white-space:nowrap">${b.conditionsLivraison||'—'}</td>
      <td style="font-size:11px;color:#8090a0;max-width:180px" title="${b.commentaire||''}">${commentTrunc||'—'}</td>
      <td><div class="td-actions">
        <button class="action-btn" onclick="openBrandEditor(${idx})">Editer</button>
        <button class="action-btn-danger" onclick="confirmDelete('brand',${idx},'${b.marque}')">Supprimer</button>
      </div></td>
    </tr>`;
  });
}
function filterSuppliersTable(){
  const q=(document.getElementById('supplier-search')||{}).value||'';
  renderSuppliersTable(q);
}
function openBrandEditor(idx){
  editingBrandIdx=idx;
  const isNew=idx===-1;
  const b=isNew?{fournisseurCode:'',marque:'',type:'',rf:0,rfa:0,remiseAts:0,repriseEchange:false,conditionsLivraison:'Franco',commentaire:''}:brandSettings[idx];
  const existing=document.getElementById('brand-editor-overlay');if(existing)existing.remove();
  const supOptions=suppliers.map(s=>`<option value="${s.code}"${s.code===b.fournisseurCode?' selected':''}>${s.name} (${s.code})</option>`).join('');
  const typeOptions=categories.map(c=>`<option value="${c.name}"${c.name===b.type?' selected':''}>${c.name}</option>`).join('');
  const overlay=document.createElement('div');
  overlay.id='brand-editor-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:2000;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML=`<div style="background:#fff;border-radius:14px;padding:28px;width:560px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,0.18)">
    <div style="font-size:15px;font-weight:700;color:#1a2332;margin-bottom:20px">${isNew?'Nouvelle entree fournisseur / marque':'Modifier : '+b.marque+(b.type?' — '+b.type:'')}</div>
    <div class="form-grid" style="margin-bottom:16px">
      <div class="form-field"><div class="form-label">Fournisseur *</div><select class="form-select" id="be-supplier">${supOptions}</select></div>
      <div class="form-field"><div class="form-label">Marque *</div><input class="field-input" id="be-marque" value="${b.marque}" placeholder="ex : Ray-Ban"></div>
      <div class="form-field"><div class="form-label">Type (categorie)</div><select class="form-select" id="be-type"><option value="">-- Choisir --</option>${typeOptions}</select></div>
      <div class="form-field"><div class="form-label">RF %</div><input class="field-input" type="number" step="0.01" id="be-rf" value="${(b.rf*100).toFixed(2)}"></div>
      <div class="form-field"><div class="form-label">RFA %</div><input class="field-input" type="number" step="0.01" id="be-rfa" value="${(b.rfa*100).toFixed(2)}"></div>
      <div class="form-field"><div class="form-label">Remise ATS %</div><input class="field-input" type="number" step="0.01" id="be-remise-ats" value="${(b.remiseAts*100).toFixed(2)}"></div>
      <div class="form-field"><div class="form-label">Reprise echange</div><select class="form-select" id="be-reprise"><option value="1"${b.repriseEchange?' selected':''}>Oui</option><option value="0"${!b.repriseEchange?' selected':''}>Non</option></select></div>
      <div class="form-field"><div class="form-label">Conditions de livraison</div><input class="field-input" id="be-conditions" value="${b.conditionsLivraison||''}"></div>
    </div>
    <div class="form-field" style="margin-bottom:20px"><div class="form-label">Commentaire</div><textarea class="field-input" id="be-commentaire" rows="2" style="resize:vertical">${b.commentaire||''}</textarea></div>
    <div style="display:flex;justify-content:flex-end;gap:10px">
      <button class="btn btn-secondary" onclick="document.getElementById('brand-editor-overlay').remove()">Annuler</button>
      <button class="btn btn-primary" onclick="saveBrandEditor()">Enregistrer</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
}
function saveBrandEditor(){
  const marque=(document.getElementById('be-marque').value||'').trim();
  const fournisseurCode=document.getElementById('be-supplier').value;
  if(!marque||!fournisseurCode){showNotif('Fournisseur et marque obligatoires');return;}
  const entry={
    marque,fournisseurCode,
    type:document.getElementById('be-type').value,
    rf:parseFloat(document.getElementById('be-rf').value||0)/100,
    rfa:parseFloat(document.getElementById('be-rfa').value||0)/100,
    remiseAts:parseFloat(document.getElementById('be-remise-ats').value||0)/100,
    repriseEchange:document.getElementById('be-reprise').value==='1',
    conditionsLivraison:document.getElementById('be-conditions').value.trim(),
    commentaire:document.getElementById('be-commentaire').value.trim()
  };
  if(editingBrandIdx===-1)brandSettings.push(entry);
  else brandSettings[editingBrandIdx]=entry;
  document.getElementById('brand-editor-overlay').remove();
  renderSuppliersTable();
  showNotif(editingBrandIdx===-1?'Entree creee : '+marque:'Entree mise a jour : '+marque);
}

// ============================================================
// INIT
// ============================================================
function renderAll(){renderDashboard();renderProductsTable();renderFilterCat();renderNpCat();updateCounts();}
renderAll();
