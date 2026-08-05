import React from 'react';

export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{
      color: '#000D1F', padding: 16, background: '#FFCDD2',
      borderRadius: 8, marginBottom: 16, borderLeft: '4px solid #FF6B6B',
    }}>
      Error: {message}
    </div>
  );
}
