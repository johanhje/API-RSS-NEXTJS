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
const PORT = process.env.PORT || process.env.API_PORT || 8888;
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

// Förhindra att servern kraschar på oväntade fel
process.on('uncaughtException', (err) => {
  console.error('Oväntad händelse som förhindrades från att krascha servern:', err);
});

// Hantera okontrollerade löften
process.on('unhandledRejection', (reason, promise) => {
  console.error('Ohanterad löftesavvisning:', reason);
});

// Hämta package.json info
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Initialisera API-tjänster
console.log(`Initialiserar API-tjänster på ${HOSTNAME}:${PORT}...`);
try {
  initializeServices();
  console.log('API-tjänster initialiserade');
} catch (error) {
  console.error('Fel vid initialisering av tjänster:', error);
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
            },
            {
              path: '/api/scheduler',
              method: 'GET',
              description: 'Visa schemaläggningsstatus och synkroniseringsinformation'
            },
            {
              path: '/api/scheduler/sync',
              method: 'POST',
              description: 'Tvinga fram en fullständig synkronisering av RSS-data'
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
  
  // Scheduler status endpoint
  '/api/scheduler': (req, res) => {
    try {
      // Importera schemaläggningsmodulen
      import('./lib/rss/scheduler.js').then(({ getSchedulerStatus }) => {
        const status = getSchedulerStatus();
        sendJsonResponse(res, 200, status);
      }).catch(err => {
        console.error('Fel vid hämtning av schemaläggningsstatus:', err);
        sendJsonResponse(res, 500, {
          status: 'error',
          error: err.message
        });
      });
    } catch (err) {
      console.error('Schemaläggningsfel:', err);
      sendJsonResponse(res, 500, {
        status: 'error',
        error: err.message
      });
    }
  },
  
  // Force sync endpoint
  '/api/scheduler/sync': (req, res) => {
    // Endast tillåta POST-anrop för denna operation
    if (req.method !== 'POST') {
      sendJsonResponse(res, 405, {
        status: 'error',
        error: 'Method not allowed',
        message: 'Only POST method is supported for this endpoint'
      });
      return;
    }
    
    try {
      // Importera schemaläggningsmodulen och tvinga synkronisering
      import('./lib/rss/scheduler.js').then(({ forceSyncNow }) => {
        forceSyncNow().then(result => {
          sendJsonResponse(res, 200, {
            status: 'success',
            message: 'RSS sync triggered successfully',
            result
          });
        }).catch(err => {
          console.error('Fel vid synkronisering:', err);
          sendJsonResponse(res, 500, {
            status: 'error',
            error: err.message
          });
        });
      }).catch(err => {
        console.error('Fel vid hämtning av schemaläggningsmodul:', err);
        sendJsonResponse(res, 500, {
          status: 'error',
          error: err.message
        });
      });
    } catch (err) {
      console.error('Synkroniseringsfel:', err);
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
      let db;
      try {
        db = getDatabase();
      } catch (err) {
        console.error('Databasfel:', err);
        sendJsonResponse(res, 500, {
          status: 'error',
          error: 'Databasproblem: ' + err.message
        });
        return;
      }
      
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
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.statusCode = statusCode;
    res.end(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fel vid skickning av svar:', err);
    try {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal server error' }));
    } catch (finalErr) {
      console.error('Kritiskt fel vid skickning av svar:', finalErr);
    }
  }
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

// Håll servern igång och förhindra avslutning
if (process.env.NODE_ENV !== 'development') {
  // Förhindra SIGINT (Ctrl+C) i produktionsmiljö
  process.on('SIGINT', () => {
    console.log('Mottog SIGINT. Servern fortsätter att köras.');
  });
}

console.log('Server fully initialized and ready for requests.'); 