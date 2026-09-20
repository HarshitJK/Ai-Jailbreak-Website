import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, Link } from "react-router-dom";
import "./styles.css";
import "./party.css";
import { launchPartyEffect } from "./party.js";

import LoginPage, { validatePassword, overview } from "./pages/LoginPage";
import { sendChatMessage, registerTeam, loginTeam } from "./lib/apiClient";
import Round1Page, { challenges, Brand } from "./pages/Round1Page";
import AdminPage, { AdminLoginPage } from "./pages/AdminPage";
import Round2page from "./pages/Round2page";

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
    // Support both old localStorage key (pre-backend-auth) and new key
    const saved =
      localStorage.getItem("prompt-heist-auth") ??
      localStorage.getItem("prompt-heist-account");
    if (saved) setStoredAccount(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (participantAuthenticated && messages.length === 0) {
      setMessages([{
        id: "control-0",
        side: "control",
        text: `Challenge ${String(active + 1).padStart(2, "0")}: ${challenges[active].title}\n\n${challenges[active].goal}`
      }]);
    }
  }, [active, participantAuthenticated]);

  const currentDone = completed.includes(active);
  const allDone     = completed.length === 5;

  async function register() {
    setError("");
    if (!team.trim() || !email.trim() || !password.trim()) { setError("Please complete all three fields."); return; }
    if (team.trim().length !== 4) { setError("Team name must be exactly 4 characters."); return; }
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) { setError("Password must be exactly 4 characters."); return; }
    try {
      setLoading(true);
      const auth = await registerTeam({ team_name: team.trim(), email: email.trim(), password });
      const account = { team: auth.team_name, email: email.trim(), session_token: auth.session_token };
      localStorage.setItem("prompt-heist-auth", JSON.stringify(account));
      setStoredAccount(account);
      setAuthMode("login");
      setPassword("");
      setError("Registration successful. Please login.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    setError("");
    if (loginLockoutUntil && Date.now() < loginLockoutUntil) { setError("Too many failed attempts. Please wait for the countdown to finish."); return; }
    if (!team.trim() || !password) { setError("Please enter your team name and password."); return; }
    try {
      setLoading(true);
      const auth = await loginTeam({ team_name: team.trim(), password });
      const account = { team: auth.team_name, session_token: auth.session_token };
      localStorage.setItem("prompt-heist-auth", JSON.stringify(account));
      setStoredAccount(account);
      setLoginAttempts(0);
      setLoginLockoutUntil(null);
      setParticipantAuthenticated(true);
      setCompleted([]);
      setActive(0);
      setInput("");
      navigate("/round-1");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed.";
      const next = loginAttempts + 1;
      setLoginAttempts(next);
      if (next >= 5) {
        setLoginLockoutUntil(Date.now() + 60000);
        setError("Too many failed attempts. Login disabled for 60 seconds.");
      } else {
        const left = 5 - next;
        setError(`${msg} ${left} attempt${left !== 1 ? "s" : ""} remaining.`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function submitPrompt() {
    const value = input.trim();
    if (!value || loading || currentDone) return;

    const userMsg = { id: Date.now(), side: "user", text: value };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const teamId = storedAccount?.team ?? "unknown";  // team_name string — unchanged API contract
      const { reply, stageComplete, nextStage } = await sendChatMessage({
        team_id: teamId,
        stage: active,   // 0-indexed — backend translates to 1-indexed
        message: value,
      });

      setMessages((m) => [...m, { id: Date.now() + 1, side: "control", text: reply }]);

      if (stageComplete) {
        const nextCompleted = [...new Set([...completed, active])].sort((a, b) => a - b);
        setCompleted(nextCompleted);

        // Trigger Party Effect
        launchPartyEffect();

        // Auto-advance to next stage if available
        if (nextStage !== null && nextStage <= 4) {
          setTimeout(() => jumpToChallenge(nextStage), 600);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error — is the backend running?";
      setMessages((m) => [
        ...m,
        { id: Date.now() + 2, side: "control", text: `[Error] ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
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
    setStoredAccount(null);
    // Clear both old and new localStorage keys
    localStorage.removeItem("prompt-heist-auth");
    localStorage.removeItem("prompt-heist-account");
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
            <Round2page />
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
