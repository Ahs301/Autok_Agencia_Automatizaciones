// Historial con filtros (datos desde n8n)
(function(){
  function updateClock(){
    const el=document.getElementById('systemTime'); if(!el) return;
    const now=new Date();
    el.textContent=new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',hour12:false,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(now);
  }
  setInterval(updateClock,1000); updateClock();

  const body=document.getElementById('historialBody');
  const fTipo=document.getElementById('fTipo');
  const fDesde=document.getElementById('fDesde');
  const fHasta=document.getElementById('fHasta');
  const btn=document.getElementById('btnFiltrar');

  async function fetchHistorial(params){
    const q=new URLSearchParams(params);
    const url=`https://TU_N8N_URL/webhook/historial?${q.toString()}`;
    const res=await fetch(url,{headers:{'Accept':'application/json'}});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const rows=await res.json();
    return Array.isArray(rows)? rows: [];
  }

  function render(rows){
    body.innerHTML='';
    if(rows.length===0){
      const tr=document.createElement('tr'); tr.className='placeholder';
      const td=document.createElement('td'); td.colSpan=6; td.textContent='Sin resultados';
      tr.appendChild(td); body.appendChild(tr); return;
    }
    rows.forEach(r=>{
      const tr=document.createElement('tr');
      const td=(t)=>{const c=document.createElement('td'); c.textContent=t; return c;};
      tr.appendChild(td(r.cliente||''));
      tr.appendChild(td(r.servicio||''));
      tr.appendChild(td(r.antes||''));
      tr.appendChild(td(r.despues||''));
      tr.appendChild(td(r.estado||''));
      const tipo=document.createElement('td'); tipo.appendChild(chip(tipoLabel(r.tipo), r.tipo==='cancelada'?'estado-cancelada':(r.tipo==='reprogramada'?'estado-pendiente':'estado-confirmada'))); tr.appendChild(tipo);
      body.appendChild(tr);
    });
  }

  function chip(text, cls){ const s=document.createElement('span'); s.className='chip '+cls; s.textContent=text; return s; }
  function tipoLabel(t){ if(t==='cancelada') return 'Cancelación'; if(t==='reprogramada') return 'Reprogramación'; return 'Cambio de estado'; }

  async function apply(){
    const params={};
    if(fTipo.value) params.tipo=fTipo.value;
    if(fDesde.value) params.desde=fDesde.value;
    if(fHasta.value) params.hasta=fHasta.value;
    try{
      const rows=await fetchHistorial(params);
      render(rows);
    }catch(e){
      console.error(e);
      render([]);
    }
  }

  btn.addEventListener('click', apply);
  apply();
})();
