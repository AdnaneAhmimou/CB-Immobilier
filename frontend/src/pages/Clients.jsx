import { useState, useEffect } from 'react';
import { Plus, X, Search, Users, Edit2, Trash2 } from 'lucide-react';
import { API_URL } from '../config';

const TYPE_BADGE = {
  Vendeur:   'badge-navy',
  Acheteur:  'badge-blue',
  Locataire: 'badge-purple',
  Bailleur:  'badge-emerald',
};

const STATUT_BADGE = {
  'Nouveau contact':  'badge-gray',
  'En recherche':     'badge-amber',
  'Visite effectuée': 'badge-purple',
  'Offre faite':      'badge-green',
  'Dossier clôturé':  'badge-blue',
};

const PAGE_TITLE = {
  All:       'Tous les Clients',
  Acheteur:  'Acheteurs',
  Locataire: 'Locataires',
  Vendeur:   'Vendeurs',
  Bailleur:  'Bailleurs',
};

const PAGE_DESC = {
  All:       'Tous vos contacts — acheteurs, locataires, vendeurs et bailleurs.',
  Acheteur:  'Clients souhaitant acheter un bien.',
  Locataire: 'Clients souhaitant louer un bien.',
  Vendeur:   'Clients qui vendent leur bien via votre agence.',
  Bailleur:  'Propriétaires qui mettent leur bien en location.',
};

const EMPTY_FORM = {
  nom: '', prenom: '', cin: '', telephone: '', email: '',
  type: 'Acheteur', budget: '', commission: '',
  statut: 'Nouveau contact', criteres: '',
};

export default function Clients({ filter = 'All' }) {
  const [clients, setClients]       = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId]         = useState(null);
  const [search, setSearch]         = useState('');
  const [formData, setFormData]     = useState({ ...EMPTY_FORM, type: filter !== 'All' ? filter : 'Acheteur' });

  useEffect(() => { fetchClients(); }, []);

  // Reset search when switching between filtered views
  useEffect(() => { setSearch(''); }, [filter]);

  const fetchClients = async () => {
    const res = await fetch(`${API_URL}/api/clients`);
    if (res.ok) setClients(await res.json());
  };

  const openAdd = () => {
    setEditId(null);
    setFormData({ ...EMPTY_FORM, type: filter !== 'All' ? filter : 'Acheteur' });
    setIsModalOpen(true);
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setFormData({
      nom: c.nom, prenom: c.prenom, cin: c.cin || '', telephone: c.telephone,
      email: c.email || '', type: c.type,
      budget: c.budget || '', commission: c.commission || '',
      statut: c.statut, criteres: c.criteres || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce client ?')) return;
    await fetch(`${API_URL}/api/clients/${id}`, { method: 'DELETE' });
    fetchClients();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url    = editId ? `${API_URL}/api/clients/${editId}` : `${API_URL}/api/clients`;
    const method = editId ? 'PATCH' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setIsModalOpen(false);
    fetchClients();
  };

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const isOwner    = formData.type === 'Vendeur' || formData.type === 'Bailleur';
  const isBuyer    = formData.type === 'Acheteur' || formData.type === 'Locataire';
  const budgetLabel = formData.type === 'Locataire' ? 'Loyer max (MAD/mois)' : 'Budget max (MAD)';

  const filtered = clients
    .filter(c => filter === 'All' || c.type === filter)
    .filter(c => {
      const q = search.toLowerCase();
      return !q || `${c.nom} ${c.prenom} ${c.cin || ''} ${c.telephone}`.toLowerCase().includes(q);
    })
    .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr', { sensitivity: 'base' }));

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{PAGE_TITLE[filter] || 'Clients'}</h1>
          <p className="page-subtitle">{PAGE_DESC[filter]}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar" style={{ maxWidth: 400 }}>
          <Search className="search-bar-icon" size={16} />
          <input className="input-field" placeholder="Rechercher par nom, CIN ou téléphone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon"><Users size={32} /></div>
          <div className="empty-state-title">Aucun résultat</div>
          <div className="empty-state-desc">Aucun client ne correspond à votre recherche.</div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Ajouter</button>
        </div>
      ) : (
        <div className="card table-wrapper" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom Complet</th>
                <th>CIN</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Détails financiers</th>
                <th>Statut</th>
                <th style={{ width: 60 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const isO = c.type === 'Vendeur' || c.type === 'Bailleur';
                return (
                  <tr key={c.id}>
                    <td data-label="Nom" style={{ fontWeight: 600 }}>{c.nom} {c.prenom}</td>
                    <td data-label="CIN" style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-muted)' }}>{c.cin || '—'}</td>
                    <td data-label="Contact">
                      <div>{c.telephone}</div>
                      {c.email && <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{c.email}</div>}
                    </td>
                    <td data-label="Type"><span className={`badge ${TYPE_BADGE[c.type] || 'badge-gray'}`}>{c.type}</span></td>
                    <td data-label="Finances" style={{ fontSize: 13 }}>
                      {isO
                        ? <span style={{ color: 'var(--color-success)' }}>Commission : {c.commission ?? '—'}%</span>
                        : <span>{c.type === 'Locataire' ? 'Loyer max' : 'Budget'} : {c.budget ? `${c.budget.toLocaleString('fr-FR')} MAD` : '—'}</span>
                      }
                    </td>
                    <td data-label="Statut"><span className={`badge ${STATUT_BADGE[c.statut] || 'badge-gray'}`}>{c.statut}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', width: '100%' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(c)} title="Modifier">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(c.id)} title="Supprimer" style={{ color: 'var(--color-danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editId ? 'Modifier le client' : 'Nouveau client'}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">Nom</label>
                    <input type="text" className="input-field" required value={formData.nom} onChange={set('nom')} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Prénom</label>
                    <input type="text" className="input-field" required value={formData.prenom} onChange={set('prenom')} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">CIN (optionnel)</label>
                    <input type="text" className="input-field" value={formData.cin} onChange={set('cin')} placeholder="AB123456" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Téléphone</label>
                    <input type="text" className="input-field" required value={formData.telephone} onChange={set('telephone')} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <input type="email" className="input-field" value={formData.email} onChange={set('email')} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Type de client</label>
                    <select className="input-field" value={formData.type} onChange={set('type')}>
                      <option value="Acheteur">Acheteur</option>
                      <option value="Locataire">Locataire</option>
                      <option value="Vendeur">Vendeur</option>
                      <option value="Bailleur">Bailleur</option>
                    </select>
                  </div>

                  {isBuyer && (
                    <div className="input-group">
                      <label className="input-label">{budgetLabel}</label>
                      <input type="number" className="input-field" value={formData.budget} onChange={set('budget')} placeholder="500000" />
                    </div>
                  )}
                  {isOwner && (
                    <div className="input-group">
                      <label className="input-label">Commission agence (%)</label>
                      <input type="number" step="0.1" className="input-field" value={formData.commission} onChange={set('commission')} placeholder="3.0" />
                    </div>
                  )}

                  <div className="input-group">
                    <label className="input-label">Statut du dossier</label>
                    <select className="input-field" value={formData.statut} onChange={set('statut')}>
                      <option>Nouveau contact</option>
                      <option>En recherche</option>
                      <option>Visite effectuée</option>
                      <option>Offre faite</option>
                      <option>Dossier clôturé</option>
                    </select>
                  </div>

                  <div className="input-group full">
                    <label className="input-label">Critères / Notes</label>
                    <textarea className="input-field" rows={3} value={formData.criteres} onChange={set('criteres')}
                      placeholder={isBuyer ? 'Ex: Appartement 3 pièces, Casablanca, proche école…' : 'Notes sur le mandat…'} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Enregistrer' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
