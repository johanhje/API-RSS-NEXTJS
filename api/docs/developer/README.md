# Developer Onboarding Guide

Welcome to the Swedish Police Events API project! This guide will help you set up your development environment and understand the codebase structure.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Development Environment Setup](#development-environment-setup)
4. [Codebase Structure](#codebase-structure)
5. [Key Concepts](#key-concepts)
6. [Development Workflow](#development-workflow)
7. [Testing](#testing)
8. [Common Tasks](#common-tasks)

## Project Overview

The Swedish Police Events API is a Next.js-based system that:

1. Retrieves police event data from the official Swedish Police RSS feed
2. Geocodes location names to coordinates
3. Stores events in a SQLite database
4. Provides RESTful API endpoints for accessing the data
5. Includes a dashboard for monitoring system health

Key features include:
- Optimized geocoding with 99% success rate for Swedish locations
- Comprehensive RESTful API with filtering, sorting, and pagination
- Polling mechanism for regular data updates
- Multi-level caching strategy
- Monitoring and error handling
- Performance-optimized with location indexing

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Git
- Basic knowledge of JavaScript/Next.js
- Basic understanding of Swedish geography (helpful but not required)

### Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/API-RSS-NEXTJS.git
   cd API-RSS-NEXTJS/api
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser to http://localhost:3000 to see the dashboard

5. Try the API at http://localhost:3000/api/v1/events

## Development Environment Setup

### Setting Up Your IDE

For the best development experience, we recommend using Visual Studio Code with these extensions:

- ESLint
- Prettier
- SQLite Viewer
- REST Client
- Todo Tree

### Recommended Configuration

Create a `.vscode/settings.json` file with:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "prettier.singleQuote": true,
  "prettier.semi": true,
  "prettier.tabWidth": 2
}
```

### Environment Variables

Create a `.env` file in the api directory with these settings:

```
# API authentication
API_KEY=your-secret-key-for-development

# Database
DATABASE_PATH=./data/polisapp.sqlite

# Caching
CACHE_TTL=300
GEOCODING_CACHE_TTL=2592000

# Logging
LOG_LEVEL=debug
```

## Codebase Structure

The project follows a modular structure:

```
api/
├── data/                  # Database and data files
├── docs/                  # Documentation files
├── lib/                   # Core functionality
│   ├── api/               # API utilities
│   ├── cache/             # Caching system
│   ├── db/                # Database operations
│   ├── errors/            # Error handling
│   ├── events/            # Event processing
│   ├── geocoding/         # Geocoding service
│   ├── logging/           # Logging utilities
│   ├── middleware/        # API middleware
│   └── rss/               # RSS feed handling
├── pages/                 # Next.js pages
│   ├── api/               # API endpoints
│   │   ├── cron/          # Scheduled tasks
│   │   └── v1/            # API version 1
│   └── geocoding-dashboard/ # Monitoring UI
├── public/                # Static assets
├── scripts/               # Utility scripts
└── tests/                 # Testing files
    ├── fixtures/          # Test data
    ├── integration/       # Integration tests
    ├── performance/       # Performance tests
    └── unit/              # Unit tests
```

### Key Files

- `api/lib/config.js` - Main configuration
- `api/lib/db/database.js` - Database connection and schema
- `api/lib/geocoding/nominatim.js` - Geocoding implementation
- `api/lib/events/processor.js` - Event processing pipeline
- `api/lib/cache/index.js` - Caching system
- `api/pages/api/v1/events.js` - Main API endpoint
- `api/pages/geocoding-dashboard/index.js` - Monitoring dashboard

## Key Concepts

### Event Processing Flow

The system processes police events through this pipeline:

1. **RSS Fetching**: Retrieves event data from the Swedish Police RSS feed
2. **Parsing**: Converts XML data to structured events
3. **Location Extraction**: Extracts location names from event titles
4. **Geocoding**: Converts location names to coordinates
5. **Storage**: Saves processed events to the database
6. **Serving**: Makes events available via API endpoints

### Geocoding Strategy

A multi-tier geocoding approach ensures high success rates:

1. Local location database with Swedish cities, towns, and areas
2. Optimized lookup with exact matching, prefix search, and fuzzy matching
3. External Nominatim API as a fallback
4. Extensive caching of results

### Caching System

The system implements multiple caching layers:

1. **API Response Cache**: Caches complete API responses
2. **Geocoding Cache**: Long-lived cache for geocoding results
3. **RSS Feed Cache**: Prevents redundant RSS feed fetching

### Error Handling

A centralized error handling system provides:

1. **Structured Errors**: Custom error classes for different error types
2. **Consistent Responses**: Standard error response format
3. **Detailed Logging**: Contextual error logs with request IDs
4. **Recovery Strategies**: Automatic retry mechanisms for transient errors

## Development Workflow

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Run tests:
   ```bash
   npm test
   ```

4. Submit a pull request

### Code Style Guidelines

This project follows these coding standards:

- Use ES6+ features
- Use async/await for asynchronous code
- Use functional programming patterns where appropriate
- Document public functions and modules
- Follow the established error handling pattern
- Write unit tests for new functionality

### Commit Message Format

Use conventional commits:

```
type(scope): short description

Long description if needed
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation change
- `chore`: Build/config changes
- `refactor`: Code change (not a feature or bug fix)
- `test`: Adding or updating tests

Example:
```
feat(geocoding): add fuzzy matching for location names

Implemented Levenshtein distance algorithm to better handle misspelled
location names in police event titles.
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:performance

# Test specific components
npm run test:geocoding
npm run test:events
```

### Writing Tests

- Unit tests go in `tests/unit/`
- Integration tests go in `tests/integration/`
- Use Jest's built-in assertion library
- Mock external dependencies
- Use test fixtures from `tests/fixtures/`

Example test:
```javascript
// tests/unit/geocoding.test.js
import { geocodeLocation } from '../../lib/geocoding/nominatim.js';

describe('Geocoding Service', () => {
  test('should geocode a valid location', async () => {
    const result = await geocodeLocation('Stockholm');
    expect(result).toHaveProperty('lat');
    expect(result).toHaveProperty('lng');
    expect(result.lat).toBeCloseTo(59.329, 1);
    expect(result.lng).toBeCloseTo(18.068, 1);
  });
});
```

## Common Tasks

### Adding a New API Endpoint

1. Create a new file in `pages/api/v1/`
2. Implement the endpoint using the Next.js API route pattern
3. Use middleware for auth, validation, and error handling
4. Document the endpoint in `docs/api/README.md`

Example:
```javascript
// pages/api/v1/example.js
import { withErrorHandling } from '../../../lib/middleware/error-handler.js';
import { getDatabase } from '../../../lib/db/database.js';

async function handler(req, res) {
  const db = getDatabase();
  const results = db.prepare('SELECT * FROM example').all();
  
  res.status(200).json({
    success: true,
    data: results
  });
}

export default withErrorHandling(handler);
```

### Adding a New Location to the Database

1. Edit `scripts/add-custom-locations.js`
2. Add your location data
3. Run the script:
   ```bash
   npm run add:locations
   ```

### Implementing New Geocoding Features

1. Modify `lib/geocoding/nominatim.js` or create new modules in the geocoding directory
2. Update the geocoding index in `lib/geocoding/location-index.js`
3. Test with:
   ```bash
   npm run test:geocoding
   ```

### Debugging Tips

1. **Enable Debug Logging**:
   ```bash
   LOG_LEVEL=debug npm run dev
   ```

2. **Monitor API Requests**:
   Use the Network tab in browser DevTools

3. **Database Inspection**:
   Use SQLite browser tools to inspect `data/polisapp.sqlite`

4. **Test RSS Feed Parsing**:
   ```bash
   npm run test:rss
   ```

5. **Analyze Geocoding**:
   View the `/geocoding-dashboard/problematic` page

### Performance Profiling

1. **Run Performance Tests**:
   ```bash
   npm run test:performance
   ```

2. **Profile Event Processing**:
   ```bash
   npm run test:processing
   ```

3. **Benchmark Geocoding**:
   ```bash
   npm run benchmark:geocoding
   ```

## Getting Help

If you get stuck:

1. Check the documentation in the `docs/` directory
2. Look for similar issues in the issue tracker
3. Ask in the team chat
4. Contact the project maintainer

Happy coding! 