/**
 * Simple API Server
 * 
 * En förenklad API-server för att erbjuda de nödvändigaste funktionerna
 */

import { createServer } from 'http';
import { parse } from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCacheMetrics } from './lib/cache/index.js';
import { initializeServices } from './lib/startup.js';
import { getDatabase } from './lib/db/database.js';

// Konstanter
const PORT = process.env.API_PORT || 8888;
const HOSTNAME = 'localhost';

// Hämta package.json info
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Initialisera API-tjänster
console.log('Initialiserar API-tjänster...');
try {
  initializeServices();
  console.log('API-tjänster initialiserade');
} catch (err) {
  console.error('Fel vid initialisering av tjänster:', err);
}

// Endpoint handlers
const handlers = {
  // API status endpoint
  '/api/status': (req, res) => {
    try {
      // Hämta cache-statistik
      const cacheMetrics = getCacheMetrics();
      
      // Bygg respons
      const status = {
        status: 'ok',
        version: pkg.version,
        mode: 'simple-server',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        cache: {
          size: cacheMetrics.size,
          hits: cacheMetrics.totalHits,
          misses: cacheMetrics.totalMisses,
          hitRate: cacheMetrics.hitRate
        }
      };
      
      sendJsonResponse(res, 200, status);
    } catch (err) {
      console.error('Statusfel:', err);
      sendJsonResponse(res, 500, {
        status: 'error',
        error: err.message
      });
    }
  },
  
  // API docs endpoint
  '/api/docs': (req, res) => {
    try {
      const docs = {
        api: {
          name: pkg.name,
          version: pkg.version,
          description: pkg.description,
          mode: 'simple-server',
          endpoints: [
            {
              path: '/api/status',
              method: 'GET',
              description: 'Hämta API-status och hälsoinformation'
            },
            {
              path: '/api/docs',
              method: 'GET',
              description: 'Visa denna API-dokumentation'
            },
            {
              path: '/api/events',
              method: 'GET',
              description: 'Hämta händelser med filtrering',
              parameters: [
                { name: 'limit', type: 'number', description: 'Max antal händelser att returnera' },
                { name: 'location', type: 'string', description: 'Filtrera efter plats' }
              ]
            }
          ]
        }
      };
      
      sendJsonResponse(res, 200, docs);
    } catch (err) {
      console.error('Docsfel:', err);
      sendJsonResponse(res, 500, {
        status: 'error',
        error: err.message
      });
    }
  },
  
  // Events endpoint - hämta händelser
  '/api/events': (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const query = parsedUrl.query;
      
      // Hämta sökparametrar
      const limit = parseInt(query.limit, 10) || 50;
      const offset = parseInt(query.offset, 10) || 0;
      const location = query.location || null;
      
      // Hämta databas
      const db = getDatabase();
      
      // Bygg SQL-fråga
      let sql = 'SELECT * FROM events WHERE 1=1';
      const params = [];
      
      // Lägg till platsfilter om angivet
      if (location) {
        sql += ' AND location_name LIKE ?';
        params.push(`%${location}%`);
      }
      
      // Lägg till sortering och begränsning
      sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      // Kör frågan
      const events = db.prepare(sql).all(...params);
      
      // Räkna totala antalet matchande händelser
      let countSql = 'SELECT COUNT(*) as total FROM events WHERE 1=1';
      const countParams = [];
      
      if (location) {
        countSql += ' AND location_name LIKE ?';
        countParams.push(`%${location}%`);
      }
      
      const countResult = db.prepare(countSql).get(...countParams);
      const total = countResult ? countResult.total : 0;
      
      // Bygg respons
      const response = {
        total: total,
        limit: limit,
        offset: offset,
        events: events
      };
      
      sendJsonResponse(res, 200, response);
    } catch (err) {
      console.error('Eventsfel:', err);
      sendJsonResponse(res, 500, {
        status: 'error',
        error: err.message
      });
    }
  },
  
  // Catch-all för okända endpoints
  'default': (req, res) => {
    sendJsonResponse(res, 404, {
      status: 'error',
      error: 'Not found',
      message: `Endpoint '${req.url}' finns inte`
    });
  }
};

// Hjälpfunktion för att skicka JSON-respons
function sendJsonResponse(res, statusCode, data) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  res.statusCode = statusCode;
  res.end(JSON.stringify(data, null, 2));
}

// Skapa HTTP-server
const server = createServer((req, res) => {
  try {
    // Hantera OPTIONS-request för CORS
    if (req.method === 'OPTIONS') {
      sendJsonResponse(res, 200, {});
      return;
    }
    
    // Parsa URL
    const parsedUrl = parse(req.url, true);
    const path = parsedUrl.pathname;
    
    // Invoke handler
    console.log(`${req.method} ${path}`);
    const handler = handlers[path] || handlers['default'];
    handler(req, res);
  } catch (err) {
    console.error('Server error:', err);
    sendJsonResponse(res, 500, {
      status: 'error',
      error: 'Internal server error',
      message: err.message
    });
  }
});

// Starta servern
server.listen(PORT, HOSTNAME, () => {
  console.log(`API-server igång på http://${HOSTNAME}:${PORT}`);
}); 