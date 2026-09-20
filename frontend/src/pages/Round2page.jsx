import React, { useState } from 'react';

function Round2page() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I’m CampusHelp. What would you like to know?' }
  ]);

  const replies = {
    library: 'The library is usually located in the main academic block. Check your campus notice board for the latest timings.',
    events: 'You can find upcoming workshops, hackathons and student activities on the Events page.',
    academics: 'I can help with courses, exams, departments and academic resources.',
    transport: 'Campus transport information can include bus routes, pickup points and timings.',
  };

  function sendMessage(e) {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;

    setMessages(prev => [...prev, { from: 'user', text }]);

    const lower = text.toLowerCase();
    let reply = 'I can help with academics, the library, campus facilities, transport and events. Try asking about one of those.';
    if (lower.includes('library')) reply = replies.library;
    else if (lower.includes('event') || lower.includes('hackathon')) reply = replies.events;
    else if (lower.includes('exam') || lower.includes('course') || lower.includes('department')) reply = replies.academics;
    else if (lower.includes('bus') || lower.includes('transport')) reply = replies.transport;
    else if (lower.includes('hello') || lower.includes('hi')) reply = 'Hello! How can I help you today?';

    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'bot', text: reply }]);
    }, 350);

    setMessage('');
  }

  return (
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

      <button className="chat-button" onClick={() => setOpen(!open)} aria-label="Open chatbot">
        {open ? '×' : 'Chat'}
      </button>

      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <div>
              <strong>CampusHelp</strong>
              <small>Student assistant</small>
            </div>
            <button onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.from}`}>{m.text}</div>
            ))}
          </div>

          <form className="chat-form" onSubmit={sendMessage}>
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Ask a question..."
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Round2page;