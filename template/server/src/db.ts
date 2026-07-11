import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3-multiple-ciphers';
import { DB_ENCRYPTION_KEY, DB_PATH } from './config';

const resolvedPath = path.resolve(DB_PATH);
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const db = new Database(resolvedPath);
if (DB_ENCRYPTION_KEY) {
  const escapedKey = DB_ENCRYPTION_KEY.replace(/'/g, "''");
  db.pragma(`key='${escapedKey}'`);
}

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

export default db;
