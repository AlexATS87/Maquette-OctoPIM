// ============================================================
// FICHE PRODUIT — FLAG DIRTY
// ============================================================


// Champ du bandeau révélé dans son onglet (jusqu'au changement d'onglet ou de produit)
let _synthRevealed = null;
function synthHiddenClass(code) {
  if (!synthHeaderCodes().has(code)) return '';
  return code === _synthRevealed ? ' synth-hidden synth-revealed' : ' synth-hidden';
}
function clearSynthReveal() {
  _synthRevealed = null;
  document.querySelectorAll('.synth-revealed').forEach(el => el.classList.remove('synth-revealed'));
}

function openProductDetail(id){
  _synthRevealed = null;
  currentProductId=id;
  const p=products.find(x=>x.id===id);if(!p)return;
  if(!requirePerm(canCat(p.cat,'r'),'Produit non accessible')){
    currentProductId=null;
    return;
  }
  if(!p.history)p.history=[];
  if(!p.pendingChanges)p.pendingChanges=[];
  computeCalcFields(p);
  snapshotProduct(p);
  productDirty=false;
  updateTopbarTitle('Produit');
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
// La vérification des modifications non enregistrées est dans showPage (leaveGuard)
function safeShowPage(id,navEl){ showPage(id,navEl); }
function confirmLeaveUnsaved(){ leaveContinue('discard'); }
function cancelLeaveUnsaved(){ leaveStay(); }

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

function productAlertLine(p) {
  const hits = typeof productAlertHits === 'function' ? productAlertHits(p) : [];
  if (!hits.length) return '';
  const text = hits.map(a => escapeHtml(alertRuleText(a))).join(' · ');
  return `<div style="font-size:12px;color:#c62828;margin-top:4px">${text}</div>`;
}

function fieldAlertMark(p, a) {
  const hits = typeof productAlertHits === 'function' ? productAlertHits(p) : [];
  if (!hits.some(h => h.attrCode === a.code)) return '';
  const title = hits.filter(h => h.attrCode === a.code).map(alertRuleText).join(' · ');
  return `<span title="${escapeHtml(title)}" style="color:#c62828;margin-left:4px;cursor:help">&#9888;</span>`;
}

// Bandeau de la fiche : résumé en lecture seule des éléments de la vue
// synthèse. Un clic sur un élément ouvre l'onglet où il se modifie.
// Complétion et étape ont leurs barres, juste en dessous.
// Éléments de la vue synthèse affichés dans le bandeau (hors complétion et
// étape, qui ont leurs barres). Chacun n'est modifiable qu'à un endroit :
//  - 'inline' : champ simple, modifié sur place dans le bandeau ;
//  - 'reveal' : visuel ou champ calculé (forçable), masqué dans son onglet et
//    révélé au clic ;
//  - 'none'   : non modifiable (dates système, champs en lecture seule).
function synthAttrOf(code) {
  const codes = synthCodeAliases(code);
  return attributes.find(x => codes.includes(x.code)) || null;
}
function synthEditMode(p, a) {
  if (!a || a.code === 'created_at' || a.code === 'updated_at' || a.code === 'completion') return 'none';
  return 'reveal';
}
function synthHeaderCodes() {
  const set = new Set();
  activeSynthItems().filter(i => i.kind === 'attr' && i.code !== 'completion' && i.code !== 'etape_workflow')
    .forEach(i => synthCodeAliases(i.code).forEach(c => set.add(c)));
  return set;
}

function renderProductHeader(p, cat) {
  const headerLeft = document.getElementById('product-header-left');
  if (!headerLeft) return;
  computeCalcFields(p);
  const titleItem = getSynthTitleItem();
  const titleAttr = titleItem ? synthAttrOf(titleItem.code) : attributes.find(a => a.code === 'nom');
  const title = titleItem ? (getSynthValue(p, titleItem.code) || '—') : (p.fields.nom || '—');
  const missing = a => a && countsInCompletion(a) && isAttrShown(p, a) && !isCompletionFilled(p, a);
  const clickFor = (code, a) => {
    const m = synthEditMode(p, a);
    return m === 'reveal' ? `onclick="goToProductField('${a.code}')"` : '';
  };
  const chips = activeSynthItems()
    .filter(i => i.kind === 'attr' && i !== titleItem && !isVisualCode(i.code)
      && i.code !== 'completion' && i.code !== 'etape_workflow')
    .map(i => {
      const a = synthAttrOf(i.code);
      const mode = synthEditMode(p, a);
      const val = i.code === 'cat'
        ? `<span class="badge" style="${getCatBadgeStyle(p.cat)}">${escapeHtml(p.cat)}</span>`
        : escapeHtml(getSynthValue(p, i.code) || '—');
      return `<span class="synth-chip synth-${mode}${missing(a) ? ' synth-missing' : ''}" data-synth-code="${a ? a.code : i.code}" ${a ? clickFor(i.code, a) : ''}>
        <span class="synth-chip-label">${escapeHtml(i.label)}</span><span class="synth-chip-val">${val}</span></span>`;
    }).join('');
  const visual = getSynthVisualItem();
  const visualAttr = visual ? synthAttrOf(visual.code) : null;
  const comp = calcCompletion(p), color = getCompletionColor(comp);
  headerLeft.innerHTML = `
    <div class="product-head">
      <div class="product-head-visual${missing(visualAttr) ? ' synth-missing' : ''}" ${visualAttr ? clickFor(visual.code, visualAttr) : ''}>${summaryVisual(p)}</div>
      <div class="ph-main">
        <div class="ph-top">
          <div class="product-title synth-${synthEditMode(p, titleAttr)}${missing(titleAttr) ? ' synth-missing' : ''}" title="${escapeHtml(title)}"
            data-synth-code="${titleAttr ? titleAttr.code : 'nom'}" ${titleAttr ? clickFor('nom', titleAttr) : ''}>${escapeHtml(title)}</div>${alertPictoHtml(p)}
          <div class="product-status">
        <div class="ps-item">
          <span class="ps-label">Complétion</span>
          <span class="ps-comp"><span class="ps-bar"><span style="width:${comp}%;background:${color}"></span></span>
            <b style="color:${color}">${comp}%</b></span>
        </div>
        ${workflowCompactHtml(p)}
          </div>
        </div>
        ${productAlertLine(p)}
        <div class="product-meta">${chips}</div>
      </div>
    </div>`;
}

function goToProductField(code) {
  const codes = synthCodeAliases(code);
  const contents = [...document.querySelectorAll('#product-tab-contents .tab-content')];
  let row = null, idx = -1;
  contents.some((c, k) => {
    row = codes.map(x => c.querySelector(`[data-attr-row="${x}"], [data-visuel-code="${x}"]`)).find(Boolean);
    if (row) { idx = k; return true; }
    return false;
  });
  if (!row) return;
  const tabs = document.querySelectorAll('#product-tabs .tab');
  if (tabs[idx]) tabs[idx].click();
  _synthRevealed = row.dataset.attrRow || row.dataset.visuelCode;
  row.classList.add('synth-revealed');
  row.scrollIntoView({ block: 'center', behavior: 'smooth' });
  const input = row.querySelector('input:not([type=hidden]), select, textarea');
  if (input && !input.disabled && !input.readOnly) input.focus({ preventScroll: true });
  row.classList.remove('field-flash'); void row.offsetWidth; row.classList.add('field-flash');
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
      makeThumb(ev.target.result,t=>{p.thumbs=p.thumbs||{};p.thumbs[attrCode]=t;});
      const visualCodes=['visuel_face','visuel_tq','visuel_profil','visuel_ambiance'];
      p.visuals=visualCodes.filter(c=>p.fields[c]).length;
      const attr=attributes.find(a=>a.code===attrCode);
      addPendingChange(p,attr?attr.name:attrCode,old,'(visuel uploade)');
      renderProductHeader(p,getCatByName(p.cat));
      refreshVisuelSlot(p,attrCode);
      updateDetailCompletion(p);
      renderProductsTable();
      productDirty=true;
      showNotif('Visuel mis à jour : '+(attr?attr.name:attrCode));
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
    tabEl.innerHTML=escapeHtml(g.name)+(g._isHist?'':`<span class="tab-comp" id="tab-comp-${g.id}"></span>`);
    tabEl.onclick=(function(gid){return function(){
      clearSynthReveal();
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
    else content.innerHTML=renderTabAttrGroup(p,g);
    contentsEl.appendChild(content);
  });
  updateTabCompletions(p);
  lockProductSheet(p);
}

// Complétion de chaque onglet, dans son libellé : % coloré, ✓ à 100 %,
// rien si l'onglet n'a aucun champ qui compte dans la complétion
function updateTabCompletions(p) {
  const cat = getCatByName(p.cat);
  (cat ? cat.groupIds : []).forEach(gid => {
    const el = document.getElementById('tab-comp-' + gid);
    const g = getGroupById(gid);
    if (!el || !g) return;
    const st = groupCompletionStats(p, g);
    if (!st) { el.textContent = ''; el.className = 'tab-comp'; return; }
    el.className = 'tab-comp' + (st.pct === 100 ? ' full' : '');
    el.style.color = st.pct === 100 ? '' : getCompletionColor(st.pct);
    el.innerHTML = st.pct === 100 ? '&#10003;' : st.pct + '%';
  });
}

// ============================================================
// HISTORIQUE — BUFFER PENDING
// ============================================================
function renderTabHistory(p){
  const history=p.history||[];
  if(!history.length)return'<div style="color:#a0b0c0;font-size:13px;padding:20px">Aucune modification enregistrée.</div>';
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

  const groupAttrs = visuelsGroup
    ? visuelsGroup.attrIds.map(id => getAttrById(id)).filter(Boolean)
    : attributes.filter(a => a.type === 'Image');
  const visualAttrs = groupAttrs.filter(a => a.type === 'Image');
  const otherAttrs = groupAttrs.filter(a => a.type !== 'Image');
  const otherHtml = otherAttrs.length && visuelsGroup
    ? renderTabAttrGroup(p, { id: 'vis-fields', code: 'synth', name: '', attrIds: otherAttrs.map(a => a.id) })
    : '';

  if (!visualAttrs.length)
    return '<div style="color:#a0b0c0;font-size:13px;padding:20px">Aucun attribut visuel configure.</div>';

  const obligatoires = visualAttrs.filter(a => a.required);

  let slots = '';
  visualAttrs.forEach(va => {
    const hasImg = !!p.fields[va.code];
    slots += `<div class="image-attr-slot${synthHiddenClass(va.code)}" data-visuel-code="${va.code}">
      ${hasImg
        ? `<img src="${p.fields[va.code]}" class="image-attr-preview"
             onclick="triggerVisualUpload(${p.id},'${va.code}')"
             title="Cliquer pour modifier">`
        : `<div class="image-attr-placeholder"
             onclick="triggerVisualUpload(${p.id},'${va.code}')">
             <span style="font-size:32px">&#128247;</span>
             <span style="font-size:12px">Cliquer pour ajouter</span>
           </div>`}
      <div class="image-attr-label">${attrLabelHtml(va)}</div>
      ${va.required ? '<div class="image-attr-badges"><span class="visual-badge-required">Obligatoire</span></div>' : ''}
    </div>`;
  });

  return `${otherHtml}
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
    const yn=(a.options&&a.options.length)?a.options:['Oui','Non'];
    const opts=yn.map(o=>`<option${o===val?' selected':''}>${o}</option>`).join('');
    input=`<select class="field-input form-select" onchange="onFieldChange(${p.id},this,'${a.code}')"><option value="">-- Choisir --</option>${opts}</select>`;
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




// ============================================================
// ONGLET GROUPE D'ATTRIBUTS GENERIQUE
// ============================================================
function groupCompletionStats(p, g) {
  const seen = new Set();
  const inHeader = synthHeaderCodes();
  const list = (g.attrIds || []).map(id => getAttrById(id)).filter(a => {
    if (!a || a.code === 'completion' || seen.has(a.id) || inHeader.has(a.code)) return false;
    seen.add(a.id);
    return countsInCompletion(a) && isAttrShown(p, a);
  });
  if (!list.length) return null;
  const filled = list.filter(a => isCompletionFilled(p, a)).length;
  return { pct: Math.round(filled / list.length * 100), filled, total: list.length };
}

function groupCompletionHtml(p, g) {
  const stats = groupCompletionStats(p, g);
  if (!stats) return '';
  const color = getCompletionColor(stats.pct);
  return `<div class="detail-completion-bar group-completion" id="group-comp-${g.id}">
    <div class="group-comp-label">Complétion</div>
    <div class="completion-bar-bg">
      <div class="completion-bar-fill" id="group-comp-bar-${g.id}" style="width:${stats.pct}%;background:${color}"></div>
    </div>
    <div id="group-comp-pct-${g.id}" style="font-size:14px;font-weight:700;min-width:44px;text-align:right;color:${color}">${stats.pct}%</div>
  </div>`;
}

function renderTabAttrGroup(p, g, opts) {
  // Strictement les attributs du groupe dans l'ordre de attrIds, sauf ceux
  // déjà dans le bandeau (éléments de la vue synthèse)
  const attrs = g.attrIds.map(id => getAttrById(id)).filter(a => a && !a.hideOnSheet);

  if (!attrs.length)
    return '<div style="color:#a0b0c0;font-size:13px;padding:20px">Aucun attribut pour ce groupe.</div>';

  computeCalcFields(p);
  const shown = attrs.filter(a => a.code !== 'completion');
  let html = '';
  const rowHtml = {};
  const headerCodes = g.code === 'synth' ? new Set() : synthHeaderCodes();

  shown.forEach(a => {
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
        ${a.required ? '<div class="image-attr-badges"><span class="visual-badge-required">Obligatoire</span></div>' : ''}
      </div>`;
    } else if (a.readonly && a.type === 'Simple select') {
      input = `<input class="field-input"
        style="background:#f0f4f8;color:#607080" value="${escapeHtml(val || '')}" readonly>`;
    } else if (a.type === 'Simple select') {
      const opts = attrSelectOptions(a).map(o =>
        `<option value="${escapeHtml(o.v)}"${o.v === val ? ' selected' : ''}>${escapeHtml(o.l)}</option>`
      ).join('');
      input = `<select class="field-input form-select" data-field-code="${a.code}"
        onchange="onFieldChange(${p.id},this,'${a.code}');refreshCalcFields(${p.id})">
        <option value="">-- Choisir --</option>${opts}
      </select>`;
    } else if (a.calc || (a.formula && !a.readonly)) {
      input = calcFieldInput(p, a, val);
    } else if (a.readonly) {
      input = `<input class="field-input"
        style="background:#f0f4f8;color:#a0b0c0" value="${val}" readonly>`;
    } else if (a.type === 'Multi select') {
      const opts = (a.options || []).map(o =>
        `<option${(val || '').includes(o) ? ' selected' : ''}>${o}</option>`
      ).join('');
      input = `<select class="field-input form-select" multiple data-field-code="${a.code}"
        onchange="onMultiSelectChange(${p.id},this,'${a.code}')">${opts}</select>`;
    } else if (a.type === 'Oui / Non') {
      const yn = (a.options && a.options.length) ? a.options : ['Oui', 'Non'];
      const opts = yn.map(o => `<option${o === val ? ' selected' : ''}>${o}</option>`).join('');
      input = `<select class="field-input form-select" data-field-code="${a.code}"
        onchange="onFieldChange(${p.id},this,'${a.code}')">
        <option value="">-- Choisir --</option>${opts}
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

    const wide = a.type === 'Texte long' || a.type === 'Image';
    const shownRow = isAttrShown(p, a);
    const missing = shownRow && countsInCompletion(a) && !isCompletionFilled(p, a);
    rowHtml[a.id] = `<div class="field-row ${fieldWidthClass(a)}${missing ? ' field-missing' : ''}${headerCodes.has(a.code) ? synthHiddenClass(a.code) : ''}" data-attr-row="${a.code}" style="${shownRow ? '' : 'display:none'}">
      <div class="field-label">
        ${attrLabelHtml(a)}${fieldAlertMark(p, a)}
      </div>
      ${input}
    </div>`;
  });

  // Blocs séparés par les intertitres du groupe ; un bloc dont tous les
  // champs sont masqués disparaît (CSS :has)
  const blocks = [];
  let cur = { title: '', rows: [], own: 0 };
  (g.attrIds || []).forEach(id => {
    if (isAttrSection(id)) { blocks.push(cur); cur = { title: attrSectionTitle(id), rows: [], own: 0 }; return; }
    if (rowHtml[id]) {
      cur.rows.push(rowHtml[id]);
      const at = getAttrById(id);
      if (at && !headerCodes.has(at.code)) cur.own++;
    }
  });
  blocks.push(cur);
  html += blocks.filter(b => b.rows.length).map(b => `<div class="field-block${b.own ? '' : ' block-synth-only'}">
      ${b.title ? `<div class="field-section">${escapeHtml(b.title)}</div>` : ''}
      <div class="fields-flow">${b.rows.join('')}</div>
    </div>`).join('');

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
  if (/^TODAY\s*\(\s*\)$/i.test(expr)) return todayStr();

  const roundup = expr.match(/^ROUNDUP\s*\(\s*([\s\S]+)\s*,\s*(-?\d+)\s*\)$/i);
  if (roundup) {
    const raw = evaluateFormula(roundup[1], fields);
    const n = parseFloat(raw);
    if (!isFinite(n)) return '';
    const digits = parseInt(roundup[2], 10);
    const factor = Math.pow(10, Math.max(0, digits));
    const shifted = n * factor;
    const rounded = n >= 0 ? Math.ceil(shifted - 1e-9) : Math.floor(shifted + 1e-9);
    return String(parseFloat((rounded / factor).toFixed(Math.max(0, digits))));
  }

  // =TABLE() : le resultat vient du module Champs calcules (computeCalcFields)
  if (/^TABLE\s*\(\s*\)$/i.test(expr)) return '';

  // REFERENTIEL("référentiel", "colonne") : valeur de la colonne dans la ligne
  // du référentiel qui correspond au produit (colonnes clés)
  const refOnly = /^R[EÉ]F[EÉ]RENTIEL\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)$/i.exec(expr);
  if (refOnly) return String(refValueForProduct(refOnly[1], refOnly[2], fields));
  if (/R[EÉ]F[EÉ]RENTIEL\s*\(/i.test(expr)) {
    const solved = expr.replace(/R[EÉ]F[EÉ]RENTIEL\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/gi,
      (m, ref, col) => '"' + String(refValueForProduct(ref, col, fields)).replace(/"/g, "'") + '"');
    if (solved !== expr) return evaluateFormula('=' + solved, fields);
  }

  // RECHERCHE("référentiel", [champ], "colonne") : remplacée par sa valeur
  // avant le reste du calcul, elle s'utilise partout (SI, CONCAT...)
  if (/RECHERCHE\s*\(/i.test(expr)) {
    const solved = expr.replace(/RECHERCHE\s*\(\s*"([^"]+)"\s*,\s*\[?([A-Za-z0-9_]+)\]?\s*,\s*"([^"]+)"\s*\)/gi,
      (m, ref, field, col) => '"' + String(lookupReferential(ref, fields[field], col)).replace(/"/g, "'") + '"');
    if (solved !== expr) return evaluateFormula('=' + solved, fields);
  }

  const mapped = expr.match(/^MAP\s*\(\s*([A-Za-z0-9_]+)\s*,([\s\S]*)\)$/i);
  if (mapped) {
    const raw = fields[mapped[1]];
    const val = raw == null ? '' : String(raw);
    const re = /"([^"]*)"\s*=\s*"([^"]*)"/g;
    let hit;
    while ((hit = re.exec(mapped[2]))) {
      if (hit[1] === val) return hit[2];
    }
    return '';
  }

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
  const calcAttrs = attributes.filter(a => a.calc || a.formula);
  const before = Object.fromEntries(calcAttrs.map(a => [a.code, p.fields[a.code] ?? '']));
  computeCalcFields(p);
  calcAttrs.forEach(a => {
    const now = p.fields[a.code] ?? '';
    if (String(before[a.code]) !== String(now)) { addPendingChange(p, a.name, before[a.code], now); productDirty = true; }
  });
  document.querySelectorAll('[data-calc]').forEach(el=>{
    if(el===document.activeElement)return;
    const code=el.getAttribute('data-calc');
    const attr=attributes.find(a=>a.code===code);
    if(p.fields[code]!==undefined)el.value=formatCalcFieldDisplay(attr,p.fields[code]);
  });
  document.querySelectorAll('select[data-field-code]').forEach(el=>{
    const code=el.getAttribute('data-field-code');
    const attr=attributes.find(a=>a.code===code);
    if(!attr || !attr.formula)return;
    el.value=p.fields[code] || '';
    if (typeof syncComboFromSelect === 'function') syncComboFromSelect(el);
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
  const attr = attributes.find(a => a.code === fieldKey);
  let newVal = el.value;
  if (attr && isPercentAttr(attr)) newVal = percentFromDisplay(el.value);
  p.fields[fieldKey] = newVal;
  addPendingChange(p, attr ? attr.name : fieldKey, oldVal, newVal);
  productDirty = true;
  if (String(newVal).trim() !== '') el.classList.remove('field-error');
  const row = el.closest('[data-attr-row]');
  if (row && attr && countsInCompletion(attr)) {
    row.classList.toggle('field-missing', !isCompletionValueFilled(newVal));
  }
  if (fieldKey === 'nom') {
    const t = document.querySelector('.product-title');
    if (t) t.textContent = newVal;
  }
  refreshCalcFields(productId);
  refreshConditionalRows(p);
  renderProductHeader(p, getCatByName(p.cat));

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
  updateDetailCompletion(p);
}
function onCatChange(productId,el){
  const p=products.find(x=>x.id===productId);if(!p||!requirePerm(canEditProduct(p)))return;
  if(!canCat(el.value,'w')){
    el.value=p.cat;
    showNotif('Catégorie non accessible en modification','warn');
    return;
  }
  const oldCat=p.cat;p.cat=el.value;
  addPendingChange(p,'Catégorie',oldCat,el.value);
  productDirty=true;
  renderProductTabs(p,getCatByName(p.cat));
  renderProductHeader(p,getCatByName(p.cat));
  updateDetailCompletion(p);
}

// ============================================================
// COMPLETUDE
// ============================================================
function updateDetailCompletion(p){
  renderProductHeader(p, getCatByName(p.cat));
  updateTabCompletions(p);
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
  if(!requirePerm(canEditProduct(p),'Enregistrement non autorisé'))return;
  const missing=validateRequiredFields(p);
  if(missing.length){
    showNotif('Champs obligatoires manquants : '+missing.join(', '),'error');
    return;
  }
  p.maj=nowStr();
  flushPendingChanges(p);
  productDirty=false;
  snapshotProduct(p);
  const histTab=document.getElementById('tab-group-hist');
  if(histTab)histTab.innerHTML=renderTabHistory(p);
  renderProductsTable();renderDashboard();
  showNotif('Produit enregistré — '+p.maj);
}
