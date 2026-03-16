import React, { useState } from "react";
import { apiCall } from "./apiCaller"; // Ensure the path is correct based on your folder structure
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3000/api/signup";

export default function Signup() {
  // ── State ──────────────────────────────────────────
  const [step, setStep] = useState<"nickname" | "password" | "success">("nickname");
  const [tagline, setTagline] = useState("Create your account");
  
  // Form Data
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const navigate = useNavigate();

  // ── Helpers ────────────────────────────────────────
  const showToast = (msg: string, ms = 2800) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), ms);
  };

  const calcStrength = (pw: string): number => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  // ── Handlers ───────────────────────────────────────
  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nick = nickname.trim();
    const user = username.trim();

    if (nick.length < 2) {
      return showToast("❌ Nickname must be at least 2 characters");
    }
    if (!/^[A-Za-z0-9_]{3,16}$/.test(user)) {
      return showToast("❌ Username must be 3-16 letters, numbers, or underscores");
    }

    setTagline("Secure your account");
    setStep("password");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const hasSpec = /[^A-Za-z0-9]/.test(password);

    if (password.length < 8) return showToast("❌ Password must be at least 8 characters");
    if (!hasUpper || !hasLower || !hasNum || !hasSpec) {
      return showToast("❌ Password must contain uppercase, lowercase, number, and special character.");
    }
    if (password !== confirmPassword) return showToast("❌ Passwords do not match");

    setErrorMsg("");
    setIsLoading(true);

    const result = await apiCall(API_URL, "POST", {
      username: username.trim(),
      nickname: nickname.trim(),
      password: password,
    });

    if (result.success) {
      setTagline(`You're all set! 🎉 ${result.log_message}`);
      setStep("success");
      // Optional: Redirect after a few seconds
      setTimeout(() => {
        navigate(`/u/${result.username}`);
      }, 2000);
    } else {
      showToast(result.log_message);
      setIsLoading(false);
    }
  };

  // ── Derived State for UI ───────────────────────────
  const strengthScore = calcStrength(password);
  const strengthPct = password.length ? Math.max((strengthScore / 5) * 100, 12) : 0;
  const colors = ["#f44336", "#ff9800", "#ffc107", "#8bc34a", "#4caf50"];
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
  const strengthColor = password.length ? colors[strengthScore - 1] ?? colors[0] : "transparent";
  const strengthLabelText = password.length ? labels[strengthScore - 1] ?? labels[0] : "";

  // ── Render (HTML/JSX) ──────────────────────────────
  return (
    <>
      <div className="bg-layer" aria-hidden="true">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>
      </div>

      <div className="page-wrapper">
        <header className="app-header">
          {/* Ensure the image path is correct or imported */}
          <img src="./src/assets/appmark.png" alt="SawaChat" className="app-logo" />
          <h1 className="app-name">SawaChat</h1>
          <p className="app-tagline" id="step-tagline">{tagline}</p>
        </header>

        {/* ── Step 1: Nickname ─────────────────────────── */}
        {step === "nickname" && (
          <section className="card step-card active" aria-label="Step 1: Choose a nickname">
            <a href="/" className="btn-back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </a>
            <div className="card-body center-content">
              <div className="avatar-ring">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2 className="card-title">Choose a Nickname</h2>
              <p className="card-subtitle">This is how others will see you</p>

              <form onSubmit={handleNicknameSubmit} className="form-full" noValidate>
                <div className="input-group">
                  <label htmlFor="reg-username">Unique Username</label>
                  <div className="input-wrapper">
                    <span className="input-prefix">@</span>
                    <input
                      type="text"
                      id="reg-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="choose_a_username"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck="false"
                      required
                    />
                  </div>
                  <p className="input-hint">3–20 letters, numbers, or underscores. Cannot be changed later.</p>
                </div>

                <div className="input-group">
                  <label htmlFor="reg-nickname">Display Nickname</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      id="reg-nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Enter your nickname"
                      autoComplete="off"
                      autoCapitalize="words"
                      required
                    />
                  </div>
                  <p className="input-hint">2–30 characters. You can change this later in settings.</p>
                </div>
                <button type="submit" className="btn-primary btn-full">
                  Continue
                </button>
              </form>
            </div>
          </section>
        )}

        {/* ── Step 2: Password ─────────────────────────── */}
        {step === "password" && (
          <section className="card step-card active" aria-label="Step 2: Set a password">
            <button
              type="button"
              className="btn-back"
              onClick={() => {
                setStep("nickname");
                setTagline("Create your account");
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </button>
            <div className="card-body center-content">
              <div className="avatar-ring">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h2 className="card-title">Set Your Password</h2>
              <p className="card-subtitle">Secure your anonymous account</p>

              <form onSubmit={handlePasswordSubmit} className="form-full" noValidate>
                <div className="input-group">
                  <label htmlFor="reg-password">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="reg-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="toggle-pw"
                      onClick={() => setShowPassword(!showPassword)}
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
                  <div className="strength-bar">
                    <div
                      className="strength-fill"
                      style={{ width: `${strengthPct}%`, backgroundColor: strengthColor }}
                    ></div>
                  </div>
                  <p className="strength-label" style={{ color: strengthColor }}>
                    {strengthLabelText}
                  </p>
                </div>

                <div className="input-group">
                  <label htmlFor="reg-confirm">Confirm Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <input
                      type={showConfirm ? "text" : "password"}
                      id="reg-confirm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="toggle-pw"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? (
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

                {errorMsg && (
                  <div className="error-msg">
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
                  <span className="btn-label">Create Account</span>
                  {isLoading && <div className="btn-spinner"></div>}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* ── Step 3: Success ──────────────────────────── */}
        {step === "success" && (
          <section className="card step-card active" aria-label="Account created">
            <div className="card-body center-content">
              <div className="success-anim">
                <div className="success-ring"></div>
                <svg className="success-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h2 className="card-title">Account Created!</h2>
              <p className="card-subtitle">
                Your secure account is ready.<br />
                Redirecting you to your profile...
              </p>
            </div>
          </section>
        )}
      </div>

      {/* ── Toast Notification ────────────────────────── */}
      <div className={`toast ${toastMsg ? "show" : ""}`} role="alert" aria-live="polite">
        {toastMsg}
      </div>
    </>
  );
}