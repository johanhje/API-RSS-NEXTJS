# Swedish Geocoding System for Police RSS Feed

This document explains the geocoding system implemented in this API, which allows accurate geocoding of Swedish locations mentioned in police RSS feeds.

## Overview

Our geocoding system converts location names in Swedish police reports to geographical coordinates (latitude/longitude) for display on maps. The system handles various Swedish location formats including cities, municipalities, counties, and special police-specific location strings.

## Features

- **Enhanced Location Database**: 957+ Swedish locations including all major cities, counties, and municipalities
- **Specialized Handling**: Support for police-specific location formats like "Sammanfattning" reports
- **Intelligent Fallbacks**: Multiple strategies for extracting and matching locations
- **Self-Learning**: Automatic detection and addition of new locations
- **Monitoring Dashboard**: Visual tracking of geocoding performance

## Usage

### Using the API

Events with geocoding information are available via the events endpoint:

```
GET /api/events
```

Each event includes:
- `location`: The original location string from the RSS feed
- `latitude` & `longitude`: Geographic coordinates (if geocoding successful)
- `location_gps`: Formatted as "lat,lon" for convenience

### Geocoding Dashboard

The dashboard provides statistics about geocoding performance:

1. Run the dashboard:
   ```
   npm run dashboard
   ```

2. Open in your browser:
   ```
   http://localhost:3000/geocoding-dashboard
   ```

### Geocoding Stats API

Raw geocoding statistics are available via:

```
GET /api/geocoding-stats
```

## Maintenance

### Updating Location Database

Several scripts are available to update the location database:

- **Add from Problem List**: Automatically identify and geocode problematic locations
  ```
  npm run update:auto-locations
  ```

- **Update All Locations**: Combine all location sources
  ```
  npm run update:all-locations
  ```

- **Add Specific Region**: Add locations from specific regions
  ```
  npm run add:kronoberg      # Add Kronoberg county locations
  npm run add:municipalities # Add Swedish municipalities
  npm run add:major-cities   # Add major Swedish cities
  ```

### Testing

Multiple test scripts ensure geocoding quality:

```
npm run test:comprehensive   # Test comprehensive geocoding
npm run test:events          # Test with real police event locations
npm run test:new-locations   # Test newly added locations
```

## Database Structure

Our location database (`expanded-location-database.js`) contains entries in the format:

```javascript
{
  name: "Stockholm",
  lat: 59.3293,
  lon: 18.0686,
  source: "osm",  // Where this location came from
  date_added: "2025-05-16T12:00:00.000Z"
}
```

## Extending

To add support for new location types:

1. Identify patterns in the location strings
2. Create or modify the appropriate script in `scripts/`
3. Add entries to the expanded location database 
4. Run relevant tests to verify

For problematic locations showing up in the dashboard:

1. Check the "Most Common Problem Locations" list
2. Run the auto-update script or manually add them
3. Monitor the success rate on the dashboard 