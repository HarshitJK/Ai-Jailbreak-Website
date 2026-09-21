/**
 * AdminPage.jsx
 *
 * All static/mock data has been removed. Every team and transcript entry now
 * comes from the backend via fetchAdminTeams() and fetchTeamLogs() in apiClient.ts.
 *
 * What was removed vs what now supplies the data:
 *   • adminTeams (8 fake teams)          → GET /api/admin/teams
 *   • initialAdminLogs (4 fake log rows) → Logs tab replaced by transcript viewer
 *   • challengeChatMessages (fake chat)  → GET /api/admin/teams/{id}/logs
 *   • Hardcoded "TOTAL TEAMS: 8"         → teams.length from live fetch
 *   • Hardcoded "ACTIVE TEAMS: 6"        → derived from fetch (round1_stage > 0)
 *   • Hardcoded "COMPLETED: 4/8"         → derived from fetch (round1_complete_at != null)
 *   • Hardcoded Round 1 Status "COMPLETED" → derived dynamically
 *   • import { challenges } from Round1Page → removed (was only used for fake chat tabs)
 *
 * Fields the UI previously showed that have NO Mongo equivalent (flagged here):
 *   • elapsed time ("00:38:42")      — schema has round1_complete_at (datetime), not a duration.
 *                                      We display the formatted datetime instead.
 *   • r1Challenges / r2Challenges    — no such field. round1_stage (0-5) is displayed as "X/5".
 *   • event activity log (r1Time, action, challenges cols) — no event-log collection.
 *                                      Logs tab is replaced by a per-team transcript viewer
 *                                      backed by chat_logs.
 */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAdminTeams, fetchTeamLogs } from "../lib/apiClient";

// ── Small shared UI atoms ─────────────────────────────────────────────────────

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

/** Spinner shown while fetching data from the backend. */
function LoadingState() {
  return (
    <div className="admin-loading-state">
      <div className="admin-spinner" aria-label="Loading" />
      <p>Loading live data…</p>
    </div>
  );
}

/** Shown when the fetch fails (e.g. wrong secret, backend down). */
function ErrorState({ message, onRetry }) {
  return (
    <div className="admin-error-state">
      <div className="section-kicker">FETCH ERROR</div>
      <h2>Could not load data</h2>
      <p>{message}</p>
      <button className="admin-btn secondary" onClick={onRetry}>Retry</button>
    </div>
  );
}

/** Shown when the teams collection is genuinely empty. */
function EmptyTeamsState() {
  return (
    <div className="admin-empty-state">
      <div className="section-kicker">NO DATA</div>
      <h2>No teams registered yet</h2>
      <p>This view will populate once teams begin registering for the event.</p>
    </div>
  );
}

// ── Helper: format an ISO timestamp for display ───────────────────────────────
// NOTE: The schema stores round1_complete_at as a UTC datetime, not an elapsed
// duration. We display it as a human-readable time in the admin's local timezone.
function fmtTimestamp(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

// ── Admin login page (frontend gatekeeper — unchanged from original) ───────────

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
    } else {
      setError("Invalid admin credentials.");
    }
  }

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
            </label>
            <button className="primary-btn" type="submit">Access Dashboard</button>
          </form>
          {error && <div className="form-message">{error}</div>}
        </div>
      </section>
    </main>
  );
}

// ── Sub-components (all receive real `teams` from the parent fetch) ────────────

function AdminDashboard({ formatTimer, remaining, teams }) {
  const totalTeams = teams.length;
  // "active" = teams that have sent at least one message (round1_stage > 0)
  const activeTeams = teams.filter((t) => t.round1_stage > 0).length;
  // "completed" = teams that finished all Round 1 stages
  const completedCount = teams.filter((t) => t.round1_complete_at != null).length;

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
          <small>Local countdown — does not sync to server</small>
        </div>
      </section>
      <div className="stat-grid">
        <AdminStat label="TOTAL TEAMS" value={totalTeams} />
        <AdminStat label="ACTIVE TEAMS" value={activeTeams} />
        <AdminStat label="ROUND 1 COMPLETED" value={completedCount} />
      </div>
    </>
  );
}

function AdminTeams({ teams }) {
  if (teams.length === 0) return <EmptyTeamsState />;
  return (
    <section className="admin-panel">
      <SectionTitle kicker="TEAM MANAGEMENT" title="Registered teams" />
      <div className="table-wrap">
        <table className="admin-table simple">
          <thead><tr><th>TEAM NAME</th><th>EMAIL</th></tr></thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.team_name}>
                <td>{team.team_name}</td>
                <td className="email-cell">{team.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminRound1({ teams, selected, toggleEligible, qualified, openQualificationConfirm, round2Unlocked }) {
  const totalTeams = teams.length;
  // Completed = round1_complete_at is set (all 5 stages done)
  const completedTeams = teams.filter((t) => t.round1_complete_at != null);

  // Derive a stable "id" from team_name for selection logic
  return (
    <>
      <section className="admin-panel">
        <SectionTitle kicker="ROUND 1" title="Round 1 monitoring" />
        <div className="round-summary">
          <ControlValue label="ROUND 1 STATUS" value={completedTeams.length > 0 ? "IN PROGRESS / COMPLETE" : "NOT STARTED"} />
          <ControlValue label="TOTAL TEAMS" value={totalTeams} />
          {/* NOTE: denominator is totalTeams (live), not a hardcoded 8 */}
          <ControlValue label="COMPLETED" value={`${completedTeams.length} / ${totalTeams}`} />
          <ControlValue label="QUALIFIED" value={`${qualified.length} / ${completedTeams.length}`} />
        </div>
        {teams.length === 0 ? (
          <EmptyTeamsState />
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              {/*
               * SCHEMA NOTE: No "r1Challenges" field exists in MongoDB.
               * round1_stage (0-5) is the closest equivalent and is displayed as "X / 5".
               * round1_complete_at (UTC datetime) is shown instead of an elapsed duration.
               */}
              <thead><tr><th>TEAM</th><th>STAGES COMPLETED</th><th>COMPLETION TIME</th></tr></thead>
              <tbody>
                {teams.map((team) => {
                  const done = team.round1_complete_at != null;
                  return (
                    <tr key={team.team_name}>
                      <td>{team.team_name}</td>
                      <td>
                        <span className={done ? "table-ok" : ""}>
                          {team.round1_stage} / 5
                        </span>
                      </td>
                      {/* round1_complete_at is a UTC datetime — displayed as local time */}
                      <td>{fmtTimestamp(team.round1_complete_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-panel">
        <SectionTitle kicker="ROUND 2 QUALIFICATION" title="Select completed teams" />
        <p className="panel-note">Only teams that completed Round 1 can be selected.</p>
        {teams.length === 0 ? (
          <EmptyTeamsState />
        ) : (
          <div className="table-wrap">
            <table className="admin-table qualification">
              <thead><tr><th>TEAM NAME</th><th>ROUND 1 STATUS</th><th>SELECT</th></tr></thead>
              <tbody>
                {teams.map((team) => {
                  const done = team.round1_complete_at != null;
                  return (
                    <tr key={team.team_name}>
                      <td>{team.team_name}</td>
                      <td>{done ? <span className="table-ok">COMPLETED</span> : <span className="muted-cell">INCOMPLETE</span>}</td>
                      <td>
                        <button
                          className={selected.includes(team.team_name) ? "check selected" : "check"}
                          disabled={!done || qualified.includes(team.team_name) || round2Unlocked}
                          onClick={() => toggleEligible(team.team_name)}
                        >
                          {selected.includes(team.team_name) || qualified.includes(team.team_name) ? "V" : ""}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="qualification-footer">
          <span>{qualified.length ? `${qualified.length} team(s) already qualified` : `${selected.length} selected`}</span>
          <button className="admin-btn primary" disabled={!selected.length || round2Unlocked} onClick={openQualificationConfirm}>Confirm Qualified Teams</button>
        </div>
      </section>
    </>
  );
}

/**
 * AdminTranscript — replaces both the old AdminChat (fake challenge tabs) and
 * AdminLogs (fake event log).  Shows real chat_logs entries from the backend,
 * grouped by round → stage, chronological order within each group.
 *
 * NOTE: The old "Activity Logs" tab showed event-level rows (R1 time, action,
 * challenges completed).  No such collection exists in MongoDB.  This viewer
 * shows the actual per-message chat_logs transcript instead.
 */
function AdminTranscript({ teams, transcriptTeam, setTranscriptTeam }) {
  const [logs, setLogs] = useState(null);     // null = not yet fetched
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");

  const loadLogs = useCallback(async (teamName) => {
    if (!teamName) return;
    setLogsLoading(true);
    setLogsError("");
    setLogs(null);
    try {
      const data = await fetchTeamLogs(teamName);
      setLogs(data);
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : "Failed to load transcript.");
    } finally {
      setLogsLoading(false);
    }
  }, []);

  // Load logs whenever the selected team changes
  useEffect(() => {
    loadLogs(transcriptTeam);
  }, [transcriptTeam, loadLogs]);

  // Group logs by round then stage for readable display
  const grouped = [];
  if (logs && logs.length > 0) {
    let currentKey = null;
    let currentGroup = null;
    for (const entry of logs) {
      const key = `${entry.round}-${entry.stage}`;
      if (key !== currentKey) {
        currentGroup = { round: entry.round, stage: entry.stage, messages: [] };
        grouped.push(currentGroup);
        currentKey = key;
      }
      currentGroup.messages.push(entry);
    }
  }

  return (
    <section className="admin-panel chat-monitor">
      <SectionTitle kicker="TEAM TRANSCRIPT VIEWER" title="Chat Logs" />
      {teams.length === 0 ? (
        <EmptyTeamsState />
      ) : (
        <div className="chat-admin-layout">
          {/* Team picker sidebar */}
          <div className="chat-team-list">
            {teams.map((team) => (
              <button
                key={team.team_name}
                className={transcriptTeam === team.team_name ? "chat-team active" : "chat-team"}
                onClick={() => setTranscriptTeam(team.team_name)}
              >
                {team.team_name}
                <span>{team.email}</span>
              </button>
            ))}
          </div>

          {/* Transcript pane */}
          <div className="admin-chat-window">
            <div className="admin-chat-head">
              <div>
                <strong>{transcriptTeam || "Select a team"}</strong>
                <span>Chat transcript (chat_logs)</span>
              </div>
              <span className="admin-only-badge">ADMIN ACCESS</span>
            </div>

            <div className="admin-messages">
              {logsLoading && (
                <div className="admin-transcript-loading">
                  <LoadingState />
                </div>
              )}

              {logsError && !logsLoading && (
                <div className="admin-transcript-error">
                  <p>{logsError}</p>
                  <button className="admin-btn secondary" onClick={() => loadLogs(transcriptTeam)}>Retry</button>
                </div>
              )}

              {!logsLoading && !logsError && logs !== null && logs.length === 0 && (
                <div className="admin-transcript-empty">
                  <p>No chat history yet for this team.</p>
                </div>
              )}

              {!logsLoading && !logsError && grouped.map((group, gi) => (
                <div key={gi} className="transcript-group">
                  <div className="transcript-group-header">
                    Round {group.round} — Stage {group.stage}
                  </div>
                  {group.messages.map((msg, mi) => (
                    <div
                      key={mi}
                      className={`admin-message${msg.role === "assistant" ? " control" : ""}`}
                    >
                      <span>
                        {fmtTimestamp(msg.timestamp)} — {msg.role === "assistant" ? "CHALLENGE CONTROL" : transcriptTeam}
                      </span>
                      <p>{msg.message}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="admin-chat-note">Admin-only monitoring view. Data from chat_logs collection.</div>
          </div>
        </div>
      )}
    </section>
  );
}

function AdminLeaderboard({ teams, qualified, unlocked }) {
  if (teams.length === 0) return (
    <section className="admin-panel">
      <SectionTitle kicker="LEADERBOARD" title="Live leaderboard" />
      <EmptyTeamsState />
    </section>
  );

  /*
   * SCHEMA NOTE: No r1Challenges / r2Challenges fields. We sort by round1_stage
   * (stages completed, 0-5) descending, then by round1_complete_at ascending
   * (earlier completion = better rank).  round2_stage used for Round 2 column.
   * There is no "time" elapsed field — round1_complete_at datetime is displayed.
   */
  const rows = [...teams].sort((a, b) => {
    const aStages = a.round1_stage + (unlocked && qualified.includes(a.team_name) ? a.round2_stage : 0);
    const bStages = b.round1_stage + (unlocked && qualified.includes(b.team_name) ? b.round2_stage : 0);
    if (bStages !== aStages) return bStages - aStages;
    // Tiebreak: earlier completion first; if neither completed, keep order
    if (a.round1_complete_at && b.round1_complete_at) {
      return new Date(a.round1_complete_at) - new Date(b.round1_complete_at);
    }
    return a.round1_complete_at ? -1 : b.round1_complete_at ? 1 : 0;
  });

  return (
    <section className="admin-panel">
      <SectionTitle kicker="LEADERBOARD" title="Live leaderboard" />
      <div className="table-wrap">
        <table className="admin-table">
          {/* NOTE: columns use "stages" (0-5) not "challenges" (no such field) */}
          <thead><tr><th>RANK</th><th>TEAM</th><th>R1 STAGES</th><th>R2 STAGES</th><th>TOTAL</th><th>R1 COMPLETED AT</th></tr></thead>
          <tbody>
            {rows.map((team, i) => {
              const r2 = unlocked && qualified.includes(team.team_name) ? team.round2_stage : null;
              const total = team.round1_stage + (r2 !== null ? r2 : 0);
              return (
                <tr key={team.team_name}>
                  <td>#{i + 1}</td>
                  <td>{team.team_name}</td>
                  <td>{team.round1_stage}/5</td>
                  <td>{r2 !== null ? `${r2}/5` : "—"}</td>
                  <td>{total}</td>
                  <td>{fmtTimestamp(team.round1_complete_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminResults({ teams, qualified, unlocked }) {
  if (teams.length === 0) return (
    <section className="admin-panel">
      <SectionTitle kicker="FINAL RESULTS" title="Results" />
      <EmptyTeamsState />
    </section>
  );

  const rows = [...teams].sort((a, b) => {
    const aStages = a.round1_stage + (unlocked && qualified.includes(a.team_name) ? a.round2_stage : 0);
    const bStages = b.round1_stage + (unlocked && qualified.includes(b.team_name) ? b.round2_stage : 0);
    if (bStages !== aStages) return bStages - aStages;
    if (a.round1_complete_at && b.round1_complete_at) {
      return new Date(a.round1_complete_at) - new Date(b.round1_complete_at);
    }
    return a.round1_complete_at ? -1 : b.round1_complete_at ? 1 : 0;
  });

  return (
    <section className="admin-panel">
      <SectionTitle kicker="FINAL RESULTS" title="Results" />
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>RANK</th><th>TEAM</th><th>R1 STAGES</th><th>R2 STAGES</th><th>STATUS</th></tr></thead>
          <tbody>
            {rows.map((team, i) => {
              const done = team.round1_complete_at != null;
              const r2 = unlocked && qualified.includes(team.team_name) ? team.round2_stage : null;
              const status = unlocked && qualified.includes(team.team_name)
                ? <span className="table-ok">QUALIFIED</span>
                : done
                  ? "ROUND 1 COMPLETE"
                  : <span className="muted-cell">IN PROGRESS</span>;
              return (
                <tr key={team.team_name}>
                  <td>#{i + 1}</td>
                  <td>{team.team_name}</td>
                  <td>{team.round1_stage}/5</td>
                  <td>{r2 !== null ? `${r2}/5` : "—"}</td>
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

// ── Main admin shell ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [section, setSection] = useState("dashboard");
  const [selected, setSelected] = useState([]);
  const [qualified, setQualified] = useState([]);
  const [round2Unlocked, setRound2Unlocked] = useState(false);
  const [confirmUnlockOpen, setConfirmUnlockOpen] = useState(false);
  const [confirmQualOpen, setConfirmQualOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [remaining, setRemaining] = useState(5076);

  // ── Real data state (replaces all static mock arrays) ──────────────────────
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState("");

  // For the transcript viewer
  const [transcriptTeam, setTranscriptTeam] = useState("");

  // ── Fetch teams from backend ─────────────────────────────────────────────────
  const loadTeams = useCallback(async () => {
    setTeamsLoading(true);
    setTeamsError("");
    try {
      const data = await fetchAdminTeams();
      setTeams(data);
      // Pre-select first team for the transcript viewer if none chosen yet
      if (data.length > 0 && !transcriptTeam) {
        setTranscriptTeam(data[0].team_name);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error fetching teams.";
      setTeamsError(msg);
    } finally {
      setTeamsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // ── Event timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // ── Derived values ───────────────────────────────────────────────────────────
  const completedTeams = teams.filter((t) => t.round1_complete_at != null);
  const qualifiedCount = qualified.length;
  const round2Active = round2Unlocked ? Math.min(qualifiedCount, 3) : 0;

  function formatTimer(total) {
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  function toggleEligible(teamName) {
    if (round2Unlocked || !completedTeams.some((t) => t.team_name === teamName)) return;
    setSelected((cur) => cur.includes(teamName) ? cur.filter((x) => x !== teamName) : [...cur, teamName]);
  }

  function openQualificationConfirm() {
    if (!selected.length) { setNotice("Select at least one completed Round 1 team first."); return; }
    setConfirmQualOpen(true);
  }

  function confirmQualification() {
    setQualified(selected);
    setSelected([]);
    setConfirmQualOpen(false);
    setNotice(`${selected.length} team(s) qualified for Round 2. Round 2 is still LOCKED.`);
  }

  function unlockRound2() {
    if (!qualified.length) { setNotice("Round 2 cannot be unlocked until qualified teams are confirmed."); return; }
    setRound2Unlocked(true);
    setConfirmUnlockOpen(false);
    setNotice(`Round 2 UNLOCKED for ${qualified.length} qualified team(s).`);
  }

  // ── Shared content area ──────────────────────────────────────────────────────

  function renderContent() {
    if (teamsLoading) return <LoadingState />;
    if (teamsError) return <ErrorState message={teamsError} onRetry={loadTeams} />;

    switch (section) {
      case "dashboard":
        return (
          <AdminDashboard
            formatTimer={formatTimer}
            remaining={remaining}
            teams={teams}
          />
        );
      case "teams":
        return <AdminTeams teams={teams} />;
      case "round1":
        return (
          <AdminRound1
            teams={teams}
            selected={selected}
            toggleEligible={toggleEligible}
            qualified={qualified}
            openQualificationConfirm={openQualificationConfirm}
            round2Unlocked={round2Unlocked}
          />
        );
      case "chat":
      case "logs":
        // Both tabs now go to the transcript viewer (old "logs" = fake event log, now real chat_logs)
        return (
          <AdminTranscript
            teams={teams}
            transcriptTeam={transcriptTeam}
            setTranscriptTeam={setTranscriptTeam}
          />
        );
      case "leaderboard":
        return <AdminLeaderboard teams={teams} qualified={qualified} unlocked={round2Unlocked} />;
      case "results":
        return <AdminResults teams={teams} qualified={qualified} unlocked={round2Unlocked} />;
      default:
        return null;
    }
  }

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
              ["dashboard", "Dashboard"],
              ["teams", "Teams"],
              ["round1", "Round 1"],
              ["chat", "Team Chat / Transcripts"],
              ["leaderboard", "Leaderboard"],
              ["logs", "Activity Logs"],
              ["results", "Results"],
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

          {renderContent()}

          {/* Event control panel — always visible at bottom */}
          <section className="admin-control-panel" id="event-control">
            <div><div className="section-kicker">EVENT CONTROL</div><h2>Event control</h2></div>
            <div className="control-grid">
              <ControlValue label="EVENT STATUS" value="LIVE" />
              <ControlValue label="CURRENT ROUND" value={round2Unlocked ? "ROUND 2" : "ROUND 1"} />
              <ControlValue label="EVENT TIMER" value={formatTimer(remaining)} />
              <ControlValue
                label="ROUND 1 STATUS"
                value={teamsLoading ? "Loading…" : completedTeams.length > 0 ? `${completedTeams.length} / ${teams.length} COMPLETE` : "IN PROGRESS"}
              />
            </div>
            <div className="control-actions">
              <button className="admin-btn secondary" onClick={() => setSection("round1")}>Manage Qualification</button>
              <button className="admin-btn secondary" onClick={loadTeams}>↺ Refresh Data</button>
            </div>
          </section>
        </div>
      </section>

      {/* Confirm unlock Round 2 modal */}
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

      {/* Confirm qualification modal */}
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
