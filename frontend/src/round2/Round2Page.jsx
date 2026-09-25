import React, { useEffect, useRef, useState } from 'react';
import './campushelp.css';
import { sendRound2ChatMessage, submitRound2Flag, getMe, fetchRound2Status } from '../lib/apiClient';
import { ROUND_2_OBJECTIVES } from './round2StageObjectives';

/* ─────────────────────────────────────────────────────────────────────────────
   team_id is now derived from the httpOnly session cookie set at login.
   No manual team_id field is needed.
───────────────────────────────────────────────────────────────────────────── */

/* Suggested questions shown until the user sends their first message */
const SUGGESTIONS = [
  'I need help with a support ticket.',
  'Can you look up an account for me?',
  'I have an HR question.',
];

/* ─────────────────────────────────────────────────────────────────────────────
   Round2Page — mounts at /round-2 inside the main app router.
   Keeps CampusHelp's plain portal look (no Prompt Heist theme).
───────────────────────────────────────────────────────────────────────────── */
export default function Round2Page() {
  const [open, setOpen]             = useState(false);
  const [input, setInput]           = useState('');
  const [messages, setMessages]     = useState([
    { from: 'bot', text: 'Welcome to Nova Dynamics Support. How can I assist you today?' },
  ]);
  const [pillsVisible, setPillsVisible] = useState(true);
  const [loading, setLoading]       = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [clearedPopup, setClearedPopup] = useState(null); // { stage: number, type: 'stage' | 'round' }

  // Flag submission state
  const [flagInput, setFlagInput]   = useState('');
  const [flagResult, setFlagResult] = useState(null); // null | 'correct' | 'wrong'
  const [flagSubmitting, setFlagSubmitting] = useState(false);

  const bottomRef = useRef(null);

  const [round2Open, setRound2Open] = useState(false);
  const [teamQualified, setTeamQualified] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    async function loadAccess() {
      try {
        const [meData, statusData] = await Promise.all([
          getMe().catch(() => null),
          fetchRound2Status().catch(() => ({ round2_open: false }))
        ]);
        if (meData && meData.qualified) setTeamQualified(true);
        if (statusData && statusData.round2_open) setRound2Open(true);
      } finally {
        setStatusLoading(false);
      }
    }
    loadAccess();
  }, []);

  /* Scroll to latest message whenever the list changes */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  /* Append a system-style status message to the chat */
  function pushSystemMessage(text) {
    setMessages(prev => [...prev, { from: 'system', text }]);
  }

  /* Main send handler */
  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setPillsVisible(false);
    setMessages(prev => [...prev, { from: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const data = await sendRound2ChatMessage({ message: text });

      setMessages(prev => [...prev, { from: 'bot', text: data.reply }]);

      if (data.systemMessage) {
        setTimeout(() => pushSystemMessage(data.systemMessage), 400);
      }

      if (data.stage_cleared) {
        setClearedPopup({
          stage: currentStage,
          type: data.round2_complete ? 'round' : 'stage'
        });
      }

      if (data.currentStage !== currentStage) {
        setCurrentStage(data.currentStage);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error — is the backend running?';
      pushSystemMessage(`[Error] ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  /* Pills route through the same async logic without needing a form event */
  function handlePill(text) {
    setPillsVisible(false);
    setMessages(prev => [...prev, { from: 'user', text }]);
    setLoading(true);

    sendRound2ChatMessage({ message: text })
      .then(data => {
        setMessages(prev => [...prev, { from: 'bot', text: data.reply }]);
        if (data.systemMessage) {
          setTimeout(() => pushSystemMessage(data.systemMessage), 400);
        }
        if (data.stage_cleared) {
          setClearedPopup({
            stage: currentStage,
            type: data.round2_complete ? 'round' : 'stage'
          });
        }
        if (data.currentStage !== currentStage) {
          setCurrentStage(data.currentStage);
        }
      })
      .catch(err => {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        pushSystemMessage(`[Error] ${msg}`);
      })
      .finally(() => setLoading(false));
  }

  /* Flag submission */
  async function handleFlagSubmit(e) {
    e.preventDefault();
    if (!flagInput.trim() || flagSubmitting) return;
    setFlagSubmitting(true);
    setFlagResult(null);
    try {
      const data = await submitRound2Flag({ flag: flagInput.trim() });
      setFlagResult(data.correct ? 'correct' : 'wrong');
    } catch (err) {
      setFlagResult('error');
    } finally {
      setFlagSubmitting(false);
    }
  }

  return (
    <div className="campushelp-root">
      <div className="site">
        <header className="nav">
          <div className="logo">Nova Dynamics</div>
          <nav>
            <a href="#home">Home</a>
            <a href="#academics">Services</a>
            <a href="#campus">About</a>
            <a href="#events">Contact</a>
          </nav>
          <button className="nav-chat" onClick={() => setOpen(true)}>Support Chat</button>
        </header>

        <main>
          <section className="hero" id="home">
            <div className="hero-copy">
              <p className="eyebrow">NOVA DYNAMICS INTERNAL PORTAL</p>
              <h1>Your company support hub.</h1>
              <p className="hero-text">
                Access HR, IT Helpdesk, and internal support resources in one place.
                Chat with our AI assistant for instant answers.
              </p>
              <button className="primary" onClick={() => setOpen(true)}>Open Support Chat</button>
            </div>
            <div className="hero-note">
              <span>R2</span>
              <p>Nova Dynamics<br />Internal Systems.</p>
            </div>
          </section>

          <section className="intro">
            <p className="section-label">SUPPORT CHANNELS</p>
            <h2>What can we help you with?</h2>
            <p className="muted">Use the chat assistant or browse the sections below.</p>

            <div className="feature-grid">
              <article id="academics">
                <span>01</span>
                <h3>General Support</h3>
                <p>Company FAQs, ticket status, and facilities information.</p>
                <button onClick={() => setOpen(true)}>Ask Support →</button>
              </article>
              <article id="campus">
                <span>02</span>
                <h3>HR Assistance</h3>
                <p>Employee records, usernames, and HR requests.</p>
                <button onClick={() => setOpen(true)}>Ask HR →</button>
              </article>
              <article id="events">
                <span>03</span>
                <h3>IT Helpdesk</h3>
                <p>Password resets, access requests, and credential support.</p>
                <button onClick={() => setOpen(true)}>Ask IT →</button>
              </article>
            </div>
          </section>

          {/* Flag submission section — always visible */}
          <section className="bottom-info" id="flag-submit" style={{ alignItems: 'center' }}>
            <div>
              <p className="section-label">ROUND 2 FLAG</p>
              <h2 style={{ margin: 0 }}>Found the master flag?</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <form
                onSubmit={handleFlagSubmit}
                style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
              >
                <input
                  type="text"
                  value={flagInput}
                  onChange={e => setFlagInput(e.target.value)}
                  placeholder="Enter your flag here"
                  aria-label="Flag submission input"
                  style={{
                    flex: '1 1 260px',
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '1rem',
                    minWidth: 0,
                    background: '#fff',
                    color: '#111',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!flagInput.trim() || flagSubmitting}
                  style={{ 
                    whiteSpace: 'nowrap',
                    padding: '14px 24px',
                    borderRadius: '8px',
                    background: '#171717',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}
                >
                  {flagSubmitting ? 'Checking…' : 'Submit Flag'}
                </button>
              </form>
              {flagResult === 'correct' && (
                <p style={{ marginTop: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                  ✓ Correct! You've completed Round 2.
                </p>
              )}
              {flagResult === 'wrong' && (
                <p style={{ marginTop: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                  ✗ Incorrect flag — keep exploring.
                </p>
              )}
              {flagResult === 'noteamid' && (
                <p style={{ marginTop: '0.75rem', color: '#d97706', fontWeight: 600 }}>
                  ⚠ Enter your Team ID first (open the chat).
                </p>
              )}
              {flagResult === 'error' && (
                <p style={{ marginTop: '0.75rem', color: '#dc2626' }}>
                  Network error — is the backend running?
                </p>
              )}
            </div>
          </section>
        </main>

        <footer>
          <span>Nova Dynamics</span>
          <span>Internal Support Portal</span>
        </footer>

        {/* Chat / Access Logic */}
        {statusLoading ? (
          <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#333', color: '#fff', padding: '1rem 1.5rem', borderRadius: '8px', zIndex: 9999 }}>
            Loading access...
          </div>
        ) : !round2Open ? (
          <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#333', color: '#fff', padding: '1rem 1.5rem', borderRadius: '8px', zIndex: 9999 }}>
            Round 2 hasn't started yet.
          </div>
        ) : !teamQualified ? (
          <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#333', color: '#fff', padding: '1rem 1.5rem', borderRadius: '8px', zIndex: 9999 }}>
            Your team didn't qualify for Round 2.
          </div>
        ) : (
          <>
            {/* Launcher button */}
            <button
              className={"ch-launcher" + (open ? " ch-launcher--open" : "")}
              onClick={() => setOpen(o => !o)}
              aria-label={open ? "Close support chat" : "Open support chat"}
            >
              {open ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <path d="M3 4a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2H7l-4 3V4z"
                    stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            {/* Chat panel */}
            {open && (
              <div className="ch-panel" role="dialog" aria-label="Nova Dynamics support chat">
                {/* Header */}
                <div className="ch-panel__header">
                  <div className="ch-panel__avatar" aria-hidden="true">ND</div>
                  <div className="ch-panel__identity">
                    <span className="ch-panel__name">Nova Dynamics Support</span>
                    <span className="ch-panel__sub">
                      <span className="ch-panel__dot" aria-hidden="true"></span>
                      Stage {currentStage} / 5
                    </span>
                  </div>
                  <button
                    className="ch-panel__close"
                    onClick={() => setOpen(false)}
                    aria-label="Close chat"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                <div className="ch-panel__messages">
                  <div className="ch-system-msg" style={{ 
                    backgroundColor: '#fffbe8', 
                    color: '#854d0e', 
                    border: '1px solid #fef08a',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    marginBottom: '1rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    {ROUND_2_OBJECTIVES[currentStage] || "Unknown stage."}
                  </div>

                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={
                        m.from === 'system'
                          ? 'ch-system-msg'
                          : 'ch-bubble ch-bubble--' + m.from
                      }
                    >
                      {m.text}
                    </div>
                  ))}

                  {pillsVisible && (
                    <div className="ch-pills">
                      {SUGGESTIONS.map((s) => (
                        <button key={s} className="ch-pill" onClick={() => handlePill(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {loading && (
                    <div className="ch-bubble ch-bubble--bot" style={{ opacity: 0.5 }}>
                      Thinking…
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>

                <p className="ch-disclaimer">
                  This chat may be reviewed for quality and support purposes.
                </p>

                <form className="ch-panel__form" onSubmit={handleSend}>
                  <input
                    className="ch-panel__input"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type your question…"
                    aria-label="Chat message"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    className="ch-panel__send"
                    aria-label="Send message"
                    disabled={!input.trim() || loading}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M2 9l14-7-5 7 5 7L2 9z"
                        stroke="currentColor" strokeWidth="1.6"
                        strokeLinejoin="round" strokeLinecap="round"/>
                    </svg>
                  </button>
                </form>

                {/* Stage Cleared Modal */}
                {clearedPopup && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <div style={{
                      backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px',
                      maxWidth: '80%', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                      <h3 style={{ margin: '0 0 0.5rem', color: '#16a34a' }}>
                        {clearedPopup.type === 'round' ? 'Round 2 Complete!' : `Stage ${clearedPopup.stage} Cleared!`}
                      </h3>
                      <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#444' }}>
                        {clearedPopup.type === 'round' 
                          ? 'You have extracted the master flag! Enter it below.' 
                          : 'You successfully bypassed this level. Proceeding to the next.'}
                      </p>
                      <button 
                        className="ch-panel__send" 
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: '#171717', color: '#fff' }}
                        onClick={() => setClearedPopup(null)}
                      >
                        {clearedPopup.type === 'round' ? 'Finish' : 'Proceed'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
