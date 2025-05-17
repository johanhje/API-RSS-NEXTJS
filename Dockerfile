FROM node:20-alpine

# Basic tools only
RUN apk add --no-cache python3 make g++ sqlite curl

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY api/package*.json ./api/
RUN cd api && npm install

# Copy source files
COPY . .

# Create data directory
RUN mkdir -p /app/api/data

# Run health check
RUN node api/health.js

# Test port accessibility
RUN echo "Testing server will use port: $PORT (env var) or 8888 (default)"

# Expose port to the host
EXPOSE 8888

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8888
ENV HOSTNAME=0.0.0.0

# Start command - use simple-server directly
CMD ["node", "api/simple-server.js"] 