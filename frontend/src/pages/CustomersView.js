import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useCurrency } from '../utils/CurrencyContext';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import InsightsModal from '../components/InsightsModal';
import DateRangePicker from '../components/DateRangePicker';
import { getCustomers, getCustomerInsights } from '../utils/api';
import { useDateRange } from '../utils/DateRangeContext';
import { exportCsv } from '../utils/exportCsv';

const TD = { padding: '9px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' };

export default function CustomersView() {
  const { startDate, setStartDate, endDate, setEndDate } = useDateRange();
  const { fmt, t } = useCurrency();
  const [customers,       setCustomers]       = useState([]);
  const [sortBy,          setSortBy]          = useState('total_spent');
  const [sortDir,         setSortDir]         = useState('desc');
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [insightsData,    setInsightsData]    = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData(start = startDate, end = endDate) {
    setLoading(true);
    setError(null);
    try {
      setCustomers(await getCustomers(start, end));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewInsights(customerId, start = startDate, end = endDate) {
    setInsightsLoading(true);
    try {
      setInsightsData(await getCustomerInsights(customerId, start, end));
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

  const COLUMNS = [
    { label: t.name,       col: 'name',         align: 'left',  width: '30%'              },
    { label: t.city,       col: 'city',         align: 'left',  width: '20%', hide: true  },
    { label: t.state,      col: 'state',        align: 'left',  width: '10%', hide: true  },
    { label: t.orderCount, col: 'total_orders', align: 'right', width: '15%'              },
    { label: t.totalSpent, col: 'total_spent',  align: 'right', width: '25%'              },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="page">

        <div className="filter-bar">
          <DateRangePicker onApply={loadData} />
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{customers.length} {t.customers}</span>
            <button className="btn-download" onClick={() => exportCsv(sorted, `customers_${startDate}_${endDate}`)} disabled={customers.length === 0}>
              {t.downloadCustomers}
            </button>
          </span>
        </div>

        <ErrorBanner message={error} />
        {loading && <div className="loading">{t.loadingCustomers}</div>}
        {!loading && !error && customers.length === 0 && <EmptyState />}

        {!loading && !error && customers.length > 0 && (
          <div className="card">
            <div className="section-title" style={{ marginBottom: 16 }}>{t.topCustomers}</div>

            <div className="table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {COLUMNS.map(({ label, col, align, hide, width }) => (
                    <th key={col} onClick={() => handleSort(col)} className={hide ? 'col-hide-sm' : ''} style={{
                      ...TD,
                      textAlign: align,
                      width,
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
                    className={i % 2 === 0 ? 'row-even' : 'row-odd'}
                    style={{ cursor: insightsLoading ? 'wait' : 'pointer' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.0, 1.50)';
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
                    <td style={TD}>{c.name}</td>
                    <td style={TD} className="col-hide-sm">{c.city}</td>
                    <td style={TD} className="col-hide-sm">{c.state}</td>
                    <td style={{ ...TD, textAlign: 'right' }}>{c.total_orders}</td>
                    <td style={{ ...TD, textAlign: 'right' }}>{fmt(c.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      <InsightsModal isOpen={!!insightsData} onClose={() => setInsightsData(null)} data={insightsData} type="customer" />
    </div>
  );
}
