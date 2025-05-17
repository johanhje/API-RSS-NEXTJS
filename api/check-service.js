// Simple status check for Node.js service
// This file helps verify that the Node.js service is running inside the container

import http from 'http';

const checkNodeService = async () => {
  try {
    const options = {
      hostname: 'localhost',
      port: 8888,
      path: '/api/status',
      method: 'GET',
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, res => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              status: 'success',
              message: 'Node.js service is running',
              statusCode: res.statusCode,
              response: data
            });
          } else {
            resolve({
              status: 'error',
              message: `Node.js service returned status code ${res.statusCode}`,
              statusCode: res.statusCode,
              response: data
            });
          }
        });
      });
      
      req.on('error', error => {
        resolve({
          status: 'error',
          message: 'Failed to connect to Node.js service',
          error: error.message
        });
      });
      
      req.end();
    });
  } catch (error) {
    return {
      status: 'error',
      message: 'Error checking Node.js service',
      error: error.message
    };
  }
};

// Create a simple HTTP server to expose the check results
const server = http.createServer(async (req, res) => {
  if (req.url === '/check') {
    const result = await checkNodeService();
    
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(result, null, 2));
  } else {
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(`
      <html>
        <head><title>Service Checker</title></head>
        <body>
          <h1>Service Checker</h1>
          <p>Visit <a href="/check">/check</a> to check the Node.js service status</p>
        </body>
      </html>
    `);
  }
});

const PORT = 7777;
server.listen(PORT, () => {
  console.log(`Service checker running at http://localhost:${PORT}`);
});

// Print environment variables to help with debugging
console.log('Environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('API_PORT:', process.env.API_PORT);
console.log('HOSTNAME:', process.env.HOSTNAME); 