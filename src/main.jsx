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


const adminTeams = [
  { id: 1, name: "Cyber Titans", email: "cyber@example.com", progress: "6 / 6", submissions: 6, time: "00:38:42", completed: true, r1: 92, r2: 0, total: 92, attempts: 0, r2Progress: "—" },
  { id: 2, name: "Zero Day", email: "zero@example.com", progress: "6 / 6", submissions: 6, time: "00:41:18", completed: true, r1: 88, r2: 0, total: 88, attempts: 0, r2Progress: "—" },
  { id: 3, name: "Prompt X", email: "promptx@example.com", progress: "6 / 6", submissions: 6, time: "00:44:09", completed: true, r1: 84, r2: 0, total: 84, attempts: 0, r2Progress: "—" },
  { id: 4, name: "Root Access", email: "root@example.com", progress: "6 / 6", submissions: 6, time: "00:49:27", completed: true, r1: 81, r2: 0, total: 81, attempts: 0, r2Progress: "—" },
  { id: 5, name: "Byte Force", email: "byte@example.com", progress: "4 / 6", submissions: 4, time: "—", completed: false, r1: 0, r2: 0, total: 0, attempts: 0, r2Progress: "—" },
  { id: 6, name: "Null Pointer", email: "null@example.com", progress: "3 / 6", submissions: 3, time: "—", completed: false, r1: 0, r2: 0, total: 0, attempts: 0, r2Progress: "—" },
  { id: 7, name: "Code Breakers", email: "code@example.com", progress: "2 / 6", submissions: 2, time: "—", completed: false, r1: 0, r2: 0, total: 0, attempts: 0, r2Progress: "—" },
  { id: 8, name: "Shadow Stack", email: "shadow@example.com", progress: "1 / 6", submissions: 1, time: "—", completed: false, r1: 0, r2: 0, total: 0, attempts: 0, r2Progress: "—" }
];

function AdminPage() {
  const [section, setSection] = useState("dashboard");
  const [selected, setSelected] = useState([]);
  const [qualified, setQualified] = useState([]);
  const [round2Unlocked, setRound2Unlocked] = useState(false);
  const [chatTeam, setChatTeam] = useState(adminTeams[0].id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [remaining, setRemaining] = useState(5076);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const completedTeams = adminTeams.filter((t) => t.completed);
  const activeTeams = 6;
  const qualifiedCount = qualified.length;
  const round2Active = round2Unlocked ? Math.min(qualifiedCount, 3) : 0;

  function formatTimer(total) {
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  function toggleEligible(id) {
    if (round2Unlocked || !completedTeams.some((team) => team.id === id)) return;
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function confirmQualification() {
    if (!selected.length) {
      setNotice("Select at least one completed Round 1 team first.");
      return;
    }
    setQualified(selected);
    setSelected([]);
    setNotice(`${selected.length} team${selected.length > 1 ? "s" : ""} qualified for Round 2. Round 2 is still LOCKED.`);
  }

  function unlockRound2() {
    if (!qualified.length) {
      setNotice("Round 2 cannot be unlocked until qualified teams are confirmed.");
      return;
    }
    setRound2Unlocked(true);
    setNotice(`Round 2 UNLOCKED for ${qualified.length} qualified team${qualified.length > 1 ? "s" : ""}.`);
  }

  function runAction(action) {
    setNotice(action);
    setConfirmOpen(false);
  }

  const activeChatTeam = adminTeams.find((t) => t.id === chatTeam) || adminTeams[0];

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <div className="admin-brand">
            <div className="admin-brand-mark">PH</div>
            <div><strong>PROMPT HEIST</strong><span>AI JAILBREAK</span></div>
          </div>
          <nav className="admin-nav">
            {[
              ["dashboard", "Dashboard"], ["teams", "Teams"], ["round1", "Round 1"], ["round2", "Round 2"],
              ["chat", "Team Chat"], ["leaderboard", "Leaderboard"], ["logs", "Activity Logs"], ["results", "Results"]
            ].map(([id, label]) => (
              <button key={id} className={section === id ? "admin-nav-item active" : "admin-nav-item"} onClick={() => setSection(id)}>{label}</button>
            ))}
          </nav>
        </div>
        <div className="admin-sidebar-foot"><strong>ADMIN</strong><span>EVENT CONTROL</span></div>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div><div className="admin-eyebrow">PROMPT HEIST</div><h1>AI JAILBREAK SYMPOSIUM</h1></div>
          <div className="admin-header-state">
            <div><span>EVENT STATUS</span><strong className="live-dot">LIVE</strong></div>
            <div><span>CURRENT ROUND</span><strong>{round2Unlocked ? "ROUND 2" : "ROUND 1"}</strong></div>
            <div><span>EVENT TIMER</span><strong className="timer-value">{formatTimer(remaining)}</strong></div>
          </div>
        </header>

        <div className="admin-content">
          {notice && <div className="admin-notice">{notice}<button onClick={() => setNotice("")}>×</button></div>}

          {section === "dashboard" && <AdminDashboard formatTimer={formatTimer} remaining={remaining} activeTeams={activeTeams} completedCount={completedTeams.length} qualifiedCount={qualifiedCount} round2Active={round2Active} round2Unlocked={round2Unlocked} setSection={setSection} />}
          {section === "teams" && <AdminTeams />}
          {section === "round1" && <AdminRound1 completedTeams={completedTeams} selected={selected} toggleEligible={toggleEligible} qualified={qualified} confirmQualification={confirmQualification} />}
          {section === "round2" && <AdminRound2 qualified={qualified} unlocked={round2Unlocked} unlockRound2={unlockRound2} teams={adminTeams} />}
          {section === "chat" && <AdminChat teams={adminTeams} chatTeam={chatTeam} setChatTeam={setChatTeam} activeChatTeam={activeChatTeam} />}
          {section === "leaderboard" && <AdminLeaderboard teams={adminTeams} qualified={qualified} unlocked={round2Unlocked} />}
          {section === "logs" && <AdminLogs />}
          {section === "results" && <AdminResults teams={adminTeams} qualified={qualified} unlocked={round2Unlocked} />}

          <section className="admin-control-panel" id="event-control">
            <div><div className="section-kicker">EVENT CONTROL</div><h2>Event control</h2></div>
            <div className="control-grid">
              <ControlValue label="EVENT STATUS" value="LIVE" />
              <ControlValue label="CURRENT ROUND" value="ROUND 1" />
              <ControlValue label="EVENT TIMER" value={formatTimer(remaining)} />
              <ControlValue label="ROUND 1 STATUS" value="COMPLETED" />
              <ControlValue label="ROUND 2 STATUS" value={round2Unlocked ? "UNLOCKED" : "LOCKED"} danger={!round2Unlocked} />
              <ControlValue label="AI BOT STATUS" value={round2Unlocked ? "READY" : "LOCKED"} danger={!round2Unlocked} />
            </div>
            <div className="control-actions">
              <button className="admin-btn secondary" onClick={() => setSection("round1")}>Manage Qualification</button>
              <button className="admin-btn primary" disabled={!qualified.length || round2Unlocked} onClick={() => setConfirmOpen(true)}>Unlock Round 2</button>
            </div>
          </section>
        </div>
      </section>

      {confirmOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="section-kicker">CONFIRM ACTION</div>
            <h2>Unlock Round 2?</h2>
            <p>This will give Round 2 access only to the {qualified.length} explicitly qualified team{qualified.length > 1 ? "s" : ""}. Teams not selected will remain locked out.</p>
            <div className="modal-actions"><button className="admin-btn secondary" onClick={() => setConfirmOpen(false)}>Cancel</button><button className="admin-btn primary" onClick={unlockRound2}>Unlock Round 2</button></div>
          </div>
        </div>
      )}
    </main>
  );
}

function ControlValue({ label, value, danger }) {
  return <div className="control-value"><span>{label}</span><strong className={danger ? "danger-text" : ""}>{value}</strong></div>;
}

function SectionTitle({ kicker, title, action }) {
  return <div className="admin-section-title"><div><div className="section-kicker">{kicker}</div><h2>{title}</h2></div>{action}</div>;
}

function AdminDashboard({ formatTimer, remaining, activeTeams, completedCount, qualifiedCount, round2Active, round2Unlocked, setSection }) {
  return <>
    <section className="admin-hero"><div><div className="section-kicker">DASHBOARD</div><h2>Event overview</h2><p>Live control view for team progress, round qualification, and event timing.</p></div><div className="hero-timer"><span>EVENT TIMER</span><strong>{formatTimer(remaining)}</strong><small>Server timer ready · demo countdown</small></div></section>
    <div className="stat-grid">
      <AdminStat label="TOTAL TEAMS" value="8" /><AdminStat label="ACTIVE TEAMS" value={activeTeams} /><AdminStat label="ROUND 1 COMPLETED" value={completedCount} /><AdminStat label="ROUND 2 QUALIFIED" value={qualifiedCount} /><AdminStat label="ROUND 2 ACTIVE" value={round2Active} />
    </div>
    <TimingPanel />
    <section className="admin-panel"><SectionTitle kicker="ROUND 2 QUALIFICATION" title="Select qualified teams" action={<button className="text-link" onClick={() => setSection("round1")}>Open qualification →</button>} /><p className="panel-note">Round 2 is <strong>LOCKED</strong> until qualification is confirmed and the admin explicitly unlocks it.</p><div className={round2Unlocked ? "status-strip unlocked" : "status-strip"}><span>ROUND 2</span><strong>{round2Unlocked ? "UNLOCKED" : "LOCKED"}</strong></div></section>
  </>;
}

function AdminStat({ label, value }) { return <div className="admin-stat"><span>{label}</span><strong>{value}</strong></div>; }

function TimingPanel() {
  const cards = [
    ["EVENT", "09:00:00", "12:00:00", "03:00:00", "01:24:36", "LIVE"],
    ["ROUND 1", "09:10:00", "10:30:00", "01:20:00", "00:00:00", "COMPLETED"],
    ["ROUND 2", "10:45:00", "12:00:00", "01:15:00", "01:15:00", "LOCKED"]
  ];
  return <section className="admin-panel"><SectionTitle kicker="TIMING SYSTEM" title="Event timing" /><div className="timing-grid">{cards.map((c) => <div className="timing-card" key={c[0]}><div className="timing-card-head"><strong>{c[0]}</strong><span className={c[5] === "LOCKED" ? "danger-badge" : "ok-badge"}>{c[5]}</span></div><div className="timing-fields"><ControlValue label="START TIME" value={c[1]} /><ControlValue label="END TIME" value={c[2]} /><ControlValue label="DURATION" value={c[3]} /><ControlValue label="TIME REMAINING" value={c[4]} /></div></div>)}</div><p className="server-note">Timing is structured for a server-controlled source of truth. The countdown shown here is demo state until a backend timer is connected.</p></section>;
}

function AdminTeams() {
  return <section className="admin-panel"><SectionTitle kicker="TEAM MANAGEMENT" title="Registered teams" /><div className="table-wrap"><table className="admin-table simple"><thead><tr><th>TEAM NAME</th><th>EMAIL</th></tr></thead><tbody>{adminTeams.map((team) => <tr key={team.id}><td>{team.name}</td><td className="email-cell">{team.email}</td></tr>)}</tbody></table></div></section>;
}

function AdminRound1({ completedTeams, selected, toggleEligible, qualified, confirmQualification }) {
  return <>
    <section className="admin-panel"><SectionTitle kicker="ROUND 1" title="Round 1 monitoring" /><div className="round-summary"><ControlValue label="ROUND 1 STATUS" value="COMPLETED" /><ControlValue label="ROUND 1 TIMER" value="00:00:00" /><ControlValue label="TOTAL TEAMS" value="8" /><ControlValue label="SUBMISSIONS" value="32" /><ControlValue label="COMPLETED" value={`${completedTeams.length} / 8`} /><ControlValue label="QUALIFIED" value={`${qualified.length} / ${completedTeams.length}`} /></div><div className="table-wrap"><table className="admin-table"><thead><tr><th>TEAM</th><th>PROGRESS</th><th>SUBMISSIONS</th><th>TIME REMAINING</th></tr></thead><tbody>{adminTeams.map((team) => <tr key={team.id}><td>{team.name}</td><td><span className={team.completed ? "table-ok" : ""}>{team.progress}</span></td><td>{team.submissions}</td><td>{team.completed ? "00:00:00" : "00:21:14"}</td></tr>)}</tbody></table></div></section>
    <section className="admin-panel"><SectionTitle kicker="ROUND 2 QUALIFICATION" title="Select completed teams" /><p className="panel-note">Only teams with a completed Round 1 can be selected. Selection alone does not unlock Round 2.</p><div className="table-wrap"><table className="admin-table qualification"><thead><tr><th>TEAM NAME</th><th>ROUND 1 STATUS</th><th>SELECT</th></tr></thead><tbody>{adminTeams.map((team) => <tr key={team.id}><td>{team.name}</td><td>{team.completed ? <span className="table-ok">COMPLETED</span> : <span className="muted-cell">INCOMPLETE</span>}</td><td><button className={selected.includes(team.id) ? "check selected" : "check"} disabled={!team.completed || qualified.includes(team.id)} onClick={() => toggleEligible(team.id)} aria-label={`Select ${team.name}`}>{selected.includes(team.id) ? "✓" : ""}</button></td></tr>)}</tbody></table></div><div className="qualification-footer"><span>{qualified.length ? `${qualified.length} team${qualified.length > 1 ? "s" : ""} already qualified` : `${selected.length} selected`}</span><button className="admin-btn primary" disabled={!selected.length} onClick={confirmQualification}>Confirm Qualified Teams</button></div></section>
  </>;
}

function AdminRound2({ qualified, unlocked, unlockRound2, teams }) {
  const qualifiedTeams = teams.filter((team) => qualified.includes(team.id));
  return <>
    <section className="admin-panel round2-panel"><div className="round2-heading"><div><div className="section-kicker">ROUND 2</div><h2>Round 2 monitoring</h2></div><div className={unlocked ? "round-state unlocked" : "round-state locked"}><span>ROUND 2</span><strong>{unlocked ? "UNLOCKED" : "LOCKED"}</strong></div></div><div className="round2-summary"><ControlValue label="ROUND 2 STATUS" value={unlocked ? "UNLOCKED" : "LOCKED"} danger={!unlocked} /><ControlValue label="ROUND 2 TIMER" value={unlocked ? "01:14:32" : "—"} /><ControlValue label="QUALIFIED TEAMS" value={`${round2Unlocked ? qualified.length : 0} / ${qualified.length}`} /><ControlValue label="ACTIVE TEAMS" value={unlocked ? Math.min(qualified.length, 3) : 0} /><ControlValue label="AI BOT STATUS" value={unlocked ? "READY" : "LOCKED"} danger={!unlocked} /><ControlValue label="TOTAL ATTEMPTS" value={unlocked ? "17" : "0"} /><ControlValue label="CHALLENGES COMPLETED" value={unlocked ? "9" : "0"} /></div>{!unlocked && <div className="locked-message"><strong>ROUND 2 LOCKED</strong><span>Complete qualification, then explicitly unlock the round. No team receives automatic access.</span><button className="admin-btn primary" disabled={!qualified.length} onClick={unlockRound2}>Unlock for Qualified Teams</button></div>}</section>
    <section className="admin-panel"><SectionTitle kicker="AI BOT CHALLENGE" title="Round 2 team progress" /><div className="table-wrap"><table className="admin-table"><thead><tr><th>TEAM</th><th>SCORE</th><th>ATTEMPTS</th><th>PROGRESS</th><th>TIME REMAINING</th></tr></thead><tbody>{qualifiedTeams.length ? qualifiedTeams.map((team) => <tr key={team.id}><td>{team.name}</td><td>{unlocked ? team.r1 + 14 : "—"}</td><td>{unlocked ? 5 : 0}</td><td>{unlocked ? "3 / 5" : "LOCKED"}</td><td>{unlocked ? "00:42:18" : "—"}</td></tr>) : <tr><td colSpan="5" className="empty-cell">No qualified teams yet.</td></tr>}</tbody></table></div></section>
  </>;
}

function AdminChat({ teams, chatTeam, setChatTeam, activeChatTeam }) {
  return <section className="admin-panel chat-monitor"><SectionTitle kicker="ADMIN-ONLY TEAM CHAT" title="Team Chat" /><div className="chat-admin-layout"><div className="chat-team-list">{teams.map((team) => <button key={team.id} className={chatTeam === team.id ? "chat-team active" : "chat-team"} onClick={() => setChatTeam(team.id)}>{team.name}<span>{team.email}</span></button>)}</div><div className="admin-chat-window"><div className="admin-chat-head"><div><strong>{activeChatTeam.name}</strong><span>Internal event chat</span></div><span className="admin-only-badge">ADMIN ACCESS</span></div><div className="admin-messages"><div className="admin-message"><span>10:42:18 · {activeChatTeam.name}</span><p>Challenge 06 submitted.</p></div><div className="admin-message control"><span>10:42:21 · CHALLENGE CONTROL</span><p>Submission received. Challenge completed.</p></div></div><div className="admin-chat-note">Admin-only monitoring view. Chat data is intentionally kept separate from the main Teams table.</div></div></div></section>;
}

function AdminLeaderboard({ teams, qualified, unlocked }) {
  const rows = [...teams].sort((a, b) => b.total - a.total || a.time.localeCompare(b.time));
  return <section className="admin-panel"><SectionTitle kicker="LEADERBOARD" title="Live leaderboard" /><div className="table-wrap"><table className="admin-table"><thead><tr><th>RANK</th><th>TEAM</th><th>ROUND 1</th><th>ROUND 2</th><th>TOTAL</th><th>COMPLETION TIME</th></tr></thead><tbody>{rows.map((team, i) => <tr key={team.id}><td>#{i + 1}</td><td>{team.name}</td><td>{team.r1 || "—"}</td><td>{unlocked && qualified.includes(team.id) ? 14 : "—"}</td><td>{team.r1 || "—"}</td><td>{team.time}</td></tr>)}</tbody></table></div><p className="panel-note">Round 2 scores appear only for explicitly qualified teams after Round 2 is unlocked.</p></section>;
}

function AdminLogs() {
  const logs = [
    ["10:42:18", "CYBER TITANS", "ROUND 1", "CHALLENGE SUBMITTED", "SUCCESS"],
    ["10:55:02", "ADMIN", "ROUND 2", "TEAM QUALIFIED", "CYBER TITANS"],
    ["11:00:00", "ADMIN", "ROUND 2", "ROUND UNLOCKED", "SUCCESS"],
    ["11:04:27", "ZERO DAY", "ROUND 2", "AI BOT ATTEMPT", "RECORDED"],
    ["11:08:16", "PROMPT X", "ROUND 1", "CHALLENGE SUBMITTED", "SUCCESS"]
  ];
  return <section className="admin-panel"><SectionTitle kicker="ACTIVITY LOGS" title="Event activity" /><div className="log-list"><div className="log-row log-head"><span>TIMESTAMP</span><span>TEAM</span><span>ROUND</span><span>ACTION</span><span>RESULT</span></div>{logs.map((log, i) => <div className="log-row" key={i}>{log.map((item, j) => <span key={j} className={j === 4 ? "log-result" : ""}>{item}</span>)}</div>)}</div></section>;
}

function AdminResults({ teams, qualified, unlocked }) {
  return <section className="admin-panel"><SectionTitle kicker="FINAL RESULTS" title="Results" /><div className="table-wrap"><table className="admin-table"><thead><tr><th>RANK</th><th>TEAM</th><th>ROUND 1 SCORE</th><th>ROUND 2 SCORE</th><th>TOTAL SCORE</th><th>FINAL STATUS</th></tr></thead><tbody>{teams.slice(0, 6).map((team, i) => <tr key={team.id}><td>{i + 1}</td><td>{team.name}</td><td>{team.r1 || "—"}</td><td>{unlocked && qualified.includes(team.id) ? 14 : "—"}</td><td>{team.r1 || "—"}</td><td>{unlocked && qualified.includes(team.id) ? "QUALIFIED" : team.completed ? "ROUND 1 COMPLETE" : "IN PROGRESS"}</td></tr>)}</tbody></table></div></section>;
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

function Root() {
  const isAdmin = window.location.pathname === "/admin" || window.location.pathname === "/admin/";
  return isAdmin ? <AdminPage /> : <App />;
}

createRoot(document.getElementById("root")).render(<Root />);