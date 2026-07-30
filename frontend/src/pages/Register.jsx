import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/cb_immobilier_logo.jpeg';
import { API_URL } from '../config';

function Register() {
  const [formData, setFormData] = useState({ nom: '', telephone: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la création du compte');

      const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      const loginData = await loginRes.json();
      localStorage.setItem('token', loginData.token);
      localStorage.setItem('agent', JSON.stringify(loginData.agent));
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-bg-circle" style={{ width: 400, height: 400, background: 'rgba(8,143,109,0.3)', bottom: -100, left: -100 }} />
        <div className="login-bg-circle" style={{ width: 250, height: 250, background: 'rgba(255,255,255,0.08)', top: -60, right: -60 }} />
        <div className="login-left-content">
          <img src={logo} alt="CB Immobilier" className="login-left-logo" />
          <h1 className="login-left-title">CB Immobilier</h1>
          <p className="login-left-sub">Créez votre compte agent pour accéder à la plateforme de gestion immobilière.</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-card">
          <h2 className="login-form-title">Créer un compte</h2>
          <p className="login-form-sub">Remplissez le formulaire pour accéder à la plateforme.</p>

          {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Nom complet</label>
              <input type="text" className="input-field" placeholder="Mohammed Alaoui" required onChange={set('nom')} />
            </div>
            <div className="input-group">
              <label className="input-label">Téléphone</label>
              <input type="text" className="input-field" placeholder="+212 6XX XXX XXX" required onChange={set('telephone')} />
            </div>
            <div className="input-group">
              <label className="input-label">Email Professionnel</label>
              <input type="email" className="input-field" placeholder="agent@cb-immobilier.com" required onChange={set('email')} />
            </div>
            <div className="input-group">
              <label className="input-label">Mot de passe</label>
              <input type="password" className="input-field" placeholder="••••••••" required onChange={set('password')} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
              {loading ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>

          <div className="login-form-footer">
            Déjà un compte ? <Link to="/login">Se connecter</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
