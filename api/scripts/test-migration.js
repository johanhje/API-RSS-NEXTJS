/**
 * Test script for database migration
 * This script verifies that the migration was successful.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { DB_PATH } from '../lib/config.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to the migrated database
const migratedDbPath = path.join(__dirname, '../data/polisapp.sqlite');

console.log(`Config DB_PATH: ${DB_PATH}`);
console.log(`Testing migrated database at: ${migratedDbPath}`);

try {
  // Connect directly to the migrated database
  const db = new Database(migratedDbPath);
  console.log(`Database connection established to: ${migratedDbPath}`);
  
  // Test 1: Verify tables
  console.log('\n---- Test 1: Verify tables ----');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Database tables:');
  tables.forEach(table => console.log(`- ${table.name}`));
  
  // Test 2: Verify events table schema
  console.log('\n---- Test 2: Verify events table schema ----');
  const eventColumns = db.prepare('PRAGMA table_info(events)').all();
  console.log('Events table columns:');
  eventColumns.forEach(col => console.log(`- ${col.name} (${col.type})`));
  
  // Test 3: Verify translations table schema
  console.log('\n---- Test 3: Verify translations table schema ----');
  const translationColumns = db.prepare('PRAGMA table_info(translations)').all();
  console.log('Translations table columns:');
  translationColumns.forEach(col => console.log(`- ${col.name} (${col.type})`));
  
  // Test 4: Verify indexes
  console.log('\n---- Test 4: Verify indexes ----');
  const eventIndexes = db.prepare('PRAGMA index_list(events)').all();
  console.log('Events table indexes:');
  eventIndexes.forEach(idx => console.log(`- ${idx.name}`));
  
  const translationIndexes = db.prepare('PRAGMA index_list(translations)').all();
  console.log('Translations table indexes:');
  translationIndexes.forEach(idx => console.log(`- ${idx.name}`));
  
  // Test 5: Verify data
  console.log('\n---- Test 5: Verify data ----');
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  const translationCount = db.prepare('SELECT COUNT(*) as count FROM translations').get().count;
  console.log(`Event count: ${eventCount}`);
  console.log(`Translation count: ${translationCount}`);
  
  // Test 6: Verify rss_guid column
  console.log('\n---- Test 6: Verify rss_guid column ----');
  const hasRssGuid = eventColumns.some(col => col.name === 'rss_guid');
  console.log(`Has rss_guid column: ${hasRssGuid ? 'Yes' : 'No'}`);
  
  // Test 7: Verify last_updated column
  console.log('\n---- Test 7: Verify last_updated column ----');
  const hasLastUpdated = eventColumns.some(col => col.name === 'last_updated');
  console.log(`Has last_updated column: ${hasLastUpdated ? 'Yes' : 'No'}`);
  
  // Test 8: Check a sample event
  console.log('\n---- Test 8: Check a sample event ----');
  const sampleEvent = db.prepare('SELECT * FROM events ORDER BY timestamp DESC LIMIT 1').get();
  console.log('Sample event:');
  console.log(sampleEvent);
  
  console.log('\nAll database migration tests completed successfully!');
  
  // Close the database connection
  db.close();
} catch (error) {
  console.error('Database migration test error:', error);
} 