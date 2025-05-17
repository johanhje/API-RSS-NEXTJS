# Geocoding System Documentation

This document details the geocoding system used in the Swedish Police Events API, including location format specifications, algorithm details, and instructions for adding new locations.

## Overview

The geocoding system is responsible for converting Swedish location names (extracted from police event titles) into latitude and longitude coordinates. This enables geographical visualization and filtering of police events.

## Architecture

The geocoding system is composed of several key components:

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Location Index  │     │  Location DB     │     │  Nominatim API   │
│  - Fast Lookups  │◄───►│  - Swedish Locs  │◄───►│  - External API  │
│  - Fuzzy Match   │     │  - Coordinates   │     │  - Fallback      │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         ▲                        ▲                        ▲
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                                  ▼
                          ┌──────────────────┐
                          │  Geocoding Cache │
                          │  - TTL: 30 days  │
                          │  - Normalized    │
                          └──────────────────┘
                                  ▲
                                  │
                                  ▼
                          ┌──────────────────┐
                          │  Event Processor │
                          │  - Extract Locs  │
                          │  - Store Results │
                          └──────────────────┘
```

## Location Format Specifications

### Standard Location Format

Locations in the system follow this standard format:

```json
{
  "name": "Stockholm",
  "lat": 59.32938,
  "lng": 18.06871,
  "aliases": ["Stockholms stad", "Sthlm"],
  "county": "Stockholms län",
  "population": 975551
}
```

### Location Database Schema

The expanded location database includes:

| Field       | Type     | Description                               | Required |
|-------------|----------|-------------------------------------------|----------|
| name        | string   | Primary location name                     | Yes      |
| lat         | number   | Latitude coordinate                       | Yes      |
| lng         | number   | Longitude coordinate                      | Yes      |
| aliases     | string[] | Alternative names for the location        | No       |
| county      | string   | Swedish county (län) the location is in   | No       |
| municipality| string   | Swedish municipality (kommun)             | No       |
| population  | number   | Population estimate                       | No       |
| type        | string   | Location type (city, town, village, etc.) | No       |

### Location Naming Conventions

The system follows these conventions for location names:

1. **Official Names**: Use official Swedish spellings (with diacritics)
2. **Case Sensitivity**: Store names in proper case but search case-insensitively
3. **Diacritics**: Retain diacritics in storage but normalize for searching
4. **Abbreviations**: Include common abbreviations as aliases
5. **Compound Names**: Maintain spaces and hyphens as in official names

## Geocoding Algorithm Details

### Progressive Geocoding Strategy

The geocoder uses a multi-stage approach to maximize both speed and success rate:

1. **Exact Match Lookup** - O(1) hash lookup by normalized name
2. **Alias Lookup** - Check against known aliases
3. **Prefix-Based Search** - Find matches based on first few characters
4. **Fuzzy Matching** - Levenshtein distance for typo tolerance
5. **Nominatim API Fallback** - External geocoding service

### Location Name Extraction

Location names are extracted from police event titles using these patterns:

1. **Primary Pattern**: `<Event Type>, <Location>`
   - Example: "Trafikolycka, Stockholm" → "Stockholm"

2. **Secondary Patterns**:
   - `<Location>: <Event Details>`
   - `<Event Type> i <Location>`
   - `<Event Type> på <Location>`

3. **Special Cases**:
   - Multiple locations are split and processed individually
   - Compound locations with "och" (and) are processed as separate entities

### Normalization Process

Before lookup, location names are normalized:

```javascript
function normalizeLocationName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[åä]/g, 'a')
    .replace(/[ö]/g, 'o')
    .replace(/[éèêë]/g, 'e')
    .replace(/[,\.;:!?]/g, '');
}
```

### Fuzzy Matching Algorithm

For locations that don't have an exact match, a Levenshtein distance algorithm is used:

```javascript
function calculateLevenshteinDistance(a, b) {
  // Implementation details...
}

function findByFuzzyMatch(name, threshold = 2) {
  const normalizedName = normalizeLocationName(name);
  let matches = [];
  
  // Compare against all locations in the database
  EXPANDED_LOCATION_DATABASE.forEach(location => {
    const distance = calculateLevenshteinDistance(
      normalizeLocationName(location.name),
      normalizedName
    );
    
    if (distance <= threshold) {
      matches.push({
        ...location,
        distance
      });
    }
  });
  
  // Sort by distance (closest match first)
  return matches.sort((a, b) => a.distance - b.distance);
}
```

### Prefix-Based Search

For partial matches, a prefix-based search is implemented:

```javascript
function findByPrefix(prefix, limit = 10) {
  const normalizedPrefix = normalizeLocationName(prefix).substring(0, 3);
  
  // Get all locations that start with the same prefix
  const matchingLocations = locationIndex.byPrefix[normalizedPrefix] || [];
  
  // Return the top matches sorted by population (largest first)
  return matchingLocations
    .sort((a, b) => (b.population || 0) - (a.population || 0))
    .slice(0, limit);
}
```

### Batch Geocoding

For processing multiple locations efficiently:

```javascript
async function batchGeocode(locations, options = {}) {
  const {
    concurrency = 5,
    delayMs = 200,
    retries = 1
  } = options;
  
  // Process locations in batches with concurrency limit
  // Implementation details...
}
```

## Adding New Locations

### Manual Addition

To add a new location to the database:

1. **Create a Location Object**

```json
{
  "name": "New Location",
  "lat": 59.12345,
  "lng": 18.67890,
  "aliases": ["Alternative Name"],
  "county": "County Name"
}
```

2. **Add to Custom Locations File**

Add the location to `data/custom-locations.json`.

3. **Run the Integration Script**

```bash
npm run add:locations
```

### Bulk Import

For adding multiple locations:

1. **Create a CSV File** with this format:
```
name,lat,lng,county,aliases
Location1,59.12345,18.67890,County1,"Alias1,Alias2"
Location2,58.12345,17.67890,County2,"Alias3,Alias4"
```

2. **Import Locations**
```bash
npm run import:locations --file=locations.csv
```

### Location Verification

After adding locations, verify their correctness:

```bash
npm run test:new-locations
```

This will:
1. Check for duplicate locations
2. Validate coordinates format
3. Ensure required fields are present
4. Test geocoding effectiveness

## Performance Optimization

### Indexed Lookups

The location database is indexed for optimal performance:

```javascript
// Pre-built indexes
const locationIndex = {
  byName: new Map(),      // name -> location
  byPrefix: {},           // prefix -> locations[]
  byCounty: {},           // county -> locations[]
  byMunicipality: {}      // municipality -> locations[]
};

// Build indexes from location database
function buildLocationIndex() {
  EXPANDED_LOCATION_DATABASE.forEach(location => {
    // Index by exact name (case insensitive)
    locationIndex.byName.set(
      normalizeLocationName(location.name),
      location
    );
    
    // Index by aliases
    location.aliases?.forEach(alias => {
      locationIndex.byName.set(
        normalizeLocationName(alias),
        location
      );
    });
    
    // Index by prefix
    const prefix = normalizeLocationName(location.name).substring(0, 3);
    locationIndex.byPrefix[prefix] = locationIndex.byPrefix[prefix] || [];
    locationIndex.byPrefix[prefix].push(location);
    
    // Index by county
    if (location.county) {
      locationIndex.byCounty[location.county] = 
        locationIndex.byCounty[location.county] || [];
      locationIndex.byCounty[location.county].push(location);
    }
    
    // Index by municipality
    if (location.municipality) {
      locationIndex.byMunicipality[location.municipality] = 
        locationIndex.byMunicipality[location.municipality] || [];
      locationIndex.byMunicipality[location.municipality].push(location);
    }
  });
}
```

### Caching Strategy

Geocoding results are extensively cached:

1. **Successful Results**: TTL of 30 days
2. **Failed Results**: TTL of 1 day
3. **Normalized Names**: TTL of 90 days

```javascript
// Cache successful geocoding
cacheGeocodingResult('Stockholm', {
  lat: 59.32938,
  lng: 18.06871
});

// Cache failed geocoding
cacheFailedGeocodingResult('Unknown Location');

// Retrieve from cache
const cached = getCachedGeocodingResult('Stockholm');
```

## Troubleshooting Geocoding Issues

### Common Issues

1. **Unrecognized Locations**
   - New locations not in database
   - Uncommon spelling variations
   - Very small localities

2. **Ambiguous Locations**
   - Same name in multiple counties
   - Generic names (e.g., "Centrum")

3. **Format Issues**
   - Unexpected location name format
   - Special characters or abbreviations

### Diagnostic Tools

```bash
# Test geocoding for a specific location
npm run test:geocoding "Location Name"

# View problematic locations on dashboard
open http://localhost:3000/geocoding-dashboard/problematic

# Analyze geocoding success rate
npm run test:comprehensive
```

### Improving Geocoding Success Rate

1. **Add Missing Locations**
   - Monitor the dashboard for failed locations
   - Add them to custom locations

2. **Add Aliases**
   - Include common misspellings
   - Add alternative names

3. **Adjust Fuzzy Matching**
   - Decrease threshold for more matches
   - Increase threshold for precision

## Geocoding Service Integration

### Using the Geocoding API

The geocoding service can be accessed via API:

```bash
# Single location geocoding
curl -X POST https://your-api-domain.com/api/v1/geocode \
  -H "Content-Type: application/json" \
  -d '{"location": "Stockholm"}'

# Batch geocoding
curl -X POST https://your-api-domain.com/api/v1/batch-geocode \
  -H "Content-Type: application/json" \
  -d '{"locations": ["Stockholm", "Göteborg", "Malmö"]}'
```

### Direct Code Integration

```javascript
import { geocodeLocation } from '../lib/geocoding/nominatim.js';
import { batchGeocode } from '../lib/geocoding/batch.js';

// Single location geocoding
const result = await geocodeLocation('Stockholm');
console.log(result); // { lat: 59.32938, lng: 18.06871 }

// Batch geocoding
const batchResults = await batchGeocode(['Stockholm', 'Göteborg']);
```

## Future Enhancements

Planned improvements to the geocoding system:

1. **Machine Learning Integration**
   - Pattern recognition for unusual formats
   - Context-aware location extraction

2. **Enhanced Spatial Analysis**
   - Polygon support for regions
   - Distance-based searches

3. **Multiple Provider Support**
   - Google Maps API integration
   - HERE Maps integration
   - Custom provider selection 