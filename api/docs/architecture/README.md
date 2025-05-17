# System Architecture Documentation

This document provides a detailed overview of the Swedish Police Events API architecture, including component diagrams, data flow, and database schema.

## System Overview

The Swedish Police Events API is a Next.js-based system that retrieves police event data from the Swedish Police RSS feed, geocodes the locations, stores the data in a SQLite database, and provides RESTful API endpoints for accessing the data.

## Architecture Diagram

```
┌─────────────────┐        ┌───────────────┐        ┌─────────────────┐
│  Swedish Police │        │  API Service  │        │    Client       │
│  RSS Feed       │◄──────►│  (Next.js)    │◄──────►│    Applications │
└─────────────────┘        └───────────────┘        └─────────────────┘
                                  ▲  ▲
                                  │  │
                                  ▼  ▼
          ┌────────────────┐    ┌─────────────────┐    ┌─────────────────┐
          │   Geocoding    │    │                 │    │                 │
          │   Service      │◄───┤    SQLite       │    │    Caching      │
          │  (Nominatim)   │    │    Database     │    │    Layer        │
          └────────────────┘    │                 │    │                 │
                                └─────────────────┘    └─────────────────┘
```

## Key Components

### 1. Next.js API Service

The core of the system is built using Next.js, which provides both the API endpoints and middleware functionality.

**Key Responsibilities:**
- Process RSS feed data
- Expose RESTful API endpoints
- Handle authentication and rate limiting
- Manage database operations
- Coordinate geocoding operations
- Provide caching and performance optimizations

**Key Files:**
- `/pages/api/v1/*` - API endpoint implementations
- `/lib/events` - Event processing logic
- `/lib/rss` - RSS feed parsing
- `/lib/geocoding` - Geocoding functionality
- `/lib/cache` - Caching mechanisms
- `/lib/db` - Database operations
- `/lib/errors` - Error handling system
- `/lib/middleware` - Request middleware

### 2. SQLite Database

A local SQLite database is used for persistent storage of event data and geocoding results.

**Key Features:**
- Single-file database for simplicity
- Indexed queries for performance
- Transaction support for data consistency

### 3. Geocoding Service

The geocoding service transforms Swedish location names into latitude and longitude coordinates.

**Components:**
- Location database with Swedish location data
- Integration with OpenStreetMap's Nominatim API
- Optimized location index with fast lookup strategies
- Fuzzy matching capabilities for misspelled locations

### 4. Caching Layer

Multiple caching mechanisms improve performance and reduce external API calls.

**Caching Strategies:**
- In-memory caching for API responses
- Dedicated geocoding cache with extended TTL
- RSS feed caching to reduce network requests

## Data Flow

### 1. Event Retrieval and Processing Flow

```
┌─────────────┐     ┌───────────────┐     ┌────────────────┐     ┌──────────────┐     ┌───────────────┐
│ RSS Feed    │────►│ RSS Parser    │────►│ Event Processor │────►│ Geocoder     │────►│ SQLite DB     │
└─────────────┘     └───────────────┘     └────────────────┘     └──────────────┘     └───────────────┘
                          │                       ▲                      ▲
                          │                       │                      │
                          ▼                       │                      │
                    ┌───────────────┐     ┌──────────────┐       ┌──────────────┐
                    │ Cache Layer   │────►│ Event        │◄──────┤ Location     │
                    └───────────────┘     │ Transformer  │       │ Database     │
                                          └──────────────┘       └──────────────┘
```

1. The system fetches the RSS feed from the Swedish Police website
2. The RSS parser converts the XML data into a structured format
3. The event processor extracts location information from event titles
4. The geocoder converts location names to coordinates
5. Processed events are stored in the SQLite database

### 2. API Request Flow

```
┌─────────────┐     ┌───────────────┐     ┌────────────────┐     ┌──────────────┐     ┌───────────────┐
│ Client      │────►│ API Router    │────►│ API Controller │────►│ Data Access  │────►│ SQLite DB     │
└─────────────┘     └───────────────┘     └────────────────┘     └──────────────┘     └───────────────┘
                          │                       ▲                      ▲
                          ▼                       │                      │
                    ┌───────────────┐             │                      │
                    │ Middleware    │─────────────┘                      │
                    │ - Auth        │                                    │
                    │ - Rate Limit  │                                    │
                    │ - Error Hand. │             ┌──────────────┐       │
                    └───────────────┘             │ Cache Layer  │◄──────┘
                                                  └──────────────┘
```

1. Client makes an HTTP request to an API endpoint
2. Request passes through middleware (authentication, rate limiting)
3. API controller processes the request
4. Data access layer retrieves data (using cache when possible)
5. Response is formatted and returned to the client

## Database Schema

### Events Table

| Column        | Type    | Description                                |
|---------------|---------|--------------------------------------------|
| id            | TEXT    | Unique identifier for the event (Primary Key) |
| name          | TEXT    | Event title from the RSS feed              |
| summary       | TEXT    | Event description from the RSS feed        |
| location_name | TEXT    | Extracted location name                    |
| datetime      | TEXT    | Event date and time in ISO format          |
| type          | TEXT    | Type of event (e.g., Trafikolycka)         |
| location_gps  | TEXT    | Combined latitude and longitude as a string |
| lat           | REAL    | Latitude coordinate                        |
| lng           | REAL    | Longitude coordinate                       |
| url           | TEXT    | URL to the event on the Police website     |
| timestamp     | INTEGER | Unix timestamp of the event                |
| created_at    | INTEGER | When the event was added to the database   |
| last_updated  | INTEGER | When the event was last updated            |

**Indexes:**
- `idx_events_location` - Index on `location_name` for location-based queries
- `idx_events_type` - Index on `type` for event type filtering
- `idx_events_datetime` - Index on `datetime` for chronological queries

## Caching Strategy

The system implements a multi-level caching strategy:

1. **API Response Cache**
   - TTL: 5 minutes
   - Caches complete API responses by URL
   - Invalidated when events are updated

2. **Geocoding Cache**
   - TTL: 30 days
   - Caches geocoding results by location name
   - Persistent across application restarts

3. **RSS Feed Cache**
   - TTL: 5 minutes
   - Prevents redundant network requests
   - Includes conditional GET with ETag support

## Error Handling

The system implements a centralized error handling system:

1. **Custom Error Classes**
   - `AppError` - Base error class
   - `ApiError` - API-specific errors
   - `DatabaseError` - Database operation errors
   - `GeocodingError` - Geocoding-specific errors
   - `NetworkError` - External service communication errors

2. **Error Middleware**
   - Captures and formats all errors
   - Provides consistent error responses
   - Logs errors with appropriate severity

## Performance Considerations

The architecture is optimized for performance through:

1. **Indexed Database Queries**
   - Strategic indexes on commonly queried columns
   - Optimized query patterns

2. **Efficient Geocoding**
   - Local location database to minimize external API calls
   - Fuzzy matching and prefix-based location search
   - Parallel processing for batch operations

3. **Caching Strategy**
   - Multi-level caching to reduce database load
   - In-memory caching for frequently accessed data
   - TTL-based invalidation for data freshness

4. **Optimized Data Loading**
   - Pagination for large result sets
   - Selective column retrieval
   - JSON response compression

## Scalability Considerations

While the current implementation uses SQLite for simplicity, the architecture supports scaling through:

1. **Database Abstraction**
   - Database operations are isolated in a data access layer
   - Can be extended to support other databases like PostgreSQL

2. **Stateless API Design**
   - No session state maintained between requests
   - Enables horizontal scaling across multiple servers

3. **Caching Infrastructure**
   - In-memory cache can be replaced with Redis for distributed caching
   - Shared caching layer for multiple application instances

## Future Architecture Enhancements

Potential improvements to the architecture include:

1. **Microservices Decomposition**
   - Separating geocoding into its own service
   - Dedicated event processing service

2. **Message Queue Integration**
   - Asynchronous event processing using a message queue
   - Better handling of sporadic load spikes

3. **Containerization**
   - Docker containers for consistent deployment
   - Kubernetes for orchestration

4. **Enhanced Monitoring**
   - Centralized logging infrastructure
   - Performance metrics collection
   - Alerting for system anomalies 