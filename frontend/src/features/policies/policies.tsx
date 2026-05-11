import React from 'react';
import { useApp } from '../../hooks/useApp';

// this page shows the privacy and terms policies for the app
export default function Policies() {
    const { t, navigate } = useApp();

    return (
        <>
            <div className="bg-layer" aria-hidden="true">
                <div className="bg-orb orb-1"></div>
                <div className="bg-orb orb-3"></div>
            </div>

            <div className="page-wrapper" style={{ maxWidth: '600px' }}>
                <header className="app-header">
                    <img src="./src/assets/appmark.png" alt="SawaChat" className="app-logo" />
                    <h1 className="app-name">{t('policies')}</h1>
                    <p className="app-tagline">{t('policies_sub')}</p>
                </header>

                <main className="card">
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        <span>{t('back')}</span>
                    </button>

                    {/* the policy content starts here */}
                    <div className="card-body" style={{ textAlign: 'left' }}>
                        <h2 className="card-title" style={{ color: 'var(--primary)', marginBottom: '16px' }}>{t('privacy_policy')}</h2>
                        <p className="card-subtitle" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                            {t('privacy_policy_content')}
                        </p>

                        <div className="divider"></div>

                        <h2 className="card-title" style={{ color: 'var(--primary)', marginBottom: '16px' }}>{t('terms_service')}</h2>
                        <p className="card-subtitle" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                            {t('terms_service_content')}
                        </p>

                        <div className="divider"></div>

                        {/* this is the new 3 strikes rule we added */}
                        <h2 className="card-title" style={{ color: 'var(--warning)', marginBottom: '16px' }}>{t('three_strikes_title')}</h2>
                        <p className="card-subtitle" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                            {t('three_strikes_content')}
                        </p>
                    </div>
                </main>

                <footer className="fine-print">
                    &copy; 2026 SawaChat. {t('tagline')}
                </footer>
            </div>
        </>
    );
}
