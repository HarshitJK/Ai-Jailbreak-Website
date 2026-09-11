import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { validatePassword } from "./LoginPage";
import { challenges } from "./Round1Page";

const adminTeams = [
  { id: 1, name: "Cyber Titans", email: "cyber@example.com", r1Challenges: 6, r2Challenges: 0, time: "00:38:42", completed: true },
  { id: 2, name: "Zero Day", email: "zero@example.com", r1Challenges: 6, r2Challenges: 0, time: "00:41:18", completed: true },
  { id: 3, name: "Prompt X", email: "promptx@example.com", r1Challenges: 6, r2Challenges: 0, time: "00:44:09", completed: true },
  { id: 4, name: "Root Access", email: "root@example.com", r1Challenges: 6, r2Challenges: 0, time: "00:49:27", completed: true },
  { id: 5, name: "Byte Force", email: "byte@example.com", r1Challenges: 4, r2Challenges: 0, time: "-", completed: false },
  { id: 6, name: "Null Pointer", email: "null@example.com", r1Challenges: 3, r2Challenges: 0, time: "-", completed: false },
  { id: 7, name: "Code Breakers", email: "code@example.com", r1Challenges: 2, r2Challenges: 0, time: "-", completed: false },
  { id: 8, name: "Shadow Stack", email: "shadow@example.com", r1Challenges: 1, r2Challenges: 0, time: "-", completed: false }
];

const initialAdminLogs = [
  { ts: "10:38:42", team: "Cyber Titans", r1Time: "00:38:42", r2Time: "-", action: "Round 1 completed", challenges: "R1: 6/6, R2: -" },
  { ts: "10:41:18", team: "Zero Day", r1Time: "00:41:18", r2Time: "-", action: "Round 1 completed", challenges: "R1: 6/6, R2: -" },
  { ts: "10:44:09", team: "Prompt X", r1Time: "00:44:09", r2Time: "-", action: "Round 1 completed", challenges: "R1: 6/6, R2: -" },
  { ts: "10:49:27", team: "Root Access", r1Time: "00:49:27", r2Time: "-", action: "Round 1 completed", challenges: "R1: 6/6, R2: -" }
];

const challengeChatMessages = [
  { team: "10:31:04 - {name}", ctrl: "10:31:08 - CHALLENGE CONTROL", msg: "Challenge 01 submitted.", reply: "Challenge 01 completed." },
  { team: "10:35:22 - {name}", ctrl: "10:35:27 - CHALLENGE CONTROL", msg: "Challenge 02 submitted.", reply: "Challenge 02 completed." },
  { team: "10:39:11 - {name}", ctrl: "10:39:14 - CHALLENGE CONTROL", msg: "Challenge 03 submitted.", reply: "Challenge 03 completed." },
  { team: "10:42:55 - {name}", ctrl: "10:42:58 - CHALLENGE CONTROL", msg: "Challenge 04 submitted.", reply: "Challenge 04 completed." },
  { team: "10:46:33 - {name}", ctrl: "10:46:37 - CHALLENGE CONTROL", msg: "Challenge 05 submitted.", reply: "Challenge 05 completed." },
  { team: "10:49:01 - {name}", ctrl: "10:49:05 - CHALLENGE CONTROL", msg: "Challenge 06 submitted.", reply: "Challenge 06 completed. Heist complete." }
];

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

function AdminStat({ label, value }) {
  return <div className="admin-stat"><span>{label}</span><strong>{value}</strong></div>;
}

export function AdminLoginPage({ setAdminAuthenticated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleLogin(e) {
    e.preventDefault();
    if (username === "admin" && password === "Admin@123") {
      setAdminAuthenticated(true);
      navigate("/admin");
    }
  }

  const pwAnalysis = password ? validatePassword(password) : null;

  return (
    <main className="auth-page">
      <section className="auth-panel" style={{ flex: "1 1 100%", display: "flex", justifyContent: "center" }}>
        <div className="auth-box">
          <div className="auth-heading">
            <div className="eyebrow">ADMIN SECURE ACCESS</div>
            <h2>Admin Login</h2>
            <p>Enter your administrator credentials to access the dashboard.</p>
          </div>
          <form onSubmit={handleLogin}>
            <label>Admin Username<input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" /></label>
            <label>
              Admin Password
              <div className="pw-field-wrap">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" />
                <button type="button" className="pw-eye-btn" onClick={() => setShowPw(v => !v)}>
                  {showPw ? (
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
                </div>
              )}
            </label>
            <button className="primary-btn" type="submit">Access Dashboard</button>
          </form>
          {error && <div className="form-message">{error}</div>}
        </div>
      </section>
    </main>
  );
}

function AdminDashboard({ formatTimer, remaining, activeTeams, completedCount }) {
  return (
    <>
      <section className="admin-hero">
        <div>
          <div className="section-kicker">DASHBOARD</div>
          <h2>Event overview</h2>
          <p>Live control view for team progress, round status, and event management.</p>
        </div>
        <div className="hero-timer">
          <span>EVENT TIMER</span>
          <strong>{formatTimer(remaining)}</strong>
          <small>Server timer ready - demo countdown</small>
        </div>
      </section>
      <div className="stat-grid">
        <AdminStat label="TOTAL TEAMS" value="8" />
        <AdminStat label="ACTIVE TEAMS" value={activeTeams} />
        <AdminStat label="ROUND 1 COMPLETED" value={completedCount} />
      </div>
    </>
  );
}

function AdminTeams() {
  return (
    <section className="admin-panel">
      <SectionTitle kicker="TEAM MANAGEMENT" title="Registered teams" />
      <div className="table-wrap">
        <table className="admin-table simple">
          <thead><tr><th>TEAM NAME</th><th>EMAIL</th></tr></thead>
          <tbody>{adminTeams.map((team) => <tr key={team.id}><td>{team.name}</td><td className="email-cell">{team.email}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

function AdminRound1({ completedTeams, selected, toggleEligible, qualified, openQualificationConfirm, round2Unlocked }) {
  return (
    <>
      <section className="admin-panel">
        <SectionTitle kicker="ROUND 1" title="Round 1 monitoring" />
        <div className="round-summary">
          <ControlValue label="ROUND 1 STATUS" value="COMPLETED" />
          <ControlValue label="TOTAL TEAMS" value="8" />
          <ControlValue label="COMPLETED" value={`${completedTeams.length} / 8`} />
          <ControlValue label="QUALIFIED" value={`${qualified.length} / ${completedTeams.length}`} />
        </div>
        <div className="table-wrap">
          <table className="admin-table">
            <thead><tr><th>TEAM</th><th>PROGRESS</th><th>CHALLENGES</th><th>COMPLETION TIME</th></tr></thead>
            <tbody>
              {adminTeams.map((team) => (
                <tr key={team.id}>
                  <td>{team.name}</td>
                  <td><span className={team.completed ? "table-ok" : ""}>{team.r1Challenges} / 6</span></td>
                  <td>{team.r1Challenges}</td>
                  <td>{team.completed ? team.time : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="admin-panel">
        <SectionTitle kicker="ROUND 2 QUALIFICATION" title="Select completed teams" />
        <p className="panel-note">Only teams that completed Round 1 can be selected.</p>
        <div className="table-wrap">
          <table className="admin-table qualification">
            <thead><tr><th>TEAM NAME</th><th>ROUND 1 STATUS</th><th>SELECT</th></tr></thead>
            <tbody>
              {adminTeams.map((team) => (
                <tr key={team.id}>
                  <td>{team.name}</td>
                  <td>{team.completed ? <span className="table-ok">COMPLETED</span> : <span className="muted-cell">INCOMPLETE</span>}</td>
                  <td>
                    <button
                      className={selected.includes(team.id) ? "check selected" : "check"}
                      disabled={!team.completed || qualified.includes(team.id) || round2Unlocked}
                      onClick={() => toggleEligible(team.id)}
                    >
                      {selected.includes(team.id) || qualified.includes(team.id) ? "V" : ""}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="qualification-footer">
          <span>{qualified.length ? `${qualified.length} team(s) already qualified` : `${selected.length} selected`}</span>
          <button className="admin-btn primary" disabled={!selected.length || round2Unlocked} onClick={openQualificationConfirm}>Confirm Qualified Teams</button>
        </div>
      </section>
    </>
  );
}

function AdminChat({ teams, chatTeam, setChatTeam, activeChatTeam }) {
  const [activeChallenge, setActiveChallenge] = useState(0);
  const conv = challengeChatMessages[activeChallenge];
  return (
    <section className="admin-panel chat-monitor">
      <SectionTitle kicker="ADMIN-ONLY TEAM CHAT" title="Team Chat" />
      <div className="challenge-tabs-row">
        {challenges.map((_, i) => (
          <button key={i} className={activeChallenge === i ? "challenge-tab active" : "challenge-tab"} onClick={() => setActiveChallenge(i)}>
            Challenge {String(i + 1).padStart(2, "0")}
          </button>
        ))}
      </div>
      <div className="chat-admin-layout">
        <div className="chat-team-list">
          {teams.map((team) => (
            <button key={team.id} className={chatTeam === team.id ? "chat-team active" : "chat-team"} onClick={() => setChatTeam(team.id)}>
              {team.name}<span>{team.email}</span>
            </button>
          ))}
        </div>
        <div className="admin-chat-window">
          <div className="admin-chat-head">
            <div><strong>{activeChatTeam.name}</strong><span>Challenge {String(activeChallenge + 1).padStart(2, "0")}</span></div>
            <span className="admin-only-badge">ADMIN ACCESS</span>
          </div>
          <div className="admin-messages">
            <div className="admin-message"><span>{conv.team.replace("{name}", activeChatTeam.name)}</span><p>{conv.msg}</p></div>
            <div className="admin-message control"><span>{conv.ctrl}</span><p>{conv.reply}</p></div>
          </div>
          <div className="admin-chat-note">Admin-only monitoring view.</div>
        </div>
      </div>
    </section>
  );
}

function AdminLeaderboard({ teams, qualified, unlocked }) {
  const rows = [...teams].sort((a, b) => {
    const aT = a.r1Challenges + (unlocked && qualified.includes(a.id) ? a.r2Challenges : 0);
    const bT = b.r1Challenges + (unlocked && qualified.includes(b.id) ? b.r2Challenges : 0);
    return bT - aT || a.time.localeCompare(b.time);
  });
  return (
    <section className="admin-panel">
      <SectionTitle kicker="LEADERBOARD" title="Live leaderboard" />
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>RANK</th><th>TEAM</th><th>ROUND 1</th><th>ROUND 2</th><th>TOTAL</th><th>TIME</th></tr></thead>
          <tbody>
            {rows.map((team, i) => {
              const r2 = unlocked && qualified.includes(team.id) ? team.r2Challenges : null;
              const total = team.r1Challenges + (r2 !== null ? r2 : 0);
              return <tr key={team.id}><td>#{i + 1}</td><td>{team.name}</td><td>{team.r1Challenges}/6</td><td>{r2 !== null ? `${r2}/6` : "-"}</td><td>{total}</td><td>{team.time}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminLogs({ logs }) {
  return (
    <section className="admin-panel">
      <SectionTitle kicker="ACTIVITY LOGS" title="Event activity" />
      <div className="log-list">
        <div className="log-row log-head"><span>TEAM</span><span>R1 TIME</span><span>R2 TIME</span><span>ACTION</span><span>CHALLENGES</span></div>
        {logs.map((log, i) => (
          <div className="log-row" key={i}>
            <span>{log.team}</span><span>{log.r1Time}</span><span>{log.r2Time}</span>
            <span className="log-action">{log.action}</span><span className="log-result">{log.challenges}</span>
          </div>
        ))}
        {logs.length === 0 && <div className="log-row"><span style={{ gridColumn: "1/-1", textAlign: "center" }}>No activity logged yet.</span></div>}
      </div>
    </section>
  );
}

function AdminResults({ teams, qualified, unlocked }) {
  const rows = [...teams].sort((a, b) => {
    const aT = a.r1Challenges + (unlocked && qualified.includes(a.id) ? a.r2Challenges : 0);
    const bT = b.r1Challenges + (unlocked && qualified.includes(b.id) ? b.r2Challenges : 0);
    return bT - aT || a.time.localeCompare(b.time);
  });
  return (
    <section className="admin-panel">
      <SectionTitle kicker="FINAL RESULTS" title="Results" />
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>RANK</th><th>TEAM</th><th>R1 CHALLENGES</th><th>R2 CHALLENGES</th><th>STATUS</th></tr></thead>
          <tbody>
            {rows.map((team, i) => {
              const r2 = unlocked && qualified.includes(team.id) ? team.r2Challenges : null;
              const status = unlocked && qualified.includes(team.id) ? <span className="table-ok">QUALIFIED</span> : team.completed ? "ROUND 1 COMPLETE" : <span className="muted-cell">IN PROGRESS</span>;
              return <tr key={team.id}><td>#{i + 1}</td><td>{team.name}</td><td>{team.r1Challenges}/6</td><td>{r2 !== null ? `${r2}/6` : "-"}</td><td>{status}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AdminPage() {
  const [section, setSection] = useState("dashboard");
  const [selected, setSelected] = useState([]);
  const [qualified, setQualified] = useState([]);
  const [round2Unlocked, setRound2Unlocked] = useState(false);
  const [chatTeam, setChatTeam] = useState(adminTeams[0].id);
  const [confirmUnlockOpen, setConfirmUnlockOpen] = useState(false);
  const [confirmQualOpen, setConfirmQualOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [remaining, setRemaining] = useState(5076);
  const [adminLogs, setAdminLogs] = useState(initialAdminLogs);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const completedTeams = adminTeams.filter((t) => t.completed);
  const qualifiedCount = qualified.length;
  const round2Active = round2Unlocked ? Math.min(qualifiedCount, 3) : 0;

  function addLog(team, r1Time, r2Time, action, challs) {
    const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
    setAdminLogs((prev) => [{ ts, team, r1Time, r2Time, action, challenges: challs }, ...prev]);
  }

  function formatTimer(total) {
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  function toggleEligible(id) {
    if (round2Unlocked || !completedTeams.some((t) => t.id === id)) return;
    setSelected((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }

  function openQualificationConfirm() {
    if (!selected.length) { setNotice("Select at least one completed Round 1 team first."); return; }
    setConfirmQualOpen(true);
  }

  function confirmQualification() {
    const toQualify = adminTeams.filter((t) => selected.includes(t.id));
    toQualify.forEach((t) => addLog(t.name, t.time, "-", "Team qualified for Round 2", `R1: ${t.r1Challenges}/6, R2: -`));
    setQualified(selected);
    setSelected([]);
    setConfirmQualOpen(false);
    setNotice(`${toQualify.length} team(s) qualified for Round 2. Round 2 is still LOCKED.`);
  }

  function unlockRound2() {
    if (!qualified.length) { setNotice("Round 2 cannot be unlocked until qualified teams are confirmed."); return; }
    setRound2Unlocked(true);
    setConfirmUnlockOpen(false);
    addLog("-", "-", "-", "Round 2 unlocked", `${qualified.length} team(s) granted access`);
    setNotice(`Round 2 UNLOCKED for ${qualified.length} qualified team(s).`);
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
            {[["dashboard", "Dashboard"], ["teams", "Teams"], ["round1", "Round 1"], ["chat", "Team Chat"], ["leaderboard", "Leaderboard"], ["logs", "Activity Logs"], ["results", "Results"]].map(([id, label]) => (
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
          {notice && <div className="admin-notice">{notice}<button onClick={() => setNotice("")}>X</button></div>}
          {section === "dashboard" && <AdminDashboard formatTimer={formatTimer} remaining={remaining} activeTeams={6} completedCount={completedTeams.length} qualifiedCount={qualifiedCount} round2Active={round2Active} round2Unlocked={round2Unlocked} setSection={setSection} />}
          {section === "teams" && <AdminTeams />}
          {section === "round1" && <AdminRound1 completedTeams={completedTeams} selected={selected} toggleEligible={toggleEligible} qualified={qualified} openQualificationConfirm={openQualificationConfirm} round2Unlocked={round2Unlocked} />}
          {section === "chat" && <AdminChat teams={adminTeams} chatTeam={chatTeam} setChatTeam={setChatTeam} activeChatTeam={activeChatTeam} />}
          {section === "leaderboard" && <AdminLeaderboard teams={adminTeams} qualified={qualified} unlocked={round2Unlocked} />}
          {section === "logs" && <AdminLogs logs={adminLogs} />}
          {section === "results" && <AdminResults teams={adminTeams} qualified={qualified} unlocked={round2Unlocked} />}

          <section className="admin-control-panel" id="event-control">
            <div><div className="section-kicker">EVENT CONTROL</div><h2>Event control</h2></div>
            <div className="control-grid">
              <ControlValue label="EVENT STATUS" value="LIVE" />
              <ControlValue label="CURRENT ROUND" value={round2Unlocked ? "ROUND 2" : "ROUND 1"} />
              <ControlValue label="EVENT TIMER" value={formatTimer(remaining)} />
              <ControlValue label="ROUND 1 STATUS" value="COMPLETED" />
            </div>
            <div className="control-actions">
              <button className="admin-btn secondary" onClick={() => setSection("round1")}>Manage Qualification</button>
            </div>
          </section>
        </div>
      </section>

      {confirmUnlockOpen && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <div className="section-kicker">CONFIRM ACTION</div>
            <h2>Unlock Round 2?</h2>
            <p>Are you sure you want to unlock Round 2 for {qualified.length} team(s)? Teams not selected will remain locked out.</p>
            <div className="modal-actions">
              <button className="admin-btn secondary" onClick={() => setConfirmUnlockOpen(false)}>Cancel</button>
              <button className="admin-btn primary" onClick={unlockRound2}>Unlock Round 2</button>
            </div>
          </div>
        </div>
      )}

      {confirmQualOpen && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <div className="section-kicker">CONFIRM QUALIFICATION</div>
            <h2>Qualify Selected Teams?</h2>
            <p>Qualify {selected.length} team(s) for Round 2? Round 2 will remain LOCKED until explicitly unlocked.</p>
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
