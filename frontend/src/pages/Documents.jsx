import { useState, useEffect } from 'react';
import { Search, FileText, FileImage, File, Trash2, Download, FolderOpen, Plus, X, FileUp } from 'lucide-react';

function fileIcon(filePath) {
  const ext = filePath?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FileImage size={20} />;
  if (['pdf'].includes(ext)) return <FileText size={20} style={{ color: 'var(--color-danger)' }} />;
  return <File size={20} />;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fileSize(path) {
  const ext = path?.split('.').pop()?.toLowerCase();
  return ext?.toUpperCase() || 'FILE';
}

export default function Documents() {
  const [docs, setDocs]           = useState([]);
  const [biens, setBiens]         = useState([]);
  const [clients, setClients]     = useState([]);
  const [search, setSearch]       = useState('');
  const [filterBien, setFilterBien] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadFile, setUploadFile]   = useState(null);
  const [uploadName, setUploadName]   = useState('');
  const [uploadBienId, setUploadBienId]     = useState('');
  const [uploadClientId, setUploadClientId] = useState('');


  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = () => {
    fetch('http://localhost:3001/api/documents')
      .then(r => r.json())
      .then(setDocs);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce document ?')) return;
    await fetch(`http://localhost:3001/api/documents/${id}`, { method: 'DELETE' });
    fetchDocs();
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    const form = new FormData();
    form.append('file', uploadFile);
    form.append('nom', uploadName || uploadFile.name);
    if (uploadBienId)   form.append('bienId',   uploadBienId);
    if (uploadClientId) form.append('clientId', uploadClientId);
    await fetch('http://localhost:3001/api/documents/upload', { method: 'POST', body: form });
    setIsModalOpen(false);
    setUploadFile(null);
    setUploadName('');
    setUploadBienId('');
    setUploadClientId('');
    fetchDocs();
  };

  const filtered = docs.filter(d => {
    const q = search.toLowerCase();
    const nameMatch = !q || d.nom.toLowerCase().includes(q) ||
      d.bien?.localisation?.toLowerCase().includes(q) ||
      `${d.client?.nom} ${d.client?.prenom}`.toLowerCase().includes(q);
    const bienMatch = !filterBien || d.bienId === filterBien;
    return nameMatch && bienMatch;
  });

  // Group by bien (null bien = documents clients or orphans)
  const grouped = filtered.reduce((acc, doc) => {
    const key = doc.bienId || '__client__';
    if (!acc[key]) acc[key] = { label: doc.bien ? `${doc.bien.type} — ${doc.bien.localisation}` : 'Documents clients', docs: [] };
    acc[key].docs.push(doc);
    return acc;
  }, {});

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">Centralisez titres fonciers, compromis, baux et tous les papiers officiels.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Ajouter un document
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ maxWidth: 360 }}>
          <Search className="search-bar-icon" size={16} />
          <input className="input-field" placeholder="Rechercher un document…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field" style={{ maxWidth: 280 }} value={filterBien} onChange={e => setFilterBien(e.target.value)}>
          <option value="">Tous les biens</option>
          {biens.map(b => <option key={b.id} value={b.id}>{b.type} — {b.localisation}</option>)}
        </select>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
        {[
          { label: 'Total documents', value: docs.length },
          { label: 'Biens couverts',  value: new Set(docs.filter(d => d.bienId).map(d => d.bienId)).size },
          { label: 'Résultats filtrés', value: filtered.length },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '10px 20px', minWidth: 140, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon"><FolderOpen size={32} /></div>
          <div className="empty-state-title">Aucun document</div>
          <div className="empty-state-desc">Ajoutez des documents pour les retrouver facilement ici.</div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={16} /> Ajouter</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {Object.entries(grouped).map(([key, group]) => (
            <div key={key} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-hairline)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FolderOpen size={15} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>{group.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-muted)' }}>{group.docs.length} fichier{group.docs.length > 1 ? 's' : ''}</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fichier</th>
                    <th>Lié à</th>
                    <th>Date</th>
                    <th style={{ width: 80 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.docs.map(doc => (
                    <tr key={doc.id}>
                      <td data-label="Fichier">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ color: 'var(--color-muted)' }}>{fileIcon(doc.filePath)}</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{doc.nom}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{fileSize(doc.filePath)}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Lié à" style={{ fontSize: 13 }}>
                        {doc.bien && <div style={{ color: 'var(--color-ink)' }}>{doc.bien.type} — {doc.bien.localisation}</div>}
                        {doc.client && <div style={{ color: 'var(--color-muted)' }}>{doc.client.nom} {doc.client.prenom}</div>}
                        {!doc.bien && !doc.client && <span style={{ color: 'var(--color-muted)' }}>—</span>}
                      </td>
                      <td data-label="Date" style={{ fontSize: 13, color: 'var(--color-muted)' }}>{formatDate(doc.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', width: '100%' }}>
                          <a
                            href={`http://localhost:3001${doc.filePath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Télécharger"
                          >
                            <Download size={14} />
                          </a>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => handleDelete(doc.id)}
                            title="Supprimer"
                            style={{ color: 'var(--color-danger)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Ajouter un document</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group full">
                    <label className="input-label">Fichier</label>
                    <input type="file" className="input-field" style={{ height: 'auto', padding: 8 }} required onChange={e => { setUploadFile(e.target.files[0]); if (!uploadName) setUploadName(e.target.files[0]?.name || ''); }} />
                  </div>
                  <div className="input-group full">
                    <label className="input-label">Nom du document</label>
                    <input type="text" className="input-field" placeholder="Titre foncier, Compromis de vente…" value={uploadName} onChange={e => setUploadName(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Bien associé (optionnel)</label>
                    <select className="input-field" value={uploadBienId} onChange={e => setUploadBienId(e.target.value)}>
                      <option value="">Aucun</option>
                      {biens.map(b => <option key={b.id} value={b.id}>{b.type} — {b.localisation}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Client associé (optionnel)</label>
                    <select className="input-field" value={uploadClientId} onChange={e => setUploadClientId(e.target.value)}>
                      <option value="">Aucun</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.nom} {c.prenom} ({c.type})</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary"><FileUp size={14} /> Téléverser</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
