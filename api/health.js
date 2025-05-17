// Simple health check for API
console.log('Starting health check...');
console.log('Node.js version:', process.version);
console.log('Environment:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- API_PORT:', process.env.API_PORT);
console.log('- HOSTNAME:', process.env.HOSTNAME);

// Check for SQLite
const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, 'data');

console.log('Checking data directory:', dataDir);
if (fs.existsSync(dataDir)) {
  console.log('Data directory exists');
  const files = fs.readdirSync(dataDir);
  console.log('Files in data directory:', files);
} else {
  console.log('Data directory does not exist');
}

// Try to create a simple HTTP server
const http = require('http');
const PORT = 8889;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    message: 'Health check server is running',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      API_PORT: process.env.API_PORT,
      HOSTNAME: process.env.HOSTNAME
    }
  }));
});

// No need to actually start the server during build
console.log('Would start health check server in runtime environment');

// Exit immediately to avoid hanging during build
console.log('Health check complete');
process.exit(0); 