/**
 * CustomersView.js — Customer List page
 *
 * This page shows:
 *   - A sortable table of top 20 customers by revenue
 *   - Columns: Name | City | State | Orders | Total Spent
 *   - A date range filter
 *
 * The data fetching is already wired up.
 * Your job: implement the UI and the sorting logic.
 */

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getCustomers } from '../utils/api';

function formatCurrency(value) {
  if (!value) return '$0';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CustomersView() {
  const [startDate,  setStartDate]  = useState('2022-01-01');
  const [endDate,    setEndDate]    = useState('2022-12-31');
  const [customers,  setCustomers]  = useState([]);
  const [sortBy,     setSortBy]     = useState('total_spent');
  const [sortDir,    setSortDir]    = useState('desc');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomers(startDate, endDate);
      setCustomers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Sort handler — toggles direction if same column, resets to desc if new column
  function handleSort(column) {
    if (sortBy === column) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  }

  // Apply sort to customers array
  const sorted = [...customers].sort((a, b) => {
    const va = a[sortBy], vb = b[sortBy];
    if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va;
    return sortDir === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });

  // Sort indicator helper
  const sortIcon = (col) => sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="page">

        <div className="filter-bar">
          <label>From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <label>To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button className="btn-apply" onClick={loadData}>Apply</button>
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>
            {customers.length} customers
          </span>
        </div>

        {error && (
          <div style={{ color: '#C62828', padding: 16, background: '#FFEBEE', borderRadius: 8, marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        {loading && <div className="loading">Loading customers…</div>}

        {!loading && !error && (
          <div className="card">
            <div className="section-title" style={{ marginBottom: 16 }}>
              Top Customers by Revenue
            </div>

            {/*
              STEP 1 — Sortable table
              sorted is: [{ customer_id, name, city, state, total_orders, total_spent }]

              Build a table with these columns:
                Name | City | State | Orders | Total Spent

              Each column header should be clickable and call handleSort(columnName).
              Use sortIcon(columnName) to show ↑ or ↓ on the active sort column.

              Hint: use a standard HTML <table> with <thead> and <tbody>.
              Style alternating rows with different background colors.
              Format total_spent with formatCurrency().
            */}

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {[
                    { label: 'Name',        col: 'name'         },
                    { label: 'City',        col: 'city'         },
                    { label: 'State',       col: 'state'        },
                    { label: 'Orders',      col: 'total_orders' },
                    { label: 'Total Spent', col: 'total_spent'  },
                  ].map(({ label, col }) => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      style={{
                        padding: '10px 12px',
                        textAlign: col === 'total_spent' || col === 'total_orders' ? 'right' : 'left',
                        background: 'var(--bg-secondary, #f7f8fa)',
                        borderBottom: '2px solid var(--border, #e5e7eb)',
                        cursor: 'pointer',
                        userSelect: 'none',
                        color: sortBy === col ? 'var(--accent, #3b82d4)' : 'var(--text-primary, #1f2328)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}{sortIcon(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => (
                  <tr
                    key={c.customer_id}
                    style={{ background: i % 2 === 0 ? 'var(--bg-primary, #ffffff)' : 'var(--bg-secondary, #f7f8fa)' }}
                  >
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border, #e5e7eb)' }}>{c.name}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border, #e5e7eb)' }}>{c.city}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border, #e5e7eb)' }}>{c.state}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border, #e5e7eb)', textAlign: 'right' }}>{c.total_orders}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border, #e5e7eb)', textAlign: 'right' }}>{formatCurrency(c.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        )}
      </div>
    </div>
  );
}
