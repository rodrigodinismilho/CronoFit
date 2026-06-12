const VIEWS = ['calendar', 'dashboard', 'checklist', 'import'];
let currentView = 'calendar';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await DB.open();
  } catch (e) {
    document.getElementById('view-calendar').innerHTML =
      '<div style="padding:60px 16px;text-align:center"><p style="color:#e53e3e;font-weight:600">Erro na base de dados</p><p style="color:#666;font-size:14px;margin-top:8px">Tenta abrir no Safari normal sem ser privado</p></div>';
    return;
  }

  initTabs();
  initCalendar();
  initChecklist();
  initCsvImporter();
  registerSW();

  navigate('calendar');
});

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

function initTabs() {
  document.querySelectorAll('.tab-item').forEach(tab => {
    tab.onclick = () => navigate(tab.dataset.view);
  });
}

function navigate(view) {
  if (!VIEWS.includes(view)) return;
  currentView = view;

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));

  document.getElementById(`view-${view}`).classList.add('active');
  document.querySelector(`.tab-item[data-view="${view}"]`).classList.add('active');

  if (view === 'dashboard') renderDashboard();
  if (view === 'calendar') renderCalendar();
}
