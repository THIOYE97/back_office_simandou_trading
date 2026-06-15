import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, TrendingUp } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { BrandLogo } from './BrandLogo';
import { colors } from '../theme';

const NAV = [
  { to: '/kyc', label: 'Dossiers KYC', icon: ShieldCheck },
  { to: '/offres', label: 'Offres & taux', icon: TrendingUp },
];

export function Layout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside
        style={{
          width: 248,
          background: colors.navy,
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
        }}
      >
        <div style={{ padding: '0 8px 24px' }}>
          <BrandLogo light />
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                background: isActive ? colors.brand : 'transparent',
                fontWeight: 600,
                fontSize: 14,
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 12,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            fontSize: 14,
            fontFamily: 'inherit',
          }}
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', padding: '32px 40px' }}>{children}</main>
    </div>
  );
}
