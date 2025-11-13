// Calendario mensual simple + lista del día (datos desde n8n)
(function(){
  function updateClock(){
    const el=document.getElementById('systemTime'); if(!el) return;
    const now=new Date();
    el.textContent=new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',hour12:false,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(now);
  }
  setInterval(updateClock,1000); updateClock();

  const monthTitle=document.getElementById('monthTitle');
  const grid=document.getElementById('calendarGrid');
  const dayList=document.getElementById('dayAppointments');
  const selectedLabel=document.getElementById('selectedDateLabel');
  const prevBtn=document.getElementById('prevMonth');
  const nextBtn=document.getElementById('nextMonth');

  let current=new Date(); current.setDate(1);

  async function fetchDayAppointments(iso){
    const url = `https://TU_N8N_URL/webhook/citas-dia?fecha=${encodeURIComponent(iso)}`;
    const res = await fetch(url, { headers:{'Accept':'application/json'} });
    if(!res.ok) throw new Error('HTTP '+res.status);
    const rows = await res.json();
    return Array.isArray(rows) ? rows : [];
  }

  function formatDateES(iso){
    const d=new Date(iso);return new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d);
  }

  async function renderDayList(iso){
    selectedLabel.textContent=formatDateES(iso);
    dayList.innerHTML='';
    try{
      const rows=await fetchDayAppointments(iso);
      if(rows.length===0){
        const tr=document.createElement('tr'); tr.className='placeholder';
        const td=document.createElement('td'); td.colSpan=6; td.textContent='Sin citas para este día';
        tr.appendChild(td); dayList.appendChild(tr); return;
      }
      rows.forEach(r=>{
        const tr=document.createElement('tr');
        const td=(t)=>{const c=document.createElement('td'); c.textContent=t; return c;};
        tr.appendChild(td(r.hora||''));
        tr.appendChild(td(r.cliente||''));
        tr.appendChild(td(r.servicio||''));
        const canal=document.createElement('td'); canal.appendChild(chip(r.canal||'', (r.canal||'').toLowerCase()==='whatsapp'?'whatsapp':'manual')); tr.appendChild(canal);
        const estado=document.createElement('td'); const est=(r.estado||'').toLowerCase(); estado.appendChild(chip(r.estado||'', 'estado-'+est)); tr.appendChild(estado);
        const importeVal = typeof r.importe==='number'? r.importe: 0;
        tr.appendChild(td(new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(importeVal)));
        dayList.appendChild(tr);
      });
    }catch(e){
      const tr=document.createElement('tr'); tr.className='placeholder';
      const td=document.createElement('td'); td.colSpan=6; td.textContent='Error al cargar citas';
      tr.appendChild(td); dayList.appendChild(tr);
      console.error(e);
    }
  }

  function chip(text, cls){ const s=document.createElement('span'); s.className='chip '+cls; s.textContent=text; return s; }

  function iso(y,m,d){ return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }

  function renderCalendar(){
    grid.innerHTML='';
    const y=current.getFullYear(); const m=current.getMonth();
    monthTitle.textContent=new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(current);

    const firstDay=new Date(y,m,1);
    const startWeekday=(firstDay.getDay()+6)%7; // Lunes=0
    const daysInMonth=new Date(y,m+1,0).getDate();

    const header=['L','M','X','J','V','S','D'];
    const head=document.createElement('div'); head.className='cal-head';
    header.forEach(h=>{ const c=document.createElement('div'); c.textContent=h; head.appendChild(c); });
    grid.appendChild(head);

    const body=document.createElement('div'); body.className='cal-body';

    for(let i=0;i<startWeekday;i++){ const c=document.createElement('div'); c.className='cal-cell muted'; body.appendChild(c); }
    for(let d=1; d<=daysInMonth; d++){
      const cell=document.createElement('button'); cell.type='button'; cell.className='cal-cell';
      const isoStr=iso(y,m,d);
      cell.innerHTML=`<span class="cal-num">${d}</span>`;
      cell.addEventListener('click',()=>renderDayList(isoStr));
      body.appendChild(cell);
    }
    grid.appendChild(body);
  }

  prevBtn.addEventListener('click',()=>{ current.setMonth(current.getMonth()-1); renderCalendar(); });
  nextBtn.addEventListener('click',()=>{ current.setMonth(current.getMonth()+1); renderCalendar(); });

  renderCalendar();
})();
