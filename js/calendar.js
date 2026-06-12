let calYear, calMonth, selectedDate;

function initCalendar() {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  selectedDate = todayStr();

  document.getElementById('prev-month').onclick = () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); };
  document.getElementById('next-month').onclick = () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); };

  document.getElementById('cancel-event').onclick = () => {
    document.getElementById('add-event-form').classList.remove('open');
  };

  document.getElementById('save-event').onclick = async () => {
    const form = document.getElementById('add-event-form');
    const type = document.getElementById('event-type').value;
    const title = document.getElementById('event-title').value.trim();
    const time = document.getElementById('event-time').value;
    if (!title) { showToast('Insere um título'); return; }
    const parts = (time || '').split(':');
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    await DB.addEvent({
      date: selectedDate,
      type,
      title,
      time: `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`,
      duration: document.getElementById('event-duration').value,
      distance: parseFloat(document.getElementById('event-distance').value) || 0,
      notes: ''
    });
    form.classList.remove('open');
    document.getElementById('event-title').value = '';
    document.getElementById('event-time').value = '';
    document.getElementById('event-duration').value = '';
    document.getElementById('event-distance').value = '';
    showToast('Evento adicionado ✅');
    renderCalendar();
    renderDayDetail();
  };

  renderWeekdays();
  renderCalendar();
}

async function renderCalendar() {
  const days = getMonthDays(calYear, calMonth);
  const grid = document.getElementById('days-grid');
  document.getElementById('month-label').textContent = `${MONTHS_PT[calMonth]} ${calYear}`;

  const events = await DB.getEventsRange(
    days[0].date,
    days[days.length - 1].date
  );

  const eventsByDate = {};
  for (const e of events) {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = [];
    eventsByDate[e.date].push(e);
  }

  const today = todayStr();
  grid.innerHTML = '';
  for (const day of days) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (day.other) cell.classList.add('other-month');
    if (day.date === today) cell.classList.add('today');
    if (day.date === selectedDate) cell.classList.add('selected');

    cell.innerHTML = `<span>${day.day}</span>`;

    const dots = eventsByDate[day.date];
    if (dots && dots.length) {
      const dotContainer = document.createElement('div');
      dotContainer.className = 'day-dots';
      const shown = dots.slice(0, 4);
      for (const evt of dots) {
        const dot = document.createElement('div');
        dot.className = 'day-dot';
        const type = ACTIVITY_TYPES.find(t => t.id === evt.type) || ACTIVITY_TYPES[0];
        dot.style.background = type.color;
        dotContainer.appendChild(dot);
      }
      cell.appendChild(dotContainer);
    }

    cell.onclick = () => {
      selectedDate = day.date;
      renderCalendar();
      renderDayDetail();
    };

    grid.appendChild(cell);
  }

  renderDayDetail();
}

async function renderDayDetail() {
  const el = document.getElementById('day-detail');
  const dateTitle = document.getElementById('selected-date');
  const eventsContainer = document.getElementById('day-events');

  dateTitle.textContent = formatDateStr(selectedDate);

  const dayEvents = await DB.getEvents(selectedDate);
  eventsContainer.innerHTML = '';

  if (!dayEvents.length) {
    eventsContainer.innerHTML = '<div class="no-events">Nenhum evento neste dia</div>';
  } else {
    for (const evt of dayEvents) {
      const item = document.createElement('div');
      item.className = 'event-item';

      const type = ACTIVITY_TYPES.find(t => t.id === evt.type) || ACTIVITY_TYPES[0];
      const dot = document.createElement('div');
      dot.className = 'event-dot';
      dot.style.background = type.color;

      const info = document.createElement('div');
      info.className = 'event-info';
      info.innerHTML = `
        <div class="event-title">${escHtml(evt.title)}</div>
        <div class="event-meta">
          ${evt.time ? `<span>${evt.time}</span>` : ''}
          ${evt.duration ? ` · <span>${evt.duration}</span>` : ''}
          ${evt.distance ? ` · <span>${evt.distance}km</span>` : ''}
          ${type.label ? ` · ${type.label}` : ''}
        </div>
      `;

      const del = document.createElement('button');
      del.className = 'event-delete';
      del.innerHTML = '✕';
      del.onclick = async () => {
        await DB.deleteEvent(evt.id);
        renderCalendar();
      };

      item.appendChild(dot);
      item.appendChild(info);
      item.appendChild(del);
      eventsContainer.appendChild(item);
    }
  }

  const addBtn = document.getElementById('add-event-btn');
  addBtn.onclick = () => {
    document.getElementById('add-event-form').classList.toggle('open');
    populateEventTypes();
  };
}

function populateEventTypes() {
  const sel = document.getElementById('event-type');
  sel.innerHTML = ACTIVITY_TYPES.map(t => `<option value="${t.id}">${t.label}</option>`).join('');
}

function renderWeekdays() {
  const container = document.getElementById('weekdays');
  container.innerHTML = DAYS_PT.map(d => `<span>${d}</span>`).join('');
}

function escHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
