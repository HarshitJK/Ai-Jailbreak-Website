import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED DATA
═══════════════════════════════════════════════════════════════════════════ */
export const overview = [
  "AI JAILBREAK 2026 is an inter-collegiate AI Red-Teaming and Prompt Security Challenge.",
  "Teams test their skills in AI security, adversarial prompting, and problem-solving.",
  "Round 1 includes 6 AI jailbreak challenges.",
  "Round 2 includes a 5-stage simulated company breach (Operation Nova).",
  "All challenges use text-based interactions.",
  "Teams are ranked based on progress and the time taken to complete the challenges.",
  "The fastest teams with the highest progress will be declared winners."
];

/* ═══════════════════════════════════════════════════════════════════════════
   PASSWORD SECURITY
═══════════════════════════════════════════════════════════════════════════ */
export function validatePassword(pw) {
  const rules = [
    { label: "At least 8 characters", ok: pw.length >= 8 },
    { label: "One uppercase letter (A-Z)", ok: /[A-Z]/.test(pw) },
    { label: "One lowercase letter (a-z)", ok: /[a-z]/.test(pw) },
    { label: "One number (0-9)", ok: /[0-9]/.test(pw) }
  ];
  const passed = rules.filter((r) => r.ok).length;
  const valid = passed === 4;
  let strength = "weak";
  if (passed >= 2 && pw.length >= 5) strength = "medium";
  if (valid) strength = "strong";
  return { valid, strength, rules, passed };
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN PAGE (ParticipantAuthPage)
═══════════════════════════════════════════════════════════════════════════ */
export default function LoginPage({
  mode, setMode, team, email, password, setTeam, setEmail, setPassword,
  register, login, error, hasAccount, loginAttempts, loginLockoutUntil
}) {
  const [showRegPw, setShowRegPw] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [lockSecsLeft, setLockSecsLeft] = useState(0);

  const location = useLocation();
  useEffect(() => {
    if (location.state?.mode) {
      setMode(location.state.mode);
      window.history.replaceState({}, "");
    }
  }, [location.state, setMode]);

  const pwAnalysis = password ? validatePassword(password) : null;

  useEffect(() => {
    if (!loginLockoutUntil) { setLockSecsLeft(0); return; }
    function tick() {
      setLockSecsLeft(Math.max(0, Math.ceil((loginLockoutUntil - Date.now()) / 1000)));
    }
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [loginLockoutUntil]);

  const isLockedOut = !!(loginLockoutUntil && Date.now() < loginLockoutUntil && lockSecsLeft > 0);

  return (
    <main className="auth-page">
      <section className="intro-panel">
        <div className="intro-inner">
          <div className="intro-copy">
            <div className="eyebrow">NOCTIVUS</div>
            <h1>PROMPT HEIST</h1>
            <p className="lead">Think Different. Prompt Smarter.</p>
            <div className="overview">
              <h2>Event Overview</h2>
              <ul className="overview-points">
                {overview.map((point, i) => <li key={i}>{point}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-box">
          <div className="auth-tabs">
            <button className={mode === "register" ? "tab active" : "tab"} onClick={() => setMode("register")}>Register</button>
            <button className={mode === "login" ? "tab active" : "tab"} onClick={() => setMode("login")}>Login</button>
          </div>

          <div className="auth-heading">
            <div className="eyebrow">{mode === "register" ? "CREATE TEAM" : "WELCOME BACK"}</div>
            <h2>{mode === "register" ? "Enter the Heist" : "Continue the Heist"}</h2>
            <p>{mode === "register" ? "Create your team account to begin." : "Sign in with your registered team account."}</p>
          </div>

          {mode === "register" ? (
            <form onSubmit={(e) => { e.preventDefault(); register(); }}>
              <label>
                Team Name
                <input value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Enter team name" />
              </label>
              <label>
                Email ID
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="team@example.com" />
              </label>
              <label>
                Password
                <div className="pw-field-wrap">
                  <input
                    type={showRegPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                  />
                  <button type="button" className="pw-eye-btn" onClick={() => setShowRegPw((v) => !v)} aria-label={showRegPw ? "Hide password" : "Show password"} tabIndex={-1}>
                    {showRegPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {password && pwAnalysis && (
                  <div className="pw-strength-wrap">
                    <div className="pw-strength-bar">
                      <div className={`pw-strength-fill strength-${pwAnalysis.strength}`} style={{ width: `${(pwAnalysis.passed / 4) * 100}%` }} />
                    </div>
                    <span className={`pw-strength-label strength-${pwAnalysis.strength}`}>
                      {pwAnalysis.strength === "weak" ? "Weak" : pwAnalysis.strength === "medium" ? "Medium" : "Strong"}
                    </span>
                    {!pwAnalysis.valid && (
                      <ul className="pw-requirements">
                        {pwAnalysis.rules.filter((r) => !r.ok).map((r, i) => (
                          <li key={i} className="pw-req-item">X {r.label}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </label>
              <button className="primary-btn" type="submit">Create Account <span>to</span></button>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); login(); }}>
              {isLockedOut && (
                <div className="auth-lockout-banner" role="alert">
                  Too many failed attempts. Please wait <strong>{lockSecsLeft}s</strong>.
                </div>
              )}
              <label>
                Team Name
                <input value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Enter team name" disabled={isLockedOut} />
              </label>
              <label>
                Password
                <div className="pw-field-wrap">
                  <input
                    type={showLoginPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLockedOut}
                  />
                  <button type="button" className="pw-eye-btn" onClick={() => setShowLoginPw((v) => !v)} aria-label={showLoginPw ? "Hide password" : "Show password"} tabIndex={-1}>
                    {showLoginPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>
              {loginAttempts > 0 && !isLockedOut && (
                <div className="auth-attempt-hint">
                  {5 - loginAttempts} attempt{5 - loginAttempts !== 1 ? "s" : ""} remaining before temporary lockout.
                </div>
              )}
              <button className="primary-btn" type="submit" disabled={isLockedOut}>
                Start Challenge <span>to</span>
              </button>
            </form>
          )}

          {error && (
            <div className={error.includes("created") ? "form-message success" : "form-message"}>
              {error}
            </div>
          )}

          <div className="auth-footer">
            {mode === "register" ? (
              <span>Already registered? <button onClick={() => setMode("login")}>Login</button></span>
            ) : (
              <span>New team? <button onClick={() => setMode("register")}>Register</button></span>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
