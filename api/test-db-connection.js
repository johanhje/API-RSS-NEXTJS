/**
 * Test script for database connection
 * This script verifies that the database connection works correctly.
 */

import { getDatabase, query, queryOne, mutate, transaction, closeDatabase } from './lib/db/database.js';
import { getAllEvents, getEventById, countEvents } from './lib/db/events.js';

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  try {
    // Test 1: Connect to database
    console.log('\n---- Test 1: Connect to database ----');
    const db = getDatabase();
    console.log('Database connection established.');
    
    // Test 2: Count events
    console.log('\n---- Test 2: Count events ----');
    const count = countEvents();
    console.log(`Total events in database: ${count}`);
    
    // Test 3: Get events with limit
    console.log('\n---- Test 3: Get events with limit ----');
    const events = getAllEvents({ limit: 5 });
    console.log(`Retrieved ${events.length} events:`);
    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.id}: ${event.name} (${event.datetime})`);
    });
    
    // Test 4: Get specific event
    if (events.length > 0) {
      console.log('\n---- Test 4: Get specific event ----');
      const eventId = events[0].id;
      const event = getEventById(eventId);
      console.log(`Event details for ${eventId}:`);
      console.log(JSON.stringify(event, null, 2));
    }
    
    // Test 5: Basic query
    console.log('\n---- Test 5: Basic query ----');
    const tables = query("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Database tables:');
    tables.forEach(table => console.log(`- ${table.name}`));
    
    // Test 6: Transaction (read-only test)
    console.log('\n---- Test 6: Transaction ----');
    const transactionFn = transaction(() => {
      const result = queryOne('SELECT COUNT(*) as count FROM events');
      console.log(`Count in transaction: ${result.count}`);
      return result.count;
    });
    
    const transactionResult = transactionFn();
    console.log(`Transaction result: ${transactionResult}`);
    
    console.log('\nAll database tests completed successfully!');
  } catch (error) {
    console.error('Database test error:', error);
  } finally {
    // Close the database connection
    closeDatabase();
  }
}

// Run tests
testDatabaseConnection(); 