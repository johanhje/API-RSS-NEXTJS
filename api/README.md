# Polis API

Detta är ett Next.js-baserat API som hämtar polishändelser från Polisens RSS-flöde och tillhandahåller dem i ett strukturerat format. API:et är en migrering från en tidigare Python-implementation och matchar exakt samma struktur och format för att säkerställa kompatibilitet med befintliga klienter.

## Funktioner

- Hämtar och tolkar händelser från Polisens RSS-flöde
- Matchar händelser mot befintlig data för att undvika duplicering
- Lägger till geografiska koordinater via OpenStreetMap Nominatim
- Stöder flerspråkig översättning av händelser
- Bibehåller samma API-struktur som den tidigare Python-implementationen
- Schemalagd synkronisering för att hålla databasen uppdaterad

## Installation

```bash
# Installera beroenden
npm install

# Bygg projektet
npm run build

# Starta API:et
npm start
```

## Användning

### API-endpoints

- `GET /api` - API-information och status
- `GET /api/events` - Lista alla händelser
- `GET /api/events?limit=10&offset=0` - Paginerade händelser
- `GET /api/events?language=en` - Händelser på specifikt språk
- `GET /api/events/:id` - Hämta en specifik händelse med ID
- `POST /api/sync` - Manuell synkronisering av RSS-flödet

### Exempel

```javascript
// Hämta de senaste 20 händelserna
fetch('http://localhost:3000/api/events?limit=20')
  .then(response => response.json())
  .then(data => console.log(data));

// Hämta händelser på engelska
fetch('http://localhost:3000/api/events?language=en')
  .then(response => response.json())
  .then(data => console.log(data));

// Synkronisera RSS-flödet manuellt
fetch('http://localhost:3000/api/sync', { method: 'POST' })
  .then(response => response.json())
  .then(data => console.log(data));
```

## Konfiguration

API:et använder följande konfigurationsinställningar som kan ställas in via miljövariabler:

- `DB_PATH` - Sökväg till SQLite-databasen
- `RSS_FEED_URL` - URL till Polisens RSS-flöde
- `NOMINATIM_BASE_URL` - URL till Nominatim geocoding-tjänsten
- `RSS_FETCH_INTERVAL` - Intervall för RSS-synkronisering i sekunder

## Utveckling

För att köra API:et i utvecklingsläge:

```bash
npm run dev
```

För att köra den schemalagda synkroniseringen separat:

```bash
node scripts/sync-scheduler.js
```

## Databas

API:et använder samma SQLite-databas som den tidigare Python-implementationen. Detta säkerställer att all befintlig data bevaras och att nya händelser matchas korrekt.
