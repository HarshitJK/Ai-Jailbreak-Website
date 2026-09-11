import React from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED DATA
═══════════════════════════════════════════════════════════════════════════ */
export const challenges = [
  "Create a prompt that generates a startup idea in under 100 words.",
  "Write a prompt that helps students learn faster using AI.",
  "Create a prompt that generates marketing content for a product launch.",
  "Write a prompt that can summarize a research paper.",
  "Create a prompt that generates innovative business ideas.",
  "Design a master prompt that combines creativity and problem solving."
];

/* ═══════════════════════════════════════════════════════════════════════════
   BRAND — shared logo/brand block
═══════════════════════════════════════════════════════════════════════════ */
export function Brand({ compact = false }) {
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
   RULES ALERT
═══════════════════════════════════════════════════════════════════════════ */
export function alertRules() {
  window.alert(
`RULES

1. Team size: 1-2 participants.
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
   COMPLETION SCREEN
═══════════════════════════════════════════════════════════════════════════ */
function Completion({ progress, onProceed }) {
  return (
    <div className="completion">
      <div className="completion-line" />
      <div className="eyebrow">FINAL STATUS</div>
      <h2>HEIST COMPLETED</h2>
      <p>You successfully cracked all prompts.</p>
      <div className="completion-count">{progress} / 6 <span>Challenges Completed</span></div>
      <button className="primary-btn small" onClick={onProceed}>Proceed to Round 2 <span>to</span></button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROUND 1 PAGE (ChallengePage)
═══════════════════════════════════════════════════════════════════════════ */
export default function Round1Page({
  team, progress, completed, active, messages, input, setInput, loading,
  currentDone, allDone, mobileNav, setMobileNav, jumpToChallenge, submitPrompt, logout, onProceed
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
                  Send <span>up</span>
                </button>
              </div>
              <div className="composer-note">Text-based interaction only</div>
            </>
          ) : (
            <Completion progress={progress} onProceed={onProceed} />
          )}
        </div>
      </section>
    </main>
  );
}
