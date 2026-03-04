const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data/studio.db');
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    template TEXT DEFAULT 'oscp-purple',
    owner TEXT DEFAULT 'anonymous',
    tags TEXT DEFAULT '[]',
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS compile_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT,
    success INTEGER,
    log TEXT,
    duration_ms INTEGER,
    engine TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    role TEXT DEFAULT 'user',
    color TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );
`);

module.exports = db;
