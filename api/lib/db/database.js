/**
 * Database connection handler
 */

import Database from 'better-sqlite3';
import { DB_PATH } from '../config.js';

let db = null;

/**
 * Get the database connection
 * @returns {Database} The database connection
 */
export function getDatabase() {
  if (!db) {
    try {
      db = new Database(DB_PATH, { readonly: false });
      // Enable foreign keys
      db.pragma('foreign_keys = ON');
      console.log(`Connected to SQLite database at: ${DB_PATH}`);
    } catch (error) {
      console.error('Error connecting to SQLite database:', error);
      throw error;
    }
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * Execute a query with parameters
 * @param {string} sql - SQL query
 * @param {Object} params - Query parameters
 * @returns {Array} - Query results
 */
export function query(sql, params = {}) {
  const db = getDatabase();
  try {
    const stmt = db.prepare(sql);
    return stmt.all(params);
  } catch (error) {
    console.error(`Error executing query: ${sql}`, error);
    throw error;
  }
}

/**
 * Execute a single row query with parameters
 * @param {string} sql - SQL query
 * @param {Object} params - Query parameters
 * @returns {Object|null} - Single row result or null
 */
export function queryOne(sql, params = {}) {
  const db = getDatabase();
  try {
    const stmt = db.prepare(sql);
    return stmt.get(params);
  } catch (error) {
    console.error(`Error executing queryOne: ${sql}`, error);
    throw error;
  }
}

/**
 * Execute a mutation query (INSERT, UPDATE, DELETE)
 * @param {string} sql - SQL query
 * @param {Object} params - Query parameters
 * @returns {Object} - Result with changes and lastInsertRowid
 */
export function mutate(sql, params = {}) {
  const db = getDatabase();
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(params);
    return {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid
    };
  } catch (error) {
    console.error(`Error executing mutation: ${sql}`, error);
    throw error;
  }
}

/**
 * Begin a transaction
 * @returns {Function} - Transaction function
 */
export function transaction(fn) {
  const db = getDatabase();
  const transactionFn = db.transaction(fn);
  return transactionFn;
} 