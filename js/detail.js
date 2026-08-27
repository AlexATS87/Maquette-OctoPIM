// ============================================================
// FICHE PRODUIT — FLAG DIRTY
// ============================================================

function openProductDetail(id){
  currentProductId=id;
  const p=products.find(x=>x.id===id);if(!p)return;
  if(!p.history)p.history=[];
  if(!p.pendingChanges)p.pendingChanges=[];
  computeCalcFields(p);
  productDirty=false;
  const cat=getCatByName(p.cat);
  renderProductHeader(p,cat);
  renderProductTabs(p,cat);
  updateDetailCompletion(p);
  showPage('product-detail',null);
}

// ============================================================
// INTERCEPTION NAVIGATION — POP-UP DIRTY
// ============================================================
function safeShowPage(id,navEl){
  if(productDirty&&currentProductId){
    pendingNavTarget={id,navEl};
    openModal('modal-unsaved');
  }else{
    productDirty=false;currentProductId=null;
    showPage(id,navEl);
  }
}
function confirmLeaveUnsaved(){
  const p=products.find(x=>x.id===currentProductId);
  if(p)p.pendingChanges=[];
  productDirty=false;currentProductId=null;
  closeModal('modal-unsaved');
  if(pendingNavTarget){showPage(pendingNavTarget.id,pendingNavTarget.navEl);pendingNavTarget=null;}
}
function cancelLeaveUnsaved(){
  closeModal('modal-unsaved');pendingNavTarget=null;
}

// ============================================================
// HEADER PRODUIT
// ============================================================
function renderProductHeader(p,cat){
  const headerLeft=document.getElementById('product-header-left');if(!headerLeft)return;
  const nom=p.fields.nom||'—';
  const activeGlobal=calcActiveGlobal(p);
  const etatVisuel=calcEtatVisuel(p);
  const brandInfo=getBrandInfoForProduct(p);
  headerLeft.innerHTML=`<div style="display:flex;align-items:flex-start;gap:16px">
    <div onclick="triggerVisualUpload(${p.id},'visuel_face')"
      style="width:90px;height:90px;border-radius:10px;border:2px dashed #c0d0e0;overflow:hidden;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#f8fafc;" title="Cliquer pour modifier le visuel face">
      ${p.fields.visuel_face
        ?`<img src="${p.fields.visuel_face}" style="width:100%;height:100%;object-fit:cover;">`
        :`<div style="display:flex;flex-direction:column;align-items:center;gap:4px;color:#c0d0e0"><span style="font-size:28px">&#128247;</span><span style="font-size:10px">Ajouter</span></div>`}
    </div>
    <div style="flex:1">
      <div class="product-title">${nom}</div>
      <div class="product-meta">
        <span>SAP : ${p.fields.sap||'—'}</span>
        <span>EAN : ${p.fields.ean||'—'}</span>
        <span><span class="badge" style="${getCatBadgeStyle(p.cat)}">${p.cat}</span></span>
        <span><span class="${activeGlobal==='Actif'?'badge-active-on':'badge-active-off'}">${activeGlobal}</span></span>
        <span><span class="${etatVisuel==='Oui'?'badge-etat-ok':'badge-etat-ko'}">Visuels : ${etatVisuel}</span></span>
        ${brandInfo?`<span style="font-size:12px;color:#607080">${brandInfo.sup} / ${brandInfo.marque} — Remise ATS : <strong style="color:#1565c0">${(brandInfo.remiseAts*100).toFixed(0)}%</strong></span>`:''}
        <span style="color:#a0b0c0">Cree le ${p.createdAt||'—'}</span>
      </div>
    </div>
  </div>`;
}

function getBrandInfoForProduct(p){
  if(!p.fields.fournisseur_code||!p.fields.marque)return null;
  const b=brandSettings.find(x=>x.fournisseurCode===p.fields.fournisseur_code&&x.marque===p.fields.marque);
  if(!b)return null;
  const sup=suppliers.find(s=>s.code===b.fournisseurCode);
  return{...b,sup:sup?sup.name:b.fournisseurCode};
}
function calcActiveGlobal(p){
  const f=p.fields;
  return((f.active_o2||'').toLowerCase()==='oui'||(f.active_lissac||'').toLowerCase()==='oui')?'Actif':'Inactif';
}
function calcEtatVisuel(p){
  return(p.fields.visuel_face&&p.fields.visuel_tq&&p.fields.visuel_profil)?'Oui':'Non';
}
function getCatBadgeStyle(catName){
  const cat=getCatByName(catName);
  if(!cat)return'background:#f0f4f8;color:#607080;border:1px solid #e0e8f0;';
  const hex=cat.color||'#4fc3f7';
  return`background:${hex}22;color:${hex};border:1px solid ${hex}55;`;
}

// ============================================================
// UPLOAD VISUEL
// ============================================================
function triggerVisualUpload(productId,attrCode){
  const input=document.createElement('input');input.type='file';input.accept='image/*';
  input.onchange=function(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=function(ev){
      const p=products.find(x=>x.id===productId);if(!p)return;
      const old=p.fields[attrCode]?'(visuel existant)':'(vide)';
      p.fields[attrCode]=ev.target.result;
      if(attrCode==='visuel_face'){p.visualSrc=ev.target.result;}
      const visualCodes=['visuel_face','visuel_tq','visuel_profil','visuel_ambiance','visuel_fournisseur'];
      p.visuals=visualCodes.filter(c=>p.fields[c]).length;
      const attr=attributes.find(a=>a.code===attrCode);
      addPendingChange(p,attr?attr.name:attrCode,old,'(visuel uploade)');
      renderProductHeader(p,getCatByName(p.cat));
      refreshVisuelSlot(p,attrCode);
      updateDetailCompletion(p);
      renderProductsTable();
      productDirty=true;
      showNotif('Visuel mis a jour : '+(attr?attr.name:attrCode));
    };
    reader.readAsDataURL(file);
  };
  input.click();
}
function refreshVisuelSlot(p,attrCode){
  const slot=document.querySelector(`[data-visuel-code="${attrCode}"]`);if(!slot)return;
  const img=slot.querySelector('.image-attr-preview');
  const placeholder=slot.querySelector('.image-attr-placeholder');
  if(p.fields[attrCode]){
    if(img){img.src=p.fields[attrCode];}
    else if(placeholder){
      const newImg=document.createElement('img');
      newImg.src=p.fields[attrCode];newImg.className='image-attr-preview';
      newImg.onclick=()=>triggerVisualUpload(p.id,attrCode);
      placeholder.replaceWith(newImg);
    }
  }
}

// ============================================================
// ONGLETS PRODUIT
// ============================================================
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
    else if(g.code==='infos_generales')content.innerHTML=renderTabGeneral(p);
    else if(g.code==='visuels')content.innerHTML=renderTabVisuels(p);
    else if(g.isBrandGroup)content.innerHTML=renderTabMarque(p,g);
    else content.innerHTML=renderTabAttrGroup(p,g);
    contentsEl.appendChild(content);
  });
}

// ============================================================
// HISTORIQUE — BUFFER PENDING
// ============================================================
function renderTabHistory(p){
  const history=p.history||[];
  if(!history.length)return'<div style="color:#a0b0c0;font-size:13px;padding:20px">Aucune modification enregistree.</div>';
  let rows='';
  [...history].reverse().forEach(h=>{
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

// Accumule dans pendingChanges (pas encore dans history)
function addPendingChange(p,fieldName,oldVal,newVal){
  if(!p.pendingChanges)p.pendingChanges=[];
  if(String(oldVal||'')===String(newVal||''))return;
  // Si le champ existe deja dans pending, on met a jour la valeur new uniquement
  const existing=p.pendingChanges.find(c=>c.field===fieldName);
  if(existing){existing.new=String(newVal||'');}
  else{p.pendingChanges.push({field:fieldName,old:String(oldVal||''),new:String(newVal||'')});}
}

// Transfert pending -> history au save
function flushPendingChanges(p){
  if(!p.pendingChanges||!p.pendingChanges.length)return;
  const ts=nowStr();
  p.pendingChanges.forEach(c=>{
    if(c.old!==c.new)p.history.push({ts,user:'J. Doe',field:c.field,old:c.old,new:c.new});
  });
  p.pendingChanges=[];
}

// ============================================================
// ONGLET INFOS GENERALES
// ============================================================
function renderTabGeneral(p){
  return`<div class="fields-grid">
  <div class="field-group"><div class="field-group-title">Identification</div>
    <div class="field-row"><div class="field-label">Code SAP <span class="field-required">*</span></div>
      <input class="field-input" value="${p.fields.sap||''}" oninput="onFieldChange(${p.id},this,'sap')"></div>
    <div class="field-row"><div class="field-label">Code EAN <span class="field-required">*</span></div>
      <input class="field-input" value="${p.fields.ean||''}" oninput="onFieldChange(${p.id},this,'ean')"></div>
    <div class="field-row"><div class="field-label">Nom produit <span class="field-required">*</span></div>
      <input class="field-input" value="${p.fields.nom||''}" oninput="onFieldChange(${p.id},this,'nom')"></div>
    <div class="field-row"><div class="field-label">Categorie</div>
      <select class="field-input form-select" onchange="onCatChange(${p.id},this)">
        ${categories.map(c=>`<option${c.name===p.cat?' selected':''}>${c.name}</option>`).join('')}
      </select></div>
  </div>
  <div class="field-group"><div class="field-group-title">Dates</div>
    <div class="field-row"><div class="field-label">Date de creation</div>
      <input class="field-input" style="background:#f0f4f8;color:#a0b0c0" value="${p.createdAt||''}" readonly></div>
    <div class="field-row"><div class="field-label">Date de mise en ligne</div>
      <input class="field-input" style="font-family:monospace" value="${p.fields.miseEnLigne||''}" placeholder="jj/mm/aaaa" maxlength="10"
        oninput="onDateMaskInput(this);onFieldChange(${p.id},this,'miseEnLigne')"></div>
    <div class="field-row"><div class="field-label">Derniere MAJ</div>
      <input class="field-input" style="background:#f0f4f8;color:#a0b0c0" value="${p.maj||''}" readonly></div>
  </div></div>`;
}
function onDateMaskInput(el){
  let v=el.value.replace(/\D/g,'');
  if(v.length>2)v=v.slice(0,2)+'/'+v.slice(2);
  if(v.length>5)v=v.slice(0,5)+'/'+v.slice(5);
  el.value=v.slice(0,10);
}

// ============================================================
// ONGLET VISUELS
// ============================================================
function renderTabVisuels(p){
  const visualAttrs=[
    {code:'visuel_face',   name:'Vue de face',            required:true},
    {code:'visuel_tq',     name:'Vue 3/4',                required:true},
    {code:'visuel_profil', name:'Vue de profil',          required:true},
    {code:'visuel_ambiance',   name:'Visuel ambiance',    required:false},
    {code:'visuel_fournisseur',name:'Visuel fournisseur', required:false}
  ];
  // Verifie si un attribut de type Image existe pour ce code, sinon utilise le rendu par defaut
  let slots='';
  visualAttrs.forEach(va=>{
    const attrDef=attributes.find(a=>a.code===va.code);
    // Si l'attribut a ete change en autre chose qu'Image, on respecte son type
    if(attrDef&&attrDef.type!=='Image'){
      slots+=renderAttrFieldHtml(p,attrDef,va.name);
      return;
    }
    const hasImg=!!p.fields[va.code];
    slots+=`<div class="image-attr-slot" data-visuel-code="${va.code}">
      ${hasImg
        ?`<img src="${p.fields[va.code]}" class="image-attr-preview"
            onclick="triggerVisualUpload(${p.id},'${va.code}')" title="Cliquer pour modifier">`
        :`<div class="image-attr-placeholder" onclick="triggerVisualUpload(${p.id},'${va.code}')">
            <span style="font-size:32px">&#128247;</span>
            <span style="font-size:12px">Cliquer pour ajouter</span>
          </div>`}
      <div class="image-attr-label">${va.name}</div>
      <div class="image-attr-badges">
        ${va.required
          ?'<span class="visual-badge-required">Obligatoire</span>'
          :'<span class="visual-badge-optional">Optionnel</span>'}
      </div>
    </div>`;
  });
  return`<div style="background:#fff3e0;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#e65100;border-left:4px solid #ffa726">
    3 visuels obligatoires (Face, 3/4, Profil). Formats : JPG, PNG — 2000x2000px minimum.
  </div>
  <div class="image-attrs-grid">${slots}</div>`;
}

// Rendu d'un champ selon son type (pour les attributs visuels modifies en autre type)
function renderAttrFieldHtml(p,a,labelOverride){
  const val=p.fields[a.code]!==undefined?p.fields[a.code]:'';
  const label=labelOverride||a.name;
  let input='';
  if(a.type==='Simple select'){
    const opts=(a.options||[]).map(o=>`<option${o===val?' selected':''}>${o}</option>`).join('');
    input=`<select class="field-input form-select" onchange="onFieldChange(${p.id},this,'${a.code}')"><option value="">-- Choisir --</option>${opts}</select>`;
  }else if(a.type==='Oui / Non'){
    input=`<select class="field-input form-select" onchange="onFieldChange(${p.id},this,'${a.code}')"><option value="">-- Choisir --</option><option${val==='Oui'?' selected':''}>Oui</option><option${val==='Non'?' selected':''}>Non</option></select>`;
  }else if(a.type==='Texte long'){
    input=`<textarea class="field-input" rows="3" oninput="onFieldChange(${p.id},this,'${a.code}')">${val}</textarea>`;
  }else{
    input=`<input class="field-input" value="${val}" oninput="onFieldChange(${p.id},this,'${a.code}')">`;
  }
  return`<div class="field-row"><div class="field-label">${label}</div>${input}</div>`;
}

// ============================================================
// ONGLET MARQUE / FOURNISSEUR
// ============================================================
function renderTabMarque(p,g){
  computeCalcFields(p);
  // Prefiltrage fournisseurs sur la categorie du produit
  const catName=p.cat;
  const eligibleSupCodes=[...new Set(
    brandSettings.filter(b=>!b.type||b.type===catName).map(b=>b.fournisseurCode)
  )];
  const eligibleSuppliers=suppliers.filter(s=>eligibleSupCodes.includes(s.code));
  const supOptions=eligibleSuppliers.map(s=>
    `<option value="${s.code}"${p.fields.fournisseur_code===s.code?' selected':''}>${s.name} (${s.code})</option>`
  ).join('');
  const currentSup=p.fields.fournisseur_code||'';
  const availableMarques=[...new Set(
    brandSettings.filter(b=>(!currentSup||b.fournisseurCode===currentSup)&&(!b.type||b.type===catName)).map(b=>b.marque)
  )].sort();
  const marqueOptions=availableMarques.map(m=>
    `<option${p.fields.marque===m?' selected':''}>${m}</option>`
  ).join('');
  const brandInfo=getBrandInfoForProduct(p);
  return`<div class="fields-grid">
  <div class="field-group"><div class="field-group-title">Couple Fournisseur / Marque</div>
    <div style="font-size:12px;color:#a0b0c0;margin-bottom:12px">Filtre sur la categorie : <strong style="color:#607080">${catName}</strong></div>
    <div class="field-row">
      <div class="field-label">Fournisseur</div>
      <select class="field-input form-select" id="detail-fournisseur-${p.id}" onchange="onFournisseurChange(${p.id},this)">
        <option value="">-- Choisir --</option>${supOptions}
      </select>
    </div>
    <div class="field-row">
      <div class="field-label">Marque <span class="field-required">*</span></div>
      <select class="field-input form-select" id="detail-marque-${p.id}" onchange="onMarqueChange(${p.id},this)">
        <option value="">-- Choisir --</option>${marqueOptions}
      </select>
    </div>
  </div>
  <div class="field-group" id="brand-info-panel-${p.id}">
    ${renderBrandInfoPanel(brandInfo)}
  </div></div>`;
}

function renderBrandInfoPanel(brandInfo){
  if(!brandInfo){
    return`<div class="field-group-title">Conditions commerciales</div>
      <div style="color:#a0b0c0;font-size:13px;padding:8px">Selectionnez un fournisseur et une marque pour afficher les conditions.</div>`;
  }
  const rows=[
    {label:'Fournisseur',val:brandInfo.sup},
    {label:'RF',val:brandInfo.rf>0?(brandInfo.rf*100).toFixed(2)+'%':'—'},
    {label:'RFA',val:brandInfo.rfa>0?(brandInfo.rfa*100).toFixed(2)+'%':'—'},
    {label:'Remise ATS',val:`<strong style="color:#1565c0;font-size:14px">${(brandInfo.remiseAts*100).toFixed(0)}%</strong>`},
    {label:'Reprise echange',val:brandInfo.repriseEchange?'<span class="badge-active-on">Oui</span>':'<span class="badge-active-off">Non</span>'},
    {label:'Conditions livraison',val:brandInfo.conditionsLivraison||'—'},
    {label:'Commentaire',val:brandInfo.commentaire?`<span style="font-size:12px;color:#607080">${brandInfo.commentaire}</span>`:'—'}
  ];
  let html=`<div class="field-group-title">Conditions — ${brandInfo.marque}</div>`;
  rows.forEach(r=>{
    html+=`<div class="field-row" style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #f0f4f8">
      <div class="field-label" style="margin:0;flex:1">${r.label}</div>
      <div style="font-size:13px;color:#1a2332;text-align:right">${r.val}</div>
    </div>`;
  });
  return html;
}

function onFournisseurChange(productId,el){
  const p=products.find(x=>x.id===productId);if(!p)return;
  const oldVal=p.fields.fournisseur_code||'';
  p.fields.fournisseur_code=el.value;
  addPendingChange(p,'Fournisseur',oldVal,el.value);
  productDirty=true;
  const catName=p.cat;
  const marqueSelect=document.getElementById('detail-marque-'+productId);
  if(marqueSelect){
    const available=[...new Set(
      brandSettings.filter(b=>(!el.value||b.fournisseurCode===el.value)&&(!b.type||b.type===catName)).map(b=>b.marque)
    )].sort();
    marqueSelect.innerHTML='<option value="">-- Choisir --</option>'+
      available.map(m=>`<option${p.fields.marque===m?' selected':''}>${m}</option>`).join('');
  }
  const stillValid=brandSettings.some(b=>b.fournisseurCode===el.value&&b.marque===p.fields.marque);
  if(!stillValid)p.fields.marque='';
  refreshBrandInfoPanel(p);
  renderProductHeader(p,getCatByName(p.cat));
}
function onMarqueChange(productId,el){
  const p=products.find(x=>x.id===productId);if(!p)return;
  const oldVal=p.fields.marque||'';
  p.fields.marque=el.value;
  addPendingChange(p,'Marque',oldVal,el.value);
  productDirty=true;
  refreshBrandInfoPanel(p);
  renderProductHeader(p,getCatByName(p.cat));
}
function refreshBrandInfoPanel(p){
  const panel=document.getElementById('brand-info-panel-'+p.id);if(!panel)return;
  panel.innerHTML=renderBrandInfoPanel(getBrandInfoForProduct(p));
}

// ============================================================
// ONGLET GROUPE D'ATTRIBUTS GENERIQUE
// ============================================================
function renderTabAttrGroup(p,g){
  const attrs=g.attrIds.map(id=>getAttrById(id)).filter(Boolean);
  if(!attrs.length)return'<div style="color:#a0b0c0;font-size:13px;padding:20px">Aucun attribut pour ce groupe.</div>';
  computeCalcFields(p);
  let html='<div class="fields-grid"><div class="field-group">';
  attrs.forEach(a=>{
    const val=p.fields[a.code]!==undefined?p.fields[a.code]:'';
    let input='';
    if(a.type==='Image'){
      const hasImg=!!val;
      input=`<div class="image-attr-slot" data-visuel-code="${a.code}" style="max-width:200px">
        ${hasImg
          ?`<img src="${val}" class="image-attr-preview" onclick="triggerVisualUpload(${p.id},'${a.code}')" title="Cliquer pour modifier">`
          :`<div class="image-attr-placeholder" onclick="triggerVisualUpload(${p.id},'${a.code}')">
              <span style="font-size:28px">&#128247;</span><span style="font-size:11px">Cliquer pour ajouter</span>
            </div>`}
        <div class="image-attr-badges">
          ${a.required?'<span class="visual-badge-required">Obligatoire</span>':'<span class="visual-badge-optional">Optionnel</span>'}
        </div>
      </div>`;
    }else if(a.calc){
      input=`<div style="position:relative">
        <input class="field-input" style="background:#fffde7;color:#795548;padding-right:32px" value="${val}" readonly data-calc="${a.code}">
        <div style="position:absolute;right:8px;top:50%;transform:translateY(-50%);width:18px;height:18px;border-radius:50%;background:#ffd54f;color:#5d4037;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:help" title="${a.formulaLabel||'Champ calcule'}">&#9654;</div>
      </div>`;
    }else if(a.readonly){
      input=`<input class="field-input" style="background:#f0f4f8;color:#a0b0c0" value="${val}" readonly>`;
    }else if(a.type==='Simple select'){
      const opts=(a.options||[]).map(o=>`<option${o===val?' selected':''}>${o}</option>`).join('');
      input=`<select class="field-input form-select" onchange="onFieldChange(${p.id},this,'${a.code}');refreshCalcFields(${p.id})"><option value="">-- Choisir --</option>${opts}</select>`;
    }else if(a.type==='Multi select'){
      const opts=(a.options||[]).map(o=>`<option${(val||'').includes(o)?' selected':''}>${o}</option>`).join('');
      input=`<select class="field-input form-select" multiple onchange="onMultiSelectChange(${p.id},this,'${a.code}')">${opts}</select>`;
    }else if(a.type==='Oui / Non'){
      input=`<select class="field-input form-select" onchange="onFieldChange(${p.id},this,'${a.code}')"><option value="">-- Choisir --</option><option${val==='Oui'?' selected':''}>Oui</option><option${val==='Non'?' selected':''}>Non</option></select>`;
    }else if(a.type==='Texte long'){
      input=`<textarea class="field-input" rows="3" oninput="onFieldChange(${p.id},this,'${a.code}')">${val}</textarea>`;
    }else if(a.type==='Nombre'||a.type==='Nombre decimal'){
      input=`<input class="field-input" type="number" value="${val}" oninput="onFieldChange(${p.id},this,'${a.code}');refreshCalcFields(${p.id})">`;
    }else if(a.type==='Date'){
      input=`<input class="field-input" style="font-family:monospace" value="${val}" placeholder="jj/mm/aaaa" maxlength="10" oninput="onDateMaskInput(this);onFieldChange(${p.id},this,'${a.code}')">`;
    }else{
      input=`<input class="field-input" value="${val}" oninput="onFieldChange(${p.id},this,'${a.code}');refreshCalcFields(${p.id})">`;
    }
    html+=`<div class="field-row"><div class="field-label">${a.name}${a.required?' <span class="field-required">*</span>':''}</div>${input}</div>`;
  });
  return html+'</div></div>';
}

// ============================================================
// CHAMPS CALCULES
// ============================================================
function refreshCalcFields(productId){
  const p=products.find(x=>x.id===productId);if(!p)return;
  computeCalcFields(p);
  document.querySelectorAll('[data-calc]').forEach(el=>{
    const code=el.getAttribute('data-calc');
    if(p.fields[code]!==undefined)el.value=p.fields[code];
  });
  updateDetailCompletion(p);
}

// ============================================================
// EVENEMENTS CHAMPS
// ============================================================
function onFieldChange(productId,el,fieldKey){
  const p=products.find(x=>x.id===productId);if(!p)return;
  const oldVal=p.fields[fieldKey]!==undefined?p.fields[fieldKey]:'';
  const newVal=el.value;
  p.fields[fieldKey]=newVal;
  const attr=attributes.find(a=>a.code===fieldKey);
  addPendingChange(p,attr?attr.name:fieldKey,oldVal,newVal);
  productDirty=true;
  if(fieldKey==='nom'){const t=document.querySelector('.product-title');if(t)t.textContent=newVal;}
  computeCalcFields(p);
  updateDetailCompletion(p);
  renderProductHeader(p,getCatByName(p.cat));
}
function onMultiSelectChange(productId,el,fieldKey){
  const p=products.find(x=>x.id===productId);if(!p)return;
  const oldVal=p.fields[fieldKey]||'';
  const newVal=Array.from(el.selectedOptions).map(o=>o.value).join(', ');
  p.fields[fieldKey]=newVal;
  const attr=attributes.find(a=>a.code===fieldKey);
  addPendingChange(p,attr?attr.name:fieldKey,oldVal,newVal);
  productDirty=true;
  updateDetailCompletion(p);
}
function onCatChange(productId,el){
  const p=products.find(x=>x.id===productId);if(!p)return;
  const oldCat=p.cat;p.cat=el.value;
  addPendingChange(p,'Categorie',oldCat,el.value);
  productDirty=true;
  renderProductTabs(p,getCatByName(p.cat));
  renderProductHeader(p,getCatByName(p.cat));
  updateDetailCompletion(p);
}

// ============================================================
// COMPLETUDE
// ============================================================
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

// ============================================================
// SAUVEGARDE
// ============================================================
function saveProduct(){
  const p=products.find(x=>x.id===currentProductId);if(!p)return;
  p.maj=nowStr();
  flushPendingChanges(p);
  productDirty=false;
  // Rafraichit l'onglet historique si actif
  const histTab=document.getElementById('tab-group-hist');
  if(histTab)histTab.innerHTML=renderTabHistory(p);
  renderProductsTable();renderDashboard();
  showNotif('Produit enregistre — '+p.maj);
}
