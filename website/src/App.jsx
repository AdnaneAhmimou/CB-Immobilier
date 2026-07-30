import { useState, useEffect } from 'react';
import {
  Building2, Home, Key, TrendingUp, ShieldCheck, Star,
  MapPin, BedDouble, Ruler, Phone, Mail, Clock,
  ArrowRight, Send, CheckCircle, Menu, X, Search,
  ChevronRight, Warehouse, Coffee, Store, Trees,
} from 'lucide-react';
import logo from './assets/cb_no_bg.png';
import { API_URL } from './config';

const API = API_URL;

/* ── Navbar ────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const links = [
    { href: '#accueil', label: 'Accueil' },
    { href: '#biens',   label: 'Nos Biens' },
    { href: '#services',label: 'Services' },
    { href: '#apropos', label: 'À propos' },
    { href: '#contact', label: 'Contact' },
  ];
  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-inner">
          <a href="#accueil" className="navbar-logo">
            <img src={logo} alt="CB Immobilier" className="navbar-logo-img" />
          </a>
          <ul className="navbar-links">
            {links.map(l => <li key={l.href}><a href={l.href}>{l.label}</a></li>)}
          </ul>
          <div className="navbar-actions">
            <a href="tel:+212600000000" className="btn-nav-ghost">+212 6 00 00 00 00</a>
            <a href="#contact" className="btn-nav-primary">Nous contacter</a>
          </div>
          <button className="hamburger" onClick={() => setOpen(o => !o)}>
            <span /><span /><span />
          </button>
        </div>
      </nav>
      <div className={`mobile-menu ${open ? 'open' : ''}`}>
        {links.map(l => <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>)}
        <a href="#contact" className="mobile-menu-cta" onClick={() => setOpen(false)}>Nous contacter</a>
      </div>
    </>
  );
}

/* ── Hero ──────────────────────────────────────────────────── */
function Hero() {
  return (
    <section id="accueil" className="hero">
      {/* Left — photo panel */}
      <div className="hero-photo-panel">
        <div className="hero-bg-img" />
        <div className="hero-photo-overlay">
          <div className="floating-badge">
            <span className="dot" /> Biens vérifiés &amp; certifiés
          </div>
          <div className="floating-stat-cards">
            <div className="floating-card">
              <div className="floating-card-icon"><Building2 size={20} color="white" /></div>
              <div>
                <div className="floating-card-num">200+</div>
                <div className="floating-card-label">Biens vendus avec succès</div>
              </div>
            </div>
            <div className="floating-card">
              <div className="floating-card-icon"><Star size={20} color="white" /></div>
              <div>
                <div className="floating-card-num">98%</div>
                <div className="floating-card-label">Clients satisfaits</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — text panel */}
      <div className="hero-text-panel">
        <div className="hero-text-inner">
          <div className="hero-tag"><Star size={12} fill="currentColor" /> Agence de confiance</div>
          <h1 className="hero-title">
            Trouvez votre<br />
            <span className="gradient-text">bien idéal</span><br />
            au Maroc
          </h1>
          <p className="hero-subtitle">
            CB Immobilier vous accompagne dans tous vos projets immobiliers.
            Vente, achat, location — des conseillers dédiés à chaque étape.
          </p>
          <div className="hero-actions">
            <a href="#biens" className="btn-primary">
              <Building2 size={16} /> Voir nos biens
            </a>
            <a href="#contact" className="btn-secondary">
              Estimation gratuite <ArrowRight size={16} />
            </a>
          </div>
          <div className="hero-trust">
            <div className="trust-avatars">
              {['MA','KA','YB','FO'].map(i => <span key={i}>{i}</span>)}
            </div>
            <div className="trust-text">
              <strong>+500 clients satisfaits</strong>
              <span>Rejoignez nos familles heureuses</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Search ────────────────────────────────────────────────── */
function SearchBar({ activeTab, setActiveTab }) {
  return (
    <div className="search-section">
      <div className="search-card">
        <div className="search-tabs">
          {['Acheter', 'Louer', 'Estimer'].map(t => (
            <button key={t} className={`search-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>
        <div className="search-fields">
          <div className="search-field">
            <label>Type de bien</label>
            <select>
              <option value="">Tous les types</option>
              <option>Appartement</option>
              <option>Villa</option>
              <option>Maison</option>
              <option>Bureau</option>
              <option>Terrain</option>
            </select>
          </div>
          <div className="search-field">
            <label>Localisation</label>
            <input type="text" placeholder="Ville, quartier…" />
          </div>
          <div className="search-field">
            <label>Budget max</label>
            <select>
              <option value="">Tous les budgets</option>
              <option>Moins de 500 000 MAD</option>
              <option>500 000 – 1M MAD</option>
              <option>1M – 3M MAD</option>
              <option>Plus de 3M MAD</option>
            </select>
          </div>
          <div className="search-field">
            <label>Pièces</label>
            <select>
              <option value="">Peu importe</option>
              <option>1 pièce</option>
              <option>2 pièces</option>
              <option>3 pièces</option>
              <option>4+ pièces</option>
            </select>
          </div>
          <a href="#contact" className="btn-search">
            <Search size={16} /> Rechercher
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Categories ────────────────────────────────────────────── */
function Categories({ activeCat, setActiveCat }) {
  const cats = [
    { id: 'all',       icon: <Building2 size={20} />, label: 'Tous' },
    { id: 'appart',    icon: <Home size={20} />,      label: 'Appartements' },
    { id: 'villa',     icon: <Star size={20} />,      label: 'Villas' },
    { id: 'terrain',   icon: <Trees size={20} />,     label: 'Terrains' },
    { id: 'bureau',    icon: <Warehouse size={20} />, label: 'Bureaux' },
    { id: 'commerce',  icon: <Store size={20} />,     label: 'Commerces' },
  ];
  return (
    <section className="categories-section">
      <div className="section-header">
        <div className="section-header-left">
          <div className="section-tag">Catégories</div>
          <h2 className="section-title">Nos types de <span>biens</span></h2>
        </div>
        <a href="#biens" className="section-link">Voir tous les biens <ChevronRight size={14} /></a>
      </div>
      <div className="categories-grid">
        {cats.map(c => (
          <div key={c.id} className={`category-chip ${activeCat === c.id ? 'active' : ''}`} onClick={() => setActiveCat(c.id)}>
            <div className="cat-icon">{c.icon}</div>
            <span className="cat-label">{c.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Biens Grid ────────────────────────────────────────────── */
function FeaturedBiens({ activeTab }) {
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Tous');

  useEffect(() => {
    fetch(`${API}/api/biens/public`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setBiens(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const txFilter = activeTab === 'Louer' ? 'Location' : activeTab === 'Acheter' ? 'Vente' : null;
  const filtered = biens.filter(b => !txFilter || b.transactionType === txFilter);

  return (
    <section id="biens" className="biens-section">
      <div className="section-header" style={{ maxWidth: 1280, margin: '0 auto 32px' }}>
        <div className="section-header-left">
          <div className="section-tag">Propriétés</div>
          <h2 className="section-title">Nos biens <span>disponibles</span></h2>
        </div>
        <a href="#contact" className="section-link">Toutes nos offres <ChevronRight size={14} /></a>
      </div>
      <div className="biens-filter-row">
        {['Tous', 'Vente', 'Location'].map(f => (
          <button key={f} className={`filter-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      {loading ? (
        <div className="biens-empty" style={{ maxWidth: 1280, margin: '0 auto' }}>Chargement…</div>
      ) : filtered.filter(b => filter === 'Tous' || b.transactionType === filter).length === 0 ? (
        <div className="biens-empty">
          <Building2 size={52} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p style={{ fontWeight: 600, fontSize: 16 }}>Aucun bien disponible actuellement</p>
          <p style={{ fontSize: 14, marginTop: 6 }}>Contactez-nous pour connaître nos offres en cours.</p>
        </div>
      ) : (
        <>
          <div className="biens-grid">
            {filtered
              .filter(b => filter === 'Tous' || b.transactionType === filter)
              .map(b => {
                const photo = b.documents?.[0];
                const isLoc = b.transactionType === 'Location';
                return (
                  <div key={b.id} className="bien-card">
                    <div className="bien-card-photo">
                      {photo
                        ? <img src={`${API}${photo.filePath}`} alt={b.type} />
                        : <Building2 size={52} className="photo-placeholder" />
                      }
                      <div className="card-top-badges">
                        <span className="badge-good">✓ Disponible</span>
                        <span className={`badge-type-pill ${isLoc ? 'badge-location' : 'badge-vente'}`}>
                          {isLoc ? 'Location' : 'Vente'}
                        </span>
                      </div>
                      <div className="card-price-overlay">
                        <div className="card-price-main">{b.prix?.toLocaleString('fr-FR')} MAD{isLoc ? '/mois' : ''}</div>
                        <div className="card-price-sub">{b.type} · {b.localisation}</div>
                      </div>
                    </div>
                    <div className="bien-card-body">
                      <div className="bien-card-title">{b.type} — {b.localisation}</div>
                      <div className="bien-card-loc"><MapPin size={12} /> {b.localisation}</div>
                      <div className="bien-card-specs">
                        <div className="spec-item">
                          <span className="spec-value">{b.pieces}</span>
                          <span className="spec-label">Pièces</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-value">{b.superficie}</span>
                          <span className="spec-label">m²</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-value" style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {b.transactionType === 'Vente' ? 'Vente' : 'Louer'}
                          </span>
                          <span className="spec-label">Type</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="biens-cta">
            <a href="#contact" className="btn-navy">
              Voir toutes nos offres <ChevronRight size={16} />
            </a>
          </div>
        </>
      )}
    </section>
  );
}

/* ── Services ──────────────────────────────────────────────── */
function Services() {
  const items = [
    { icon: <Home size={22} />, title: 'Vente immobilière', desc: "Nous vendons votre bien au meilleur prix grâce à notre réseau et notre expertise locale. Estimation gratuite incluse." },
    { icon: <Key size={22} />, title: 'Location', desc: "Trouvez le locataire idéal ou le logement parfait. Contrats, états des lieux et suivi complet pris en charge." },
    { icon: <TrendingUp size={22} />, title: 'Investissement', desc: "Nos experts vous guident vers les meilleures opportunités d'investissement immobilier à fort rendement." },
    { icon: <ShieldCheck size={22} />, title: 'Gestion locative', desc: "Confiez votre patrimoine à nos soins. Loyers, entretien, relations locataires — tout est géré pour vous." },
    { icon: <Star size={22} />, title: 'Estimation gratuite', desc: "Obtenez une estimation précise et gratuite de votre bien par nos experts locaux sous 24h." },
    { icon: <Building2 size={22} />, title: 'Immobilier commercial', desc: "Bureaux, commerces, entrepôts — nous couvrons tous les segments du marché professionnel." },
  ];
  return (
    <section id="services" style={{ padding: '80px 6%', background: 'var(--canvas)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className="section-tag">Nos services</div>
          <h2 className="section-title" style={{ fontSize: 'clamp(26px, 3.5vw, 36px)' }}>
            Tout ce dont vous avez <span>besoin</span>
          </h2>
          <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 500, margin: '12px auto 0', lineHeight: 1.7 }}>
            De la recherche à la signature, nous vous accompagnons à chaque étape de votre projet immobilier.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {items.map((s, i) => (
            <div key={s.title} style={{
              background: i % 2 === 0 ? 'var(--surface)' : 'white',
              border: '1px solid var(--hairline)', borderRadius: 'var(--radius-lg)',
              padding: '28px 28px', transition: 'all 0.2s', cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--navy)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--hairline)'; }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: i % 2 === 0 ? 'rgba(15,60,105,0.08)' : 'rgba(8,143,109,0.08)', color: i % 2 === 0 ? 'var(--navy)' : 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                {s.icon}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── About ─────────────────────────────────────────────────── */
function About() {
  const values = [
    { icon: <ShieldCheck size={18} />, title: 'Confiance', desc: 'Transparence totale à chaque étape de votre projet.' },
    { icon: <Star size={18} />, title: 'Excellence', desc: 'Service premium et conseillers dédiés.' },
    { icon: <TrendingUp size={18} />, title: 'Expertise', desc: "10 ans d'expérience sur le marché local." },
    { icon: <CheckCircle size={18} />, title: 'Engagement', desc: "Présents jusqu'à la signature finale." },
  ];
  return (
    <section id="apropos" className="about-section">
      <div className="about-grid">
        <div className="about-images">
          <div className="about-img-main" />
          <div className="about-img-accent" />
          <div className="about-floating-stat">
            <div>
              <div className="about-stat-num">10+</div>
              <div className="about-stat-lbl">Années d'expérience</div>
            </div>
          </div>
        </div>
        <div className="about-content">
          <div className="section-tag" style={{ marginBottom: 14 }}>À propos de nous</div>
          <h2>Une agence à taille humaine,<br />des résultats <span style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>exceptionnels</span></h2>
          <p>Fondée en 2015, CB Immobilier est une agence immobilière indépendante spécialisée dans la vente et la location de biens résidentiels et commerciaux au Maroc.</p>
          <p>Notre approche repose sur une connaissance approfondie du marché local, une écoute attentive de vos besoins et un accompagnement personnalisé de A à Z.</p>
          <div className="about-values">
            {values.map(v => (
              <div key={v.title} className="value-card">
                <div className="value-icon">{v.icon}</div>
                <h4>{v.title}</h4>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
          <a href="#contact" className="btn-primary">Nous rencontrer <ArrowRight size={16} /></a>
        </div>
      </div>
    </section>
  );
}

/* ── Contact ───────────────────────────────────────────────── */
function Contact() {
  const EMPTY = { nom: '', email: '', telephone: '', sujet: '', message: '' };
  const [form, setForm]     = useState(EMPTY);
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending'); setErrMsg('');
    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Erreur serveur');
      setStatus('success'); setForm(EMPTY);
    } catch (err) {
      setStatus('error'); setErrMsg(err.message || 'Une erreur est survenue.');
    }
  };

  const items = [
    { icon: <Phone size={20} />, label: 'Téléphone', val: '+212 6 00 00 00 00', href: 'tel:+212600000000' },
    { icon: <Mail size={20} />, label: 'Email', val: 'chouaibbimmobilier@gmail.com', href: 'mailto:chouaibbimmobilier@gmail.com' },
    { icon: <MapPin size={20} />, label: 'Adresse', val: 'Casablanca, Maroc', href: null },
    { icon: <Clock size={20} />, label: 'Horaires', val: 'Lun – Sam : 9h – 18h', href: null },
  ];

  return (
    <section id="contact" className="contact-section">
      <div style={{ maxWidth: 1280, margin: '0 auto 48px', textAlign: 'center' }}>
        <div className="section-tag">Contact</div>
        <h2 className="section-title" style={{ fontSize: 'clamp(26px, 3.5vw, 36px)' }}>
          Parlons de votre <span>projet</span>
        </h2>
        <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 480, margin: '10px auto 0', lineHeight: 1.7 }}>
          Notre équipe vous répond sous 24h. Tous vos messages sont traités avec attention.
        </p>
      </div>
      <div className="contact-inner">
        <div className="contact-left">
          <h2>Nous sommes à votre écoute</h2>
          <p>Que vous ayez un projet de vente, d'achat ou de location, un conseiller dédié prendra en charge votre demande rapidement.</p>
          <div className="contact-items">
            {items.map(it => (
              <div key={it.label} className="contact-item">
                <div className="ci-icon">{it.icon}</div>
                <div className="ci-body">
                  <strong>{it.label}</strong>
                  {it.href ? <a href={it.href}>{it.val}</a> : <span>{it.val}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="contact-form-card">
          <h3>Envoyer un message</h3>
          {status === 'success' && (
            <div className="alert alert-success"><CheckCircle size={16} /> Message envoyé ! Nous vous répondrons sous 24h.</div>
          )}
          {status === 'error' && (
            <div className="alert alert-error">{errMsg}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Nom complet <sup>*</sup></label>
                <input className="form-control" type="text" required placeholder="Mohammed Alami" value={form.nom} onChange={set('nom')} />
              </div>
              <div className="form-group">
                <label className="form-label">Email <sup>*</sup></label>
                <input className="form-control" type="email" required placeholder="votre@email.com" value={form.email} onChange={set('email')} />
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input className="form-control" type="tel" placeholder="+212 6 00 00 00 00" value={form.telephone} onChange={set('telephone')} />
              </div>
              <div className="form-group">
                <label className="form-label">Sujet</label>
                <select className="form-control" value={form.sujet} onChange={set('sujet')}>
                  <option value="">Choisir un sujet…</option>
                  <option>Achat immobilier</option>
                  <option>Vente de bien</option>
                  <option>Location</option>
                  <option>Estimation gratuite</option>
                  <option>Gestion locative</option>
                  <option>Autre</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Message <sup>*</sup></label>
                <textarea className="form-control" required rows={5} placeholder="Décrivez votre projet ou posez votre question…" value={form.message} onChange={set('message')} />
              </div>
            </div>
            <button type="submit" className="btn-submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Envoi en cours…' : <><Send size={16} /> Envoyer le message</>}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div>
          <div className="footer-logo">
            <img src={logo} alt="CB Immobilier" className="footer-logo-img" />
          </div>
          <p className="footer-brand-text">Votre agence immobilière de confiance au Maroc. Vente, location et gestion de patrimoine depuis 2015.</p>
        </div>
        <div className="footer-col">
          <h4>Navigation</h4>
          <ul>
            <li><a href="#accueil">Accueil</a></li>
            <li><a href="#biens">Nos biens</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#apropos">À propos</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Services</h4>
          <ul>
            <li><a href="#services">Vente immobilière</a></li>
            <li><a href="#services">Location</a></li>
            <li><a href="#services">Gestion locative</a></li>
            <li><a href="#services">Estimation gratuite</a></li>
            <li><a href="#services">Investissement</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Contact</h4>
          <ul>
            <li><a href="mailto:chouaibbimmobilier@gmail.com">chouaibbimmobilier@gmail.com</a></li>
            <li><a href="tel:+212600000000">+212 6 00 00 00 00</a></li>
            <li><a href="#contact">Casablanca, Maroc</a></li>
            <li><a href="#contact">Lun – Sam : 9h – 18h</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p>© {new Date().getFullYear()} CB Immobilier. Tous droits réservés.</p>
          <div className="footer-socials">
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="Instagram">in</a>
            <a href="#" aria-label="WhatsApp">w</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── App ───────────────────────────────────────────────────── */
export default function App() {
  const [activeTab, setActiveTab] = useState('Acheter');
  const [activeCat, setActiveCat] = useState('all');
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SearchBar activeTab={activeTab} setActiveTab={setActiveTab} />
        <Categories activeCat={activeCat} setActiveCat={setActiveCat} />
        <FeaturedBiens activeTab={activeTab} />
        <Services />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
