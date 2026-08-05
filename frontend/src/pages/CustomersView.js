import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import InsightsModal from '../components/InsightsModal';
import { getCustomers, getCustomerInsights } from '../utils/api';
import { useDateRange } from '../utils/DateRangeContext';
import { exportCsv } from '../utils/exportCsv';

function formatCurrency(value) {
  if (!value) return '$0';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const TD = { padding: '9px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' };

const COLUMNS = [
  { label: 'Name',        col: 'name',         align: 'left'  },
  { label: 'City',        col: 'city',         align: 'left'  },
  { label: 'State',       col: 'state',        align: 'left'  },
  { label: 'Orders',      col: 'total_orders', align: 'right' },
  { label: 'Total Spent', col: 'total_spent',  align: 'right' },
];

export default function CustomersView() {
  const { startDate, setStartDate, endDate, setEndDate } = useDateRange();
  const [customers,       setCustomers]       = useState([]);
  const [sortBy,          setSortBy]          = useState('total_spent');
  const [sortDir,         setSortDir]         = useState('desc');
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [insightsData,    setInsightsData]    = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      setCustomers(await getCustomers(startDate, endDate));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewInsights(customerId) {
    setInsightsLoading(true);
    try {
      setInsightsData(await getCustomerInsights(customerId, startDate, endDate));
    } catch (err) {
      alert(`Failed to load insights: ${err.message}`);
    } finally {
      setInsightsLoading(false);
    }
  }

  function handleSort(column) {
    if (sortBy === column) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  }

  const sorted = [...customers].sort((a, b) => {
    const va = a[sortBy], vb = b[sortBy];
    if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va;
    return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });

  const sortIcon = col => sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

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
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{customers.length} customers</span>
            <button className="btn-download" onClick={() => exportCsv(sorted, `customers_${startDate}_${endDate}`)} disabled={customers.length === 0}>
              ⬇ Download Customers
            </button>
          </span>
        </div>

        <ErrorBanner message={error} />
        {loading && <div className="loading">Loading customers…</div>}
        {!loading && !error && customers.length === 0 && <EmptyState />}

        {!loading && !error && customers.length > 0 && (
          <div className="card">
            <div className="section-title" style={{ marginBottom: 16 }}>Top Customers by Revenue</div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {COLUMNS.map(({ label, col, align }) => (
                    <th key={col} onClick={() => handleSort(col)} style={{
                      ...TD,
                      textAlign: align,
                      background: 'var(--bg-primary)',
                      borderBottom: '2px solid var(--border)',
                      cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
                      color: sortBy === col ? 'var(--accent)' : 'var(--text-primary)',
                    }}>
                      {label}{sortIcon(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => (
                  <tr
                    key={c.customer_id}
                    onClick={() => handleViewInsights(c.customer_id)}
                    style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)', cursor: insightsLoading ? 'wait' : 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-light)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)'; }}
                  >
                    <td style={TD}>{c.name}</td>
                    <td style={TD}>{c.city}</td>
                    <td style={TD}>{c.state}</td>
                    <td style={{ ...TD, textAlign: 'right' }}>{c.total_orders}</td>
                    <td style={{ ...TD, textAlign: 'right' }}>{formatCurrency(c.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InsightsModal isOpen={!!insightsData} onClose={() => setInsightsData(null)} data={insightsData} type="customer" />
    </div>
  );
}
