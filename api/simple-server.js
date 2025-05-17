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

// Konstanterna
const PORT = process.env.PORT || process.env.API_PORT || 8888;
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
const BASE_PATH = process.env.BASE_PATH || '';

// Detaljerad uppstartsloggning
console.log('=========================================');
console.log(`STARTING SERVER ON ${HOSTNAME}:${PORT}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Base path: "${BASE_PATH}"`);
console.log(`Working directory: ${process.cwd()}`);
console.log(`Process ID: ${process.pid}`);
console.log(`Available environment variables: ${Object.keys(process.env).join(', ')}`);
console.log('=========================================');

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
console.log(`Checking package.json at: ${pkgPath}`);

let pkg;
try {
  pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  console.log(`Package version: ${pkg.version}`);
} catch (error) {
  console.error(`Error reading package.json: ${error.message}`);
  pkg = { version: 'unknown', name: 'api-server', description: 'API Server' };
}

// Initialisera API-tjänster
console.log(`Initialiserar API-tjänster på ${HOSTNAME}:${PORT}...`);
try {
  initializeServices();
  console.log('API-tjänster initialiserade');
} catch (error) {
  console.error('Fel vid initialisering av tjänster:', error);
}

// Verifiera att databaskatalogen finns
try {
  const dataDir = path.join(__dirname, 'data');
  console.log(`Checking data directory: ${dataDir}`);
  if (fs.existsSync(dataDir)) {
    console.log(`Data directory exists, contents: ${fs.readdirSync(dataDir).join(', ')}`);
  } else {
    console.warn(`Data directory does not exist at ${dataDir}`);
    console.log('Creating data directory...');
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (error) {
  console.error(`Error checking data directory: ${error.message}`);
}

// Endpoint handlers
const handlers = {
  // API status endpoint
  '/api/status': (req, res) => {
    try {
      console.log('Handling status request');
      
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
      console.log('Handling docs request');
      
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
      console.log('Handling scheduler status request');
      
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
      console.log('Handling force sync request');
      
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
      console.log('Handling events request');
      
      const parsedUrl = parse(req.url, true);
      const query = parsedUrl.query;
      
      // Hämta sökparametrar
      const limit = parseInt(query.limit, 10) || 50;
      const offset = parseInt(query.offset, 10) || 0;
      const location = query.location || null;
      
      console.log(`Events query - limit: ${limit}, offset: ${offset}, location: ${location}`);
      
      // Hämta databas
      let db;
      try {
        db = getDatabase();
        console.log('Database connection established');
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
      
      console.log(`Executing SQL: ${sql} with params: ${params.join(', ')}`);
      
      // Kör frågan
      const events = db.prepare(sql).all(...params);
      console.log(`Found ${events.length} events`);
      
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

/**
 * Sätt standardheaders för CORS och caching
 * @param {http.ServerResponse} res - HTTP-response
 */
function setDefaultHeaders(res) {
  // CORS-headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version');
  
  // Caching-headers
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
}

// Skapa HTTP-server
const server = createServer((req, res) => {
  // Sätt standard-headers för CORS och caching
  setDefaultHeaders(res);

  // Hantera OPTIONS-förfrågan
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Parsera URL:en
  const parsedUrl = parse(req.url || '/', true);
  
  // Ta bort BASE_PATH från pathname om det behövs 
  let pathname = parsedUrl.pathname || '/';
  if (BASE_PATH && pathname.startsWith(BASE_PATH)) {
    pathname = pathname.substring(BASE_PATH.length);
  }
  
  // Se till att pathname börjar med '/'
  if (!pathname.startsWith('/')) {
    pathname = '/' + pathname;
  }

  console.log(`${req.method} ${pathname} (original: ${parsedUrl.pathname}) from ${req.socket.remoteAddress}`);

  // Matcha endpoint eller skicka 404
  try {
    // Kontrollera om vi har en handler för denna pathname
    const handler = handlers[pathname];
    if (handler) {
      handler(req, res, parsedUrl.query);
    } else {
      // Kolla om vi har en handler för denna pathname utan trailing slash
      const pathnameNoSlash = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname + '/';
      const handlerNoSlash = handlers[pathnameNoSlash];

      if (handlerNoSlash) {
        handlerNoSlash(req, res, parsedUrl.query);
      } else {
        // Skicka 404 Not Found
        console.log(`No handler found for ${pathname}`);
        res.statusCode = 404;
        sendJsonResponse(res, 404, {
          error: 'Not Found',
          message: `Endpoint ${pathname} not found`,
          endpoints: Object.keys(handlers)
        });
      }
    }
  } catch (error) {
    console.error(`Error processing request for ${pathname}:`, error);
    res.statusCode = 500;
    sendJsonResponse(res, 500, {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request'
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