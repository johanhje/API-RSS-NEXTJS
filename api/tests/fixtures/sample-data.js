/**
 * Test fixtures with sample data
 */

// Sample RSS data
export const sampleRssData = `
<rss version="2.0">
  <channel>
    <title>Polisens RSS</title>
    <link>https://polisen.se</link>
    <description>Händelser från Polisen</description>
    <item>
      <title>Trafikolycka, Stockholm</title>
      <description>En trafikolycka har inträffat på Sveavägen. Tre bilar är inblandade.</description>
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
    <item>
      <title>Misshandel, Malmö</title>
      <description>En misshandel har skett i centrala Malmö.</description>
      <pubDate>Mon, 20 Jun 2023 09:45:00 +0200</pubDate>
      <link>https://polisen.se/events/24680</link>
      <guid>24680</guid>
    </item>
    <item>
      <title>Stöld, Uppsala</title>
      <description>En stöld har anmälts i Uppsala.</description>
      <pubDate>Mon, 20 Jun 2023 08:20:00 +0200</pubDate>
      <link>https://polisen.se/events/13579</link>
      <guid>13579</guid>
    </item>
    <item>
      <title>Brand, Västerås</title>
      <description>En brand har rapporterats i Västerås.</description>
      <pubDate>Sun, 19 Jun 2023 23:10:00 +0200</pubDate>
      <link>https://polisen.se/events/97531</link>
      <guid>97531</guid>
    </item>
  </channel>
</rss>
`;

// Sample events data for testing
export const sampleEvents = [
  {
    id: '12345',
    name: 'Trafikolycka, Stockholm',
    summary: 'En trafikolycka har inträffat på Sveavägen. Tre bilar är inblandade.',
    location_name: 'Stockholm',
    datetime: '2023-06-20T12:30:00+02:00',
    type: 'Trafikolycka',
    location_gps: '59.32938,18.06871',
    lat: 59.32938,
    lng: 18.06871,
    url: 'https://polisen.se/events/12345',
    timestamp: 1687257000,
    created_at: 1687257000
  },
  {
    id: '67890',
    name: 'Inbrott, Göteborg',
    summary: 'Ett inbrott har rapporterats i centrala Göteborg.',
    location_name: 'Göteborg',
    datetime: '2023-06-20T10:15:00+02:00',
    type: 'Inbrott',
    location_gps: '57.70887,11.97456',
    lat: 57.70887,
    lng: 11.97456,
    url: 'https://polisen.se/events/67890',
    timestamp: 1687248900,
    created_at: 1687248900
  },
  {
    id: '24680',
    name: 'Misshandel, Malmö',
    summary: 'En misshandel har skett i centrala Malmö.',
    location_name: 'Malmö',
    datetime: '2023-06-20T09:45:00+02:00',
    type: 'Misshandel',
    location_gps: '55.60587,13.00073',
    lat: 55.60587,
    lng: 13.00073,
    url: 'https://polisen.se/events/24680',
    timestamp: 1687247100,
    created_at: 1687247100
  },
  {
    id: '13579',
    name: 'Stöld, Uppsala',
    summary: 'En stöld har anmälts i Uppsala.',
    location_name: 'Uppsala',
    datetime: '2023-06-20T08:20:00+02:00',
    type: 'Stöld',
    location_gps: '59.85882,17.63889',
    lat: 59.85882,
    lng: 17.63889,
    url: 'https://polisen.se/events/13579',
    timestamp: 1687242000,
    created_at: 1687242000
  },
  {
    id: '97531',
    name: 'Brand, Västerås',
    summary: 'En brand har rapporterats i Västerås.',
    location_name: 'Västerås',
    datetime: '2023-06-19T23:10:00+02:00',
    type: 'Brand',
    location_gps: '59.61617,16.55276',
    lat: 59.61617,
    lng: 16.55276,
    url: 'https://polisen.se/events/97531',
    timestamp: 1687208400,
    created_at: 1687208400
  }
];

// Sample locations data
export const sampleLocations = [
  {
    name: 'Stockholm',
    lat: 59.32938,
    lng: 18.06871,
    count: 125
  },
  {
    name: 'Göteborg',
    lat: 57.70887,
    lng: 11.97456,
    count: 98
  },
  {
    name: 'Malmö',
    lat: 55.60587,
    lng: 13.00073,
    count: 87
  },
  {
    name: 'Uppsala',
    lat: 59.85882,
    lng: 17.63889,
    count: 45
  },
  {
    name: 'Västerås',
    lat: 59.61617,
    lng: 16.55276,
    count: 32
  }
];

// Sample event types data
export const sampleEventTypes = [
  {
    type: 'Trafikolycka',
    count: 256
  },
  {
    type: 'Stöld',
    count: 189
  },
  {
    type: 'Inbrott',
    count: 143
  },
  {
    type: 'Misshandel',
    count: 97
  },
  {
    type: 'Brand',
    count: 78
  },
  {
    type: 'Rattfylleri',
    count: 64
  }
];

// Sample system statistics
export const sampleStats = {
  total_events: 827,
  geocoded_events: 814,
  geocoding_success_rate: '98.4%',
  event_types: 12,
  locations: 95,
  last_update: '2023-06-20T13:45:00+02:00',
  cache_hit_rate: '94.7%',
  avg_processing_time: '156ms'
};

// Function to create a SQLite in-memory database with sample data
export function createTestDatabase(db) {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT,
      summary TEXT,
      location_name TEXT,
      datetime TEXT,
      type TEXT,
      location_gps TEXT,
      lat REAL,
      lng REAL,
      url TEXT,
      timestamp INTEGER,
      created_at INTEGER,
      last_updated INTEGER
    );
    
    CREATE INDEX IF NOT EXISTS idx_events_location ON events(location_name);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
    CREATE INDEX IF NOT EXISTS idx_events_datetime ON events(datetime);
  `);
  
  // Insert sample data
  const insertStmt = db.prepare(`
    INSERT INTO events (
      id, name, summary, location_name, datetime, type, 
      location_gps, lat, lng, url, timestamp, created_at
    ) VALUES (
      @id, @name, @summary, @location_name, @datetime, @type,
      @location_gps, @lat, @lng, @url, @timestamp, @created_at
    )
  `);
  
  // Insert each sample event
  sampleEvents.forEach(event => {
    insertStmt.run(event);
  });
  
  return db;
}

// Export a helper function to seed the test database
export async function seedTestDatabase(db) {
  return createTestDatabase(db);
} 