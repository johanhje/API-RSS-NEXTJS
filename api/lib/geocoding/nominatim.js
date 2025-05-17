/**
 * OpenStreetMap Nominatim geocoding service with optimized performance
 */

import fetch from 'node-fetch';
import { NOMINATIM_BASE_URL, NOMINATIM_USER_AGENT } from '../config.js';
import { EXPANDED_LOCATION_DATABASE } from './expanded-location-database.js';
import { 
  getCachedGeocodingResult, 
  cacheGeocodingResult, 
  cacheFailedGeocodingResult,
  normalizeLocationNameCached, 
  withGeocodingCache 
} from '../cache/geocoding.js';
import { 
  findLocation, 
  findByExactName, 
  findByPrefix, 
  findByFuzzyMatch 
} from './location-index.js';

// Logger for detailed geocoding analytics
const logger = {
  debug: (...args) => console.debug('[Geocoder]', ...args),
  info: (...args) => console.log('[Geocoder]', ...args),
  warn: (...args) => console.warn('[Geocoder]', ...args),
  error: (...args) => console.error('[Geocoder]', ...args)
};

// Use the expanded location database for better coverage
const LOCATION_DATABASE = EXPANDED_LOCATION_DATABASE;

// Pre-defined coordinates for common Swedish locations that might be difficult to geocode
// NOTE: This is now supplemented by the comprehensive LOCATION_DATABASE imported above
const EXTRA_LOCATIONS = {
  // These special cases might still be useful, but most are now in the main database
};

// Region mappings (counties to coordinates)
const COUNTY_LOCATIONS = {
  'stockholms län': { lat: 59.32938, lon: 18.06871 },
  'västra götalands län': { lat: 57.70887, lon: 11.97456 },
  'skåne län': { lat: 55.60587, lon: 13.00073 },
  'östergötlands län': { lat: 58.41086, lon: 15.62157 },
  'jönköpings län': { lat: 57.78145, lon: 14.15618 },
  'uppsala län': { lat: 59.85882, lon: 17.63889 },
  'västmanlands län': { lat: 59.61617, lon: 16.55276 },
  'örebro län': { lat: 59.27412, lon: 15.2066 },
  'södermanlands län': { lat: 59.19554, lon: 17.62525 },
  'gävleborgs län': { lat: 60.67452, lon: 17.14174 },
  'värmlands län': { lat: 59.4022, lon: 13.51149 },
  'kronobergs län': { lat: 56.87767, lon: 14.80906 },
  'dalarnas län': { lat: 60.60357, lon: 15.62597 },
  'hallands län': { lat: 56.67446, lon: 12.85676 },
  'kalmar län': { lat: 56.66157, lon: 16.36163 },
  'västernorrlands län': { lat: 62.39129, lon: 17.3063 },
  'västerbottens län': { lat: 64.75067, lon: 20.95279 },
  'norrbottens län': { lat: 65.58415, lon: 22.15465 },
  'jämtlands län': { lat: 63.17824, lon: 14.63566 },
  'blekinge län': { lat: 56.16156, lon: 15.58661 },
  'gotlands län': { lat: 57.6348, lon: 18.29439 }
};

/**
 * Normalizes a location name for consistent lookup
 * Handles various edge cases and spelling variations
 * 
 * @param {string} locationName - The location name to normalize
 * @returns {string} - The normalized location name
 */
export function normalizeLocationName(locationName) {
  if (!locationName) return '';
  
  // Handle special case for "i X" or "på X" constructions often found in police reports
  const prefixMatch = locationName.match(/^(i|på|i närheten av|vid|nära)\s+(.+)$/i);
  if (prefixMatch) {
    locationName = prefixMatch[2];
  }
  
  // Convert to lowercase for case-insensitive comparison
  let normalized = locationName.toLowerCase();
  
  // Remove common suffixes
  normalized = normalized.replace(/\s+(kommun|län|stad|region|landskap)$/, '');
  
  // Handle police report specific prefixes
  normalized = normalized.replace(/^(trafikolycka|misshandel|bedrägeri|stöld|brand|knivlagen|rån|inbrott),?\s+/i, '');
  
  // Normalize hyphens and whitespace
  normalized = normalized.replace(/[\s\-–—]+/g, ' ').trim();
  
  // Handle common spelling variations (å, ä, ö)
  normalized = normalized
    .replace(/vaexjoe/g, 'växjö')
    .replace(/vaeckelsaang/g, 'väckelsång')
    .replace(/goeteborg/g, 'göteborg')
    .replace(/malmoe/g, 'malmö')
    .replace(/oerebro/g, 'örebro')
    .replace(/aengelholm/g, 'ängelholm')
    .replace(/gaevle/g, 'gävle');
  
  // Handle special cases for multi-part location names
  if (normalized.includes('-')) {
    const hyphenatedVariation = normalized
      .split('-')
      .map(part => part.trim())
      .join(' ');
    
    // If hyphenated version exists in database, use that
    if (findByExactName(hyphenatedVariation)) {
      return hyphenatedVariation;
    }
  }
  
  return normalized;
}

/**
 * Check if we have pre-defined coordinates for a location using
 * the optimized location index
 * 
 * @param {string} normalizedLocation - Normalized location name
 * @returns {{lat: number, lon: number}|null} - Coordinates or null
 */
function getKnownLocation(normalizedLocation) {
  if (!normalizedLocation) return null;
  
  // First try direct lookup using our optimized index
  const locationMatch = findLocation(normalizedLocation, {
    fuzzyThreshold: 2,
    tryFuzzy: true,
    tryPrefix: true
  });
  
  if (locationMatch) {
    return { lat: locationMatch.lat, lon: locationMatch.lon };
  }
  
  // Next check county matches
  if (COUNTY_LOCATIONS[normalizedLocation]) {
    return COUNTY_LOCATIONS[normalizedLocation];
  }
  
  // No matches found in any of our indexes
  return null;
}

/**
 * Extract city name from a location string with various formats
 * @param {string} locationName - Original location name
 * @returns {string|null} - City name or null
 */
export function extractLocation(locationName) {
  if (!locationName) return null;
  
  // Handle multi-part location strings (e.g., "Trafikolycka, personskada, Enköping")
  const parts = locationName.split(',');
  
  if (parts.length > 2) {
    // For strings with more than 2 parts, assume the last part is the location
    return parts[parts.length - 1].trim();
  } else if (parts.length === 2) {
    // For strings with 2 parts, assume the second part is the location
    return parts[1].trim();
  }
  
  // For strings without commas, try to extract location using progressive methods
  
  // Try to extract location using optimized fuzzy search
  const normalized = normalizeLocationName(locationName);
  const fuzzyMatches = findByFuzzyMatch(normalized, 2, 1);
  
  if (fuzzyMatches.length > 0) {
    return fuzzyMatches[0].name;
  }
  
  // Extract locations mentioned at the end of the string (common in police reports)
  const endLocationMatch = locationName.match(/\s+(\w+)$/);
  if (endLocationMatch && findByExactName(endLocationMatch[1])) {
    return endLocationMatch[1];
  }
  
  return null;
}

/**
 * Raw geocoding function that does the actual work
 * Uses progressive optimization techniques:
 * 1. First try optimized index lookups (O(1) operations)
 * 2. Then try fuzzy/prefix matching
 * 3. Finally fall back to Nominatim API
 * 
 * @param {string} locationName - The location to geocode
 * @returns {Promise<{lat: number, lon: number}|null>} - The coordinates or null if not found
 */
async function geocodeLocationRaw(locationName) {
  if (!locationName) return null;
  
  // Use normalized location name
  const normalizedName = await normalizeLocationNameCached(locationName, normalizeLocationName);
  
  // Log the original and normalized names for debugging
  logger.debug(`Geocoding "${locationName}" → "${normalizedName}"`);
  
  // Try to find in our optimized location index
  const knownLocation = getKnownLocation(normalizedName);
  if (knownLocation) {
    logger.debug(`Found "${normalizedName}" in location index`);
    return knownLocation;
  }
  
  // Try to extract more specific location parts
  const parts = normalizedName.split(/,|\sin\s/);
  if (parts.length > 1) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i].trim();
      const partMatch = getKnownLocation(part);
      if (partMatch) {
        logger.debug(`Found part "${part}" in location index`);
        return partMatch;
      }
    }
  }
  
  // Fall back to Nominatim API for locations not in our database
  try {
    logger.debug(`Falling back to Nominatim API for "${normalizedName}"`);
    const encodedName = encodeURIComponent(`${normalizedName}, Sweden`);
    
    // Use optimized parameters for Nominatim API
    const url = `${NOMINATIM_BASE_URL}/search?q=${encodedName}&format=json&limit=1&countrycodes=se&accept-language=sv`;
    
    const response = await fetch(url, {
      headers: { 
        'User-Agent': NOMINATIM_USER_AGENT,
        'Accept-Language': 'sv,en' // Prioritize Swedish results
      },
      timeout: 5000 // 5 second timeout to avoid hanging
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      logger.debug(`Found "${normalizedName}" via Nominatim API`);
      return { lat: parseFloat(lat), lon: parseFloat(lon) };
    }
    
    logger.debug(`No results from Nominatim API for "${normalizedName}"`);
    return null;
  } catch (error) {
    logger.error(`Error geocoding location "${locationName}":`, error.message);
    return null;
  }
}

// Create properly wrapped geocoding function with caching
const geocodeLocationWithCache = withGeocodingCache(geocodeLocationRaw);

/**
 * Geocode a location to get coordinates
 * 
 * @param {string} locationName - The location to geocode
 * @returns {Promise<{lat: number, lon: number}|null>} - The coordinates or null if not found
 */
export async function geocodeLocation(locationName) {
  return await geocodeLocationWithCache(locationName);
}

/**
 * Convert coordinates to a formatted string
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {string} - Formatted coordinates
 */
export function formatCoordinates(lat, lon) {
  if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
    return null;
  }
  
  return `${lat.toFixed(5)},${lon.toFixed(5)}`;
}

/**
 * Parse coordinates from formatted string
 * @param {string} coordsString - Formatted coordinates string (lat,lon)
 * @returns {{lat: number, lon: number}|null} - Parsed coordinates or null
 */
export function parseCoordinates(coordsString) {
  if (!coordsString) {
    return { lat: null, lon: null };
  }
  
  const parts = coordsString.split(',');
  if (parts.length !== 2) {
    return { lat: null, lon: null };
  }
  
  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);
  
  if (isNaN(lat) || isNaN(lon)) {
    return { lat: null, lon: null };
  }
  
  return { lat, lon };
} 