/**
 * Custom Next.js Server
 * 
 * Allows us to initialize our services when the server starts
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initializeServices } from './lib/startup.js';

// Configure Next.js
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.API_HOST || 'localhost';
const port = parseInt(process.env.API_PORT || '8888', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Initialize our services
  console.log('Initializing API services before starting server...');
  try {
    initializeServices();
    
    // Create the HTTP server
    const server = createServer(async (req, res) => {
      try {
        // Parse the URL
        const parsedUrl = parse(req.url, true);
        
        // Let Next.js handle the request
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
    
    // Start listening
    server.listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  } catch (err) {
    console.error('Error initializing services:', err);
    process.exit(1);
  }
}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
}); 