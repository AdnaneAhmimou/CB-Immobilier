import { useState, useEffect } from 'react';
import { Search, Users, Building2, BedDouble, Ruler, CalendarClock, X, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

function ClientCard({ client, selected, onClick }) {
  const isOwner = client.type === 'Vendeur' || client.type === 'Bailleur';
  const TYPE_BADGE = { Acheteur: 'badge-blue', Locataire: 'badge-purple' };
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px',
        borderRadius: 'var(--rounded)',
        border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
        background: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <strong style={{ fontSize: 14 }}>{client.nom} {client.prenom}</strong>
        <span className={`badge ${TYPE_BADGE[client.type] || 'badge-gray'}`}>{client.type}</span>
      </div>
      {client.budget && (
        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
          Budget : <strong style={{ color: 'var(--color-ink)' }}>{client.budget.toLocaleString('fr-FR')} MAD{client.type === 'Locataire' ? '/mois' : ''}</strong>
        </div>
      )}
      {client.criteres && (
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {client.criteres}
        </div>
      )}
    </div>
  );
}

function MatchTag({ bien, budget }) {
  if (!budget) return null;
  if (bien.prix <= budget)
    return <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--color-success)', fontWeight: 600 }}><CheckCircle2 size={12} /> Dans le budget</span>;
  if (bien.prix <= budget * 1.15)
    return <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--color-warning)', fontWeight: 600 }}><AlertCircle size={12} /> Légèrement au-dessus</span>;
  return <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--color-danger)', fontWeight: 600 }}><TrendingUp size={12} /> Au-dessus du budget</span>;
}

export default function Matching() {
  const [clients, setClients]         = useState([]);
  const [biens, setBiens]             = useState([]);
  const [selected, setSelected]       = useState(null);
  const [search, setSearch]           = useState('');
  const [isVisiteModal, setIsVisiteModal] = useState(false);
  const [visiteBien, setVisiteBien]   = useState(null);
  const [visiteDate, setVisiteDate]   = useState('');

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3001/api/clients').then(r => r.json()),
      fetch('http://localhost:3001/api/biens').then(r => r.json()),
    ]).then(([c, b]) => {
      setClients(c.filter(x => x.type === 'Acheteur' || x.type === 'Locataire'));
      setBiens(b);
    });
  }, []);

  const filteredClients = clients.filter(c => {
    const q = search.toLowerCase();
    return !q || `${c.nom} ${c.prenom}`.toLowerCase().includes(q);
  });

  const matches = selected
    ? biens.filter(b => {
        const txMatch = selected.type === 'Acheteur' ? b.transactionType === 'Vente' : b.transactionType === 'Location';
        return txMatch && b.statut === 'Disponible';
      })
    : [];

  const withinBudget   = matches.filter(b => selected?.budget && b.prix <= selected.budget).length;
  const overBudget     = matches.filter(b => selected?.budget && b.prix > selected.budget).length;

  const openVisite = (bien) => {
    setVisiteBien(bien);
    setVisiteDate('');
    setIsVisiteModal(true);
  };

  const handlePlanifierVisite = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:3001/api/visites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bienId: visiteBien.id, clientId: selected.id, date: visiteDate, retour: 'En attente' }),
    });
    setIsVisiteModal(false);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Matching</h1>
          <p className="page-subtitle">Trouvez les biens correspondant aux critères de chaque client.</p>
        </div>
      </div>

      <div className="matching-split" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--spacing-lg)', alignItems: 'start' }}>

        {/* ── Left: client list ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-hairline)' }}>
            <div className="search-bar">
              <Search className="search-bar-icon" size={14} />
              <input className="input-field" placeholder="Rechercher un client…" value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize: 13 }} />
            </div>
          </div>
          <div className="matching-split-list" style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredClients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-muted)', fontSize: 13 }}>
                <Users size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                <div>Aucun acheteur ou locataire</div>
              </div>
            ) : filteredClients.map(c => (
              <ClientCard key={c.id} client={c} selected={selected?.id === c.id} onClick={() => setSelected(c)} />
            ))}
          </div>
        </div>

        {/* ── Right: matching biens ── */}
        <div>
          {!selected ? (
            <div className="empty-state card">
              <div className="empty-state-icon"><Users size={32} /></div>
              <div className="empty-state-title">Sélectionnez un client</div>
              <div className="empty-state-desc">Choisissez un acheteur ou locataire pour voir les biens disponibles correspondants.</div>
            </div>
          ) : (
            <>
              {/* Client summary bar */}
              <div className="card" style={{ marginBottom: 'var(--spacing-md)', padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.nom} {selected.prenom}</div>
                    {selected.criteres && (
                      <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>{selected.criteres}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)' }}>{matches.length}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>biens trouvés</div>
                    </div>
                    {selected.budget > 0 && (
                      <>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-success)' }}>{withinBudget}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>dans le budget</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-warning)' }}>{overBudget}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>au-dessus</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {matches.length === 0 ? (
                <div className="empty-state card">
                  <div className="empty-state-icon"><Building2 size={32} /></div>
                  <div className="empty-state-title">Aucun bien disponible</div>
                  <div className="empty-state-desc">
                    Aucun bien {selected.type === 'Acheteur' ? 'à vendre' : 'à louer'} n'est disponible pour le moment.
                  </div>
                </div>
              ) : (
                <div className="bien-grid">
                  {matches.map(bien => (
                    <div key={bien.id} className="bien-card">
                      <div className="bien-card-photo">
                        {bien.documents?.[0]
                          ? <img src={`http://localhost:3001${bien.documents[0].filePath}`} alt="Bien" />
                          : <Building2 size={40} className="bien-card-photo-icon" />}
                        <div className="bien-card-badges">
                          <span className="badge badge-green">Disponible</span>
                          <span className={`badge ${bien.transactionType === 'Vente' ? 'badge-navy' : 'badge-emerald'}`}>
                            {bien.transactionType}
                          </span>
                        </div>
                      </div>
                      <div className="bien-card-body">
                        <div className="bien-card-location">{bien.localisation}</div>
                        <div className="bien-card-meta">{bien.type}</div>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                          <span className="meta-row"><BedDouble size={13} /> {bien.pieces} pièces</span>
                          <span className="meta-row"><Ruler size={13} /> {bien.superficie} m²</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div className="bien-card-price" style={{ marginBottom: 0 }}>
                            {bien.prix.toLocaleString('fr-FR')} MAD
                            {bien.transactionType === 'Location' && <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--color-muted)' }}> /mois</span>}
                          </div>
                          <MatchTag bien={bien} budget={selected.budget} />
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ width: '100%', borderRadius: 'var(--rounded-sm)' }}
                          onClick={() => openVisite(bien)}
                        >
                          <CalendarClock size={13} /> Planifier une visite
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Visite modal ── */}
      {isVisiteModal && visiteBien && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsVisiteModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Planifier une visite</h2>
              <button className="modal-close" onClick={() => setIsVisiteModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handlePlanifierVisite}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="alert alert-success">
                  <strong>{visiteBien.type}</strong> — {visiteBien.localisation}
                  <div style={{ fontSize: 12, marginTop: 2 }}>Client : {selected.nom} {selected.prenom}</div>
                </div>
                <div className="input-group">
                  <label className="input-label">Date et heure</label>
                  <input type="datetime-local" className="input-field" required value={visiteDate} onChange={e => setVisiteDate(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsVisiteModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary"><CalendarClock size={14} /> Confirmer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
