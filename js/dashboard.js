// ============================================================
// DASHBOARD.JS
// ============================================================
let _filterIncomplets=false;
function renderDashboard(){
  const total=products.length;
  const kpiTotal=document.getElementById('kpi-total');if(kpiTotal)kpiTotal.textContent=total;
  const chartVal=document.getElementById('chart-last-val');if(chartVal)chartVal.textContent=total;
  const chartBar=document.getElementById('chart-last-bar');if(chartBar)chartBar.style.height=Math.max(20,Math.round(total/12)*10)+'px';
  const incomplets=products.filter(p=>calcCompletion(p)<seuilCompletion).length;
  const kpiInc=document.getElementById('kpi-incomplets');if(kpiInc)kpiInc.textContent=incomplets;
  const kpiCat=document.getElementById('kpi-categories');if(kpiCat)kpiCat.textContent=categories.length;
  const globalComp=total>0?Math.round(products.reduce((s,p)=>s+calcCompletion(p),0)/total):0;
  const kpiGlob=document.getElementById('kpi-completion-global');if(kpiGlob)kpiGlob.textContent=globalComp+'%';
  const barGlob=document.getElementById('bar-global');
  if(barGlob){barGlob.style.width=globalComp+'%';barGlob.style.background=getCompletionColor(globalComp);}
  const catsDiv=document.getElementById('dashboard-completion-cats');
  if(catsDiv){
    catsDiv.innerHTML='';
    categories.forEach(cat=>{
      const catProds=products.filter(p=>p.cat===cat.name);
      const comp=catProds.length>0?Math.round(catProds.reduce((s,p)=>s+calcCompletion(p),0)/catProds.length):0;
      catsDiv.innerHTML+=`<div class="completion-cat-row"><div class="cat-name"><span class="cat-dot" style="background:${cat.color}"></span>${cat.name}</div><div class="completion-bar-bg"><div class="completion-bar-fill" style="width:${comp}%;background:${getCompletionColor(comp)}"></div></div><div style="font-size:13px;font-weight:600">${comp}%</div></div>`;
    });
  }
  const circ=2*Math.PI*62;let offset=0,circles='',legend='';
  categories.forEach(cat=>{
    const count=products.filter(p=>p.cat===cat.name).length;
    const dash=total>0?(count/total)*circ:0;
    circles+=`<circle cx="80" cy="80" r="62" fill="none" stroke="${cat.color}" stroke-width="26" stroke-dasharray="${dash} ${circ-dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 80 80)"/>`;
    offset+=dash;
    legend+=`<div style="display:flex;align-items:center;gap:8px;font-size:13px"><span class="cat-dot" style="background:${cat.color}"></span>${cat.name} — ${count}</div>`;
  });
  const donut=document.getElementById('donut-svg');
  if(donut)donut.innerHTML=`<circle cx="80" cy="80" r="62" fill="none" stroke="#f0f4f8" stroke-width="26"/>${circles}<text x="80" y="85" text-anchor="middle" font-size="14" font-weight="700" fill="#1a2332">${total}</text>`;
  const donutLeg=document.getElementById('donut-legend');if(donutLeg)donutLeg.innerHTML=legend;

  renderSupplierChart();
}
// ============================================================
// Widget incomplets — navigue vers produits filtrés
// ============================================================
function showIncomplets(){
  _filterIncomplets=true;
  // Utilise showPage directement pour eviter la boucle via safeShowPage -> renderAll -> renderDashboard
  const navEl=document.querySelector('.nav-item[onclick*="products"]');
  showPage('products',navEl);
  // Met a jour les boutons de vue manuellement sans passer par switchView
  currentView='synth';
  _updateViewButtons('synth');
  renderProductsTable();
}
// ============================================================
// GRAPHIQUE FOURNISSEUR — histogramme empile par categorie
// ============================================================
function renderSupplierChart(){
  const container=document.getElementById('supplier-chart-container');
  if(!container)return;

  const supplierMap={};
  products.forEach(p=>{
    computeCalcFields(p);
    const marque=p.fields.marque||'';
    const cat=p.cat||'';
    if(!marque||!cat)return;
    const bs=brandSettings.find(b=>b.marque===marque);
    const supCode=bs?bs.fournisseurCode:'Inconnu';
    const sup=suppliers.find(s=>s.code===supCode);
    const supName=sup?sup.name:supCode;
    if(!supplierMap[supName])supplierMap[supName]={};
    if(!supplierMap[supName][cat])supplierMap[supName][cat]=0;
    supplierMap[supName][cat]++;
  });

  const supNames=Object.keys(supplierMap).sort();
  if(!supNames.length){container.innerHTML='<div style="color:#a0b0c0;font-size:13px;padding:20px;text-align:center">Aucune donnee fournisseur disponible.</div>';return;}

  const BAR_W=48,BAR_GAP=20,MARGIN_L=48,MARGIN_B=64,MARGIN_T=16,MARGIN_R=16,CHART_H=200;
  const svgW=MARGIN_L+supNames.length*(BAR_W+BAR_GAP)+MARGIN_R;
  const svgH=CHART_H+MARGIN_T+MARGIN_B;

  const maxVal=Math.max(...supNames.map(s=>Object.values(supplierMap[s]).reduce((a,b)=>a+b,0)));
  const yScale=v=>CHART_H-(v/Math.max(maxVal,1))*CHART_H;

  const yTicks=4;
  let gridLines='',yLabels='';
  for(let i=0;i<=yTicks;i++){
    const val=Math.round((maxVal/yTicks)*i);
    const y=MARGIN_T+yScale(val);
    gridLines+=`<line x1="${MARGIN_L}" y1="${y}" x2="${svgW-MARGIN_R}" y2="${y}" stroke="#f0f4f8" stroke-width="1"/>`;
    yLabels+=`<text x="${MARGIN_L-6}" y="${y+4}" text-anchor="end" font-size="10" fill="#a0b0c0">${val}</text>`;
  }

  let bars='',xLabels='';
  supNames.forEach((sup,i)=>{
    const x=MARGIN_L+i*(BAR_W+BAR_GAP);
    let yOffset=MARGIN_T+CHART_H;
    categories.forEach(cat=>{
      const count=supplierMap[sup][cat.name]||0;
      if(!count)return;
      const barH=(count/Math.max(maxVal,1))*CHART_H;
      yOffset-=barH;
      bars+=`<rect x="${x}" y="${yOffset}" width="${BAR_W}" height="${barH}" fill="${cat.color}" rx="2"
        style="cursor:pointer;transition:opacity 0.15s"
        onmouseover="this.style.opacity='0.75'"
        onmouseout="this.style.opacity='1'"
        onclick="filterBySupplier('${sup.replace(/'/g,"\\'")}')"
        title="${sup} — ${cat.name} : ${count}">
        <title>${sup} — ${cat.name} : ${count}</title>
      </rect>`;
      if(barH>16){
        bars+=`<text x="${x+BAR_W/2}" y="${yOffset+barH/2+4}" text-anchor="middle" font-size="10" fill="#fff" font-weight="600" pointer-events="none">${count}</text>`;
      }
    });
    const total=Object.values(supplierMap[sup]).reduce((a,b)=>a+b,0);
    const totalY=MARGIN_T+yScale(total)-4;
    bars+=`<text x="${x+BAR_W/2}" y="${totalY}" text-anchor="middle" font-size="10" fill="#607080" font-weight="600">${total}</text>`;
    const label=sup.length>10?sup.slice(0,9)+'…':sup;
    xLabels+=`<text x="${x+BAR_W/2}" y="${MARGIN_T+CHART_H+16}" text-anchor="middle" font-size="10" fill="#607080"
      style="cursor:pointer" onclick="filterBySupplier('${sup.replace(/'/g,"\\'")}')"
      transform="rotate(-30,${x+BAR_W/2},${MARGIN_T+CHART_H+16})">${label}</text>`;
  });

  let legendHtml='<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:12px;justify-content:center">';
  categories.forEach(cat=>{
    legendHtml+=`<div style="display:flex;align-items:center;gap:6px;font-size:12px"><span style="width:12px;height:12px;border-radius:3px;background:${cat.color};display:inline-block"></span>${cat.name}</div>`;
  });
  legendHtml+='</div>';

  container.innerHTML=`
    <div style="overflow-x:auto">
      <svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg">
        ${gridLines}${yLabels}${bars}${xLabels}
        <line x1="${MARGIN_L}" y1="${MARGIN_T}" x2="${MARGIN_L}" y2="${MARGIN_T+CHART_H}" stroke="#e8ecf0" stroke-width="1"/>
        <line x1="${MARGIN_L}" y1="${MARGIN_T+CHART_H}" x2="${svgW-MARGIN_R}" y2="${MARGIN_T+CHART_H}" stroke="#e8ecf0" stroke-width="1"/>
      </svg>
    </div>
    ${legendHtml}`;
}

function filterBySupplier(supName){
  const sup=suppliers.find(s=>s.name===supName);
  if(!sup)return;
  const marques=brandSettings.filter(b=>b.fournisseurCode===sup.code).map(b=>b.marque);
  if(!marques.length)return;
  colFilters={};
  const vals=new Set(marques);
  const existing=new Set(products.map(p=>p.fields.marque).filter(Boolean));
  const intersection=new Set([...vals].filter(v=>existing.has(v)));
  if(!intersection.size){showNotif('Aucun produit pour ce fournisseur');return;}
  colFilters['marque']=intersection;
  showPage('products',document.querySelector('.nav-item[onclick*="products"]'));
  renderProductsTable();
  showNotif('Filtre : fournisseur '+supName);
}

function openMiniChart(){
  openModal('modal-evolution');
}
