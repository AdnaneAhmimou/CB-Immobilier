import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Building2, Users, TrendingUp, ShieldCheck } from 'lucide-react';
import logo from '../assets/cb_logo_wide.png';
import { useAuth } from '../auth/AuthContext';
import PasswordField from '../components/PasswordField';

const features = [
  { icon: Building2, text: 'Gestion complète des biens immobiliers' },
  { icon: Users, text: 'Suivi clients, propriétaires et visites' },
  { icon: TrendingUp, text: 'Offres, négociations et transactions' },
  { icon: ShieldCheck, text: 'Accès sécurisé pour vos agents' },
];

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { agent, loading, login } = useAuth();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Already signed in (or just signed in): go where they were headed.
  if (!loading && agent) return <Navigate to={location.state?.from?.pathname || '/'} replace />;

  return (
    <div className="login-page">
      <div className="login-left">
        <div
          className="login-bg-circle"
          style={{ width: 400, height: 400, background: 'rgba(8,143,109,0.3)', bottom: -100, left: -100 }}
        />
        <div
          className="login-bg-circle"
          style={{ width: 250, height: 250, background: 'rgba(255,255,255,0.08)', top: -60, right: -60 }}
        />
        <div className="login-left-content">
          <img src={logo} alt="CB Immobilier" className="login-left-logo" />
          <h1 className="login-left-title">CB Immobilier</h1>
          <p className="login-left-sub">
            Plateforme de gestion immobilière pour votre agence — biens, clients, transactions et plus.
          </p>
          <div className="login-left-features">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="login-left-feature">
                <Icon />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-card">
          {/* Phones drop the brand panel entirely, so the logo comes back here. */}
          <img src={logo} alt="CB Immobilier" className="login-mobile-logo" />
          <h2 className="login-form-title">Bienvenue</h2>
          <p className="login-form-sub">Connectez-vous pour accéder à votre espace agent.</p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Email Professionnel</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@cb-immobilier.com"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Mot de passe</label>
              <PasswordField
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={submitting}
            >
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div className="login-form-footer">
            Accès réservé aux agents de l'agence.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
