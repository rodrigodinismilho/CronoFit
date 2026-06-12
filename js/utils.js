const ACTIVITY_TYPES = [
  { id: 'z2', label: 'Z2 / Rolar', color: 'var(--color-z2)' },
  { id: 'series', label: 'Séries / Qualidade', color: 'var(--color-series)' },
  { id: 'forca', label: 'Força', color: 'var(--color-forca)' },
  { id: 'prova', label: 'Prova / Competição', color: 'var(--color-prova)' },
  { id: 'descanso', label: 'Descanso', color: 'var(--color-descanso)' },
  { id: 'saude', label: 'Saúde / Sono', color: 'var(--color-saude)' },
  { id: 'objetivo', label: 'Objetivo', color: 'var(--color-objetivo)' },
];

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatDateStr(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const days = [];

  for (let i = 0; i < startPad; i++) {
    const d = new Date(year, month, -startPad + i + 1);
    days.push({ date: d.toISOString().slice(0, 10), day: d.getDate(), other: true });
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i);
    days.push({ date: d.toISOString().slice(0, 10), day: i, other: false });
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({ date: d.toISOString().slice(0, 10), day: d.getDate(), other: true });
  }

  return days;
}

function parseTimeToMinutes(t) {
  if (!t) return 0;
  const parts = t.split(':');
  if (parts.length === 3) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  return 0;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

function parseDuration(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const h = parseInt(match[1]) || 0;
  const m = parseInt(match[2]) || 0;
  return h * 60 + m;
}

function detectActivityType(keywords) {
  const text = (keywords || '').toLowerCase();
  if (text.includes('rolar') || text.includes('z2') || text.includes('recupera')) return 'z2';
  if (text.includes('série') || text.includes('series') || text.includes('interval') || text.includes('ritmo') || text.includes('tiro')) return 'series';
  if (text.includes('força') || text.includes('forca') || text.includes('muscula') || text.includes('ginásio') || text.includes('ginasio') || text.includes('academia')) return 'forca';
  if (text.includes('prova') || text.includes('competi') || text.includes('challenge') || text.includes('campeonato')) return 'prova';
  if (text.includes('descanso') || text.includes('folga')) return 'descanso';
  return 'z2';
}

function sleepDurationToHours(durationStr) {
  if (!durationStr) return 0;
  const match = durationStr.match(/(\d+)h(\d+)/);
  if (match) return parseInt(match[1]) + parseInt(match[2]) / 60;
  return 0;
}

function showToast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}
