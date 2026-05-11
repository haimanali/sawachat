import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiCall } from '../../services/apiCaller';
import { useApp } from '../../hooks/useApp';



// this is the landing page that visitors see first
// it has the welcome message and links to login or signup
export default function Index() {
  const { userState, navigate, theme, setTheme, language, setLanguage, t } = useApp();

    useEffect(() => {
      // if the user is already logged in, we send them straight to their home page
      if (userState)
        navigate(`/u/${userState.username}`, { replace : true } );

    }, [userState]);

    // we don't show the landing page if the user is already logged in
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
        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '12px', zIndex: 100 }}>
            {/* Language Toggle */}
            <button 
                className="icon-btn" 
                onClick={() => setLanguage(prev => prev === 'en' ? 'ar' : 'en')}
                title={language === 'en' ? "Switch to Arabic" : "Switch to English"}
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer', transition: 'var(--t)' }}
            >
                {language === 'en' ? 'AR' : 'EN'}
            </button>
            {/* Theme Toggle */}
            <button 
                className="icon-btn" 
                onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-main)', cursor: 'pointer', transition: 'var(--t)' }}
            >
                {theme === 'dark' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                        <circle cx="12" cy="12" r="5"/>
                        <line x1="12" y1="1" x2="12" y2="3"/>
                        <line x1="12" y1="21" x2="12" y2="23"/>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                        <line x1="1" y1="12" x2="3" y2="12"/>
                        <line x1="21" y1="12" x2="23" y2="12"/>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                )}
            </button>
        </div>
        <header className="app-header">
          <img src="./src/assets/appmark.png" alt="SawaChat" className="app-logo" />
          <h1 className="app-name">{t('chats_title')}</h1>
          <p className="app-tagline">{t('tagline')}</p>
        </header>

        <main className="card" id="welcome-card">
          <div className="card-body">
            <h2 className="card-title">{t('get_started')}</h2>
            <p className="card-subtitle">{t('join_anon')}</p>

            <div className="btn-stack">
              {/* Use Link instead of <a> for faster navigation */}
              <Link to="/signup" className="btn-primary btn-icon" id="btn-create-account">
                <svg className="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                <span>{t('create_account')}</span>
              </Link>

              <Link to="/login" className="btn-outline btn-icon" id="btn-go-login">
                <svg className="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>{t('login_existing')}</span>
              </Link>
            </div>

            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <span>{t('feature_1')}</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a10 10 0 1 0 10 10" />
                    <path d="M12 6v6l4 2" />
                    <circle cx="18" cy="6" r="3" fill="currentColor" />
                  </svg>
                </span>
                <span>{t('feature_2')}</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <span>{t('feature_3')}</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                    <path d="M5 5a10.94 10.94 0 0 0 5.82 14.55" />
                  </svg>
                </span>
                <span>{t('feature_4')}</span>
              </div>
            </div>
          </div>
        </main>

        {/* we put help and policy links at the bottom of the page */}
        <footer style={{ marginTop: 'auto', padding: '32px 0', display: 'flex', gap: '20px', justifyContent: 'center', width: '100%', borderTop: '1px solid var(--border)' }}>
            <Link to="/help" className="btn-ghost" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>{t('help_center')}</Link>
            <Link to="/policies" className="btn-ghost" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>{t('policies')}</Link>
        </footer>
      </div>

      <div className="toast" id="toast" role="alert" aria-live="polite"></div>
    </>
  );
}