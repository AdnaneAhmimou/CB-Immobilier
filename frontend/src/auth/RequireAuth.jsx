import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';

/**
 * Gate for every page that is not the login screen. This is a convenience for the
 * person using the app, not the security boundary — the API rejects unauthenticated
 * requests on its own, so a tampered-with browser gets empty screens and 401s.
 */
export default function RequireAuth({ children }) {
  const { agent, loading } = useAuth();
  const location = useLocation();

  // Until /api/auth/me answers we don't know yet: showing the login screen here
  // would flash it in the face of someone who is perfectly well signed in.
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader2 size={28} className="spin" style={{ color: 'var(--color-muted)' }} />
      </div>
    );
  }

  if (!agent) return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
}
