/**
 * Test script for caching system
 * 
 * Verifies that all caching mechanisms are working properly
 */

import { geocodeLocation } from '../lib/geocoding/nominatim.js';
import { fetchRssFeed, fetchAndConvertRssEvents } from '../lib/rss/parser.js';
import { getCacheMetrics, clearCache, resetMetrics, purgeExpired } from '../lib/cache/index.js';
import { getAllCacheMetrics } from '../lib/cache/monitor.js';
import fetch from 'node-fetch';

// Test locations for geocoding
const TEST_LOCATIONS = [
  'Stockholm',
  'Göteborg',
  'Malmö',
  'Uppsala',
  'Västerås',
  'Örebro',
  'Linköping',
  'Helsingborg',
  'Jönköping',
  'Norrköping'
];

/**
 * Test geocoding cache
 */
async function testGeocodingCache() {
  console.log('Testing geocoding cache...');
  
  // Clear cache before testing to ensure clean state
  clearCache();
  
  // Reset metrics before testing
  resetMetrics();
  
  // First run - should be cache misses
  console.log('First geocoding run (expect cache misses):');
  for (const location of TEST_LOCATIONS) {
    const result = await geocodeLocation(location);
    console.log(`- ${location}: ${result ? `${result.lat}, ${result.lon}` : 'Not found'}`);
  }
  
  // Show metrics after first run
  const firstRunMetrics = getCacheMetrics();
  console.log('Metrics after first run:', firstRunMetrics);
  
  // Second run - should be cache hits
  console.log('\nSecond geocoding run (expect cache hits):');
  for (const location of TEST_LOCATIONS) {
    const result = await geocodeLocation(location);
    console.log(`- ${location}: ${result ? `${result.lat}, ${result.lon}` : 'Not found'}`);
  }
  
  // Show metrics after second run
  const secondRunMetrics = getCacheMetrics();
  console.log('Metrics after second run:', secondRunMetrics);
  
  // Verify that cache hits increased
  const hitIncrease = secondRunMetrics.hits - firstRunMetrics.hits;
  console.log(`\nCache hit increase: ${hitIncrease} (expected ${TEST_LOCATIONS.length})`);
  
  if (hitIncrease === TEST_LOCATIONS.length) {
    console.log('✅ Geocoding cache is working correctly');
  } else {
    console.log('❌ Geocoding cache is not working correctly');
  }
}

/**
 * Test RSS feed cache
 */
async function testRssFeedCache() {
  console.log('\nTesting RSS feed cache...');
  
  // Clear cache before testing
  clearCache();
  
  // Reset metrics before testing
  resetMetrics();
  
  try {
    // First run - should be a cache miss
    console.log('First RSS feed fetch (expect cache miss):');
    const startTime1 = Date.now();
    const feed1 = await fetchRssFeed();
    const duration1 = Date.now() - startTime1;
    console.log(`- Feed fetched ${feed1 ? feed1.length : 0} items in ${duration1}ms`);
    
    // Show metrics after first run
    const firstRunMetrics = getCacheMetrics();
    console.log('Metrics after first run:', firstRunMetrics);
    
    // Second run - should be a cache hit and much faster
    console.log('\nSecond RSS feed fetch (expect cache hit):');
    const startTime2 = Date.now();
    const feed2 = await fetchRssFeed();
    const duration2 = Date.now() - startTime2;
    console.log(`- Feed fetched ${feed2 ? feed2.length : 0} items in ${duration2}ms`);
    
    // Show metrics after second run
    const secondRunMetrics = getCacheMetrics();
    console.log('Metrics after second run:', secondRunMetrics);
    
    // Verify that second run was faster
    const speedup = duration1 / Math.max(duration2, 1); // Avoid division by zero
    console.log(`\nSpeed improvement: ${speedup.toFixed(2)}x`);
    
    if (secondRunMetrics.hits > firstRunMetrics.hits && speedup > 1) {
      console.log('✅ RSS feed cache is working correctly');
    } else {
      console.log('❌ RSS feed cache is not working correctly');
    }
  } catch (error) {
    console.error('Error testing RSS feed cache:', error);
  }
}

/**
 * Test API endpoint cache
 */
async function testApiCache() {
  console.log('\nTesting API endpoint cache...');
  
  try {
    // Clear cache before testing
    clearCache();
    
    // First API call - should be a cache miss
    console.log('First API call (expect cache miss):');
    const startTime1 = Date.now();
    const response1 = await fetch('http://localhost:3000/api/events?limit=10');
    
    if (!response1.ok) {
      throw new Error(`API error: ${response1.status} ${response1.statusText}`);
    }
    
    const data1 = await response1.json();
    const duration1 = Date.now() - startTime1;
    
    const cacheHeader1 = response1.headers.get('x-cache') || 'NONE';
    console.log(`- API response received in ${duration1}ms (X-Cache: ${cacheHeader1})`);
    console.log(`- Received ${data1.events ? data1.events.length : 0} events`);
    
    // Second API call - should be a cache hit
    console.log('\nSecond API call (expect cache hit):');
    const startTime2 = Date.now();
    const response2 = await fetch('http://localhost:3000/api/events?limit=10');
    
    if (!response2.ok) {
      throw new Error(`API error: ${response2.status} ${response2.statusText}`);
    }
    
    const data2 = await response2.json();
    const duration2 = Date.now() - startTime2;
    
    const cacheHeader2 = response2.headers.get('x-cache') || 'NONE';
    console.log(`- API response received in ${duration2}ms (X-Cache: ${cacheHeader2})`);
    console.log(`- Received ${data2.events ? data2.events.length : 0} events`);
    
    // Verify that second call was faster and was a cache hit
    const speedup = duration1 / Math.max(duration2, 1); // Avoid division by zero
    console.log(`\nSpeed improvement: ${speedup.toFixed(2)}x`);
    
    if (cacheHeader2 === 'HIT' && speedup > 1) {
      console.log('✅ API endpoint cache is working correctly');
    } else {
      console.log('❌ API endpoint cache is not working correctly');
    }
  } catch (error) {
    console.error('Error testing API cache:', error);
  }
}

/**
 * Test cache metrics and monitoring
 */
async function testCacheMonitoring() {
  console.log('\nTesting cache monitoring...');
  
  try {
    // Get overall cache metrics
    const metrics = getAllCacheMetrics();
    
    console.log('Cache metrics:', JSON.stringify(metrics, null, 2));
    
    // Test cache purging
    console.log('\nTesting cache purging...');
    const purgedCount = purgeExpired();
    console.log(`Purged ${purgedCount} expired items`);
    
    console.log('✅ Cache monitoring is working');
  } catch (error) {
    console.error('Error testing cache monitoring:', error);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('Starting cache system tests...\n');
  
  try {
    // Test each cache type
    await testGeocodingCache();
    await testRssFeedCache();
    await testApiCache();
    await testCacheMonitoring();
    
    console.log('\nAll cache tests completed!');
  } catch (error) {
    console.error('Cache test error:', error);
  }
}

// Run all tests
runTests(); 