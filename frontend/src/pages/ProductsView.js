import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import InsightsModal from '../components/InsightsModal';
import { getProducts, getProductInsights } from '../utils/api';
import { useDateRange } from '../utils/DateRangeContext';
import { exportCsv } from '../utils/exportCsv';

function formatCurrency(value) {
  if (!value) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000)    return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(2)}`;
}

const TD = { padding: '9px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' };

export default function ProductsView() {
  const { startDate, setStartDate, endDate, setEndDate } = useDateRange();
  const [products,        setProducts]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [insightsData,    setInsightsData]    = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      setProducts(await getProducts(startDate, endDate));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewInsights(productId) {
    setInsightsLoading(true);
    try {
      setInsightsData(await getProductInsights(productId, startDate, endDate));
    } catch (err) {
      alert(`Failed to load insights: ${err.message}`);
    } finally {
      setInsightsLoading(false);
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
          <button className="btn-download" style={{ marginLeft: 'auto' }} onClick={() => exportCsv(products, `products_${startDate}_${endDate}`)} disabled={products.length === 0}>
            ⬇ Download Products
          </button>
        </div>

        <ErrorBanner message={error} />
        {loading && <div className="loading">Loading products data…</div>}
        {!loading && !error && products.length === 0 && <EmptyState />}

        {!loading && !error && products.length > 0 && (
          <div className="grid-2">

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
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Product Details</div>
              <div className="table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    {[
                      { label: 'Name',       align: 'left'               },
                      { label: 'Category',   align: 'left',  hide: true  },
                      { label: 'Units Sold', align: 'right'              },
                      { label: 'Revenue',    align: 'right'              },
                    ].map(({ label, align, hide }) => (
                      <th key={label} className={hide ? 'col-hide-sm' : ''} style={{ ...TD, textAlign: align, background: 'var(--bg-primary)', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr
                      key={p.product_id}
                      onClick={() => handleViewInsights(p.product_id)}
                      style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)', cursor: insightsLoading ? 'wait' : 'pointer', transition: 'background 0.15s, transform 0.15s, box-shadow 0.15s', transform: 'scale(1)' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--accent-light)';
                        e.currentTarget.style.transform = 'scale(1.10, 1.50)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,191,165,0.15)';
                        e.currentTarget.style.zIndex = '1';
                        e.currentTarget.style.position = 'relative';
                        Array.from(e.currentTarget.cells).forEach(td => {
                          td.style.transition = 'transform 0.15s';
                          td.style.transform = 'scale(0.909, 0.667)';
                        });
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.zIndex = 'auto';
                        e.currentTarget.style.position = 'static';
                        Array.from(e.currentTarget.cells).forEach(td => {
                          td.style.transform = 'scale(1)';
                        });
                      }}
                    >
                      <td style={TD}>{p.name}</td>
                      <td style={TD} className="col-hide-sm">{p.category}</td>
                      <td style={{ ...TD, textAlign: 'right' }}>{p.units_sold.toLocaleString()}</td>
                      <td style={{ ...TD, textAlign: 'right' }}>{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

          </div>
        )}
      </div>

      <InsightsModal isOpen={!!insightsData} onClose={() => setInsightsData(null)} data={insightsData} type="product" />
    </div>
  );
}
