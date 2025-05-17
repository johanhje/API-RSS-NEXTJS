FROM node:20-alpine

# Installera nödvändiga verktyg
RUN apk add --no-cache python3 make g++ sqlite

# Skapa app-katalog
WORKDIR /app

# Kopiera paketfiler
COPY package*.json ./
COPY api/package*.json ./api/

# Installera beroenden
RUN cd api && npm install

# Kopiera källkod
COPY . .

# Bygg applikationen
RUN cd api && npm run build

# Exponera port 80
EXPOSE 80

# Skapa datakatalog
RUN mkdir -p /app/api/data

# Kör servern
CMD ["sh", "-c", "cd api && PORT=80 HOSTNAME=0.0.0.0 NODE_ENV=production node simple-server.js"] 