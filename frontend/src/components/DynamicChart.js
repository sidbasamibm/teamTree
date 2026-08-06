import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTheme } from '../utils/ThemeContext';
import { useCurrency } from '../utils/CurrencyContext';

export default function DynamicChart({ data, chartType }) {
  const { dark } = useTheme();
  const { fmt: formatCurrency } = useCurrency();
  const tickColor = dark ? '#C8E6F5' : '#4A6080';

  if (!data || !chartType) return null;

  // Handle stats type (just display summary numbers)
  if (chartType === 'stats') {
    return (
      <div style={{
        marginTop: 12,
        padding: 12,
        background: 'var(--bg-primary)',
        borderRadius: 8,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 12,
      }}>
        {data.total_revenue !== undefined && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Revenue</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>
              {formatCurrency(data.total_revenue)}
            </div>
          </div>
        )}
        {data.total_orders !== undefined && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Orders</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>
              {data.total_orders.toLocaleString()}
            </div>
          </div>
        )}
        {data.unique_customers !== undefined && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Customers</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>
              {data.unique_customers.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Handle table type (simple data table)
  if (chartType === 'table' && Array.isArray(data)) {
    if (data.length === 0) {
      return <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>No data available</div>;
    }

    const keys = Object.keys(data[0]);

    return (
      <div style={{ marginTop: 12, overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          fontSize: 11,
          borderCollapse: 'collapse',
        }}>
          <thead>
            <tr>
              {keys.map(key => (
                <th key={key} style={{
                  textAlign: 'left',
                  padding: '6px 8px',
                  borderBottom: '1px solid var(--border)',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'capitalize',
                }}>
                  {key.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((row, i) => (
              <tr key={i} style={{
                background: i % 2 === 0 ? 'var(--bg-card)' : 'transparent',
              }}>
                {keys.map(key => (
                  <td key={key} style={{
                    padding: '6px 8px',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}>
                    {typeof row[key] === 'number' && key.includes('revenue')
                      ? formatCurrency(row[key])
                      : typeof row[key] === 'number'
                      ? row[key].toLocaleString()
                      : row[key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 10 && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
            Showing 10 of {data.length} rows
          </div>
        )}
      </div>
    );
  }

  // Determine data keys for chart
  if (!Array.isArray(data) || data.length === 0) {
    return <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>No data to display</div>;
  }

  const firstRow = data[0];
  const keys = Object.keys(firstRow);

  // Try to find appropriate keys
  const labelKey = keys.find(k => ['name', 'month_name', 'period', 'city', 'category'].includes(k)) || keys[0];
  const valueKey = keys.find(k => ['revenue', 'total_spent', 'amount'].includes(k)) || keys.find(k => typeof firstRow[k] === 'number') || keys[1];

  // Handle bar chart
  if (chartType === 'bar') {
    return (
      <div style={{ marginTop: 12 }}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.slice(0, 10)} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey={labelKey}
              tick={{ fontSize: 11, fill: tickColor }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tickFormatter={valueKey.includes('revenue') || valueKey.includes('spent') ? formatCurrency : undefined}
              tick={{ fontSize: 11, fill: tickColor }}
            />
            <Tooltip
              formatter={(v) => [
                valueKey.includes('revenue') || valueKey.includes('spent') ? formatCurrency(v) : v.toLocaleString(),
                valueKey.replace(/_/g, ' ')
              ]}
            />
            <Bar dataKey={valueKey} fill="var(--accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Handle line chart
  if (chartType === 'line') {
    return (
      <div style={{ marginTop: 12 }}>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={labelKey}
              tick={{ fontSize: 11, fill: tickColor }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tickFormatter={valueKey.includes('revenue') || valueKey.includes('spent') ? formatCurrency : undefined}
              tick={{ fontSize: 11, fill: tickColor }}
            />
            <Tooltip
              formatter={(v) => [
                valueKey.includes('revenue') || valueKey.includes('spent') ? formatCurrency(v) : v.toLocaleString(),
                valueKey.replace(/_/g, ' ')
              ]}
            />
            <Line
              type="monotone"
              dataKey={valueKey}
              stroke="var(--accent)"
              strokeWidth={2}
              dot={{ fill: 'var(--accent)', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Default fallback to table
  return <DynamicChart data={data} chartType="table" />;
}
