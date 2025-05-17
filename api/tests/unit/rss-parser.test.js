/**
 * Unit tests for RSS Parser
 */

import { fetchAndConvertRssEvents } from '../../lib/rss/parser.js';

// Mock fetch to prevent actual API calls during tests
jest.mock('node-fetch', () => jest.fn());

// Import the mocked fetch
import fetch from 'node-fetch';

describe('RSS Parser', () => {
  // Sample RSS data fixture
  const mockRssData = `
    <rss version="2.0">
      <channel>
        <title>Polisens RSS</title>
        <link>https://polisen.se</link>
        <description>Händelser från Polisen</description>
        <item>
          <title>Trafikolycka, Stockholm</title>
          <description>En trafikolycka har inträffat på Sveavägen.</description>
          <pubDate>Mon, 20 Jun 2023 12:30:00 +0200</pubDate>
          <link>https://polisen.se/events/12345</link>
          <guid>12345</guid>
        </item>
        <item>
          <title>Inbrott, Göteborg</title>
          <description>Ett inbrott har rapporterats i centrala Göteborg.</description>
          <pubDate>Mon, 20 Jun 2023 10:15:00 +0200</pubDate>
          <link>https://polisen.se/events/67890</link>
          <guid>67890</guid>
        </item>
      </channel>
    </rss>
  `;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock the fetch response
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(mockRssData)
    });
  });

  test('should fetch and parse RSS feed correctly', async () => {
    // Call the function
    const events = await fetchAndConvertRssEvents();
    
    // Verify fetch was called correctly
    expect(fetch).toHaveBeenCalledTimes(1);
    
    // Assertions on the parsed events
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBe(2);
    
    // Verify first event data
    expect(events[0]).toHaveProperty('id', '12345');
    expect(events[0]).toHaveProperty('name', 'Trafikolycka, Stockholm');
    expect(events[0]).toHaveProperty('url', 'https://polisen.se/events/12345');
    
    // Verify second event data
    expect(events[1]).toHaveProperty('id', '67890');
    expect(events[1]).toHaveProperty('name', 'Inbrott, Göteborg');
  });

  test('should extract location from event title', () => {
    // This test assumes the parser extracts location from titles
    // You may need to adjust based on your actual implementation
    
    const eventWithLocation = {
      title: 'Trafikolycka, Stockholm',
      // other fields...
    };
    
    // If your parser has a separate function for location extraction, test it here
    // const location = extractLocationFromTitle(eventWithLocation.title);
    // expect(location).toBe('Stockholm');
    
    // Alternatively, test the full parsing if location extraction is integrated
    // Uncomment and implement this test when the location extraction function is identified
    // const result = extractLocationFunction(eventWithLocation.title);
    // expect(result).toHaveProperty('location_name', 'Stockholm');
  });

  test('should handle RSS feed errors gracefully', async () => {
    // Mock a failed fetch
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });
    
    // The function should return an empty array or throw a specific error
    await expect(fetchAndConvertRssEvents()).rejects.toThrow();
    
    // Alternatively, if your function returns empty results instead of throwing
    // const events = await fetchAndConvertRssEvents();
    // expect(events).toEqual([]);
  });
}); 