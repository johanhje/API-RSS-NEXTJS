import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import Navbar from '../../components/Navbar';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

/**
 * Dashboard Page Component
 */
export default function Dashboard() {
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(60); // In seconds
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setDashboardData(data.data);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch and refresh interval
  useEffect(() => {
    fetchDashboardData();

    // Set up refresh interval
    const interval = setInterval(() => {
      fetchDashboardData();
    }, refreshInterval * 1000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Prepare chart data - Events by type
  const eventTypeChartData = dashboardData?.events?.byType ? {
    labels: dashboardData.events.byType.map(item => item.type),
    datasets: [
      {
        label: 'Number of Events',
        data: dashboardData.events.byType.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
          'rgba(83, 102, 255, 0.6)',
          'rgba(40, 159, 64, 0.6)',
          'rgba(210, 199, 199, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  // Prepare chart data - Events by day
  const eventsByDayChartData = dashboardData?.events?.byDay ? {
    labels: dashboardData.events.byDay.map(item => item.date),
    datasets: [
      {
        label: 'Events per Day',
        data: dashboardData.events.byDay.map(item => item.count),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  } : null;

  // Prepare chart data - Geocoding success
  const geocodingSuccessData = dashboardData?.events ? {
    labels: ['Geocoded Successfully', 'Failed Geocoding'],
    datasets: [
      {
        label: 'Geocoding Success Rate',
        data: [dashboardData.events.geocoded, dashboardData.events.failed],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;
  
  // Calculate time since last refreshed
  const getTimeSinceLastRefresh = () => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - lastRefreshed) / 1000);
    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  };

  return (
    <div className="dashboard-container">
      <Head>
        <title>Swedish Police Events - Dashboard</title>
        <meta name="description" content="Monitoring dashboard for Swedish Police Events API" />
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
        <div className="row mb-4">
          <div className="col">
            <h1 className="display-4">Swedish Police Events Dashboard</h1>
            <div className="d-flex justify-content-between align-items-center">
              <p className="text-muted">
                {loading ? 'Refreshing data...' : `Last refreshed: ${getTimeSinceLastRefresh()}`}
              </p>
              <div className="d-flex align-items-center">
                <label htmlFor="refreshInterval" className="me-2">Auto-refresh:</label>
                <select 
                  id="refreshInterval" 
                  className="form-select form-select-sm" 
                  style={{ width: 'auto' }}
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                >
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="300">5 minutes</option>
                  <option value="600">10 minutes</option>
                </select>
                <button 
                  className="btn btn-sm btn-primary ms-2" 
                  onClick={fetchDashboardData}
                  disabled={loading}
                >
                  Refresh Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            Error: {error}
          </div>
        )}

        {loading && !dashboardData ? (
          <div className="d-flex justify-content-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : dashboardData && (
          <>
            {/* Key Metrics */}
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">Total Events</h5>
                    <p className="display-4">{dashboardData.events.total}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">Unique Locations</h5>
                    <p className="display-4">{dashboardData.locations.total}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">Geocoding Success</h5>
                    <p className="display-4">{dashboardData.performance.geocodingSuccessRate}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">Last Update</h5>
                    <p className="h5">
                      {dashboardData.lastUpdate 
                        ? new Date(dashboardData.lastUpdate).toLocaleString() 
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    Events by Type
                  </div>
                  <div className="card-body">
                    {eventTypeChartData ? (
                      <Pie data={eventTypeChartData} />
                    ) : (
                      <p className="text-center text-muted">No data available</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    Events by Day
                  </div>
                  <div className="card-body">
                    {eventsByDayChartData ? (
                      <Bar 
                        data={eventsByDayChartData}
                        options={{
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                precision: 0
                              }
                            }
                          }
                        }}
                      />
                    ) : (
                      <p className="text-center text-muted">No data available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cache Performance */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    Cache Performance
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Cache Type</th>
                            <th>Hit Rate</th>
                            <th>Hits</th>
                            <th>Misses</th>
                            <th>Size</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>General</td>
                            <td>{dashboardData.performance.cache.general.hitRate}</td>
                            <td>{dashboardData.performance.cache.general.hits}</td>
                            <td>{dashboardData.performance.cache.general.misses}</td>
                            <td>{dashboardData.performance.cache.general.size}</td>
                          </tr>
                          <tr>
                            <td>Geocoding</td>
                            <td>{dashboardData.performance.cache.geocoding.hitRate}</td>
                            <td>{dashboardData.performance.cache.geocoding.hits}</td>
                            <td>{dashboardData.performance.cache.geocoding.misses}</td>
                            <td>{dashboardData.performance.cache.geocoding.size}</td>
                          </tr>
                          <tr>
                            <td>RSS Feed</td>
                            <td>{dashboardData.performance.cache.rss.hitRate}</td>
                            <td>{dashboardData.performance.cache.rss.hits}</td>
                            <td>{dashboardData.performance.cache.rss.misses}</td>
                            <td>{dashboardData.performance.cache.rss.size}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Problematic Locations */}
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    Problematic Locations (Failed Geocoding)
                    <a href="/dashboard/problematic-locations" className="btn btn-sm btn-outline-primary">
                      View All
                    </a>
                  </div>
                  <div className="card-body">
                    {dashboardData.locations.problematic.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>Location</th>
                              <th>Count</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardData.locations.problematic.map((location, index) => (
                              <tr key={index}>
                                <td>{location.location_name}</td>
                                <td>{location.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-success">No problematic locations found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
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