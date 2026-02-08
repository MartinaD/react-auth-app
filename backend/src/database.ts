import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { DbResult, User } from './types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: sqlite3.Database | null = null;

export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Use /app/data in Docker, or current directory otherwise
    const dataDir = process.env.DATABASE_DIR || __dirname;
    const dbPath = path.join(dataDir, 'database.sqlite');
    
    // Open database with serialized mode for better concurrency
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log(`Connected to SQLite database at ${dbPath}`);
      
      // Enable WAL mode for better concurrency (skip in test environment)
      if (db) {
        const enableWal = process.env.NODE_ENV !== 'test';
        if (enableWal) {
          db.run('PRAGMA journal_mode = WAL;', (err) => {
            if (err) {
              console.warn('Warning: Could not enable WAL mode:', err);
            }
            createTables().then(resolve).catch(reject);
          });
        } else {
          // In test mode, use FULL synchronous mode to ensure all writes are committed
          db.run('PRAGMA synchronous = FULL;', (err) => {
            if (err) {
              console.warn('Warning: Could not set synchronous mode:', err);
            }
            createTables().then(resolve).catch(reject);
          });
        }
      } else {
        reject(new Error('Database connection failed'));
      }
    });
  });
};

const createTables = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createUsersTable, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
        reject(err);
        return;
      }
      console.log('Users table ready');
      resolve();
    });
  });
};

export const getDb = (): sqlite3.Database => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// Promisified database methods
export const dbRun = (sql: string, params: unknown[] = []): Promise<DbResult> => {
  console.log('DB RUN', {sql})
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

export const dbGet = <T = User>(sql: string, params: unknown[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row as T | undefined);
      }
    });
  });
};

export const dbAll = <T = User>(sql: string, params: unknown[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.all(sql, params, (err, rows) => {
      console.log({sql, params, rows})
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
};

export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }

    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
        reject(err);
      } else {
        console.log('Database connection closed');
        db = null;
        resolve();
      }
    });
  });
};

