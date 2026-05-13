import React, { useState, useEffect } from "react";
import { apiCall } from "../../../services/apiCaller"; // Ensure the path is correct
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../../../hooks/useApp";

const API_URL = "/api/login";

// this is the login page where users enter their credentials
export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [greeting, setGreeting] = useState("Welcome Back! 👋");
  const [isShaking, setIsShaking] = useState(false);

  const navigate = useNavigate();
  const { setUserState, t } = useApp();

  // we change the greeting based on what time it is
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 5) setGreeting(t('good_night'));
    else if (h < 12) setGreeting(t('good_morning'));
    else if (h < 17) setGreeting(t('good_afternoon'));
    else if (h < 20) setGreeting(t('good_evening'));
    else setGreeting(t('welcome_back'));
  }, [t]);

  // ── Helpers ────────────────────────────────────────
  const showToast = (msg: string, ms = 2800) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), ms);
  };

  const triggerShake = () => {
    setIsShaking(false); 
    setTimeout(() => setIsShaking(true), 10); 
    setTimeout(() => setIsShaking(false), 420); 
  };

  // ── Handlers ───────────────────────────────────────
  // this handles the login button click
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUsername = username.trim();

    if (!cleanUsername) return showToast("❌ Please enter your User ID");
    if (!password) return showToast("❌ Please enter your password");

    setErrorMsg("");
    setIsLoading(true);

    const result = await apiCall(API_URL, "POST", {
      auto_login: autoLogin,
      username: cleanUsername,
      password: password,
    });

    if (result.success) {
      showToast(`✅ Welcome back, ${result.data.nickname}!`);
      setTimeout(() => {
        setUserState(result.data);
        navigate(`/u/${result.data.username}`);
      }, 1000);
    } else {
      showToast(result.log_message);
      setIsLoading(false);
      triggerShake();
    }

  };

  return (
    <>
      <div className="bg-layer" aria-hidden="true">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>
      </div>

      <div className="page-wrapper">
        <header className="app-header">
          <img src="./src/assets/appmark.png" alt="SawaChat" className="app-logo" />
          <h1 className="app-name">{t('chats_title')}</h1>
          <p className="app-tagline" id="greeting">{greeting}</p>
        </header>

        <main className="card">
          <Link to="/" className="btn-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {t('back')}
          </Link>

          <div className="card-body center-content">
            <p className="card-subtitle">{t('login_username_subtitle')}</p>

            <form
              id="login-form"
              className={`form-full ${isShaking ? "shake-anim" : ""}`}
              style={isShaking ? { animation: "shake 0.42s ease" } : {}}
              onSubmit={handleLoginSubmit}
              noValidate
            >
              <div className="input-group">
                <label htmlFor="login-username">{t('username_label')}</label>
                <div className="input-wrapper">
                  <span className="input-prefix">@</span>
                  <input
                    type="text"
                    id="login-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t('username_ph')}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="login-password">{t('password_label')}</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('password_ph')}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password"
                  >
                    {showPassword ? (
                      <svg className="eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="remember-row">
                <label className="checkbox-label" htmlFor="auto-login">
                  <input
                    type="checkbox"
                    id="auto-login"
                    checked={autoLogin}
                    onChange={(e) => setAutoLogin(e.target.checked)}
                  />
                  <span className="checkbox-custom"></span>
                  {t('remember_me')}
                </label>
              </div>

              {errorMsg && (
                <div className="error-msg" id="login-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className={`btn-primary btn-full btn-loader-wrap ${isLoading ? "is-loading" : ""}`}
                disabled={isLoading}
              >
                <span className="btn-label">{t('login_existing')}</span>
                {isLoading && <div className="btn-spinner"></div>}
              </button>
            </form>

            <p className="form-footer">
              {t('no_account')} <Link to="/signup" id="go-signup">{t('create_one')}</Link>
            </p>
          </div>
        </main>

        <footer style={{ marginTop: 'auto', padding: '24px 0', display: 'flex', gap: '16px', justifyContent: 'center', width: '100%' }}>
            <Link to="/help" className="btn-ghost" style={{ fontSize: '12px', textDecoration: 'none' }}>{t('help_center')}</Link>
            <Link to="/policies" className="btn-ghost" style={{ fontSize: '12px', textDecoration: 'none' }}>{t('policies')}</Link>
        </footer>
      </div>

      {/* ── Toast Notification ────────────────────────── */}
      <div className={`toast ${toastMsg ? "show" : ""}`} role="alert" aria-live="polite">
        {toastMsg}
      </div>
    </>
  );
}