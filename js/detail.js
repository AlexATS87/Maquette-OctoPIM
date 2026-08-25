// ============================================================
// FICHE PRODUIT
// ============================================================
function openProductDetail(id){
  currentProductId=id;
  const p=products.find(x=>x.id===id);if(!p)return;
  if(!p.history)p.history=[];
  computeCalcFields(p);
  const cat=getCatByName(p.cat);
  renderProductHeader(p,cat);
  renderProductTabs(p,cat);
  updateDetailCompletion(p);
  showPage('product-detail',null);
}
function renderProductHeader(p,cat){
  const headerLeft=document.getElementById('product-header-left');if(!headerLeft)return;
  const nom=p.fields.nom||'—';
  headerLeft.innerHTML=`<div style="display:flex;align-items:flex-start;gap:16px">
    <div id="detail-main-visual" onclick="triggerVisualUpload(${p.id})"
      style="width:90px;height:90px;border-radius:10px;border:2px dashed #c0d0e0;overflow:hidden;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#f8fafc;" title="Cliquer pour ajouter un visuel">
      ${p.visualSrc?`<img src="${p.visualSrc}" style="width:100%;height:100%;object-fit:cover;">`:`<div style="display:flex;flex-direction:column;align-items:center;gap:4px;color:#c0d0e0"><span style="font-size:28px">&#128247;</span><span style="font-size:10px">Ajouter</span></div>`}
    </div>
    <div><div class="product-title">${nom}</div>
    <div class="product-meta">
      <span>SAP : ${p.fields.sap||'—'}</span>
      <span>EAN : ${p.fields.ean||'—'}</span>
      <span><span class="badge ${getBadgeClass(p.cat)}">${p.cat}</span></span>
      <span style="color:#a0b0c0">Cree le ${p.createdAt||'—'}</span>
    </div></div></div>`;
}
function triggerVisualUpload(productId){
  const input=document.createElement('input');input.type='file';input.accept='image/*';
  input.onchange=function(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=function(ev){
      const p=products.find(x=>x.id===productId);if(!p)return;
      const old=p.visualSrc?'(visuel existant)':'(vide)';
      p.visualSrc=ev.target.result;p.visuals=1;
      addHistory(p,'Visuel principal',old,'(visuel uploade)');
      const container=document.getElementById('detail-main-visual');
      if(container){container.innerHTML=`<img src="${p.visualSrc}" style="width:100%;height:100%;object-fit:cover;">`;container.style.borderStyle='solid';container.style.borderColor='#66bb6a';}
      refreshVisuelsTab(p);updateDetailCompletion(p);renderProductsTable();showNotif('Visuel principal ajoute');
    };
    reader.readAsDataURL(file);
  };
  input.click();
}
function refreshVisuelsTab(p){
  const tab=document.getElementById('tab-group-2');if(!tab)return;
  const firstSlot=tab.querySelector('.visual-slot');if(!firstSlot)return;
  const placeholder=firstSlot.querySelector('.visual-placeholder');
  const existingImg=firstSlot.querySelector('.visual-uploaded');
  if(p.visualSrc){
    if(placeholder){
      const img=document.createElement('img');img.src=p.visualSrc;img.className='visual-uploaded';
      img.style.cssText='cursor:pointer;width:100%;border-radius:8px;height:160px;object-fit:cover;';
      img.onclick=()=>triggerVisualUpload(p.id);placeholder.replaceWith(img);
    } else if(existingImg){existingImg.src=p.visualSrc;}
  }
}
function renderProductTabs(p,cat){
  const tabsEl=document.getElementById('product-tabs');
  const contentsEl=document.getElementById('product-tab-contents');
  tabsEl.innerHTML='';contentsEl.innerHTML='';
  const groupIds=cat?cat.groupIds:[1];
  const tabs=groupIds.map(gid=>getGroupById(gid)).filter(Boolean);
  const allTabs=[...tabs,{id:'hist',name:'Historique',_isHist:true}];
  allTabs.forEach((g,i)=>{
    const tabEl=document.createElement('div');
    tabEl.className='tab'+(i===0?' active':'');
    tabEl.textContent=g.name;
    tabEl.onclick=(function(gid){return function(){
      document.querySelectorAll('#product-tabs .tab').forEach(t=>t.classList.remove('active'));
      document.querySelectorAll('#product-tab-contents .tab-content').forEach(t=>t.classList.remove('active'));
      tabEl.classList.add('active');
      const c=document.getElementById('tab-group-'+gid);if(c)c.classList.add('active');
    };})(g.id);
    tabsEl.appendChild(tabEl);
    const content=document.createElement('div');
    content.className='tab-content'+(i===0?' active':'');
    content.id='tab-group-'+g.id;
    if(g._isHist)content.innerHTML=renderTabHistory(p);
    else if(g.id===1)content.innerHTML=renderTabGeneral(p);
    else if(g.id===2)content.innerHTML=renderTabVisuels(p);
    else content.innerHTML=renderTabAttrGroup(p,g);
    contentsEl.appendChild(content);
  });
}
function renderTabHistory(p){
  if(!p.history||!p.history.length)return'<div style="color:#a0b0c0;font-size:13px;padding:20px">Aucune modification enregistree.</div>';
  let rows='';
  [...p.history].reverse().forEach(h=>{
    rows+=`<tr>
      <td style="white-space:nowrap;color:#607080">${h.ts}</td>
      <td><span style="font-weight:600;color:#1a2332">${h.user}</span></td>
      <td><span class="history-field-badge">${h.field}</span></td>
      <td><span class="history-val-old">${h.old||'(vide)'}</span><span class="history-arrow">→</span><span class="history-val-new">${h.new||'(vide)'}</span></td>
    </tr>`;
  });
  return`<div style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,0.07)">
    <table class="history-table"><thead><tr><th>Date</th><th>Utilisateur</th><th>Champ</th><th>Modification</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}
function addHistory(p,fieldName,oldVal,newVal){
  if(!p.history)p.history=[];
  if(oldVal===newVal)return;
  p.history.push({ts:nowStr(),user:'A. Beranger',field:fieldName,old:String(oldVal||''),new:String(newVal||'')});
  const histTab=document.getElementById('tab-group-hist');
  if(histTab&&histTab.classList.contains('active'))histTab.innerHTML=renderTabHistory(p);
}
function renderTabGeneral(p){
  const nom=p.fields.nom||'';
  return`<div class="fields-grid">
  <div class="field-group"><div class="field-group-title">Identification</div>
  <div class="field-row"><div class="field-label">Code SAP <span class="field-required">*</span></div><input class="field-input" value="${p.fields.sap||''}" oninput="onFieldChange(${p.id},this,'sap')"></div>
  <div class="field-row"><div class="field-label">Code EAN <span class="field-required">*</span></div><input class="field-input" value="${p.fields.ean||''}" oninput="onFieldChange(${p.id},this,'ean')"></div>
  <div class="field-row"><div class="field-label">Nom produit <span class="field-required">*</span></div><input class="field-input" value="${nom}" oninput="onFieldChange(${p.id},this,'nom')"></div>
  <div class="field-row"><div class="field-label">Categorie</div><select class="field-input form-select" onchange="onCatChange(${p.id},this)">${categories.map(c=>`<option${c.name===p.cat?' selected':''}>${c.name}</option>`).join('')}</select></div>
  </div>
  <div class="field-group"><div class="field-group-title">Dates</div>
  <div class="field-row"><div class="field-label">Date de creation</div><input class="field-input" style="background:#f0f4f8;color:#a0b0c0" value="${p.createdAt||''}" readonly></div>
  <div class="field-row"><div class="field-label">Date de mise en ligne</div><input class="field-input" style="font-family:monospace" value="${p.fields.miseEnLigne||''}" placeholder="jj/mm/aaaa" maxlength="10" oninput="onDateMaskInput(this);onFieldChange(${p.id},this,'miseEnLigne')"></div>
  <div class="field-row"><div class="field-label">Derniere MAJ</div><input class="field-input" style="background:#f0f4f8;color:#a0b0c0" value="${p.maj||''}" readonly></div>
  </div></div>`;
}
function onDateMaskInput(el){
  let v=el.value.replace(/\D/g,'');
  if(v.length>2)v=v.slice(0,2)+'/'+v.slice(2);
  if(v.length>5)v=v.slice(0,5)+'/'+v.slice(5);
  el.value=v.slice(0,10);
}
function renderTabVisuels(p){
  const labels=['Vue de face','Vue de profil','Vue 3/4','Visuel ambiance','Visuel fournisseur'];
  const required=[true,true,true,false,false];
  let slots='';
  labels.forEach((l,i)=>{
    const isMain=i===0,hasImg=isMain&&p.visualSrc;
    slots+=`<div class="visual-slot"><div class="visual-slot-title">${l}</div>
      <span class="${required[i]?'visual-badge-required':'visual-badge-optional'}">${required[i]?'Obligatoire':'Optionnel'}</span>
      ${hasImg?`<img src="${p.visualSrc}" class="visual-uploaded" onclick="triggerVisualUpload(${p.id})" style="cursor:pointer;width:100%;border-radius:8px;">`
        :`<div class="visual-placeholder" onclick="${isMain?`triggerVisualUpload(${p.id})`:`showNotif('Disponible prochainement')`}">
          <div style="font-size:32px;color:#c0d0e0">&#128247;</div>
          <div style="font-size:12px;color:#a0b0c0">${isMain?'Cliquer pour ajouter':'Disponible prochainement'}</div>
        </div>`}
    </div>`;
  });
  return`<div style="background:#fff3e0;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#e65100;border-left:4px solid #ffa726">Au moins 1 visuel obligatoire. Formats : JPG, PNG — 2000x2000px minimum.</div><div class="visuals-grid">${slots}</div>`;
}
function renderTabAttrGroup(p,g){
  const attrs=g.attrIds.map(id=>getAttrById(id)).filter(Boolean);
  if(!attrs.length)return'<div style="color:#a0b0c0;font-size:13px;padding:20px">Aucun attribut pour ce groupe.</div>';
  computeCalcFields(p);
  let html='<div class="fields-grid"><div class="field-group">';
  attrs.forEach(a=>{
    const val=p.fields[a.code]!==undefined?p.fields[a.code]:'';
    let input='';
    if(a.calc){
      input=`<div style="position:relative"><input class="field-input" style="background:#fffde7;color:#795548;padding-right:32px" value="${val}" readonly data-calc="${a.code}">
        <div style="position:absolute;right:8px;top:50%;transform:translateY(-50%);width:18px;height:18px;border-radius:50%;background:#ffd54f;color:#5d4037;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:help" title="${a.formulaLabel||'Champ calcule'}">&#9654;</div></div>`;
    } else if(a.readonly){
      input=`<input class="field-input" style="background:#f0f4f8;color:#a0b0c0" value="${val}" readonly>`;
    } else if(a.type==='Simple select'){
      const opts=(a.options||[]).map(o=>`<option${o===val?' selected':''}>${o}</option>`).join('');
      input=`<select class="field-input form-select" onchange="onFieldChange(${p.id},this,'${a.code}');refreshCalcFields(${p.id})"><option value="">-- Choisir --</option>${opts}</select>`;
    } else if(a.type==='Multi select'){
      const opts=(a.options||[]).map(o=>`<option${(val||'').includes(o)?' selected':''}>${o}</option>`).join('');
      input=`<select class="field-input form-select" multiple onchange="onMultiSelectChange(${p.id},this,'${a.code}')">${opts}</select>`;
    } else if(a.type==='Oui / Non'){
      input=`<select class="field-input form-select" onchange="onFieldChange(${p.id},this,'${a.code}')"><option value="">-- Choisir --</option><option${val==='Oui'?' selected':''}>Oui</option><option${val==='Non'?' selected':''}>Non</option></select>`;
    } else if(a.type==='Texte long'){
      input=`<textarea class="field-input" rows="3" oninput="onFieldChange(${p.id},this,'${a.code}')">${val}</textarea>`;
    } else if(a.type==='Nombre'||a.type==='Nombre decimal'){
      input=`<input class="field-input" type="number" value="${val}" oninput="onFieldChange(${p.id},this,'${a.code}');refreshCalcFields(${p.id})">`;
    } else if(a.type==='Date'){
      input=`<input class="field-input" style="font-family:monospace" value="${val}" placeholder="jj/mm/aaaa" maxlength="10" oninput="onDateMaskInput(this);onFieldChange(${p.id},this,'${a.code}')">`;
    } else {
      input=`<input class="field-input" value="${val}" oninput="onFieldChange(${p.id},this,'${a.code}');refreshCalcFields(${p.id})">`;
    }
    html+=`<div class="field-row"><div class="field-label">${a.name}${a.required?' <span class="field-required">*</span>':''}</div>${input}</div>`;
  });
  return html+'</div></div>';
}
function refreshCalcFields(productId){
  const p=products.find(x=>x.id===productId);if(!p)return;
  computeCalcFields(p);
  document.querySelectorAll('[data-calc]').forEach(el=>{
    const code=el.getAttribute('data-calc');
    if(p.fields[code]!==undefined)el.value=p.fields[code];
  });
  updateDetailCompletion(p);
}
function onFieldChange(productId,el,fieldKey){
  const p=products.find(x=>x.id===productId);if(!p)return;
  const oldVal=p.fields[fieldKey]||'';
  const newVal=el.value;
  p.fields[fieldKey]=newVal;
  const attr=attributes.find(a=>a.code===fieldKey);
  const fieldName=attr?attr.name:fieldKey;
  addHistory(p,fieldName,oldVal,newVal);
  if(fieldKey==='nom'){const t=document.querySelector('.product-title');if(t)t.textContent=newVal;}
  computeCalcFields(p);updateDetailCompletion(p);
}
function onMultiSelectChange(productId,el,fieldKey){
  const p=products.find(x=>x.id===productId);if(!p)return;
  const oldVal=p.fields[fieldKey]||'';
  const newVal=Array.from(el.selectedOptions).map(o=>o.value).join(', ');
  p.fields[fieldKey]=newVal;
  const attr=attributes.find(a=>a.code===fieldKey);
  addHistory(p,attr?attr.name:fieldKey,oldVal,newVal);
  updateDetailCompletion(p);
}
function onCatChange(productId,el){
  const p=products.find(x=>x.id===productId);if(!p)return;
  const oldCat=p.cat;p.cat=el.value;
  addHistory(p,'Categorie',oldCat,el.value);
  renderProductTabs(p,getCatByName(p.cat));renderProductHeader(p,getCatByName(p.cat));updateDetailCompletion(p);
}
function updateDetailCompletion(p){
  const comp=calcCompletion(p);const color=getCompletionColor(comp);
  const pctEl=document.getElementById('detail-completion-pct');
  const barEl=document.getElementById('detail-completion-bar');
  const subEl=document.getElementById('detail-completion-sub');
  if(pctEl){pctEl.textContent=comp+'%';pctEl.style.color=color;}
  if(barEl){barEl.style.width=comp+'%';barEl.style.background=color;}
  const attrs=getAttrsForCat(p.cat).filter(a=>!a.calc&&!a.readonly&&a.required);
  const total=attrs.length+1;const filled=Math.round(comp*total/100);
  if(subEl)subEl.textContent=`${filled} / ${total} champs renseignes`;
}
function saveProduct(){
  const p=products.find(x=>x.id===currentProductId);if(!p)return;
  p.maj=nowStr();
  if(p.fields.nom)p.name=p.fields.nom;
  if(p.fields.sap)p.sap=p.fields.sap;
  if(p.fields.ean)p.ean=p.fields.ean;
  renderProductsTable();renderDashboard();showNotif('Produit enregistre — '+p.maj);
}
