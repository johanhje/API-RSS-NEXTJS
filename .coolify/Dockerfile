FROM node:20-alpine

# Install required tools
RUN apk add --no-cache python3 make g++ sqlite nginx supervisor

# Prepare working directory
WORKDIR /app

# Copy package files
COPY api/package*.json ./api/

# Install dependencies
RUN cd api && npm install

# Copy all source files
COPY . .

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create supervisord configuration
RUN echo '[supervisord]\nnodaemon=true\n\n[program:nginx]\ncommand=nginx -g "daemon off;"\n\n[program:node]\ncommand=node /app/api/simple-server.js\nenvironment=PORT=8888,HOSTNAME=0.0.0.0,NODE_ENV=production' > /etc/supervisord.conf

# Build the application
RUN cd api && npm run build || echo "Build error, continuing anyway"

# Create data directory
RUN mkdir -p /app/api/data

# Expose port
EXPOSE 80

# Start command
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"] 