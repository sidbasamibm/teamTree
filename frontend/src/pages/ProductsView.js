/**
 * ProductsView.js — Product Performance page
 *
 * This page shows:
 *   - A bar chart of top 10 products by revenue
 *   - A table with product name, category, units sold, and revenue
 *   - A date range filter
 *
 * The data fetching is already wired up.
 * Your job: implement the UI.
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';
import { getProducts } from '../utils/api';
import { useDateRange } from '../utils/DateRangeContext';

// Format currency helper
function formatCurrency(value) {
  if (!value) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000)    return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(2)}`;
}

export default function ProductsView() {
  const { startDate, setStartDate, endDate, setEndDate } = useDateRange();
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(startDate, endDate);
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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
        </div>

        {error && (
          <div style={{ color: '#C62828', padding: 16, background: '#FFEBEE', borderRadius: 8, marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        {loading && <div className="loading">Loading products data…</div>}

        {!loading && !error && products.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
            No data found for the selected date range.
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid-2">

            {/*
              STEP 1 — Top products bar chart
              products is: [{ product_id, name, category, units_sold, revenue }]
              Use a horizontal BarChart (layout="vertical").
              XAxis type="number", YAxis type="category" dataKey="name"
              Hint: truncate long product names to 20 chars
            */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Top 10 Products by Revenue</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  layout="vertical"
                  data={[...products]
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 10)
                    .map(p => ({ ...p, name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name }))}
                  margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
                >
                  <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Product Details</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    {[
                      { label: 'Name',       align: 'left'  },
                      { label: 'Category',   align: 'left'  },
                      { label: 'Units Sold', align: 'right' },
                      { label: 'Revenue',    align: 'right' },
                    ].map(({ label, align }) => (
                      <th
                        key={label}
                        style={{
                          padding: '10px 12px',
                          textAlign: align,
                          background: 'var(--bg-primary)',
                          borderBottom: '2px solid var(--border)',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr
                      key={p.product_id}
                      style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)' }}
                    >
                      <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)' }}>{p.name}</td>
                      <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)' }}>{p.category}</td>
                      <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>{p.units_sold.toLocaleString()}</td>
                      <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
