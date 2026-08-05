import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Navbar from '../components/Navbar';
import { useTheme } from '../utils/ThemeContext';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import DateRangePicker from '../components/DateRangePicker';
import { getSummary, getOrders, getCities } from '../utils/api';
import { useDateRange } from '../utils/DateRangeContext';
import { exportCsv } from '../utils/exportCsv';

const fmtCurrency = v => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function OrdersView() {
  const { startDate, setStartDate, endDate, setEndDate } = useDateRange();
  const { dark } = useTheme();
  const tickColor = dark ? '#C8E6F5' : '#4A6080';
  const [summary, setSummary] = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [cities,  setCities]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData(start = startDate, end = endDate) {
    setLoading(true);
    setError(null);
    try {
      const [s, o, c] = await Promise.all([
        getSummary(start, end),
        getOrders(start, end),
        getCities(start, end),
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

        <div className="filter-bar">
          <DateRangePicker onApply={loadData} />
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn-download" onClick={() => exportCsv(orders, `orders_${startDate}_${endDate}`)} disabled={orders.length === 0}>
              ⬇ Monthly Orders
            </button>
            <button className="btn-download" onClick={() => exportCsv(cities, `cities_${startDate}_${endDate}`)} disabled={cities.length === 0}>
              ⬇ Cities
            </button>
          </span>
        </div>

        <ErrorBanner message={error} />
        {loading && <div className="loading">Loading orders data…</div>}
        {!loading && !error && orders.length === 0 && <EmptyState />}

        {!loading && !error && orders.length > 0 && (
          <>
            <div className="stat-row">
              <div className="stat-box">
                <div className="label">Total Revenue</div>
                <div className="value">{summary ? fmtCurrency(summary.total_revenue) : '—'}</div>
              </div>
              <div className="stat-box">
                <div className="label">Total Orders</div>
                <div className="value">{summary ? Number(summary.total_orders).toLocaleString() : '—'}</div>
              </div>
              <div className="stat-box">
                <div className="label">Unique Customers</div>
                <div className="value">{summary ? Number(summary.unique_customers).toLocaleString() : '—'}</div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>Monthly Revenue</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={orders} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month_name" tick={{ fontSize: 12, fill: tickColor }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: tickColor }} />
                  <Tooltip formatter={v => [fmtCurrency(v), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#2D4EF5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Revenue by City</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={cities.slice(0, 10)} layout="vertical" margin={{ top: 4, right: 32, left: 80, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: tickColor }} />
                  <YAxis type="category" dataKey="city" tick={{ fontSize: 12, fill: tickColor }} width={76} />
                  <Tooltip formatter={v => [fmtCurrency(v), 'Revenue']} />
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
