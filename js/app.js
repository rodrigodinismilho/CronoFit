const VIEWS = ['calendar', 'dashboard', 'checklist', 'import'];
let currentView = 'calendar';

document.addEventListener('DOMContentLoaded', async () => {
  await DB.open();

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
