/**
 * Test script for cron endpoints
 * 
 * Simulates how a cron job would call the endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'default-dev-secret';

/**
 * Call the update-events endpoint
 */
async function testUpdateEvents() {
  console.log('Testing update-events endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/cron/update-events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Failed to call update-events:', error);
    return null;
  }
}

/**
 * Call the backfill-events endpoint
 */
async function testBackfillEvents(daysBack = 7, maxEvents = 100) {
  console.log(`Testing backfill-events endpoint (daysBack: ${daysBack}, maxEvents: ${maxEvents})...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/cron/backfill-events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ daysBack, maxEvents })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Failed to call backfill-events:', error);
    return null;
  }
}

/**
 * Run tests in sequence
 */
async function runTests() {
  // Test update events
  await testUpdateEvents();
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test backfill events
  await testBackfillEvents(14, 200);
}

// Run tests
console.log('Starting cron endpoint tests...');
runTests()
  .then(() => console.log('Tests completed'))
  .catch(error => console.error('Tests failed:', error)); 