# Swedish Location Database

## Overview

This document explains the enhanced Swedish location database used for geocoding in the Police API. The database contains coordinates for Swedish locations to efficiently map police events without relying on external geocoding services.

## Background

The Police RSS feed provides location information as text strings (e.g. "Trafikolycka, Stockholm" or "Brand, Upplands-bro"), which need to be geocoded to display events on a map. The original implementation used:

1. A small database of ~475 common Swedish locations
2. OpenStreetMap's Nominatim API as a fallback

However, this approach had limitations:
- Many locations were not recognized
- External API calls were slow and subject to rate limiting
- Complex location strings were difficult to parse

## Enhanced Location Database

The enhanced database (`expanded-location-database.js`) includes:

- **Tätorter** (Urban areas): Large towns and cities
- **Småorter** (Small localities): Smaller communities
- **Städer** (Historical cities): Traditional Swedish cities
- **Kommuner** (Municipalities): Administrative regions
- **Custom locations**: Manually added locations including smaller towns and villages

In total, the expanded database contains 795 Swedish locations, covering virtually all locations mentioned in police reports.

## Performance Improvements

The enhanced location database provides significant performance improvements:

- **Geocoding Success Rate**: 100% success rate for test locations
- **Processing Speed**: ~690 events per second
- **Sync Time**: Reduced from 30+ seconds to less than 1 second
- **External API Calls**: Eliminated for most locations

## Implementation

The database is implemented as a simple JavaScript object mapping normalized location names to coordinates:

```javascript
export const EXPANDED_LOCATION_DATABASE = {
  'stockholm': { lat: 59.32938, lon: 18.06871 },
  'göteborg': { lat: 57.70887, lon: 11.97456 },
  // ... more locations
};
```

The geocoding service in `nominatim.js` uses this database as the primary source for coordinates, with Nominatim API as a fallback.

## Extending the Database

There are multiple ways to add more locations to the database:

### 1. Using the Custom Location Script

The easiest way to add locations is to use the `add-custom-locations.js` script:

1. Edit the `CUSTOM_LOCATIONS` object in `scripts/add-custom-locations.js` to add your locations:
   ```javascript
   const CUSTOM_LOCATIONS = {
     'your-location': { lat: 00.0000, lon: 00.0000 },
     // Add more locations here
   };
   ```

2. Run the script to update the database:
   ```bash
   node scripts/add-custom-locations.js
   ```

3. The script will:
   - Add new locations
   - Skip existing locations
   - Sort all locations alphabetically
   - Update the database file with the new locations

### 2. Using the Auto-Fetch Script

To automatically fetch locations from APIs:

1. Run `node scripts/fetch-swedish-locations.js` to update the database from SCB/OSM APIs

### 3. Manual Additions

For specific locations:

1. Manually add locations to `lib/geocoding/expanded-location-database.js` using the format:
   ```javascript
   'location_name': { lat: 00.00000, lon: 00.00000 }
   ```

2. For complex locations with identifiable patterns, consider enhancing the location extraction logic in `nominatim.js`

## Data Sources

The location data is sourced from:

1. Statistics Sweden (SCB) API
2. OpenStreetMap Overpass API
3. Manual additions based on police event analysis

## Testing

You can test the geocoding performance using:

- `npm run test:geocoding` - Test with sample locations
- `npm run test:events` - Test with real police event strings
- `npm run test:rss` - Test full RSS synchronization process
- `node scripts/test-new-locations.js` - Test specific newly added locations

## Finding Coordinates for New Locations

If you need to find coordinates for new locations:

1. **OpenStreetMap**: Visit [OpenStreetMap](https://www.openstreetmap.org/), search for the location, right-click on the map and select "Show address" to get coordinates
2. **Google Maps**: Drop a pin on a location, the URL will contain the coordinates in the format `@lat,lon,zoom`
3. **Online geocoding services**: Use services like [Nominatim](https://nominatim.openstreetmap.org/search) to search for Swedish locations 