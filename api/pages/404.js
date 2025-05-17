import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';

/**
 * Custom 404 Page
 */
export default function Custom404() {
  return (
    <div className="not-found-container">
      <Head>
        <title>404 - Page Not Found | Swedish Police Events API</title>
        <meta name="description" content="Page not found" />
        <link rel="icon" href="/favicon.ico" />
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" 
          rel="stylesheet" 
          integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" 
          crossOrigin="anonymous"
        />
      </Head>

      <Navbar />

      <main className="container text-center py-5">
        <div className="row">
          <div className="col-lg-8 mx-auto">
            <h1 className="display-1 fw-bold">404</h1>
            <p className="fs-3">
              <span className="text-danger">Oops!</span> Page not found.
            </p>
            <p className="lead">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="mt-5">
              <Link href="/" className="btn btn-primary me-2">
                Go Home
              </Link>
              <Link href="/dashboard" className="btn btn-outline-primary me-2">
                Dashboard
              </Link>
              <Link href="/api/docs" className="btn btn-outline-secondary" target="_blank">
                API Documentation
              </Link>
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
        .not-found-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        main {
          flex: 1;
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
} 