import { useState, useEffect } from 'react';
import { Receipt, TrendingUp, Home, BarChart2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function StatCard({ icon: Icon, label, value, sub, iconClass }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className={`stat-card-icon ${iconClass}`}><Icon size={20} /></div>
      </div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-footer"><span className="stat-card-sub">{sub}</span></div>}
    </div>
  );
}

function fmt(n) {
  return (n ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

export default function Finances() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/stats/finances')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-content" style={{ color: 'var(--color-muted)', fontSize: 14, paddingTop: 40 }}>Chargement…</div>;

  const monthly  = data?.monthly  ?? [];
  const maxValue = Math.max(...monthly.map(m => m.vente + m.location), 1);

  const venteRatio    = data?.totalCommissions > 0 ? (data.totalVente    / data.totalCommissions) * 100 : 0;
  const locationRatio = data?.totalCommissions > 0 ? (data.totalLocation / data.totalCommissions) * 100 : 0;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Suivi Financier</h1>
          <p className="page-subtitle">Commissions perçues, revenus mensuels et performance de l'agence.</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="stats-grid">
        <StatCard icon={Receipt}   label="Total commissions"   value={`${fmt(data?.totalCommissions)} MAD`}  sub="Depuis le début"           iconClass="emerald" />
        <StatCard icon={BarChart2} label="Ce mois"             value={`${fmt(data?.thisMois)} MAD`}          sub={data?.thisMoisLabel ?? ''}  iconClass="blue"    />
        <StatCard icon={TrendingUp} label="Cette année"        value={`${fmt(data?.thisYear)} MAD`}           sub="Cumul annuel"              iconClass="navy"    />
        <StatCard icon={Home}      label="Transactions"        value={data?.nbTransactions ?? 0}             sub="Ventes + locations closes" iconClass="orange"  />
      </div>

      <div className="finances-split" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--spacing-lg)', alignItems: 'start' }}>

        {/* Monthly bar chart */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 24 }}>Commissions mensuelles (12 derniers mois)</h3>
          {monthly.every(m => m.vente + m.location === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-muted)', fontSize: 13 }}>
              Aucune transaction enregistrée pour le moment.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180, padding: '0 4px' }}>
              {monthly.map((m, i) => {
                const total  = m.vente + m.location;
                const height = maxValue > 0 ? Math.round((total / maxValue) * 160) : 0;
                const isLast = i === monthly.length - 1;
                return (
                  <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    {total > 0 && (
                      <div style={{ fontSize: 9, color: 'var(--color-muted)', whiteSpace: 'nowrap', transform: 'rotate(-30deg)', marginBottom: 2 }}>
                        {fmt(total)}
                      </div>
                    )}
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 160, gap: 0 }}>
                      {m.location > 0 && (
                        <div style={{
                          height: Math.round((m.location / maxValue) * 160),
                          background: 'var(--color-accent)',
                          borderRadius: m.vente === 0 ? '4px 4px 0 0' : '0',
                          opacity: isLast ? 1 : 0.8,
                        }} title={`Location: ${fmt(m.location)} MAD`} />
                      )}
                      {m.vente > 0 && (
                        <div style={{
                          height: Math.round((m.vente / maxValue) * 160),
                          background: 'var(--color-primary)',
                          borderRadius: m.location === 0 ? '4px 4px 0 0' : '4px 4px 0 0',
                          opacity: isLast ? 1 : 0.8,
                        }} title={`Vente: ${fmt(m.vente)} MAD`} />
                      )}
                      {total === 0 && (
                        <div style={{ height: 3, background: 'var(--color-hairline)', borderRadius: 4 }} />
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: isLast ? 'var(--color-primary)' : 'var(--color-muted)', fontWeight: isLast ? 700 : 400, whiteSpace: 'nowrap' }}>
                      {m.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Legend */}
          <div style={{ display: 'flex', gap: 20, marginTop: 16, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-muted)' }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--color-primary)' }} /> Vente
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-muted)' }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--color-accent)' }} /> Location
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>

          {/* Vente vs Location split */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>Répartition</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Vente', value: data?.totalVente ?? 0, ratio: venteRatio, color: 'var(--color-primary)' },
                { label: 'Location', value: data?.totalLocation ?? 0, ratio: locationRatio, color: 'var(--color-accent)' },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{row.label}</span>
                    <span style={{ color: 'var(--color-muted)' }}>{fmt(row.value)} MAD</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--color-hairline)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${row.ratio}%`, background: row.color, borderRadius: 99, transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>{row.ratio.toFixed(1)}% du total</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick link */}
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 10 }}>Toutes les transactions</div>
            <Link to="/transactions" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
              Voir les transactions <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      {data?.recent?.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--spacing-lg)', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-hairline)' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Dernières transactions</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bien</th>
                <th>Client</th>
                <th>Type</th>
                <th>Prix final</th>
                <th>Commission</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map(t => (
                <tr key={t.id}>
                  <td data-label="Date" style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                    {new Date(t.dateSignature || t.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td data-label="Bien" style={{ fontSize: 13 }}>{t.bien?.type} — {t.bien?.localisation}</td>
                  <td data-label="Client" style={{ fontSize: 13 }}>{t.client?.nom} {t.client?.prenom}</td>
                  <td data-label="Type">
                    <span className={`badge ${t.type === 'Vente' ? 'badge-navy' : 'badge-emerald'}`} style={{ fontSize: 10 }}>
                      {t.type}
                    </span>
                  </td>
                  <td data-label="Prix final" style={{ fontWeight: 600, fontSize: 13 }}>{fmt(t.prixFinal)} MAD</td>
                  <td data-label="Commission" style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: 13 }}>{fmt(t.commission)} MAD</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
