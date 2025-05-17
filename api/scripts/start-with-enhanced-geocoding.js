/**
 * Start API with Enhanced Geocoding
 * 
 * This script initializes the API with the expanded Swedish location database
 * for improved geocoding performance.
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

// Initialize Next.js app
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Import the expanded location database
import { EXPANDED_LOCATION_DATABASE } from '../lib/geocoding/expanded-location-database.js';

// Log startup information
console.log('Starting API with enhanced geocoding database...');
console.log(`Enhanced location database contains ${Object.keys(EXPANDED_LOCATION_DATABASE).length} Swedish locations`);

// Prepare and start the server
app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
    console.log('> Enhanced geocoding enabled');
  });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down API server...');
  process.exit(0);
}); 