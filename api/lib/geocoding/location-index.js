/**
 * Optimized Location Index for Swedish Geocoding
 * 
 * This module provides fast, efficient lookups for Swedish locations using
 * multiple indexing strategies:
 * 1. Exact name matching using Map (O(1) lookup)
 * 2. Prefix-based search (for autocomplete and partial matches)
 * 3. County-based organization (for regional searches)
 * 4. Fuzzy matching for handling typos and spelling variations
 */

import { EXPANDED_LOCATION_DATABASE } from './expanded-location-database.js';

// Default length for prefix indexing
const DEFAULT_PREFIX_LENGTH = 3;

// Default levenshtein distance threshold for fuzzy matching
const DEFAULT_FUZZY_THRESHOLD = 2;

// Create indexes for fast lookups
const locationIndex = {
  // Exact match using Map for O(1) lookups
  byName: new Map(),
  
  // Prefix lookup for partial matches
  byPrefix: {}, 
  
  // County lookup for regional searches
  byCounty: {},
  
  // Original data array for fallback and filtering
  allLocations: []
};

/**
 * Build location indexes from the expanded location database
 * @param {Object} source - Source location database, defaults to EXPANDED_LOCATION_DATABASE
 * @param {number} prefixLength - Length of prefixes to use for indexing
 */
export function buildLocationIndex(source = EXPANDED_LOCATION_DATABASE, prefixLength = DEFAULT_PREFIX_LENGTH) {
  console.log(`Building location index with prefix length ${prefixLength}...`);
  
  // Convert source object to array for processing
  const locations = Object.entries(source).map(([name, data]) => {
    return {
      name,
      ...data
    };
  });
  
  // Store all locations
  locationIndex.allLocations = locations;
  
  // Process each location for indexing
  locations.forEach(location => {
    const { name } = location;
    const lowerName = name.toLowerCase();
    
    // Index by exact name (case insensitive)
    locationIndex.byName.set(lowerName, location);
    
    // Create prefix entries (for autocomplete/partial matching)
    // Using sliding window approach for more comprehensive prefix matching
    for (let i = 1; i <= Math.min(lowerName.length, prefixLength); i++) {
      const prefix = lowerName.substring(0, i);
      locationIndex.byPrefix[prefix] = locationIndex.byPrefix[prefix] || [];
      locationIndex.byPrefix[prefix].push(location);
    }
    
    // Extract county information (if available in the name)
    const countyMatch = lowerName.match(/(.*?)\s+län$/);
    if (countyMatch) {
      const county = countyMatch[1];
      locationIndex.byCounty[county] = locationIndex.byCounty[county] || [];
      locationIndex.byCounty[county].push(location);
    }
    
    // Extract municipality information (if available)
    const municipalityMatch = lowerName.match(/(.*?)\s+kommun$/);
    if (municipalityMatch) {
      const municipality = municipalityMatch[1];
      // Add an alias for the municipality without the "kommun" suffix
      locationIndex.byName.set(municipality, location);
    }
  });
  
  console.log(`Location index built: ${locationIndex.byName.size} named entries, ${Object.keys(locationIndex.byPrefix).length} prefixes, ${Object.keys(locationIndex.byCounty).length} counties`);
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching to handle typos and minor spelling variations
 * 
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - Edit distance between strings
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix = [];
  
  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost  // substitution
      );
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Find location by exact name match (case insensitive)
 * 
 * @param {string} name - Location name to find
 * @returns {Object|null} - Location data or null if not found
 */
export function findByExactName(name) {
  if (!name) return null;
  return locationIndex.byName.get(name.toLowerCase()) || null;
}

/**
 * Find locations by prefix (for autocomplete/partial matching)
 * 
 * @param {string} prefix - Location name prefix
 * @param {number} limit - Maximum number of results to return
 * @returns {Array} - Matching locations
 */
export function findByPrefix(prefix, limit = 10) {
  if (!prefix) return [];
  
  const lowerPrefix = prefix.toLowerCase();
  const exactMatches = locationIndex.byPrefix[lowerPrefix] || [];
  
  // If we have exact prefix matches, return those
  if (exactMatches.length > 0) {
    return exactMatches.slice(0, limit);
  }
  
  // If no exact prefix match, find the closest prefixes
  const prefixes = Object.keys(locationIndex.byPrefix);
  const closestPrefixes = prefixes
    .filter(p => p.startsWith(lowerPrefix.substring(0, 1))) // Filter to same first letter for performance
    .map(p => ({
      prefix: p,
      distance: levenshteinDistance(p, lowerPrefix)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3); // Get top 3 closest prefixes
  
  // Collect and deduplicate results from closest prefixes
  const results = new Map();
  for (const { prefix } of closestPrefixes) {
    const matches = locationIndex.byPrefix[prefix] || [];
    for (const match of matches) {
      if (!results.has(match.name)) {
        results.set(match.name, match);
      }
    }
  }
  
  return Array.from(results.values()).slice(0, limit);
}

/**
 * Find location by county
 * 
 * @param {string} county - County name
 * @returns {Array} - Locations in that county
 */
export function findByCounty(county) {
  if (!county) return [];
  const lowerCounty = county.toLowerCase().replace(/\s+län$/, '');
  return locationIndex.byCounty[lowerCounty] || [];
}

/**
 * Find locations using fuzzy matching to handle typos and spelling variations
 * 
 * @param {string} name - Location name to find
 * @param {number} threshold - Maximum edit distance to consider a match
 * @param {number} limit - Maximum number of results to return
 * @returns {Array} - Matching locations sorted by relevance
 */
export function findByFuzzyMatch(name, threshold = DEFAULT_FUZZY_THRESHOLD, limit = 5) {
  if (!name) return [];
  
  const lowerName = name.toLowerCase();
  
  // For very short strings, increase the threshold to avoid too many false positives
  if (lowerName.length <= 3) {
    threshold = 1;
  }
  
  // For short inputs, only try to match the start of location names
  if (lowerName.length < 3) {
    return findByPrefix(lowerName, limit);
  }
  
  // Use a heuristic to limit the search space for better performance
  // Only consider locations that share at least the first letter
  const candidates = locationIndex.allLocations.filter(
    location => location.name.toLowerCase().startsWith(lowerName[0])
  );
  
  const matches = candidates
    .map(location => {
      const distance = levenshteinDistance(location.name.toLowerCase(), lowerName);
      return { location, distance };
    })
    .filter(match => match.distance <= threshold)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
  
  return matches.map(match => match.location);
}

/**
 * Progressive location search using multiple strategies
 * 
 * @param {string} locationName - Location name to search for
 * @param {Object} options - Search options
 * @returns {Object|null} - Best matching location or null if not found
 */
export function findLocation(locationName, options = {}) {
  if (!locationName) return null;
  
  const {
    fuzzyThreshold = DEFAULT_FUZZY_THRESHOLD,
    tryFuzzy = true,
    tryPrefix = true
  } = options;
  
  // 1. Try exact match first (fastest)
  const exactMatch = findByExactName(locationName);
  if (exactMatch) return exactMatch;
  
  // 2. Try prefix matching if enabled (good for partial inputs)
  if (tryPrefix) {
    const prefixMatches = findByPrefix(locationName, 1);
    if (prefixMatches.length > 0) return prefixMatches[0];
  }
  
  // 3. Try fuzzy matching if enabled (for typos/variations)
  if (tryFuzzy) {
    const fuzzyMatches = findByFuzzyMatch(locationName, fuzzyThreshold, 1);
    if (fuzzyMatches.length > 0) return fuzzyMatches[0];
  }
  
  // No matches found with any strategy
  return null;
}

// Build the index on module load
buildLocationIndex();

// Expose the index for testing
export const locationIndexDebug = locationIndex; 