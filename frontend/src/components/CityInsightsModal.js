import React from 'react';
import './MonthlyInsightsModal.css'; // Reuse the same styles
import { useCurrency } from '../utils/CurrencyContext';

export default function CityInsightsModal({ isOpen, onClose, data }) {
  const { fmt, t } = useCurrency();
  if (!isOpen || !data) return null;

  const { cityName, summary, products, customers } = data;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="monthly-insights-modal">
        <div className="modal-header">
          <h2>{cityName} {t.insights}</h2>
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
            <h3>{t.top10City} {cityName}</h3>
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
                  {products.map((p, i) => (
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
            <h3>{t.top20City} {cityName}</h3>
            {customers && customers.length > 0 ? (
              <table className="insights-table">
                <thead>
                  <tr>
                    <th>{t.customer}</th>
                    <th align="right">{t.orderCount}</th>
                    <th align="right">{t.totalSpentCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => (
                    <tr key={i}>
                      <td>{c.name}</td>
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
        </div>
      </div>
    </>
  );
}
