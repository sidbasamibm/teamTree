import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from '../utils/ThemeContext';
import addDocumentIcon from './add--document.svg';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const MinimizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="18" height="18" fill="#4DB6AC">
    <path d="M30.745,31.255l-9.385-9.386V30h-0.72v-9.36H30v0.721h-8.131l9.386,9.385L30.745,31.255z M1.254,31.255
      l-0.509-0.51l9.385-9.385H2v-0.72h9.36V30h-0.72v-8.131L1.254,31.255z M30,11.36h-9.36V2h0.721v8.131l9.385-9.385l0.51,0.509
      l-9.386,9.386H30V11.36z M11.36,11.36H2v-0.72h8.131L0.746,1.254l0.509-0.509l9.386,9.385V2h0.72v9.36H11.36z"/>
    <rect style={{ fill: 'none' }} width="32" height="32"/>
  </svg>
);

const MaximizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="18" height="18" fill="#4DB6AC">
    <path d="M31.36,31.36H22v-0.72h8.131l-9.386-9.385l0.51-0.51l9.385,9.386V22h0.721v9.36H31.36z M10,31.36H0.64V22
      h0.72v8.131l9.386-9.386l0.509,0.51L1.869,30.64H10V31.36z M21.255,11.254l-0.51-0.509l9.386-9.386H22V0.64h9.36V10h-0.72V1.869
      L21.255,11.254z M10.746,11.254L1.36,1.869V10H0.64V0.64H10v0.72H1.869l9.385,9.386L10.746,11.254z"/>
    <rect style={{ fill: 'none' }} width="32" height="32"/>
  </svg>
);

const QAIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"
       width="24" height="24" fill="currentColor">
    <path d="M10.7,31.199l-3.893-5.844H3c-1.301,0-2.36-1.059-2.36-2.36v-10
      c0-1.301,1.059-2.36,2.36-2.36h11.64V3c0-1.301,1.059-2.36,2.36-2.36h12c1.302,0,2.36,1.059,2.36,2.36v8
      c0,1.301-1.059,2.36-2.36,2.36h-2.777l-1.9,3.801l-0.645-0.322l2-4C25.74,12.717,25.864,12.64,26,12.64h3
      c0.904,0,1.64-0.736,1.64-1.64V3c0-0.904-0.735-1.64-1.64-1.64H17c-0.904,0-1.64,0.736-1.64,1.64v7.635H18
      c1.181,0,2.161,0.871,2.333,2.005H23v0.72h-2.64v9.635c0,1.302-1.059,2.36-2.36,2.36h-7v-0.721h7c0.904,0,1.64-0.735,1.64-1.64v-10
      c0-0.904-0.735-1.64-1.64-1.64H3c-0.904,0-1.64,0.736-1.64,1.64v10c0,0.904,0.736,1.64,1.64,1.64h4c0.121,0,0.233,0.061,0.3,0.161
      l4,6.005L10.7,31.199z M23.378,8.495h-0.721c0-1.219,0.217-1.677,1.008-2.129c0.555-0.317,0.78-0.666,0.78-1.205
      c0-0.962-0.776-1.303-1.441-1.303c-0.812,0-1.449,0.573-1.449,1.303h-0.721c0-1.134,0.953-2.023,2.17-2.023
      c1.272,0,2.162,0.832,2.162,2.023c0,1.055-0.653,1.549-1.144,1.83C23.5,7.29,23.378,7.464,23.378,8.495z M11.5,18
      c0,0.552-0.448,1-1,1s-1-0.448-1-1s0.448-1,1-1S11.5,17.448,11.5,18z M15.5,17c-0.552,0-1,0.448-1,1s0.448,1,1,1s1-0.448,1-1
      S16.052,17,15.5,17z M5.5,17c-0.552,0-1,0.448-1,1s0.448,1,1,1s1-0.448,1-1S6.052,17,5.5,17z M23,10.625
      c0.345,0,0.625-0.28,0.625-0.625S23.345,9.375,23,9.375S22.375,9.655,22.375,10S22.655,10.625,23,10.625z"/>
    <rect style={{ fill: 'none' }} width="32" height="32"/>
  </svg>
);

// Removed old static responses - now using AI backend

// Size config — normal vs expanded
const SIZES = {
  normal:   { width: 320, msgMaxHeight: 300, msgMinHeight: 200 },
  expanded: { width: 520, msgMaxHeight: 500, msgMinHeight: 300 },
};

export default function ChatWidget() {
  const { dark } = useTheme();
  const [open, setOpen]         = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput]       = useState('');
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! I'm the NovaCart AI assistant. Ask me anything about orders, revenue, products, or customers!" }
  ]);
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef  = useRef(null);
  const fileRef    = useRef(null);

  const size = expanded ? SIZES.expanded : SIZES.normal;

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    // Add user message immediately
    const userMsg = { from: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Call AI backend - no timeout, wait as long as needed for ICA to respond
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversation: conversation
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      // Add bot response
      const botMsg = {
        from: 'bot',
        text: result.message || 'I apologize, but I could not process that request.',
        sources: result.sources,
        error: result.error
      };

      setMessages(prev => [...prev, botMsg]);

      // Update conversation history
      if (result.conversation) {
        setConversation(result.conversation);
      }

    } catch (error) {
      // Add error message
      let errorText = error.message;

      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        errorText = 'Failed to connect to backend. Make sure the backend is running at ' + BACKEND_URL;
      }

      const errorMsg = {
        from: 'bot',
        text: `Sorry, I encountered an error: ${errorText}`,
        error: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') send();
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const userMsg = { from: 'user', text: `📎 ${file.name}`, isFile: true };
    const botMsg  = { from: 'bot',  text: `File "${file.name}" received. Note: file analysis is not yet supported.` };
    setMessages(prev => [...prev, userMsg, botMsg]);
    // Reset so the same file can be re-selected
    e.target.value = '';
  }

  const bg      = dark ? '#1E2A3A' : '#ffffff';
  const border  = dark ? '#2e3d50' : '#e5e7eb';
  const textCol = dark ? '#e0e0e0' : '#1f2328';
  const mutedBg = dark ? '#0D1B2A' : '#f7f8fa';
  const codeBg  = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';
  const codeCol = dark ? '#e0e0e0' : '#1f2328';

  return (
    <>
      <style>{`
        .md-content > *:first-child { margin-top: 0; }
        .md-content > *:last-child { margin-bottom: 0; }
        .md-content p { margin: 0 0 6px; }
        .md-content ul, .md-content ol { margin: 4px 0 6px; padding-left: 20px; }
        .md-content li { margin-bottom: 2px; }
        .md-content a { color: #4DB6AC; }
        .md-content code { background: ${codeBg}; color: ${codeCol}; padding: 1px 4px; border-radius: 3px; font-size: 12px; }
        .md-content pre { background: ${codeBg}; padding: 8px; border-radius: 6px; overflow-x: auto; margin: 4px 0 6px; }
        .md-content pre code { background: none; padding: 0; }
        .md-content table { border-collapse: collapse; margin: 4px 0 6px; font-size: 12px; }
        .md-content th, .md-content td { border: 1px solid ${border}; padding: 4px 8px; }
        .md-content blockquote { margin: 4px 0 6px; padding-left: 10px; border-left: 3px solid ${border}; opacity: 0.85; }
      `}</style>

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Chat assistant"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 200,
          width: 52, height: 52, borderRadius: '50%',
          background: '#0D2B4E', border: '2px solid #4DB6AC',
          color: '#4DB6AC', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
        <QAIcon />
      </button>

      {/* Backdrop when expanded */}
      {open && expanded && (
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 199,
            background: 'rgba(0,0,0,0.4)',
          }}
        />
      )}

      {/* Chat box */}
      {open && (
        <div style={{
          position: 'fixed', zIndex: 200,
          ...(expanded ? {
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600, maxHeight: '80vh',
          } : {
            bottom: 92, right: 28,
            width: size.width,
          }),
          borderRadius: 12,
          background: bg, border: `1px solid ${border}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          transition: 'width 0.25s ease',
        }}>

          {/* Header */}
          <div style={{
            background: '#0D2B4E', padding: '10px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>NovaCart Assistant</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Expand / minimize toggle */}
              <button
                onClick={() => setExpanded(e => !e)}
                title={expanded ? 'Minimize' : 'Expand'}
                style={{
                  background: 'none', border: 'none', color: '#B0BEC5',
                  cursor: 'pointer', lineHeight: 1, padding: 0,
                  display: 'flex', alignItems: 'center',
                }}>
                {expanded ? <MinimizeIcon /> : <MaximizeIcon />}
              </button>
              {/* Close */}
              <button
                onClick={() => setOpen(false)}
                title="Close"
                style={{
                  background: 'none', border: 'none', color: '#B0BEC5',
                  cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0,
                }}>
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 8,
            maxHeight: expanded ? '60vh' : size.msgMaxHeight,
            minHeight: size.msgMinHeight,
            background: mutedBg,
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                background: msg.from === 'user' ? '#4DB6AC' : (dark ? '#1E2A3A' : '#ffffff'),
                color: msg.from === 'user' ? '#fff' : textCol,
                borderRadius: msg.from === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                padding: '8px 12px', fontSize: 13, lineHeight: 1.5,
                border: msg.from === 'bot' ? `1px solid ${border}` : 'none',
              }}>
                {msg.from === 'bot' ? (
                  <div className="md-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  msg.text
                )}

                {/* Show cited source documents, if any */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: dark ? '#8fa5bd' : '#6b7785',
                  }}>
                    Sources: {msg.sources.join(', ')}
                  </div>
                )}

                {/* Show error indicator */}
                {msg.error && (
                  <div style={{
                    marginTop: 8,
                    padding: 6,
                    background: 'rgba(255,100,100,0.1)',
                    borderRadius: 4,
                    fontSize: 11,
                    color: '#ff6b6b'
                  }}>
                    ⚠️ Error occurred
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                maxWidth: '80%',
                background: dark ? '#1E2A3A' : '#ffffff',
                color: textCol,
                borderRadius: '12px 12px 12px 2px',
                padding: '8px 12px',
                fontSize: 13,
                border: `1px solid ${border}`,
              }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span>Thinking</span>
                  <span className="loading-dots">...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            display: 'flex', borderTop: `1px solid ${border}`,
            background: bg, padding: '8px 10px', gap: 8, flexShrink: 0,
            alignItems: 'center',
          }}>
            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            {/* Attach button */}
            <button
              onClick={() => fileRef.current.click()}
              title="Attach file"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                display: 'flex', alignItems: 'center', flexShrink: 0,
                opacity: 0.75,
              }}>
              <img src={addDocumentIcon} alt="Attach file" width={20} height={20}
                style={{ filter: dark ? 'invert(1)' : 'none' }} />
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask something…"
              style={{
                flex: 1, border: `1px solid ${border}`, borderRadius: 6,
                padding: '6px 10px', fontSize: 13,
                background: mutedBg, color: textCol, outline: 'none',
              }}
            />
            <button onClick={send} disabled={loading} style={{
              background: loading ? '#888' : '#4DB6AC',
              border: 'none', borderRadius: 6,
              color: '#fff', padding: '6px 12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600,
              opacity: loading ? 0.6 : 1,
            }}>
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
