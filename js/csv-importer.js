function initCsvImporter() {
  document.getElementById('import-area').onclick = () => {
    document.getElementById('csv-file-input').click();
  };
  document.getElementById('csv-file-input').onchange = handleFileSelect;
  document.getElementById('import-type').onchange = () => {
    document.getElementById('import-preview').classList.remove('open');
    document.getElementById('csv-file-input').value = '';
  };
  document.getElementById('confirm-import').onclick = confirmImport;
  document.getElementById('cancel-import').onclick = () => {
    document.getElementById('import-preview').classList.remove('open');
    document.getElementById('csv-file-input').value = '';
  };
}

let parsedRows = [];
let importMode = 'activities';

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  importMode = document.getElementById('import-type').value;

  const reader = new FileReader();
  reader.onload = (evt) => {
    const text = evt.target.result;
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    if (result.errors.length) {
      showToast('Erro ao ler CSV: ' + result.errors[0].message);
      return;
    }
    parsedRows = result.data;
    showPreview(parsedRows, importMode);
  };
  reader.readAsText(file);
}

function showPreview(rows, mode) {
  const container = document.getElementById('import-preview');
  const table = document.getElementById('preview-table');
  const previewRows = rows.slice(0, 5);

  const headers = mode === 'activities'
    ? ['Data', 'Tipo', 'Distância', 'Duração', 'FC Média']
    : ['Data', 'Duração Sono', 'SleepScore', 'HRV', 'FC Repouso'];

  let html = '<thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';

  for (const row of previewRows) {
    if (mode === 'activities') {
      const cols = mapActivityRow(row);
      html += `<tr>
        <td>${cols.date}</td>
        <td>${cols.type}</td>
        <td>${cols.distance}</td>
        <td>${cols.duration}</td>
        <td>${cols.avgHr}</td>
      </tr>`;
    } else {
      const cols = mapSaudeRow(row);
      html += `<tr>
        <td>${cols.date}</td>
        <td>${cols.sleepDuration}h</td>
        <td>${cols.sleepScore}</td>
        <td>${cols.hrv}ms</td>
        <td>${cols.restingHr}</td>
      </tr>`;
    }
  }

  html += '</tbody>';
  table.innerHTML = html;
  container.classList.add('open');
}

function mapActivityRow(row) {
  const keys = Object.keys(row);
  const find = (aliases) => {
    for (const a of aliases) {
      const found = keys.find(k => k.toLowerCase().includes(a));
      if (found && row[found]) return row[found].trim();
    }
    return '';
  };

  let date = find(['date', 'data', 'dia', 'time']);
  if (date) date = date.slice(0, 10);

  let distance = find(['distance', 'distância', 'distancia', 'km']);
  if (distance) distance = parseFloat(distance.replace(',', '.')).toFixed(2);

  let duration = find(['duration', 'duração', 'duracao', 'tempo', 'time', 'moving']);
  if (duration && duration.includes('PT')) duration = minutesToTime(parseDuration(duration));

  let avgHr = find(['avg', 'média', 'media', 'average', 'heart']);
  if (avgHr) avgHr = parseInt(avgHr) || '';

  let title = find(['title', 'name', 'notes', 'activity', 'workout']);
  let activityType = find(['type', 'tipo']);
  const type = detectActivityType(activityType + ' ' + title);

  return { date, type, distance, duration, avgHr, notes: title || activityType };
}

function mapSaudeRow(row) {
  const keys = Object.keys(row);
  const find = (aliases) => {
    for (const a of aliases) {
      const found = keys.find(k => k.toLowerCase().includes(a));
      if (found && row[found]) return row[found].trim();
    }
    return '';
  };

  let date = find(['date', 'data', 'dia']);
  if (date) date = date.slice(0, 10);

  let sleepDuration = find(['duration', 'duração', 'duracao', 'horas', 'sleep']);
  if (sleepDuration) sleepDuration = sleepDurationToHours(sleepDuration);

  let sleepScore = parseInt(find(['score', 'sleepscore', 'pontua'])) || 0;
  let hrv = parseInt(find(['hrv'])) || 0;
  let restingHr = parseInt(find(['resting', 'repouso', 'hr'])) || 0;
  let rem = parseInt(find(['rem'])) || 0;

  return { date, sleepDuration, sleepScore, hrv, restingHr, rem };
}

async function confirmImport() {
  if (!parsedRows.length) return;

  const btn = document.getElementById('confirm-import');
  btn.disabled = true;
  btn.textContent = 'A importar...';

  try {
    let count = 0;
    if (importMode === 'activities') {
      const events = [];
      for (const row of parsedRows) {
        const m = mapActivityRow(row);
        if (m.date && m.date.length === 10) {
          events.push({
            date: m.date,
            type: m.type,
            title: m.notes || `Treino ${m.distance}km`,
            time: '',
            duration: m.duration,
            distance: parseFloat(m.distance) || 0,
            avgHr: m.avgHr,
            notes: ''
          });
        }
      }
      count = await DB.bulkAddEvents(events);
    } else {
      const rows = [];
      for (const row of parsedRows) {
        const m = mapSaudeRow(row);
        if (m.date && m.date.length === 10) {
          rows.push({
            date: m.date,
            sleepDuration: m.sleepDuration,
            sleepScore: m.sleepScore,
            hrv: m.hrv,
            restingHr: m.restingHr,
            rem: m.rem
          });
        }
      }
      count = await DB.bulkImportSaude(rows);
    }

    showToast(`Importados ${count} registos ✅`);
    document.getElementById('import-preview').classList.remove('open');
    document.getElementById('csv-file-input').value = '';
    parsedRows = [];
  } catch (err) {
    showToast('Erro ao importar: ' + err.message);
  }

  btn.disabled = false;
  btn.textContent = 'Importar';
}
