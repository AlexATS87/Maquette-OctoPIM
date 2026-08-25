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
      catsDiv.innerHTML += `<div class="completion-cat-row"><div class="cat-name"><span class="cat-dot" style="background:${cat.color}"></span>${cat.name}</div><div class="completion-bar-bg"><div class="completion-bar-fill" style="width:${comp}%;background:${getCompletionColor(comp)}"></div></div><div style="font-size:13px;font-weight:600">${comp}%</div></div>`;
    });
  }
  const circ=2*Math.PI*62;let offset=0,circles='',legend='';
  categories.forEach(cat=>{
    const count=products.filter(p=>p.cat===cat.name).length;
    const dash=total>0?(count/total)*circ:0;
    circles += `<circle cx="80" cy="80" r="62" fill="none" stroke="${cat.color}" stroke-width="26" stroke-dasharray="${dash} ${circ-dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 80 80)"/>`;
    offset+=dash;
    legend += `<div style="display:flex;align-items:center;gap:8px;font-size:13px"><span class="cat-dot" style="background:${cat.color}"></span>${cat.name} — ${count}</div>`;
  });
  const donut=document.getElementById('donut-svg');
  if(donut) donut.innerHTML = `<circle cx="80" cy="80" r="62" fill="none" stroke="#f0f4f8" stroke-width="26"/>${circles}<text x="80" y="85" text-anchor="middle" font-size="14" font-weight="700" fill="#1a2332">${total}</text>`;
  const donutLeg=document.getElementById('donut-legend');if(donutLeg)donutLeg.innerHTML=legend;
}

function openMiniChart(){
  openModal('modal-evolution');
}
