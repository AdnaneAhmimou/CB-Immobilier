import { useState, useEffect } from 'react';
import { Plus, X, Search, Building2, BedDouble, Ruler, CheckCircle, Edit2, Trash2, FileUp, ChevronLeft, ChevronRight, Download, Image as ImageIcon, Film, Maximize2 } from 'lucide-react';

const IMAGE_EXTS = /\.(jpe?g|jfif|png|gif|webp|bmp|avif|heic|heif|svg)$/i;
const VIDEO_EXTS = /\.(mp4|mov|webm|mkv|avi|m4v)$/i;

const byName = (a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });

const getPhotos = (bien) => (bien?.documents || []).filter(d => IMAGE_EXTS.test(d.filePath)).sort(byName);
const getVideos = (bien) => (bien?.documents || []).filter(d => VIDEO_EXTS.test(d.filePath)).sort(byName);
const getDocs   = (bien) => (bien?.documents || []).filter(d => !IMAGE_EXTS.test(d.filePath) && !VIDEO_EXTS.test(d.filePath)).sort(byName);

const STATUT_BADGE = {
  'Disponible': 'badge-green',
  'Réservé':    'badge-amber',
  'Vendu':      'badge-red',
  'Loué':       'badge-blue',
};

function Badge({ statut }) {
  return <span className={`badge ${STATUT_BADGE[statut] || 'badge-gray'}`}>{statut}</span>;
}

const PREDEFINED_TYPES = ['Appartement', 'Villa', 'Maison', 'Terrain', 'Bureau', 'Café', 'Magasin', 'Entrepôt', 'Local commercial'];

const EMPTY_VENTE    = { type: 'Appartement', statut: 'Disponible', transactionType: 'Vente',    localisation: '', superficie: '', pieces: '', prix: '', equipements: '', vendeurId: '' };
const EMPTY_LOCATION = { type: 'Appartement', statut: 'Disponible', transactionType: 'Location', localisation: '', superficie: '', pieces: '', prix: '', equipements: '', bailleurId: '' };

export default function Biens({ defaultTab = 'vente' }) {
  const [tab, setTab]             = useState(defaultTab);     // 'vente' | 'location'
  const [biens, setBiens]         = useState([]);
  const [vendeurs, setVendeurs]   = useState([]);
  const [bailleurs, setBailleurs] = useState([]);
  const [acheteurs, setAcheteurs] = useState([]);
  const [locataires, setLocataires] = useState([]);

  const [customTypes, setCustomTypes]           = useState([]);
  const [isModalOpen, setIsModalOpen]           = useState(false);
  const [isDealModalOpen, setIsDealModalOpen]   = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [selectedBien, setSelectedBien]         = useState(null);
  const [editBienId, setEditBienId]             = useState(null);
  const [formData, setFormData]                 = useState(EMPTY_VENTE);
  const [dealBuyerId, setDealBuyerId]           = useState('');
  const [uploadFiles, setUploadFiles]           = useState([]);  // [{file, name}]
  const [uploading, setUploading]               = useState(false);
  const [search, setSearch]                     = useState('');
  const [detailBien, setDetailBien]             = useState(null);
  const [photoIndex, setPhotoIndex]             = useState(0);
  const [isFullscreen, setIsFullscreen]         = useState(false);

  // Fullscreen viewer keyboard controls
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e) => {
      const count = getPhotos(detailBien).length;
      if (e.key === 'Escape') setIsFullscreen(false);
      if (e.key === 'ArrowLeft') setPhotoIndex(i => (i - 1 + count) % count);
      if (e.key === 'ArrowRight') setPhotoIndex(i => (i + 1) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen, detailBien]);


  // Sync tab when navigating between /biens/vente and /biens/location
  useEffect(() => { setTab(defaultTab); }, [defaultTab]);

  useEffect(() => {
    fetchBiens();
    fetchClients();
    fetchCustomTypes();
  }, []);

  const fetchCustomTypes = async () => {
    const res = await fetch('http://localhost:3001/api/bien-types');
    if (res.ok) setCustomTypes(await res.json());
  };

  const fetchBiens = async () => {
    const res = await fetch('http://localhost:3001/api/biens');
    if (!res.ok) return [];
    const data = await res.json();
    setBiens(data);
    return data;
  };

  // Re-sync selectedBien / detailBien with fresh data after a media change
  const refreshBienRefs = (data, bienId) => {
    const updated = data.find(b => b.id === bienId);
    if (!updated) return;
    setSelectedBien(prev => (prev?.id === bienId ? updated : prev));
    setDetailBien(prev => (prev?.id === bienId ? updated : prev));
  };

  const fetchClients = async () => {
    const res = await fetch('http://localhost:3001/api/clients');
    if (!res.ok) return;
    const data = await res.json();
    setVendeurs(data.filter(c => c.type === 'Vendeur'));
    setBailleurs(data.filter(c => c.type === 'Bailleur'));
    setAcheteurs(data.filter(c => c.type === 'Acheteur'));
    setLocataires(data.filter(c => c.type === 'Locataire'));
  };

  // ── Filtered lists per tab ──────────────────────────────────
  const isVente    = tab === 'vente';
  const filtered   = biens
    .filter(b => b.transactionType === (isVente ? 'Vente' : 'Location'))
    .filter(b =>
      b.localisation.toLowerCase().includes(search.toLowerCase()) ||
      b.type.toLowerCase().includes(search.toLowerCase())
    );

  // ── Open add/edit modal ─────────────────────────────────────
  const openAdd = () => {
    setEditBienId(null);
    if (isVente) {
      setFormData({ ...EMPTY_VENTE,    vendeurId:  vendeurs[0]?.id  || '' });
    } else {
      setFormData({ ...EMPTY_LOCATION, bailleurId: bailleurs[0]?.id || '' });
    }
    setIsModalOpen(true);
  };

  const openEdit = (bien) => {
    setEditBienId(bien.id);
    setFormData({
      type:            bien.type,
      statut:          bien.statut,
      transactionType: bien.transactionType,
      localisation:    bien.localisation,
      superficie:      bien.superficie,
      pieces:          bien.pieces,
      prix:            bien.prix,
      equipements:     bien.equipements || '',
      vendeurId:       bien.vendeurId  || '',
      bailleurId:      bien.bailleurId || '',
    });
    setIsModalOpen(true);
  };

  // ── Submit add/edit ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!PREDEFINED_TYPES.includes(formData.type) && formData.type.trim()) {
      await fetch('http://localhost:3001/api/bien-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: formData.type.trim() }),
      });
      fetchCustomTypes();
    }
    const url    = editBienId ? `http://localhost:3001/api/biens/${editBienId}` : 'http://localhost:3001/api/biens';
    const method = editBienId ? 'PATCH' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setIsModalOpen(false);
    fetchBiens();
  };

  // ── Close deal ──────────────────────────────────────────────
  const openDeal = (bien) => {
    setSelectedBien(bien);
    const buyers = isVente ? acheteurs : locataires;
    setDealBuyerId(buyers[0]?.id || '');
    setIsDealModalOpen(true);
  };

  const handleCloseDeal = async (e) => {
    e.preventDefault();
    const txType     = selectedBien.transactionType;
    const owner      = txType === 'Vente' ? selectedBien.vendeur : selectedBien.bailleur;
    const commission = owner?.commission ?? 3;

    // Create transaction (controller also updates bien status)
    await fetch('http://localhost:3001/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bienId:        selectedBien.id,
        clientId:      dealBuyerId,
        type:          txType,
        prixFinal:     selectedBien.prix,
        commission,
        dateSignature: new Date().toISOString(),
      }),
    });
    setIsDealModalOpen(false);
    fetchBiens();
  };

  // ── Upload ──────────────────────────────────────────────────
  const openUpload = (bien) => { setSelectedBien(bien); setUploadFiles([]); setIsUploadModalOpen(true); };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files).map(f => ({ file: f, name: f.name }));
    setUploadFiles(prev => [...prev, ...selected]);
    e.target.value = '';
  };

  const removeUploadFile = (idx) => setUploadFiles(prev => prev.filter((_, i) => i !== idx));

  const updateUploadName = (idx, name) => setUploadFiles(prev => prev.map((f, i) => i === idx ? { ...f, name } : f));

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFiles.length || !selectedBien) return;
    setUploading(true);
    await Promise.all(uploadFiles.map(({ file, name }) => {
      const form = new FormData();
      form.append('file',   file);
      form.append('bienId', selectedBien.id);
      form.append('nom',    name || file.name);
      return fetch('http://localhost:3001/api/documents/upload', { method: 'POST', body: form });
    }));
    setUploading(false);
    setUploadFiles([]);
    const data = await fetchBiens();
    refreshBienRefs(data, selectedBien.id);
  };

  const handleDeleteDocument = async (docId, bienId) => {
    if (!confirm('Supprimer ce fichier ?')) return;
    await fetch(`http://localhost:3001/api/documents/${docId}`, { method: 'DELETE' });
    const data = await fetchBiens();
    refreshBienRefs(data, bienId);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce bien ?')) return;
    await fetch(`http://localhost:3001/api/biens/${id}`, { method: 'DELETE' });
    fetchBiens();
  };

  const openDetail = (bien) => { setDetailBien(bien); setPhotoIndex(0); setIsFullscreen(false); };
  const closeDetail = () => { setDetailBien(null); setIsFullscreen(false); };

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  // ── Owners for the current tab ──────────────────────────────
  const owners      = isVente ? vendeurs   : bailleurs;
  const ownerField  = isVente ? 'vendeurId' : 'bailleurId';
  const ownerLabel  = isVente ? 'Vendeur'   : 'Bailleur (propriétaire)';
  const buyers      = isVente ? acheteurs  : locataires;
  const buyerLabel  = isVente ? 'Acheteur'  : 'Locataire';

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Biens Immobiliers</h1>
          <p className="page-subtitle">Catalogue des propriétés en vente et en location.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Ajouter un bien
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--spacing-lg)', borderBottom: '2px solid var(--color-hairline)', paddingBottom: 0 }}>
        {[
          { key: 'vente',    label: `À Vendre (${biens.filter(b => b.transactionType === 'Vente').length})` },
          { key: 'location', label: `À Louer (${biens.filter(b => b.transactionType === 'Location').length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'transparent',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              color: tab === t.key ? 'var(--color-primary)' : 'var(--color-muted)',
              borderBottom: tab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: -2,
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="toolbar">
        <div className="search-bar" style={{ maxWidth: 400 }}>
          <Search className="search-bar-icon" size={16} />
          <input className="input-field" placeholder="Rechercher par adresse ou type..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon"><Building2 size={32} /></div>
          <div className="empty-state-title">Aucun bien {isVente ? 'à vendre' : 'à louer'}</div>
          <div className="empty-state-desc">Ajoutez un bien pour commencer.</div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Ajouter un bien</button>
        </div>
      ) : (
        <div className="bien-grid">
          {filtered.map(bien => {
            const owner  = isVente ? bien.vendeur  : bien.bailleur;
            const buyer  = isVente ? bien.acheteur : bien.locataire;
            const closed = ['Vendu', 'Loué'].includes(bien.statut);
            const cover  = getPhotos(bien)[0];
            return (
              <div key={bien.id} className="bien-card">
                <div className="bien-card-photo">
                  {cover
                    ? <img src={`http://localhost:3001${cover.filePath}`} alt="Bien" />
                    : <Building2 size={48} className="bien-card-photo-icon" />}
                  <div className="bien-card-badges">
                    <Badge statut={bien.statut} />
                    <span className={`badge ${isVente ? 'badge-navy' : 'badge-emerald'}`}>
                      {isVente ? 'Vente' : 'Location'}
                    </span>
                  </div>
                  {/* Hover actions */}
                  <div className="bien-card-actions">
                    <button className="bien-card-action-btn" onClick={() => openEdit(bien)} title="Modifier"><Edit2 size={14} /></button>
                    <button className="bien-card-action-btn" onClick={() => openUpload(bien)} title="Documents"><FileUp size={14} /></button>
                    <button className="bien-card-action-btn delete" onClick={() => handleDelete(bien.id)} title="Supprimer"><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="bien-card-body" style={{ cursor: 'pointer' }} onClick={() => openDetail(bien)}>
                  <div className="bien-card-location">{bien.localisation}</div>
                  <div className="bien-card-meta">{bien.type}</div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                    <span className="meta-row"><BedDouble size={13} /> {bien.pieces} pièces</span>
                    <span className="meta-row"><Ruler size={13} /> {bien.superficie} m²</span>
                  </div>
                  <div className="bien-card-price">
                    {bien.prix.toLocaleString('fr-FR')} MAD
                    {!isVente && <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-muted)' }}> /mois</span>}
                  </div>
                  {owner && (
                    <div className="bien-card-proprietaire" style={{ marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{isVente ? 'Vendeur' : 'Bailleur'} : </span>
                      <strong style={{ fontSize: 12 }}>{owner.nom} {owner.prenom}</strong>
                    </div>
                  )}
                  {buyer && (
                    <div className="bien-card-proprietaire">
                      <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{isVente ? 'Acheteur' : 'Locataire'} : </span>
                      <strong style={{ fontSize: 12 }}>{buyer.nom} {buyer.prenom}</strong>
                    </div>
                  )}

                  {/* Close deal button */}
                  {!closed && buyers.length > 0 && (
                    <button
                      className="btn btn-accent btn-sm"
                      style={{ width: '100%', marginTop: 10, borderRadius: 'var(--rounded-sm)' }}
                      onClick={(e) => { e.stopPropagation(); openDeal(bien); }}
                    >
                      <CheckCircle size={14} />
                      {isVente ? 'Clôturer la vente' : 'Enregistrer la location'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editBienId ? 'Modifier le bien' : `Nouveau bien ${isVente ? 'à vendre' : 'à louer'}`}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={16} /></button>
            </div>
            {owners.length === 0 ? (
              <div className="modal-body">
                <div className="alert alert-warning">
                  Vous devez d'abord ajouter un <strong>{ownerLabel}</strong> dans la section Clients avant de créer un bien.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-grid">
                    <div className="input-group">
                      <label className="input-label">Type de bien</label>
                      <select
                        className="input-field"
                        value={[...PREDEFINED_TYPES, ...customTypes].includes(formData.type) ? formData.type : 'Autre'}
                        onChange={e => {
                          if (e.target.value === 'Autre') setFormData({ ...formData, type: '' });
                          else setFormData({ ...formData, type: e.target.value });
                        }}
                      >
                        {PREDEFINED_TYPES.map(t => <option key={t}>{t}</option>)}
                        {customTypes.filter(t => !PREDEFINED_TYPES.includes(t)).map(t => <option key={t}>{t}</option>)}
                        <option value="Autre">Autre…</option>
                      </select>
                      {![...PREDEFINED_TYPES, ...customTypes].includes(formData.type) && (
                        <input
                          type="text"
                          className="input-field"
                          style={{ marginTop: 6 }}
                          placeholder="Ex : Café, Riad, Atelier…"
                          required
                          value={formData.type}
                          onChange={set('type')}
                        />
                      )}
                    </div>
                    <div className="input-group">
                      <label className="input-label">Statut</label>
                      <select className="input-field" value={formData.statut} onChange={set('statut')}>
                        <option>Disponible</option><option>Réservé</option>
                        {isVente ? <option>Vendu</option> : <option>Loué</option>}
                      </select>
                    </div>
                    <div className="input-group full">
                      <label className="input-label">Localisation</label>
                      <input type="text" className="input-field" required value={formData.localisation} onChange={set('localisation')} placeholder="Quartier, Ville" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Superficie (m²)</label>
                      <input type="number" className="input-field" required value={formData.superficie} onChange={set('superficie')} placeholder="85" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Pièces</label>
                      <input type="number" className="input-field" required value={formData.pieces} onChange={set('pieces')} placeholder="3" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">{isVente ? 'Prix (MAD)' : 'Loyer mensuel (MAD)'}</label>
                      <input type="number" className="input-field" required value={formData.prix} onChange={set('prix')} placeholder={isVente ? '850000' : '5000'} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">{ownerLabel}</label>
                      <select className="input-field" required value={formData[ownerField]} onChange={set(ownerField)}>
                        {owners.map(o => <option key={o.id} value={o.id}>{o.nom} {o.prenom}</option>)}
                      </select>
                    </div>
                    <div className="input-group full">
                      <label className="input-label">Équipements (optionnel)</label>
                      <input type="text" className="input-field" value={formData.equipements} onChange={set('equipements')} placeholder="Meublé, Garage, Balcon…" />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Annuler</button>
                  <button type="submit" className="btn btn-primary">{editBienId ? 'Enregistrer' : 'Ajouter'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Close Deal Modal ── */}
      {isDealModalOpen && selectedBien && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsDealModalOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{isVente ? 'Clôturer la vente' : 'Enregistrer la location'}</h2>
              <button className="modal-close" onClick={() => setIsDealModalOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCloseDeal}>
              <div className="modal-body">
                <div className="alert alert-success" style={{ marginBottom: 16 }}>
                  <strong>{selectedBien.type}</strong> — {selectedBien.localisation} · {selectedBien.prix.toLocaleString('fr-FR')} MAD
                </div>
                {buyers.length === 0 ? (
                  <div className="alert alert-warning">
                    Aucun {buyerLabel.toLowerCase()} enregistré. Ajoutez-en un d'abord.
                  </div>
                ) : (
                  <div className="input-group">
                    <label className="input-label">{buyerLabel}</label>
                    <select className="input-field" required value={dealBuyerId} onChange={e => setDealBuyerId(e.target.value)}>
                      {buyers.map(b => <option key={b.id} value={b.id}>{b.nom} {b.prenom}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsDealModalOpen(false)}>Annuler</button>
                {buyers.length > 0 && (
                  <button type="submit" className="btn btn-accent">
                    <CheckCircle size={16} /> Confirmer
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {detailBien && (() => {
        const photos = getPhotos(detailBien);
        const videos = getVideos(detailBien);
        const docs   = getDocs(detailBien);
        const safeIndex = Math.min(photoIndex, Math.max(photos.length - 1, 0));
        const photo  = photos[safeIndex];
        const dOwner = detailBien.transactionType === 'Vente' ? detailBien.vendeur : detailBien.bailleur;
        const dBuyer = detailBien.transactionType === 'Vente' ? detailBien.acheteur : detailBien.locataire;
        return (
          <>
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeDetail()}>
            <div className="modal" style={{ maxWidth: 760, width: '95vw', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header">
                <h2 className="modal-title">{detailBien.type} — {detailBien.localisation}</h2>
                <button className="modal-close" onClick={closeDetail}><X size={16} /></button>
              </div>

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {/* Photo gallery */}
                {photos.length > 0 ? (
                  <div style={{ position: 'relative', background: '#000', height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={`http://localhost:3001${photo.filePath}`}
                      alt={photo.nom}
                      onClick={() => setIsFullscreen(true)}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', cursor: 'zoom-in' }}
                    />
                    <button
                      onClick={() => setIsFullscreen(true)}
                      title="Voir en plein écran"
                      style={{ position: 'absolute', right: 52, top: 12, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                    ><Maximize2 size={15} /></button>
                    <button
                      onClick={() => handleDeleteDocument(photo.id, detailBien.id)}
                      title="Supprimer cette photo"
                      style={{ position: 'absolute', right: 12, top: 12, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                    ><Trash2 size={15} /></button>
                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                        ><ChevronLeft size={20} /></button>
                        <button
                          onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
                          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                        ><ChevronRight size={20} /></button>
                        <div style={{ position: 'absolute', bottom: 10, right: 14, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 12, borderRadius: 12, padding: '2px 10px' }}>
                          {safeIndex + 1} / {photos.length}
                        </div>
                      </>
                    )}
                    {/* Thumbnail strip */}
                    {photos.length > 1 && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: 4, padding: '0 12px 8px', overflowX: 'auto' }}>
                        {photos.map((p, i) => (
                          <img
                            key={p.id}
                            src={`http://localhost:3001${p.filePath}`}
                            alt=""
                            onClick={() => setPhotoIndex(i)}
                            style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: i === safeIndex ? '2px solid var(--color-accent)' : '2px solid transparent', flexShrink: 0 }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-soft)', color: 'var(--color-muted)' }}>
                    <ImageIcon size={48} />
                  </div>
                )}

                {/* Details */}
                <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                  {[
                    ['Type',        detailBien.type],
                    ['Statut',      detailBien.statut],
                    ['Transaction', detailBien.transactionType],
                    ['Superficie',  `${detailBien.superficie} m²`],
                    ['Pièces',      detailBien.pieces],
                    ['Prix',        `${detailBien.prix?.toLocaleString('fr-FR')} MAD${detailBien.transactionType === 'Location' ? ' /mois' : ''}`],
                    dOwner ? [detailBien.transactionType === 'Vente' ? 'Vendeur' : 'Bailleur', `${dOwner.nom} ${dOwner.prenom}`] : null,
                    dBuyer ? [detailBien.transactionType === 'Vente' ? 'Acheteur' : 'Locataire', `${dBuyer.nom} ${dBuyer.prenom}`] : null,
                    detailBien.equipements ? ['Équipements', detailBien.equipements] : null,
                  ].filter(Boolean).map(([label, value]) => (
                    <div key={label}>
                      <div style={{ fontSize: 11, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Videos */}
                {videos.length > 0 && (
                  <div style={{ padding: '0 24px 20px' }}>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Vidéos</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {videos.map(v => (
                        <div key={v.id} style={{ border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-sm)', overflow: 'hidden' }}>
                          <video src={`http://localhost:3001${v.filePath}`} controls style={{ width: '100%', maxHeight: 260, display: 'block', background: '#000' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px' }}>
                            <span style={{ flex: 1, fontSize: 13 }}>{v.nom}</span>
                            <button type="button" onClick={() => handleDeleteDocument(v.id, detailBien.id)} title="Supprimer cette vidéo" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex', padding: 2 }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {docs.length > 0 && (
                  <div style={{ padding: '0 24px 20px' }}>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Documents</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {docs.map(d => (
                        <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--color-surface-soft)', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)', fontSize: 13 }}>
                          <a
                            href={`http://localhost:3001${d.filePath}`}
                            target="_blank"
                            rel="noreferrer"
                            download
                            style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, color: 'var(--color-ink)', textDecoration: 'none' }}
                          >
                            <Download size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                            <span>{d.nom}</span>
                          </a>
                          <button type="button" onClick={() => handleDeleteDocument(d.id, detailBien.id)} title="Supprimer" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex', padding: 2 }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeDetail}>Fermer</button>
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openUpload(detailBien); }}>
                  <FileUp size={14} /> Gérer photos / vidéos
                </button>
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); closeDetail(); openEdit(detailBien); }}>
                  <Edit2 size={14} /> Modifier
                </button>
              </div>
            </div>
          </div>

          {/* ── Fullscreen photo viewer ── */}
          {isFullscreen && photo && (
            <div
              onClick={() => setIsFullscreen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <button
                onClick={() => setIsFullscreen(false)}
                title="Fermer"
                style={{ position: 'absolute', right: 20, top: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
              ><X size={22} /></button>

              <img
                src={`http://localhost:3001${photo.filePath}`}
                alt={photo.nom}
                onClick={e => e.stopPropagation()}
                style={{ maxHeight: '92vh', maxWidth: '92vw', objectFit: 'contain' }}
              />

              {photos.length > 1 && (
                <>
                  <button
                    onClick={e => { e.stopPropagation(); setPhotoIndex(i => (i - 1 + photos.length) % photos.length); }}
                    style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                  ><ChevronLeft size={24} /></button>
                  <button
                    onClick={e => { e.stopPropagation(); setPhotoIndex(i => (i + 1) % photos.length); }}
                    style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                  ><ChevronRight size={24} /></button>
                  <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, borderRadius: 12, padding: '4px 14px' }}>
                    {safeIndex + 1} / {photos.length}
                  </div>
                </>
              )}
            </div>
          )}
          </>
        );
      })()}

      {/* ── Upload / Media Manager Modal ── */}
      {isUploadModalOpen && selectedBien && (() => {
        const existingPhotos = getPhotos(selectedBien);
        const existingVideos = getVideos(selectedBien);
        const existingDocs   = getDocs(selectedBien);
        return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsUploadModalOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Photos, vidéos & documents</h2>
              <button className="modal-close" onClick={() => setIsUploadModalOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                  {selectedBien.type} — {selectedBien.localisation}
                </div>

                {/* Existing media */}
                {(existingPhotos.length > 0 || existingVideos.length > 0 || existingDocs.length > 0) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fichiers actuels</div>
                    {existingPhotos.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {existingPhotos.map(p => (
                          <div key={p.id} style={{ position: 'relative', width: 72, height: 72 }}>
                            <img src={`http://localhost:3001${p.filePath}`} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)' }} />
                            <button type="button" onClick={() => handleDeleteDocument(p.id, selectedBien.id)} title="Supprimer"
                              style={{ position: 'absolute', top: -6, right: -6, background: 'var(--color-danger)', color: '#fff', border: '2px solid #fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {existingVideos.map(v => (
                      <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--color-surface-soft)', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)' }}>
                        <Film size={14} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13 }}>{v.nom}</span>
                        <button type="button" onClick={() => handleDeleteDocument(v.id, selectedBien.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex', padding: 2 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {existingDocs.map(d => (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--color-surface-soft)', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)' }}>
                        <FileUp size={14} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13 }}>{d.nom}</span>
                        <button type="button" onClick={() => handleDeleteDocument(d.id, selectedBien.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex', padding: 2 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drop zone */}
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, padding: '24px 16px', border: '2px dashed var(--color-hairline)',
                  borderRadius: 'var(--rounded-md)', cursor: 'pointer', background: 'var(--color-surface-soft)',
                  transition: 'border-color 0.15s',
                }}>
                  <FileUp size={24} style={{ color: 'var(--color-muted)' }} />
                  <span style={{ fontSize: 14, color: 'var(--color-muted)' }}>
                    Cliquer pour ajouter — photos, vidéos, PDFs, documents
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-muted-soft)' }}>Plusieurs fichiers autorisés</span>
                  <input type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleFileSelect} />
                </label>

                {/* File list */}
                {uploadFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {uploadFiles.map((f, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--color-surface-soft)', borderRadius: 'var(--rounded-sm)', border: '1px solid var(--color-hairline)' }}>
                        <FileUp size={14} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                        <input
                          type="text"
                          value={f.name}
                          onChange={e => updateUploadName(idx, e.target.value)}
                          style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, outline: 'none', color: 'var(--color-ink)' }}
                        />
                        <span style={{ fontSize: 11, color: 'var(--color-muted-soft)', flexShrink: 0 }}>
                          {(f.file.size / 1024).toFixed(0)} Ko
                        </span>
                        <button type="button" onClick={() => removeUploadFile(idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex', padding: 2 }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsUploadModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={!uploadFiles.length || uploading}>
                  <FileUp size={16} />
                  {uploading ? 'Envoi…' : `Téléverser ${uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}`}
                </button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
