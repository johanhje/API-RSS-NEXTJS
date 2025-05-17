import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

/**
 * Navigation bar component
 */
export default function Navbar() {
  const router = useRouter();
  
  // Check if a link is active
  const isActive = (path) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };
  
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link href="/" className="navbar-brand">
          Swedish Police Events API
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link 
                href="/" 
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
              >
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                href="/dashboard" 
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                href="/api/docs" 
                className={`nav-link ${isActive('/api/docs') ? 'active' : ''}`}
                target="_blank"
              >
                API Docs
              </Link>
            </li>
          </ul>
          
          <div className="d-flex">
            <a 
              href="https://github.com/your-username/swedish-police-events-api" 
              className="btn btn-outline-light"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
} 