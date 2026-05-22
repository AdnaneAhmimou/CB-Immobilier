import { useState, useEffect } from 'react';
import { Plus, X, Search, Receipt, Trash2, Edit2 } from 'lucide-react';

const EMPTY_FORM = { bienId: '', clientId: '', type: 'Vente', prixFinal: '', dateSignature: '', notes: '' };

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [biens, setBiens]               = useState([]);
  const [clients, setClients]           = useState([]);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editId, setEditId]             = useState(null);
  const [search, setSearch]             = useState('');
  const [formData, setFormData]         = useState(EMPTY_FORM);


  useEffect(() => {
    fetchTransactions();
    fetchBiens();
    fetchClients();
  }, []);

  const fetchTransactions = async () => {
    const res = await fetch('http://localhost:3000/api/transactions');
    if (res.ok) setTransactions(await res.json());
  };
  const fetchBiens = async () => {
    const res = await fetch('http://localhost:3000/api/biens');
    if (res.ok) setBiens(await res.json());
  };
  const fetchClients = async () => {
    const res = await fetch('http://localhost:3000/api/clients');
    if (res.ok) setClients(await res.json());
  };

  const availableBiens  = biens.filter(b => b.statut === 'Disponible' || b.statut === 'Réservé');
  const selectedBien    = biens.find(b => b.id === formData.bienId);
  const owner           = selectedBien?.vendeur || selectedBien?.bailleur || null;
  const ownerLabel      = selectedBien?.transactionType === 'Location' ? 'Bailleur' : 'Vendeur';
  const buyerClients    = clients.filter(c =>
    selectedBien?.transactionType === 'Location'
      ? c.type === 'Locataire'
      : c.type === 'Acheteur'
  );

  const openAdd = () => {
    setEditId(null);
    setFormData({ ...EMPTY_FORM, bienId: availableBiens[0]?.id || '', clientId: clients[0]?.id || '' });
    setIsModalOpen(true);
  };

  const openEdit = (t) => {
    setEditId(t.id);
    const dateStr = t.dateSignature ? new Date(t.dateSignature).toISOString().slice(0, 10) : '';
    setFormData({
      bienId: t.bienId, clientId: t.clientId,
      type: t.type, prixFinal: t.prixFinal,
      dateSignature: dateStr, notes: t.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await fetch(`http://localhost:3000/api/transactions/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: formData.type, prixFinal: formData.prixFinal, dateSignature: formData.dateSignature, notes: formData.notes }),
      });
    } else {
      await fetch('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }
    closeModal();
    fetchTransactions();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette transaction ?')) return;
    await fetch(`http://localhost:3000/api/transactions/${id}`, { method: 'DELETE' });
    fetchTransactions();
  };

  const filtered = transactions.filter(t =>
    `${t.client?.nom} ${t.client?.prenom}`.toLowerCase().includes(search.toLowerCase()) ||
    t.bien?.localisation?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">Suivi des ventes et locations conclues.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Enregistrer une transaction
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
                <th>Bien & Type</th>
                <th>Client</th>
                <th>Prix Final</th>
                <th>Commission Agence</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                    {new Date(t.dateSignature || t.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <div>{t.bien?.type} — {t.bien?.localisation}</div>
                    <span className={`badge ${t.type === 'Vente' ? 'badge-navy' : 'badge-emerald'}`} style={{ fontSize: 10, marginTop: 2 }}>
                      {t.type}
                    </span>
                  </td>
                  <td><strong>{t.client?.nom} {t.client?.prenom}</strong></td>
                  <td><strong>{t.prixFinal?.toLocaleString('fr-FR')} MAD</strong></td>
                  <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>{t.commission?.toLocaleString('fr-FR')} MAD</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(t)} title="Modifier">
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(t.id)} title="Supprimer" style={{ color: 'var(--color-danger)' }}>
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
          <div className="empty-state-icon"><Receipt size={32} /></div>
          <div className="empty-state-title">Aucune transaction</div>
          <div className="empty-state-desc">Vous n'avez pas encore enregistré de ventes ou de locations.</div>
          <button className="btn btn-primary" onClick={openAdd}>Enregistrer une transaction</button>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editId ? 'Modifier la transaction' : 'Nouvelle transaction'}</h2>
              <button className="modal-close" onClick={closeModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  {!editId && (
                    <>
                      <div className="input-group full">
                        <label className="input-label">Bien concerné</label>
                        <select className="input-field" required value={formData.bienId}
                          onChange={e => setFormData({ ...formData, bienId: e.target.value, clientId: '' })}>
                          {availableBiens.length === 0
                            ? <option value="">Aucun bien disponible</option>
                            : availableBiens.map(b => <option key={b.id} value={b.id}>{b.type} — {b.localisation} ({b.prix?.toLocaleString('fr-FR')} MAD)</option>)
                          }
                        </select>
                      </div>

                      {owner && (
                        <div className="input-group full">
                          <label className="input-label">{ownerLabel} (propriétaire du bien)</label>
                          <div className="input-field" style={{ background: 'var(--color-surface-soft)', color: 'var(--color-muted)', display: 'flex', alignItems: 'center' }}>
                            {owner.nom} {owner.prenom}
                            {owner.commission && <span style={{ marginLeft: 8, fontSize: 12 }}>— Commission : {owner.commission}%</span>}
                          </div>
                        </div>
                      )}

                      <div className="input-group full">
                        <label className="input-label">
                          {selectedBien?.transactionType === 'Location' ? 'Locataire' : 'Acheteur'}
                        </label>
                        {buyerClients.length === 0 ? (
                          <div className="alert alert-warning">
                            Aucun {selectedBien?.transactionType === 'Location' ? 'locataire' : 'acheteur'} enregistré.
                          </div>
                        ) : (
                          <select className="input-field" required value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })}>
                            <option value="">Sélectionner…</option>
                            {buyerClients.map(c => <option key={c.id} value={c.id}>{c.nom} {c.prenom}</option>)}
                          </select>
                        )}
                      </div>
                    </>
                  )}
                  <div className="input-group">
                    <label className="input-label">Type</label>
                    <select className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                      <option>Vente</option>
                      <option>Location</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Prix final (MAD)</label>
                    <input type="number" className="input-field" required value={formData.prixFinal} onChange={e => setFormData({ ...formData, prixFinal: e.target.value })} />
                  </div>
                  <div className="input-group full">
                    <label className="input-label">Date de signature</label>
                    <input type="date" className="input-field" value={formData.dateSignature} onChange={e => setFormData({ ...formData, dateSignature: e.target.value })} />
                  </div>
                  <div className="input-group full">
                    <label className="input-label">Notes (optionnel)</label>
                    <textarea className="input-field" rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={!editId && availableBiens.length === 0}>
                  {editId ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
