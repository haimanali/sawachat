import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../../../hooks/useApp";

export default function Ban() {
    const { username } = useParams();
    const { userState } = useApp();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyStatus = async () => {

            if (!userState) {
                setLoading(false);                
            } 
            else
            {
                navigate(`/u/${username}`);
            }
            
        };

        verifyStatus();
    }, [username, navigate]);

    if (loading) {
        return (
            <div className="full-page-loader">
                <div className="btn-spinner" style={{ display: 'block', borderTopColor: 'var(--primary)' }}></div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            {/* Consistent Animated Background from your CSS */}
            <div className="bg-layer">
                <div className="bg-orb orb-1"></div>
                <div className="bg-orb orb-2"></div>
                <div className="bg-orb orb-3"></div>
            </div>

            <header className="app-header">
                <h1 className="app-name">SawaChat</h1>
                <p className="app-tagline">Security & Privacy First</p>
            </header>

            <div className="card">
                <div className="card-body center-content">
                    {/* Reusing your Avatar Ring style but with Error colors */}
                    <div className="avatar-ring" style={{ background: 'var(--error)', boxShadow: '0 8px 24px rgba(244, 67, 54, 0.25)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                            <line x1="12" y1="2" x2="12" y2="12" />
                        </svg>
                    </div>

                    <h2 className="card-title">Account Terminated</h2>
                    <p className="card-subtitle">
                        The account <strong>@{username}</strong> has been permanently banned 
                        due to multiple violations of our toxicity guidelines.
                    </p>

                    <div className="warn-box">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>Our BERT AI model flagged this account for high-toxicity behavior. This decision is final.</span>
                    </div>

                    <div className="btn-stack" style={{ marginTop: '24px' }}>
                        <button 
                            className="btn-primary" 
                            onClick={() => navigate("/login", { replace: true })}
                        >
                            Return to Login
                        </button>
                    </div>
                </div>
            </div>
            
            <p className="fine-print">Contact support if you believe this was an error.</p>
        </div>
    );
}


