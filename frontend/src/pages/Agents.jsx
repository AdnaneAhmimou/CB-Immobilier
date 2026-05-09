import { useState, useEffect } from 'react';
import { Users, Phone, Mail, CalendarClock, Edit2, X, Search } from 'lucide-react';

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

  const token   = localStorage.getItem('token');
  const me      = JSON.parse(localStorage.getItem('agent') || '{}');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchAgents(); }, []);

  const fetchAgents = () => {
    fetch('http://localhost:3000/api/agents', { headers })
      .then(r => r.json())
      .then(setAgents);
  };

  const openEdit = (agent) => {
    setEditAgent(agent);
    setFormData({ nom: agent.nom, telephone: agent.telephone, email: agent.email });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`http://localhost:3000/api/agents/${editAgent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(formData),
    });
    // If the edited agent is the current user, update localStorage
    if (editAgent.id === me.id) {
      localStorage.setItem('agent', JSON.stringify({ ...me, nom: formData.nom, email: formData.email }));
    }
    setEditAgent(null);
    fetchAgents();
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
          <div className="empty-state-desc">Les agents s'enregistrent via la page d'inscription.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
          {filtered.map((agent, i) => {
            const isMe    = agent.id === me.id;
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
