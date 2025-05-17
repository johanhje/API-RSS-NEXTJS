import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

/**
 * Problematic Locations Dashboard Page
 */
export default function ProblematicLocations() {
  // State for problematic locations data
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(100);

  // Fetch problematic locations
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/problematic-locations?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch problematic locations');
      }
      const data = await response.json();
      setLocations(data.locations);
      setError(null);
    } catch (err) {
      console.error('Error fetching problematic locations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchLocations();
  }, [limit]);

  return (
    <div className="dashboard-container">
      <Head>
        <title>Problematic Locations - Swedish Police Events</title>
        <meta name="description" content="Problematic locations that failed geocoding" />
        <link rel="icon" href="/favicon.ico" />
        {/* Add Bootstrap CSS */}
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" 
          rel="stylesheet" 
          integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" 
          crossOrigin="anonymous"
        />
      </Head>

      {/* Add Navbar */}
      <Navbar />

      <main className="container my-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="mb-0">Problematic Locations</h1>
          <Link href="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>

        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Locations that Failed Geocoding</h5>
            <div className="d-flex align-items-center">
              <label htmlFor="limit" className="me-2">Show:</label>
              <select 
                id="limit" 
                className="form-select form-select-sm" 
                style={{ width: 'auto' }}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value="50">50 locations</option>
                <option value="100">100 locations</option>
                <option value="250">250 locations</option>
                <option value="500">500 locations</option>
              </select>
              <button 
                className="btn btn-sm btn-outline-primary ms-2" 
                onClick={fetchLocations}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                Error: {error}
              </div>
            )}

            {loading ? (
              <div className="d-flex justify-content-center my-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : locations.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Location Name</th>
                      <th>Count</th>
                      <th>Try Geocoding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map((location, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{location.location_name}</td>
                        <td>{location.count}</td>
                        <td>
                          <a 
                            href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(location.location_name + ', Sweden')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-secondary"
                          >
                            Try on OSM
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-success">No problematic locations found!</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            Troubleshooting Tips
          </div>
          <div className="card-body">
            <h5 className="card-title">Common Geocoding Issues</h5>
            <ul className="mb-0">
              <li>Special characters or diacritics might cause issues with some geocoding services.</li>
              <li>Very specific or local names might not be recognized by general geocoding services.</li>
              <li>Misspelled location names in the source data can prevent successful geocoding.</li>
              <li>Consider adding these problematic locations to a custom geocoding database with their coordinates.</li>
              <li>Some location strings might contain multiple locations or extra information that confuses geocoding.</li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="container mt-5 mb-3 text-center text-muted">
        <p>Swedish Police Events API Monitoring Dashboard</p>
      </footer>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          padding: 0;
          background-color: #f8f9fa;
        }
        .card {
          margin-bottom: 20px;
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        }
      `}</style>
    </div>
  );
} 