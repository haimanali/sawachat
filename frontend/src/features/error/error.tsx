import React from 'react';
import { Link } from 'react-router-dom';

export default function Error() {
  return (
    <>
      {/* Background Orbs */}
      <div className="bg-layer" aria-hidden="true">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>
      </div>

      <div className="page-wrapper">
        <header className="app-header">
          <img src="./src/assets/appmark.png" alt="SawaChat" className="app-logo" />
          <h1 className="app-name">SawaChat</h1>
        </header>

        <main className="card" aria-label="Error">
          <div className="card-body center-content">
            <div 
              className="avatar-ring" 
              style={{ 
                background: 'rgba(244, 67, 54, 0.1)', 
                borderColor: 'rgba(244, 67, 54, 0.3)' 
              }}
            >
              {/* Red warning triangle */}
              <svg viewBox="0 0 24 24" fill="none" stroke="#f44336" strokeWidth="2">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h2 className="card-title" style={{ marginTop: '20px' }}>System Error</h2>
            <p className="card-subtitle">
              We're experiencing temporary server issues or database connectivity problems. Our engineering team has been notified.
            </p>

            <div 
              className="warn-box" 
              style={{ 
                marginTop: '32px', 
                textAlign: 'left', 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '12px', 
                background: 'rgba(0,0,0,0.2)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                padding: '16px', 
                borderRadius: '12px' 
              }}
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                style={{ width: '24px', height: '24px', flexShrink: 0, marginTop: '2px' }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.85)' }}>
                <strong style={{ color: 'white', fontWeight: 600 }}>Error Code:</strong> 
                <span id="error-code"> 404 Not Found</span><br />
                Please check your connection and try again in a few minutes.
              </div>
            </div>

            <Link 
              to="/" 
              className="btn-primary btn-full" 
              style={{ marginTop: '32px', textAlign: 'center', display: 'block', textDecoration: 'none' }}
            >
              Return to Home
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}