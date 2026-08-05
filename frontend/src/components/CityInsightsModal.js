import React from 'react';
import './MonthlyInsightsModal.css'; // Reuse the same styles

function formatCurrency(value) {
  if (!value) return '$0';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CityInsightsModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const { cityName, summary, products, customers } = data;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="monthly-insights-modal">
        <div className="modal-header">
          <h2>{cityName} Insights</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          {/* Summary Stats */}
          <div className="insights-summary">
            <div className="stat-card">
              <div className="stat-label">Revenue</div>
              <div className="stat-value">{formatCurrency(summary?.total_revenue)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Orders</div>
              <div className="stat-value">{summary?.total_orders?.toLocaleString() || '0'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Customers</div>
              <div className="stat-value">{summary?.unique_customers?.toLocaleString() || '0'}</div>
            </div>
          </div>

          {/* Top Products */}
          <div className="insights-section">
            <h3>Top 10 Products in {cityName}</h3>
            {products && products.length > 0 ? (
              <table className="insights-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th align="right">Units</th>
                    <th align="right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={i}>
                      <td>{p.name}</td>
                      <td>{p.category}</td>
                      <td align="right">{p.units_sold?.toLocaleString()}</td>
                      <td align="right">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">No product data available</div>
            )}
          </div>

          {/* Top Customers */}
          <div className="insights-section">
            <h3>Top 20 Customers from {cityName}</h3>
            {customers && customers.length > 0 ? (
              <table className="insights-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th align="right">Orders</th>
                    <th align="right">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => (
                    <tr key={i}>
                      <td>{c.name}</td>
                      <td align="right">{c.total_orders}</td>
                      <td align="right">{formatCurrency(c.total_spent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">No customer data available</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
