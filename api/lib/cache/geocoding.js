/**
 * Geocoding Cache Module
 * 
 * Specialized caching functionality for geocoding results
 * with enhanced performance and tiered caching strategy
 */

import { getCached, setCached, getCacheMetrics } from './index.js';

// Cache TTL for successful geocoding results (30 days in milliseconds)
// Geocoding results rarely change, so we can use a longer TTL
const GEOCODING_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

// Cache TTL for failed geocoding attempts (1 day in milliseconds)
// We don't want to cache failures for too long as new locations might be added
const FAILED_GEOCODING_CACHE_TTL = 24 * 60 * 60 * 1000;

// Cache TTL for normalized location name mappings (90 days)
// These mappings almost never change
const NORMALIZED_NAME_CACHE_TTL = 90 * 24 * 60 * 60 * 1000;

// Prefix for geocoding cache keys to avoid conflicts
const CACHE_PREFIX = 'geocoding:';
const FAILED_PREFIX = 'geocoding:failed:';
const NORMALIZED_PREFIX = 'geocoding:normalized:';

/**
 * Get cached geocoding result for a location
 * 
 * @param {string} locationName - Location name to lookup
 * @returns {object|null} - Geocoding result or null if not in cache
 */
export function getCachedGeocodingResult(locationName) {
  if (!locationName) return null;
  
  // Normalize location name (lowercase, trim whitespace)
  const normalizedLocation = locationName.toLowerCase().trim();
  
  // Check if we have a cached entry for this location
  return getCached(`${CACHE_PREFIX}${normalizedLocation}`, GEOCODING_CACHE_TTL);
}

/**
 * Get cached failed attempt for a location
 * 
 * @param {string} locationName - Location name to lookup
 * @returns {boolean} - True if we previously failed to geocode this location
 */
export function getCachedFailedResult(locationName) {
  if (!locationName) return false;
  
  // Normalize location name (lowercase, trim whitespace)
  const normalizedLocation = locationName.toLowerCase().trim();
  
  // Check if we have a cached failed attempt for this location
  return !!getCached(`${FAILED_PREFIX}${normalizedLocation}`, FAILED_GEOCODING_CACHE_TTL);
}

/**
 * Get cached normalized name mapping
 * 
 * @param {string} locationName - Original location name
 * @returns {string|null} - Normalized name or null if not in cache
 */
export function getCachedNormalizedName(locationName) {
  if (!locationName) return null;
  
  // Lowercase and trim but preserve other characteristics
  const simpleNormalized = locationName.toLowerCase().trim();
  
  return getCached(`${NORMALIZED_PREFIX}${simpleNormalized}`, NORMALIZED_NAME_CACHE_TTL);
}

/**
 * Cache geocoding result for a location
 * 
 * @param {string} locationName - Location name
 * @param {object} result - Geocoding result with lat/lon
 * @param {number} [ttlMs=GEOCODING_CACHE_TTL] - Optional custom TTL
 */
export function cacheGeocodingResult(locationName, result, ttlMs = GEOCODING_CACHE_TTL) {
  if (!locationName || !result) return;
  
  // Normalize location name (lowercase, trim whitespace)
  const normalizedLocation = locationName.toLowerCase().trim();
  
  // Store in cache with the prefix
  setCached(`${CACHE_PREFIX}${normalizedLocation}`, result, ttlMs);
}

/**
 * Cache a failed geocoding attempt
 * 
 * @param {string} locationName - Location name
 * @param {number} [ttlMs=FAILED_GEOCODING_CACHE_TTL] - Optional custom TTL
 */
export function cacheFailedGeocodingResult(locationName, ttlMs = FAILED_GEOCODING_CACHE_TTL) {
  if (!locationName) return;
  
  // Normalize location name (lowercase, trim whitespace)
  const normalizedLocation = locationName.toLowerCase().trim();
  
  // Store in cache with the prefix - value is just a timestamp of failure
  setCached(`${FAILED_PREFIX}${normalizedLocation}`, Date.now(), ttlMs);
}

/**
 * Cache a normalized name mapping
 * 
 * @param {string} originalName - Original location name
 * @param {string} normalizedName - Normalized location name
 * @param {number} [ttlMs=NORMALIZED_NAME_CACHE_TTL] - Optional custom TTL
 */
export function cacheNormalizedName(originalName, normalizedName, ttlMs = NORMALIZED_NAME_CACHE_TTL) {
  if (!originalName || !normalizedName) return;
  
  // Simple normalization for the key
  const simpleNormalized = originalName.toLowerCase().trim();
  
  // Store the more complex normalization result
  setCached(`${NORMALIZED_PREFIX}${simpleNormalized}`, normalizedName, ttlMs);
}

/**
 * Get geocoding cache metrics
 * 
 * @returns {object} - Metrics for geocoding cache
 */
export function getGeocodingCacheMetrics() {
  const metrics = getCacheMetrics();
  
  // Filter metrics to get only geocoding-related entries
  const geocodingKeys = Object.keys(metrics.keys).filter(key => 
    key.startsWith(CACHE_PREFIX) || 
    key.startsWith(FAILED_PREFIX) || 
    key.startsWith(NORMALIZED_PREFIX)
  );
  
  const geocodingHits = geocodingKeys.reduce((sum, key) => sum + (metrics.hits[key] || 0), 0);
  const geocodingMisses = geocodingKeys.reduce((sum, key) => sum + (metrics.misses[key] || 0), 0);
  
  return {
    ...metrics,
    cacheType: 'geocoding',
    geocodingKeys: geocodingKeys.length,
    geocodingHits,
    geocodingMisses,
    successCount: Object.keys(metrics.keys).filter(key => key.startsWith(CACHE_PREFIX)).length,
    failedCount: Object.keys(metrics.keys).filter(key => key.startsWith(FAILED_PREFIX)).length,
    normalizedCount: Object.keys(metrics.keys).filter(key => key.startsWith(NORMALIZED_PREFIX)).length
  };
}

/**
 * Higher-order function that adds caching to a geocoding function
 * with multi-tier caching strategy
 * 
 * @param {Function} geocodeFunction - Original geocoding function
 * @returns {Function} - Wrapped function with caching
 */
export function withGeocodingCache(geocodeFunction) {
  return async (locationName) => {
    if (!locationName) return null;
    
    // Try to get from cache first
    const cachedResult = getCachedGeocodingResult(locationName);
    if (cachedResult) {
      return cachedResult;
    }
    
    // Check if we previously failed to geocode this location
    // This prevents repeatedly trying locations we know will fail
    if (getCachedFailedResult(locationName)) {
      return null;
    }
    
    // Check if we have a cached normalized name, which might have better cache hit rate
    const normalizedName = getCachedNormalizedName(locationName);
    if (normalizedName && normalizedName !== locationName) {
      const normalizedCachedResult = getCachedGeocodingResult(normalizedName);
      if (normalizedCachedResult) {
        // Also cache under the original name to speed up future lookups
        cacheGeocodingResult(locationName, normalizedCachedResult);
        return normalizedCachedResult;
      }
    }
    
    // Not in cache, call the original function
    try {
      const result = await geocodeFunction(locationName);
      
      // Cache the result if we got coordinates
      if (result && result.lat && result.lon) {
        cacheGeocodingResult(locationName, result);
        
        // If the original and normalized names differ, store the mapping
        if (normalizedName && normalizedName !== locationName) {
          cacheGeocodingResult(normalizedName, result);
        }
        
        return result;
      } else {
        // Cache the failed attempt
        cacheFailedGeocodingResult(locationName);
        return null;
      }
    } catch (error) {
      console.error(`Error geocoding location "${locationName}":`, error.message);
      // Cache the failed attempt on error
      cacheFailedGeocodingResult(locationName);
      return null;
    }
  };
}

// Export a standalone function for normalizing location names
// with cache support for efficient reuse
export async function normalizeLocationNameCached(locationName, normalizationFunction) {
  if (!locationName) return '';
  
  // Simple normalization (lowercase, trim)
  const simpleNormalized = locationName.toLowerCase().trim();
  
  // Try to get from cache first
  const cachedNormalized = getCachedNormalizedName(simpleNormalized);
  if (cachedNormalized) {
    return cachedNormalized;
  }
  
  // Not in cache, call the normalization function
  const normalized = normalizationFunction(locationName);
  
  // Cache the result if it's different from the simple normalization
  if (normalized !== simpleNormalized) {
    cacheNormalizedName(simpleNormalized, normalized);
  }
  
  return normalized;
} 