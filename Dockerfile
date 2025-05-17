FROM node:20-alpine

# Installera nödvändiga verktyg
RUN apk add --no-cache python3 make g++ sqlite

# Förbered arbetsmappen
WORKDIR /app

# Kopiera paketfiler
COPY api/package*.json ./api/

# Installera beroenden
RUN cd api && npm install

# Kopiera alla källfiler
COPY . .

# Bygg applikationen
RUN cd api && npm run build || echo "Byggfel, men fortsätter"

# Skapa datakatalog
RUN mkdir -p /app/api/data

# Exponera port 80
EXPOSE 80

# Startkommando
CMD PORT=80 HOSTNAME=0.0.0.0 NODE_ENV=production node api/simple-server.js 