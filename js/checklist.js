let checklistDate = todayStr();
const DEFAULT_ITEMS = [
  { label: 'Treino feito', done: false },
  { label: 'Dormir 8h+', done: false },
  { label: 'Alongar / Mobilidade', done: false },
  { label: 'Hidratar 2L+', done: false },
  { label: 'Refeição pós-treino', done: false },
];

function initChecklist() {
  document.getElementById('checklist-prev').onclick = () => {
    const d = new Date(checklistDate);
    d.setDate(d.getDate() - 1);
    checklistDate = d.toISOString().slice(0, 10);
    renderChecklist();
  };
  document.getElementById('checklist-next').onclick = () => {
    const d = new Date(checklistDate);
    d.setDate(d.getDate() + 1);
    checklistDate = d.toISOString().slice(0, 10);
    renderChecklist();
  };
  document.getElementById('add-checklist-btn').onclick = () => {
    const input = document.getElementById('checklist-new-input');
    const label = input.value.trim();
    if (!label) return;
    addChecklistItem(label);
    input.value = '';
  };
  document.getElementById('checklist-new-input').onkeydown = (e) => {
    if (e.key === 'Enter') document.getElementById('add-checklist-btn').click();
  };
  renderChecklist();
}

async function renderChecklist() {
  document.getElementById('checklist-date-label').textContent = formatDateStr(checklistDate);

  let data = await DB.getChecklist(checklistDate);
  let items;
  if (!data) {
    items = DEFAULT_ITEMS.map(i => ({ ...i }));
  } else {
    items = data.items;
  }

  renderChecklistItems(items);
  updateProgress(items);
}

function renderChecklistItems(items) {
  const container = document.getElementById('checklist-items');
  container.innerHTML = '';

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const li = document.createElement('li');
    li.className = 'checklist-item' + (item.done ? ' done' : '');

    const cb = document.createElement('div');
    cb.className = 'checkbox-custom' + (item.done ? ' checked' : '');
    cb.textContent = item.done ? '✓' : '';
    cb.onclick = async () => {
      item.done = !item.done;
      await DB.saveChecklist(checklistDate, items);
      renderChecklist();
    };

    const label = document.createElement('span');
    label.className = 'check-label';
    label.textContent = item.label;

    const del = document.createElement('button');
    del.className = 'check-delete';
    del.innerHTML = '✕';
    del.onclick = async () => {
      const isDefault = DEFAULT_ITEMS.some(d => d.label === item.label);
      if (isDefault) {
        item.done = false;
        await DB.saveChecklist(checklistDate, items);
        renderChecklist();
        return;
      }
      items.splice(i, 1);
      await DB.saveChecklist(checklistDate, items);
      renderChecklist();
    };

    li.appendChild(cb);
    li.appendChild(label);
    li.appendChild(del);
    container.appendChild(li);
  }
}

function updateProgress(items) {
  const total = items.length;
  const done = items.filter(i => i.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('checklist-progress').style.width = pct + '%';
  document.getElementById('checklist-progress').textContent = '';
}

async function addChecklistItem(label) {
  let data = await DB.getChecklist(checklistDate);
  let items;
  if (!data) {
    items = DEFAULT_ITEMS.map(i => ({ ...i }));
  } else {
    items = data.items;
  }
  items.push({ label, done: false });
  await DB.saveChecklist(checklistDate, items);
  renderChecklist();
}
