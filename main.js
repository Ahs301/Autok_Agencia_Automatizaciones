// Dashboard Peluquería – Lógica principal
// -------------------------------------------------------------
// Estructura JSON esperada del endpoint (n8n webhook):
// {
//   kpis: {
//     citasHoy: number,
//     citasSemana: number,
//     cancelacionesSemana: number,
//     porcentajeCancelacion: number, // 0..100
//     ingresosSemana: number,        // EUR
//     ocupacion: number              // 0..100
//   },
//   citasPorDia: [
//     { fecha: 'YYYY-MM-DD', total: number },
//     ... // Idealmente 14 últimos días
//   ],
//   servicios: [
//     { nombre: string, total: number },
//     ... // Top 5
//   ],
//   proximasCitas: [
//     {
//       fecha: 'YYYY-MM-DD',
//       hora: 'HH:mm',
//       cliente: string,
//       servicio: string,
//       canal: 'WhatsApp' | 'Manual',
//       estado: 'Confirmada' | 'Pendiente' | 'Cancelada',
//       importe: number // EUR
//     },
//     ...
//   ],
//   alertas: [
//     { tipo: 'reprogramada' | 'cancelada' | 'estado', mensaje: string },
//     ...
//   ],
//   campañas: [
//     {
//       nombre: string,
//       inicio: 'YYYY-MM-DD',
//       fin: 'YYYY-MM-DD',
//       plataformas: string[], // ['Facebook','Instagram',...]
//       estado: 'Activa' | 'Finalizada' | 'Programada'
//     },
//     ...
//   ]
// }
// -------------------------------------------------------------

let charts = { citas: null, servicios: null };

async function fetchDashboardData() {
  // Reemplaza TU_N8N_URL por tu dominio de n8n
  const url = 'https://api.buybetter.cfd/webhook/dashboard';
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  return data;
}

function formatEUR(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function setLoading(isLoading) {
  const kpiSection = document.getElementById('kpiSection');
  const citasWrap = document.getElementById('proximasCitasWrap');
  const alertasList = document.getElementById('alertasList');
  const campaniasList = document.getElementById('campaniasList');
  [kpiSection, citasWrap, alertasList, campaniasList].forEach(el => {
    if (!el) return;
    el.setAttribute('aria-busy', String(isLoading));
  });
}

function updateClock() {
  const el = document.getElementById('systemTime');
  if (!el) return;
  const now = new Date();
  const opts = { timeZone: 'Europe/Madrid', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' };
  const dt = new Intl.DateTimeFormat('es-ES', opts).format(now);
  el.textContent = dt;
}

function updateSystemStatusFromData(data) {
  const cont = document.getElementById('systemStatus');
  if (!cont) return;
  const dot = cont.querySelector('.status-dot');
  const text = cont.querySelector('.status-text');

  let level = 'ok';
  let label = 'OK';

  const { porcentajeCancelacion, cancelacionesSemana } = data.kpis || {};
  if (porcentajeCancelacion >= 20 || cancelacionesSemana >= 12) {
    level = 'warn';
    label = 'Atención';
  }
  if ((data.alertas || []).some(a => a.tipo === 'cancelada') && (porcentajeCancelacion >= 25)) {
    level = 'warn';
    label = 'Atención';
  }

  dot.classList.remove('neutral','ok','warn','err');
  dot.classList.add(level);
  text.textContent = label;
}

function setSystemErrorState(message) {
  const cont = document.getElementById('systemStatus');
  const dot = cont?.querySelector('.status-dot');
  const text = cont?.querySelector('.status-text');
  dot?.classList.remove('neutral','ok','warn','err');
  dot?.classList.add('err');
  if (text) text.textContent = 'Error';
  const bar = document.getElementById('errorBar');
  if (bar) {
    bar.textContent = message || 'Error al cargar datos';
    bar.hidden = false;
  }
}

function clearErrorBar() {
  const bar = document.getElementById('errorBar');
  if (bar) bar.hidden = true;
}

function fillKPIs(kpis) {
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText('kpiCitasHoy', String(kpis.citasHoy));
  setText('kpiCitasSemana', String(kpis.citasSemana));
  setText('kpiCancelacionesSemana', String(kpis.cancelacionesSemana));
  setText('kpiPorcentajeCancelacion', `${kpis.porcentajeCancelacion}%`);
  setText('kpiIngresosSemana', formatEUR(kpis.ingresosSemana));
  setText('kpiOcupacion', `${kpis.ocupacion}%`);
}

function drawCharts(data) {
  const ctxCitas = document.getElementById('chartCitasPorDia');
  const ctxServ = document.getElementById('chartServicios');
  if (!ctxCitas || !ctxServ) return;

  const citas = Array.isArray(data.citasPorDia) ? data.citasPorDia : [];
  const servicios = Array.isArray(data.servicios) ? data.servicios : [];
  if (citas.length === 0 && servicios.length === 0) return;

  const labels = citas.map(x => (x.fecha||'').slice(5));
  const values = citas.map(x => x.total||0);

  if (charts.citas) charts.citas.destroy();
  charts.citas = new Chart(ctxCitas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Citas',
        data: values,
        fill: true,
        tension: 0.35,
        borderColor: 'rgba(49,167,255,0.9)',
        backgroundColor: 'rgba(49,167,255,0.18)',
        pointRadius: 3,
        pointBackgroundColor: 'rgba(49,167,255,0.95)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#b6bdc9' } },
        y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#b6bdc9' }, beginAtZero: true }
      },
      plugins: {
        legend: { labels: { color: '#c7ceda' } },
        tooltip: { mode: 'index', intersect: false }
      }
    }
  });

  const sLabels = servicios.map(s => s.nombre);
  const sValues = servicios.map(s => s.total);
  const palette = ['#31a7ff','#7bc6ff','#58e1bf','#ffd27a','#ffa3a1'];

  if (charts.servicios) charts.servicios.destroy();
  charts.servicios = new Chart(ctxServ, {
    type: 'doughnut',
    data: {
      labels: sLabels,
      datasets: [{ data: sValues, backgroundColor: palette, borderColor: '#0f1318' }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#c7ceda' } } }
    }
  });
}

function chip(content, cls) {
  const span = document.createElement('span');
  span.className = `chip ${cls}`;
  span.textContent = content;
  return span;
}

function fillProximasCitas(citas) {
  const tbody = document.getElementById('proximasCitasTbody');
  const wrap = document.getElementById('proximasCitasWrap');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!citas || citas.length === 0) {
    const tr = document.createElement('tr');
    tr.className = 'placeholder';
    const td = document.createElement('td');
    td.colSpan = 7; td.textContent = 'No hay próximas citas';
    tr.appendChild(td); tbody.appendChild(tr);
  } else {
    citas.forEach(c => {
      const tr = document.createElement('tr');
      const tdFecha = document.createElement('td'); tdFecha.textContent = formatDateES(c.fecha);
      const tdHora = document.createElement('td'); tdHora.textContent = c.hora;
      const tdCliente = document.createElement('td'); tdCliente.textContent = c.cliente;
      const tdServ = document.createElement('td'); tdServ.textContent = c.servicio;
      const tdCanal = document.createElement('td');
      tdCanal.appendChild(chip(c.canal, c.canal.toLowerCase() === 'whatsapp' ? 'whatsapp' : 'manual'));
      const tdEstado = document.createElement('td');
      const est = (c.estado || '').toLowerCase();
      tdEstado.appendChild(chip(c.estado, `estado-${est}`));
      const tdImp = document.createElement('td'); tdImp.textContent = formatEUR(c.importe || 0);
      [tdFecha, tdHora, tdCliente, tdServ, tdCanal, tdEstado, tdImp].forEach(td => tr.appendChild(td));
      tbody.appendChild(tr);
    });
  }
  if (wrap) wrap.setAttribute('aria-busy', 'false');
}

function fillAlertas(alertas) {
  const box = document.getElementById('alertasList');
  if (!box) return;
  box.innerHTML = '';
  if (!alertas || alertas.length === 0) {
    const d = document.createElement('div');
    d.className = 'placeholder'; d.textContent = 'Sin alertas';
    box.appendChild(d);
  } else {
    alertas.forEach(a => {
      const item = document.createElement('div');
      const klass = a.tipo === 'cancelada' ? 'alert-cancelada' : (a.tipo === 'reprogramada' ? 'alert-reprogramada' : 'alert-estado');
      item.className = `list-item ${klass}`;
      const title = document.createElement('div'); title.className = 'title'; title.textContent = a.mensaje;
      const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = tipoLabel(a.tipo);
      item.appendChild(title); item.appendChild(meta);
      box.appendChild(item);
    });
  }
  box.setAttribute('aria-busy', 'false');
}

function fillCampanias(camps) {
  const box = document.getElementById('campaniasList');
  if (!box) return;
  box.innerHTML = '';
  if (!camps || camps.length === 0) {
    const d = document.createElement('div');
    d.className = 'placeholder'; d.textContent = 'Sin campañas';
    box.appendChild(d);
  } else {
    camps.forEach(c => {
      const item = document.createElement('div');
      item.className = 'list-item';
      const left = document.createElement('div');
      const title = document.createElement('div'); title.className = 'title'; title.textContent = c.nombre;
      const meta = document.createElement('div'); meta.className = 'meta';
      meta.textContent = `${formatDateES(c.inicio)} – ${formatDateES(c.fin)} · ${c.plataformas.join(', ')} · ${c.estado}`;
      left.appendChild(title); left.appendChild(meta);
      item.appendChild(left);
      box.appendChild(item);
    });
  }
  box.setAttribute('aria-busy', 'false');
}

function tipoLabel(t) {
  if (t === 'cancelada') return 'Cancelación';
  if (t === 'reprogramada') return 'Reprogramación';
  return 'Cambio de estado';
}

function formatDateES(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

async function init() {
  setLoading(true);
  clearErrorBar();
  // Reloj
  updateClock();
  setInterval(updateClock, 1000);

  try {
    const data = await fetchDashboardData();
    fillKPIs(data.kpis);
    drawCharts(data);
    fillProximasCitas(data.proximasCitas);
    fillAlertas(data.alertas);
    fillCampanias(data.campañas);
    updateSystemStatusFromData(data);
  } catch (err) {
    console.error(err);
    setSystemErrorState('Error al cargar datos');
  } finally {
    setLoading(false);
  }
}

window.addEventListener('DOMContentLoaded', init);
