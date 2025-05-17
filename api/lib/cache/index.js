/**
 * Cache Module
 * 
 * Provides in-memory caching functionality with TTL (Time To Live) support
 * and cache monitoring capabilities.
 */

// In-memory cache store
const cache = new Map();

// Cache metrics
const metrics = {
  hits: {},
  misses: {},
  sets: 0,
  deletes: 0,
  expirations: 0
};

/**
 * Get a value from the cache
 * 
 * @param {string} key - Cache key
 * @param {number} [ttlMs=60000] - Time to live in milliseconds (for metrics only)
 * @returns {any|null} - Cached value or null if not found/expired
 */
function getCached(key, ttlMs = 60000) {
  if (!cache.has(key)) {
    // Spåra missar per nyckel
    metrics.misses[key] = (metrics.misses[key] || 0) + 1;
    return null;
  }

  const { value, expires } = cache.get(key);
  
  // Check if value has expired
  if (Date.now() > expires) {
    cache.delete(key);
    metrics.expirations++;
    // Spåra missar per nyckel
    metrics.misses[key] = (metrics.misses[key] || 0) + 1;
    return null;
  }

  // Cache hit - spåra träffar per nyckel
  metrics.hits[key] = (metrics.hits[key] || 0) + 1;
  return value;
}

/**
 * Set a value in the cache with an expiration time
 * 
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} [ttlMs=60000] - Time to live in milliseconds
 */
function setCached(key, value, ttlMs = 60000) {
  // Don't cache null or undefined values
  if (value === null || value === undefined) {
    return;
  }
  
  cache.set(key, {
    value,
    expires: Date.now() + ttlMs
  });
  
  metrics.sets++;
  
  // Log cache operation in debug mode
  console.debug(`Cache SET: ${key} (expires in ${ttlMs/1000}s), cache size: ${cache.size}`);
}

/**
 * Delete a specific value from the cache
 * 
 * @param {string} key - Cache key to delete
 * @returns {boolean} - Whether the key was found and deleted
 */
function deleteCached(key) {
  const result = cache.delete(key);
  if (result) {
    metrics.deletes++;
  }
  return result;
}

/**
 * Clear all values from the cache
 */
function clearCache() {
  const size = cache.size;
  cache.clear();
  console.debug(`Cache cleared (${size} items)`);
}

/**
 * Delete all expired items from the cache
 * 
 * @returns {number} - Number of expired items deleted
 */
function purgeExpired() {
  let count = 0;
  const now = Date.now();
  
  for (const [key, { expires }] of cache.entries()) {
    if (now > expires) {
      cache.delete(key);
      count++;
      metrics.expirations++;
    }
  }
  
  return count;
}

/**
 * Get cache metrics
 * 
 * @returns {Object} - Cache performance metrics
 */
function getCacheMetrics() {
  // Räkna totala träffar och missar
  const totalHits = Object.values(metrics.hits).reduce((sum, count) => sum + count, 0);
  const totalMisses = Object.values(metrics.misses).reduce((sum, count) => sum + count, 0);
  const total = totalHits + totalMisses;
  const hitRate = total > 0 ? (totalHits / total) * 100 : 0;
  
  return {
    hits: metrics.hits,
    misses: metrics.misses,
    totalHits,
    totalMisses,
    sets: metrics.sets,
    deletes: metrics.deletes,
    expirations: metrics.expirations,
    total,
    hitRate: `${hitRate.toFixed(2)}%`,
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}

/**
 * Reset cache metrics
 */
function resetMetrics() {
  metrics.hits = {};
  metrics.misses = {};
  metrics.sets = 0;
  metrics.deletes = 0;
  metrics.expirations = 0;
}

// Export all functions
export {
  getCached,
  setCached,
  deleteCached,
  clearCache,
  purgeExpired,
  getCacheMetrics,
  resetMetrics
}; 