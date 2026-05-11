import React from 'react';
import { useApp } from '../../hooks/useApp';

// this is the help center page where users can find faqs
export default function Help() {
    const { t, navigate } = useApp();

    return (
        <>
            <div className="bg-layer" aria-hidden="true">
                <div className="bg-orb orb-1"></div>
                <div className="bg-orb orb-2"></div>
            </div>

            {/* the page wrapper holds the main content and keeps things centered */}
            <div className="page-wrapper">
                <header className="app-header">
                    <img src="./src/assets/appmark.png" alt="SawaChat" className="app-logo" />
                    <h1 className="app-name">{t('help_center')}</h1>
                    <p className="app-tagline">{t('help_sub')}</p>
                </header>

                <main className="card">
                    {/* back button to go to previous page */}
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        <span>{t('back')}</span>
                    </button>

                    <div className="card-body">
                        {/* here are the faq questions and answers */}
                        <section className="faq-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="faq-item">
                                <h3 className="card-title" style={{ fontSize: '18px' }}>{t('faq_encryption')}</h3>
                                <p className="card-subtitle" style={{ marginBottom: '0' }}>{t('faq_encryption_sub')}</p>
                            </div>

                            <div className="faq-item" style={{ paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                                <h3 className="card-title" style={{ fontSize: '18px' }}>{t('faq_anon')}</h3>
                                <p className="card-subtitle" style={{ marginBottom: '0' }}>{t('faq_anon_sub')}</p>
                            </div>
                        </section>
                    </div>
                </main>

                <footer className="fine-print">
                    &copy; 2026 SawaChat. {t('tagline')}
                </footer>
            </div>
        </>
    );
}
