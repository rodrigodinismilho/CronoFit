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

  renderBars('sleep-chart', renderSleepBars(last7));
  renderBars('hrv-chart', renderHrvBars(last7));
  renderBars('volume-chart', renderVolumeBars(events));
}

function renderBars(containerId, bars) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = bars;
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

function renderSleepBars(data) {
  if (!data.length) return '<div class="chart-empty">Sem dados de sono</div>';
  const maxScore = Math.max(...data.map(d => d.sleepScore || 0), 50);
  let html = '<div class="chart-legend"><span>SleepScore</span><span>Duração (h)</span></div>';
  html += '<div class="bar-group">';
  for (const d of data) {
    const pct = Math.round((d.sleepScore || 0) / maxScore * 100);
    const dur = d.sleepDuration || 0;
    html += `<div class="bar-col">
      <div class="bar-label-top">${d.date.slice(5)}</div>
      <div class="bar-stack">
        <div class="bar bar-purple" style="height:${pct}%"></div>
        <div class="bar bar-blue" style="height:${dur * 10}%"></div>
      </div>
      <div class="bar-label-bottom">${d.sleepScore || '-'}<span class="bar-sub">${dur.toFixed(1)}h</span></div>
    </div>`;
  }
  html += '</div>';
  return html;
}

function renderHrvBars(data) {
  if (!data.length) return '<div class="chart-empty">Sem dados de HRV</div>';
  const maxHrv = Math.max(...data.map(d => d.hrv || 0), 30);
  const maxHr = Math.max(...data.map(d => d.restingHr || 0), 60);
  let html = '<div class="chart-legend"><span>HRV (ms)</span><span>FC Repouso</span></div>';
  html += '<div class="bar-group">';
  for (const d of data) {
    const hrvPct = Math.round((d.hrv || 0) / maxHrv * 100);
    const hrPct = Math.round((d.restingHr || 0) / maxHr * 100);
    html += `<div class="bar-col">
      <div class="bar-label-top">${d.date.slice(5)}</div>
      <div class="bar-stack">
        <div class="bar bar-green" style="height:${hrvPct}%"></div>
        <div class="bar bar-red" style="height:${hrPct}%"></div>
      </div>
      <div class="bar-label-bottom">${d.hrv || '-'}<span class="bar-sub">${d.restingHr || '-'}</span></div>
    </div>`;
  }
  html += '</div>';
  return html;
}

function renderVolumeBars(events) {
  const weeks = getLast4Weeks();
  const maxKm = 10;
  let html = '<div class="bar-group volume-group">';
  for (const w of weeks) {
    const km = events
      .filter(e => e.date >= w.start && e.date <= w.end && e.distance)
      .reduce((s, e) => s + e.distance, 0);
    const pct = Math.min(Math.round(km / maxKm * 100), 100);
    html += `<div class="bar-col">
      <div class="bar-label-top">${w.label}</div>
      <div class="bar-track"><div class="bar bar-blue fill" style="height:${pct}%"></div></div>
      <div class="bar-label-bottom">${km.toFixed(1)}</div>
    </div>`;
  }
  html += '</div>';
  return html;
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
