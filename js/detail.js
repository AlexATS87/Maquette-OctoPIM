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
  const activeGlobal=calcActiveGlobal(p);
  const etatVisuel=calcEtatVisuel(p);
  headerLeft.innerHTML=`<div style="display:flex;align-items:flex-start;gap:16px">
    <div id="detail-main-visual" onclick="triggerVisualUpload(${p.id},'visuel_face')"
      style="width:90px;height:90px;border-radius:10px;border:2px dashed #c0d0e0;overflow:hidden;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#f8fafc;" title="Cliquer pour modifier le visuel face">
      ${p.fields.visuel_face
        ?`<img src="${p.fields.visuel_face}" style="width:100%;height:100%;object-fit:cover;">`
        :`<div style="display:flex;flex-direction:column;align-items:center;gap:4px;color:#c0d0e0"><span style="font-size:28px">&#128247;</span><span style="font-size:10px">Ajouter</span></div>`}
    </div>
    <div>
      <div class="product-title">${nom}</div>
      <div class="product-meta">
        <span>SAP : ${p.fields.sap||'—'}</span>
        <span>EAN : ${p.fields.ean||'—'}</span>
        <span><span class="badge ${getBadgeClass(p.cat)}">${p.cat}</span></span>
        <span><span class="${activeGlobal==='Activé'?'badge-active-on':'badge-active-off'}">${activeGlobal}</span></span>
        <span><span class="${etatVisuel==='Oui'?'badge-etat-ok':'badge-etat-ko'}">Visuels : ${etatVisuel}</span></span>
        <span style="color:#a0b0c0">Cree le ${p.createdAt||'—'}</span>
      </div>
    </div>
  </div>`;
}

// ============================================================
// UPLOAD VISUEL PAR CODE ATTRIBUT
// ============================================================
function triggerVisualUpload(productId, attrCode){
  const input=document.createElement('input');input.type='file';input.accept='image/*';
  input.onchange=function(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=function(ev){
      const p=products.find(x=>x.id===productId);if(!p)return;
      const old=p.fields[attrCode]?'(visuel existant)':'(vide)';
      p.fields[attrCode]=ev.target.result;
      // Retrocompat : visuel_face = visuel principal
      if(attrCode==='visuel_face'){p.visualSrc=ev.target.result;p.visuals=1;}
      // Recalcule le compteur de visuels
      const visualCodes=['visuel_face','visuel_tq','visuel_profil','visuel_ambiance','visuel_fournisseur'];
      p.visuals=visualCodes.filter(c=>p.fields[c]).length;
      const attr=attributes.find(a=>a.code===attrCode);
      addHistory(p,attr?attr.name:attrCode,old,'(visuel uploade)');
      // Rafraichit le header
      renderProductHeader(p,getCatByName(p.cat));
      // Rafraichit le slot dans l'onglet visuels
      refreshVisuelSlot(p,attrCode);
      updateDetailCompletion(p);
      renderProductsTable();
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
    else if(g.id===1)content.innerHTML=renderTabGeneral(p);
    else if(g.id===2)content.innerHTML=renderTabVisuels(p);
    else content.innerHTML=renderTabAttrGroup(p,g);
    contentsEl.appendChild(content);
  });
}

// ============================================================
// ONGLET HISTORIQUE
// ============================================================
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
  p.history.push({ts:nowStr(),user:'J. Doe',field:fieldName,old:String(oldVal||''),new:String(newVal||'')});
  const histTab=document.getElementById('tab-group-hist');
  if(histTab&&histTab.classList.contains('active'))histTab.innerHTML=renderTabHistory(p);
}

// ============================================================
// ONGLET INFOS GENERALES
// ============================================================
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

// ============================================================
// ONGLET VISUELS — groupe d'attributs type image
// ============================================================
function renderTabVisuels(p){
  // Les 5 attributs image dans l'ordre : face, tq, profil, ambiance, fournisseur
  const visualAttrs=[
    {code:'visuel_face',   name:'Vue de face',          required:true,  synthVisible:true},
    {code:'visuel_tq',     name:'Vue 3/4',              required:true,  synthVisible:false},
    {code:'visuel_profil', name:'Vue de profil',        required:true,  synthVisible:false},
    {code:'visuel_ambiance',  name:'Visuel ambiance',   required:false, synthVisible:false},
    {code:'visuel_fournisseur',name:'Visuel fournisseur',required:false,synthVisible:false}
  ];

  let slots='';
  visualAttrs.forEach(va=>{
    const hasImg=!!p.fields[va.code];
    const badgeHtml=va.required
      ?`<span class="visual-badge-required">Obligatoire</span>`
      :`<span class="visual-badge-optional">Optionnel</span>`;
    const synthBadge=va.synthVisible
      ?`<span style="background:#e3f2fd;color:#1565c0;font-size:10px;padding:2px 6px;border-radius:8px;font-weight:600">Vue synth.</span>`
      :'';
    slots+=`<div class="image-attr-slot" data-visuel-code="${va.code}">
      ${hasImg
        ?`<img src="${p.fields[va.code]}" class="image-attr-preview" onclick="triggerVisualUpload(${p.id},'${va.code}')" title="Cliquer pour modifier">`
        :`<div class="image-attr-placeholder" onclick="triggerVisualUpload(${p.id},'${va.code}')">
            <span style="font-size:32px">&#128247;</span>
            <span style="font-size:12px">Cliquer pour ajouter</span>
          </div>`}
      <div class="image-attr-label">${va.name}</div>
      <div class="image-attr-badges">${badgeHtml}${synthBadge}</div>
    </div>`;
  });

  return`<div style="background:#fff3e0;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#e65100;border-left:4px solid #ffa726">
    3 visuels obligatoires (Face, 3/4, Profil). Formats : JPG, PNG — 2000x2000px minimum.
  </div>
  <div class="image-attrs-grid">${slots}</div>`;
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
              <span style="font-size:28px">&#128247;</span>
              <span style="font-size:11px">Cliquer pour ajouter</span>
            </div>`}
        <div class="image-attr-badges">
          ${a.required?'<span class="visual-badge-required">Obligatoire</span>':'<span class="visual-badge-optional">Optionnel</span>'}
        </div>
      </div>`;
    } else if(a.calc){
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
  renderProductHeader(p,getCatByName(p.cat));
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
