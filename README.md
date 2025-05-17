# Swedish Police Events API

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/nodejs-18.x-green.svg)
![Next.js](https://img.shields.io/badge/nextjs-15.x-black.svg)

A RESTful API service that retrieves, geocodes, and provides data from the Swedish Police public RSS feed of events.

![Dashboard Preview](api/public/dashboard-preview.png)

## Key Features

- **Real-time Police Events**: Fetches the latest events from the official Swedish Police RSS feed
- **Geocoding**: Converts Swedish location names to coordinates with 99% accuracy
- **RESTful API**: Full-featured API with filtering, sorting, and pagination
- **High Performance**: Optimized geocoding with multi-level indexing and caching
- **Visualization Ready**: Structured data with coordinates for map plotting
- **Monitoring Dashboard**: Built-in system monitoring and statistics
- **Comprehensive Documentation**: Complete API and developer documentation

## Quick Links

- [API Documentation](api/docs/api/README.md)
- [System Architecture](api/docs/architecture/README.md)
- [Developer Guide](api/docs/developer/README.md)
- [Maintenance Guide](api/docs/maintenance/README.md)
- [Geocoding System](api/docs/geocoding/README.md)

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/API-RSS-NEXTJS.git
cd API-RSS-NEXTJS/api

# Install dependencies
npm install

# Start the development server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Using the API

#### Get all events

```bash
curl http://localhost:3000/api/v1/events
```

#### Get events with filtering

```bash
curl http://localhost:3000/api/v1/events?location=Stockholm&type=Trafikolycka
```

#### Get a single event

```bash
curl http://localhost:3000/api/v1/events/12345
```

#### Get all locations

```bash
curl http://localhost:3000/api/v1/locations
```

#### Get all event types

```bash
curl http://localhost:3000/api/v1/types
```

## Docker Deployment

### Standard Docker

```bash
# Build the Docker image
docker build -t police-events-api .

# Run the container
docker run -p 80:80 -d police-events-api
```

### Using Docker Compose

```bash
# Build and start the container
docker-compose up -d
```

### Deployment with Coolify

This project is configured for easy deployment with Coolify:

1. Connect your GitHub repository to Coolify
2. Create a new service with the following settings:
   - **Build Method**: Dockerfile (auto-detected)
   - **Docker Compose**: Yes, use the included docker-compose.yml
   - **Port**: 80
   - **Environment Variables**: No additional variables required

Coolify will automatically:
- Build the Docker image
- Start the container
- Expose the API at your configured domain

## Project Structure

```
API-RSS-NEXTJS/
├── api/                  # Next.js API application
│   ├── data/             # Database and data files
│   ├── docs/             # Documentation
│   ├── lib/              # Core functionality
│   ├── pages/            # Next.js pages and API routes
│   ├── public/           # Static assets
│   ├── scripts/          # Utility scripts
│   └── tests/            # Test files
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile            # Docker build instructions
├── LICENSE               # License file
└── README.md             # This file
```

## API Endpoints

| Endpoint                | Description                        | Query Parameters                |
|-------------------------|------------------------------------|--------------------------------|
| GET /api/v1/events      | Get a list of events              | page, pageSize, location, type, etc. |
| GET /api/v1/events/:id  | Get a single event                | -                               |
| GET /api/v1/locations   | Get all unique locations          | -                               |
| GET /api/v1/types       | Get all event types with counts   | -                               |
| GET /api/v1/stats       | Get system statistics             | -                               |
| GET /api/status         | Get system health status          | -                               |
| POST /api/cron/update-events | Trigger an RSS feed update   | Requires API key                |

For complete API documentation, see the [API Documentation](api/docs/api/README.md).

## Monitoring

Access the monitoring dashboard at [http://your-domain/geocoding-dashboard](http://your-domain/geocoding-dashboard)

## Performance

The system is optimized for performance with:

- In-memory caching with TTL
- Optimized location indexing
- Efficient SQLite queries
- Batch geocoding with parallel processing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Swedish Police for providing the public RSS feed
- OpenStreetMap Nominatim for geocoding services 