import { useState, useEffect } from 'react';
import { Plus, X, Search, Receipt, Trash2, Edit2, FileText, Download } from 'lucide-react';
import { downloadFacturePdf } from '../utils/FacturePdf';

const EMPTY_FORM = { bienId: '', clientId: '', type: 'Vente', prixFinal: '', dateSignature: '', notes: '' };

const EMPTY_LIGNE = { description: '', qte: 1, prixUnitaire: '', tva: 20 };

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [biens, setBiens]               = useState([]);
  const [clients, setClients]           = useState([]);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editId, setEditId]             = useState(null);
  const [search, setSearch]             = useState('');
  const [formData, setFormData]         = useState(EMPTY_FORM);

  const [isFactureModalOpen, setIsFactureModalOpen] = useState(false);
  const [factureTransaction, setFactureTransaction] = useState(null);
  const [factureForm, setFactureForm]                = useState(null);
  const [generatingFacture, setGeneratingFacture]    = useState(false);


  useEffect(() => {
    fetchTransactions();
    fetchBiens();
    fetchClients();
  }, []);

  const fetchTransactions = async () => {
    const res = await fetch('http://localhost:3001/api/transactions');
    if (res.ok) setTransactions(await res.json());
  };
  const fetchBiens = async () => {
    const res = await fetch('http://localhost:3001/api/biens');
    if (res.ok) setBiens(await res.json());
  };
  const fetchClients = async () => {
    const res = await fetch('http://localhost:3001/api/clients');
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
      await fetch(`http://localhost:3001/api/transactions/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: formData.type, prixFinal: formData.prixFinal, dateSignature: formData.dateSignature, notes: formData.notes }),
      });
    } else {
      await fetch('http://localhost:3001/api/transactions', {
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
    await fetch(`http://localhost:3001/api/transactions/${id}`, { method: 'DELETE' });
    fetchTransactions();
  };

  // ── Facture ──────────────────────────────────────────────────
  const openFacture = (t) => {
    setFactureTransaction(t);
    const dateEcheance = new Date();
    dateEcheance.setDate(dateEcheance.getDate() + 30);
    setFactureForm({
      reference: '',
      objet: `${t.type} — ${t.bien?.type} à ${t.bien?.localisation}`,
      dateEcheance: dateEcheance.toISOString().slice(0, 10),
      clientNom: `${t.client?.nom} ${t.client?.prenom}`,
      clientVille: t.bien?.localisation || '',
      clientTelephone: t.client?.telephone || '',
      clientEmail: t.client?.email || '',
      lignes: [{
        description: `Commission de ${t.type === 'Vente' ? 'vente' : 'location'}`,
        qte: 1, prixUnitaire: t.commission, tva: 20,
      }],
    });
    setIsFactureModalOpen(true);
  };

  const closeFactureModal = () => {
    setIsFactureModalOpen(false);
    setFactureTransaction(null);
    setFactureForm(null);
  };

  const setLigne = (idx, field, value) => {
    setFactureForm(f => ({
      ...f,
      lignes: f.lignes.map((l, i) => i === idx ? { ...l, [field]: value } : l),
    }));
  };
  const addLigne    = () => setFactureForm(f => ({ ...f, lignes: [...f.lignes, { ...EMPTY_LIGNE }] }));
  const removeLigne = (idx) => setFactureForm(f => ({ ...f, lignes: f.lignes.filter((_, i) => i !== idx) }));

  const factureTotalHT  = (factureForm?.lignes || []).reduce((s, l) => s + (parseFloat(l.qte) || 0) * (parseFloat(l.prixUnitaire) || 0), 0);
  const factureTotalTVA = (factureForm?.lignes || []).reduce((s, l) => {
    const ht = (parseFloat(l.qte) || 0) * (parseFloat(l.prixUnitaire) || 0);
    return s + ht * ((parseFloat(l.tva) || 0) / 100);
  }, 0);

  const handleGenerateFacture = async (e) => {
    e.preventDefault();
    setGeneratingFacture(true);
    const res = await fetch('http://localhost:3001/api/factures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...factureForm, transactionId: factureTransaction.id }),
    });
    const facture = await res.json();
    setGeneratingFacture(false);
    if (res.ok) {
      await downloadFacturePdf(facture);
      closeFactureModal();
      fetchTransactions();
    } else {
      alert(facture.message || "Échec de la génération de la facture.");
    }
  };

  const handleRedownload = async (t) => {
    const res = await fetch(`http://localhost:3001/api/factures/${t.facture.id}`);
    if (res.ok) downloadFacturePdf(await res.json());
  };

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase();
    return `${t.client?.nom} ${t.client?.prenom}`.toLowerCase().includes(q) ||
      t.bien?.localisation?.toLowerCase().includes(q) ||
      t.bien?.type?.toLowerCase().includes(q) ||
      t.type?.toLowerCase().includes(q);
  });

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
          <input className="input-field" placeholder="Rechercher par client, bien ou type..." value={search} onChange={e => setSearch(e.target.value)} />
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
                  <td data-label="Date" style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                    {new Date(t.dateSignature || t.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td data-label="Bien">
                    <div>{t.bien?.type} — {t.bien?.localisation}</div>
                    <span className={`badge ${t.type === 'Vente' ? 'badge-navy' : 'badge-emerald'}`} style={{ fontSize: 10, marginTop: 2 }}>
                      {t.type}
                    </span>
                  </td>
                  <td data-label="Client"><strong>{t.client?.nom} {t.client?.prenom}</strong></td>
                  <td data-label="Prix final"><strong>{t.prixFinal?.toLocaleString('fr-FR')} MAD</strong></td>
                  <td data-label="Commission" style={{ color: 'var(--color-success)', fontWeight: 700 }}>{t.commission?.toLocaleString('fr-FR')} MAD</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', width: '100%' }}>
                      {t.facture ? (
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleRedownload(t)} title={`Télécharger ${t.facture.numero}`}>
                          <Download size={14} />
                        </button>
                      ) : (
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openFacture(t)} title="Générer une facture">
                          <FileText size={14} />
                        </button>
                      )}
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

      {/* ── Facture Modal ── */}
      {isFactureModalOpen && factureForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeFactureModal()}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h2 className="modal-title">Générer une facture</h2>
              <button className="modal-close" onClick={closeFactureModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleGenerateFacture}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">Nom du client</label>
                    <input className="input-field" required value={factureForm.clientNom} onChange={e => setFactureForm({ ...factureForm, clientNom: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Ville et code postal</label>
                    <input className="input-field" value={factureForm.clientVille} onChange={e => setFactureForm({ ...factureForm, clientVille: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Téléphone</label>
                    <input className="input-field" value={factureForm.clientTelephone} onChange={e => setFactureForm({ ...factureForm, clientTelephone: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <input className="input-field" value={factureForm.clientEmail} onChange={e => setFactureForm({ ...factureForm, clientEmail: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Référence dossier (optionnel)</label>
                    <input className="input-field" value={factureForm.reference} onChange={e => setFactureForm({ ...factureForm, reference: e.target.value })} placeholder="DOS-2026-XXX" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Date d'échéance</label>
                    <input type="date" className="input-field" value={factureForm.dateEcheance} onChange={e => setFactureForm({ ...factureForm, dateEcheance: e.target.value })} />
                  </div>
                  <div className="input-group full">
                    <label className="input-label">Objet de la facture</label>
                    <input className="input-field" value={factureForm.objet} onChange={e => setFactureForm({ ...factureForm, objet: e.target.value })} />
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="input-label" style={{ margin: 0 }}>Lignes de facturation</label>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addLigne}><Plus size={14} /> Ajouter une ligne</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {factureForm.lignes.map((l, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input className="input-field" style={{ flex: 3 }} placeholder="Description" required
                          value={l.description} onChange={e => setLigne(idx, 'description', e.target.value)} />
                        <input type="number" className="input-field" style={{ flex: 1 }} placeholder="Qté" required min="0" step="1"
                          value={l.qte} onChange={e => setLigne(idx, 'qte', e.target.value)} />
                        <input type="number" className="input-field" style={{ flex: 1.3 }} placeholder="Prix unitaire" required min="0" step="0.01"
                          value={l.prixUnitaire} onChange={e => setLigne(idx, 'prixUnitaire', e.target.value)} />
                        <input type="number" className="input-field" style={{ flex: 1 }} placeholder="TVA %" required min="0" step="0.1"
                          value={l.tva} onChange={e => setLigne(idx, 'tva', e.target.value)} />
                        {factureForm.lignes.length > 1 && (
                          <button type="button" onClick={() => removeLigne(idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex', padding: 4 }}>
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, fontSize: 13 }}>
                  <div>Total HT : <strong>{factureTotalHT.toLocaleString('fr-FR')} MAD</strong></div>
                  <div>TVA : <strong>{factureTotalTVA.toLocaleString('fr-FR')} MAD</strong></div>
                  <div style={{ fontSize: 15 }}>Total TTC : <strong style={{ color: 'var(--color-success)' }}>{(factureTotalHT + factureTotalTVA).toLocaleString('fr-FR')} MAD</strong></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeFactureModal}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={generatingFacture}>
                  <FileText size={16} /> {generatingFacture ? 'Génération…' : 'Générer et télécharger le PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
