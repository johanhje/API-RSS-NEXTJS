/**
 * Test script for database operations
 * This script verifies that database write operations work correctly.
 */

import { mutate, query, queryOne, transaction, closeDatabase } from './lib/db/database.js';
import { insertEvent, updateEvent, getEventById, deleteEvent } from './lib/db/events.js';

async function testDatabaseOperations() {
  console.log('Testing database write operations...');
  
  try {
    // Create a test event ID with timestamp to avoid conflicts
    const testEventId = `test-event-${Date.now()}`;
    console.log(`Using test event ID: ${testEventId}`);
    
    // Test 1: Insert a test event
    console.log('\n---- Test 1: Insert event ----');
    const testEvent = {
      id: testEventId,
      name: 'Test Event',
      summary: 'This is a test event for database operations',
      location_name: 'Test Location',
      datetime: new Date().toISOString(),
      type: 'Test',
      url: `https://example.com/test/${testEventId}`,
      timestamp: Math.floor(Date.now() / 1000),
      created_at: Math.floor(Date.now() / 1000),
      location_gps: '59.32932,18.06858',
      lat: 59.32932,
      lng: 18.06858,
      translated: 0
    };
    
    const insertResult = insertEvent(testEvent);
    console.log('Insert result:', insertResult);
    
    // Test 2: Retrieve the test event
    console.log('\n---- Test 2: Retrieve event ----');
    const retrievedEvent = getEventById(testEventId);
    console.log('Retrieved event:', retrievedEvent);
    
    // Test 3: Update the test event
    console.log('\n---- Test 3: Update event ----');
    const updatedEvent = {
      ...testEvent,
      name: 'Updated Test Event',
      summary: 'This event has been updated',
      timestamp: Math.floor(Date.now() / 1000)
    };
    
    const updateResult = updateEvent(testEventId, updatedEvent);
    console.log('Update result:', updateResult);
    
    // Test 4: Retrieve the updated event
    console.log('\n---- Test 4: Retrieve updated event ----');
    const retrievedUpdatedEvent = getEventById(testEventId);
    console.log('Retrieved updated event:', retrievedUpdatedEvent);
    
    // Test 5: Transaction with multiple operations
    console.log('\n---- Test 5: Transaction with multiple operations ----');
    const transactionFn = transaction(() => {
      // First operation: Create temporary event
      const tempEventId = `temp-${Date.now()}`;
      mutate(`
        INSERT INTO events (
          id, name, summary, location_name, datetime, 
          type, url, timestamp, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        tempEventId,
        'Temporary Event',
        'This event will be deleted in the same transaction',
        'Nowhere',
        new Date().toISOString(),
        'Temp',
        'https://example.com/temp',
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000)
      ]);
      
      // Second operation: Get the temp event
      const tempEvent = queryOne('SELECT * FROM events WHERE id = ?', [tempEventId]);
      console.log('Temporary event created:', tempEvent.id);
      
      // Third operation: Delete the temp event
      mutate('DELETE FROM events WHERE id = ?', [tempEventId]);
      console.log('Temporary event deleted');
      
      return 'Transaction completed successfully';
    });
    
    const transactionResult = transactionFn();
    console.log('Transaction result:', transactionResult);
    
    // Test 6: Delete the test event
    console.log('\n---- Test 6: Delete test event ----');
    const deleteResult = deleteEvent(testEventId);
    console.log('Delete result:', deleteResult);
    
    // Verify the event is deleted
    const deletedEvent = getEventById(testEventId);
    console.log('Attempt to retrieve deleted event:', deletedEvent);
    
    console.log('\nAll database operation tests completed successfully!');
  } catch (error) {
    console.error('Database operation test error:', error);
  } finally {
    // Clean up any test data and close the connection
    try {
      mutate("DELETE FROM events WHERE id LIKE ? OR id LIKE ?", ['test-%', 'temp-%']);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    
    closeDatabase();
  }
}

// Run tests
testDatabaseOperations(); 