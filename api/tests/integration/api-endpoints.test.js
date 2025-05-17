/**
 * Integration tests for API endpoints
 */

import { createServer } from 'http';
import { apiResolver } from 'next/dist/server/api-utils/node';
import supertest from 'supertest';
import eventsHandler from '../../pages/api/v1/events.js';
import eventHandler from '../../pages/api/v1/events/[id].js';
import locationsHandler from '../../pages/api/v1/locations.js';
import typesHandler from '../../pages/api/v1/types.js';
import statsHandler from '../../pages/api/v1/stats.js';
import batchGeocodeHandler from '../../pages/api/v1/batch-geocode.js';
import { getDatabase } from '../../lib/db/database.js';

// Helper function to create a test server for a Next.js API route
function createTestServer(handler) {
  const server = createServer((req, res) => {
    return apiResolver(req, res, undefined, handler, {}, false);
  });
  return supertest(server);
}

describe('API Endpoints', () => {
  let db;

  beforeAll(async () => {
    // Get database instance (use in-memory DB defined in setup.js)
    db = getDatabase();
    
    // Seed the database with test data if needed
    // This depends on your actual implementation
    // await seedTestDatabase();
  });

  afterAll(async () => {
    // Clean up any resources
    db.close();
  });

  describe('GET /api/v1/events', () => {
    let request;
    
    beforeAll(() => {
      request = createTestServer(eventsHandler);
    });
    
    test('should return a list of events', async () => {
      const response = await request.get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Check pagination properties
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('pageSize');
    });
    
    test('should support pagination', async () => {
      const response = await request.get('/?page=2&pageSize=10');
      
      expect(response.status).toBe(200);
      expect(response.body.pagination).toHaveProperty('page', 2);
      expect(response.body.pagination).toHaveProperty('pageSize', 10);
    });
    
    test('should support filtering by location', async () => {
      const response = await request.get('/?location=Stockholm');
      
      expect(response.status).toBe(200);
      // All returned events should have Stockholm as location
      response.body.data.forEach(event => {
        expect(event.location_name).toBe('Stockholm');
      });
    });
  });

  describe('GET /api/v1/events/:id', () => {
    let request;
    
    beforeAll(() => {
      request = createTestServer(eventHandler);
    });
    
    test('should return a single event by ID', async () => {
      // This assumes you have an event with ID 1 in your test database
      const response = await request.get('/?id=1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', '1');
    });
    
    test('should return 404 for non-existent event', async () => {
      const response = await request.get('/?id=999999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/locations', () => {
    let request;
    
    beforeAll(() => {
      request = createTestServer(locationsHandler);
    });
    
    test('should return a list of unique locations', async () => {
      const response = await request.get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Each location should have coordinates
      response.body.data.forEach(location => {
        expect(location).toHaveProperty('name');
        expect(location).toHaveProperty('lat');
        expect(location).toHaveProperty('lng');
        expect(location).toHaveProperty('count');
      });
    });
  });

  describe('POST /api/v1/batch-geocode', () => {
    let request;
    
    beforeAll(() => {
      request = createTestServer(batchGeocodeHandler);
    });
    
    test('should geocode multiple locations', async () => {
      const response = await request
        .post('/')
        .send({
          locations: ['Stockholm', 'Göteborg', 'Malmö']
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBe(3);
      
      // Check the first result has coordinates
      expect(response.body.results[0]).toHaveProperty('location', 'Stockholm');
      expect(response.body.results[0]).toHaveProperty('success');
      expect(response.body.results[0]).toHaveProperty('coordinates');
    });
    
    test('should validate request payload', async () => {
      // Missing locations array
      const response = await request
        .post('/')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 