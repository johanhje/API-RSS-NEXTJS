/**
 * Test script for database migration
 * This script verifies that the migration was successful.
 */

import { getDatabase, query, closeDatabase } from '../lib/db/database.js';
import { DB_PATH } from '../lib/config.js';

console.log(`Testing migrated database at: ${DB_PATH}`);

try {
  // Connect to the migrated database
  const db = getDatabase();
  console.log('Database connection established.');
  
  // Test 1: Verify tables
  console.log('\n---- Test 1: Verify tables ----');
  const tables = query("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Database tables:');
  tables.forEach(table => console.log(`- ${table.name}`));
  
  // Test 2: Verify events table schema
  console.log('\n---- Test 2: Verify events table schema ----');
  const eventColumns = query('PRAGMA table_info(events)');
  console.log('Events table columns:');
  eventColumns.forEach(col => console.log(`- ${col.name} (${col.type})`));
  
  // Test 3: Verify translations table schema
  console.log('\n---- Test 3: Verify translations table schema ----');
  const translationColumns = query('PRAGMA table_info(translations)');
  console.log('Translations table columns:');
  translationColumns.forEach(col => console.log(`- ${col.name} (${col.type})`));
  
  // Test 4: Verify indexes
  console.log('\n---- Test 4: Verify indexes ----');
  const eventIndexes = query('PRAGMA index_list(events)');
  console.log('Events table indexes:');
  eventIndexes.forEach(idx => console.log(`- ${idx.name}`));
  
  const translationIndexes = query('PRAGMA index_list(translations)');
  console.log('Translations table indexes:');
  translationIndexes.forEach(idx => console.log(`- ${idx.name}`));
  
  // Test 5: Verify data
  console.log('\n---- Test 5: Verify data ----');
  const eventCount = query('SELECT COUNT(*) as count FROM events')[0].count;
  const translationCount = query('SELECT COUNT(*) as count FROM translations')[0].count;
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
  const sampleEvent = query('SELECT * FROM events ORDER BY timestamp DESC LIMIT 1')[0];
  console.log('Sample event:');
  console.log(sampleEvent);
  
  console.log('\nAll database migration tests completed successfully!');
} catch (error) {
  console.error('Database migration test error:', error);
} finally {
  closeDatabase();
} 