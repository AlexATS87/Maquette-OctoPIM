// ============================================================
// FICHE PRODUIT — FLAG DIRTY
// ============================================================

// Normalise le type brandSettings vs nom de categorie
function matchBrandType(brandType,catName){
  if(!brandType)return true;
  const norm=s=>s.toLowerCase().replace(/s$/,'').trim();
  return norm(brandType)===norm(catName);
}

function openProductDetail(id){
  currentProductId=id;
  const p=products.find(x=>x.id===id);if(!p)return;
  if(!requirePerm(canCat(p.cat,'r'),'Produit non accessible')){
    currentProductId=null;
    return;
  }
  if(!p.history)p.history=[];
  if(!p.pendingChanges)p.pendingChanges=[];
  computeCalcFields(p);
  productDirty=false;
  const cat=getCatByName(p.cat);
  renderProductHeader(p,cat);
  renderProductTabs(p,cat);
  updateDetailCompletion(p);
  showPage('product-detail',null);
  applyAccessControl();
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
// Une info du bloc resume, pilotee par un element de syntheseItems
function summaryChip(p, item) {
  const code = item.code;
  if (code === 'cat')
    return `<span><span class="badge" style="${getCatBadgeStyle(p.cat)}">${p.cat}</span></span>`;
  if (code === 'completion') {
    const c = calcCompletion(p);
    return `<span>${item.label} : <strong style="color:${getCompletionColor(c)}">${c}%</strong></span>`;
  }
  return `<span>${item.label} : ${getSynthValue(p, code) || '—'}</span>`;
}

// Vignette du bloc resume : attribut Image configure dans la vue synthese
function summaryVisual(p) {
  const visual = getSynthVisualItem();
  if (!visual) return '';
  const src = p.fields[visual.code];
  return `
    <div onclick="triggerVisualUpload(${p.id},'${visual.code}')"
      style="width:90px;height:90px;border-radius:10px;border:2px dashed #c0d0e0;
        overflow:hidden;cursor:pointer;flex-shrink:0;display:flex;align-items:center;
        justify-content:center;background:#f8fafc;"
      title="Cliquer pour modifier : ${visual.label}">
      ${src
        ? `<img src="${src}" style="width:100%;height:100%;object-fit:cover;">`
        : `<div style="display:flex;flex-direction:column;align-items:center;
             gap:4px;color:#c0d0e0">
             <span style="font-size:28px">&#128247;</span>
             <span style="font-size:10px">Ajouter</span>
           </div>`}
    </div>`;
}

function renderProductHeader(p, cat) {
  const headerLeft = document.getElementById('product-header-left');
  if (!headerLeft) return;

  // Memes champs et meme ordre que la vue synthese, hors actions.
  // La premiere information sert de titre, l'attribut Image sert de vignette.
  const titleItem = getSynthTitleItem();
  const title     = titleItem ? (getSynthValue(p, titleItem.code) || '—') : (p.fields.nom || '—');
  const metaHtml  = syntheseItems
    .filter(i => i.kind === 'attr' && i !== titleItem && !isVisualCode(i.code))
    .map(i => summaryChip(p, i))
    .join('');

  headerLeft.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:16px">
      ${summaryVisual(p)}
      <div style="flex:1">
        <div class="product-title">${title}</div>
        <div class="product-meta">${metaHtml}</div>
      </div>
    </div>`;
}

function getBrandInfoForProduct(p) {
  if (!p.fields.marque) return null;
  const fCode  = p.fields.fournisseur_code || '';
  const marque = p.fields.marque;

  // Filtrer les candidats par marque + fournisseur
  const candidates = brandSettings.filter(b =>
    b.marque === marque && (!fCode || b.fournisseurCode === fCode)
  );
  if (!candidates.length) return null;

  // Priorité 1 : ligne avec segmentation dont la valeur correspond au produit
  const withSeg = candidates.filter(b =>
    b.segAttrCode && p.fields[b.segAttrCode] === b.segAttrValue
  );
  if (withSeg.length) {
    const b   = withSeg[0];
    const sup = suppliers.find(s => s.code === b.fournisseurCode);
    return { ...b, sup: sup ? sup.name : b.fournisseurCode };
  }

  // Priorité 2 : ligne sans segmentation correspondant à la catégorie
  const noSeg = candidates.filter(b => !b.segAttrCode);
  const exact = noSeg.find(b => b.type === p.cat) || noSeg[0];
  if (exact) {
    const sup = suppliers.find(s => s.code === exact.fournisseurCode);
    return { ...exact, sup: sup ? sup.name : exact.fournisseurCode };
  }

  // Priorité 3 : premier candidat disponible
  const b   = candidates[0];
  const sup = suppliers.find(s => s.code === b.fournisseurCode);
  return { ...b, sup: sup ? sup.name : b.fournisseurCode };
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
  const p=products.find(x=>x.id===productId);if(!p)return;
  if(!requirePerm(canEditProduct(p)))return;
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
    else if(g.code==='visuels')content.innerHTML=renderTabVisuels(p);
    else if(g.isBrandGroup)content.innerHTML=renderTabMarque(p,g);
    else content.innerHTML=renderTabAttrGroup(p,g);
    contentsEl.appendChild(content);
  });
  lockProductSheet(p);
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

function addPendingChange(p,fieldName,oldVal,newVal){
  if(!p.pendingChanges)p.pendingChanges=[];
  if(String(oldVal||'')===String(newVal||''))return;
  const existing=p.pendingChanges.find(c=>c.field===fieldName);
  if(existing){existing.new=String(newVal||'');}
  else{p.pendingChanges.push({field:fieldName,old:String(oldVal||''),new:String(newVal||'')});}
}

function flushPendingChanges(p){
  if(!p.pendingChanges||!p.pendingChanges.length)return;
  const ts=nowStr();
  p.pendingChanges.forEach(c=>{
    if(c.old!==c.new)p.history.push({ts,user:currentUserName(),field:c.field,old:c.old,new:c.new});
  });
  p.pendingChanges=[];
}

// ============================================================
// INDICATEURS DE LABEL — * si required (+ jauge completion via attrLabelHtml)
// ============================================================
function attrIndicators(code){
  const a=attributes.find(x=>x.code===code);
  if(!a)return'';
  const req=a.required?' <span class="field-required">*</span>':'';
  return req+attrHelpTip(a);
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
function renderTabVisuels(p) {
  // Recupere les attributs de type Image du groupe visuels
  const cat         = getCatByName(p.cat);
  const visuelsGroup = cat
    ? cat.groupIds.map(id => getGroupById(id)).filter(Boolean).find(g => g.code === 'visuels')
    : null;

  const visualAttrs = visuelsGroup
    ? visuelsGroup.attrIds.map(id => getAttrById(id)).filter(Boolean)
    : attributes.filter(a => a.type === 'Image');

  if (!visualAttrs.length)
    return '<div style="color:#a0b0c0;font-size:13px;padding:20px">Aucun attribut visuel configure.</div>';

  const obligatoires = visualAttrs.filter(a => a.required);

  let slots = '';
  visualAttrs.forEach(va => {
    const hasImg = !!p.fields[va.code];
    slots += `<div class="image-attr-slot" data-visuel-code="${va.code}">
      ${hasImg
        ? `<img src="${p.fields[va.code]}" class="image-attr-preview"
             onclick="triggerVisualUpload(${p.id},'${va.code}')"
             title="Cliquer pour modifier">`
        : `<div class="image-attr-placeholder"
             onclick="triggerVisualUpload(${p.id},'${va.code}')">
             <span style="font-size:32px">&#128247;</span>
             <span style="font-size:12px">Cliquer pour ajouter</span>
           </div>`}
      <div class="image-attr-label">${va.name}</div>
      <div class="image-attr-badges">
        ${va.required
          ? '<span class="visual-badge-required">Obligatoire</span>'
          : '<span class="visual-badge-optional">Optionnel</span>'}
      </div>
    </div>`;
  });

  const infoMsg = obligatoires.length
    ? `${obligatoires.length} visuel${obligatoires.length > 1 ? 's' : ''} obligatoire${obligatoires.length > 1 ? 's' : ''} : ${obligatoires.map(a => a.name).join(', ')}. Formats : JPG, PNG — 2000x2000px minimum.`
    : 'Formats acceptes : JPG, PNG — 2000x2000px minimum.';

  return `<div style="background:#fff3e0;border-radius:8px;padding:12px 16px;
    margin-bottom:20px;font-size:13px;color:#e65100;border-left:4px solid #ffa726">
    ${infoMsg}
  </div>
  <div class="image-attrs-grid">${slots}</div>`;
}

function renderAttrFieldHtml(p,a,labelOverride){
  const val=displayFieldVal(p.fields[a.code]);
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
function renderTabMarque(p, g) {
  computeCalcFields(p);
  const catName = p.cat;
  const eligibleSuppliers = suppliersForProduct(p);
  const currentSup    = p.fields.fournisseur_code || '';
  const currentMarque = p.fields.marque || '';
  const availableMarques = marquesForProduct(p);
  const brandInfo = getBrandInfoForProduct(p);
  const segBits = [...new Set(
    brandSettings.filter(b => b.segAttrCode && (!b.type || matchBrandType(b.type, catName)))
      .map(b => b.segAttrCode)
  )].map(code => {
    const a = attributes.find(x => x.code === code);
    const val = p.fields[code];
    return (a ? a.name : code) + (val ? ' = ' + val : ' (non renseigne)');
  });
  const filterHint = ['categorie : ' + catName].concat(segBits).join(', ');

  return `<div class="fields-grid">
    <div class="field-group">
      <div class="field-group-title">Couple Fournisseur / Marque</div>
      <div style="font-size:12px;color:#a0b0c0;margin-bottom:12px">
        Listes filtrees sur <strong style="color:#607080">${filterHint}</strong>.
        Fournisseur puis marque, ou marque puis fournisseur.
      </div>
      <div class="field-row">
        <div class="field-label">${attrLabelHtml(attributes.find(a => a.code === 'fournisseur_code') || { name: 'Fournisseur' })}</div>
        ${autocompleteInput(
          'detail-fournisseur-' + p.id,
          'dl-sup-' + p.id,
          supplierNameByCode(currentSup),
          eligibleSuppliers.map(s => s.name),
          'onFournisseurChange(' + p.id + ',this)',
          'Rechercher un fournisseur'
        )}
      </div>
      <div class="field-row">
        <div class="field-label">${attrLabelHtml(attributes.find(a => a.code === 'marque') || { name: 'Marque' })}</div>
        ${autocompleteInput(
          'detail-marque-' + p.id,
          'dl-marque-' + p.id,
          currentMarque,
          availableMarques,
          'onMarqueChange(' + p.id + ',this)',
          'Rechercher une marque'
        )}
      </div>
    </div>
    <div class="field-group" id="brand-info-panel-${p.id}">
      ${renderBrandInfoPanel(brandInfo)}
    </div>
  </div>`;
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

function onFournisseurChange(productId, el) {
  const p = products.find(x => x.id === productId);
  if (!p || !requirePerm(canEditProduct(p))) return;
  const code = resolveSupplierCode(el.value);
  if (code) {
    const s = suppliers.find(x => x.code === code);
    if (s && el.value !== s.name) el.value = s.name;
  }
  const oldVal = p.fields.fournisseur_code || '';
  p.fields.fournisseur_code = code;
  addPendingChange(p, 'Fournisseur', oldVal, code);
  productDirty = true;

  const available = marquesForProduct(p);
  const marqueInput = document.getElementById('detail-marque-' + productId);
  if (marqueInput && p.fields.marque && !available.includes(p.fields.marque)) {
    addPendingChange(p, 'Marque', p.fields.marque, '');
    p.fields.marque = '';
    marqueInput.value = '';
  }

  refreshBrandCoupleLists(p);
  refreshBrandInfoPanel(p);
  renderProductHeader(p, getCatByName(p.cat));
}

function onMarqueChange(productId,el){
  const p=products.find(x=>x.id===productId);if(!p||!requirePerm(canEditProduct(p)))return;
  const oldVal=p.fields.marque||'';
  p.fields.marque=el.value;
  addPendingChange(p,'Marque',oldVal,el.value);
  productDirty=true;

  const availableSups = suppliersForProduct(p);
  const currentCode = p.fields.fournisseur_code;
  if (currentCode && !availableSups.some(s => s.code === currentCode)) {
    addPendingChange(p, 'Fournisseur', currentCode, '');
    p.fields.fournisseur_code = '';
    const supInput = document.getElementById('detail-fournisseur-' + productId);
    if (supInput) supInput.value = '';
  }

  refreshBrandCoupleLists(p);
  refreshBrandInfoPanel(p);
  renderProductHeader(p,getCatByName(p.cat));
}
function refreshBrandCoupleLists(p) {
  const supDl = document.getElementById('dl-sup-' + p.id);
  const marDl = document.getElementById('dl-marque-' + p.id);
  if (supDl) {
    const names = suppliersForProduct(p).map(s => s.name);
    supDl.innerHTML = names.map(n => `<option value="${escapeHtml(n)}">`).join('');
  }
  if (marDl) {
    const marques = marquesForProduct(p);
    marDl.innerHTML = marques.map(m => `<option value="${escapeHtml(m)}">`).join('');
  }
}
function refreshBrandInfoPanel(p){
  const panel=document.getElementById('brand-info-panel-'+p.id);if(!panel)return;
  panel.innerHTML=renderBrandInfoPanel(getBrandInfoForProduct(p));
}

// ============================================================
// ONGLET GROUPE D'ATTRIBUTS GENERIQUE
// ============================================================
function renderTabAttrGroup(p, g) {
  // Strictement les attributs du groupe dans l'ordre de attrIds
  const attrs = g.attrIds.map(id => getAttrById(id)).filter(Boolean);

  if (!attrs.length)
    return '<div style="color:#a0b0c0;font-size:13px;padding:20px">Aucun attribut pour ce groupe.</div>';

  computeCalcFields(p);
  let html = '<div class="fields-grid"><div class="field-group">';
  if (g.code === 'infos_generales') html += `<div class="field-group-title">${g.name}</div>`;

  attrs.forEach(a => {
    const val = getAttrFieldValue(p, a);
    let input = '';

    if (a.code === 'cat') {
      input = categorieSelectHtml(p);
    } else if (a.code === 'completion') {
      input = `<input class="field-input"
        style="background:#f0f4f8;color:#a0b0c0" value="${calcCompletion(p)}%" readonly>`;
    } else if (a.type === 'Image') {
      const hasImg = !!val;
      input = `<div class="image-attr-slot" data-visuel-code="${a.code}"
        style="max-width:200px">
        ${hasImg
          ? `<img src="${val}" class="image-attr-preview"
               onclick="triggerVisualUpload(${p.id},'${a.code}')"
               title="Cliquer pour modifier">`
          : `<div class="image-attr-placeholder"
               onclick="triggerVisualUpload(${p.id},'${a.code}')">
               <span style="font-size:28px">&#128247;</span>
               <span style="font-size:11px">Cliquer pour ajouter</span>
             </div>`}
        <div class="image-attr-badges">
          ${a.required
            ? '<span class="visual-badge-required">Obligatoire</span>'
            : '<span class="visual-badge-optional">Optionnel</span>'}
        </div>
      </div>`;
    } else if (a.calc || (a.formula && !a.readonly)) {
      input = calcFieldInput(p, a, val);
    } else if (a.readonly) {
      input = `<input class="field-input"
        style="background:#f0f4f8;color:#a0b0c0" value="${val}" readonly>`;
    } else if (a.type === 'Simple select') {
      const opts = (a.options || []).map(o =>
        `<option${o === val ? ' selected' : ''}>${o}</option>`
      ).join('');
      input = `<select class="field-input form-select" data-field-code="${a.code}"
        onchange="onFieldChange(${p.id},this,'${a.code}');refreshCalcFields(${p.id})">
        <option value="">-- Choisir --</option>${opts}
      </select>`;
    } else if (a.type === 'Multi select') {
      const opts = (a.options || []).map(o =>
        `<option${(val || '').includes(o) ? ' selected' : ''}>${o}</option>`
      ).join('');
      input = `<select class="field-input form-select" multiple data-field-code="${a.code}"
        onchange="onMultiSelectChange(${p.id},this,'${a.code}')">${opts}</select>`;
    } else if (a.type === 'Oui / Non') {
      input = `<select class="field-input form-select" data-field-code="${a.code}"
        onchange="onFieldChange(${p.id},this,'${a.code}')">
        <option value="">-- Choisir --</option>
        <option${val === 'Oui' ? ' selected' : ''}>Oui</option>
        <option${val === 'Non' ? ' selected' : ''}>Non</option>
      </select>`;
    } else if (a.type === 'Texte long') {
      input = longTextInput(p, a, val);
    } else if (a.type === 'Nombre' || a.type === 'Nombre decimal') {
      input = numberInput(p, a, val);
    } else if (a.type === 'Date') {
      input = `<input class="field-input" style="font-family:monospace" data-field-code="${a.code}"
        value="${val}" placeholder="jj/mm/aaaa" maxlength="10"
        oninput="onDateMaskInput(this);onFieldChange(${p.id},this,'${a.code}')">`;
    } else {
      const maskId = a.mask ? `id="fi-${a.code}-${p.id}"` : '';
      input = `<input class="field-input" ${maskId} value="${val}" data-field-code="${a.code}"
        oninput="onFieldChange(${p.id},this,'${a.code}');refreshCalcFields(${p.id})">`;
    }

    html += `<div class="field-row">
      <div class="field-label">
        ${attrLabelHtml(a)}
        ${a.formula
          ? `<span style="display:inline-flex;align-items:center;justify-content:center;
               width:14px;height:14px;border-radius:50%;background:#ffd54f;color:#5d4037;
               font-size:9px;font-weight:700;margin-left:4px;cursor:help"
               title="Champ calcule">&#9654;</span>`
          : ''}
      </div>
      ${input}
    </div>`;
  });

  html += '</div></div>';

  setTimeout(() => {
    attrs.forEach(a => {
      if (a.mask && !a.calc && !a.readonly) {
        const el = document.getElementById('fi-' + a.code + '-' + p.id);
        if (el) applyInputMask(el, a.mask);
      }
    });
  }, 0);

  return html;
}
// ============================================================
// CHAMPS CALCULES
// ============================================================
// ============================================================
// MOTEUR DE FORMULES
// CONCAT(code, " texte ", code) pour les champs texte calcules.
// Les autres syntaxes (=SI(...), operations sur [code]) restent
// prises en charge par evalFormula.
// ============================================================
function evaluateFormula(formula, fields) {
  if (!formula || typeof formula !== 'string') return '';
  const expr = formula.trim().replace(/^=/, '').trim();
  if (!expr) return '';

  // DATE_MAJ est evenementielle : la valeur est posee par computeCalcFields
  // au moment ou le champ surveille change, pas recalculee a chaque rendu.
  if (isEventFormula(expr)) return '';

  const concat = expr.match(/^CONCAT\s*\(([\s\S]*)\)$/i);
  if (concat) return evalConcat(concat[1], fields || {});

  return evalFormula('=' + expr, fields || {});
}

// Formule evenementielle : DATE_MAJ(code) horodate le changement du champ cite
function isEventFormula(formula) {
  return /^\s*=?\s*DATE_MAJ\s*\(/i.test(formula || '');
}

function eventFormulaSource(formula) {
  const m = (formula || '').match(/DATE_MAJ\s*\(\s*\[?([^)\s\]]+)\]?\s*\)/i);
  return m ? m[1] : null;
}

// Decoupe les arguments d'un CONCAT en respectant les guillemets,
// puis remplace chaque code de champ par sa valeur
function evalConcat(argsStr, fields) {
  const args = [];
  let current = '', inStr = false;
  for (let i = 0; i < argsStr.length; i++) {
    const c = argsStr[i];
    if (c === '"')                  { inStr = !inStr; current += c; }
    else if (c === ',' && !inStr)   { args.push(current); current = ''; }
    else                            { current += c; }
  }
  args.push(current);

  return args.map(raw => {
    const arg = raw.trim();
    if (!arg) return '';
    if (arg.length > 1 && arg.startsWith('"') && arg.endsWith('"'))
      return arg.slice(1, -1);
    const val = fields[arg.replace(/^\[/, '').replace(/\]$/, '')];
    return (val === undefined || val === null) ? '' : String(val);
  }).join('');
}

function refreshCalcFields(productId){
  const p=products.find(x=>x.id===productId);if(!p)return;
  computeCalcFields(p);
  document.querySelectorAll('[data-calc]').forEach(el=>{
    if(el===document.activeElement)return; // ne pas perturber une saisie forcee en cours
    const code=el.getAttribute('data-calc');
    if(p.fields[code]!==undefined)el.value=p.fields[code];
  });
  updateDetailCompletion(p);
}

// ============================================================
// EVENEMENTS CHAMPS
// ============================================================
function onFieldChange(productId, el, fieldKey) {
  const p = products.find(x => x.id === productId);
  if (!p || !requirePerm(canEditProduct(p))) return;
  const oldVal = p.fields[fieldKey] !== undefined ? p.fields[fieldKey] : '';
  const newVal = el.value;
  p.fields[fieldKey] = newVal;
  const attr = attributes.find(a => a.code === fieldKey);
  addPendingChange(p, attr ? attr.name : fieldKey, oldVal, newVal);
  productDirty = true;
  if (String(newVal).trim() !== '') el.classList.remove('field-error');
  if (fieldKey === 'nom') {
    const t = document.querySelector('.product-title');
    if (t) t.textContent = newVal;
  }
  refreshCalcFields(productId);
  renderProductHeader(p, getCatByName(p.cat));

  // Si le champ modifié est un attribut de segmentation utilisé dans brandSettings,
  // rafraîchir le panneau conditions commerciales
  const isSegAttr = brandSettings.some(b => b.segAttrCode === fieldKey);
  if (isSegAttr) {
    refreshBrandCoupleLists(p);
    refreshBrandInfoPanel(p);
  }
}

function onMultiSelectChange(productId,el,fieldKey){
  const p=products.find(x=>x.id===productId);if(!p||!requirePerm(canEditProduct(p)))return;
  const oldVal=p.fields[fieldKey]||'';
  const newVal=Array.from(el.selectedOptions).map(o=>o.value).join(', ');
  p.fields[fieldKey]=newVal;
  const attr=attributes.find(a=>a.code===fieldKey);
  addPendingChange(p,attr?attr.name:fieldKey,oldVal,newVal);
  productDirty=true;
  refreshCalcFields(productId);
}
function onCatChange(productId,el){
  const p=products.find(x=>x.id===productId);if(!p||!requirePerm(canEditProduct(p)))return;
  if(!canCat(el.value,'w')){
    el.value=p.cat;
    showNotif('Categorie non accessible en modification','warn');
    return;
  }
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
  const attrs=getCompletionAttrs(p);
  const total=attrs.length;
  const filled=attrs.filter(a=>{
    const v=p.fields[a.code];
    return v!==undefined&&v!==null&&String(v).trim()!=='';
  }).length;
  if(subEl)subEl.textContent=`${filled} / ${total} champs renseignes`;
}

// ============================================================
// SAUVEGARDE
// ============================================================
// Lit required depuis attributes : aucun code en dur
function validateRequiredFields(p){
  document.querySelectorAll('#page-product-detail [data-field-code]')
    .forEach(el=>el.classList.remove('field-error'));
  const missing=[];
  attributes.filter(a=>a.required && !isConditionRowAttr(a)).forEach(a=>{
    const v=getAttrFieldValue(p,a);
    if(v!==undefined&&v!==null&&String(v).trim()!=='')return;
    missing.push(a.name);
    const el=document.querySelector(`#page-product-detail [data-field-code="${a.code}"]`);
    if(el)el.classList.add('field-error');
  });
  return missing;
}

function saveProduct(){
  const p=products.find(x=>x.id===currentProductId);if(!p)return;
  if(!requirePerm(canEditProduct(p),'Enregistrement non autorise'))return;
  const missing=validateRequiredFields(p);
  if(missing.length){
    showNotif('Champs obligatoires manquants : '+missing.join(', '),'error');
    return;
  }
  p.maj=nowStr();
  flushPendingChanges(p);
  productDirty=false;
  const histTab=document.getElementById('tab-group-hist');
  if(histTab)histTab.innerHTML=renderTabHistory(p);
  renderProductsTable();renderDashboard();
  showNotif('Produit enregistre — '+p.maj);
}
