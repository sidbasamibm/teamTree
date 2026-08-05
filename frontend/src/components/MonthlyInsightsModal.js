import React from 'react';
import './MonthlyInsightsModal.css';

function formatCurrency(value) {
  if (!value) return '$0';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function MonthlyInsightsModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const { monthName, summary, products, customers, cities } = data;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="monthly-insights-modal">
        <div className="modal-header">
          <h2>{monthName} Insights</h2>
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
            <h3>Top 5 Products</h3>
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
                  {products.slice(0, 5).map((p, i) => (
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
            <h3>Top 5 Customers</h3>
            {customers && customers.length > 0 ? (
              <table className="insights-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Location</th>
                    <th align="right">Orders</th>
                    <th align="right">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 5).map((c, i) => (
                    <tr key={i}>
                      <td>{c.name}</td>
                      <td>{c.city}, {c.state}</td>
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

          {/* Top Cities */}
          <div className="insights-section">
            <h3>Top 5 Cities</h3>
            {cities && cities.length > 0 ? (
              <table className="insights-table">
                <thead>
                  <tr>
                    <th>City</th>
                    <th>State</th>
                    <th align="right">Orders</th>
                    <th align="right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.slice(0, 5).map((c, i) => (
                    <tr key={i}>
                      <td>{c.city}</td>
                      <td>{c.state}</td>
                      <td align="right">{c.order_count?.toLocaleString()}</td>
                      <td align="right">{formatCurrency(c.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">No city data available</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
