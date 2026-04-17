import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiCall } from '../../services/apiCaller';
import { useApp } from '../../hooks/useApp';



export default function Index() {
  const { userState, navigate } = useApp();

    useEffect(() => {
      
      if (userState)
        navigate(`/u/${userState.username}`, { replace : true } );

    }, [userState]);

    if (userState)
      return null;

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
          <p className="app-tagline">Secure messaging with AI-powered safety</p>
        </header>

        <main className="card" id="welcome-card">
          <div className="card-body">
            <h2 className="card-title">Get Started</h2>
            <p className="card-subtitle">Join anonymously — no phone or email needed</p>

            <div className="btn-stack">
              {/* Use Link instead of <a> for faster navigation */}
              <Link to="/signup" className="btn-primary btn-icon" id="btn-create-account">
                <svg className="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                Create New Account
              </Link>

              <Link to="/login" className="btn-outline btn-icon" id="btn-go-login">
                <svg className="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Login to Existing Account
              </Link>
            </div>

            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <span>Hybrid E2EE encryption</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a10 10 0 1 0 10 10" />
                    <path d="M12 6v6l4 2" />
                    <circle cx="18" cy="6" r="3" fill="currentColor" />
                  </svg>
                </span>
                <span>AI-powered moderation</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <span>Anonymous user IDs</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                    <path d="M5 5a10.94 10.94 0 0 0 5.82 14.55" />
                  </svg>
                </span>
                <span>No phone number required</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="toast" id="toast" role="alert" aria-live="polite"></div>
    </>
  );
}