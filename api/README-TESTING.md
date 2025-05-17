# Testing Suite Documentation

This document describes the comprehensive testing suite implemented for the Swedish Police Events API.

## Overview

The testing suite is designed to ensure reliability, performance, and compatibility of the API. It includes:

1. **Unit Tests** - For individual components and functions
2. **Integration Tests** - For end-to-end workflows and API endpoints
3. **Performance Tests** - For performance benchmarks and optimization validation
4. **Fixtures** - Reusable test data

## Test Structure

```
tests/
├── fixtures/          # Shared test data
│   └── sample-data.js
├── integration/       # Integration tests
│   └── api-endpoints.test.js
├── performance/       # Performance benchmarks
│   └── geocoding-performance.test.js
├── unit/              # Unit tests for individual components
│   ├── cache.test.js
│   ├── geocoding.test.js
│   └── rss-parser.test.js
└── setup.js           # Global test setup
```

## Running Tests

Several npm scripts are provided to run the tests:

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Generate test coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only performance tests
npm run test:performance

# Run tests in CI environment
npm run test:ci
```

## Test Coverage

The tests cover the following critical components:

1. **RSS Parser**
   - Fetching and parsing RSS feeds
   - Extracting location information
   - Error handling

2. **Geocoding Service**
   - Location lookup
   - Optimized index performance
   - Fuzzy matching
   - Batch processing

3. **API Endpoints**
   - Events list endpoint
   - Single event endpoint
   - Locations endpoint
   - Types endpoint
   - Batch geocoding endpoint

4. **Caching System**
   - General caching
   - Geocoding-specific caching
   - Performance metrics

## Test Database

Tests use an in-memory SQLite database for isolation and performance. Sample data is loaded as needed.

## Mocking

External dependencies are mocked to avoid network calls:

- `node-fetch` - For RSS feed fetching and Nominatim API calls
- API routes - Using Next.js `apiResolver` for testing without a server

## Fixtures

Reusable test data is available in `tests/fixtures/sample-data.js`:

- Sample RSS data
- Sample events data
- Sample locations data
- Sample event types data
- Sample system statistics

## Adding New Tests

When adding new functionality, please also add corresponding tests:

1. **Unit Tests** - For new functions and components
2. **Integration Tests** - For new API endpoints
3. **Performance Tests** - For performance-critical features

## Configuration

Test configuration is in `jest.config.js`:

- Tests run in Node.js environment
- Code coverage reports are generated
- Babel is used for modern JavaScript support
- Custom matchers are available in `tests/setup.js`

## Performance Testing Guidelines

Performance tests are designed to:

1. Establish baseline performance metrics
2. Detect regressions
3. Validate optimizations

Assertions in performance tests are intentionally lenient to account for variations in test environments. 