/**
 * Test Script: API Endpoints
 * 
 * Tests the API endpoints to ensure they are working correctly
 */

import fetch from 'node-fetch';

// Configuration
const BASE_URL = 'http://localhost:3000';
const ENDPOINTS = [
  { path: '/api/status', method: 'GET', description: 'API Status' },
  { path: '/api/docs', method: 'GET', description: 'API Documentation' },
  { path: '/api/v1/events', method: 'GET', description: 'Events List' },
  { path: '/api/v1/events?page=1&limit=5', method: 'GET', description: 'Events with Pagination' },
  { path: '/api/v1/events?location=Stockholm', method: 'GET', description: 'Events Filtered by Location' },
  { path: '/api/v1/locations', method: 'GET', description: 'Locations List' },
  { path: '/api/v1/types', method: 'GET', description: 'Event Types' },
  { path: '/api/v1/stats', method: 'GET', description: 'API Statistics' }
];

/**
 * Test a single endpoint
 * 
 * @param {Object} endpoint - Endpoint configuration
 * @returns {Promise<Object>} - Test result
 */
async function testEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.path}`;
  console.log(`Testing ${endpoint.method} ${endpoint.path} (${endpoint.description})...`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(url, { method: endpoint.method });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    let data = null;
    if (isJson) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    const success = response.ok;
    const status = response.status;
    
    console.log(`  Status: ${status} (${success ? 'SUCCESS' : 'FAIL'})`);
    console.log(`  Response time: ${responseTime}ms`);
    
    if (!success) {
      console.log(`  Error: ${JSON.stringify(data)}`);
    } else if (isJson) {
      // Print a summary of the response data
      if (data.data && Array.isArray(data.data)) {
        console.log(`  Data: Array with ${data.data.length} items`);
        
        if (data.pagination) {
          console.log(`  Pagination: Page ${data.pagination.page} of ${data.pagination.pages}, ${data.pagination.total} total items`);
        }
      } else if (data.data) {
        console.log(`  Data: Object with ${Object.keys(data.data).length} properties`);
      } else {
        console.log(`  Data: ${JSON.stringify(data).slice(0, 100)}...`);
      }
    }
    
    return {
      url,
      method: endpoint.method,
      description: endpoint.description,
      success,
      status,
      responseTime,
      contentType
    };
  } catch (error) {
    console.log(`  Error: ${error.message}`);
    
    return {
      url,
      method: endpoint.method,
      description: endpoint.description,
      success: false,
      error: error.message
    };
  }
}

/**
 * Run tests for all endpoints
 */
async function runTests() {
  console.log('=== TESTING API ENDPOINTS ===\n');
  
  const results = [];
  let successCount = 0;
  
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      successCount++;
    }
    
    console.log(''); // Empty line between tests
  }
  
  // Print summary
  console.log('=== TEST SUMMARY ===');
  console.log(`Total endpoints: ${results.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${results.length - successCount}`);
  console.log('');
  
  // Print failures if any
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('Failed endpoints:');
    failures.forEach(f => {
      console.log(`- ${f.method} ${f.url} (${f.description}): ${f.error || f.status}`);
    });
    console.log('');
    
    process.exit(1);
  } else {
    console.log('All endpoints are working correctly!');
    console.log('');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 