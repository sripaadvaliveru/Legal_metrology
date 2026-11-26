import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('legal_metrology.db');
    await initDatabase(db);
  }
  return db;
}

async function initDatabase(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS instruments (
      id TEXT PRIMARY KEY,
      instrumentId TEXT,
      instrumentType TEXT,
      manufacturer TEXT,
      model TEXT,
      serialNumber TEXT,
      capacityRange TEXT,
      yearOfManufacture INTEGER,
      usage TEXT,
      status TEXT,
      establishmentId TEXT,
      updatedAt TEXT,
      payload TEXT
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      applicationNumber TEXT,
      instrumentId TEXT,
      type TEXT,
      status TEXT,
      submittedAt TEXT,
      updatedAt TEXT,
      payload TEXT
    );

    CREATE TABLE IF NOT EXISTS checklists (
      id TEXT PRIMARY KEY,
      instrumentTypeId TEXT,
      templateName TEXT,
      description TEXT,
      checklistItems TEXT,
      version INTEGER,
      payload TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT,
      endpoint TEXT,
      method TEXT,
      body TEXT,
      createdAt TEXT,
      synced INTEGER DEFAULT 0,
      attempts INTEGER DEFAULT 0
    );
  `);

  // Migrations for databases created by earlier builds of the app.
  for (const [table, column, definition] of [
    ['instruments', 'payload', 'TEXT'],
    ['applications', 'payload', 'TEXT'],
    ['checklists', 'payload', 'TEXT'],
    ['sync_queue', 'attempts', 'INTEGER DEFAULT 0'],
  ]) {
    const info = await database.getAllAsync(`PRAGMA table_info(${table})`) as Array<{ name: string }>;
    if (!info.some(col => col.name === column)) {
      await database.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }
}

function parsePayload(row: any, fallback: any) {
  if (row?.payload) {
    try {
      return JSON.parse(row.payload);
    } catch {
      // Fall back to the flattened columns below.
    }
  }
  return fallback;
}

// Instruments
export async function cacheInstruments(instruments: any[]) {
  const database = await getDatabase();
  for (const inst of instruments) {
    await database.runAsync(
      `INSERT OR REPLACE INTO instruments (id, instrumentId, instrumentType, manufacturer, model, serialNumber, capacityRange, yearOfManufacture, usage, status, establishmentId, updatedAt, payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      inst.id,
      inst.instrumentId || '',
      inst.instrumentType?.name || '',
      inst.manufacturer || '',
      inst.model || '',
      inst.serialNumber || '',
      inst.capacityRange || '',
      inst.yearOfManufacture || null,
      inst.usage || '',
      inst.status || '',
      inst.establishmentId || inst.establishment?.id || '',
      new Date().toISOString(),
      JSON.stringify(inst)
    );
  }
}

export async function getCachedInstruments(): Promise<any[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync('SELECT * FROM instruments ORDER BY updatedAt DESC') as any[];
  return rows.map(row => parsePayload(row, {
    ...row,
    instrumentType: row.instrumentType ? { name: row.instrumentType } : undefined,
  }));
}

// Applications
export async function cacheApplications(applications: any[]) {
  const database = await getDatabase();
  for (const app of applications) {
    await database.runAsync(
      `INSERT OR REPLACE INTO applications (id, applicationNumber, instrumentId, type, status, submittedAt, updatedAt, payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      app.id,
      app.applicationNumber || '',
      app.instrument?.id || app.instrumentId || '',
      app.type || '',
      app.status || '',
      app.submittedAt || '',
      new Date().toISOString(),
      JSON.stringify(app)
    );
  }
}

export async function getCachedApplications(): Promise<any[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync('SELECT * FROM applications ORDER BY updatedAt DESC') as any[];
  return rows.map(row => parsePayload(row, {
    ...row,
    instrument: row.instrumentId ? { id: row.instrumentId } : undefined,
  }));
}

// Checklists
export async function cacheChecklists(checklists: any[]) {
  const database = await getDatabase();
  for (const cl of checklists) {
    await database.runAsync(
      `INSERT OR REPLACE INTO checklists (id, instrumentTypeId, templateName, description, checklistItems, version, payload)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      cl.id,
      cl.instrumentType?.id || cl.instrumentTypeId || '',
      cl.templateName || '',
      cl.description || '',
      typeof cl.checklistItems === 'string' ? cl.checklistItems : JSON.stringify(cl.checklistItems || []),
      cl.version || 1,
      JSON.stringify(cl)
    );
  }
}

export async function getCachedChecklists(instrumentTypeId: string): Promise<any[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync(
    'SELECT * FROM checklists WHERE instrumentTypeId = ?',
    instrumentTypeId
  ) as any[];
  return rows.map(row => parsePayload(row, row));
}

// Sync Queue
export async function addToSyncQueue(
  operation: string,
  endpoint: string,
  method: string,
  body: any
) {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO sync_queue (operation, endpoint, method, body, createdAt, synced, attempts)
     VALUES (?, ?, ?, ?, ?, 0, 0)`,
    operation,
    endpoint,
    method,
    JSON.stringify(body),
    new Date().toISOString()
  );
}

export async function getPendingSyncItems(): Promise<any[]> {
  const database = await getDatabase();
  return await database.getAllAsync(
    'SELECT * FROM sync_queue WHERE synced = 0 AND attempts < 5 ORDER BY createdAt ASC'
  );
}

export async function markSynced(id: number) {
  const database = await getDatabase();
  await database.runAsync('UPDATE sync_queue SET synced = 1 WHERE id = ?', id);
}

export async function recordSyncFailure(id: number) {
  const database = await getDatabase();
  await database.runAsync('UPDATE sync_queue SET attempts = attempts + 1 WHERE id = ?', id);
}

export async function clearSyncedItems() {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM sync_queue WHERE synced = 1');
}

export async function getPendingSyncCount(): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM sync_queue WHERE synced = 0 AND attempts < 5'
  );
  return row?.count ?? 0;
}
