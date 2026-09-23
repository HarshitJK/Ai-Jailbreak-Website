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
import { fetchAdminTeams, fetchTeamLogs, adminLogin, adminLogout, adminAdvanceTeam } from "../lib/apiClient";

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

// ── Admin login page — posts to backend /api/admin/login ─────────────────────

export function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await adminLogin({ username, password });
      // Backend set the admin_session cookie — navigate to dashboard
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid admin credentials.");
    } finally {
      setSubmitting(false);
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
            <label>Admin Username<input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" disabled={submitting} /></label>
            <label>
              Admin Password
              <div className="pw-field-wrap">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" disabled={submitting} />
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
            <button className="primary-btn" type="submit" disabled={submitting}>
              {submitting ? "Verifying…" : "Access Dashboard"}
            </button>
          </form>
          {error && <div className="form-message">{error}</div>}
        </div>
      </section>
    </main>
  );
}

// ── Sub-components (all receive real `teams` from the parent fetch) ────────────

function AdminDashboard({ teams }) {
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
      </section>
      <div className="stat-grid">
        <AdminStat label="TOTAL TEAMS" value={totalTeams} />
        <AdminStat label="ACTIVE TEAMS" value={activeTeams} />
        <AdminStat label="ROUND 1 COMPLETED" value={completedCount} />
      </div>
    </>
  );
}

function AdminRound1Qualification({ teams, selected, toggleEligible, qualified, openQualificationConfirm, round2Unlocked }) {
  const completedTeams = teams.filter((t) => t.round1_complete_at != null);

  return (
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

  // Group logs by round then stage
  const r1Groups = [];
  const r2Groups = [];
  
  if (logs && logs.length > 0) {
    let currentR1Stage = null;
    let currentR1Group = null;
    let currentR2Stage = null;
    let currentR2Group = null;
    
    for (const entry of logs) {
      if (entry.round === 1) {
        if (entry.stage !== currentR1Stage) {
          currentR1Group = { stage: entry.stage, messages: [] };
          r1Groups.push(currentR1Group);
          currentR1Stage = entry.stage;
        }
        currentR1Group.messages.push(entry);
      } else {
        if (entry.stage !== currentR2Stage) {
          currentR2Group = { stage: entry.stage, messages: [] };
          r2Groups.push(currentR2Group);
          currentR2Stage = entry.stage;
        }
        currentR2Group.messages.push(entry);
      }
    }
  }

  const [activeR1Tab, setActiveR1Tab] = useState(1);
  const [activeRoundTab, setActiveRoundTab] = useState(1);

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
              <div style={{display: 'flex', gap: '0.5rem'}}>
                <button className={`admin-btn ${activeRoundTab === 1 ? 'primary' : 'secondary'}`} onClick={() => setActiveRoundTab(1)}>Round 1</button>
                <button className={`admin-btn ${activeRoundTab === 2 ? 'primary' : 'secondary'}`} onClick={() => setActiveRoundTab(2)}>Round 2</button>
              </div>
            </div>

            <div className="admin-messages" style={{ display: 'flex', flexDirection: 'column' }}>
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

              {/* ROUND 1 RENDER: Collapsible / Tabbed */}
              {!logsLoading && !logsError && activeRoundTab === 1 && r1Groups.length > 0 && (
                <>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {r1Groups.map(g => (
                      <button 
                        key={g.stage} 
                        className={`admin-btn ${activeR1Tab === g.stage ? 'primary' : 'secondary'}`}
                        onClick={() => setActiveR1Tab(g.stage)}
                      >
                        Stage {g.stage}
                      </button>
                    ))}
                  </div>
                  {r1Groups.filter(g => g.stage === activeR1Tab).map((group, gi) => (
                    <div key={gi} className="transcript-group">
                      {group.messages.map((msg, mi) => (
                        <div
                          key={mi}
                          className={`admin-message${msg.role === "assistant" ? " control" : msg.role === "system" ? " system" : ""}`}
                        >
                          <span>
                            {fmtTimestamp(msg.timestamp)} — {msg.role === "assistant" ? "CHALLENGE CONTROL" : msg.role === "system" ? "SYSTEM" : transcriptTeam}
                          </span>
                          <p>{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}
              {!logsLoading && !logsError && activeRoundTab === 1 && r1Groups.length === 0 && logs !== null && logs.length > 0 && (
                <p>No Round 1 logs.</p>
              )}

              {/* ROUND 2 RENDER: Continuous thread with dividers */}
              {!logsLoading && !logsError && activeRoundTab === 2 && r2Groups.length > 0 && (
                <div className="transcript-group">
                  {r2Groups.map((group, gi) => (
                    <React.Fragment key={gi}>
                      <div className="transcript-group-header" style={{ margin: '1rem 0', padding: '0.5rem', background: 'rgba(255,255,255,0.1)', textAlign: 'center', fontWeight: 'bold' }}>
                        --- Transition to Stage {group.stage} ---
                      </div>
                      {group.messages.map((msg, mi) => (
                        <div
                          key={`${gi}-${mi}`}
                          className={`admin-message${msg.role === "assistant" ? " control" : msg.role === "system" ? " system" : ""}`}
                        >
                          <span>
                            {fmtTimestamp(msg.timestamp)} — {msg.role === "assistant" ? "CHALLENGE CONTROL" : msg.role === "system" ? "SYSTEM" : transcriptTeam}
                          </span>
                          <p>{msg.message}</p>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              )}
              {!logsLoading && !logsError && activeRoundTab === 2 && r2Groups.length === 0 && logs !== null && logs.length > 0 && (
                <p>No Round 2 logs.</p>
              )}
            </div>

            <div className="admin-chat-note">Admin-only monitoring view. Data from chat_logs collection.</div>
          </div>
        </div>
      )}
    </section>
  );
}

function AdminLeaderboard({ onSelectTeam }) {
  const [tab, setTab] = useState("round1");
  const [r1Teams, setR1Teams] = useState([]);
  const [r2Teams, setR2Teams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const { fetchLeaderboardR1, fetchLeaderboardR2 } = await import("../lib/apiClient");
        const [r1, r2] = await Promise.all([fetchLeaderboardR1(), fetchLeaderboardR2()]);
        if (active) {
          setR1Teams(r1);
          setR2Teams(r2);
        }
      } catch (err) {
        console.error("Failed to load leaderboards", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  if (loading) return <section className="admin-panel"><div className="admin-chat-note">Loading leaderboard...</div></section>;

  const currentTeams = tab === "round1" ? r1Teams : r2Teams;

  return (
    <section className="admin-panel">
      <SectionTitle kicker="TEAMS & LEADERBOARD" title="Live leaderboard" />
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <button className={`admin-btn ${tab === 'round1' ? 'primary' : 'secondary'}`} onClick={() => setTab("round1")}>Round 1</button>
        <button className={`admin-btn ${tab === 'round2' ? 'primary' : 'secondary'}`} onClick={() => setTab("round2")}>Round 2</button>
      </div>
      <p className="panel-note">Click any team row to view detailed status, qualify, or delete.</p>
      
      {currentTeams.length === 0 ? (
        <EmptyTeamsState />
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>RANK</th><th>TEAM</th><th>R1 STAGES</th><th>R2 STAGES</th><th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {currentTeams.map((team, i) => (
                <tr key={team.team_name} onClick={() => onSelectTeam(team)} style={{cursor: 'pointer'}} className="hover-row">
                  <td>#{i + 1}</td>
                  <td>{team.team_name}</td>
                  <td>{team.round1_stage}/5</td>
                  <td>{team.qualified ? `${team.round2_stage}/5` : "—"}</td>
                  <td>
                    {team.qualified ? <span className="table-ok">QUALIFIED</span> : 
                     team.round1_complete_at ? "ROUND 1 COMPLETE" : 
                     <span className="muted-cell">IN PROGRESS</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TeamDetailsModal({ team, onClose, onAdvance }) {
  if (!team) return null;

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="admin-modal team-details-modal" onClick={e => e.stopPropagation()} style={{maxWidth: '600px', width: '100%'}}>
        <div className="section-kicker">TEAM DETAILS</div>
        <h2 style={{marginTop: 0}}>{team.team_name}</h2>
        <p><strong>Email:</strong> {team.email}</p>
        <p><strong>Score:</strong> {team.score}</p>
        
        <div style={{marginTop: '1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '2rem'}}>
          <div style={{flex: 1}}>
            <h3>Round 1 Status</h3>
            <p><strong>Current Stage:</strong> {team.round1_stage}/5</p>
            <p><strong>Completed At:</strong> {fmtTimestamp(team.round1_complete_at)}</p>
            <ul style={{listStyle: 'none', padding: 0, marginTop: '0.5rem'}}>
              {[1, 2, 3, 4, 5].map(stg => (
                <li key={stg} style={{marginBottom: '0.25rem'}}>
                  Stage {stg}: {team.round1_stage >= stg ? <span className="table-ok">Complete</span> : <span className="muted-cell">Pending</span>}
                </li>
              ))}
            </ul>
            <div style={{marginTop: '1rem'}}>
              <button 
                className="admin-btn secondary" 
                onClick={() => onAdvance(team.team_name, 1, Math.min(5, team.round1_stage + 1))}
                disabled={team.round1_stage >= 5}
              >
                Force Advance R1 Stage
              </button>
            </div>
          </div>
          
          <div style={{flex: 1}}>
            <h3>Round 2 Status</h3>
            <p><strong>Current Stage:</strong> {team.round2_stage}/5</p>
            <p><strong>Completed At:</strong> {fmtTimestamp(team.round2_complete_at)}</p>
            <p><strong>Qualified:</strong> {team.qualified ? "Yes" : "No"}</p>
            <ul style={{listStyle: 'none', padding: 0, marginTop: '0.5rem'}}>
              {[1, 2, 3, 4, 5].map(stg => (
                <li key={stg} style={{marginBottom: '0.25rem'}}>
                  Stage {stg}: {team.round2_stage >= stg ? <span className="table-ok">Complete</span> : <span className="muted-cell">Pending</span>}
                </li>
              ))}
            </ul>
            <div style={{marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <button 
                className="admin-btn secondary" 
                onClick={() => onAdvance(team.team_name, 2, Math.min(5, team.round2_stage + 1))}
                disabled={team.round2_stage >= 5}
              >
                Force Advance R2 Stage
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
            <h3>Team Management</h3>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                className={`admin-btn ${team.qualified ? 'secondary' : 'primary'}`}
                onClick={async () => {
                  try {
                    const { qualifyTeam } = await import("../lib/apiClient");
                    const res = await qualifyTeam(team.team_name);
                    alert(`Team is now ${res.qualified ? 'qualified' : 'disqualified'}. Refresh to see changes.`);
                    onClose();
                  } catch (e) { alert("Failed to toggle qualify: " + e.message); }
                }}
              >
                {team.qualified ? "Revoke Qualification" : "Qualify for Round 2"}
              </button>
              
              <button 
                className="admin-btn danger" style={{ backgroundColor: '#ff2a2a', color: 'white', borderColor: '#ff2a2a' }}
                onClick={async () => {
                  if (confirm(`Are you sure you want to permanently delete team ${team.team_name}? This will delete all chat logs and progress.`)) {
                    try {
                      const { deleteTeam } = await import("../lib/apiClient");
                      await deleteTeam(team.team_name);
                      alert("Team deleted.");
                      onClose();
                    } catch (e) { alert("Failed to delete team: " + e.message); }
                  }
                }}
              >
                Delete Team
              </button>
            </div>
        </div>

        <div className="modal-actions">
          <button className="admin-btn primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
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

  // Event timer was moved to Round 1 Page

  // ── Derived values ───────────────────────────────────────────────────────────
  const completedTeams = teams.filter((t) => t.round1_complete_at != null);
  const qualifiedCount = qualified.length;
  const round2Active = round2Unlocked ? Math.min(qualifiedCount, 3) : 0;



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

  const [selectedTeam, setSelectedTeam] = useState(null);

  async function handleAdvanceTeam(teamName, round, targetStage) {
    try {
      await adminAdvanceTeam(teamName, round, targetStage);
      setNotice(`Successfully advanced ${teamName} to Stage ${targetStage} in Round ${round}.`);
      await loadTeams(); // refresh list
      if (selectedTeam && selectedTeam.team_name === teamName) {
        // Find updated team to keep modal accurate
        const updated = await fetchAdminTeams();
        const found = updated.find(t => t.team_name === teamName);
        if (found) setSelectedTeam(found);
      }
    } catch (err) {
      setNotice(`Failed to advance team: ${err.message}`);
    }
  }

  // ── Shared content area ──────────────────────────────────────────────────────

  function renderContent() {
    if (teamsLoading) return <LoadingState />;
    if (teamsError) return <ErrorState message={teamsError} onRetry={loadTeams} />;

    switch (section) {
      case "dashboard":
        return (
          <AdminDashboard
            teams={teams}
          />
        );
      case "leaderboard":
        return <AdminLeaderboard onSelectTeam={setSelectedTeam} />;
      case "round1":
        return (
          <AdminRound1Qualification
            teams={teams}
            selected={selected}
            toggleEligible={toggleEligible}
            qualified={qualified}
            openQualificationConfirm={openQualificationConfirm}
            round2Unlocked={round2Unlocked}
          />
        );
      case "chat":
        // Transcript viewer (handles both real chat_logs and manual advance system messages)
        return (
          <AdminTranscript
            teams={teams}
            transcriptTeam={transcriptTeam}
            setTranscriptTeam={setTranscriptTeam}
          />
        );
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
              ["leaderboard", "Teams & Leaderboard"],
              ["round1", "Round 2 Qualification"],
              ["chat", "Team Chat / Transcripts"],
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
          <strong>ADMIN</strong><span>EVENT CONTROL</span>
          <button
            className="admin-btn secondary"
            style={{ marginTop: "0.5rem", width: "100%", fontSize: "0.8rem" }}
            onClick={async () => {
              try { await adminLogout(); } catch (_) {}
              window.location.href = "/admin/login";
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div><div className="admin-eyebrow">PROMPT HEIST</div><h1>AI JAILBREAK SYMPOSIUM</h1></div>
          <div className="admin-header-state">
            <div><span>EVENT STATUS</span><strong className="live-dot">LIVE</strong></div>
            <div><span>CURRENT ROUND</span><strong>{round2Unlocked ? "ROUND 2" : "ROUND 1"}</strong></div>
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

      {selectedTeam && (
        <TeamDetailsModal 
          team={selectedTeam} 
          onClose={() => setSelectedTeam(null)} 
          onAdvance={handleAdvanceTeam} 
        />
      )}
    </main>
  );
}
