# API Documentation

This document provides comprehensive documentation for the Swedish Police Events API.

## Base URL

```
https://your-api-domain.com/api/v1
```

## Authentication

Most endpoints in this API are public and do not require authentication.

For protected endpoints like the cron jobs, a simple API key authentication is used in the header:

```
X-API-Key: your-api-key
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- 60 requests per minute for public endpoints
- 10 requests per minute for protected endpoints

## Endpoints

### Event Endpoints

#### Get Events

```
GET /events
```

Retrieves a paginated list of police events.

**Query Parameters:**

| Parameter | Type   | Description                                      | Default | Example      |
|-----------|--------|--------------------------------------------------|---------|--------------|
| page      | number | Page number for pagination                       | 1       | ?page=2      |
| pageSize  | number | Number of items per page                         | 20      | ?pageSize=50 |
| location  | string | Filter events by location name                   | -       | ?location=Stockholm |
| type      | string | Filter events by event type                      | -       | ?type=Trafikolycka |
| from      | string | Start date in ISO format                         | -       | ?from=2023-01-01T00:00:00Z |
| to        | string | End date in ISO format                           | -       | ?to=2023-01-31T23:59:59Z |
| sortBy    | string | Sort field (datetime, type, location_name)       | datetime| ?sortBy=type |
| sortOrder | string | Sort direction (asc, desc)                       | desc    | ?sortOrder=asc |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "12345",
      "name": "Trafikolycka, Stockholm",
      "summary": "En trafikolycka har inträffat på Sveavägen.",
      "location_name": "Stockholm",
      "datetime": "2023-06-20T12:30:00+02:00",
      "type": "Trafikolycka",
      "location_gps": "59.32938,18.06871",
      "lat": 59.32938,
      "lng": 18.06871,
      "url": "https://polisen.se/events/12345",
      "timestamp": 1687257000,
      "created_at": 1687257000
    },
    // More events...
  ],
  "pagination": {
    "total": 243,
    "page": 1,
    "pageSize": 20,
    "totalPages": 13
  }
}
```

#### Get Single Event

```
GET /events/:id
```

Retrieves a single police event by its ID.

**Path Parameters:**

| Parameter | Type   | Description          | Example |
|-----------|--------|----------------------|---------|
| id        | string | The unique event ID  | 12345   |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "12345",
    "name": "Trafikolycka, Stockholm",
    "summary": "En trafikolycka har inträffat på Sveavägen.",
    "location_name": "Stockholm",
    "datetime": "2023-06-20T12:30:00+02:00",
    "type": "Trafikolycka",
    "location_gps": "59.32938,18.06871",
    "lat": 59.32938,
    "lng": 18.06871,
    "url": "https://polisen.se/events/12345",
    "timestamp": 1687257000,
    "created_at": 1687257000
  }
}
```

### Location Endpoints

#### Get Locations

```
GET /locations
```

Retrieves a list of unique locations with their coordinates and event counts.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "name": "Stockholm",
      "lat": 59.32938,
      "lng": 18.06871,
      "count": 125
    },
    {
      "name": "Göteborg",
      "lat": 57.70887,
      "lng": 11.97456,
      "count": 98
    },
    // More locations...
  ]
}
```

### Event Type Endpoints

#### Get Event Types

```
GET /types
```

Retrieves a list of event types with their occurrence counts.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "type": "Trafikolycka",
      "count": 256
    },
    {
      "type": "Stöld",
      "count": 189
    },
    // More event types...
  ]
}
```

### Statistics Endpoints

#### Get System Statistics

```
GET /stats
```

Retrieves overall system statistics.

**Response:**

```json
{
  "success": true,
  "data": {
    "total_events": 827,
    "geocoded_events": 814,
    "geocoding_success_rate": "98.4%",
    "event_types": 12,
    "locations": 95,
    "last_update": "2023-06-20T13:45:00+02:00",
    "cache_hit_rate": "94.7%",
    "avg_processing_time": "156ms"
  }
}
```

### Geocoding Endpoints

#### Batch Geocode

```
POST /batch-geocode
```

Geocodes multiple locations in a single request.

**Request Body:**

```json
{
  "locations": [
    "Stockholm",
    "Göteborg",
    "Malmö"
  ]
}
```

**Response:**

```json
{
  "success": true,
  "results": [
    {
      "location": "Stockholm",
      "success": true,
      "coordinates": {
        "lat": 59.32938,
        "lng": 18.06871
      }
    },
    {
      "location": "Göteborg",
      "success": true,
      "coordinates": {
        "lat": 57.70887,
        "lng": 11.97456
      }
    },
    {
      "location": "Malmö",
      "success": true,
      "coordinates": {
        "lat": 55.60587,
        "lng": 13.00073
      }
    }
  ]
}
```

### Status Endpoints

#### Health Check

```
GET /status
```

Checks if the API is running properly.

**Response:**

```json
{
  "success": true,
  "status": "ok",
  "version": "1.0.0",
  "uptime": "3d 2h 45m",
  "database": "connected",
  "rss_feed": "accessible",
  "geocoding": "operational"
}
```

### CRON Job Endpoints

#### Update Events

```
POST /cron/update-events
```

Triggers a manual RSS feed update. Protected with API key authentication.

**Headers:**

```
X-API-Key: your-api-key
```

**Response:**

```json
{
  "success": true,
  "message": "RSS feed update completed",
  "results": {
    "total": 25,
    "new": 15,
    "updated": 0,
    "unchanged": 10,
    "failed": 0,
    "geocodingSuccess": 15,
    "geocodingSuccessRate": "100%"
  }
}
```

#### Backfill Events

```
POST /cron/backfill-events
```

Attempts to backfill missing events. Protected with API key authentication.

**Headers:**

```
X-API-Key: your-api-key
```

**Request Body (optional):**

```json
{
  "days": 7
}
```

**Response:**

```json
{
  "success": true,
  "message": "Backfill operation completed",
  "results": {
    "retrieved": 157,
    "new": 12,
    "existing": 145,
    "failed": 0
  }
}
```

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE"
}
```

### Error Codes

| Status Code | Error Code         | Description                                |
|-------------|--------------------|--------------------------------------------|
| 400         | INVALID_PARAMETERS | Invalid request parameters                 |
| 401         | UNAUTHORIZED       | Missing or invalid authentication          |
| 403         | FORBIDDEN          | Insufficient permissions                   |
| 404         | NOT_FOUND          | Requested resource not found               |
| 429         | RATE_LIMITED       | Too many requests                          |
| 500         | INTERNAL_ERROR     | Server error                               |
| 503         | SERVICE_UNAVAILABLE| Temporary service unavailable              |

### Common Validation Errors

| Error Code                | Description                                   |
|---------------------------|-----------------------------------------------|
| INVALID_DATE_FORMAT       | Invalid date format provided                  |
| INVALID_SORT_FIELD        | Invalid sort field specified                  |
| INVALID_PAGE_NUMBER       | Page number must be positive integer          |
| INVALID_PAGE_SIZE         | Page size must be between 1 and 100           |
| LOCATIONS_REQUIRED        | Batch geocoding requires location array       |
| MAX_LOCATIONS_EXCEEDED    | Batch size exceeds maximum (100 locations)    |

## API Changes and Versioning

The API uses semantic versioning (MAJOR.MINOR.PATCH):

- MAJOR version changes indicate breaking changes
- MINOR version changes add functionality in a backward-compatible manner
- PATCH version changes make backward-compatible bug fixes

Future versions will be accessible at `/api/v2`, `/api/v3`, etc. 