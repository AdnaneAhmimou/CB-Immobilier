import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, TrendingUp, ShieldCheck } from 'lucide-react';
import logo from '../assets/cb_immobilier_logo.jpeg';

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
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur de connexion');
      localStorage.setItem('token', data.token);
      localStorage.setItem('agent', JSON.stringify(data.agent));
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div className="login-form-footer">
            Pas encore de compte ?{' '}
            <Link to="/register">Créer un compte agent</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
