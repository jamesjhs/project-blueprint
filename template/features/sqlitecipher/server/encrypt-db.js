const path = require('node:path');
const Database = require('better-sqlite3-multiple-ciphers');

const sourcePath = path.resolve(process.env.DB_SOURCE || './data/app.db');
const outputPath = path.resolve(process.env.DB_TARGET || './data/app.encrypted.db');
const encryptionKey = process.env.DB_ENCRYPTION_KEY;

if (!encryptionKey) {
  throw new Error('DB_ENCRYPTION_KEY must be set');
}

const escapeValue = (value) => value.replace(/'/g, "''");
const source = new Database(sourcePath);
source.exec(`ATTACH DATABASE '${escapeValue(outputPath)}' AS encrypted KEY '${escapeValue(encryptionKey)}';`);
source.exec("SELECT sqlcipher_export('encrypted');");
source.exec('DETACH DATABASE encrypted;');
source.close();

console.log(`Encrypted database written to ${outputPath}`);
