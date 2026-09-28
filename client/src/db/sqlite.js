/* =============================================================
   SQLITE WASM DATABASE ENGINE & UPLOAD HISTORY PERSISTENCE
   Stored in Frontend using sql.js + IndexedDB binary storage
   ============================================================= */

class SQLiteDBManager {
  constructor() {
    this.db = null;
    this.SQL = null;
    this.isReady = false;
    this.initPromise = null;
  }

  async init() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        if (typeof window !== 'undefined' && typeof window.initSqlJs === 'function') {
          this.SQL = await window.initSqlJs({
            locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
          });
          const savedBytes = await this.loadBinaryFromStorage();
          if (savedBytes && savedBytes.length > 0) {
            this.db = new this.SQL.Database(savedBytes);
          } else {
            this.db = new this.SQL.Database();
          }
        }
      } catch (err) {
        console.warn('SQLite WASM initialization error:', err);
        if (this.SQL) this.db = new this.SQL.Database();
      }

      if (this.db) {
        this.db.run(`
          CREATE TABLE IF NOT EXISTS upload_history (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            timestamp_raw INTEGER NOT NULL,
            aoa_json TEXT NOT NULL
          );
        `);
      }
      this.isReady = true;
      return this.db;
    })();

    return this.initPromise;
  }

  async persist() {
    if (!this.db) return;
    try {
      const binary = this.db.export();
      await this.saveBinaryToStorage(binary);
    } catch (e) {
      console.error('Error persisting SQLite DB:', e);
    }
  }

  async saveBinaryToStorage(binary) {
    return new Promise((resolve) => {
      if (!window.indexedDB) return resolve(false);
      const req = indexedDB.open('IDT_SQLite_FileStorage', 1);
      req.onupgradeneeded = (e) => {
        e.target.result.createObjectStore('sqlite_store');
      };
      req.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('sqlite_store', 'readwrite');
        tx.objectStore('sqlite_store').put(binary, 'idt_database_sqlite');
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      };
      req.onerror = () => resolve(false);
    });
  }

  async loadBinaryFromStorage() {
    return new Promise((resolve) => {
      if (!window.indexedDB) return resolve(null);
      const req = indexedDB.open('IDT_SQLite_FileStorage', 1);
      req.onupgradeneeded = (e) => {
        e.target.result.createObjectStore('sqlite_store');
      };
      req.onsuccess = (e) => {
        const db = e.target.result;
        try {
          const tx = db.transaction('sqlite_store', 'readonly');
          const getReq = tx.objectStore('sqlite_store').get('idt_database_sqlite');
          getReq.onsuccess = () => resolve(getReq.result || null);
          getReq.onerror = () => resolve(null);
        } catch (err) {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  }

  async save({ id, name, timestamp, timestampRaw, aoa }) {
    await this.init();
    if (!name) return;

    const recId = id || ('doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));
    const now = new Date();
    const timeStr = timestamp || now.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const timeRaw = timestampRaw || now.getTime();
    const aoaJson = JSON.stringify(aoa || []);

    if (this.db) {
      try {
        this.db.run(`DELETE FROM upload_history WHERE name = ?;`, [name]);
        this.db.run(
          `INSERT INTO upload_history (id, name, timestamp, timestamp_raw, aoa_json)
           VALUES (?, ?, ?, ?, ?);`,
          [recId, name, timeStr, timeRaw, aoaJson]
        );
        await this.persist();
      } catch (e) {
        console.error('SQLite save error:', e);
      }
    }

    // Mirrored localStorage cache for instant fast queries
    try {
      let meta = JSON.parse(localStorage.getItem('idt_sqlite_meta') || '[]');
      meta = meta.filter((x) => x.name !== name);
      meta.unshift({ id: recId, name, timestamp: timeStr, timestampRaw: timeRaw });
      localStorage.setItem('idt_sqlite_meta', JSON.stringify(meta));
    } catch (e) {}

    return { id: recId, name, timestamp: timeStr };
  }

  async getAll() {
    await this.init();
    if (this.db) {
      try {
        const stmt = this.db.prepare(
          `SELECT id, name, timestamp, timestamp_raw FROM upload_history ORDER BY timestamp_raw DESC;`
        );
        const list = [];
        while (stmt.step()) {
          const row = stmt.getAsObject();
          list.push({
            id: row.id,
            name: row.name,
            timestamp: row.timestamp,
            timestampRaw: row.timestamp_raw
          });
        }
        stmt.free();
        return list;
      } catch (e) {
        console.warn('SQLite getAll error, falling back to cache:', e);
      }
    }

    // Fallback to localStorage meta cache
    try {
      return JSON.parse(localStorage.getItem('idt_sqlite_meta') || '[]');
    } catch (e) {
      return [];
    }
  }

  async getById(id) {
    await this.init();
    if (this.db) {
      try {
        const stmt = this.db.prepare(`SELECT * FROM upload_history WHERE id = ?;`);
        stmt.bind([id]);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return {
            id: row.id,
            name: row.name,
            timestamp: row.timestamp,
            aoa: JSON.parse(row.aoa_json || '[]')
          };
        }
        stmt.free();
      } catch (e) {
        console.error('SQLite getById error:', e);
      }
    }
    return null;
  }

  async deleteById(id) {
    await this.init();
    if (this.db) {
      try {
        this.db.run(`DELETE FROM upload_history WHERE id = ?;`, [id]);
        await this.persist();
      } catch (e) {
        console.error('SQLite delete error:', e);
      }
    }

    try {
      let meta = JSON.parse(localStorage.getItem('idt_sqlite_meta') || '[]');
      meta = meta.filter((x) => x.id !== id);
      localStorage.setItem('idt_sqlite_meta', JSON.stringify(meta));
    } catch (e) {}
  }

  async clearAll() {
    await this.init();
    if (this.db) {
      try {
        this.db.run(`DELETE FROM upload_history;`);
        await this.persist();
      } catch (e) {
        console.error('SQLite clearAll error:', e);
      }
    }

    try {
      localStorage.removeItem('idt_sqlite_meta');
    } catch (e) {}
  }

  async exportDatabase() {
    await this.init();
    if (!this.db) {
      alert('SQLite Database is not ready yet.');
      return;
    }
    try {
      const binary = this.db.export();
      const blob = new Blob([binary], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `idt_tracker_${Date.now()}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to export SQLite database: ' + e.message);
    }
  }
}

export const sqliteDB = new SQLiteDBManager();

