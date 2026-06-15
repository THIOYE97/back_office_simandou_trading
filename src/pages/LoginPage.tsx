import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { BrandLogo } from '../components/BrandLogo';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password, totp || undefined);
      navigate('/kyc');
    } catch {
      setError('Identifiants invalides.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <form onSubmit={submit} className="card" style={{ width: 400, padding: 32 }}>
        <div style={{ marginBottom: 8 }}>
          <BrandLogo size={26} />
        </div>
        <h2 style={{ margin: '16px 0 4px', fontSize: 22 }}>Backoffice</h2>
        <p style={{ margin: '0 0 24px', color: 'var(--text-soft)', fontSize: 14 }}>
          Connexion réservée au personnel interne.
        </p>

        <div className="field">
          <label>Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="agent@simandou-trading.gn"
            autoFocus
          />
        </div>
        <div className="field">
          <label>Mot de passe</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Code 2FA (si activé)</label>
          <input
            className="input"
            inputMode="numeric"
            value={totp}
            onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="—"
          />
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}

        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          <LogIn size={18} />
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
