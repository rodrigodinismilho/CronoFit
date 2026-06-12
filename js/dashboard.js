let sleepChart = null;
let hrvChart = null;
let volumeChart = null;

async function renderDashboard() {
  const saudeData = await DB.getAllSaude();
  const events = await DB.getAllEvents();

  saudeData.sort((a, b) => a.date.localeCompare(b.date));
  const last7 = saudeData.slice(-7);
  const last14 = saudeData.slice(-14);

  const avgSleep = last7.length ? (last7.reduce((s, r) => s + (r.sleepDuration || 0), 0) / last7.length).toFixed(1) : '—';
  const avgHrv = last7.length ? Math.round(last7.reduce((s, r) => s + (r.hrv || 0), 0) / last7.length) : '—';

  const thisWeek = getWeekBounds();
  const weekKm = events
    .filter(e => e.date >= thisWeek.start && e.date <= thisWeek.end && e.distance)
    .reduce((s, e) => s + e.distance, 0);

  document.getElementById('avg-sleep').textContent = avgSleep !== '—' ? `${avgSleep}h` : '—';
  document.getElementById('avg-hrv').textContent = avgHrv !== '—' ? `${avgHrv}ms` : '—';
  document.getElementById('week-km').textContent = weekKm ? `${weekKm.toFixed(1)}km` : '0km';

  renderSleepChart(last7);
  renderHrvChart(last7);
  renderVolumeChart(events, last14);
}

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10)
  };
}

function renderSleepChart(data) {
  const ctx = document.getElementById('sleep-chart');
  if (!ctx) return;
  if (sleepChart) sleepChart.destroy();

  const labels = data.map(d => d.date.slice(5));
  const scores = data.map(d => d.sleepScore || 0);
  const durations = data.map(d => d.sleepDuration || 0);

  sleepChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'SleepScore',
          data: scores,
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168,85,247,.1)',
          fill: true,
          tension: .3,
          pointRadius: 4,
          yAxisID: 'y'
        },
        {
          label: 'Duração (h)',
          data: durations,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,.1)',
          fill: true,
          tension: .3,
          pointRadius: 4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 200,
      interaction: { intersect: false, mode: 'index' },
      plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } } },
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 10 } } },
        y1: { beginAtZero: true, position: 'right', grid: { display: false }, ticks: { font: { size: 10 } } },
        x: { grid: { display: false }, ticks: { font: { size: 10 } } }
      }
    }
  });
}

function renderHrvChart(data) {
  const ctx = document.getElementById('hrv-chart');
  if (!ctx) return;
  if (hrvChart) hrvChart.destroy();

  const labels = data.map(d => d.date.slice(5));
  const hrv = data.map(d => d.hrv || 0);
  const hr = data.map(d => d.restingHr || 0);

  hrvChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'HRV (ms)',
          data: hrv,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,.1)',
          fill: true,
          tension: .3,
          pointRadius: 4,
          yAxisID: 'y'
        },
        {
          label: 'FC Repouso',
          data: hr,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,.1)',
          fill: true,
          tension: .3,
          pointRadius: 4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 200,
      interaction: { intersect: false, mode: 'index' },
      plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 10 } } },
        y1: { beginAtZero: true, position: 'right', grid: { display: false }, ticks: { font: { size: 10 } } },
        x: { grid: { display: false }, ticks: { font: { size: 10 } } }
      }
    }
  });
}

function renderVolumeChart(events, saudeData) {
  const ctx = document.getElementById('volume-chart');
  if (!ctx) return;
  if (volumeChart) volumeChart.destroy();

  const weeks = getLast4Weeks();
  const weekLabels = [];
  const weekKms = [];

  for (const w of weeks) {
    weekLabels.push(w.label);
    const km = events
      .filter(e => e.date >= w.start && e.date <= w.end && e.distance)
      .reduce((s, e) => s + e.distance, 0);
    weekKms.push(parseFloat(km.toFixed(1)));
  }

  volumeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weekLabels,
      datasets: [{
        label: 'km',
        data: weekKms,
        backgroundColor: 'rgba(59,130,246,.7)',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 200,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 10 } } },
        x: { grid: { display: false }, ticks: { font: { size: 10 } } }
      }
    }
  });
}

function getLast4Weeks() {
  const weeks = [];
  const now = new Date();
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - (now.getDay() || 7) + 1 - i * 7);
    const start = new Date(d);
    const end = new Date(d);
    end.setDate(d.getDate() + 6);
    weeks.push({
      label: `${start.getDate()}/${start.getMonth()+1}`,
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10)
    });
  }
  return weeks;
}
