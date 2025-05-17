/**
 * Unit tests for the Caching System
 */

import { 
  getCached, 
  setCached, 
  getCacheMetrics,
  clearCache 
} from '../../lib/cache/index.js';

import {
  getCachedGeocodingResult,
  cacheGeocodingResult,
  getGeocodingCacheMetrics,
  cacheFailedGeocodingResult,
  withGeocodingCache
} from '../../lib/cache/geocoding.js';

describe('Cache System', () => {
  beforeEach(() => {
    // Clear the cache before each test to ensure clean state
    clearCache();
  });
  
  describe('General cache', () => {
    test('should store and retrieve values', () => {
      // Store a value in the cache
      setCached('test-key', 'test-value', 1000);
      
      // Retrieve the value
      const value = getCached('test-key');
      
      // Verify value is retrieved correctly
      expect(value).toBe('test-value');
    });
    
    test('should respect TTL for cached values', async () => {
      // Store a value with a short TTL (10ms)
      setCached('short-ttl', 'test-value', 10);
      
      // Verify value exists initially
      expect(getCached('short-ttl')).toBe('test-value');
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Value should be gone now
      expect(getCached('short-ttl')).toBeNull();
    });
    
    test('should track cache metrics', () => {
      // Hit the cache a few times
      setCached('metrics-key', 'test-value', 1000);
      
      // First get is a hit
      getCached('metrics-key');
      getCached('metrics-key');
      
      // This one is a miss
      getCached('non-existent-key');
      
      // Get metrics and verify
      const metrics = getCacheMetrics();
      
      expect(metrics).toHaveProperty('hits');
      expect(metrics).toHaveProperty('misses');
      expect(metrics.hits['metrics-key']).toBe(2);
      expect(metrics.misses['non-existent-key']).toBe(1);
    });
  });
  
  describe('Geocoding cache', () => {
    test('should cache geocoding results', () => {
      // Mock geocoding result
      const mockResult = {
        lat: 59.32938,
        lon: 18.06871,
        display_name: 'Stockholm, Sweden'
      };
      
      // Cache the result
      cacheGeocodingResult('Stockholm', mockResult);
      
      // Retrieve the cached result
      const cachedResult = getCachedGeocodingResult('Stockholm');
      
      // Verify result is cached correctly
      expect(cachedResult).toEqual(mockResult);
      
      // Test case insensitivity and whitespace handling
      const normalizedResult = getCachedGeocodingResult('  stockholm  ');
      expect(normalizedResult).toEqual(mockResult);
    });
    
    test('should cache failed geocoding attempts', () => {
      // Cache a failed geocoding attempt
      cacheFailedGeocodingResult('NonExistentLocation');
      
      // Verify it's marked as failed
      const geocacheMetrics = getGeocodingCacheMetrics();
      expect(geocacheMetrics.failedCount).toBeGreaterThan(0);
    });
    
    test('should wrap geocoding function with cache', async () => {
      // Create a mock geocoding function
      const mockGeocodeFn = jest.fn().mockImplementation(async (location) => {
        if (location === 'Stockholm') {
          return { lat: 59.32938, lon: 18.06871 };
        }
        return null;
      });
      
      // Wrap it with cache
      const cachedGeocodeFn = withGeocodingCache(mockGeocodeFn);
      
      // First call should use the original function
      const result1 = await cachedGeocodeFn('Stockholm');
      expect(result1).toEqual({ lat: 59.32938, lon: 18.06871 });
      expect(mockGeocodeFn).toHaveBeenCalledTimes(1);
      
      // Second call should use the cache
      const result2 = await cachedGeocodeFn('Stockholm');
      expect(result2).toEqual({ lat: 59.32938, lon: 18.06871 });
      expect(mockGeocodeFn).toHaveBeenCalledTimes(1); // Still only called once
      
      // Call with a new location should use the function again
      await cachedGeocodeFn('Göteborg');
      expect(mockGeocodeFn).toHaveBeenCalledTimes(2);
    });
  });
}); 