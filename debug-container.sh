#!/bin/sh
# Container debug script

# Print environment
echo "Environment variables:"
env | sort

# Check if processes are running
echo "\nRunning processes:"
ps aux

# Check nginx config
echo "\nNginx configuration:"
nginx -T

# Check ports in use
echo "\nPorts in use:"
netstat -tulpn

# Check connectivity to the Node.js service
echo "\nChecking connection to Node.js (port 8888):"
curl -v http://localhost:8888/api/status

# Try to access the service checker
echo "\nChecking service checker (port 7777):"
curl -v http://localhost:7777/check

# Print logs
echo "\nNginx error log:"
tail -n 50 /var/log/nginx/error.log

echo "\nNginx access log:"
tail -n 50 /var/log/nginx/access.log

echo "\nContainer debug complete" 