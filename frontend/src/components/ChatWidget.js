import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../utils/ThemeContext';

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

const RESPONSES = {
  default: "I'm the NovaCart assistant. Try asking about orders, revenue, products, or customers.",
  hello:   "Hi there! How can I help you with the NovaCart dashboard today?",
  orders:  "The Orders view shows monthly revenue and order volume. Use the date range filters at the top to narrow the data.",
  revenue: "Revenue is calculated from orders with status 'delivered' or 'shipped'. Check the Orders view for monthly breakdowns.",
  products:"The Products view shows the top 10 products by revenue including units sold and category.",
  customers:"The Customers view shows the top 20 customers by total spend. You can sort by any column.",
  cities:  "The Orders view includes a cities chart showing revenue broken down by city and state.",
  help:    "You can ask me about: orders, revenue, products, customers, or cities.",
};

function getBotReply(text) {
  const lower = text.toLowerCase();
  if (lower.match(/\bhello\b|\bhi\b|\bhey\b/))   return RESPONSES.hello;
  if (lower.includes('order'))                     return RESPONSES.orders;
  if (lower.includes('revenue') || lower.includes('money') || lower.includes('sales')) return RESPONSES.revenue;
  if (lower.includes('product'))                   return RESPONSES.products;
  if (lower.includes('customer'))                  return RESPONSES.customers;
  if (lower.includes('city') || lower.includes('cities') || lower.includes('location')) return RESPONSES.cities;
  if (lower.includes('help'))                      return RESPONSES.help;
  return RESPONSES.default;
}

export default function ChatWidget() {
  const { dark } = useTheme();
  const [open, setOpen]     = useState(false);
  const [input, setInput]   = useState('');
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I\'m the NovaCart assistant. Ask me anything about the dashboard.' }
  ]);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  function send() {
    const text = input.trim();
    if (!text) return;
    const userMsg  = { from: 'user', text };
    const botMsg   = { from: 'bot',  text: getBotReply(text) };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
  }

  function handleKey(e) {
    if (e.key === 'Enter') send();
  }

  const bg      = dark ? '#1E2A3A' : '#ffffff';
  const border  = dark ? '#2e3d50' : '#e5e7eb';
  const textCol = dark ? '#e0e0e0' : '#1f2328';
  const mutedBg = dark ? '#0D1B2A' : '#f7f8fa';

  return (
    <>
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

      {/* Chat box */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 28, zIndex: 200,
          width: 320, borderRadius: 12,
          background: bg, border: `1px solid ${border}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            background: '#0D2B4E', padding: '10px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>NovaCart Assistant</span>
            <button onClick={() => setOpen(false)} style={{
              background: 'none', border: 'none', color: '#B0BEC5',
              cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0,
            }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 8,
            maxHeight: 300, minHeight: 200, background: mutedBg,
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
                {msg.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            display: 'flex', borderTop: `1px solid ${border}`,
            background: bg, padding: '8px 10px', gap: 8,
          }}>
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
            <button onClick={send} style={{
              background: '#4DB6AC', border: 'none', borderRadius: 6,
              color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
