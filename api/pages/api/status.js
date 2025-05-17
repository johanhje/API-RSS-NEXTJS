/**
 * API Status Endpoint
 * 
 * Returns basic system status information
 */

import { getCacheMetrics } from '../../lib/cache/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLocationIndexStats } from '../../lib/geocoding/location-index.js';

// Importera package.json via fs istället för import assert
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgPath = path.join(__dirname, '../../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

/**
 * API Status Handler
 * Returns information about the API status
 */
export default function handler(req, res) {
  // Get cache stats
  const cacheMetrics = getCacheMetrics();
  
  // Get location index stats if available
  let locationStats = {};
  try {
    locationStats = getLocationIndexStats() || {};
  } catch (error) {
    locationStats = { error: 'Location index not initialized' };
  }
  
  // Build response
  const status = {
    status: 'ok',
    version: pkg.version,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    cache: {
      size: cacheMetrics.size,
      hits: cacheMetrics.totalHits,
      misses: cacheMetrics.totalMisses,
      hitRate: cacheMetrics.hitRate
    },
    locationIndex: locationStats
  };
  
  // Send response
  res.status(200).json(status);
} 