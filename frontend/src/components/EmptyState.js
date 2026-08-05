import React from 'react';

export default function EmptyState({ message = 'No data found for the selected date range.' }) {
  return (
    <div style={{
      padding: 32, textAlign: 'center',
      color: 'var(--text-muted)', background: 'var(--bg-card)',
      borderRadius: 8, border: '1px solid var(--border)',
    }}>
      {message}
    </div>
  );
}
