function renderCatsTable(){
  const tb=document.getElementById('cats-tbody');if(!tb)return;tb.innerHTML='';
  categories.forEach(cat=>{
    const nb=cat.groupIds.length;
    tb.innerHTML+=`<tr><td><strong>${cat.name}</strong></td><td style="font-family:monospace;font-size:12px;color:#607080">${cat.code}</td>
    <td><span class="color-swatch" style="background:${cat.color}"></span>${cat.color}</td>
    <td>${nb} groupe${nb>1?'s':''}</td>
    <td><div class="td-actions"><button class="action-btn" onclick="editCategory(${cat.id})">Editer</button><button class="action-btn-danger" onclick="confirmDelete('cat',${cat.id},'${cat.name}')">Supprimer</button></div></td></tr>`;
  });
}
function renderAttrsTable(){
  const tb=document.getElementById('attrs-tbody');if(!tb)return;tb.innerHTML='';
  attributes.forEach(a=>{
    const g=getGroupById(a.groupId);
    tb.innerHTML+=`<tr>
      <td>${a.name}${a.calc?' <span style="font-size:10px;color:#ffa726">&#9654;</span>':''}</td>
      <td style="font-family:monospace;font-size:12px;color:#607080">${a.code}</td>
      <td>${a.type}</td><td>${g?g.name:'—'}</td>
      <td><span class="badge ${a.required?'badge-green':'badge-grey'}">${a.required?'Oui':'Non'}</span></td>
      <td><button class="action-btn-danger" onclick="confirmDelete('attr',${a.id},'${a.name}')">Supprimer</button></td></tr>`;
  });
}
function renderAttrGroupsList(){
  const list=document.getElementById('attr-groups-list');if(!list)return;list.innerHTML='';
  attrGroups.forEach(g=>{
    const attrs=g.attrIds.map(id=>getAttrById(id)).filter(Boolean);
    const color=getGroupColor(g);
    const card=document.createElement('div');card.className='attr-group-card';
    card.innerHTML=`<div class="attr-group-card-header">
      <div style="display:flex;align-items:center;gap:10px"><div class="attr-group-card-title">${g.name}</div>${g.system?'<span class="attr-group-badge-system">Systeme</span>':''}</div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;color:#a0b0c0">${attrs.length} attribut${attrs.length>1?'s':''}</span>
        ${!g.system?`<button class="action-btn" onclick="editAttrGroup(${g.id})">Editer</button><button class="action-btn-danger" onclick="confirmDelete('group',${g.id},'${g.name}')">Supprimer</button>`:''}
      </div></div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">${attrs.map(a=>`<span class="attr-chip" style="background:${color.bg};color:${color.text}">${a.name}</span>`).join('')}</div>`;
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
function filterGroupAttrToggles(v){document.querySelectorAll('#group-attr-toggle-list .attr-toggle-row').forEach(r=>{r.style.display=r.dataset.attrName.includes(v.toLowerCase())?'':'none';});}
function saveGroupEdit(){
  const g=attrGroups.find(x=>x.id===editingGroupId);if(!g)return;
  g.name=document.getElementById('edit-group-name').value.trim()||g.name;
  g.code=document.getElementById('edit-group-code').value.trim()||g.code;
  g.attrIds=[];
  document.querySelectorAll('#group-attr-toggle-list .toggle').forEach(t=>{if(t.classList.contains('on'))g.attrIds.push(parseInt(t.dataset.attrId));});
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
function createAttribute(){
  const nEl=document.getElementById('new-attr-name'),cEl=document.getElementById('new-attr-code');
  const name=nEl.value.trim(),code=cEl.value.trim();let valid=true;
  nEl.classList.remove('field-error');cEl.classList.remove('field-error');
  document.getElementById('err-attr-name').classList.remove('show');
  document.getElementById('err-attr-code').classList.remove('show');
  if(!name){nEl.classList.add('field-error');document.getElementById('err-attr-name').classList.add('show');valid=false;}
  if(!code){cEl.classList.add('field-error');document.getElementById('err-attr-code').classList.add('show');valid=false;}
  if(code&&attributes.find(a=>a.code===code)){cEl.classList.add('field-error');document.getElementById('err-attr-code').textContent='Code deja existant.';document.getElementById('err-attr-code').classList.add('show');valid=false;}
  if(!valid)return;
  const type=document.getElementById('new-attr-type').value;
  const groupId=parseInt(document.getElementById('new-attr-group').value)||null;
  const required=document.getElementById('new-attr-required').value==='1';
  const newAttr={id:nextAttrId++,name,code,type,groupId,required,calc:false,formula:'',options:[]};
  attributes.push(newAttr);
  if(groupId){const g=getGroupById(groupId);if(g)g.attrIds.push(newAttr.id);}
  nEl.value='';cEl.value='';
  renderAll();showPage('admin-attributes',null);showNotif('Attribut "'+name+'" cree');
}
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
  closeModal('modal-confirm-delete');renderAll();showNotif('Element supprime');pendingDelete=null;
}
function saveSeuil(){
  const v=parseInt(document.getElementById('seuil-input').value);
  if(!isNaN(v)&&v>=0&&v<=100)seuilCompletion=v;
  closeModal('modal-seuil');showNotif('Seuil mis a jour : '+seuilCompletion+'%');renderDashboard();
}
renderAll();