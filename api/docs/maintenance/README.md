# Maintenance Guide

This guide provides detailed information for maintaining and operating the Swedish Police Events API system.

## Table of Contents

1. [Deployment Procedures](#deployment-procedures)
2. [Monitoring Instructions](#monitoring-instructions)
3. [Troubleshooting Common Issues](#troubleshooting-common-issues)
4. [Location Database Updates](#location-database-updates)
5. [Backup and Recovery](#backup-and-recovery)
6. [Performance Tuning](#performance-tuning)

## Deployment Procedures

### Initial Deployment

1. **Prerequisites**
   - Node.js 18.x or higher
   - npm or yarn package manager
   - Git

2. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/API-RSS-NEXTJS.git
   cd API-RSS-NEXTJS/api
   ```

3. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

4. **Build the Application**
   ```bash
   npm run build
   # or
   yarn build
   ```

5. **Start the Server**
   ```bash
   npm run start
   # or
   yarn start
   ```

### Deployment with Enhanced Geocoding

For improved geocoding performance:

```bash
npm run start:enhanced
# or
yarn start:enhanced
```

### Production Deployment

For a production environment:

1. **Set Environment Variables**
   ```bash
   export NODE_ENV=production
   ```

2. **Configure API Keys**
   Create a `.env` file with:
   ```
   API_KEY=your-secure-api-key
   ```

3. **Start Production Server**
   ```bash
   npm run start
   # or
   yarn start
   ```

### Docker Deployment

1. **Build Docker Image**
   ```bash
   docker build -t police-events-api .
   ```

2. **Run Docker Container**
   ```bash
   docker run -p 3000:3000 -d --name police-api police-events-api
   ```

### Deployment with Process Manager (PM2)

For robust production deployments:

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Start with PM2**
   ```bash
   pm2 start npm --name "police-api" -- start
   ```

3. **Ensure Auto-restart**
   ```bash
   pm2 startup
   pm2 save
   ```

## Monitoring Instructions

### System Health Monitoring

1. **API Health Check Endpoint**
   
   Monitor the `/api/status` endpoint for system health:
   ```bash
   curl https://your-api-domain.com/api/status
   ```
   
   Expected response:
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

2. **System Statistics**
   
   Monitor the `/api/v1/stats` endpoint for performance metrics:
   ```bash
   curl https://your-api-domain.com/api/v1/stats
   ```

### Dashboard Monitoring

1. **Access the Monitoring Dashboard**
   
   Navigate to `/geocoding-dashboard` in your browser to access the built-in monitoring dashboard.

2. **Key Metrics to Monitor**
   
   - Geocoding success rate (should stay above 95%)
   - Cache hit rate (optimal range: 85-95%)
   - Average processing time (should be under 200ms)
   - Total events count (growth should be consistent)
   - Failed events (should be close to zero)

### Log Monitoring

1. **Server Logs**
   
   Application logs are written to:
   - `logs/app.log` - General application logs
   - `logs/error.log` - Error-specific logs
   - `logs/access.log` - API request logs

2. **Log Format**
   
   Logs follow this format:
   ```
   [TIMESTAMP] [LEVEL] [REQUEST_ID] Message - {Additional data}
   ```

3. **Log Rotation**
   
   Logs are automatically rotated:
   - Daily rotation
   - Compressed after 7 days
   - Deleted after 30 days

### Automated Monitoring

1. **Setting Up Alerts**
   
   Configure alerts for:
   - API health check failures (> 2 minutes)
   - Geocoding success rate drops below 90%
   - Error rate exceeds 5% of requests
   - Cache hit rate drops below 75%

2. **Monitoring with External Tools**
   
   Compatible with:
   - Prometheus (metrics endpoint: `/api/metrics`)
   - Grafana (sample dashboard provided in `/monitoring/grafana-dashboard.json`)
   - New Relic (configuration in `/monitoring/newrelic.js`)

## Troubleshooting Common Issues

### RSS Feed Connection Issues

**Symptoms:**
- Error logs with `NetworkError: Failed to fetch RSS feed`
- Empty results from `/api/v1/events` endpoint
- Status endpoint shows `rss_feed: "unavailable"`

**Resolution Steps:**
1. Check internet connectivity from the server
2. Verify the Swedish Police RSS feed is accessible:
   ```bash
   curl https://polisen.se/aktuellt/rss/hela-landet/handelser-i-hela-landet/
   ```
3. Check for IP blocking or rate limiting
4. Review proxy settings if applicable
5. Temporarily increase network timeout in `config.js`

### Geocoding Failures

**Symptoms:**
- High number of locations without coordinates
- Low geocoding success rate in statistics
- Error logs with `GeocodingError`

**Resolution Steps:**
1. Check Nominatim API availability
2. Verify location database integrity
3. Run backfill for missing geocoded events:
   ```bash
   npm run reprocess:missing
   ```
4. Check for new location patterns not in the database
5. Add missing locations manually:
   ```bash
   npm run add:locations
   ```

### Database Corruption

**Symptoms:**
- Database error logs
- API endpoints returning 500 errors
- Status endpoint shows `database: "error"`

**Resolution Steps:**
1. Stop the application
2. Create a backup of the existing database file
3. Run database integrity check:
   ```bash
   sqlite3 data/polisapp.sqlite "PRAGMA integrity_check"
   ```
4. If corrupted, restore from backup:
   ```bash
   cp data/backups/polisapp_YYYY-MM-DD.sqlite data/polisapp.sqlite
   ```
5. Restart the application

### Memory Leaks

**Symptoms:**
- Increasing memory usage over time
- Slower response times
- Eventual crashes with out-of-memory errors

**Resolution Steps:**
1. Identify leak source with heap snapshots
2. Check for unclosed database connections
3. Verify cache size limits are properly set
4. Implement a restart schedule if needed
5. Update to latest dependencies

### API Rate Limiting Issues

**Symptoms:**
- Clients receiving 429 Too Many Requests errors
- Legitimate traffic being blocked

**Resolution Steps:**
1. Review rate limiting configuration in `config.js`
2. Adjust rate limits for specific endpoints
3. Implement client-specific rate limits using API keys
4. Consider implementing IP-based whitelisting

## Location Database Updates

### Automated Updates

The location database can be updated automatically:

```bash
# Update all Swedish locations
npm run update:locations

# Update with combined sources
npm run update:all-locations
```

### Adding Custom Locations

For adding locations missing from the standard database:

```bash
# Add specific locations
npm run add:locations

# Add major Swedish cities
npm run add:major-cities

# Add Swedish municipalities
npm run add:municipalities
```

### Location Database Format

Custom locations should follow this format in `custom-locations.json`:

```json
[
  {
    "name": "Location Name",
    "lat": 59.12345,
    "lng": 18.67890,
    "aliases": ["Alternative Name", "Another Name"],
    "county": "County Name"
  }
]
```

### Troubleshooting Location Data

1. **View Problematic Locations**
   
   Access the geocoding dashboard to see locations that failed geocoding:
   `/geocoding-dashboard/problematic`

2. **Fix Common Location Issues**
   
   ```bash
   npm run fix:locations
   ```

3. **Manually Test Geocoding**
   
   ```bash
   npm run test:geocoding "Location Name"
   ```

## Backup and Recovery

### Automated Backups

Backups are configured to run daily:
- Database file: `data/polisapp.sqlite` → `data/backups/polisapp_YYYY-MM-DD.sqlite`
- Configuration: `.env` → `data/backups/env_YYYY-MM-DD`
- Custom locations: `data/custom-locations.json` → `data/backups/custom-locations_YYYY-MM-DD.json`

### Manual Backup Procedure

```bash
# Back up database
cp data/polisapp.sqlite data/backups/polisapp_manual.sqlite

# Back up configuration
cp .env data/backups/env_manual

# Back up custom locations
cp data/custom-locations.json data/backups/custom-locations_manual.json
```

### Recovery Procedure

1. Stop the application
2. Restore files from backups
3. Restart the application

```bash
# Restore database
cp data/backups/polisapp_YYYY-MM-DD.sqlite data/polisapp.sqlite

# Restore configuration
cp data/backups/env_YYYY-MM-DD .env

# Restore custom locations
cp data/backups/custom-locations_YYYY-MM-DD.json data/custom-locations.json
```

## Performance Tuning

### Database Optimization

1. **Analyze Slow Queries**
   
   Enable query logging:
   ```bash
   export LOG_QUERIES=true
   ```

2. **Add Custom Indexes**
   
   For frequently used queries, add indexes:
   ```sql
   CREATE INDEX idx_custom_field ON events(field_name);
   ```

3. **Optimize Large Tables**
   
   ```bash
   npm run optimize:db
   ```

### Caching Optimization

1. **Adjust Cache TTL**
   
   Modify TTL values in `lib/cache/index.js`:
   - Increase for stable data
   - Decrease for frequently changing data

2. **Optimize Cache Size**
   
   Adjust the maximum cache size based on server memory:
   ```javascript
   // lib/cache/index.js
   const MAX_CACHE_SIZE = 1000; // Increase for more memory
   ```

3. **Monitor Cache Performance**
   
   Check cache hit rates in the statistics endpoint or dashboard

### Geocoding Performance

1. **Batch Processing Size**
   
   Adjust the batch size for geocoding:
   ```javascript
   // lib/geocoding/batch.js
   const BATCH_SIZE = 10; // Increase for faster processing
   ```

2. **Geocoding Concurrency**
   
   Modify concurrent requests:
   ```javascript
   // lib/geocoding/batch.js
   const CONCURRENCY = 5; // Adjust based on CPU cores
   ```

3. **Location Index Optimization**
   
   Tune the fuzzy matching threshold:
   ```javascript
   // lib/geocoding/location-index.js
   const DEFAULT_FUZZY_THRESHOLD = 2; // Lower for more matches
   ``` 