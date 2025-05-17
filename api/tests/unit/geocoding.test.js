/**
 * Unit tests for Geocoding Service
 */

import { geocodeLocation, findByExactName, findByFuzzyMatch } from '../../lib/geocoding/nominatim.js';
import { findLocation } from '../../lib/geocoding/location-index.js';

// Mock fetch to prevent actual API calls during tests
jest.mock('node-fetch', () => jest.fn());

// Import the mocked fetch
import fetch from 'node-fetch';

describe('Geocoding Service', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock successful fetch response with Stockholm coordinates
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([
        {
          lat: '59.32938',
          lon: '18.06871',
          display_name: 'Stockholm, Stockholms län, Sweden'
        }
      ])
    });
  });

  describe('geocodeLocation', () => {
    test('should geocode a location correctly', async () => {
      // Call the function
      const result = await geocodeLocation('Stockholm');
      
      // Verify fetch was called
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // Assertions on the geocoding result
      expect(result).toHaveProperty('lat', 59.32938);
      expect(result).toHaveProperty('lon', 18.06871);
    });

    test('should return null for invalid locations', async () => {
      // Mock empty response for invalid location
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([])
      });
      
      // Call the function with invalid location
      const result = await geocodeLocation('InvalidLocationXYZ');
      
      // Result should be null
      expect(result).toBeNull();
    });

    test('should handle API errors gracefully', async () => {
      // Mock API error
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      // Function should return null or throw specific error
      const result = await geocodeLocation('Stockholm');
      expect(result).toBeNull();
    });
  });

  describe('Location Index', () => {
    test('findByExactName should find exact matches', () => {
      // This test depends on your actual implementation
      // and pre-loaded location database
      const result = findByExactName('stockholm');
      
      // If the location exists in your database, it should be found
      expect(result).not.toBeNull();
      
      // For a non-existent location, it should return null
      const nonExistent = findByExactName('NonExistentCity123');
      expect(nonExistent).toBeNull();
    });

    test('findByFuzzyMatch should find similar locations', () => {
      // Test fuzzy matching with a misspelled location
      const results = findByFuzzyMatch('Stokholm', 2);
      
      // Should find Stockholm despite the typo
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name.toLowerCase()).toContain('stockholm');
    });

    test('findLocation should use progressive search strategy', () => {
      // Test the main function that combines various search strategies
      const result = findLocation('Stockholm');
      
      // Should find the location
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('lat');
      expect(result).toHaveProperty('lon');
      
      // Test with a misspelled location
      const fuzzyResult = findLocation('Stokholm', { tryFuzzy: true });
      expect(fuzzyResult).not.toBeNull();
    });
  });
}); 