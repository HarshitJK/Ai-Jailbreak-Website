import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, Link } from "react-router-dom";
import "./styles.css";
import "./party.css";
import { launchPartyEffect } from "./party.js";

import LoginPage, { overview } from "./pages/LoginPage";
import { sendChatMessage, registerTeam, loginTeam, logoutTeam, getMe, adminLogin, adminLogout, fetchRound1History, resetStageChat } from "./lib/apiClient";
import Round1Page, { challenges, Brand } from "./pages/Round1Page";
import AdminPage, { AdminLoginPage } from "./pages/AdminPage";
import Round2Page from "./round2/Round2Page";


/* ═══════════════════════════════════════════════════════════════════════════
   ProtectedRoute — calls GET /api/me on mount; if 401 → redirects to /login.
   Passes teamName down to the wrapped page so it can display it.
═══════════════════════════════════════════════════════════════════════════ */
function ProtectedRoute({ children, onTeamName, onUserData }) {
  const [status, setStatus] = useState("loading"); // "loading" | "ok" | "unauth"
  const navigate = useNavigate();

  useEffect(() => {
    getMe()
      .then((data) => {
        if (onTeamName) onTeamName(data.team_name);
        if (onUserData) onUserData(data);
        setStatus("ok");
      })
      .catch(() => {
        setStatus("unauth");
        navigate("/login", { replace: true });
      });
  }, []);

  if (status === "loading") return null; // or a spinner
  if (status === "unauth") return null;
  return children;
}

/* ═══════════════════════════════════════════════════════════════════════════
   AdminProtectedRoute — calls GET /api/admin/teams as a lightweight probe;
   if 401 → redirects to /admin/login.
═══════════════════════════════════════════════════════════════════════════ */
function AdminProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading");
  const navigate = useNavigate();

  useEffect(() => {
    // Probe the admin session by hitting the teams endpoint.
    // We don't use /api/me here because that's the player session.
    import("./lib/apiClient").then(({ fetchAdminTeams }) => {
      fetchAdminTeams()
        .then(() => setStatus("ok"))
        .catch(() => {
          setStatus("unauth");
          navigate("/admin/login", { replace: true });
        });
    });
  }, []);

  if (status === "loading") return null;
  if (status === "unauth") return null;
  return children;
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
  const [messagesByStage, setMessagesByStage] = useState({}); // Stores chat logs keyed by challenge index
  const [input, setInput]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [mobileNav, setMobileNav]         = useState(false);
  const [error, setError]                 = useState("");
  const [loginAttempts, setLoginAttempts]         = useState(0);
  const [loginLockoutUntil, setLoginLockoutUntil] = useState(null);
  const navigate = useNavigate();

  const progress = completed.length;

  useEffect(() => {
    // Support both old localStorage key (pre-backend-auth) and new key
    const saved =
      localStorage.getItem("prompt-heist-auth") ??
      localStorage.getItem("prompt-heist-account");
    if (saved) setStoredAccount(JSON.parse(saved));
  }, []);

  // Load history whenever the active stage changes OR when we have an account (covers page reload)
  useEffect(() => {
    if (!storedAccount) return;  // not logged in yet
    setLoading(true);
    fetchRound1History(active)
      .then((logs) => {
        const objectiveMsg = {
          id: "control-0",
          side: "control",
          text: `Challenge ${String(active + 1).padStart(2, "0")}: ${challenges[active].title}\n\n${challenges[active].goal}`
        };

        if (logs.length === 0) {
          setMessagesByStage(prev => ({
            ...prev,
            [active]: []
          }));
        } else {
          const mapped = logs.map((log, i) => ({
            id: `log-${i}`,
            side: log.role === "user" ? "user" : "control",
            text: log.message
          }));
          setMessagesByStage(prev => ({
            ...prev,
            [active]: mapped
          }));
        }
      })
      .catch((err) => {
        console.error("Failed to load history:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [active, storedAccount]);

  const currentDone = completed.includes(active);
  const allDone     = completed.length === 5;

  async function register() {
    setError("");
    if (!team.trim() || !email.trim() || !password.trim()) { setError("Please complete all three fields."); return; }
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
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
      // Backend sets the httpOnly session cookie automatically.
      // Keep a localStorage entry so the team name is available for display.
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
    setMessagesByStage((prev) => ({
      ...prev,
      [active]: [...(prev[active] || []), userMsg]
    }));
    setInput("");
    setLoading(true);

    try {
      // team_id no longer sent — backend reads it from the session cookie
      const { reply, stageComplete, nextStage, currentRound1Stage } = await sendChatMessage({
        stage: active,   // 0-indexed — backend translates to 1-indexed
        message: value,
      });

      setMessagesByStage((prev) => ({
        ...prev,
        [active]: [...(prev[active] || []), { id: Date.now() + 1, side: "control", text: reply }]
      }));

      if (currentRound1Stage !== undefined) {
        const completedStages = Array.from({length: currentRound1Stage}, (_, i) => i);
        setCompleted(completedStages);
        
        if (stageComplete) {
          launchPartyEffect();
          if (nextStage !== null && nextStage <= 4) {
            setTimeout(() => jumpToChallenge(nextStage), 600);
          }
        } else if (currentRound1Stage > active) {
          jumpToChallenge(currentRound1Stage < 5 ? currentRound1Stage : 4);
        }
      } else {
        if (stageComplete) {
          const nextCompleted = [...new Set([...completed, active])].sort((a, b) => a - b);
          setCompleted(nextCompleted);
          launchPartyEffect();
          if (nextStage !== null && nextStage <= 4) {
            setTimeout(() => jumpToChallenge(nextStage), 600);
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error — is the backend running?";
      setMessagesByStage((prev) => ({
        ...prev,
        [active]: [...(prev[active] || []), { id: Date.now() + 2, side: "control", text: `[Error] ${msg}` }]
      }));
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    // Call backend to clear the httpOnly session cookie
    try { await logoutTeam(); } catch (_) { /* ignore network errors on logout */ }

    setParticipantAuthenticated(false);
    setAuthMode("login");
    setPassword("");
    setInput("");
    setCompleted([]);
    setActive(0);
    setMessagesByStage({});
    setMobileNav(false);
    setStoredAccount(null);
    localStorage.removeItem("prompt-heist-auth");
    localStorage.removeItem("prompt-heist-account");
    navigate("/login");
  }

  async function resetChat() {
    if (loading) return;
    if (!window.confirm("Reset chat history for this stage? Your progress on this stage will be lost.")) return;
    setLoading(true);
    try {
      await resetStageChat(active);
      // Remove from completed list if it was done
      setCompleted(prev => prev.filter(i => i !== active));
      // Reload history (will show the intro message)
      const logs = await fetchRound1History(active);
      if (logs.length === 0) {
        setMessagesByStage(prev => ({
          ...prev,
          [active]: []
        }));
      } else {
        setMessagesByStage(prev => ({
          ...prev,
          [active]: logs.map((log, i) => ({
            id: `log-${i}`,
            side: log.role === "user" ? "user" : "control",
            text: log.message
          }))
        }));
      }
    } catch (err) {
      console.error("Failed to reset stage:", err);
    } finally {
      setLoading(false);
    }
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
          <ProtectedRoute 
            onTeamName={(name) => setStoredAccount(a => ({ ...a, team: name }))}
            onUserData={(data) => {
              const stage = data.round1_stage || 0;
              const completedStages = Array.from({length: stage}, (_, i) => i);
              setCompleted(completedStages);
              setActive(stage < 5 ? stage : 4);
            }}
          >
            <Round1Page
              onSyncStage={(stage) => {
                const completedStages = Array.from({length: stage}, (_, i) => i);
                setCompleted(completedStages);
                if (stage > active) {
                  setActive(stage < 5 ? stage : 4);
                }
              }}
              team={storedAccount?.team || "Team"} progress={progress} completed={completed}
              active={active} messages={messagesByStage[active] || []} input={input} setInput={setInput}
              loading={loading} currentDone={currentDone} allDone={allDone}
              mobileNav={mobileNav} setMobileNav={setMobileNav}
              jumpToChallenge={jumpToChallenge} submitPrompt={submitPrompt} logout={logout}
              resetChat={resetChat}
              onProceed={() => navigate("/round-2")}
            />
          </ProtectedRoute>
        } />
        <Route path="/round-2" element={<Round2Page />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/*" element={
          <AdminProtectedRoute>
            <AdminPage />
          </AdminProtectedRoute>
        } />
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
