import { useState, useEffect } from 'react';
import { Plus, X, Search, CalendarClock, Trash2, Edit2 } from 'lucide-react';
import { API_URL } from '../config';

function Badge({ retour }) {
  const map = {
    'Intéressé': 'badge-green',
    'Pas intéressé': 'badge-red',
    'Veut négocier': 'badge-amber',
    'En attente': 'badge-gray'
  };
  return <span className={`badge ${map[retour] || 'badge-gray'}`}>{retour || 'En attente'}</span>;
}

const EMPTY_FORM = { bienId: '', clientId: '', date: '', retour: 'En attente' };

export default function Visites() {
  const [visites, setVisites]     = useState([]);
  const [biens, setBiens]         = useState([]);
  const [clients, setClients]     = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId]       = useState(null);
  const [search, setSearch]       = useState('');
  const [formData, setFormData]   = useState(EMPTY_FORM);


  useEffect(() => {
    fetchVisites();
    fetchBiens();
    fetchClients();
  }, []);

  const fetchVisites = async () => {
    const res = await fetch(`${API_URL}/api/visites`);
    if (res.ok) setVisites(await res.json());
  };
  const fetchBiens = async () => {
    const res = await fetch(`${API_URL}/api/biens`);
    if (res.ok) setBiens(await res.json());
  };
  const fetchClients = async () => {
    const res = await fetch(`${API_URL}/api/clients`);
    if (res.ok) setClients(await res.json());
  };

  const openAdd = () => {
    setEditId(null);
    setFormData({ ...EMPTY_FORM, bienId: biens[0]?.id || '', clientId: clients[0]?.id || '' });
    setIsModalOpen(true);
  };

  const openEdit = (v) => {
    setEditId(v.id);
    const dateLocal = v.date ? new Date(v.date).toISOString().slice(0, 16) : '';
    setFormData({ bienId: v.bienId, clientId: v.clientId, date: dateLocal, retour: v.retour || 'En attente' });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await fetch(`${API_URL}/api/visites/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } else {
      await fetch(`${API_URL}/api/visites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData }),
      });
    }
    closeModal();
    fetchVisites();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette visite ?')) return;
    await fetch(`${API_URL}/api/visites/${id}`, { method: 'DELETE' });
    fetchVisites();
  };

  const handleUpdateRetour = async (id, retour) => {
    await fetch(`${API_URL}/api/visites/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ retour }),
    });
    fetchVisites();
  };

  const filtered = visites.filter(v =>
    `${v.client?.nom} ${v.client?.prenom}`.toLowerCase().includes(search.toLowerCase()) ||
    v.bien?.localisation?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Visites</h1>
          <p className="page-subtitle">Planifiez et suivez les visites des clients.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Planifier une visite
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar" style={{ maxWidth: 400 }}>
          <Search className="search-bar-icon" size={16} />
          <input className="input-field" placeholder="Rechercher par client ou bien..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="card table-wrapper" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Bien</th>
                <th>Client</th>
                <th>Agent</th>
                <th>Retour</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td data-label="Date"><strong>{new Date(v.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</strong></td>
                  <td data-label="Bien">{v.bien?.type} à {v.bien?.localisation}</td>
                  <td data-label="Client">{v.client?.nom} {v.client?.prenom}</td>
                  <td data-label="Agent" style={{ color: 'var(--color-muted)', fontSize: 13 }}>{v.agent?.nom || '—'}</td>
                  <td data-label="Retour">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge retour={v.retour} />
                      <select
                        style={{ border: 'none', background: 'transparent', color: 'var(--color-primary)', fontSize: 12, cursor: 'pointer', outline: 'none' }}
                        value={v.retour || 'En attente'}
                        onChange={e => handleUpdateRetour(v.id, e.target.value)}
                      >
                        <option value="En attente" disabled>Modifier…</option>
                        <option value="Intéressé">Intéressé</option>
                        <option value="Pas intéressé">Pas intéressé</option>
                        <option value="Veut négocier">Veut négocier</option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', width: '100%' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(v)} title="Modifier">
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(v.id)} title="Supprimer" style={{ color: 'var(--color-danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state card">
          <div className="empty-state-icon"><CalendarClock size={32} /></div>
          <div className="empty-state-title">Aucune visite trouvée</div>
          <div className="empty-state-desc">Vous n'avez pas encore planifié de visites.</div>
          <button className="btn btn-primary" onClick={openAdd}>Planifier une visite</button>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editId ? 'Modifier la visite' : 'Planifier une visite'}</h2>
              <button className="modal-close" onClick={closeModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {biens.length === 0 || clients.length === 0 ? (
                  <div className="alert alert-error">Vous devez avoir au moins un bien et un client.</div>
                ) : (
                  <div className="form-grid">
                    <div className="input-group full">
                      <label className="input-label">Bien à visiter</label>
                      <select className="input-field" required value={formData.bienId} onChange={e => setFormData({ ...formData, bienId: e.target.value })}>
                        {biens.map(b => <option key={b.id} value={b.id}>{b.type} — {b.localisation}</option>)}
                      </select>
                    </div>
                    <div className="input-group full">
                      <label className="input-label">Client</label>
                      <select className="input-field" required value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })}>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.nom} {c.prenom} ({c.type})</option>)}
                      </select>
                    </div>
                    <div className="input-group full">
                      <label className="input-label">Date et Heure</label>
                      <input type="datetime-local" className="input-field" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                    </div>
                    {editId && (
                      <div className="input-group full">
                        <label className="input-label">Retour de visite</label>
                        <select className="input-field" value={formData.retour} onChange={e => setFormData({ ...formData, retour: e.target.value })}>
                          <option value="En attente">En attente</option>
                          <option value="Intéressé">Intéressé</option>
                          <option value="Pas intéressé">Pas intéressé</option>
                          <option value="Veut négocier">Veut négocier</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={biens.length === 0 || clients.length === 0}>
                  {editId ? 'Enregistrer' : 'Planifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
