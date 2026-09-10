import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

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
    if (email.trim() !== account.email || password !== account.password) {
      setError("Email or password is incorrect.");
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
      const nextCompleted = [...new Set([...completed, active])].sort((a,b) => a-b);
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
          <Brand />
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
              <label>Email ID<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="team@example.com" /></label>
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
                <small>{done ? "✓ Completed" : active === i ? "⚡ Active" : "Available"}</small>
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

createRoot(document.getElementById("root")).render(<App />);