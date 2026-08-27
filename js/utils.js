function getCompletionColor(p){return p<40?'#ef5350':p<70?'#ffa726':'#66bb6a';}
function getAttrById(id){return attributes.find(a=>a.id===id);}
function getGroupById(id){return attrGroups.find(g=>g.id===id);}
function getCatByName(name){return categories.find(c=>c.name===name);}
function getAttrsForCat(catName){
  const cat=getCatByName(catName);if(!cat)return[];
  return cat.groupIds.flatMap(gid=>{const g=getGroupById(gid);return g?g.attrIds:[];}).map(id=>getAttrById(id)).filter(Boolean);
}
function calcCompletion(product){
  const attrs=getAttrsForCat(product.cat).filter(a=>!a.calc&&!a.readonly&&a.required);
  let filled=0;
  attrs.forEach(a=>{const v=product.fields[a.code];if(v!==undefined&&v!==null&&v.toString().trim()!=='')filled++;});
  if(product.visuals>0)filled++;
  return(attrs.length+1)>0?Math.round((filled/(attrs.length+1))*100):0;
}
function computeCalcFields(product){
  const f=product.fields;
  const pa=parseFloat(f.pa_ats)||0,rem=parseFloat(f.remise)||0,rfa=parseFloat(f.rfa)||0,pv=parseFloat(f.prix_vente)||0;
  f.pa_opticien=pa>0?(pa*(1-rem/100)).toFixed(2):'';
  f.marge_ats=pa>0?(pa*(1-rem/100)*(1+rfa/100)).toFixed(2):'';
  const paOpt=parseFloat(f.pa_opticien)||0;
  f.prix_final=paOpt>0?(paOpt*2).toFixed(2):'';
  const pf=parseFloat(f.prix_final)||0;
  f.taux_marque=pf>0?((pf-paOpt)/pf*100).toFixed(1):'';
  f.nom_marketing=[f.marque,f.ref_monture,f.couleur].filter(Boolean).join(' ')||'';
  f.prix_tva=pv>0?(pv*1.055).toFixed(2):'';
  return f;
}
function nowStr(){const d=new Date();return d.toLocaleDateString('fr-FR')+' '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});}
function todayStr(){return new Date().toLocaleDateString('fr-FR');}

// ============================================================
// BADGE CATEGORIE DYNAMIQUE
// ============================================================
function getBadgeClass(catName){
  // Retourne toujours 'badge-dynamic' — la couleur est injectee en style inline
  return'badge-dynamic';
}
function getCatColor(catName){
  const cat=getCatByName(catName);
  return cat?cat.color:'#607080';
}
function catBadgeHtml(catName){
  const color=getCatColor(catName);
  // Genere une couleur de texte lisible (fonce si couleur claire, clair si fonce)
  const r=parseInt(color.slice(1,3),16),g=parseInt(color.slice(3,5),16),b=parseInt(color.slice(5,7),16);
  const lum=(r*299+g*587+b*114)/1000;
  const textColor=lum>140?darkenColor(color,50):'#fff';
  const bgColor=hexToRgba(color,0.15);
  return`<span class="badge" style="background:${bgColor};color:${textColor};border:1px solid ${hexToRgba(color,0.35)}">${catName}</span>`;
}
function hexToRgba(hex,alpha){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return`rgba(${r},${g},${b},${alpha})`;
}
function darkenColor(hex,amount){
  let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  r=Math.max(0,r-amount);g=Math.max(0,g-amount);b=Math.max(0,b-amount);
  return'#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
}

function visualThumb(p,size){
  size=size||40;
  if(p.visualSrc)return`<img src="${p.visualSrc}" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:6px;border:1px solid #e8ecf0;">`;
  return`<div style="width:${size}px;height:${size}px;border-radius:6px;background:#f0f4f8;border:1px solid #e8ecf0;display:flex;align-items:center;justify-content:center;color:#c0d0e0;font-size:${Math.round(size*0.45)}px;">&#128247;</div>`;
}
function showNotif(msg){const n=document.getElementById('notif');if(!n)return;n.textContent=msg;n.classList.add('show');setTimeout(()=>n.classList.remove('show'),3000);}
function openModal(id){
  const el=document.getElementById(id);if(!el)return;
  el.classList.add('open');
  if(id==='modal-import-template')initImportTemplateModal();
}
function closeModal(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.modal-overlay').forEach(m=>{m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');});});
document.addEventListener('click',e=>{
  if(activeColFilterDropdown&&!activeColFilterDropdown.contains(e.target)&&!e.target.classList.contains('th-filter-icon')){
    activeColFilterDropdown.remove();activeColFilterDropdown=null;
  }
});

// ============================================================
// MODALE MODELE D'IMPORT
// ============================================================
const importTemplateDescriptions={
  correction_prix:'Colonnes incluses : Code SAP, Code EAN, Prix public TTC, Prix achat HT, Remise fournisseur.',
  ajout_produits:'Colonnes incluses : Code SAP, Code EAN, Nom produit, Categorie, Marque, Reference, Couleur, Prix public TTC, Prix achat HT, ainsi que tous les attributs obligatoires de la categorie selectionnee.',
  suppression_produits:'Colonnes incluses : Code SAP, Code EAN. Attention : la suppression est irreversible.'
};
function initImportTemplateModal(){
  const catSel=document.getElementById('import-template-cat');
  if(catSel){
    catSel.innerHTML='<option value="toutes">Toutes categories</option>';
    categories.forEach(c=>{catSel.innerHTML+=`<option value="${c.name}">${c.name}</option>`;});
  }
  updateImportTemplateDesc();
}
function updateImportTemplateDesc(){
  const type=(document.getElementById('import-template-type')||{}).value||'correction_prix';
  const desc=document.getElementById('import-template-desc');
  if(desc)desc.textContent=importTemplateDescriptions[type]||'';
}
function downloadImportTemplate(){
  const type=(document.getElementById('import-template-type')||{}).value||'correction_prix';
  const cat=(document.getElementById('import-template-cat')||{}).value||'toutes';
  const fmt=document.querySelector('input[name="import-template-format"]:checked');
  const format=fmt?fmt.value:'xlsx';
  const typeLabel={'correction_prix':'Correction_prix','ajout_produits':'Ajout_produits','suppression_produits':'Suppression_produits'}[type]||type;
  const catLabel=cat==='toutes'?'Toutes_categories':cat.replace(/\s+/g,'_');
  const filename=`Trame_${typeLabel}_${catLabel}.${format}`;
  closeModal('modal-import-template');
  showNotif(`Telechargement simule : ${filename}`);
}

// ============================================================
// NAVIGATION ET RENDU GLOBAL
// ============================================================
const pageTitles={
  dashboard:'Dashboard',products:'Produits','product-detail':'Fiche produit',
  imports:'Imports',exports:'Exports',admin:'Administration',
  'admin-users':'Utilisateurs','admin-roles':'Roles',
  'admin-groups':'Groupes d attributs','admin-group-edit':'Modifier un groupe',
  'admin-attributes':'Attributs','admin-attribute-create':'Creer un attribut',
  'admin-attribute-edit':'Modifier un attribut',
  'admin-categories':'Categories','admin-category-edit':'Modifier une categorie',
  'admin-suppliers':'Marques / Fournisseurs'
};
function showPage(id,navEl){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const el=document.getElementById('page-'+id);if(el)el.classList.add('active');
  document.getElementById('topbar-title').textContent=pageTitles[id]||id;
  if(navEl){document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));navEl.classList.add('active');}
  if(id==='admin-groups')renderAttrGroupsList();
  if(id==='admin-attributes'){renderAttrsTable();attrSortState={};}
  if(id==='admin-categories')renderCatsTable();
  if(id==='admin-roles')renderRoles();
  if(id==='admin-attribute-create')renderAttrGroupSelect();
  if(id==='admin-suppliers')renderSuppliersPage();
  updateCounts();
}
function safeShowPage(id,navEl){
  if(productDirty&&currentProductId){
    pendingNavTarget={id,navEl};
    openModal('modal-unsaved');
  }else{
    productDirty=false;currentProductId=null;
    showPage(id,navEl);
  }
}
function updateCounts(){
  const bc=document.getElementById('admin-brand-count');if(bc)bc.textContent=brandSettings.length;
  const gc=document.getElementById('admin-group-count');if(gc)gc.textContent=attrGroups.length;
  const ac=document.getElementById('admin-attr-count');if(ac)ac.textContent=attributes.length;
  const cc=document.getElementById('admin-cat-count');if(cc)cc.textContent=categories.length;
}
function renderAll(){renderDashboard();renderProductsTable();renderFilterCat();renderNpCat();updateCounts();}
function getGroupColor(g){
  const palette=[
    {bg:'#f0f4f8',text:'#607080'},{bg:'#fce4ec',text:'#880e4f'},
    {bg:'#e3f2fd',text:'#1565c0'},{bg:'#e8f5e9',text:'#1b5e20'},
    {bg:'#fff8e1',text:'#f57f17'},{bg:'#e0f7fa',text:'#006064'},
    {bg:'#ede7f6',text:'#4527a0'},{bg:'#fff3e0',text:'#e65100'},
    {bg:'#fce4ec',text:'#880e4f'},{bg:'#e8eaf6',text:'#283593'},
    {bg:'#f9fbe7',text:'#558b2f'},{bg:'#e0f2f1',text:'#00695c'}
  ];
  // Groupes systeme toujours en gris
  if(g.system)return{bg:'#f0f4f8',text:'#607080'};
  // Couleur basee sur l'index dans attrGroups pour stabilite
  const idx=attrGroups.findIndex(x=>x.id===g.id);
  return palette[(idx+1)%palette.length]||{bg:'#f0f4f8',text:'#607080'};
}
function getVisibleGroupsForUser(){
  // Respecte l'ordre de attrGroups (drag & drop)
  const allGroupIds=[...new Set(categories.flatMap(c=>c.groupIds))];
  return attrGroups.filter(g=>allGroupIds.includes(g.id));
}
function initGroupFilters(){
  if(activeGroupFilters===null)activeGroupFilters=new Set(getVisibleGroupsForUser().map(g=>g.id));
}
function renderGroupFilterBar(){
  const bar=document.getElementById('group-filter-bar-container');if(!bar)return;
  if(currentView!=='detail'){bar.innerHTML='';return;}
  initGroupFilters();
  const groups=getVisibleGroupsForUser();
  let html='<div class="group-filter-bar"><span style="font-size:12px;font-weight:600;color:#607080;margin-right:4px;white-space:nowrap">Groupes :</span>';
  groups.forEach(g=>{
    const active=activeGroupFilters.has(g.id);
    const color=getGroupColor(g);
    html+=`<span class="group-filter-chip ${active?'active':'inactive'}" style="${active?`background:${color.bg};color:${color.text};border-color:${color.text}`:'background:#fff;color:#a0b0c0;border-color:#dde3ea'}" onclick="toggleGroupFilter(${g.id})">${g.name}</span>`;
  });
  html+='</div>';bar.innerHTML=html;
}
function toggleGroupFilter(groupId){
  initGroupFilters();
  if(activeGroupFilters.has(groupId))activeGroupFilters.delete(groupId);
  else activeGroupFilters.add(groupId);
  renderGroupFilterBar();renderProductsTable();
}
function renderFilterCat(){
  const s=document.getElementById('filter-cat');if(!s)return;
  const cur=s.value;s.innerHTML='<option value="">Toutes categories</option>';
  categories.forEach(c=>{s.innerHTML+=`<option value="${c.name}">${c.name}</option>`;});
  if(cur)s.value=cur;
}
function renderNpCat(){
  const s=document.getElementById('np-cat');if(!s)return;
  s.innerHTML='<option value="">-- Choisir --</option>';
  categories.forEach(c=>{s.innerHTML+=`<option value="${c.name}">${c.name}</option>`;});
}
function renderAttrGroupSelect(){
  const s=document.getElementById('new-attr-group');if(!s)return;
  s.innerHTML='<option value="">-- Choisir --</option>';
  attrGroups.forEach(g=>{s.innerHTML+=`<option value="${g.id}">${g.name}</option>`;});
}
const topbarDate=document.getElementById('topbar-date');
if(topbarDate)topbarDate.textContent=new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
(function(){
  const logoEl=document.querySelector('.sidebar-logo');if(!logoEl)return;
  logoEl.innerHTML=`<svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="32" cy="26" rx="16" ry="14" fill="#4fc3f7"/>
  <circle cx="26" cy="22" r="3.5" fill="#fff"/><circle cx="38" cy="22" r="3.5" fill="#fff"/>
  <circle cx="27" cy="22" r="1.5" fill="#1a2332"/><circle cx="39" cy="22" r="1.5" fill="#1a2332"/>
  <path d="M20 36 Q14 42 12 50 Q16 46 18 50 Q20 44 24 40" fill="#4fc3f7"/>
  <path d="M24 38 Q20 46 20 54 Q24 50 26 54 Q26 46 28 40" fill="#4fc3f7"/>
  <path d="M28 39 Q26 48 28 56 Q31 52 32 56 Q33 52 36 56 Q38 48 36 39" fill="#4fc3f7"/>
  <path d="M36 38 Q40 46 40 54 Q36 50 38 54 Q40 46 40 40" fill="#4fc3f7"/>
  <path d="M40 36 Q46 42 48 50 Q44 46 42 50 Q42 44 38 40" fill="#4fc3f7"/>
  <path d="M18 34 Q10 38 8 46 Q12 42 14 46 Q16 40 20 36" fill="#4fc3f7"/>
  <path d="M46 34 Q54 38 56 46 Q52 42 50 46 Q48 40 44 36" fill="#4fc3f7"/>
  </svg>Octo<span>PIM</span>`;
})();
