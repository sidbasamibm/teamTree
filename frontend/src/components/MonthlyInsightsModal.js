import React from 'react';
import './MonthlyInsightsModal.css';
import { useCurrency } from '../utils/CurrencyContext';

export default function MonthlyInsightsModal({ isOpen, onClose, data }) {
  const { fmt, t } = useCurrency();
  if (!isOpen || !data) return null;

  const { monthName, summary, products, customers, cities } = data;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="monthly-insights-modal">
        <div className="modal-header">
          <h2>{monthName} {t.insights}</h2>
          <button className="close-btn" onClick={onClose}>{t.close}</button>
        </div>

        <div className="modal-content">
          {/* Summary Stats */}
          <div className="insights-summary">
            <div className="stat-card">
              <div className="stat-label">{t.totalRevenue}</div>
              <div className="stat-value">{fmt(summary?.total_revenue)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{t.totalOrders}</div>
              <div className="stat-value">{summary?.total_orders?.toLocaleString() || '0'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{t.uniqueCustomers}</div>
              <div className="stat-value">{summary?.unique_customers?.toLocaleString() || '0'}</div>
            </div>
          </div>

          {/* Top Products */}
          <div className="insights-section">
            <h3>{t.top5Products}</h3>
            {products && products.length > 0 ? (
              <table className="insights-table">
                <thead>
                  <tr>
                    <th>{t.product}</th>
                    <th>{t.category}</th>
                    <th align="right">{t.units}</th>
                    <th align="right">{t.revenue}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 5).map((p, i) => (
                    <tr key={i}>
                      <td>{p.name}</td>
                      <td>{p.category}</td>
                      <td align="right">{p.units_sold?.toLocaleString()}</td>
                      <td align="right">{fmt(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">{t.noProductData}</div>
            )}
          </div>

          {/* Top Customers */}
          <div className="insights-section">
            <h3>{t.top5Customers}</h3>
            {customers && customers.length > 0 ? (
              <table className="insights-table">
                <thead>
                  <tr>
                    <th>{t.customer}</th>
                    <th>{t.location}</th>
                    <th align="right">{t.orderCount}</th>
                    <th align="right">{t.totalSpentCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 5).map((c, i) => (
                    <tr key={i}>
                      <td>{c.name}</td>
                      <td>{c.city}, {c.state}</td>
                      <td align="right">{c.total_orders}</td>
                      <td align="right">{fmt(c.total_spent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">{t.noCustomerData}</div>
            )}
          </div>

          {/* Top Cities */}
          <div className="insights-section">
            <h3>{t.top5Cities}</h3>
            {cities && cities.length > 0 ? (
              <table className="insights-table">
                <thead>
                  <tr>
                    <th>{t.city}</th>
                    <th>{t.state}</th>
                    <th align="right">{t.orderCount}</th>
                    <th align="right">{t.revenue}</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.slice(0, 5).map((c, i) => (
                    <tr key={i}>
                      <td>{c.city}</td>
                      <td>{c.state}</td>
                      <td align="right">{c.order_count?.toLocaleString()}</td>
                      <td align="right">{fmt(c.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">{t.noCityData}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
