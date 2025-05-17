# Error Handling & Logging Documentation

This document provides an overview of the error handling and logging system implemented in the Swedish Police Events API.

## Architecture Overview

The error handling and logging system follows a centralized approach with the following components:

1. **Error Classes**: Custom error classes for different types of errors
2. **Error Handling Middleware**: Catches and processes errors in API routes
3. **Structured Logging**: Consistent logging with support for different levels and contexts
4. **Request ID Tracking**: Correlation IDs to track requests through the system
5. **File Logging**: Log rotation and persistence for production environments
6. **Database Error Handling**: Special handling for SQLite errors

![Error Handling Architecture](../assets/error-handling-architecture.png)

## Error Classes

The system uses a hierarchy of error classes:

- `AppError`: Base class for all application errors
  - `ApiError`: Errors related to API requests/responses
  - `DatabaseError`: Database-related errors
  - `GeocodingError`: Errors from geocoding operations
  - `RssError`: Errors from RSS feed parsing
  - `ValidationError`: Input validation errors
  - `NotFoundError`: Resource not found errors

All these error classes include:
- HTTP status code
- Error code for API responses
- Operational flag to distinguish expected vs unexpected errors

```javascript
// Example of creating and throwing an error
throw new ValidationError('Invalid parameter: limit must be a number', 'INVALID_PARAMETER');
```

## Middleware

### Error Handling Middleware

The error handling middleware automatically wraps API routes:

```javascript
// Example of using the middleware
export default withErrorHandling(async (req, res) => {
  // Your handler code
});
```

Benefits:
- Centralized error handling
- Consistent error responses
- Request ID correlation
- Automatic error logging

### Rate Limiting Middleware

Protects API endpoints from abuse:

```javascript
// Example of applying rate limiting
export default withApiHandler(handler, {
  rateLimit: true,
  restricted: false // Use restrictedApiRateLimit for sensitive operations
});
```

### Request ID Middleware

Generates and tracks unique request IDs:

```javascript
// Request IDs are automatically added to all requests
// Access the ID in your handler:
const requestId = req.id;
```

## Logging System

### Log Levels

The logging system supports multiple levels:

- `DEBUG`: Detailed debugging information
- `INFO`: Informational messages
- `WARN`: Warning conditions
- `ERROR`: Error conditions

### Creating Loggers

Create contextual loggers for specific modules:

```javascript
import { createLogger } from '../logging/index.js';

// Create a logger with module context
const logger = createLogger({ module: 'myModule' });

// Log with different levels
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error); // Automatically captures error details
```

### Request-Scoped Logging

Create loggers with request context:

```javascript
import { createRequestLogger } from '../middleware/requestId.js';

// In your handler
const logger = createRequestLogger(req);
logger.info('Processing request', { additionalContext: 'value' });
```

### File Logging

In production, logs are written to files with rotation:

- Log files are stored in the `logs` directory
- Files are rotated when they reach 10MB
- Up to 5 log files are kept (configurable)

## Database Error Handling

Special handling for database errors:

```javascript
import { withDbErrorHandling, runTransaction } from '../db/errorHandler.js';

// Wrap a database operation with error handling
const safeDbFunction = withDbErrorHandling(originalFunction, 'operation description');

// Run a database transaction with automatic rollback on error
await runTransaction(db, async (db) => {
  // Transaction operations
}, 'transaction description');
```

## Viewing Logs

Use the log viewer script to analyze logs:

```bash
# View the last 10 errors
node scripts/view-error-logs.js

# View the last 20 warnings or errors
node scripts/view-error-logs.js --last=20 --level=WARN

# Filter by module
node scripts/view-error-logs.js --module=geocoding

# View logs since a specific date
node scripts/view-error-logs.js --since=2023-05-01T00:00:00Z

# Output in JSON format
node scripts/view-error-logs.js --format=json
```

## API Error Responses

Error responses from the API follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Invalid parameter: limit must be a number",
    "code": "INVALID_PARAMETER"
  },
  "requestId": "req_1621234567890_abc123"
}
```

The `requestId` can be used for correlating client errors with server logs.

## Best Practices

1. **Use Specific Error Types**: Throw the most specific error type for better handling.
2. **Include Error Codes**: Always include error codes for client-side error handling.
3. **Create Contextual Loggers**: Use module-specific loggers for better context.
4. **Log at Appropriate Levels**: Use the right log level for the message.
5. **Include Request IDs**: Always log with request context when in a request handler.
6. **Wrap Database Operations**: Use `withDbErrorHandling` for all database operations.
7. **Validate Inputs Early**: Validate and parse inputs at the start of request handlers.

## System Configuration

The logging system can be configured through environment variables:

- `LOG_LEVEL`: Set the minimum log level ('DEBUG', 'INFO', 'WARN', 'ERROR')
- `NODE_ENV`: Affects log formatting (development: human-readable, production: JSON)
- `APP_NAME`: Application name for logs
- `APP_VERSION`: Application version for logs

## Error Monitoring

In a production environment, consider adding an error monitoring service like Sentry to capture and aggregate errors. Integration points are available in the error handling middleware. 