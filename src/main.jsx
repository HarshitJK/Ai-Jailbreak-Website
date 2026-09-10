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
   PASSWORD SECURITY — participant login / registration
   Policy: 8+ chars, uppercase, lowercase, number
═══════════════════════════════════════════════════════════════════════════ */
function validatePassword(pw) {
  const rules = [
    { label: "At least 8 characters",      ok: pw.length >= 8 },
    { label: "One uppercase letter (A–Z)",  ok: /[A-Z]/.test(pw) },
    { label: "One lowercase letter (a–z)",  ok: /[a-z]/.test(pw) },
    { label: "One number (0–9)",            ok: /[0-9]/.test(pw) }
  ];
  const passed = rules.filter((r) => r.ok).length;
  const valid  = passed === 4;
  let strength = "weak";
  if (passed >= 2 && pw.length >= 5) strength = "medium";
  if (valid)                          strength = "strong";
  return { valid, strength, rules, passed };
}

/* ═══════════════════════════════════════════════════════════════════════════
   PARTICIPANT APP
═══════════════════════════════════════════════════════════════════════════ */
function App() {
  const [page, setPage]                   = useState("auth");
  const [authMode, setAuthMode]           = useState("register");
  const [team, setTeam]                   = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [storedAccount, setStoredAccount] = useState(null);
  const [completed, setCompleted]         = useState([]);
  const [active, setActive]               = useState(0);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [mobileNav, setMobileNav]         = useState(false);
  const [error, setError]                 = useState("");

  // Login brute-force protection
  const [loginAttempts, setLoginAttempts]         = useState(0);
  const [loginLockoutUntil, setLoginLockoutUntil] = useState(null);

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
  const allDone     = completed.length === 6;

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
    // Password strength check on registration
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      setError("Password is too weak. Please follow the requirements shown below.");
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
    // Lockout check
    if (loginLockoutUntil && Date.now() < loginLockoutUntil) {
      setError("Too many failed attempts. Please wait for the countdown to finish.");
      return;
    }
    const account = storedAccount;
    if (!account) {
      setError("No account found. Create an account first.");
      return;
    }
    if (team.trim() !== account.team || password !== account.password) {
      const next = loginAttempts + 1;
      setLoginAttempts(next);
      if (next >= 5) {
        setLoginLockoutUntil(Date.now() + 60000);
        setError("Too many failed attempts. Login disabled for 60 seconds.");
      } else {
        const left = 5 - next;
        setError(`Team name or password is incorrect. ${left} attempt${left !== 1 ? "s" : ""} remaining.`);
      }
      return;
    }
    // Success — reset counters
    setLoginAttempts(0);
    setLoginLockoutUntil(null);
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
          setMode={(m) => { setAuthMode(m); setError(""); setPassword(""); }}
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
          loginAttempts={loginAttempts}
          loginLockoutUntil={loginLockoutUntil}
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

/* ═══════════════════════════════════════════════════════════════════════════
   AUTH PAGE — with password strength, eye toggle, brute-force protection
═══════════════════════════════════════════════════════════════════════════ */
function AuthPage({
  mode, setMode, team, email, password, setTeam, setEmail, setPassword,
  register, login, error, hasAccount, loginAttempts, loginLockoutUntil
}) {
  const [showRegPw, setShowRegPw]   = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [lockSecsLeft, setLockSecsLeft] = useState(0);

  const pwAnalysis = password ? validatePassword(password) : null;

  // Live countdown for login lockout
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
      {/* ── Left intro panel ── */}
      <section className="intro-panel">
        <div className="intro-inner">
          <div className="intro-copy">
            <div className="eyebrow">EVENT NAME</div>
            <h1>PROMPT HEIST</h1>
            <p className="lead">Think Different. Prompt Smarter.</p>

            <div className="overview">
              <h2>Event Overview</h2>
              <ul className="overview-points">
                {overview.map((point, i) => <li key={i}>{point}</li>)}
              </ul>
              <p className="motto">Think. Prompt. Break. Advance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Right auth panel ── */}
      <section className="auth-panel">
        <div className="auth-box">
          <div className="auth-tabs">
            <button className={mode === "register" ? "tab active" : "tab"} onClick={() => setMode("register")}>Register</button>
            <button className={mode === "login"    ? "tab active" : "tab"} onClick={() => setMode("login")}>Login</button>
          </div>

          <div className="auth-heading">
            <div className="eyebrow">{mode === "register" ? "CREATE TEAM" : "WELCOME BACK"}</div>
            <h2>{mode === "register" ? "Enter the Heist" : "Continue the Heist"}</h2>
            <p>{mode === "register" ? "Create your team account to begin." : "Sign in with your registered team account."}</p>
          </div>

          {/* ── REGISTER FORM ── */}
          {mode === "register" ? (
            <form onSubmit={(e) => { e.preventDefault(); register(); }}>
              <label>
                Team Name
                <input
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="Enter team name"
                />
              </label>

              <label>
                Email ID
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="team@example.com"
                />
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
                  <button
                    type="button"
                    className="pw-eye-btn"
                    onClick={() => setShowRegPw((v) => !v)}
                    aria-label={showRegPw ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showRegPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password strength indicator */}
                {password && pwAnalysis && (
                  <div className="pw-strength-wrap">
                    <div className="pw-strength-bar">
                      <div
                        className={`pw-strength-fill strength-${pwAnalysis.strength}`}
                        style={{ width: `${(pwAnalysis.passed / 4) * 100}%` }}
                      />
                    </div>
                    <span className={`pw-strength-label strength-${pwAnalysis.strength}`}>
                      {pwAnalysis.strength === "weak"   ? "Weak"   :
                       pwAnalysis.strength === "medium" ? "Medium" : "Strong"}
                    </span>
                    {!pwAnalysis.valid && (
                      <ul className="pw-requirements">
                        {pwAnalysis.rules.filter((r) => !r.ok).map((r, i) => (
                          <li key={i} className="pw-req-item">✗ {r.label}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </label>

              <button className="primary-btn" type="submit">
                Create Account <span>→</span>
              </button>
            </form>

          ) : (
          /* ── LOGIN FORM ── */
            <form onSubmit={(e) => { e.preventDefault(); login(); }}>

              {/* Lockout banner */}
              {isLockedOut && (
                <div className="auth-lockout-banner" role="alert">
                  🔒 Too many failed attempts. Please wait <strong>{lockSecsLeft}s</strong>.
                </div>
              )}

              <label>
                Team Name
                <input
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="Enter team name"
                  disabled={isLockedOut}
                />
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
                  <button
                    type="button"
                    className="pw-eye-btn"
                    onClick={() => setShowLoginPw((v) => !v)}
                    aria-label={showLoginPw ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showLoginPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </label>

              {/* Attempt counter hint */}
              {loginAttempts > 0 && !isLockedOut && (
                <div className="auth-attempt-hint">
                  {5 - loginAttempts} attempt{5 - loginAttempts !== 1 ? "s" : ""} remaining before temporary lockout.
                </div>
              )}

              <button className="primary-btn" type="submit" disabled={isLockedOut}>
                Start Challenge <span>→</span>
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
            const done      = completed.includes(i);
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
                    <div className={msg.side === "user" ? "message-avatar red" : "message-avatar"}>
                      {msg.side === "user" ? "Y" : "PH"}
                    </div>
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
                <button
                  className="send-btn"
                  onClick={submitPrompt}
                  disabled={!input.trim() || loading || currentDone}
                >
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
   ADMIN CONTROL CENTER — direct access at /admin (no login required)
   All admin functionality remains intact.
═══════════════════════════════════════════════════════════════════════════ */

/* ─── Admin team data — no passwords stored ─────────────────────────────── */
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

/* ─── Initial demo activity log ─────────────────────────────────────────── */
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

function AdminPage() {
  const [section, setSection]             = useState("dashboard");
  const [selected, setSelected]           = useState([]);
  const [qualified, setQualified]         = useState([]);
  const [round2Unlocked, setRound2Unlocked] = useState(false);
  const [chatTeam, setChatTeam]           = useState(adminTeams[0].id);
  const [confirmUnlockOpen, setConfirmUnlockOpen] = useState(false);
  const [confirmQualOpen, setConfirmQualOpen]     = useState(false);
  const [notice, setNotice]               = useState("");
  const [remaining, setRemaining]         = useState(5076);
  const [adminLogs, setAdminLogs]         = useState(initialAdminLogs);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const completedTeams = adminTeams.filter((t) => t.completed);
  const activeTeams    = 6;
  const qualifiedCount = qualified.length;
  const round2Active   = round2Unlocked ? Math.min(qualifiedCount, 3) : 0;

  function addLog(team, r1Time, r2Time, action, challenges) {
    const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
    setAdminLogs((prev) => [{ ts, team, r1Time, r2Time, action, challenges }, ...prev]);
  }

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

  function openQualificationConfirm() {
    if (!selected.length) {
      setNotice("Select at least one completed Round 1 team first.");
      return;
    }
    setConfirmQualOpen(true);
  }

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
        <div className="admin-sidebar-foot">
          <strong>ADMIN</strong>
          <span>EVENT CONTROL</span>
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
            </div>
            <div className="control-actions">
              <button className="admin-btn secondary" onClick={() => setSection("round1")}>Manage Qualification</button>
            </div>
          </section>
        </div>
      </section>

      {/* Unlock Round 2 confirmation */}
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

      {/* Qualify teams confirmation */}
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

/* ─── Dashboard ─────────────────────────────────────────────────────────── */
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
    </div>
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

/* ─── Teams ─────────────────────────────────────────────────────────────── */
function AdminTeams() {
  return (
    <section className="admin-panel">
      <SectionTitle kicker="TEAM MANAGEMENT" title="Registered teams" />
      <div className="table-wrap">
        <table className="admin-table simple">
          <thead><tr><th>TEAM NAME</th><th>EMAIL</th></tr></thead>
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

/* ─── Round 1 ────────────────────────────────────────────────────────────── */
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
                <td><span className={team.completed ? "table-ok" : ""}>{team.r1Challenges} / 6</span></td>
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
        Only teams that completed Round 1 can be selected. Selection alone does <strong>not</strong> unlock Round 2.
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
          <button className="admin-btn primary" disabled={!qualified.length} onClick={onUnlockRequest}>
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

/* ─── Team Chat — 6 challenge tabs ──────────────────────────────────────── */
function AdminChat({ teams, chatTeam, setChatTeam, activeChatTeam }) {
  const [activeChallenge, setActiveChallenge] = useState(0);
  const conv = challengeChatMessages[activeChallenge];

  return (
    <section className="admin-panel chat-monitor">
      <SectionTitle kicker="ADMIN-ONLY TEAM CHAT" title="Team Chat" />

      {/* Challenge tabs — Challenge 01–06 */}
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

        <div className="admin-chat-window">
          <div className="admin-chat-head">
            <div>
              <strong>{activeChatTeam.name}</strong>
              <span>Challenge {String(activeChallenge + 1).padStart(2, "0")} conversation</span>
            </div>
            <span className="admin-only-badge">ADMIN ACCESS</span>
          </div>
          <div className="admin-messages">
            <div className="admin-message">
              <span>{conv.team.replace("{name}", activeChatTeam.name)}</span>
              <p>{conv.msg}</p>
            </div>
            <div className="admin-message control">
              <span>{conv.ctrl}</span>
              <p>{conv.reply}</p>
            </div>
          </div>
          <div className="admin-chat-note">
            Admin-only monitoring view. Each tab shows a separate challenge conversation.
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
            <tr><th>RANK</th><th>TEAM</th><th>ROUND 1</th><th>ROUND 2</th><th>TOTAL</th><th>COMPLETION TIME</th></tr>
          </thead>
          <tbody>
            {rows.map((team, i) => {
              const r2    = unlocked && qualified.includes(team.id) ? team.r2Challenges : null;
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
      <p className="panel-note">Round 2 progress appears only for qualified teams after Round 2 is unlocked.</p>
    </section>
  );
}

/* ─── Activity Logs — 5 columns ─────────────────────────────────────────── */
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
            <span style={{ gridColumn: "1/-1", color: "#5f5f67", textAlign: "center" }}>No activity logged yet.</span>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Results — challenges completed columns ─────────────────────────────── */
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
              <th>FINAL STATUS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((team, i) => {
              const r2Done = unlocked && qualified.includes(team.id) ? team.r2Challenges : null;
              const status =
                unlocked && qualified.includes(team.id) ? <span className="table-ok">QUALIFIED</span> :
                team.completed ? "ROUND 1 COMPLETE" :
                <span className="muted-cell">IN PROGRESS</span>;
              return (
                <tr key={team.id}>
                  <td>#{i + 1}</td>
                  <td>{team.name}</td>
                  <td>{team.r1Challenges} / 6</td>
                  <td>{r2Done !== null ? `${r2Done} / 6` : "—"}</td>
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

/* ─── Rules alert ────────────────────────────────────────────────────────── */
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
   ROOT — routes /admin to dashboard directly, / to participant app
═══════════════════════════════════════════════════════════════════════════ */
function Root() {
  const isAdmin =
    window.location.pathname === "/admin" ||
    window.location.pathname === "/admin/";
  return isAdmin ? <AdminPage /> : <App />;
}

createRoot(document.getElementById("root")).render(<Root />);