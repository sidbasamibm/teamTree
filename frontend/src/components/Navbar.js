import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../utils/ThemeContext';
import { useDateRange } from '../utils/DateRangeContext';
import { useCurrency, CURRENCIES } from '../utils/CurrencyContext';
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

const GearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="18" height="18"
       style={{ display: 'inline-block', verticalAlign: 'middle', fill: 'currentColor' }}>
    <path d="M27,16.76c0-.25,0-.51,0-.76s0-.51,0-.77l1.92-1.68A2,2,0,0,0,29.3,11.4l-2.36-4a2,2,0,0,0-2.45-.84l-2.25.9a11.35,11.35,0,0,0-1.31-.77l-.34-2.38A2,2,0,0,0,18.59,2H13.41a2,2,0,0,0-2,1.71L11.07,6.1a11.23,11.23,0,0,0-1.31.77l-2.25-.9a2,2,0,0,0-2.45.84l-2.36,4a2,2,0,0,0,.44,2.45L5.06,15c0,.26,0,.51,0,.77s0,.51,0,.77L3.14,18.16a2,2,0,0,0-.44,2.45l2.36,4a2,2,0,0,0,2.45.84l2.25-.9a11.35,11.35,0,0,0,1.31.77l.34,2.38A2,2,0,0,0,13.41,30h5.18a2,2,0,0,0,2-1.71l.34-2.38a11.23,11.23,0,0,0,1.31-.77l2.25.9a2,2,0,0,0,2.45-.84l2.36-4a2,2,0,0,0-.44-2.45ZM25.21,24l-2.57-1a9,9,0,0,1-2.46,1.44L19.68,28H12.32l-.5-3.5A9,9,0,0,1,9.36,23l-2.57,1L4.43,20l2.19-1.93a8.86,8.86,0,0,1,0-4.06L4.43,12,6.79,8l2.57,1a9,9,0,0,1,2.46-1.44L12.32,4h7.36l.5,3.5A9,9,0,0,1,22.64,9l2.57-1L27.57,12l-2.19,1.93a8.86,8.86,0,0,1,0,4.06L27.57,20Z"/>
    <path d="M16,22a6,6,0,1,1,6-6A6,6,0,0,1,16,22Zm0-10a4,4,0,1,0,4,4A4,4,0,0,0,16,12Z"/>
    <rect style={{ fill: 'none' }} width="32" height="32"/>
  </svg>
);

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggle, dark } = useTheme();
  const { startDate, endDate } = useDateRange();
  const { currency, setCurrency, language, setLanguage, languages, t } = useCurrency();
  const [downloading,    setDownloading]    = useState(false);
  const [exportHovered,  setExportHovered]  = useState(false);
  const [hoveredNav,     setHoveredNav]     = useState(null);
  const [settingsOpen,   setSettingsOpen]   = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [currencyOpen,   setCurrencyOpen]   = useState(false);
  const settingsRef = useRef(null);

  // Close settings panel when clicking outside
  useEffect(() => {
    function handleOutside(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
        setCurrencyOpen(false);
        setCurrencySearch('');
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const currentLangLabel = languages.find(l => l.key === language)?.label ?? 'EN';

  const LINKS = [
    { label: <><OrdersIcon /><span className="nav-label">{t.orders}</span></>,     path: '/orders'    },
    { label: <><ProductIcon /><span className="nav-label">{t.products}</span></>,  path: '/products'  },
    { label: <><CustomersIcon /><span className="nav-label">{t.customers}</span></>, path: '/customers' },
  ];

  const filteredCurrencies = CURRENCIES.filter(c =>
    c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
    c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );

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

  /* ── shared panel styles ─────────────────────────────────────── */
  const panelStyle = {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    background: '#0A1628', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, width: 280, zIndex: 300,
    boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
    padding: '12px 0',
  };
  const sectionLabel = {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
    color: '#5A7FA0', textTransform: 'uppercase',
    padding: '4px 16px 6px',
  };
  const divider = {
    borderTop: '1px solid rgba(255,255,255,0.07)',
    margin: '8px 0',
  };

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 56, background: '#000D1F',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
           onClick={() => navigate('/')}>
        <span style={{ background: '#BBDEFB', borderRadius: '6px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center' }}>
          <img src="/helix2.png" alt="logo" width="30" height="40" style={{ display: 'block', mixBlendMode: 'multiply' }} />
        </span>
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
                border: `1px solid ${highlight ? '#051B3F' : 'transparent'}`,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ServiceStatus />

        {/* Export button */}
        <button
          onClick={downloadAll}
          disabled={downloading}
          title="Download all data as CSV files"
          onMouseEnter={() => setExportHovered(true)}
          onMouseLeave={() => setExportHovered(false)}
          style={{
            background: downloading ? 'rgba(45,78,245,0.3)' : exportHovered ? '#2D4EF5' : 'rgba(45,78,245,0.15)',
            border: '1px solid #051B3F',
            color: exportHovered ? '#fff' : '#C8E6F5',
            borderRadius: 6, padding: '4px 12px',
            cursor: downloading ? 'wait' : 'pointer', fontSize: 13, fontWeight: 600,
            fontFamily: 'inherit', transition: 'background 0.15s, color 0.15s',
            whiteSpace: 'nowrap',
          }}>
          {downloading ? '…' : <><span className="nav-label">{t.exportAll}</span></>}
        </button>

        {/* Settings dropdown */}
        <div ref={settingsRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setSettingsOpen(o => !o)}
            title="Settings"
            style={{
              background: settingsOpen ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${settingsOpen ? '#051B3F' : '#051B3F'}`,
              color: '#fff', borderRadius: 6, padding: '5px 10px',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'background 0.15s, border 0.15s',
            }}>
            <GearIcon />
          </button>

          {settingsOpen && (
            <div style={panelStyle}>

              {/* ── Dark mode ─────────────────────────── */}
              <div style={sectionLabel}>Appearance</div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 16px',
              }}>
                <span style={{ color: '#C8E6F5', fontSize: 13 }}>
                  {dark ? '☀️ Light mode' : '🌙 Dark mode'}
                </span>
                <button
                  onClick={toggle}
                  style={{
                    background: dark ? 'rgba(255,191,0,0.15)' : 'rgba(100,120,200,0.15)',
                    border: `1px solid ${dark ? '#FFD700' : '#7090D0'}`,
                    color: '#fff', borderRadius: 20, padding: '3px 12px',
                    cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                  }}>
                  {dark ? 'On' : 'Off'}
                </button>
              </div>

              <div style={divider} />

              {/* ── Language ──────────────────────────── */}
              <div style={sectionLabel}>Language</div>
              <div style={{ padding: '0 8px 4px' }}>
                {languages.map(l => (
                  <button
                    key={l.key}
                    onClick={() => setLanguage(l.key)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%',
                      background: l.key === language ? 'rgba(0,191,165,0.2)' : 'transparent',
                      border: 'none',
                      color: l.key === language ? '#00BFA5' : '#C8E6F5',
                      padding: '7px 8px', cursor: 'pointer', fontSize: 13,
                      borderRadius: 6, textAlign: 'left', fontFamily: 'inherit',
                    }}>
                    <span style={{ fontWeight: l.key === language ? 700 : 400 }}>{l.label}</span>
                    {l.key === language && (
                      <span style={{ fontSize: 11, color: '#00BFA5' }}>✓</span>
                    )}
                  </button>
                ))}
              </div>

              <div style={divider} />

              {/* ── Currency ──────────────────────────── */}
              <div style={sectionLabel}>Currency</div>
              <div style={{ padding: '0 8px 4px' }}>
                {/* Currency search */}
                {!currencyOpen ? (
                  <button
                    onClick={() => setCurrencyOpen(true)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%',
                      background: 'rgba(45,78,245,0.15)', border: '1px solid #2D4EF5',
                      color: '#C8E6F5', padding: '7px 8px', cursor: 'pointer',
                      fontSize: 13, borderRadius: 6, fontFamily: 'inherit',
                    }}>
                    <span style={{ fontWeight: 700 }}>{currency}</span>
                    <span style={{ fontSize: 11, color: '#8BA3BF' }}>
                      {CURRENCIES.find(c => c.code === currency)?.name}
                    </span>
                    <span style={{ color: '#8BA3BF' }}>▾</span>
                  </button>
                ) : (
                  <div>
                    <input
                      autoFocus
                      placeholder="Search currency…"
                      value={currencySearch}
                      onChange={e => setCurrencySearch(e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: '#111E35', border: '1px solid #2D4EF5',
                        borderRadius: 5, color: '#C8E6F5', padding: '6px 8px',
                        fontSize: 12, fontFamily: 'inherit', outline: 'none',
                        marginBottom: 4,
                      }}
                    />
                    <div style={{ overflowY: 'auto', maxHeight: 180 }}>
                      {filteredCurrencies.map(c => (
                        <button
                          key={c.code}
                          onClick={() => { setCurrency(c.code); setCurrencyOpen(false); setCurrencySearch(''); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%',
                            background: c.code === currency ? 'rgba(45,78,245,0.3)' : 'transparent',
                            border: 'none', color: c.code === currency ? '#fff' : '#C8E6F5',
                            padding: '6px 8px', cursor: 'pointer', fontSize: 12,
                            borderRadius: 4, textAlign: 'left', fontFamily: 'inherit',
                          }}>
                          <span style={{ fontWeight: 700, minWidth: 36 }}>{c.code}</span>
                          <span style={{ color: '#8BA3BF', fontSize: 11 }}>{c.name}</span>
                        </button>
                      ))}
                      {filteredCurrencies.length === 0 && (
                        <div style={{ padding: '8px', color: '#8BA3BF', fontSize: 12 }}>No results</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
