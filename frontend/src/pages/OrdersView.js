/**
 * OrdersView.js — Orders Overview page
 *
 * This page shows:
 *   - Stat cards: total revenue, total orders, unique customers
 *   - A bar/line chart of monthly revenue over time
 *   - A bar chart of revenue by city/state
 *   - A date range filter
 *
 * The data fetching is already wired up.
 * Your job: implement the UI — charts, stat cards, and layout.
 *
 * Useful libraries already installed:
 *   - recharts: BarChart, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Navbar from '../components/Navbar';
import { getSummary, getOrders, getCities } from '../utils/api';
import { useDateRange } from '../utils/DateRangeContext';

export default function OrdersView() {
  const { startDate, setStartDate, endDate, setEndDate } = useDateRange();
  const [summary,   setSummary]   = useState(null);
  const [orders,    setOrders]    = useState([]);
  const [cities,    setCities]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [s, o, c] = await Promise.all([
        getSummary(startDate, endDate),
        getOrders(startDate, endDate),
        getCities(startDate, endDate),
      ]);
      setSummary(s);
      setOrders(o);
      setCities(c);
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

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className="filter-bar">
          <label>From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <label>To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button className="btn-apply" onClick={loadData}>Apply</button>
        </div>

        {/* ── Error state ────────────────────────────────────────────────── */}
        {error && (
          <div style={{ color: '#000D1F', padding: 16, background: '#FFCDD2', borderRadius: 8, marginBottom: 16, borderLeft: '4px solid #FF6B6B' }}>
            Error: {error}
          </div>
        )}

        {/* ── Loading state ──────────────────────────────────────────────── */}
        {loading && <div className="loading">Loading orders data…</div>}

        {/* ── TODO: Build the UI here ────────────────────────────────────── */}
        {!loading && !error && orders.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
            No data found for the selected date range.
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <>
            {/*
              STEP 1 — Stat cards
              Show total_revenue, total_orders, unique_customers from summary.
              Hint: use the .stat-row and .stat-box CSS classes.
              Available data: summary.total_revenue, summary.total_orders, summary.unique_customers
            */}
            <div className="stat-row">
              <div className="stat-box">
                <div className="label">Total Revenue</div>
                <div className="value">
                  {summary ? `$${Number(summary.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                </div>
              </div>
              <div className="stat-box">
                <div className="label">Total Orders</div>
                <div className="value">
                  {summary ? Number(summary.total_orders).toLocaleString() : '—'}
                </div>
              </div>
              <div className="stat-box">
                <div className="label">Unique Customers</div>
                <div className="value">
                  {summary ? Number(summary.unique_customers).toLocaleString() : '—'}
                </div>
              </div>
            </div>

            {/*
              STEP 2 — Monthly revenue chart
              orders is an array of: { month, month_name, order_count, revenue }
              Use a BarChart or LineChart from recharts.
              Hint: XAxis dataKey="month_name", Bar dataKey="revenue"
            */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>Monthly Revenue</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={orders} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month_name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={v => [`$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#2D4EF5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/*
              STEP 3 — Revenue by city chart
              cities is an array of: { city, state, order_count, revenue }
              Use a horizontal BarChart (layout="vertical").
              Show top 10 cities only.
              Hint: .slice(0, 10) on cities array
            */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Revenue by City</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={cities.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 4, right: 32, left: 80, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="city" tick={{ fontSize: 12 }} width={76} />
                  <Tooltip formatter={v => [`$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#00BFA5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
