import { useState, useEffect } from 'react';
import { Plus, X, Search, TrendingUp, Trash2, Edit2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Badge({ statut }) {
  const map = { 'En cours': 'badge-amber', 'Acceptée': 'badge-green', 'Refusée': 'badge-red' };
  return <span className={`badge ${map[statut] || 'badge-gray'}`}>{statut}</span>;
}

const EMPTY_FORM = { bienId: '', clientId: '', montant: '', statut: 'En cours' };

export default function Offres() {
  const [offres, setOffres]       = useState([]);
  const [biens, setBiens]         = useState([]);
  const [clients, setClients]     = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId]       = useState(null);
  const [search, setSearch]       = useState('');
  const [formData, setFormData]   = useState(EMPTY_FORM);

  const navigate = useNavigate();

  useEffect(() => {
    fetchOffres();
    fetchBiens();
    fetchClients();
  }, []);

  const fetchOffres = async () => {
    const res = await fetch('http://localhost:3001/api/offres');
    if (res.ok) setOffres(await res.json());
  };
  const fetchBiens = async () => {
    const res = await fetch('http://localhost:3001/api/biens');
    if (res.ok) setBiens(await res.json());
  };
  const fetchClients = async () => {
    const res = await fetch('http://localhost:3001/api/clients');
    if (res.ok) setClients(await res.json());
  };

  const openAdd = () => {
    setEditId(null);
    setFormData({ ...EMPTY_FORM, bienId: biens[0]?.id || '', clientId: clients[0]?.id || '' });
    setIsModalOpen(true);
  };

  const openEdit = (o) => {
    setEditId(o.id);
    setFormData({ bienId: o.bienId, clientId: o.clientId, montant: o.montant, statut: o.statut });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await fetch(`http://localhost:3001/api/offres/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } else {
      await fetch('http://localhost:3001/api/offres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }
    closeModal();
    fetchOffres();
  };

  const handleConvertToTransaction = async (o) => {
    if (!window.confirm(`Créer une transaction pour ${o.bien?.type} — ${o.bien?.localisation} à ${o.montant?.toLocaleString('fr-FR')} MAD ?`)) return;
    await fetch('http://localhost:3001/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bienId: o.bienId,
        clientId: o.clientId,
        type: o.bien?.transactionType || 'Vente',
        prixFinal: o.montant,
        dateSignature: new Date().toISOString(),
      }),
    });
    navigate('/transactions');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette offre ?')) return;
    await fetch(`http://localhost:3001/api/offres/${id}`, { method: 'DELETE' });
    fetchOffres();
  };

  const handleUpdateStatut = async (id, statut) => {
    await fetch(`http://localhost:3001/api/offres/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    });
    fetchOffres();
  };

  const filtered = offres.filter(o =>
    `${o.client?.nom} ${o.client?.prenom}`.toLowerCase().includes(search.toLowerCase()) ||
    o.bien?.localisation?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Offres & Négociations</h1>
          <p className="page-subtitle">Gérez les offres soumises par les clients.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Nouvelle Offre
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
                <th>Date</th>
                <th>Bien & Prix initial</th>
                <th>Client</th>
                <th>Montant de l'offre</th>
                <th>Statut / Action</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td data-label="Date" style={{ fontSize: 13, color: 'var(--color-muted)' }}>{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td data-label="Bien">
                    <div>{o.bien?.type} — {o.bien?.localisation}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Demandé : {o.bien?.prix?.toLocaleString('fr-FR')} MAD</div>
                  </td>
                  <td data-label="Client"><strong>{o.client?.nom} {o.client?.prenom}</strong></td>
                  <td data-label="Montant"><strong style={{ color: 'var(--color-primary)' }}>{o.montant?.toLocaleString('fr-FR')} MAD</strong></td>
                  <td data-label="Statut">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Badge statut={o.statut} />
                      {o.statut === 'En cours' && (
                        <select
                          style={{ border: 'none', background: 'transparent', color: 'var(--color-primary)', fontSize: 12, cursor: 'pointer', outline: 'none' }}
                          value="Action..."
                          onChange={e => handleUpdateStatut(o.id, e.target.value)}
                        >
                          <option value="Action..." disabled>Action…</option>
                          <option value="Acceptée">Accepter</option>
                          <option value="Refusée">Refuser</option>
                        </select>
                      )}
                      {o.statut === 'Acceptée' && (
                        <button
                          className="btn btn-accent btn-sm"
                          style={{ fontSize: 11, height: 26, padding: '0 8px' }}
                          onClick={() => handleConvertToTransaction(o)}
                        >
                          <ArrowRight size={12} /> Transaction
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', width: '100%' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(o)} title="Modifier">
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(o.id)} title="Supprimer" style={{ color: 'var(--color-danger)' }}>
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
          <div className="empty-state-icon"><TrendingUp size={32} /></div>
          <div className="empty-state-title">Aucune offre trouvée</div>
          <div className="empty-state-desc">Vous n'avez pas encore d'offres enregistrées.</div>
          <button className="btn btn-primary" onClick={openAdd}>Nouvelle Offre</button>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editId ? 'Modifier l\'offre' : 'Soumettre une offre'}</h2>
              <button className="modal-close" onClick={closeModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {biens.length === 0 || clients.length === 0 ? (
                  <div className="alert alert-error">Vous devez avoir au moins un bien et un client.</div>
                ) : (
                  <div className="form-grid">
                    <div className="input-group full">
                      <label className="input-label">Bien concerné</label>
                      <select className="input-field" required value={formData.bienId} onChange={e => setFormData({ ...formData, bienId: e.target.value })}>
                        {biens.map(b => <option key={b.id} value={b.id}>{b.type} — {b.localisation} ({b.prix?.toLocaleString('fr-FR')} MAD)</option>)}
                      </select>
                    </div>
                    <div className="input-group full">
                      <label className="input-label">Client</label>
                      <select className="input-field" required value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })}>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.nom} {c.prenom} ({c.type})</option>)}
                      </select>
                    </div>
                    <div className="input-group full">
                      <label className="input-label">Montant de l'offre (MAD)</label>
                      <input type="number" className="input-field" required value={formData.montant} onChange={e => setFormData({ ...formData, montant: e.target.value })} />
                    </div>
                    {editId && (
                      <div className="input-group full">
                        <label className="input-label">Statut</label>
                        <select className="input-field" value={formData.statut} onChange={e => setFormData({ ...formData, statut: e.target.value })}>
                          <option value="En cours">En cours</option>
                          <option value="Acceptée">Acceptée</option>
                          <option value="Refusée">Refusée</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={biens.length === 0 || clients.length === 0}>
                  {editId ? 'Enregistrer' : 'Soumettre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
