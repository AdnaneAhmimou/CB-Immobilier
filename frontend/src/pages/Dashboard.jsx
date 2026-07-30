import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, UserCheck, CalendarClock, TrendingUp, Receipt, ArrowRight } from 'lucide-react';

function StatCard({ icon: Icon, label, value, iconClass, sub, linkTo }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className={`stat-card-icon ${iconClass}`}><Icon size={20} /></div>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-footer">
        <span className="stat-card-sub">{sub}</span>
        {linkTo && (
          <Link to={linkTo} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>
            Voir <ArrowRight size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting}, CB Immobilier</h1>
          <p className="page-subtitle">Voici le résumé de l'activité de l'agence aujourd'hui.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-muted)', fontSize: 14 }}>Chargement…</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard icon={Building2} label="Biens Immobiliers" value={stats?.counts?.biens ?? 0} iconClass="navy"
              sub={`${stats?.biens?.disponibles ?? 0} disponibles`} linkTo="/biens" />
            <StatCard icon={Users} label="Clients" value={stats?.counts?.clients ?? 0} iconClass="blue"
              sub="Acheteurs & locataires" linkTo="/clients" />
            <StatCard icon={UserCheck} label="Vendeurs & Bailleurs" value={(stats?.counts?.vendeurs ?? 0) + (stats?.counts?.bailleurs ?? 0)} iconClass="purple"
              sub="Mandants enregistrés" linkTo="/clients" />
            <StatCard icon={CalendarClock} label="Visites" value={stats?.counts?.visites ?? 0} iconClass="orange"
              sub="Rendez-vous planifiés" linkTo="/visites" />
            <StatCard icon={TrendingUp} label="Offres" value={stats?.counts?.offres ?? 0} iconClass="emerald"
              sub={`${stats?.offres?.enCours ?? 0} en cours`} linkTo="/offres" />
            <StatCard icon={Receipt} label="Transactions" value={stats?.counts?.transactions ?? 0} iconClass="green"
              sub={`${(stats?.finances?.totalCommissions ?? 0).toLocaleString('fr-FR')} MAD commissions`} linkTo="/transactions" />
          </div>

          <div className="dashboard-activity-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
            <div className="card">
              <h3 className="card-title">Dernières Visites</h3>
              {stats?.recentVisites?.length > 0 ? (
                <div className="activity-list">
                  {stats.recentVisites.map(v => (
                    <div key={v.id} className="activity-item">
                      <div className="activity-dot blue" />
                      <div className="activity-text">
                        <strong>{v.client?.nom} {v.client?.prenom}</strong> — {v.bien?.type} à {v.bien?.localisation}
                      </div>
                      <span className="activity-time">{formatDate(v.date)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: 'var(--color-muted)', padding: '16px 0' }}>Aucune visite enregistrée.</p>
              )}
              <Link to="/visites" className="btn btn-secondary btn-sm" style={{ marginTop: 16 }}>
                Voir toutes les visites <ArrowRight size={14} />
              </Link>
            </div>

            <div className="card">
              <h3 className="card-title">Dernières Transactions</h3>
              {stats?.recentTransactions?.length > 0 ? (
                <div className="activity-list">
                  {stats.recentTransactions.map(t => (
                    <div key={t.id} className="activity-item">
                      <div className="activity-dot green" />
                      <div className="activity-text">
                        <strong>{t.client?.nom} {t.client?.prenom}</strong> — {t.type} conclue pour {t.prixFinal?.toLocaleString('fr-FR')} MAD
                      </div>
                      <span className="activity-time">{formatDate(t.createdAt)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: 'var(--color-muted)', padding: '16px 0' }}>Aucune transaction enregistrée.</p>
              )}
              <Link to="/transactions" className="btn btn-secondary btn-sm" style={{ marginTop: 16 }}>
                Voir toutes les transactions <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
