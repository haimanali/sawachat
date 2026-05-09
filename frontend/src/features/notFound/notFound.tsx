import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="page-wrapper">
            <div className="bg-layer">
                <div className="bg-orb orb-1"></div>
                <div className="bg-orb orb-2"></div>
                <div className="bg-orb orb-3"></div>
            </div>

            <header className="app-header">
                <h1 className="app-name">SawaChat</h1>
                <p className="app-tagline">Connecting people, safely.</p>
            </header>

            <div className="card">
                <div className="card-body center-content">
                    <div className="avatar-ring">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: '32px' }}>
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            <line x1="11" y1="8" x2="11" y2="14" />
                            <line x1="8" y1="11" x2="14" y2="11" />
                        </svg>
                    </div>

                    <h2 className="card-title">Oops! 404</h2>
                    <p className="card-subtitle">
                        The page you are looking for does not exist or has been moved.
                    </p>

                    <div className="warn-box" style={{ background: 'var(--primary-light)', borderLeftColor: 'var(--primary)', color: 'var(--primary-deep)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ stroke: 'var(--primary)' }}>
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        </svg>
                        <span>Check the URL for typos or try returning to the main dashboard.</span>
                    </div>

                    <div className="btn-stack" style={{ marginTop: '24px' }}>
                        <button 
                            className="btn-primary" 
                            onClick={() => navigate("/", { replace: true })}
                        >
                            Take Me Home
                        </button>
                    </div>
                </div>
            </div>

            <p className="fine-print">Lost? Try logging in again.</p>
        </div>
    );
}