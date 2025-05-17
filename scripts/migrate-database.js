/**
 * Database Migration Script
 * 
 * This script copies the existing SQLite database and makes necessary schema updates.
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the source and target paths
const sourcePath = path.join(__dirname, '../../polisapi/polisapp.sqlite');
const targetDir = path.join(__dirname, '../data');
const targetPath = path.join(targetDir, 'polisapp.sqlite');

console.log(`Migration script started at ${new Date().toISOString()}`);
console.log(`Source path: ${sourcePath}`);
console.log(`Target path: ${targetPath}`);

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created target directory: ${targetDir}`);
}

// Check if source database exists
if (!fs.existsSync(sourcePath)) {
  console.error(`Source database doesn't exist at: ${sourcePath}`);
  process.exit(1);
}

// Backup existing database if it exists
if (fs.existsSync(targetPath)) {
  const backupPath = `${targetPath}.backup.${Date.now()}`;
  fs.copyFileSync(targetPath, backupPath);
  console.log(`Backed up existing database to ${backupPath}`);
}

// Copy the source database
try {
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Copied database from ${sourcePath} to ${targetPath}`);
} catch (error) {
  console.error(`Error copying database: ${error.message}`);
  process.exit(1);
}

// Open the copied database to make schema modifications
try {
  const db = new Database(targetPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Start transaction for schema changes
  const schemaChanges = db.transaction(() => {
    // Check if we need to add an rss_guid column for tracking RSS items
    const eventsTableInfo = db.prepare('PRAGMA table_info(events)').all();
    if (!eventsTableInfo.some(col => col.name === 'rss_guid')) {
      db.prepare('ALTER TABLE events ADD COLUMN rss_guid TEXT').run();
      console.log('Added rss_guid column to events table');
    } else {
      console.log('rss_guid column already exists in events table');
    }
    
    // Check if we need to add a last_updated column for tracking when events were last updated
    if (!eventsTableInfo.some(col => col.name === 'last_updated')) {
      db.prepare('ALTER TABLE events ADD COLUMN last_updated INTEGER DEFAULT 0').run();
      console.log('Added last_updated column to events table');
    } else {
      console.log('last_updated column already exists in events table');
    }
    
    // Add indexes for performance
    try {
      db.prepare('CREATE INDEX IF NOT EXISTS idx_events_rss_guid ON events(rss_guid)').run();
      console.log('Created index on events.rss_guid');
    } catch (error) {
      console.log(`Note: ${error.message}`);
    }
    
    try {
      db.prepare('CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)').run();
      console.log('Created index on events.timestamp');
    } catch (error) {
      console.log(`Note: ${error.message}`);
    }
    
    try {
      db.prepare('CREATE INDEX IF NOT EXISTS idx_events_url ON events(url)').run();
      console.log('Created index on events.url');
    } catch (error) {
      console.log(`Note: ${error.message}`);
    }
    
    try {
      db.prepare('CREATE INDEX IF NOT EXISTS idx_translations_event_id ON translations(event_id)').run();
      console.log('Created index on translations.event_id');
    } catch (error) {
      console.log(`Note: ${error.message}`);
    }
    
    try {
      db.prepare('CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(language)').run();
      console.log('Created index on translations.language');
    } catch (error) {
      console.log(`Note: ${error.message}`);
    }
  });
  
  // Execute schema changes inside a transaction
  schemaChanges();
  
  // Verify the database
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  const translationCount = db.prepare('SELECT COUNT(*) as count FROM translations').get().count;
  
  console.log(`Database verification:
- Events: ${eventCount}
- Translations: ${translationCount}`);
  
  // Check database integrity
  const integrityCheck = db.pragma('integrity_check');
  console.log('Database integrity check:', integrityCheck);
  
  // Close the database connection
  db.close();
  
  console.log(`Database migration completed successfully at ${new Date().toISOString()}`);
} catch (error) {
  console.error(`Error during schema modification: ${error.message}`);
  console.error('Migration failed. Try restoring from backup if available.');
  process.exit(1);
} 