import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../utils/ThemeContext';
import ServiceStatus from './ServiceStatus';

const ProductIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"
       width="20" height="20"
       style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 5, flexShrink: 0, fill: 'currentColor' }}>
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

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggle } = useTheme();

  const links = [
    { label: '📊 Orders',    path: '/orders'    },
    { label: <><ProductIcon />Products</>,  path: '/products'  },
    { label: '👤 Customers', path: '/customers' },
  ];

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 56,
      background: dark ? '#000D1F' : '#000D1F',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
           onClick={() => navigate('/')}>
        <span style={{ fontSize: 20 }}>🛒</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>NovaCart</span>
        <span style={{ color: '#00BFA5', fontSize: 12, marginLeft: 4, fontWeight: 400 }}>Dashboard</span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {links.map(({ label, path }) => {
          const active = location.pathname === path;
          return (
            <button key={path} onClick={() => navigate(path)}
              style={{
                background: active ? 'rgba(45,78,245,0.15)' : 'transparent',
                border: active ? '1px solid #2D4EF5' : '1px solid transparent',
                color: active ? '#C8E6F5' : '#A8E6CF',
                borderRadius: 6, padding: '4px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                display: 'inline-flex', alignItems: 'center',
              }}>
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <ServiceStatus />
        <button onClick={toggle} title={dark ? 'Light mode' : 'Dark mode'}
          style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 16,
          }}>
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}
