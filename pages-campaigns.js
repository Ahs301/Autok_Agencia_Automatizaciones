// Campañas: KPIs + charts + listado (datos desde n8n)
(function(){
  function updateClock(){
    const el=document.getElementById('systemTime'); if(!el) return;
    const now=new Date();
    el.textContent=new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',hour12:false,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(now);
  }
  setInterval(updateClock,1000); updateClock();

  async function fetchCampaigns(){
    const url='https://TU_N8N_URL/webhook/campanias';
    const res=await fetch(url,{headers:{'Accept':'application/json'}});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data=await res.json();
    return data||{};
  }

  const setText=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  function money(n){ return new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0); }
  function formatES(iso){ const d=new Date(iso); return isNaN(d)? iso : new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d); }

  (async function init(){
    try{
      const data=await fetchCampaigns();
      const k=data.kpis||{};
      setText('kpiActivas', String(k.activas||0));
      setText('kpiClicks', String(k.clicks7d||0));
      setText('kpiReservas', String(k.reservas||0));
      setText('kpiCoste', money(k.coste||0));
      setText('kpiCtr', (k.ctr||0)+'%');
      setText('kpiCpr', new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(k.cpr||0));

      const ctxPlat=document.getElementById('chartPlataformas');
      const ctxClicks=document.getElementById('chartClicks');
      const plataformas=Array.isArray(data.plataformas)? data.plataformas: [];
      const clicks=Array.isArray(data.clicksPorDia)? data.clicksPorDia: [];
      if (ctxPlat && plataformas.length){
        new Chart(ctxPlat,{type:'doughnut', data:{labels:plataformas.map(p=>p.nombre), datasets:[{data:plataformas.map(p=>p.valor), backgroundColor:['#31a7ff','#58e1bf','#ffd27a'], borderColor:'#0f1318'}]}, options:{plugins:{legend:{position:'bottom',labels:{color:'#c7ceda'}}}}});
      }
      if (ctxClicks && clicks.length){
        new Chart(ctxClicks,{type:'line', data:{labels:clicks.map(d=>d.label), datasets:[{label:'Clicks', data:clicks.map(d=>d.valor), borderColor:'rgba(49,167,255,0.9)', backgroundColor:'rgba(49,167,255,0.18)', fill:true, tension:.35}]}, options:{scales:{x:{grid:{color:'rgba(255,255,255,0.06)'},ticks:{color:'#b6bdc9'}}, y:{grid:{color:'rgba(255,255,255,0.06)'},ticks:{color:'#b6bdc9'},beginAtZero:true}}, plugins:{legend:{labels:{color:'#c7ceda'}}}}});
      }

      const list=document.getElementById('listaCampanias');
      if (list){
        list.innerHTML='';
        const items=Array.isArray(data.lista)? data.lista: [];
        if(items.length===0){
          const empty=document.createElement('div'); empty.className='placeholder'; empty.textContent='Sin campañas'; list.appendChild(empty);
        } else {
          items.forEach(c=>{
            const item=document.createElement('div'); item.className='list-item';
            const left=document.createElement('div');
            const title=document.createElement('div'); title.className='title'; title.textContent=c.nombre||'';
            const meta=document.createElement('div'); meta.className='meta'; meta.textContent=`${formatES(c.inicio)} – ${formatES(c.fin)} · ${(c.plataformas||[]).join(', ')} · ${c.estado||''}`;
            left.appendChild(title); left.appendChild(meta);
            item.appendChild(left);
            list.appendChild(item);
          });
        }
      }
    }catch(e){
      console.error(e);
      const list=document.getElementById('listaCampanias');
      if(list){ const empty=document.createElement('div'); empty.className='placeholder'; empty.textContent='Error al cargar campañas'; list.appendChild(empty); }
    }
  })();
})();
