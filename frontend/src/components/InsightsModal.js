/**
 * InsightsModal.js — Reusable modal for displaying product/customer insights
 *
 * Features:
 * - Full-screen overlay modal
 * - Line chart for trends
 * - Summary statistics cards
 * - Top items tables
 * - Close on ESC key or backdrop click
 */

import React, { useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useTheme } from '../utils/ThemeContext';

const CustomersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"
       width="24" height="24"
       style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 8, flexShrink: 0, fill: 'currentColor' }}>
    <path d="M24.36,31h-0.72v-7.5c0-3.552-2.414-6.604-5.872-7.424c-0.15-0.036-0.261-0.163-0.275-0.316c-0.015-0.154,0.071-0.3,0.212-0.363c1.517-0.675,2.496-2.181,2.496-3.836c0-2.316-1.884-4.201-4.2-4.201S11.8,9.244,11.8,11.561c0,1.655,0.98,3.162,2.496,3.836c0.141,0.063,0.227,0.209,0.212,0.363c-0.014,0.153-0.125,0.281-0.275,0.316c-3.458,0.82-5.872,3.872-5.872,7.424V31H7.64v-7.5c0-3.592,2.257-6.718,5.585-7.879c-1.326-0.907-2.146-2.421-2.146-4.061c0-1.964,1.157-3.664,2.826-4.452C14.101,6.617,14.2,6.097,14.2,5.561c0-2.316-1.884-4.201-4.2-4.201S5.799,3.244,5.799,5.561c0,1.656,0.98,3.162,2.496,3.836C8.437,9.46,8.521,9.606,8.507,9.76c-0.014,0.153-0.125,0.281-0.275,0.316C4.774,10.896,2.36,13.948,2.36,17.5V25H1.64v-7.5c0-3.592,2.257-6.718,5.585-7.879C5.899,8.714,5.08,7.2,5.08,5.561c0-2.713,2.207-4.92,4.92-4.92s4.92,2.207,4.92,4.92c0,0.422-0.052,0.836-0.157,1.237c0.791-0.205,1.683-0.205,2.473,0c-0.104-0.401-0.157-0.815-0.157-1.237c0-2.713,2.208-4.92,4.921-4.92s4.921,2.207,4.921,4.92c0,1.64-0.82,3.154-2.146,4.061c3.329,1.161,5.586,4.287,5.586,7.879V25H29.64v-7.5c0-3.552-2.414-6.604-5.872-7.424c-0.15-0.036-0.261-0.163-0.275-0.316c-0.015-0.154,0.071-0.3,0.212-0.363C25.221,8.722,26.2,7.216,26.2,5.561c0-2.316-1.884-4.201-4.2-4.201s-4.2,1.884-4.2,4.201c0,0.536,0.099,1.056,0.295,1.548c1.669,0.789,2.826,2.488,2.826,4.452c0,1.64-0.82,3.154-2.146,4.061c3.329,1.161,5.586,4.287,5.586,7.879L24.36,31L24.36,31z"/>
    <rect style={{ fill: 'none' }} width="32" height="32"/>
  </svg>
);

const ProductIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"
       width="24" height="24"
       style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 8, flexShrink: 0, fill: 'currentColor' }}>
    <path d="M16,30.86c-0.062,0-0.125-0.017-0.18-0.049l-8.347-4.825l0.36-0.623L16,30.084l9.689-5.602
      c-0.032-0.156-0.05-0.317-0.05-0.482c0-1.302,1.059-2.36,2.36-2.36s2.36,1.059,2.36,2.36s-1.059,2.36-2.36,2.36
      c-0.878,0-1.646-0.482-2.052-1.196l-9.768,5.647C16.125,30.844,16.062,30.86,16,30.86z M28,22.36c-0.904,0-1.64,0.735-1.64,1.64
      s0.735,1.64,1.64,1.64s1.64-0.735,1.64-1.64S28.904,22.36,28,22.36z M4,26.36c-1.301,0-2.36-1.059-2.36-2.36
      c0-1.179,0.869-2.159,2-2.333V9.688c0-0.128,0.068-0.248,0.18-0.312l8.424-4.871l0.36,0.623L4.36,9.895v11.772
      c1.131,0.174,2,1.154,2,2.333C6.36,25.302,5.301,26.36,4,26.36z M4,22.36c-0.904,0-1.64,0.735-1.64,1.64S3.096,25.64,4,25.64
      S5.64,24.904,5.64,24S4.904,22.36,4,22.36z M16,26.36c-0.062,0-0.125-0.017-0.18-0.049l-8-4.625c-0.111-0.064-0.18-0.183-0.18-0.312
      v-9.25c0-0.128,0.068-0.248,0.18-0.312l8-4.625c0.111-0.064,0.249-0.064,0.36,0l8,4.625c0.11,0.064,0.18,0.183,0.18,0.312v9.25
      c0,0.129-0.069,0.247-0.18,0.312l-8,4.625C16.125,26.344,16.062,26.36,16,26.36z M8.36,21.167L16,25.584l7.64-4.417v-8.834L16,7.916
      l-7.64,4.417C8.36,12.333,8.36,21.167,8.36,21.167z M28.36,20h-0.72V9.895l-9.673-5.592C17.544,4.939,16.82,5.36,16,5.36
      c-1.301,0-2.36-1.059-2.36-2.36S14.699,0.64,16,0.64c1.302,0,2.36,1.059,2.36,2.36c0,0.224-0.032,0.441-0.091,0.646l9.911,5.729
      c0.11,0.064,0.18,0.183,0.18,0.312V20z M16,1.36c-0.904,0-1.64,0.736-1.64,1.64S15.096,4.64,16,4.64c0.904,0,1.64-0.736,1.64-1.64
      S16.904,1.36,16,1.36z"/>
    <rect style={{ fill: 'none' }} width="32" height="32"/>
  </svg>
);

function formatCurrency(value) {
  if (!value) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000)    return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(2)}`;
}

export default function InsightsModal({ isOpen, onClose, data, type }) {
  const { dark } = useTheme();
  const tickColor = dark ? '#C8E6F5' : '#4A6080';
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const isProduct = type === 'product';
  const entity = isProduct ? data.product : data.customer;
  const summary = data.summary;
  const trend = data.monthly_trend;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 12,
          maxWidth: 1100,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 32,
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                {isProduct ? <ProductIcon /> : <CustomersIcon />}
                {isProduct ? 'Product Insights' : 'Customer Insights'}
              </h2>
              <div style={{ fontSize: 18, color: 'var(--text-primary)', marginTop: 8, fontWeight: 500 }}>
                {entity.name}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
                {isProduct
                  ? `Category: ${entity.category} • Price: ${formatCurrency(entity.price)}`
                  : `${entity.city}, ${entity.state} • ${entity.email}`
                }
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 28,
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Total Revenue</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--accent)' }}>
              {formatCurrency(summary.total_revenue || summary.total_spent)}
            </div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Total Orders</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>
              {summary.total_orders?.toLocaleString()}
            </div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              {isProduct ? 'Units Sold' : 'Items Purchased'}
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>
              {(summary.total_units || summary.total_items)?.toLocaleString()}
            </div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Avg Order Value</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatCurrency(summary.avg_order_value)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Trend Chart */}
          <div className="card" style={{ padding: 20 }}>
            <div className="section-title" style={{ marginBottom: 16 }}>
              {isProduct ? 'Revenue Trend' : 'Spending Trend'}
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="month_name" tick={{ fontSize: 11, fill: tickColor }} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: tickColor }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Line
                  type="monotone"
                  dataKey={isProduct ? 'revenue' : 'total_spent'}
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--accent)', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown (customer only) or Units Chart */}
          {!isProduct && data.category_breakdown && (
            <div className="card" style={{ padding: 20 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>Category Preferences</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.category_breakdown} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: tickColor }} />
                  <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: tickColor }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="total_spent" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {isProduct && (
            <div className="card" style={{ padding: 20 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>Units Sold Trend</div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <XAxis dataKey="month_name" tick={{ fontSize: 11, fill: tickColor }} />
                  <YAxis tick={{ fontSize: 11, fill: tickColor }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="units_sold"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={{ fill: '#82ca9d', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Items Table */}
        <div className="card" style={{ padding: 20, marginTop: 24 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>
            {isProduct ? 'Top 5 Customers' : 'Top 5 Products Purchased'}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {isProduct ? (
                  <>
                    <th style={headerStyle}>Customer</th>
                    <th style={headerStyle}>Location</th>
                    <th style={{ ...headerStyle, textAlign: 'right' }}>Orders</th>
                    <th style={{ ...headerStyle, textAlign: 'right' }}>Units</th>
                    <th style={{ ...headerStyle, textAlign: 'right' }}>Total Spent</th>
                  </>
                ) : (
                  <>
                    <th style={headerStyle}>Product</th>
                    <th style={headerStyle}>Category</th>
                    <th style={{ ...headerStyle, textAlign: 'right' }}>Orders</th>
                    <th style={{ ...headerStyle, textAlign: 'right' }}>Units</th>
                    <th style={{ ...headerStyle, textAlign: 'right' }}>Total Spent</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {(isProduct ? data.top_customers : data.top_products).map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-card)' }}>
                  {isProduct ? (
                    <>
                      <td style={cellStyle}>{item.name}</td>
                      <td style={cellStyle}>{item.city}, {item.state}</td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>{item.order_count}</td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>{item.units_purchased}</td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>{formatCurrency(item.total_spent)}</td>
                    </>
                  ) : (
                    <>
                      <td style={cellStyle}>{item.name}</td>
                      <td style={cellStyle}>{item.category}</td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>{item.order_count}</td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>{item.units_purchased}</td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>{formatCurrency(item.total_spent)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Customer-specific date range info */}
        {!isProduct && summary.first_order_date && (
          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
            Customer since {new Date(summary.first_order_date).toLocaleDateString()} •
            Last order: {new Date(summary.last_order_date).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}

const headerStyle = {
  padding: '10px 12px',
  textAlign: 'left',
  background: 'var(--bg-primary)',
  borderBottom: '2px solid var(--border)',
  color: 'var(--text-primary)',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
};

const cellStyle = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--border)',
  color: 'var(--text-primary)',
};
