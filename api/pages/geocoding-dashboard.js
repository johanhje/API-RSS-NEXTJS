import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function GeocodingDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/geocoding-stats');
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        setStats(data.stats);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchData();
    // Set up a refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container">
        <Head>
          <title>Geocoding Dashboard - Loading</title>
        </Head>
        <main>
          <h1>Geocoding Dashboard</h1>
          <p>Loading statistics...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <Head>
          <title>Geocoding Dashboard - Error</title>
        </Head>
        <main>
          <h1>Geocoding Dashboard</h1>
          <p className="error">Error: {error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="container">
      <Head>
        <title>Geocoding Dashboard</title>
        <meta name="description" content="Monitoring dashboard for Swedish location geocoding" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Geocoding Dashboard</h1>
        <div className="stats-overview">
          <div className="stat-card">
            <h2>Overall Success Rate</h2>
            <div className="stat-value">{stats.success_rate}</div>
            <div className="stat-detail">
              {stats.geocoded_events} / {stats.total_events} events geocoded
            </div>
          </div>
        </div>

        <div className="stats-section">
          <h2>Location Type Statistics</h2>
          <table>
            <thead>
              <tr>
                <th>Location Type</th>
                <th>Total</th>
                <th>Failed</th>
                <th>Failure Rate</th>
              </tr>
            </thead>
            <tbody>
              {stats.location_type_stats.map((type, index) => (
                <tr key={index}>
                  <td>{type.location_type}</td>
                  <td>{type.total}</td>
                  <td>{type.failed}</td>
                  <td>{type.failure_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="stats-grid">
          <div className="stats-section">
            <h2>Most Common Problem Locations</h2>
            <table>
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {stats.problem_locations.map((location, index) => (
                  <tr key={index}>
                    <td>{location.location_name}</td>
                    <td>{location.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="stats-section">
            <h2>Recent Failures</h2>
            <table>
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_failures.map((failure, index) => (
                  <tr key={index}>
                    <td>{failure.location_name}</td>
                    <td>{new Date(failure.datetime).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
        }
        
        main {
          width: 100%;
        }
        
        h1 {
          margin-bottom: 2rem;
          font-size: 2rem;
          color: #333;
        }
        
        h2 {
          margin-bottom: 1rem;
          font-size: 1.5rem;
          color: #555;
        }
        
        .stats-overview {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        
        .stat-card {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          flex: 1;
        }
        
        .stat-value {
          font-size: 2.5rem;
          font-weight: bold;
          color: #2563eb;
          margin: 0.5rem 0;
        }
        
        .stat-detail {
          color: #666;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        
        .stats-section {
          margin-bottom: 2rem;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        
        th, td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        th {
          background-color: #f8f9fa;
          font-weight: 600;
        }
        
        tr:hover {
          background-color: #f1f5f9;
        }
        
        .error {
          color: #dc2626;
          padding: 1rem;
          background-color: #fee2e2;
          border-radius: 4px;
        }
        
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
} 