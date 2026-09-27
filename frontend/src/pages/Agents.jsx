import { useState, useEffect } from 'react';
import { Users, Phone, Mail, CalendarClock, Edit2, X, Search, Plus, KeyRound } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../auth/AuthContext';
import PasswordField from '../components/PasswordField';

function initials(nom) {
  return nom?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
}

const AVATAR_COLORS = [
  'var(--color-primary)', '#088F6D', '#7c3aed', '#b45309', '#0369a1', '#be185d',
];

export default function Agents() {
  const [agents, setAgents]         = useState([]);
  const [search, setSearch]         = useState('');
  const [editAgent, setEditAgent]   = useState(null);
  const [formData, setFormData]     = useState({ nom: '', telephone: '', email: '' });
  const [isAddOpen, setIsAddOpen]   = useState(false);
  const [newAgent, setNewAgent]     = useState({ nom: '', telephone: '', email: '', password: '' });
  const [addError, setAddError]     = useState('');
  const [isPwOpen, setIsPwOpen]     = useState(false);
  const [pwForm, setPwForm]         = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwError, setPwError]       = useState('');
  const [pwDone, setPwDone]         = useState('');
  const [saving, setSaving]         = useState(false);
  const { agent: me } = useAuth();

  useEffect(() => { fetchAgents(); }, []);

  const fetchAgents = () => {
    fetch(`${API_URL}/api/agents`)
      .then(r => r.json())
      .then(setAgents);
  };

  const openEdit = (agent) => {
    setEditAgent(agent);
    setFormData({ nom: agent.nom, telephone: agent.telephone, email: agent.email });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/agents/${editAgent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setEditAgent(null);
    fetchAgents();
  };

  // Creating an account goes through the same authenticated endpoint as everything
  // else — there is no public sign-up.
  const handleCreate = async (e) => {
    e.preventDefault();
    setAddError('');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Impossible de créer le compte.");
      setIsAddOpen(false);
      setNewAgent({ nom: '', telephone: '', email: '', password: '' });
      fetchAgents();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwDone('');
    if (pwForm.newPassword !== pwForm.confirm) return setPwError('Les deux mots de passe ne correspondent pas.');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Impossible de changer le mot de passe.');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setPwDone('Mot de passe mis à jour.');
    } catch (err) {
      setPwError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = agents.filter(a => {
    const q = search.toLowerCase();
    return !q || a.nom.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Équipe</h1>
          <p className="page-subtitle">Agents immobiliers enregistrés dans l'agence.</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => { setPwError(''); setPwDone(''); setIsPwOpen(true); }}>
            <KeyRound size={16} /> Mon mot de passe
          </button>
          <button className="btn btn-primary" onClick={() => { setAddError(''); setIsAddOpen(true); }}>
            <Plus size={16} /> Nouvel agent
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-bar" style={{ maxWidth: 360 }}>
          <Search className="search-bar-icon" size={16} />
          <input className="input-field" placeholder="Rechercher un agent…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon"><Users size={32} /></div>
          <div className="empty-state-title">Aucun agent</div>
          <div className="empty-state-desc">Ajoutez un agent avec le bouton « Nouvel agent ».</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
          {filtered.map((agent, i) => {
            const isMe    = agent.id === me?.id;
            const bgColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const visites = agent._count?.visites ?? 0;
            return (
              <div key={agent.id} className="card" style={{ position: 'relative' }}>
                {isMe && (
                  <span className="badge badge-emerald" style={{ position: 'absolute', top: 14, right: 14, fontSize: 10 }}>Moi</span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: bgColor, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, flexShrink: 0,
                  }}>
                    {initials(agent.nom)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{agent.nom}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Agent Immobilier</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <Mail size={13} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <Phone size={13} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                    <span>{agent.telephone}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--color-hairline)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-muted)' }}>
                    <CalendarClock size={13} />
                    <span><strong style={{ color: 'var(--color-ink)' }}>{visites}</strong> visite{visites !== 1 ? 's' : ''}</span>
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(agent)} title="Modifier">
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Change-my-password modal */}
      {isPwOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsPwOpen(false)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 className="modal-title">Mon mot de passe</h2>
              <button className="modal-close" onClick={() => setIsPwOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="modal-body">
                {pwError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{pwError}</div>}
                {pwDone  && <div className="alert alert-success" style={{ marginBottom: 16 }}>{pwDone}</div>}
                <div className="form-grid">
                  <div className="input-group full">
                    <label className="input-label">Mot de passe actuel</label>
                    <PasswordField required value={pwForm.currentPassword}
                      onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                      autoComplete="current-password" />
                  </div>
                  <div className="input-group full">
                    <label className="input-label">Nouveau mot de passe</label>
                    <PasswordField required minLength={10} value={pwForm.newPassword}
                      onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      autoComplete="new-password"
                      placeholder="10 caractères minimum" />
                  </div>
                  <div className="input-group full">
                    <label className="input-label">Confirmer</label>
                    <PasswordField required minLength={10} value={pwForm.confirm}
                      onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                      autoComplete="new-password" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsPwOpen(false)}>Fermer</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Changer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add-agent modal — creates a login for a colleague */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsAddOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Nouvel agent</h2>
              <button className="modal-close" onClick={() => setIsAddOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {addError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{addError}</div>}
                <div className="form-grid">
                  <div className="input-group full">
                    <label className="input-label">Nom complet</label>
                    <input type="text" className="input-field" required value={newAgent.nom}
                      onChange={e => setNewAgent({ ...newAgent, nom: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Téléphone</label>
                    <input type="text" className="input-field" value={newAgent.telephone}
                      onChange={e => setNewAgent({ ...newAgent, telephone: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email (identifiant)</label>
                    <input type="email" className="input-field" required value={newAgent.email}
                      onChange={e => setNewAgent({ ...newAgent, email: e.target.value })} />
                  </div>
                  <div className="input-group full">
                    <label className="input-label">Mot de passe provisoire</label>
                    <PasswordField required minLength={10} value={newAgent.password}
                      onChange={e => setNewAgent({ ...newAgent, password: e.target.value })}
                      autoComplete="new-password"
                      placeholder="10 caractères minimum" />
                    <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 6 }}>
                      Communiquez-le à l'agent, qui pourra le changer depuis son profil.
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Création…' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editAgent && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditAgent(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Modifier le profil</h2>
              <button className="modal-close" onClick={() => setEditAgent(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group full">
                    <label className="input-label">Nom complet</label>
                    <input type="text" className="input-field" required value={formData.nom}
                      onChange={e => setFormData({ ...formData, nom: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Téléphone</label>
                    <input type="text" className="input-field" required value={formData.telephone}
                      onChange={e => setFormData({ ...formData, telephone: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <input type="email" className="input-field" required value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditAgent(null)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
