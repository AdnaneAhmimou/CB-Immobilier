import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';

/**
 * Holds who is signed in. The session itself lives in an httpOnly cookie that this
 * code cannot read — /api/auth/me is what tells us whether that cookie is still good.
 */
export default function AuthProvider({ children }) {
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      setAgent(res.ok ? await res.json() : null);
    } catch {
      setAgent(null);          // offline or API down — treat as signed out
    } finally {
      setLoading(false);
    }
  }, []);

  // refresh() is async: the setState runs in the fetch callback, not synchronously in
  // the effect body. Asking the server whether our cookie is still valid is exactly the
  // external-system synchronisation effects are for, so the rule's warning misses here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, [refresh]);

  // Any request that comes back 401 (expired cookie, deleted account) drops us to
  // the login screen, wherever in the app it happened. See main.jsx.
  useEffect(() => {
    const onUnauthorized = () => setAgent(null);
    window.addEventListener('cb:unauthorized', onUnauthorized);
    return () => window.removeEventListener('cb:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    let res;
    try {
      res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      // The request never left, or never came back: no network, DNS, offline.
      throw new Error('Connexion au serveur impossible. Vérifiez votre connexion internet.');
    }

    // A server fault says nothing about the credentials, so it must not read as
    // "wrong password" — that sends people hunting for a mistake they did not make.
    if (res.status >= 500) {
      throw new Error('Le serveur est momentanément indisponible. Réessayez dans un instant.');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Erreur de connexion.');
    setAgent(data);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setAgent(null);
    }
  }, []);

  const value = useMemo(
    () => ({ agent, loading, login, logout, refresh }),
    [agent, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
