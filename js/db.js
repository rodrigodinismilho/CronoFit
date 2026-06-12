const DB_NAME = 'CronoFitDB';
const DB_VERSION = 2;

const DB = {
  _db: null,

  async open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('events')) {
          const store = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
        if (!db.objectStoreNames.contains('checklists')) {
          const store = db.createObjectStore('checklists', { keyPath: 'id', autoIncrement: true });
          store.createIndex('date', 'date', { unique: true });
        }
        if (!db.objectStoreNames.contains('saude')) {
          const store = db.createObjectStore('saude', { keyPath: 'id', autoIncrement: true });
          store.createIndex('date', 'date', { unique: true });
        }
      };
      req.onsuccess = (e) => {
        this._db = e.target.result;
        resolve(this._db);
      };
      req.onerror = () => reject(req.error);
    });
  },

  _tx(storeName, mode) {
    const tx = this._db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  },

  // ─── Events ───
  async getEvents(date) {
    const store = this._tx('events', 'readonly');
    const index = store.index('date');
    return new Promise((resolve) => {
      const req = index.getAll(date);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve([]);
    });
  },

  async getEventsRange(startDate, endDate) {
    const store = this._tx('events', 'readonly');
    const index = store.index('date');
    return new Promise((resolve) => {
      const range = IDBKeyRange.bound(startDate, endDate);
      const req = index.getAll(range);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve([]);
    });
  },

  async getAllEvents() {
    const store = this._tx('events', 'readonly');
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve([]);
    });
  },

  async addEvent(event) {
    const store = this._tx('events', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.add(event);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async deleteEvent(id) {
    const store = this._tx('events', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async bulkAddEvents(events) {
    const store = this._tx('events', 'readwrite');
    return new Promise((resolve, reject) => {
      let count = 0;
      for (const evt of events) {
        const req = store.add(evt);
        req.onsuccess = () => { count++; if (count === events.length) resolve(count); };
        req.onerror = () => reject(req.error);
      }
      if (events.length === 0) resolve(0);
    });
  },

  // ─── Checklists ───
  async getChecklist(date) {
    const store = this._tx('checklists', 'readonly');
    const index = store.index('date');
    return new Promise((resolve) => {
      const req = index.get(date);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  },

  async saveChecklist(date, items) {
    const existing = await this.getChecklist(date);
    const store = this._tx('checklists', 'readwrite');
    return new Promise((resolve, reject) => {
      if (existing) {
        existing.items = items;
        const req = store.put(existing);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } else {
        const req = store.add({ date, items });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }
    });
  },

  // ─── Saude ───
  async getSaude(date) {
    const store = this._tx('saude', 'readonly');
    const index = store.index('date');
    return new Promise((resolve) => {
      const req = index.get(date);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  },

  async getAllSaude() {
    const store = this._tx('saude', 'readonly');
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve([]);
    });
  },

  async saveSaude(data) {
    const existing = await this.getSaude(data.date);
    const store = this._tx('saude', 'readwrite');
    return new Promise((resolve, reject) => {
      if (existing) {
        Object.assign(existing, data);
        const req = store.put(existing);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } else {
        const req = store.add(data);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }
    });
  },

  async bulkImportSaude(rows) {
    for (const row of rows) {
      await this.saveSaude(row);
    }
    return rows.length;
  },

  // ─── Clear all ───
  async clearAll() {
    for (const name of ['events', 'checklists', 'saude']) {
      const store = this._tx(name, 'readwrite');
      await new Promise((resolve) => {
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    }
  }
};
