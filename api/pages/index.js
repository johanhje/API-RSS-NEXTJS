/**
 * Homepage - redirects to API
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';

/**
 * Home Page Component
 */
export default function Home() {
  return (
    <div className="home-container">
      <Head>
        <title>Swedish Police Events API</title>
        <meta name="description" content="API for Swedish Police Events with geocoding" />
        <link rel="icon" href="/favicon.ico" />
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" 
          rel="stylesheet" 
          integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" 
          crossOrigin="anonymous"
        />
      </Head>

      <Navbar />

      <main>
        <div className="px-4 py-5 my-5 text-center">
          <h1 className="display-4 fw-bold">Swedish Police Events API</h1>
          <div className="col-lg-8 mx-auto">
            <p className="lead mb-4">
              Access real-time Swedish Police event data with accurate geocoding. 
              This API fetches information from official Swedish Police RSS feeds and 
              enhances it with location coordinates.
            </p>
            <div className="d-grid gap-2 d-sm-flex justify-content-sm-center mb-5">
              <Link href="/dashboard" className="btn btn-primary btn-lg px-4 gap-3">
                View Dashboard
              </Link>
              <Link href="/api/docs" className="btn btn-outline-secondary btn-lg px-4" target="_blank">
                API Documentation
              </Link>
            </div>
          </div>
        </div>

        <div className="container py-5">
          <div className="row g-4 row-cols-1 row-cols-md-3">
            <div className="col">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">Comprehensive Data</h5>
                  <p className="card-text">
                    Access police events from all over Sweden with detailed information about each event,
                    including location, type, description, and timestamps.
                  </p>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">Accurate Geocoding</h5>
                  <p className="card-text">
                    All events are geocoded using a specialized Swedish location database,
                    providing precise coordinates for mapping and analysis.
                  </p>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">RESTful API</h5>
                  <p className="card-text">
                    Simple, well-documented REST API with filtering, pagination, 
                    and comprehensive endpoints for various use cases.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-5">
          <h2 className="text-center mb-4">Getting Started</h2>
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="card">
                <div className="card-header">
                  Example API Request
                </div>
                <div className="card-body">
                  <pre className="mb-0"><code>
{`// Fetch the latest events
fetch('https://your-deployment-url/api/v1/events?limit=10')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`}
                  </code></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer mt-auto py-3 bg-light">
        <div className="container text-center">
          <span className="text-muted">Swedish Police Events API</span>
        </div>
      </footer>

      <style jsx>{`
        .home-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        main {
          flex: 1;
        }
        pre {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 0.25rem;
          overflow-x: auto;
        }
        code {
          color: #d63384;
        }
      `}</style>
    </div>
  );
} 