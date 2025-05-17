/**
 * Performance tests for the Geocoding Service
 */

import { geocodeLocation } from '../../lib/geocoding/nominatim.js';
import { batchGeocode } from '../../lib/geocoding/batch.js';
import { findLocation, findByExactName, findByFuzzyMatch } from '../../lib/geocoding/location-index.js';

// Sample locations for testing
const testLocations = [
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

// Test with some misspelled locations to test fuzzy matching
const misspelledLocations = [
  'Stokholm',  // Stockholm
  'Goteborg',  // Göteborg
  'Malmo',     // Malmö
  'Upsala',    // Uppsala
  'Vasteras',  // Västerås
];

describe('Geocoding Performance', () => {
  // Set longer timeout for performance tests
  jest.setTimeout(30000);
  
  test('should measure exact match performance', async () => {
    const startTime = Date.now();
    
    for (const location of testLocations) {
      const result = findByExactName(location.toLowerCase());
      // Just ensure we get a result, actual validation is in unit tests
      expect(result).not.toBeNull();
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Exact match performance: ${duration}ms for ${testLocations.length} locations (${duration / testLocations.length}ms per location)`);
    
    // Performance assertion - should be very fast (< 1ms per location)
    expect(duration / testLocations.length).toBeLessThan(1);
  });
  
  test('should measure fuzzy match performance', async () => {
    const startTime = Date.now();
    
    for (const location of misspelledLocations) {
      const results = findByFuzzyMatch(location, 2);
      // Just ensure we get results, actual validation is in unit tests
      expect(results.length).toBeGreaterThan(0);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Fuzzy match performance: ${duration}ms for ${misspelledLocations.length} locations (${duration / misspelledLocations.length}ms per location)`);
    
    // Performance assertion - should be reasonably fast (< 10ms per location)
    expect(duration / misspelledLocations.length).toBeLessThan(10);
  });
  
  test('should measure batch geocoding performance', async () => {
    const startTime = Date.now();
    
    const results = await batchGeocode(testLocations, {
      concurrency: 3,
      delayMs: 100
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Batch geocoding performance: ${duration}ms for ${testLocations.length} locations (${duration / testLocations.length}ms per location)`);
    
    // Success rate should be high
    const successCount = results.filter(r => r.success).length;
    const successRate = successCount / results.length;
    
    console.log(`Batch geocoding success rate: ${successRate * 100}%`);
    
    // Performance assertion - batch should be faster than sequential
    // This is a rough estimate and depends on concurrency settings
    expect(duration).toBeLessThan(testLocations.length * 200);
    
    // Success rate should be high
    expect(successRate).toBeGreaterThan(0.8);
  });
  
  test('should compare cached vs. uncached performance', async () => {
    // First run - uncached
    const startTimeUncached = Date.now();
    
    for (const location of testLocations.slice(0, 3)) {
      const result = await geocodeLocation(location);
      expect(result).not.toBeNull();
    }
    
    const durationUncached = Date.now() - startTimeUncached;
    console.log(`Uncached geocoding: ${durationUncached}ms for 3 locations (${durationUncached / 3}ms per location)`);
    
    // Second run - should be cached
    const startTimeCached = Date.now();
    
    for (const location of testLocations.slice(0, 3)) {
      const result = await geocodeLocation(location);
      expect(result).not.toBeNull();
    }
    
    const durationCached = Date.now() - startTimeCached;
    console.log(`Cached geocoding: ${durationCached}ms for 3 locations (${durationCached / 3}ms per location)`);
    
    // Cached should be significantly faster than uncached
    expect(durationCached).toBeLessThan(durationUncached * 0.5);
  });
}); 