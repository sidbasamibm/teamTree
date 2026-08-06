import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import Navbar from '../components/Navbar';
import { useTheme } from '../utils/ThemeContext';
import { useCurrency } from '../utils/CurrencyContext';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import InsightsModal from '../components/InsightsModal';
import DateRangePicker from '../components/DateRangePicker';
import { getProducts, getProductInsights } from '../utils/api';
import { useDateRange } from '../utils/DateRangeContext';
import { exportCsv } from '../utils/exportCsv';

const TD = { padding: '9px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' };

export default function ProductsView() {
  const { startDate, setStartDate, endDate, setEndDate } = useDateRange();
  const { dark } = useTheme();
  const { fmt, fmtShort, t } = useCurrency();
  const tickColor = dark ? '#C8E6F5' : '#4A6080';
  const [products,        setProducts]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [insightsData,    setInsightsData]    = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData(start = startDate, end = endDate) {
    setLoading(true);
    setError(null);
    try {
      setProducts(await getProducts(start, end));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewInsights(productId, start = startDate, end = endDate) {
    setInsightsLoading(true);
    try {
      setInsightsData(await getProductInsights(productId, start, end));
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
          <DateRangePicker onApply={loadData} />
          <button className="btn-download" style={{ marginLeft: 'auto' }} onClick={() => exportCsv(products, `products_${startDate}_${endDate}`)} disabled={products.length === 0}>
            {t.downloadProducts}
          </button>
        </div>

        <ErrorBanner message={error} />
        {loading && <div className="loading">{t.loadingProducts}</div>}
        {!loading && !error && products.length === 0 && <EmptyState />}

        {!loading && !error && products.length > 0 && (
          <div className="grid-2">

            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>{t.top10Products}</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  layout="vertical"
                  data={[...products]
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 10)
                    .map(p => ({ ...p, name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name }))}
                  margin={{ top: 0, right: 80, left: 8, bottom: 0 }}
                >
                  <XAxis type="number" tickFormatter={v => fmtShort(v)} tick={{ fontSize: 12, fill: tickColor }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fill: tickColor }} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Bar dataKey="revenue" fill="var(--accent)" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="revenue" position="right" formatter={fmtShort} style={{ fontSize: 11, fill: tickColor, fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>{t.productDetails}</div>
              <div className="table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    {[
                      { label: t.name,      align: 'left'               },
                      { label: t.category,  align: 'left',  hide: true  },
                      { label: t.unitsSold, align: 'right'              },
                      { label: t.revenue,   align: 'right'              },
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
                      className={i % 2 === 0 ? 'row-even' : 'row-odd'}
                      style={{ cursor: insightsLoading ? 'wait' : 'pointer' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.10, 1.50)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,191,165,0.15)';
                        e.currentTarget.style.zIndex = '1';
                        e.currentTarget.style.position = 'relative';
                        Array.from(e.currentTarget.cells).forEach(td => {
                          td.style.transform = 'scale(0.909, 0.667)';
                        });
                      }}
                      onMouseLeave={e => {
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
                      <td style={{ ...TD, textAlign: 'right' }}>{fmt(p.revenue)}</td>
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
