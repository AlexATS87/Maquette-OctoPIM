// ============================================================
// FILTRE COLONNE (style Excel)
// ============================================================
function getColUniqueValues(code){
  const vals=new Set();
  const searchVal=(document.getElementById('products-search')||{}).value||'';
  const catFilter=(document.getElementById('filter-cat')||{}).value||'';
  products.filter(p=>{
    if(catFilter&&p.cat!==catFilter)return false;
    computeCalcFields(p);
    const allText=Object.values(p.fields).join(' ').toLowerCase()+' '+(p.cat||'').toLowerCase();
    if(searchVal&&!allText.includes(searchVal.toLowerCase()))return false;
    // Applique tous les filtres colonne SAUF celui de la colonne en cours
    for(const c in colFilters){
      if(c===code)continue;
      const allowed=colFilters[c];
      const val=(p.fields[c]||p[c]||'').toString().trim();
      if(!allowed.has(val))return false;
    }
    return true;
  }).forEach(p=>{
    const v=p.fields[code]||p[code];
    if(v!==undefined&&v!==null&&v.toString().trim()!=='')vals.add(v.toString().trim());
  });
  return[...vals].sort((a,b)=>a.localeCompare(b,'fr'));
}
function openColFilter(code,label,iconEl){
  if(activeColFilterDropdown){activeColFilterDropdown.remove();activeColFilterDropdown=null;}
  const vals=getColUniqueValues(code);
  const active=colFilters[code]||null;
  const rect=iconEl.getBoundingClientRect();
  const dd=document.createElement('div');dd.className='col-filter-dropdown';
  dd.style.top=(rect.bottom+4)+'px';dd.style.left=Math.min(rect.left,window.innerWidth-270)+'px';
  let itemsHtml='';
  if(!vals.length){itemsHtml='<div class="col-filter-empty">Aucune valeur disponible</div>';}
  else{
    const allChecked=!active||active.size===0;
    itemsHtml+=`<div class="col-filter-item" id="cfa-row-${code}"><input type="checkbox" id="cfa-${code}" ${allChecked?'checked':''} onchange="toggleColFilterAll('${code}',this)"><label for="cfa-${code}" style="font-weight:600">Tout selectionner</label></div>`;
    vals.forEach((v,i)=>{
      const checked=!active||active.has(v);
      itemsHtml+=`<div class="col-filter-item col-filter-val-item" data-val="${v.replace(/"/g,'&quot;')}"><input type="checkbox" id="cfv-${code}-${i}" ${checked?'checked':''} onchange="toggleColFilterVal('${code}','${v.replace(/'/g,"\\'")}',this)"><label for="cfv-${code}-${i}">${v}</label></div>`;
    });
  }
  dd.innerHTML=`<div class="col-filter-dropdown-header"><span>${label}</span><button onclick="clearColFilter('${code}')">Effacer</button></div>
    <div class="col-filter-search-wrap"><input type="text" class="col-filter-search" placeholder="Rechercher..." oninput="filterColFilterList(this)"></div>
    <div class="col-filter-list">${itemsHtml}</div>`;
  document.body.appendChild(dd);activeColFilterDropdown=dd;
  setTimeout(()=>document.addEventListener('click',colFilterOutsideClick),0);
}
function filterColFilterList(input){
  const q=input.value.toLowerCase().trim();
  const dd=input.closest('.col-filter-dropdown');if(!dd)return;
  dd.querySelectorAll('.col-filter-val-item').forEach(item=>{
    const val=(item.getAttribute('data-val')||'').toLowerCase();
    item.style.display=(!q||val.includes(q))?'':'none';
  });
  const allVisible=[...dd.querySelectorAll('.col-filter-val-item')].filter(i=>i.style.display!=='none');
  const allChecked=allVisible.every(i=>i.querySelector('input').checked);
  const cbAll=dd.querySelector('input[id^="cfa-"]');
  if(cbAll)cbAll.checked=allChecked;
}
function colFilterOutsideClick(e){
  if(activeColFilterDropdown&&!activeColFilterDropdown.contains(e.target)){
    activeColFilterDropdown.remove();activeColFilterDropdown=null;
    document.removeEventListener('click',colFilterOutsideClick);
  }
}
function toggleColFilterVal(code,val,cb){
  const vals=getColUniqueValues(code);
  if(!colFilters[code])colFilters[code]=new Set(vals);
  if(cb.checked)colFilters[code].add(val);else colFilters[code].delete(val);
  const dd=activeColFilterDropdown;
  // Retirer temporairement le listener pour éviter qu'il ferme le dropdown
  document.removeEventListener('click',colFilterOutsideClick);
  renderProductsTable();
  activeColFilterDropdown=dd;
  if(dd){
    dd.querySelectorAll('.col-filter-val-item input').forEach(input=>{
      const v=input.closest('.col-filter-val-item')&&input.closest('.col-filter-val-item').getAttribute('data-val');
      if(v)input.checked=!colFilters[code]||colFilters[code].has(v);
    });
    const cbAll=dd.querySelector('input[id^="cfa-"]');
    if(cbAll)cbAll.checked=!colFilters[code];
    // Réattacher le listener avec un délai pour laisser l'event en cours se terminer
    setTimeout(()=>document.addEventListener('click',colFilterOutsideClick),0);
  }
}
function toggleColFilterAll(code,cb){
  if(cb.checked){
    delete colFilters[code];
    if(activeColFilterDropdown){
      activeColFilterDropdown.querySelectorAll('.col-filter-val-item input').forEach(c=>c.checked=true);
    }
  }else{
    colFilters[code]=new Set();
    if(activeColFilterDropdown){
      activeColFilterDropdown.querySelectorAll('.col-filter-val-item input').forEach(c=>c.checked=false);
    }
  }
  renderProductsTable();
}
function clearColFilter(code){
  delete colFilters[code];
  if(activeColFilterDropdown){activeColFilterDropdown.remove();activeColFilterDropdown=null;}
  renderProductsTable();
}
function isColFilterActive(code){return colFilters[code]!==undefined;}
function passesColFilters(product){
  computeCalcFields(product);
  for(const code in colFilters){
    const allowed=colFilters[code];
    const val=(product.fields[code]||product[code]||'').toString().trim();
    if(!allowed.has(val))return false;
  }
  return true;
}

// ============================================================
// TABLEAU PRODUITS
// ============================================================
function renderProductsTable(){
  const searchVal=(document.getElementById('products-search')||{}).value||'';
  const catFilter=(document.getElementById('filter-cat')||{}).value||'';
  let filtered=products.filter(p=>{
    if(!(!catFilter||p.cat===catFilter))return false;
    computeCalcFields(p);
    const allText=Object.values(p.fields).join(' ').toLowerCase()+' '+(p.cat||'').toLowerCase();
    if(searchVal&&!allText.includes(searchVal.toLowerCase()))return false;
    if(!passesColFilters(p))return false;
    if(_filterIncomplets&&calcCompletion(p)>=seuilCompletion)return false;
    return true;
  });
  if(compareMode&&selectedProductIds.length>0)filtered=filtered.filter(p=>selectedProductIds.includes(p.id));
  const thead=document.getElementById('products-thead');
  const tbody=document.getElementById('products-tbody');
  if(!thead||!tbody)return;
  renderGroupFilterBar();
  if(currentView==='synth'){renderSynthHeader(thead);renderSynthRows(tbody,filtered);}
  else{initGroupFilters();renderDetailHeader(thead);renderDetailRows(tbody,filtered);}
  renderCompareBar();
  const pi=document.getElementById('pagination-info');
  if(pi)pi.textContent=`${filtered.length} produit${filtered.length>1?'s':''}`;
}
function makeSortFilterTh(label,code){
  const th=document.createElement('th');th.className='th-sortable';
  const isFiltered=isColFilterActive(code);
  th.innerHTML=`<div style="display:flex;align-items:center;gap:4px;white-space:nowrap">
    <span class="sort-btn" onclick="sortTableByCode('${code}')" title="Trier" style="cursor:pointer;font-size:13px;color:#8a9bb0">&#8645;</span>
    <span onclick="sortTableByCode('${code}')" style="cursor:pointer;flex:1">${label}</span>
    <span class="th-filter-icon${isFiltered?' filter-active':''}" title="Filtrer" onclick="openColFilter('${code}','${label}',this)">&#9663;</span>
  </div>`;
  return th;
}
function renderSynthHeader(thead){
  thead.innerHTML='';
  const tr=document.createElement('tr');
  const staticCols=[
    {label:'',cb:true},{label:'Visuel',noSort:true},
    {label:'Code SAP',code:'sap'},{label:'Code EAN',code:'ean'},
    {label:'Nom produit',code:'nom'},{label:'Categorie',code:'cat'},
    {label:'Date creation',code:'createdAt'},{label:'Mise en ligne',code:'miseEnLigne'},
    {label:'Completion',code:'completion'},{label:'Derniere MAJ',code:'maj'},
    {label:'Actions',noSort:true}
  ];
  staticCols.forEach(col=>{
    if(col.cb){const th=document.createElement('th');th.style.width='36px';th.innerHTML='<input type="checkbox" onchange="toggleSelectAll(this)">';tr.appendChild(th);return;}
    if(col.noSort||!col.code){const th=document.createElement('th');th.textContent=col.label;tr.appendChild(th);return;}
    tr.appendChild(makeSortFilterTh(col.label,col.code));
  });
  thead.appendChild(tr);
}
function renderSynthRows(tbody,filtered){
  tbody.innerHTML='';
  const clickAttr=attributes.find(a=>a.clickToOpen);
  filtered.forEach(p=>{
    computeCalcFields(p);
    const comp=calcCompletion(p);
    const isSelected=selectedProductIds.includes(p.id);
    const nom=p.fields.nom||'—';
    const sap=p.fields.sap||'—';
    let nomCell,sapCell;
    if(clickAttr&&clickAttr.code==='sap'){
      sapCell=`<td style="white-space:nowrap"><span class="product-link" onclick="openProductDetail(${p.id})">${sap}</span></td>`;
      nomCell=`<td class="td-name">${nom}</td>`;
    }else{
      sapCell=`<td style="white-space:nowrap">${sap}</td>`;
      nomCell=`<td class="td-name"><span class="product-link" onclick="openProductDetail(${p.id})">${nom}</span></td>`;
    }
    const tr=document.createElement('tr');if(isSelected)tr.className='row-selected';
    tr.innerHTML=`
      <td style="width:36px;text-align:center"><input type="checkbox" ${isSelected?'checked':''} onchange="toggleSelectProduct(${p.id},this)"></td>
      <td style="padding:6px 10px">${visualThumb(p,40)}</td>
      ${sapCell}
      <td style="white-space:nowrap">${p.fields.ean||'—'}</td>
      ${nomCell}
      <td><span class="badge" style="${getCatBadgeStyle(p.cat)}">${p.cat}</span></td>
      <td style="white-space:nowrap">${p.createdAt||'—'}</td>
      <td style="white-space:nowrap">${p.fields.miseEnLigne||'—'}</td>
      <td><div class="inline-bar"><div class="inline-bar-bg"><div class="inline-bar-fill" style="width:${comp}%;background:${getCompletionColor(comp)}"></div></div><span style="font-size:12px;color:#607080">${comp}%</span></div></td>
      <td style="white-space:nowrap">${p.maj||'—'}</td>
      <td><div class="td-actions"><button class="action-btn-danger" onclick="confirmDelete('product',${p.id},'${nom.replace(/'/g,"\\'")}')">Suppr.</button></div></td>`;
    tbody.appendChild(tr);
  });
}

function getCatBadgeStyle(catName){
  const cat=getCatByName(catName);
  if(!cat)return'background:#f0f4f8;color:#607080;border:1px solid #e0e8f0;';
  const hex=cat.color||'#4fc3f7';
  return`background:${hex}22;color:${hex};border:1px solid ${hex}55;`;
}

// ============================================================
// VUE DETAILLEE — groupes filtres par categorie selectionnee
// ============================================================
function getGroupsForCurrentCat(){
  const catFilter=(document.getElementById('filter-cat')||{}).value||'';
  if(!catFilter)return getVisibleGroupsForUser();
  const cat=getCatByName(catFilter);
  if(!cat)return getVisibleGroupsForUser();
  return cat.groupIds.map(id=>getGroupById(id)).filter(Boolean);
}

function renderDetailHeader(thead){
  thead.innerHTML='';initGroupFilters();
  const catGroups=getGroupsForCurrentCat();
  const visibleGroups=catGroups.filter(g=>activeGroupFilters.has(g.id)&&g.code!=='visuels');
  const row1=document.createElement('tr'),row2=document.createElement('tr');
  [{label:'',cb:true,noSort:true},{label:'Visuel',noSort:true},{label:'Code SAP',code:'sap'},{label:'Nom produit',code:'nom'},{label:'Categorie',noSort:true},{label:'Completion',code:'completion'},{label:'Actions',noSort:true}].forEach(col=>{
    const th=document.createElement('th');th.rowSpan=2;
    if(col.cb){th.style.width='36px';th.innerHTML='<input type="checkbox" onchange="toggleSelectAll(this)">';}
    else if(col.noSort||!col.code){th.textContent=col.label;}
    else{th.appendChild(makeSortFilterTh(col.label,col.code));}
    row1.appendChild(th);
  });
  visibleGroups.forEach(g=>{
    const groupAttrs=g.attrIds.map(id=>getAttrById(id)).filter(Boolean);if(!groupAttrs.length)return;
    const color=getGroupColor(g);
    const th=document.createElement('th');th.colSpan=groupAttrs.length;th.className='double-header-group';
    th.style.background=color.bg;th.style.color=color.text;th.textContent=g.name;row1.appendChild(th);
    groupAttrs.forEach(attr=>{
      const th2=document.createElement('th');th2.style.background=color.bg+'99';th2.style.minWidth='110px';
      const isFiltered=isColFilterActive(attr.code);
      th2.innerHTML=`<div style="display:flex;align-items:center;gap:4px;white-space:nowrap">
        <span class="sort-btn" onclick="sortTableByCode('${attr.code}')" title="Trier" style="cursor:pointer;font-size:13px;color:#8a9bb0">&#8645;</span>
        <span onclick="sortTableByCode('${attr.code}')" style="cursor:pointer;flex:1">${attr.name}${attr.calc?`<span style="font-size:10px;color:#ffa726" title="${attr.formulaLabel||''}">&#9654;</span>`:''}</span>
        <span class="th-filter-icon${isFiltered?' filter-active':''}" title="Filtrer" onclick="openColFilter('${attr.code}','${attr.name}',this)">&#9663;</span>
      </div>`;
      row2.appendChild(th2);
    });
  });
  thead.appendChild(row1);thead.appendChild(row2);
}

function renderDetailRows(tbody,filtered){
  tbody.innerHTML='';initGroupFilters();
  const catGroups=getGroupsForCurrentCat();
  const visibleGroups=catGroups.filter(g=>activeGroupFilters.has(g.id)&&g.code!=='visuels');
  const allValues={};
  if(compareMode&&filtered.length>1){
    visibleGroups.forEach(g=>g.attrIds.forEach(aid=>{
      const attr=getAttrById(aid);if(!attr)return;
      allValues[attr.code]=filtered.map(p=>p.fields[attr.code]||'');
    }));
  }
  filtered.forEach(p=>{
    computeCalcFields(p);const comp=calcCompletion(p);
    const isSelected=selectedProductIds.includes(p.id);const nom=p.fields.nom||'—';
    const tr=document.createElement('tr');if(isSelected)tr.className='row-selected';
    let cells=`
      <td style="width:36px;text-align:center"><input type="checkbox" ${isSelected?'checked':''} onchange="toggleSelectProduct(${p.id},this)"></td>
      <td style="padding:6px 10px">${visualThumb(p,36)}</td>
      <td style="white-space:nowrap;font-size:12px">${p.fields.sap||'—'}</td>
      <td class="td-name"><span class="product-link" onclick="openProductDetail(${p.id})">${nom}</span></td>
      <td><span class="badge" style="${getCatBadgeStyle(p.cat)}">${p.cat}</span></td>
      <td><div class="inline-bar"><div class="inline-bar-bg"><div class="inline-bar-fill" style="width:${comp}%;background:${getCompletionColor(comp)}"></div></div><span style="font-size:12px;color:#607080">${comp}%</span></div></td>
      <td><div class="td-actions"><button class="action-btn-danger" onclick="confirmDelete('product',${p.id},'${nom.replace(/'/g,"\\'")}')">Suppr.</button></div></td>`;
    visibleGroups.forEach(g=>{
      const color=getGroupColor(g);
      g.attrIds.map(id=>getAttrById(id)).filter(Boolean).forEach(attr=>{
        const val=p.fields[attr.code]!==undefined&&p.fields[attr.code]!==''?p.fields[attr.code]:'—';
        let isDiff=false;
        if(compareMode&&allValues[attr.code])isDiff=new Set(allValues[attr.code].map(v=>v.toString().trim())).size>1;
        cells+=`<td style="white-space:nowrap;font-size:12px;background:${isDiff?'#fff9c4':color.bg+'55'}">${val}</td>`;
      });
    });
    tr.innerHTML=cells;tbody.appendChild(tr);
  });
}

function toggleSelectAll(cb){
  document.querySelectorAll('#products-tbody input[type=checkbox]').forEach(c=>{
    const m=c.getAttribute('onchange')&&c.getAttribute('onchange').match(/toggleSelectProduct\((\d+)/);
    if(m){const id=parseInt(m[1]);if(cb.checked){if(!selectedProductIds.includes(id))selectedProductIds.push(id);}else selectedProductIds=selectedProductIds.filter(x=>x!==id);}
    c.checked=cb.checked;const tr=c.closest('tr');
    if(tr){if(cb.checked)tr.classList.add('row-selected');else tr.classList.remove('row-selected');}
  });renderCompareBar();
}
function toggleSelectProduct(id,cb){
  if(cb.checked){if(!selectedProductIds.includes(id))selectedProductIds.push(id);}else selectedProductIds=selectedProductIds.filter(x=>x!==id);
  const tr=cb.closest('tr');if(tr){if(cb.checked)tr.classList.add('row-selected');else tr.classList.remove('row-selected');}
  renderCompareBar();
}
function renderCompareBar(){
  const container=document.getElementById('compare-bar-container');if(!container)return;
  if(selectedProductIds.length<2){container.innerHTML='';compareMode=false;return;}
  container.innerHTML=`<div class="compare-bar"><span>${selectedProductIds.length} produits selectionnes</span>
    <div style="display:flex;gap:10px">
      ${compareMode
        ?`<button class="btn btn-secondary" style="font-size:12px;padding:6px 14px" onclick="exitCompare()">Quitter la comparaison</button>`
        :`<button class="btn btn-primary" style="font-size:12px;padding:6px 14px" onclick="enterCompare()">Comparer</button>`}
      <button class="btn btn-secondary" style="font-size:12px;padding:6px 14px" onclick="clearSelection()">Effacer</button>
    </div></div>`;
}
function enterCompare(){compareMode=true;if(currentView==='synth')switchView('detail');else renderProductsTable();}
function exitCompare(){compareMode=false;renderProductsTable();}
function clearSelection(){selectedProductIds=[];compareMode=false;document.querySelectorAll('#products-tbody input[type=checkbox]').forEach(c=>c.checked=false);document.querySelectorAll('#products-tbody tr').forEach(tr=>tr.classList.remove('row-selected'));renderCompareBar();}

// ============================================================
// SWITCH VUE — garde categorie + message
// ============================================================
function onCatFilterChange(){
  const v=(document.getElementById('filter-cat')||{}).value||'';
  _filterIncomplets=false;
  if(!v&&currentView==='detail'){
    activeGroupFilters=null;
    switchView('synth');
  }else if(v&&currentView==='detail'){
    activeGroupFilters=new Set(getVisibleGroupsForUser().map(g=>g.id));
    renderGroupFilterBar();
    renderProductsTable();
  }else{
    activeGroupFilters=null;
    filterTable();
  }
}

function switchView(mode){
  if(mode==='detail'){
    const catFilter=(document.getElementById('filter-cat')||{}).value||'';
    if(!catFilter){
      const sel=document.getElementById('filter-cat');
      if(sel){
        sel.classList.add('filter-cat-required');
        sel.focus();
        sel.addEventListener('change',function onceChange(){
          sel.classList.remove('filter-cat-required');
          sel.removeEventListener('change',onceChange);
        });
      }
      showNotif('Veuillez selectionner une categorie pour acceder a la vue detaillee');
      return;
    }
  }
  currentView=mode;
  const bs=document.getElementById('btn-view-synth');
  const bd=document.getElementById('btn-view-detail');
  if(bs)bs.classList.toggle('active',mode==='synth');
  if(bd)bd.classList.toggle('active',mode==='detail');
  if(mode==='detail'){
    const cat=getCatByName((document.getElementById('filter-cat')||{}).value||'');
    activeGroupFilters=new Set(cat?cat.groupIds:getVisibleGroupsForUser().map(g=>g.id));
    renderGroupFilterBar();
  }
  renderProductsTable();
}

function filterTable(){_filterIncomplets=false;renderProductsTable();}

// ============================================================
// TRI — AVEC SUPPORT COMPLETION
// ============================================================
let sortState={};
function sortTableByCode(code){
  const tb=document.getElementById('products-tbody');if(!tb)return;
  const rows=Array.from(tb.querySelectorAll('tr'));
  const dir=(sortState.code===code&&sortState.dir==='asc')?'desc':'asc';
  sortState={code,dir};
  rows.sort((a,b)=>{
    const getCb=row=>row.querySelector('input[type=checkbox]');
    const ma=getCb(a)&&getCb(a).getAttribute('onchange')&&getCb(a).getAttribute('onchange').match(/\d+/);
    const mb=getCb(b)&&getCb(b).getAttribute('onchange')&&getCb(b).getAttribute('onchange').match(/\d+/);
    const pa=ma?products.find(p=>p.id===parseInt(ma[0])):null;
    const pb=mb?products.find(p=>p.id===parseInt(mb[0])):null;
    if(!pa||!pb)return 0;
    let va,vb;
    if(code==='completion'){
      va=calcCompletion(pa);vb=calcCompletion(pb);
      return dir==='asc'?va-vb:vb-va;
    }
    va=pa.fields[code]!==undefined?pa.fields[code]:(pa[code]||'');
    vb=pb.fields[code]!==undefined?pb.fields[code]:(pb[code]||'');
    const na=parseFloat(va),nb=parseFloat(vb);
    if(!isNaN(na)&&!isNaN(nb))return dir==='asc'?na-nb:nb-na;
    return dir==='asc'?va.toString().localeCompare(vb.toString(),'fr'):vb.toString().localeCompare(va.toString(),'fr');
  });
  rows.forEach(r=>tb.appendChild(r));
}
