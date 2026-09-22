import React, { useEffect, useRef, useState } from 'react';
import './campushelp.css';

/* ─────────────────────────────────────────────────────────────────────────────
   sendRound2Message — isolated chat logic for easy future API wiring.

   Current behaviour: local keyword matching (no network call).

   TODO: replace this with a real API call to the round 2 backend endpoint.
         When you do, keep the function signature identical:
           async function sendRound2Message(text: string): Promise<string>
         and remove the `replies` object + keyword matching below.
───────────────────────────────────────────────────────────────────────────── */
const REPLIES = {
  library:   'The library is usually located in the main academic block. Check your campus notice board for the latest timings.',
  events:    'You can find upcoming workshops, hackathons and student activities on the Events page.',
  academics: 'I can help with courses, exams, departments and academic resources.',
  transport: 'Campus transport information can include bus routes, pickup points and timings.',
};

async function sendRound2Message(text) {
  // TODO: replace this with a real API call to the round 2 backend endpoint.
  const lower = text.toLowerCase();
  if (lower.includes('library'))                                                return REPLIES.library;
  if (lower.includes('event') || lower.includes('hackathon'))                  return REPLIES.events;
  if (lower.includes('exam') || lower.includes('course') || lower.includes('department')) return REPLIES.academics;
  if (lower.includes('bus') || lower.includes('transport'))                    return REPLIES.transport;
  if (lower.includes('hello') || lower.includes('hi'))                        return 'Hello! How can I help you today?';
  return 'I can help with academics, the library, campus facilities, transport and events. Try asking about one of those.';
}

/* Suggested questions shown until the user sends their first message */
const SUGGESTIONS = [
  'What are the library hours?',
  'When is the next campus event?',
  'How do I find the bus schedule?',
];

/* ─────────────────────────────────────────────────────────────────────────────
   Round2Page — mounts at /round-2 inside the main app router.
   Intentionally keeps CampusHelp's plain portal look (no Prompt Heist theme).
───────────────────────────────────────────────────────────────────────────── */
export default function Round2Page() {
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState('');
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Welcome to CampusHelp. How can I assist you today?' },
  ]);
  const [pillsVisible, setPillsVisible] = useState(true);
  const bottomRef = useRef(null);

  /* Scroll to latest message whenever the list changes */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  /* Main send handler — unchanged logic, same signature as before */
  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setPillsVisible(false);
    setMessages(prev => [...prev, { from: 'user', text }]);
    setInput('');

    const reply = await sendRound2Message(text);
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'bot', text: reply }]);
    }, 350);
  }

  /* Pills route through the same async logic without needing a form event */
  function handlePill(text) {
    setPillsVisible(false);
    setMessages(prev => [...prev, { from: 'user', text }]);
    sendRound2Message(text).then(reply => {
      setTimeout(() => {
        setMessages(prev => [...prev, { from: 'bot', text: reply }]);
      }, 350);
    });
  }

  return (
    <div className="campushelp-root">
      <div className="site">
        <header className="nav">
          <div className="logo">CampusHelp</div>
          <nav>
            <a href="#home">Home</a>
            <a href="#academics">Academics</a>
            <a href="#campus">Campus</a>
            <a href="#events">Events</a>
          </nav>
          <button className="nav-chat" onClick={() => setOpen(true)}>Ask us</button>
        </header>

        <main>
          <section className="hero" id="home">
            <div className="hero-copy">
              <p className="eyebrow">STUDENT INFORMATION PORTAL</p>
              <h1>Everything you need for campus life.</h1>
              <p className="hero-text">
                Find useful information about academics, facilities, events and
                everyday student life in one simple place.
              </p>
              <button className="primary" onClick={() => setOpen(true)}>Ask CampusHelp</button>
            </div>
            <div className="hero-note">
              <span>01</span>
              <p>Quick answers<br />without the searching.</p>
            </div>
          </section>

          <section className="intro">
            <p className="section-label">EXPLORE</p>
            <h2>What can I help you with?</h2>
            <p className="muted">Choose a section or ask the chatbot directly.</p>

            <div className="feature-grid">
              <article id="academics">
                <span>01</span>
                <h3>Academics</h3>
                <p>Courses, departments, exams and academic resources.</p>
                <button onClick={() => setOpen(true)}>Ask about academics →</button>
              </article>
              <article id="campus">
                <span>02</span>
                <h3>Campus</h3>
                <p>Library, labs, transport and other campus facilities.</p>
                <button onClick={() => setOpen(true)}>Ask about campus →</button>
              </article>
              <article id="events">
                <span>03</span>
                <h3>Events</h3>
                <p>Workshops, hackathons, clubs and student activities.</p>
                <button onClick={() => setOpen(true)}>Ask about events →</button>
              </article>
            </div>
          </section>

          <section className="bottom-info">
            <div>
              <p className="section-label">CAMPUSHELP</p>
              <h2>A small tool for everyday questions.</h2>
            </div>
            <p>
              This starter version uses a simple local chatbot. Later, we can
              connect it to your own college information or an AI API.
            </p>
          </section>
        </main>

        <footer>
          <span>CampusHelp</span>
          <span>Student Information Portal</span>
        </footer>

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
          <div className="ch-panel" role="dialog" aria-label="CampusHelp support chat">

            {/* Header */}
            <div className="ch-panel__header">
              <div className="ch-panel__avatar" aria-hidden="true">CH</div>
              <div className="ch-panel__identity">
                <span className="ch-panel__name">CampusHelp Assistant</span>
                <span className="ch-panel__sub">
                  <span className="ch-panel__dot" aria-hidden="true"></span>
                  Student Support
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

            {/* Message list */}
            <div className="ch-panel__messages">
              {messages.map((m, i) => (
                <div key={i} className={"ch-bubble ch-bubble--" + m.from}>
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

              <div ref={bottomRef} />
            </div>

            {/* Disclaimer */}
            <p className="ch-disclaimer">
              This chat may be reviewed for quality and support purposes.
            </p>

            {/* Input bar */}
            <form className="ch-panel__form" onSubmit={handleSend}>
              <input
                className="ch-panel__input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your question..."
                aria-label="Chat message"
              />
              <button
                type="submit"
                className="ch-panel__send"
                aria-label="Send message"
                disabled={!input.trim()}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M2 9l14-7-5 7 5 7L2 9z"
                    stroke="currentColor" strokeWidth="1.6"
                    strokeLinejoin="round" strokeLinecap="round"/>
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
