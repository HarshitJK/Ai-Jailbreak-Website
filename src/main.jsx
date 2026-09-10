import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED DATA
═══════════════════════════════════════════════════════════════════════════ */
const challenges = [
  "Create a prompt that generates a startup idea in under 100 words.",
  "Write a prompt that helps students learn faster using AI.",
  "Create a prompt that generates marketing content for a product launch.",
  "Write a prompt that can summarize a research paper.",
  "Create a prompt that generates innovative business ideas.",
  "Design a master prompt that combines creativity and problem solving."
];

const overview = [
  "AI JAILBREAK 2026 is an inter-collegiate AI Red-Teaming and Prompt Security Challenge.",
  "Teams test their skills in AI security, adversarial prompting, and problem-solving.",
  "Round 1 includes 6 AI jailbreak challenges.",
  "Round 2 includes a 5-stage simulated company breach (Operation Nova).",
  "All challenges use text-based interactions.",
  "Teams are ranked based on progress and the time taken to complete the challenges.",
  "The fastest teams with the highest progress will be declared winners."
];

/* ═══════════════════════════════════════════════════════════════════════════
   PARTICIPANT APP — do NOT modify this section
═══════════════════════════════════════════════════════════════════════════ */
function App() {
  const [page, setPage] = useState("auth");
  const [authMode, setAuthMode] = useState("register");
  const [team, setTeam] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storedAccount, setStoredAccount] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [active, setActive] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [error, setError] = useState("");

  const progress = completed.length;

  useEffect(() => {
    const saved = localStorage.getItem("prompt-heist-account");
    if (saved) setStoredAccount(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (page === "challenge") {
      setMessages([
        {
          id: "control-0",
          side: "control",
          text: `Challenge ${String(active + 1).padStart(2, "0")} is now active.\\n\\n${challenges[active]}`
        }
      ]);
    }
  }, [active, page]);

  const currentDone = completed.includes(active);
  const allDone = completed.length === 6;

  function register() {
    setError("");
    if (!team.trim() || !email.trim() || !password.trim()) {
      setError("Please complete all three fields.");
      return;
    }
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    const account = { team: team.trim(), email: email.trim(), password };
    localStorage.setItem("prompt-heist-account", JSON.stringify(account));
    setStoredAccount(account);
    setAuthMode("login");
    setPassword("");
    setError("Account created. Login to start the challenge.");
  }

  function login() {
    setError("");
    const account = storedAccount;
    if (!account) {
      setError("No account found. Create an account first.");
      return;
    }
    if (team.trim() !== account.team || password !== account.password) {
      setError("Team name or password is incorrect.");
      return;
    }
    setPage("challenge");
    setCompleted([]);
    setActive(0);
    setInput("");
  }

  function submitPrompt() {
    const value = input.trim();
    if (!value || loading || currentDone) return;

    setMessages((m) => [
      ...m,
      { id: Date.now(), side: "user", text: value }
    ]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const nextCompleted = [...new Set([...completed, active])].sort((a, b) => a - b);
      setCompleted(nextCompleted);
      setLoading(false);

      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          side: "control",
          text: "Submission received. Challenge completed. Good work."
        }
      ]);

      if (active < 5) {
        setTimeout(() => setActive(active + 1), 650);
      }
    }, 900);
  }

  function logout() {
    setPage("auth");
    setAuthMode("login");
    setPassword("");
    setInput("");
    setCompleted([]);
    setActive(0);
    setMessages([]);
    setMobileNav(false);
  }

  function jumpToChallenge(index) {
    if (index > completed.length) return;
    setActive(index);
    setMobileNav(false);
  }

  return (
    <div className="app">
      {page === "auth" ? (
        <AuthPage
          mode={authMode}
          setMode={(m) => { setAuthMode(m); setError(""); }}
          team={team}
          email={email}
          password={password}
          setTeam={setTeam}
          setEmail={setEmail}
          setPassword={setPassword}
          register={register}
          login={login}
          error={error}
          hasAccount={!!storedAccount}
        />
      ) : (
        <ChallengePage
          team={storedAccount?.team || "Team"}
          progress={progress}
          completed={completed}
          active={active}
          messages={messages}
          input={input}
          setInput={setInput}
          loading={loading}
          currentDone={currentDone}
          allDone={allDone}
          mobileNav={mobileNav}
          setMobileNav={setMobileNav}
          jumpToChallenge={jumpToChallenge}
          submitPrompt={submitPrompt}
          logout={logout}
        />
      )}
    </div>
  );
}

function Brand({ compact = false }) {
  return (
    <div className={compact ? "brand brand-compact" : "brand"}>
      <div className="brand-mark">PH</div>
      <div>
        <div className="brand-name">PROMPT HEIST</div>
        {!compact && <div className="brand-tagline">Think Different. Prompt Smarter.</div>}
      </div>
    </div>
  );
}

function AuthPage(props) {
  const {
    mode, setMode, team, email, password, setTeam, setEmail, setPassword,
    register, login, error, hasAccount
  } = props;

  return (
    <main className="auth-page">
      <section className="intro-panel">
        <div className="intro-inner">
          <div className="intro-copy">
            <div className="eyebrow">EVENT NAME</div>
            <h1>PROMPT HEIST</h1>
            <p className="lead">Think Different. Prompt Smarter.</p>

            <div className="overview">
              <h2>Event Overview</h2>
              <ul className="overview-points">{overview.map((point, i) => <li key={i}>{point}</li>)}</ul>
              <p className="motto">Think. Prompt. Break. Advance.</p>
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
              <label>Team Name<input value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Enter team name" /></label>
              <label>Email ID<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="team@example.com" /></label>
              <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" /></label>
              <button className="primary-btn" type="submit">Create Account <span>→</span></button>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); login(); }}>
              <label>Team Name<input value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Enter team name" /></label>
              <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" /></label>
              <button className="primary-btn" type="submit">Start Challenge <span>→</span></button>
            </form>
          )}

          {error && <div className={error.includes("created") ? "form-message success" : "form-message"}>{error}</div>}

          <div className="auth-footer">
            {mode === "register" ? (
              <>Already registered? <button onClick={() => setMode("login")}>Login</button></>
            ) : (
              <>New team? <button onClick={() => setMode("register")}>Register</button></>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function ChallengePage({
  team, progress, completed, active, messages, input, setInput, loading,
  currentDone, allDone, mobileNav, setMobileNav, jumpToChallenge, submitPrompt, logout
}) {
  return (
    <main className="challenge-page">
      {mobileNav && <div className="mobile-backdrop" onClick={() => setMobileNav(false)} />}

      <aside className={mobileNav ? "sidebar open" : "sidebar"}>
        <div className="sidebar-top">
          <Brand compact />
          <div className="progress-title">Challenge Progress</div>
          <div className="progress-number">{progress} / 6</div>
          <div className="progress-track"><div style={{ width: `${(progress / 6) * 100}%` }} /></div>
        </div>

        <nav className="challenge-nav">
          {challenges.map((_, i) => {
            const done = completed.includes(i);
            const available = i <= progress;
            return (
              <button
                key={i}
                className={[
                  "challenge-item",
                  active === i ? "selected" : "",
                  done ? "done" : "",
                  !available ? "unavailable" : ""
                ].join(" ")}
                disabled={!available}
                onClick={() => jumpToChallenge(i)}
              >
                <span>Challenge {String(i + 1).padStart(2, "0")}</span>
                <small>{done ? "Completed" : active === i ? "Active" : "Available"}</small>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button onClick={() => alertRules()}>Rules</button>
          <button onClick={logout}>Logout</button>
        </div>
      </aside>

      <section className="chat-area">
        <header className="chat-header">
          <div>
            <div className="eyebrow">AI JAILBREAK 2026</div>
            <h1>Prompt Heist</h1>
          </div>
          <div className="team-chip">{team}</div>
        </header>

        <div className="chat-content">
          {!allDone ? (
            <>
              <div className="challenge-label">Challenge {String(active + 1).padStart(2, "0")}</div>
              <div className="messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={msg.side === "user" ? "message-row user" : "message-row"}>
                    <div className={msg.side === "user" ? "message-avatar red" : "message-avatar"}>{msg.side === "user" ? "Y" : "PH"}</div>
                    <div className="message-bubble">
                      <div className="message-author">{msg.side === "user" ? "You" : "Challenge Control"}</div>
                      <div className="message-text">{msg.text}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="message-row">
                    <div className="message-avatar">PH</div>
                    <div className="message-bubble">
                      <div className="message-author">Challenge Control</div>
                      <div className="typing"><i></i><i></i><i></i></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="composer-wrap">
                <textarea
                  value={input}
                  disabled={loading || currentDone}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitPrompt();
                    }
                  }}
                  placeholder="Enter your prompt..."
                  rows="3"
                />
                <button className="send-btn" onClick={submitPrompt} disabled={!input.trim() || loading || currentDone}>
                  Send <span>↑</span>
                </button>
              </div>
              <div className="composer-note">Text-based interaction only</div>
            </>
          ) : (
            <Completion progress={progress} onHome={logout} />
          )}
        </div>
      </section>
    </main>
  );
}

function Completion({ progress, onHome }) {
  return (
    <div className="completion">
      <div className="completion-line" />
      <div className="eyebrow">FINAL STATUS</div>
      <h2>HEIST COMPLETED</h2>
      <p>You successfully cracked all prompts.</p>
      <div className="completion-count">{progress} / 6 <span>Challenges Completed</span></div>
      <button className="primary-btn small" onClick={onHome}>Return Home <span>→</span></button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN — SECURITY & AUTHENTICATION LAYER
   ─────────────────────────────────────────────────────────────────────────
   IMPORTANT: This is a FRONTEND-ONLY demo implementation.
   Frontend authentication is NOT production-secure — credentials can be
   inspected via browser developer tools.

   TODO (backend migration):
     - Move credential validation to server-side (hashed passwords)
     - Replace state-based session with secure HTTP-only session cookies or JWT
     - Implement server-side rate limiting and lockout
     - Move Round 2 access enforcement to server
     - Store audit logs in a server-side database
═══════════════════════════════════════════════════════════════════════════ */

// Demo credentials — NOT a real personal password.
// Replace with server-side authentication before production use.
const DEMO_ADMIN_ID = "admin";
const DEMO_ADMIN_PASSWORD = "Admin@2026!Secure";

/**
 * Validates the admin password against the strong password policy.
 * Policy: 12+ chars, uppercase, lowercase, digit, special character.
 * Returns: { valid, strength, rules, passed }
 */
function validateAdminPassword(pw) {
  const rules = [
    { label: "At least 12 characters", ok: pw.length >= 12 },
    { label: "One uppercase letter (A–Z)", ok: /[A-Z]/.test(pw) },
    { label: "One lowercase letter (a–z)", ok: /[a-z]/.test(pw) },
    { label: "One number (0–9)", ok: /[0-9]/.test(pw) },
    { label: "One special character (!@#$…)", ok: /[^A-Za-z0-9]/.test(pw) }
  ];
  const passed = rules.filter((r) => r.ok).length;
  const valid = passed === 5;
  let strength = "weak";
  if (passed >= 3 && pw.length >= 8) strength = "medium";
  if (valid) strength = "strong";
  return { valid, strength, rules, passed };
}

/* ─── Admin team data — NO passwords, tokens, or credentials stored ─────── */
const adminTeams = [
  { id: 1, name: "Cyber Titans",  email: "cyber@example.com",   r1Challenges: 6, r2Challenges: 0, time: "00:38:42", completed: true  },
  { id: 2, name: "Zero Day",      email: "zero@example.com",    r1Challenges: 6, r2Challenges: 0, time: "00:41:18", completed: true  },
  { id: 3, name: "Prompt X",      email: "promptx@example.com", r1Challenges: 6, r2Challenges: 0, time: "00:44:09", completed: true  },
  { id: 4, name: "Root Access",   email: "root@example.com",    r1Challenges: 6, r2Challenges: 0, time: "00:49:27", completed: true  },
  { id: 5, name: "Byte Force",    email: "byte@example.com",    r1Challenges: 4, r2Challenges: 0, time: "—",        completed: false },
  { id: 6, name: "Null Pointer",  email: "null@example.com",    r1Challenges: 3, r2Challenges: 0, time: "—",        completed: false },
  { id: 7, name: "Code Breakers", email: "code@example.com",    r1Challenges: 2, r2Challenges: 0, time: "—",        completed: false },
  { id: 8, name: "Shadow Stack",  email: "shadow@example.com",  r1Challenges: 1, r2Challenges: 0, time: "—",        completed: false }
];

/* ─── Initial demo activity log — no passwords logged ───────────────────── */
const initialAdminLogs = [
  { ts: "10:38:42", team: "Cyber Titans", r1Time: "00:38:42", r2Time: "—", action: "Round 1 completed", challenges: "R1: 6/6, R2: —" },
  { ts: "10:41:18", team: "Zero Day",     r1Time: "00:41:18", r2Time: "—", action: "Round 1 completed", challenges: "R1: 6/6, R2: —" },
  { ts: "10:44:09", team: "Prompt X",     r1Time: "00:44:09", r2Time: "—", action: "Round 1 completed", challenges: "R1: 6/6, R2: —" },
  { ts: "10:49:27", team: "Root Access",  r1Time: "00:49:27", r2Time: "—", action: "Round 1 completed", challenges: "R1: 6/6, R2: —" }
];

/* ─── Demo per-challenge chat conversations ──────────────────────────────── */
const challengeChatMessages = [
  { team: "10:31:04 · {name}", ctrl: "10:31:08 · CHALLENGE CONTROL", msg: "Challenge 01 prompt submitted — startup idea generation.", reply: "Submission received. Challenge 01 completed. Good work." },
  { team: "10:35:22 · {name}", ctrl: "10:35:27 · CHALLENGE CONTROL", msg: "Challenge 02 prompt submitted — student learning accelerator.", reply: "Submission received. Challenge 02 completed." },
  { team: "10:39:11 · {name}", ctrl: "10:39:14 · CHALLENGE CONTROL", msg: "Challenge 03 prompt submitted — product launch marketing.", reply: "Submission received. Challenge 03 completed." },
  { team: "10:42:55 · {name}", ctrl: "10:42:58 · CHALLENGE CONTROL", msg: "Challenge 04 prompt submitted — research paper summariser.", reply: "Submission received. Challenge 04 completed." },
  { team: "10:46:33 · {name}", ctrl: "10:46:37 · CHALLENGE CONTROL", msg: "Challenge 05 prompt submitted — business idea generator.", reply: "Submission received. Challenge 05 completed." },
  { team: "10:49:01 · {name}", ctrl: "10:49:05 · CHALLENGE CONTROL", msg: "Challenge 06 master prompt submitted — creativity + problem solving.", reply: "Submission received. Challenge 06 completed. Heist complete." }
];

/* ═══════════════════════════════════════════════════════════════════════════
   AdminAuthGate — holds authentication state, session, and activity log
═══════════════════════════════════════════════════════════════════════════ */
function AdminAuthGate() {
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [adminLogs, setAdminLogs] = useState(initialAdminLogs);

  /** Append a new entry to the activity log. Never logs passwords. */
  function addLog(team, r1Time, r2Time, action, challenges) {
    const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
    setAdminLogs((prev) => [{ ts, team, r1Time, r2Time, action, challenges }, ...prev]);
  }

  /**
   * Attempt admin login. Returns { success } or { error }.
   * Max 5 attempts before 60-second lockout.
   */
  function handleAdminLogin(username, password) {
    // Check active lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      return { error: "Account temporarily locked. Please wait for the countdown." };
    }

    // Input validation
    if (!username.trim()) return { error: "Admin ID cannot be empty." };
    if (!password)         return { error: "Password cannot be empty." };

    // Credential check
    // TODO: Replace this comparison with a server-side authentication call.
    if (username.trim() === DEMO_ADMIN_ID && password === DEMO_ADMIN_PASSWORD) {
      setAdminAuthenticated(true);
      setFailedAttempts(0);
      setLockoutUntil(null);
      return { success: true };
    }

    // Failed attempt
    const next = failedAttempts + 1;
    setFailedAttempts(next);
    if (next >= 5) {
      setLockoutUntil(Date.now() + 60000); // 60-second lockout
      return { error: "Too many failed attempts. Login disabled for 60 seconds." };
    }
    const left = 5 - next;
    return { error: `Invalid credentials. ${left} attempt${left !== 1 ? "s" : ""} remaining.` };
  }

  /** Log the logout action, then clear authentication state. */
  function handleAdminLogout() {
    addLog("—", "—", "—", "Admin logout", "—");
    setAdminAuthenticated(false);
  }

  if (!adminAuthenticated) {
    return (
      <AdminLogin
        onLogin={handleAdminLogin}
        failedAttempts={failedAttempts}
        lockoutUntil={lockoutUntil}
      />
    );
  }

  return (
    <AdminPage
      onAdminLogout={handleAdminLogout}
      addLog={addLog}
      adminLogs={adminLogs}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   AdminLogin — shown at /admin when not authenticated
═══════════════════════════════════════════════════════════════════════════ */
function AdminLogin({ onLogin, failedAttempts, lockoutUntil }) {
  const [username, setUsername]           = useState("");
  const [password, setPassword]           = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [error, setError]                 = useState("");
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);

  const pwAnalysis = password ? validateAdminPassword(password) : null;

  /* Live countdown for lockout */
  useEffect(() => {
    if (!lockoutUntil) { setLockSecondsLeft(0); return; }
    function tick() {
      const left = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setLockSecondsLeft(Math.max(0, left));
    }
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [lockoutUntil]);

  const isLockedOut = !!(lockoutUntil && Date.now() < lockoutUntil && lockSecondsLeft > 0);

  function handleSubmit(e) {
    e.preventDefault();
    if (isLockedOut) return;
    setError("");
    const result = onLogin(username, password);
    if (result && result.error) setError(result.error);
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">

        {/* Brand */}
        <div className="admin-login-logo">
          <div className="admin-brand-mark">PH</div>
          <div>
            <div className="admin-login-title">PROMPT HEIST</div>
            <div className="admin-login-sub">ADMIN CONTROL CENTER</div>
          </div>
        </div>

        {/* Security indicator */}
        <div className="security-badge">
          <span className="security-dot">●</span> Secure Session
        </div>

        <div className="admin-login-heading">
          <div className="section-kicker">ADMIN ACCESS</div>
          <h2>Administrator Login</h2>
          <p>Enter your credentials to access the control center. Authorized personnel only.</p>
        </div>

        {/* Lockout banner */}
        {isLockedOut && (
          <div className="lockout-banner" role="alert">
            🔒 Too many failed attempts. Login disabled for{" "}
            <strong>{lockSecondsLeft}s</strong>.
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" noValidate>

          {/* Admin ID */}
          <div className="admin-field">
            <label htmlFor="admin-id">Admin ID</label>
            <input
              id="admin-id"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin ID"
              disabled={isLockedOut}
              autoComplete="username"
              spellCheck={false}
            />
          </div>

          {/* Password with eye toggle */}
          <div className="admin-field">
            <label htmlFor="admin-pw">Password</label>
            <div className="pw-field-wrap">
              <input
                id="admin-pw"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                disabled={isLockedOut}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="pw-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  /* Hide icon */
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  /* Show icon */
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Password strength indicator — shown while typing */}
            {password && pwAnalysis && (
              <div className="pw-strength-wrap">
                <div className="pw-strength-bar">
                  <div
                    className={`pw-strength-fill strength-${pwAnalysis.strength}`}
                    style={{ width: `${(pwAnalysis.passed / 5) * 100}%` }}
                  />
                </div>
                <span className={`pw-strength-label strength-${pwAnalysis.strength}`}>
                  {pwAnalysis.strength === "weak"   ? "Weak"   :
                   pwAnalysis.strength === "medium" ? "Medium" : "Strong"}
                </span>
                {!pwAnalysis.valid && (
                  <ul className="pw-requirements" aria-label="Password requirements not met">
                    {pwAnalysis.rules.filter((r) => !r.ok).map((r, i) => (
                      <li key={i} className="pw-req-item">✗ {r.label}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="admin-login-error" role="alert">{error}</div>
          )}

          <button
            id="admin-login-submit"
            className="admin-login-btn"
            type="submit"
            disabled={isLockedOut}
          >
            Sign In <span>→</span>
          </button>
        </form>

        {/* Disclaimer note */}
        <div className="admin-login-note">
          {/* NOTE: Frontend-only demo — not production-secure. */}
          This panel is for authorized event administrators only. Do not share your credentials.
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   AdminPage — shown after successful authentication
═══════════════════════════════════════════════════════════════════════════ */
function AdminPage({ onAdminLogout, addLog, adminLogs }) {
  const [section, setSection]             = useState("dashboard");
  const [selected, setSelected]           = useState([]);
  const [qualified, setQualified]         = useState([]);
  const [round2Unlocked, setRound2Unlocked] = useState(false);
  const [chatTeam, setChatTeam]           = useState(adminTeams[0].id);
  const [confirmUnlockOpen, setConfirmUnlockOpen] = useState(false);
  const [confirmQualOpen, setConfirmQualOpen]     = useState(false);
  const [notice, setNotice]               = useState("");
  const [remaining, setRemaining]         = useState(5076);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const completedTeams = adminTeams.filter((t) => t.completed);
  const activeTeams    = 6;
  const qualifiedCount = qualified.length;
  const round2Active   = round2Unlocked ? Math.min(qualifiedCount, 3) : 0;

  function formatTimer(total) {
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  function toggleEligible(id) {
    if (round2Unlocked || !completedTeams.some((t) => t.id === id)) return;
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );
  }

  /** Open qualification confirmation modal */
  function openQualificationConfirm() {
    if (!selected.length) {
      setNotice("Select at least one completed Round 1 team first.");
      return;
    }
    setConfirmQualOpen(true);
  }

  /** Confirmed: qualify selected teams. Round 2 remains LOCKED. */
  function confirmQualification() {
    const toQualify = adminTeams.filter((t) => selected.includes(t.id));
    toQualify.forEach((t) => {
      addLog(t.name, t.time, "—", "Team qualified for Round 2", `R1: ${t.r1Challenges}/6, R2: —`);
    });
    setQualified(selected);
    setSelected([]);
    setConfirmQualOpen(false);
    setNotice(
      `${toQualify.length} team${toQualify.length > 1 ? "s" : ""} qualified for Round 2. Round 2 is still LOCKED.`
    );
  }

  /** Confirmed: unlock Round 2 for all qualified teams. */
  function unlockRound2() {
    if (!qualified.length) {
      setNotice("Round 2 cannot be unlocked until qualified teams are confirmed.");
      return;
    }
    setRound2Unlocked(true);
    setConfirmUnlockOpen(false);
    addLog("—", "—", "—", "Round 2 unlocked", `${qualified.length} team${qualified.length > 1 ? "s" : ""} granted access`);
    setNotice(
      `Round 2 UNLOCKED for ${qualified.length} qualified team${qualified.length > 1 ? "s" : ""}.`
    );
  }

  function handleEventStatusChange(newStatus) {
    addLog("—", "—", "—", `Event status changed to: ${newStatus}`, "—");
    setConfirmUnlockOpen(false);
    setNotice(`Event status updated: ${newStatus}`);
  }

  const activeChatTeam = adminTeams.find((t) => t.id === chatTeam) || adminTeams[0];

  return (
    <main className="admin-shell">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div>
          <div className="admin-brand">
            <div className="admin-brand-mark">PH</div>
            <div><strong>PROMPT HEIST</strong><span>AI JAILBREAK</span></div>
          </div>
          <nav className="admin-nav">
            {[
              ["dashboard",   "Dashboard"],
              ["teams",       "Teams"],
              ["round1",      "Round 1"],
              ["round2",      "Round 2"],
              ["chat",        "Team Chat"],
              ["leaderboard", "Leaderboard"],
              ["logs",        "Activity Logs"],
              ["results",     "Results"]
            ].map(([id, label]) => (
              <button
                key={id}
                className={section === id ? "admin-nav-item active" : "admin-nav-item"}
                onClick={() => setSection(id)}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar footer — security badge + logout */}
        <div className="admin-sidebar-foot">
          <div className="security-badge sidebar-security">
            <span className="security-dot">●</span> Authenticated
          </div>
          <button
            id="admin-logout-btn"
            className="admin-logout-btn"
            onClick={onAdminLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <section className="admin-main">
        <header className="admin-header">
          <div>
            <div className="admin-eyebrow">PROMPT HEIST</div>
            <h1>AI JAILBREAK SYMPOSIUM</h1>
          </div>
          <div className="admin-header-state">
            <div><span>EVENT STATUS</span><strong className="live-dot">LIVE</strong></div>
            <div><span>CURRENT ROUND</span><strong>{round2Unlocked ? "ROUND 2" : "ROUND 1"}</strong></div>
            <div><span>EVENT TIMER</span><strong className="timer-value">{formatTimer(remaining)}</strong></div>
          </div>
        </header>

        <div className="admin-content">
          {notice && (
            <div className="admin-notice">
              {notice}
              <button onClick={() => setNotice("")}>×</button>
            </div>
          )}

          {section === "dashboard"   && <AdminDashboard formatTimer={formatTimer} remaining={remaining} activeTeams={activeTeams} completedCount={completedTeams.length} qualifiedCount={qualifiedCount} round2Active={round2Active} round2Unlocked={round2Unlocked} setSection={setSection} />}
          {section === "teams"       && <AdminTeams />}
          {section === "round1"      && <AdminRound1 completedTeams={completedTeams} selected={selected} toggleEligible={toggleEligible} qualified={qualified} openQualificationConfirm={openQualificationConfirm} round2Unlocked={round2Unlocked} />}
          {section === "round2"      && <AdminRound2 qualified={qualified} unlocked={round2Unlocked} onUnlockRequest={() => setConfirmUnlockOpen(true)} teams={adminTeams} />}
          {section === "chat"        && <AdminChat teams={adminTeams} chatTeam={chatTeam} setChatTeam={setChatTeam} activeChatTeam={activeChatTeam} />}
          {section === "leaderboard" && <AdminLeaderboard teams={adminTeams} qualified={qualified} unlocked={round2Unlocked} />}
          {section === "logs"        && <AdminLogs logs={adminLogs} />}
          {section === "results"     && <AdminResults teams={adminTeams} qualified={qualified} unlocked={round2Unlocked} />}

          {/* Event control panel */}
          <section className="admin-control-panel" id="event-control">
            <div><div className="section-kicker">EVENT CONTROL</div><h2>Event control</h2></div>
            <div className="control-grid">
              <ControlValue label="EVENT STATUS"   value="LIVE" />
              <ControlValue label="CURRENT ROUND"  value={round2Unlocked ? "ROUND 2" : "ROUND 1"} />
              <ControlValue label="EVENT TIMER"    value={formatTimer(remaining)} />
              <ControlValue label="ROUND 1 STATUS" value="COMPLETED" />
              <ControlValue label="ROUND 2 STATUS" value={round2Unlocked ? "UNLOCKED" : "LOCKED"} danger={!round2Unlocked} />
              <ControlValue label="AI BOT STATUS"  value={round2Unlocked ? "READY" : "LOCKED"} danger={!round2Unlocked} />
            </div>
            <div className="control-actions">
              <button className="admin-btn secondary" onClick={() => setSection("round1")}>Manage Qualification</button>
              <button
                className="admin-btn primary"
                disabled={!qualified.length || round2Unlocked}
                onClick={() => setConfirmUnlockOpen(true)}
              >
                Unlock Round 2
              </button>
            </div>
          </section>
        </div>
      </section>

      {/* ── Confirmation modal: Unlock Round 2 ── */}
      {confirmUnlockOpen && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <div className="section-kicker">CONFIRM ACTION</div>
            <h2>Unlock Round 2?</h2>
            <p>
              Are you sure you want to unlock Round 2 for the{" "}
              {qualified.length} explicitly qualified team{qualified.length > 1 ? "s" : ""}?
              Teams not selected will remain locked out.
            </p>
            <div className="modal-actions">
              <button className="admin-btn secondary" onClick={() => setConfirmUnlockOpen(false)}>Cancel</button>
              <button className="admin-btn primary" onClick={unlockRound2}>Unlock Round 2</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation modal: Qualify Teams ── */}
      {confirmQualOpen && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <div className="section-kicker">CONFIRM QUALIFICATION</div>
            <h2>Qualify Selected Teams?</h2>
            <p>
              Are you sure you want to qualify the {selected.length} selected
              team{selected.length > 1 ? "s" : ""} for Round 2?
              Round 2 will remain <strong>LOCKED</strong> until you explicitly unlock it.
            </p>
            <div className="modal-actions">
              <button className="admin-btn secondary" onClick={() => setConfirmQualOpen(false)}>Cancel</button>
              <button className="admin-btn primary" onClick={confirmQualification}>Confirm Qualification</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ─── Shared admin UI atoms ─────────────────────────────────────────────── */
function ControlValue({ label, value, danger }) {
  return (
    <div className="control-value">
      <span>{label}</span>
      <strong className={danger ? "danger-text" : ""}>{value}</strong>
    </div>
  );
}

function SectionTitle({ kicker, title, action }) {
  return (
    <div className="admin-section-title">
      <div><div className="section-kicker">{kicker}</div><h2>{title}</h2></div>
      {action}
    </div>
  );
}

/* ─── Dashboard — Event Timing and Round 2 Qualification panels removed ─── */
function AdminDashboard({ formatTimer, remaining, activeTeams, completedCount, qualifiedCount, round2Active, round2Unlocked, setSection }) {
  return <>
    <section className="admin-hero">
      <div>
        <div className="section-kicker">DASHBOARD</div>
        <h2>Event overview</h2>
        <p>Live control view for team progress, round status, and event management.</p>
      </div>
      <div className="hero-timer">
        <span>EVENT TIMER</span>
        <strong>{formatTimer(remaining)}</strong>
        <small>Server timer ready · demo countdown</small>
      </div>
    </section>

    <div className="stat-grid">
      <AdminStat label="TOTAL TEAMS"       value="8" />
      <AdminStat label="ACTIVE TEAMS"      value={activeTeams} />
      <AdminStat label="ROUND 1 COMPLETED" value={completedCount} />
      <AdminStat label="ROUND 2 QUALIFIED" value={qualifiedCount} />
      <AdminStat label="ROUND 2 ACTIVE"    value={round2Active} />
    </div>

    <section className="admin-panel">
      <SectionTitle
        kicker="ROUND 2 STATUS"
        title="Round 2 access control"
        action={<button className="text-link" onClick={() => setSection("round1")}>Manage qualification →</button>}
      />
      <p className="panel-note">
        Round 2 is <strong>LOCKED</strong> until qualification is confirmed and the admin explicitly unlocks it.
        {qualifiedCount > 0 && ` ${qualifiedCount} team${qualifiedCount > 1 ? "s" : ""} currently qualified.`}
      </p>
      <div className={round2Unlocked ? "status-strip unlocked" : "status-strip"}>
        <span>ROUND 2</span>
        <strong>{round2Unlocked ? "UNLOCKED" : "LOCKED"}</strong>
      </div>
    </section>
  </>;
}

function AdminStat({ label, value }) {
  return (
    <div className="admin-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* ─── Teams — shows only name and email, no credentials ────────────────── */
function AdminTeams() {
  return (
    <section className="admin-panel">
      <SectionTitle kicker="TEAM MANAGEMENT" title="Registered teams" />
      <div className="table-wrap">
        <table className="admin-table simple">
          <thead>
            <tr><th>TEAM NAME</th><th>EMAIL</th></tr>
          </thead>
          <tbody>
            {adminTeams.map((team) => (
              <tr key={team.id}>
                <td>{team.name}</td>
                <td className="email-cell">{team.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ─── Round 1 — qualification requires explicit confirmation modal ───────── */
function AdminRound1({ completedTeams, selected, toggleEligible, qualified, openQualificationConfirm, round2Unlocked }) {
  return <>
    <section className="admin-panel">
      <SectionTitle kicker="ROUND 1" title="Round 1 monitoring" />
      <div className="round-summary">
        <ControlValue label="ROUND 1 STATUS"  value="COMPLETED" />
        <ControlValue label="ROUND 1 TIMER"   value="00:00:00" />
        <ControlValue label="TOTAL TEAMS"     value="8" />
        <ControlValue label="SUBMISSIONS"     value={adminTeams.reduce((s, t) => s + t.r1Challenges, 0)} />
        <ControlValue label="COMPLETED"       value={`${completedTeams.length} / 8`} />
        <ControlValue label="QUALIFIED"       value={`${qualified.length} / ${completedTeams.length}`} />
      </div>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>TEAM</th><th>PROGRESS</th><th>CHALLENGES</th><th>COMPLETION TIME</th></tr>
          </thead>
          <tbody>
            {adminTeams.map((team) => (
              <tr key={team.id}>
                <td>{team.name}</td>
                <td>
                  <span className={team.completed ? "table-ok" : ""}>
                    {team.r1Challenges} / 6
                  </span>
                </td>
                <td>{team.r1Challenges}</td>
                <td>{team.completed ? team.time : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    <section className="admin-panel">
      <SectionTitle kicker="ROUND 2 QUALIFICATION" title="Select completed teams" />
      <p className="panel-note">
        Only teams that completed Round 1 can be selected. Selection alone does{" "}
        <strong>not</strong> unlock Round 2 — the admin must explicitly unlock it.
      </p>
      <div className="table-wrap">
        <table className="admin-table qualification">
          <thead>
            <tr><th>TEAM NAME</th><th>ROUND 1 STATUS</th><th>SELECT</th></tr>
          </thead>
          <tbody>
            {adminTeams.map((team) => (
              <tr key={team.id}>
                <td>{team.name}</td>
                <td>
                  {team.completed
                    ? <span className="table-ok">COMPLETED</span>
                    : <span className="muted-cell">INCOMPLETE</span>}
                </td>
                <td>
                  <button
                    className={selected.includes(team.id) ? "check selected" : "check"}
                    disabled={!team.completed || qualified.includes(team.id) || round2Unlocked}
                    onClick={() => toggleEligible(team.id)}
                    aria-label={`Select ${team.name}`}
                  >
                    {selected.includes(team.id) || qualified.includes(team.id) ? "✓" : ""}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="qualification-footer">
        <span>
          {qualified.length
            ? `${qualified.length} team${qualified.length > 1 ? "s" : ""} already qualified`
            : `${selected.length} selected`}
        </span>
        <button
          className="admin-btn primary"
          disabled={!selected.length || round2Unlocked}
          onClick={openQualificationConfirm}
        >
          Confirm Qualified Teams
        </button>
      </div>
    </section>
  </>;
}

/* ─── Round 2 ────────────────────────────────────────────────────────────── */
function AdminRound2({ qualified, unlocked, onUnlockRequest, teams }) {
  const qualifiedTeams = teams.filter((t) => qualified.includes(t.id));
  return <>
    <section className="admin-panel round2-panel">
      <div className="round2-heading">
        <div><div className="section-kicker">ROUND 2</div><h2>Round 2 monitoring</h2></div>
        <div className={unlocked ? "round-state unlocked" : "round-state locked"}>
          <span>ROUND 2</span>
          <strong>{unlocked ? "UNLOCKED" : "LOCKED"}</strong>
        </div>
      </div>
      <div className="round2-summary">
        <ControlValue label="ROUND 2 STATUS"       value={unlocked ? "UNLOCKED" : "LOCKED"} danger={!unlocked} />
        <ControlValue label="ROUND 2 TIMER"        value={unlocked ? "01:14:32" : "—"} />
        <ControlValue label="QUALIFIED TEAMS"      value={`${unlocked ? qualified.length : 0} / ${qualified.length}`} />
        <ControlValue label="ACTIVE TEAMS"         value={unlocked ? Math.min(qualified.length, 3) : 0} />
        <ControlValue label="AI BOT STATUS"        value={unlocked ? "READY" : "LOCKED"} danger={!unlocked} />
        <ControlValue label="TOTAL ATTEMPTS"       value={unlocked ? "17" : "0"} />
        <ControlValue label="CHALLENGES COMPLETED" value={unlocked ? "9" : "0"} />
      </div>
      {!unlocked && (
        <div className="locked-message">
          <strong>ROUND 2 LOCKED</strong>
          <span>Complete qualification, then explicitly unlock the round. No team receives automatic access.</span>
          <button
            className="admin-btn primary"
            disabled={!qualified.length}
            onClick={onUnlockRequest}
          >
            Unlock for Qualified Teams
          </button>
        </div>
      )}
    </section>

    <section className="admin-panel">
      <SectionTitle kicker="AI BOT CHALLENGE" title="Round 2 team progress" />
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>TEAM</th><th>CHALLENGES</th><th>ATTEMPTS</th><th>PROGRESS</th><th>TIME REMAINING</th></tr>
          </thead>
          <tbody>
            {qualifiedTeams.length ? qualifiedTeams.map((team) => (
              <tr key={team.id}>
                <td>{team.name}</td>
                <td>{unlocked ? `${team.r2Challenges} / 6` : "—"}</td>
                <td>{unlocked ? 5 : 0}</td>
                <td>{unlocked ? "3 / 5" : <span className="muted-cell">LOCKED</span>}</td>
                <td>{unlocked ? "00:42:18" : "—"}</td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="empty-cell">No qualified teams yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  </>;
}

/* ─── Team Chat — 6 challenge tabs at top ───────────────────────────────── */
function AdminChat({ teams, chatTeam, setChatTeam, activeChatTeam }) {
  const [activeChallenge, setActiveChallenge] = useState(0);
  const conv = challengeChatMessages[activeChallenge];
  const teamName = activeChatTeam.name;

  return (
    <section className="admin-panel chat-monitor">
      <SectionTitle kicker="ADMIN-ONLY TEAM CHAT" title="Team Chat" />

      {/* Challenge tabs — one per challenge (01–06) */}
      <div className="challenge-tabs-row">
        {challenges.map((_, i) => (
          <button
            key={i}
            className={activeChallenge === i ? "challenge-tab active" : "challenge-tab"}
            onClick={() => setActiveChallenge(i)}
          >
            Challenge {String(i + 1).padStart(2, "0")}
          </button>
        ))}
      </div>

      <div className="chat-admin-layout">
        {/* Team list */}
        <div className="chat-team-list">
          {teams.map((team) => (
            <button
              key={team.id}
              className={chatTeam === team.id ? "chat-team active" : "chat-team"}
              onClick={() => setChatTeam(team.id)}
            >
              {team.name}
              <span>{team.email}</span>
            </button>
          ))}
        </div>

        {/* Chat window for selected team + challenge */}
        <div className="admin-chat-window">
          <div className="admin-chat-head">
            <div>
              <strong>{teamName}</strong>
              <span>Challenge {String(activeChallenge + 1).padStart(2, "0")} conversation</span>
            </div>
            <span className="admin-only-badge">ADMIN ACCESS</span>
          </div>
          <div className="admin-messages">
            <div className="admin-message">
              <span>{conv.team.replace("{name}", teamName)}</span>
              <p>{conv.msg}</p>
            </div>
            <div className="admin-message control">
              <span>{conv.ctrl}</span>
              <p>{conv.reply}</p>
            </div>
          </div>
          <div className="admin-chat-note">
            Admin-only monitoring view. Each tab shows a separate challenge conversation.
            Chat data is intentionally kept separate from the main Teams table.
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Leaderboard ───────────────────────────────────────────────────────── */
function AdminLeaderboard({ teams, qualified, unlocked }) {
  const rows = [...teams].sort((a, b) => {
    const aTotal = a.r1Challenges + (unlocked && qualified.includes(a.id) ? a.r2Challenges : 0);
    const bTotal = b.r1Challenges + (unlocked && qualified.includes(b.id) ? b.r2Challenges : 0);
    return bTotal - aTotal || a.time.localeCompare(b.time);
  });

  return (
    <section className="admin-panel">
      <SectionTitle kicker="LEADERBOARD" title="Live leaderboard" />
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>RANK</th>
              <th>TEAM</th>
              <th>ROUND 1</th>
              <th>ROUND 2</th>
              <th>TOTAL</th>
              <th>COMPLETION TIME</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((team, i) => {
              const r2 = unlocked && qualified.includes(team.id) ? team.r2Challenges : null;
              const total = team.r1Challenges + (r2 !== null ? r2 : 0);
              return (
                <tr key={team.id}>
                  <td>#{i + 1}</td>
                  <td>{team.name}</td>
                  <td>{team.r1Challenges} / 6</td>
                  <td>{r2 !== null ? `${r2} / 6` : "—"}</td>
                  <td>{total}</td>
                  <td>{team.time}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="panel-note">
        Round 2 progress appears only for explicitly qualified teams after Round 2 is unlocked.
      </p>
    </section>
  );
}

/* ─── Activity Logs — 5 columns, no passwords logged ────────────────────── */
function AdminLogs({ logs }) {
  return (
    <section className="admin-panel">
      <SectionTitle kicker="ACTIVITY LOGS" title="Event activity" />
      <div className="log-list">
        <div className="log-row log-head">
          <span>TEAM</span>
          <span>ROUND 1 TIME</span>
          <span>ROUND 2 TIME</span>
          <span>ACTION</span>
          <span>CHALLENGES COMPLETED</span>
        </div>
        {logs.map((log, i) => (
          <div className="log-row" key={i}>
            <span>{log.team}</span>
            <span>{log.r1Time}</span>
            <span>{log.r2Time}</span>
            <span className="log-action">{log.action}</span>
            <span className="log-result">{log.challenges}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="log-row">
            <span colSpan="5" style={{ gridColumn: "1/-1", color: "#5f5f67", textAlign: "center" }}>
              No activity logged yet.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Results — Challenges Completed columns (not raw scores) ───────────── */
function AdminResults({ teams, qualified, unlocked }) {
  const rows = [...teams].sort((a, b) => {
    const aTotal = a.r1Challenges + (unlocked && qualified.includes(a.id) ? a.r2Challenges : 0);
    const bTotal = b.r1Challenges + (unlocked && qualified.includes(b.id) ? b.r2Challenges : 0);
    return bTotal - aTotal || a.time.localeCompare(b.time);
  });

  return (
    <section className="admin-panel">
      <SectionTitle kicker="FINAL RESULTS" title="Results" />
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>RANK</th>
              <th>TEAM</th>
              <th>CHALLENGES COMPLETED IN ROUND 1</th>
              <th>CHALLENGES COMPLETED IN ROUND 2</th>
              <th>TOTAL</th>
              <th>FINAL STATUS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((team, i) => {
              const r2Done  = unlocked && qualified.includes(team.id) ? team.r2Challenges : null;
              const total   = team.r1Challenges + (r2Done !== null ? r2Done : 0);
              const status  =
                unlocked && qualified.includes(team.id) ? <span className="table-ok">QUALIFIED</span> :
                team.completed ? "ROUND 1 COMPLETE" :
                <span className="muted-cell">IN PROGRESS</span>;

              return (
                <tr key={team.id}>
                  <td>#{i + 1}</td>
                  <td>{team.name}</td>
                  <td>{team.r1Challenges} / 6</td>
                  <td>{r2Done !== null ? `${r2Done} / 6` : "—"}</td>
                  <td>{total}</td>
                  <td>{status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ─── Rules alert (participant-facing) ───────────────────────────────────── */
function alertRules() {
  window.alert(
`RULES

1. Team size: 1–2 participants.
2. Each participant can be part of only one team.
3. Complete challenges in strict order.
4. Do not share answers with other teams.
5. Do not interfere with another team's challenge.
6. Scoring is based on completed challenges, with time used as the tie-breaker.
7. Cheating or rule violations result in disqualification.
8. Judges' decision is final.`
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT — routes between participant app and admin auth gate
   /admin  → AdminAuthGate (shows login screen until authenticated)
   /       → App (participant flow — completely separate)
═══════════════════════════════════════════════════════════════════════════ */
function Root() {
  const isAdmin =
    window.location.pathname === "/admin" ||
    window.location.pathname === "/admin/";
  // Admin Control Center is completely isolated from participant navigation.
  return isAdmin ? <AdminAuthGate /> : <App />;
}

createRoot(document.getElementById("root")).render(<Root />);