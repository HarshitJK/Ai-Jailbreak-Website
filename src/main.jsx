import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./styles.css";

import LoginPage, { validatePassword, overview } from "./pages/LoginPage";
import Round1Page, { challenges, Brand } from "./pages/Round1Page";
import AdminPage, { AdminLoginPage } from "./pages/AdminPage";

/* ═══════════════════════════════════════════════════════════════════════════
   ROUND 2 PAGE (placeholder — kept in main for now)
═══════════════════════════════════════════════════════════════════════════ */
function Round2({ participantTeam, logout, mobileNav, setMobileNav }) {
  return (
    <main className="challenge-page">
      {mobileNav && <div className="mobile-backdrop" onClick={() => setMobileNav(false)} />}
      <aside className={mobileNav ? "sidebar open" : "sidebar"}>
        <div className="sidebar-top">
          <Brand compact />
          <div className="progress-title">Round 2 Progress</div>
        </div>
        <nav className="challenge-nav">
          <button className="challenge-item selected unavailable" disabled>
            <span>Operation Nova</span>
            <small>Locked</small>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button onClick={logout}>Logout</button>
        </div>
      </aside>
      <section className="chat-area">
        <header className="chat-header">
          <div>
            <div className="eyebrow">AI JAILBREAK 2026</div>
            <h1>Round 2: Operation Nova</h1>
          </div>
          <div className="team-chip">{participantTeam}</div>
        </header>
        <div className="chat-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <div className="locked-message" style={{ textAlign: "center", padding: "2rem", border: "1px solid #333", borderRadius: "8px", background: "#111" }}>
            <h2 style={{ color: "#ff4444", marginBottom: "1rem" }}>ROUND 2 LOCKED</h2>
            <p style={{ color: "#aaa" }}>Round 2 has not been unlocked yet or your team has not qualified.</p>
            <p style={{ color: "#888", fontSize: "0.9rem", marginTop: "1rem" }}>Please wait for the Event Control administrator to grant access.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   APP — routing + shared state
═══════════════════════════════════════════════════════════════════════════ */
function App() {
  const [participantAuthenticated, setParticipantAuthenticated] = useState(false);
  const [authMode, setAuthMode]           = useState("login");
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
  const [loginAttempts, setLoginAttempts]         = useState(0);
  const [loginLockoutUntil, setLoginLockoutUntil] = useState(null);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const navigate = useNavigate();

  const progress = completed.length;

  useEffect(() => {
    const saved = localStorage.getItem("prompt-heist-account");
    if (saved) setStoredAccount(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (participantAuthenticated && messages.length === 0) {
      setMessages([{
        id: "control-0",
        side: "control",
        text: `Challenge ${String(active + 1).padStart(2, "0")} is now active.\n\n${challenges[active]}`
      }]);
    }
  }, [active, participantAuthenticated]);

  const currentDone = completed.includes(active);
  const allDone     = completed.length === 6;

  function register() {
    setError("");
    if (!team.trim() || !email.trim() || !password.trim()) { setError("Please complete all three fields."); return; }
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) { setError("Password is too weak. Please follow the requirements shown below."); return; }
    const account = { team: team.trim(), email: email.trim(), password };
    localStorage.setItem("prompt-heist-account", JSON.stringify(account));
    setStoredAccount(account);
    setAuthMode("login");
    setPassword("");
    setError("Registration successful. Please login.");
  }

  function login() {
    setError("");
    if (loginLockoutUntil && Date.now() < loginLockoutUntil) { setError("Too many failed attempts. Please wait for the countdown to finish."); return; }
    const account = storedAccount;
    if (!account) { setError("No account found. Create an account first."); return; }
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
    setLoginAttempts(0);
    setLoginLockoutUntil(null);
    setParticipantAuthenticated(true);
    setCompleted([]);
    setActive(0);
    setInput("");
    navigate("/round-1");
  }

  function submitPrompt() {
    const value = input.trim();
    if (!value || loading || currentDone) return;
    setMessages((m) => [...m, { id: Date.now(), side: "user", text: value }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      const nextCompleted = [...new Set([...completed, active])].sort((a, b) => a - b);
      setCompleted(nextCompleted);
      setLoading(false);
      setMessages((m) => [...m, { id: Date.now() + 1, side: "control", text: "Submission received. Challenge completed. Good work." }]);
      if (active < 5) setTimeout(() => setActive(active + 1), 650);
    }, 900);
  }

  function logout() {
    setParticipantAuthenticated(false);
    setAuthMode("login");
    setPassword("");
    setInput("");
    setCompleted([]);
    setActive(0);
    setMessages([]);
    setMobileNav(false);
    navigate("/login");
  }

  function jumpToChallenge(index) {
    if (index > completed.length) return;
    setActive(index);
    setMobileNav(false);
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={
          <LoginPage
            mode={authMode} setMode={(m) => { setAuthMode(m); setError(""); setPassword(""); }}
            team={team} email={email} password={password}
            setTeam={setTeam} setEmail={setEmail} setPassword={setPassword}
            register={register} login={login} error={error} hasAccount={!!storedAccount}
            loginAttempts={loginAttempts} loginLockoutUntil={loginLockoutUntil}
          />
        } />
        <Route path="/round-1" element={
          participantAuthenticated ? (
            <Round1Page
              team={storedAccount?.team || "Team"} progress={progress} completed={completed}
              active={active} messages={messages} input={input} setInput={setInput}
              loading={loading} currentDone={currentDone} allDone={allDone}
              mobileNav={mobileNav} setMobileNav={setMobileNav}
              jumpToChallenge={jumpToChallenge} submitPrompt={submitPrompt} logout={logout}
              onProceed={() => navigate("/round-2")}
            />
          ) : <Navigate to="/login" replace />
        } />
        <Route path="/round-2" element={
          participantAuthenticated ? (
            <Round2 participantTeam={storedAccount?.team || "Team"} logout={logout} mobileNav={mobileNav} setMobileNav={setMobileNav} />
          ) : <Navigate to="/login" replace />
        } />
        <Route path="/admin/login" element={<AdminLoginPage setAdminAuthenticated={setAdminAuthenticated} />} />
        <Route path="/admin/*" element={adminAuthenticated ? <AdminPage /> : <Navigate to="/admin/login" replace />} />
      </Routes>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════════════════ */
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
