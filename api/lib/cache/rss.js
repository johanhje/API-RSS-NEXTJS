/**
 * RSS Feed Cache Module
 * 
 * Specialized caching functionality for RSS feed data
 */

import { getCached, setCached, deleteCached, getCacheMetrics } from './index.js';

// Cache TTL for RSS data (15 minutes in milliseconds)
const RSS_CACHE_TTL = 15 * 60 * 1000;

// Prefix for RSS cache keys to avoid conflicts
const CACHE_PREFIX = 'rss:';

/**
 * Get cached RSS feed data
 * 
 * @param {string} feedUrl - URL of the RSS feed
 * @returns {object|null} - Cached RSS feed data or null if not in cache/expired
 */
export function getCachedRssFeed(feedUrl) {
  if (!feedUrl) return null;
  
  // Create a cache key from the feed URL
  const cacheKey = `${CACHE_PREFIX}${feedUrl}`;
  
  return getCached(cacheKey, RSS_CACHE_TTL);
}

/**
 * Cache RSS feed data
 * 
 * @param {string} feedUrl - URL of the RSS feed
 * @param {object} feedData - RSS feed data to cache
 * @param {number} [ttlMs=RSS_CACHE_TTL] - Optional custom TTL
 */
export function cacheRssFeed(feedUrl, feedData, ttlMs = RSS_CACHE_TTL) {
  if (!feedUrl || !feedData) return;
  
  // Create a cache key from the feed URL
  const cacheKey = `${CACHE_PREFIX}${feedUrl}`;
  
  // Add timestamp for cache freshness tracking
  const dataWithMeta = {
    ...feedData,
    _cached: {
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs
    }
  };
  
  setCached(cacheKey, dataWithMeta, ttlMs);
}

/**
 * Invalidate RSS feed cache
 * 
 * @param {string} feedUrl - URL of the RSS feed to invalidate
 * @returns {boolean} - Whether the cache was found and invalidated
 */
export function invalidateRssFeedCache(feedUrl) {
  if (!feedUrl) return false;
  
  // Create a cache key from the feed URL
  const cacheKey = `${CACHE_PREFIX}${feedUrl}`;
  
  return deleteCached(cacheKey);
}

/**
 * Check if cached RSS feed data is fresh (recently cached)
 * 
 * @param {string} feedUrl - URL of the RSS feed
 * @param {number} maxAgeMs - Maximum age in milliseconds to consider fresh
 * @returns {boolean} - Whether the cache exists and is fresh
 */
export function isRssFeedCacheFresh(feedUrl, maxAgeMs = RSS_CACHE_TTL) {
  const cachedData = getCachedRssFeed(feedUrl);
  
  if (!cachedData || !cachedData._cached || !cachedData._cached.timestamp) {
    return false;
  }
  
  const now = Date.now();
  const cacheAge = now - cachedData._cached.timestamp;
  
  return cacheAge < maxAgeMs;
}

/**
 * Get RSS cache metrics
 * 
 * @returns {object} - Metrics for RSS cache
 */
export function getRssCacheMetrics() {
  const metrics = getCacheMetrics();
  
  return {
    ...metrics,
    cacheType: 'rss'
  };
}

/**
 * Higher-order function that adds caching to an RSS feed fetcher
 * 
 * @param {Function} fetchFunction - Original RSS feed fetch function
 * @param {boolean} allowStale - Whether to return stale data while refreshing
 * @returns {Function} - Wrapped function with caching
 */
export function withRssCache(fetchFunction, allowStale = true) {
  return async (feedUrl, forceFresh = false) => {
    if (!feedUrl) return null;
    
    // If not forcing a fresh fetch, check cache first
    if (!forceFresh) {
      const cachedFeed = getCachedRssFeed(feedUrl);
      
      if (cachedFeed) {
        // If stale data is allowed or cache is fresh, return it immediately
        if (allowStale || isRssFeedCacheFresh(feedUrl)) {
          return cachedFeed;
        }
        
        // Cache exists but is stale and we don't want stale data
        // We'll continue to fetch fresh data
      }
    }
    
    // Fetch fresh data
    try {
      const freshData = await fetchFunction(feedUrl);
      
      // Cache the fresh data if valid
      if (freshData) {
        cacheRssFeed(feedUrl, freshData);
      }
      
      return freshData;
    } catch (error) {
      // If fetching fails and stale data is allowed, return stale cache as fallback
      if (allowStale && !forceFresh) {
        const cachedFeed = getCachedRssFeed(feedUrl);
        
        if (cachedFeed) {
          console.warn(`Failed to fetch fresh RSS data, using stale cache for: ${feedUrl}`);
          return cachedFeed;
        }
      }
      
      // No cache or stale data not allowed, propagate the error
      throw error;
    }
  };
} 