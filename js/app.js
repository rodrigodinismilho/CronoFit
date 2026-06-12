const VIEWS = ['calendar', 'dashboard', 'checklist', 'import'];
let currentView = 'calendar';

window.onerror = function(msg) {
  const el = document.getElementById('view-calendar');
  if (el) el.innerHTML = '<div style="padding:60px 16px;text-align:center;font-family:Segoe UI,sans-serif"><p style="color:#e53e3e;font-weight:600">Algo correu mal</p><p style="color:#666;font-size:14px;margin-top:8px">Recarrega a página ou tenta mais tarde</p><button onclick="location.reload()" style="margin-top:16px;padding:10px 24px;background:#1a1a2e;color:#fff;border:none;border-radius:8px;font-size:14px">Recarregar</button></div>';
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    document.querySelector('.loading-js')?.remove();
    await DB.open();
  } catch (e) {
    document.getElementById('view-calendar').innerHTML =
      '<div style="padding:60px 16px;text-align:center"><p style="color:#e53e3e;font-weight:600">Erro na base de dados</p><p style="color:#666;font-size:14px;margin-top:8px">Tenta abrir no Safari normal sem ser privado</p></div>';
    return;
  }

  try {
    initTabs();
    initCalendar();
    initChecklist();
    initCsvImporter();
    registerSW();
    navigate('calendar');
  } catch (e) {
    document.getElementById('view-calendar').innerHTML =
      '<div style="padding:60px 16px;text-align:center"><p style="color:#e53e3e;font-weight:600">Erro ao iniciar</p><p style="color:#666;font-size:14px;margin-top:8px">Recarrega a página</p></div>';
  }
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
