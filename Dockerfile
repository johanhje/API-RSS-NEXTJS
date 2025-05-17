FROM node:20-alpine

# Installera nödvändiga verktyg
RUN apk add --no-cache python3 make g++ sqlite nginx supervisor

# Förbered arbetsmappen
WORKDIR /app

# Kopiera paketfiler
COPY api/package*.json ./api/

# Installera beroenden
RUN cd api && npm install

# Kopiera alla källfiler
COPY . .

# Kopiera nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Skapa supervisord konfiguration
RUN echo '[supervisord]\nnodaemon=true\n\n[program:nginx]\ncommand=nginx -g "daemon off;"\n\n[program:node]\ncommand=node /app/api/simple-server.js\nenvironment=PORT=8888,HOSTNAME=0.0.0.0,NODE_ENV=production' > /etc/supervisord.conf

# Bygg applikationen
RUN cd api && npm run build || echo "Byggfel, men fortsätter"

# Skapa datakatalog
RUN mkdir -p /app/api/data

# Exponera port
EXPOSE 80

# Startkommando
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"] 