/**
 * Geocoding Performance Benchmark Script
 * 
 * This script benchmarks the performance of both the original and 
 * optimized geocoding implementations to demonstrate improvements.
 */

import { geocodeLocation } from '../lib/geocoding/nominatim.js';
import { batchGeocode } from '../lib/geocoding/batch.js';
import { getDatabase } from '../lib/db/database.js';
import fs from 'fs';
import path from 'path';

// Number of locations to test
const TEST_SIZE = 100;

// Sample locations from each source for comprehensive testing
async function getSampleLocations() {
  const db = getDatabase();
  
  // Get unique location names from the events database
  const eventLocations = db.prepare(`
    SELECT DISTINCT location_name 
    FROM events 
    WHERE location_name IS NOT NULL
    ORDER BY RANDOM()
    LIMIT ${TEST_SIZE}
  `).all();
  
  return eventLocations.map(row => row.location_name);
}

// Test geocoding performance for a single location
async function testSingleGeocodingPerformance(locations) {
  console.log(`\nTesting single location geocoding (${locations.length} locations)...`);
  
  const startTime = Date.now();
  let successCount = 0;
  
  for (const location of locations) {
    // Clear cache first to ensure fair comparison
    global.cache?.clear?.();
    
    const start = Date.now();
    const result = await geocodeLocation(location);
    const elapsed = Date.now() - start;
    
    if (result && result.lat && result.lon) {
      successCount++;
    }
    
    process.stdout.write('.');
  }
  
  const totalTime = Date.now() - startTime;
  console.log('\nResults:');
  console.log(`Total time: ${totalTime}ms`);
  console.log(`Average time per location: ${Math.round(totalTime / locations.length)}ms`);
  console.log(`Success rate: ${Math.round(successCount / locations.length * 100)}%`);
  
  return {
    totalTime,
    avgTime: Math.round(totalTime / locations.length),
    successRate: successCount / locations.length
  };
}

// Test batch geocoding performance
async function testBatchGeocodingPerformance(locations) {
  console.log(`\nTesting batch geocoding (${locations.length} locations)...`);
  
  // Clear cache first to ensure fair comparison
  global.cache?.clear?.();
  
  const startTime = Date.now();
  const results = await batchGeocode(locations, {
    concurrency: 5,
    delayMs: 100
  });
  const totalTime = Date.now() - startTime;
  
  const successCount = results.filter(r => r.success).length;
  
  console.log('Results:');
  console.log(`Total time: ${totalTime}ms`);
  console.log(`Average time per location: ${Math.round(totalTime / locations.length)}ms`);
  console.log(`Success rate: ${Math.round(successCount / locations.length * 100)}%`);
  
  return {
    totalTime,
    avgTime: Math.round(totalTime / locations.length),
    successRate: successCount / locations.length
  };
}

// Test cached geocoding performance (second run should be faster)
async function testCachedGeocodingPerformance(locations) {
  console.log(`\nTesting cached geocoding (${locations.length} locations)...`);
  
  // Run once to populate cache
  for (const location of locations.slice(0, 10)) {
    await geocodeLocation(location);
  }
  
  const startTime = Date.now();
  let successCount = 0;
  let cacheHits = 0;
  
  for (const location of locations) {
    const start = Date.now();
    const result = await geocodeLocation(location);
    const elapsed = Date.now() - start;
    
    if (result && result.lat && result.lon) {
      successCount++;
    }
    
    // Assume it's a cache hit if it took less than 5ms
    if (elapsed < 5) {
      cacheHits++;
    }
    
    process.stdout.write('.');
  }
  
  const totalTime = Date.now() - startTime;
  console.log('\nResults:');
  console.log(`Total time: ${totalTime}ms`);
  console.log(`Average time per location: ${Math.round(totalTime / locations.length)}ms`);
  console.log(`Success rate: ${Math.round(successCount / locations.length * 100)}%`);
  console.log(`Cache hit rate: ${Math.round(cacheHits / locations.length * 100)}%`);
  
  return {
    totalTime,
    avgTime: Math.round(totalTime / locations.length),
    successRate: successCount / locations.length,
    cacheHitRate: cacheHits / locations.length
  };
}

// Save benchmark results to JSON file
function saveResults(results) {
  const resultsDir = path.join(process.cwd(), 'scripts/benchmark-results');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filePath = path.join(resultsDir, `geocoding-benchmark-${timestamp}.json`);
  
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${filePath}`);
}

// Main benchmark function
async function runBenchmark() {
  console.log('Starting geocoding performance benchmark...');
  
  try {
    // Get sample locations to test
    const locations = await getSampleLocations();
    console.log(`Testing with ${locations.length} unique locations.`);
    
    // Run benchmarks
    const singleResults = await testSingleGeocodingPerformance(locations);
    const batchResults = await testBatchGeocodingPerformance(locations);
    const cachedResults = await testCachedGeocodingPerformance(locations);
    
    // Calculate improvements
    const singleToBatchImprovement = Math.round((1 - batchResults.avgTime / singleResults.avgTime) * 100);
    const singleToCachedImprovement = Math.round((1 - cachedResults.avgTime / singleResults.avgTime) * 100);
    
    console.log('\nPerformance Improvements:');
    console.log(`Batch vs. Single: ${singleToBatchImprovement}% faster`);
    console.log(`Cached vs. Single: ${singleToCachedImprovement}% faster`);
    
    // Combine all results
    const results = {
      timestamp: new Date().toISOString(),
      testSize: locations.length,
      single: singleResults,
      batch: batchResults,
      cached: cachedResults,
      improvements: {
        batchOverSingle: singleToBatchImprovement,
        cachedOverSingle: singleToCachedImprovement
      }
    };
    
    // Save results to file
    saveResults(results);
    
    console.log('\nBenchmark completed successfully!');
  } catch (error) {
    console.error('Benchmark error:', error);
  }
}

// Run the benchmark
runBenchmark(); 