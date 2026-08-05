import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../utils/ThemeContext';
import { useDateRange } from '../utils/DateRangeContext';
import { getSummary, getOrders, getCities, getProducts, getCustomers } from '../utils/api';
import { exportCsvCombined } from '../utils/exportCsv';
import ServiceStatus from './ServiceStatus';

const SVG_STYLE = { display: 'inline-block', verticalAlign: 'middle', marginRight: 5, flexShrink: 0, fill: 'currentColor' };

const CustomersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" style={SVG_STYLE}>
    <path d="M24.36,31h-0.72v-7.5c0-3.552-2.414-6.604-5.872-7.424c-0.15-0.036-0.261-0.163-0.275-0.316c-0.015-0.154,0.071-0.3,0.212-0.363c1.517-0.675,2.496-2.181,2.496-3.836c0-2.316-1.884-4.201-4.2-4.201S11.8,9.244,11.8,11.561c0,1.655,0.98,3.162,2.496,3.836c0.141,0.063,0.227,0.209,0.212,0.363c-0.014,0.153-0.125,0.281-0.275,0.316c-3.458,0.82-5.872,3.872-5.872,7.424V31H7.64v-7.5c0-3.592,2.257-6.718,5.585-7.879c-1.326-0.907-2.146-2.421-2.146-4.061c0-1.964,1.157-3.664,2.826-4.452C14.101,6.617,14.2,6.097,14.2,5.561c0-2.316-1.884-4.201-4.2-4.201S5.799,3.244,5.799,5.561c0,1.656,0.98,3.162,2.496,3.836C8.437,9.46,8.521,9.606,8.507,9.76c-0.014,0.153-0.125,0.281-0.275,0.316C4.774,10.896,2.36,13.948,2.36,17.5V25H1.64v-7.5c0-3.592,2.257-6.718,5.585-7.879C5.899,8.714,5.08,7.2,5.08,5.561c0-2.713,2.207-4.92,4.92-4.92s4.92,2.207,4.92,4.92c0,0.422-0.052,0.836-0.157,1.237c0.791-0.205,1.683-0.205,2.473,0c-0.104-0.401-0.157-0.815-0.157-1.237c0-2.713,2.208-4.92,4.921-4.92s4.921,2.207,4.921,4.92c0,1.64-0.82,3.154-2.146,4.061c3.329,1.161,5.586,4.287,5.586,7.879V25H29.64v-7.5c0-3.552-2.414-6.604-5.872-7.424c-0.15-0.036-0.261-0.163-0.275-0.316c-0.015-0.154,0.071-0.3,0.212-0.363C25.221,8.722,26.2,7.216,26.2,5.561c0-2.316-1.884-4.201-4.2-4.201s-4.2,1.884-4.2,4.201c0,0.536,0.099,1.056,0.295,1.548c1.669,0.789,2.826,2.488,2.826,4.452c0,1.64-0.82,3.154-2.146,4.061c3.329,1.161,5.586,4.287,5.586,7.879L24.36,31L24.36,31z"/>
    <rect style={{ fill: 'none' }} width="32" height="32"/>
  </svg>
);

const OrdersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" style={SVG_STYLE}>
    <path d="M30,31.3604H9c-.1987,0-.3599-.1611-.3599-.3604v-5.6475c-4.4434-.1895-8-3.8633-8-8.3525s3.5566-8.1631,8-8.3525V3c0-.1987.1611-.3599.3599-.3599h5.6401v-.6401c0-.1987.1611-.3599.3599-.3599h1.6401v-.6401c0-.1987.1611-.3599.3599-.3599h5c.1992,0,.3604.1611.3604.3599v.6401h1.6396c.1992,0,.3604.1611.3604.3599v.6401h5.6396c.1992,0,.3604.1611.3604.3599v28c0,.1992-.1611.3604-.3604.3604ZM9.3599,30.6396h20.2798V3.3599h-5.2793v.6401c0,.1987-.1611.3599-.3604.3599h-9c-.1987,0-.3599-.1611-.3599-.3599v-.6401h-5.2803v5.2876c4.4434.1895,8.0005,3.8633,8.0005,8.3525s-3.5571,8.1631-8.0005,8.3525v5.2871ZM9,9.3599c-4.2129,0-7.6401,3.4272-7.6401,7.6401s3.4272,7.6396,7.6401,7.6396,7.6401-3.4268,7.6401-7.6396-3.4272-7.6401-7.6401-7.6401ZM15.3599,3.6401h8.2798v-1.2803h-1.6396c-.1992,0-.3604-.1611-.3604-.3599v-.6401h-4.2793v.6401c0,.1987-.1611.3599-.3604.3599h-1.6401v1.2803ZM9.3599,21h-.7197v-3.6396h-3.6401v-.7202h3.6401v-3.6401h.7197v3.6401h3.6401v.7202h-3.6401v3.6396Z"/>
    <rect style={{ fill: 'none' }} width="32" height="32"/>
  </svg>
);

const ProductIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" style={SVG_STYLE}>
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

const LINKS = [
  { label: <><OrdersIcon />Orders</>,     path: '/orders'    },
  { label: <><ProductIcon />Products</>,  path: '/products'  },
  { label: <><CustomersIcon />Customers</>, path: '/customers' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggle, dark } = useTheme();
  const { startDate, endDate } = useDateRange();
  const [downloading,   setDownloading]   = useState(false);
  const [exportHovered, setExportHovered] = useState(false);
  const [themeHovered,  setThemeHovered]  = useState(false);
  const [hoveredNav,    setHoveredNav]    = useState(null);

  async function downloadAll() {
    setDownloading(true);
    try {
      const [summary, orders, cities, products, customers] = await Promise.all([
        getSummary(startDate, endDate),
        getOrders(startDate, endDate),
        getCities(startDate, endDate),
        getProducts(startDate, endDate),
        getCustomers(startDate, endDate),
      ]);
      exportCsvCombined([
        { label: 'SUMMARY',   rows: [summary]  },
        { label: 'ORDERS',    rows: orders      },
        { label: 'CITIES',    rows: cities      },
        { label: 'PRODUCTS',  rows: products    },
        { label: 'CUSTOMERS', rows: customers   },
      ], `novacart_export_${startDate}_${endDate}`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 56, background: '#000D1F',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
           onClick={() => navigate('/')}>
        <span style={{ fontSize: 20 }}>🛒</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>NovaCart</span>
        <span style={{ color: '#00BFA5', fontSize: 12, marginLeft: 4, fontWeight: 400 }}>Dashboard</span>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 8 }}>
        {LINKS.map(({ label, path }) => {
          const highlight = location.pathname === path || hoveredNav === path;
          return (
            <button key={path} onClick={() => navigate(path)}
              onMouseEnter={() => setHoveredNav(path)}
              onMouseLeave={() => setHoveredNav(null)}
              style={{
                background: highlight ? 'rgba(45,78,245,0.25)' : 'transparent',
                border: `1px solid ${highlight ? '#2D4EF5' : 'transparent'}`,
                color: '#C8E6F5', borderRadius: 6, padding: '4px 14px',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
                display: 'inline-flex', alignItems: 'center',
                transition: 'background 0.15s, border 0.15s',
              }}>
              {label}
            </button>
          );
        })}
      </div>

      {/* Right-side controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <ServiceStatus />
        <button
          onClick={downloadAll}
          disabled={downloading}
          title="Download all data as CSV files"
          onMouseEnter={() => setExportHovered(true)}
          onMouseLeave={() => setExportHovered(false)}
          style={{
            background: downloading ? 'rgba(45,78,245,0.3)' : exportHovered ? '#2D4EF5' : 'rgba(45,78,245,0.15)',
            border: '1px solid #2D4EF5',
            color: exportHovered ? '#fff' : '#C8E6F5',
            borderRadius: 6, padding: '4px 12px',
            cursor: downloading ? 'wait' : 'pointer', fontSize: 13, fontWeight: 600,
            fontFamily: 'inherit', transition: 'background 0.15s, color 0.15s',
          }}>
          {downloading ? '…' : '⬇ Export All'}
        </button>
        <button onClick={toggle} title={dark ? 'Light mode' : 'Dark mode'}
          onMouseEnter={() => setThemeHovered(true)}
          onMouseLeave={() => setThemeHovered(false)}
          style={{
            background: themeHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${themeHovered ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'}`,
            color: '#fff', borderRadius: 6, padding: '4px 10px',
            cursor: 'pointer', fontSize: 16, transition: 'background 0.15s, border 0.15s',
          }}>
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}
