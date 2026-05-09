import { useState, useEffect, useRef } from 'react';
import {
  Building2, Home, Key, TrendingUp, ShieldCheck, Star, MapPin,
  BedDouble, Ruler, Phone, Mail, Clock, ArrowRight, Send,
  CheckCircle, Menu, X, ChevronRight,
} from 'lucide-react';

const API = 'http://localhost:3000';

// ── Navbar ────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
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
            <div className="navbar-logo-mark"><span>CB</span></div>
            <span className="navbar-logo-text"><span>CB</span> Immobilier</span>
          </a>
          <ul className="navbar-links">
            {navLinks.map(l => <li key={l.href}><a href={l.href}>{l.label}</a></li>)}
          </ul>
          <a href="#contact" className="navbar-cta">Nous contacter</a>
          <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {navLinks.map(l => (
          <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>
        ))}
        <a href="#contact" className="mobile-menu-cta" onClick={() => setMenuOpen(false)}>
          Nous contacter
        </a>
      </div>
    </>
  );
}

// ── Hero ──────────────────────────────────────────────────
function Hero() {
  return (
    <section id="accueil" className="hero">
      <div className="hero-bg-pattern" />
      <div className="hero-content">
        <div className="hero-badge">
          <Star size={13} fill="currentColor" /> Agence de confiance depuis 2015
        </div>
        <h1 className="hero-title">
          Votre bien idéal<br /><span>commence ici</span>
        </h1>
        <p className="hero-subtitle">
          CB Immobilier vous accompagne dans tous vos projets immobiliers au Maroc —
          achat, vente, location. Des conseillers dédiés, des biens sélectionnés avec soin.
        </p>
        <div className="hero-actions">
          <a href="#biens" className="btn-white">
            <Building2 size={16} /> Voir nos biens
          </a>
          <a href="#contact" className="btn-outline-white">
            Nous contacter <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Stats ─────────────────────────────────────────────────
function Stats() {
  const items = [
    { number: '200+', label: 'Biens vendus' },
    { number: '500+', label: 'Clients satisfaits' },
    { number: '10+',  label: "Années d'expérience" },
    { number: '98%',  label: 'Taux de satisfaction' },
  ];
  return (
    <div className="stats">
      <div className="stats-inner">
        {items.map(s => (
          <div key={s.label} className="stat-item">
            <div className="stat-number">{s.number}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Services ──────────────────────────────────────────────
function Services() {
  const services = [
    { icon: <Home size={24} />, color: 'navy', title: 'Vente immobilière', desc: "Nous vous aidons à vendre votre bien au meilleur prix. Estimation gratuite, mise en valeur professionnelle et négociation experte." },
    { icon: <Key size={24} />, color: 'emerald', title: 'Location', desc: "Trouvez le locataire idéal ou le logement parfait. Gestion des contrats, états des lieux et suivi complet inclus." },
    { icon: <TrendingUp size={24} />, color: 'navy', title: 'Investissement', desc: "Nos experts vous guident vers les meilleures opportunités d'investissement immobilier à fort rendement." },
    { icon: <ShieldCheck size={24} />, color: 'emerald', title: 'Gestion locative', desc: "Confiez-nous la gestion de votre patrimoine. Loyers, entretien, relations locataires — tout est géré pour vous." },
    { icon: <Star size={24} />, color: 'navy', title: 'Estimation gratuite', desc: "Obtenez une estimation précise et gratuite de votre bien immobilier par nos experts locaux sous 24h." },
    { icon: <Building2 size={24} />, color: 'emerald', title: 'Immobilier commercial', desc: "Bureaux, locaux commerciaux, entrepôts — nous couvrons tous les segments du marché professionnel." },
  ];
  return (
    <section id="services" className="section">
      <div className="container">
        <div className="section-header">
          <div className="section-tag">Nos services</div>
          <h2 className="section-title">Tout ce dont vous avez besoin</h2>
          <p className="section-subtitle">De la recherche à la signature, nous vous accompagnons à chaque étape de votre projet immobilier.</p>
        </div>
        <div className="services-grid">
          {services.map(s => (
            <div key={s.title} className="service-card">
              <div className={`service-icon ${s.color}`}>{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Featured Biens ────────────────────────────────────────
function FeaturedBiens() {
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/biens/public`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setBiens(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section id="biens" className="section section-soft">
      <div className="container">
        <div className="section-header">
          <div className="section-tag">Biens disponibles</div>
          <h2 className="section-title">Nos propriétés à la une</h2>
          <p className="section-subtitle">Découvrez notre sélection de biens disponibles à la vente et à la location.</p>
        </div>

        {loading ? (
          <div className="biens-empty">Chargement des biens…</div>
        ) : biens.length === 0 ? (
          <div className="biens-empty">
            <Building2 size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p>Aucun bien disponible pour le moment.</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>Contactez-nous pour connaître nos offres en cours.</p>
          </div>
        ) : (
          <>
            <div className="biens-grid">
              {biens.map(b => {
                const photo = b.documents?.[0];
                const isLocation = b.transactionType === 'Location';
                return (
                  <div key={b.id} className="bien-card">
                    <div className="bien-card-photo">
                      {photo
                        ? <img src={`${API}${photo.filePath}`} alt={b.type} />
                        : <Building2 size={52} className="bien-card-photo-placeholder" />
                      }
                      <div className="bien-badges">
                        <span className="badge-type">{b.type}</span>
                        <span className={`badge-tx ${isLocation ? 'badge-location' : 'badge-vente'}`}>
                          {isLocation ? 'Location' : 'Vente'}
                        </span>
                      </div>
                    </div>
                    <div className="bien-card-body">
                      <div className="bien-card-loc"><MapPin size={12} /> {b.localisation}</div>
                      <div className="bien-card-title">{b.type} — {b.localisation}</div>
                      <div className="bien-card-meta">
                        <span className="bien-meta-item"><BedDouble size={13} /> {b.pieces} pièces</span>
                        <span className="bien-meta-item"><Ruler size={13} /> {b.superficie} m²</span>
                      </div>
                      <div className="bien-card-footer">
                        <div className="bien-card-price">
                          {b.prix?.toLocaleString('fr-FR')} MAD
                          {isLocation && <span> /mois</span>}
                        </div>
                        <a href="#contact" className="btn-contact-bien">
                          Renseignements
                        </a>
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
      </div>
    </section>
  );
}

// ── About ─────────────────────────────────────────────────
function About() {
  const values = [
    { icon: <ShieldCheck size={18} />, title: 'Confiance', desc: 'Transparence totale à chaque étape.' },
    { icon: <Star size={18} />, title: 'Excellence', desc: 'Service premium pour chaque client.' },
    { icon: <TrendingUp size={18} />, title: 'Expertise', desc: "10 ans d'expérience locale." },
    { icon: <CheckCircle size={18} />, title: 'Engagement', desc: 'Présents jusqu\'à la signature.' },
  ];
  return (
    <section id="apropos" className="section">
      <div className="container">
        <div className="about-grid">
          <div className="about-visual">
            <div className="about-visual-inner">
              <div style={{ fontSize: 72, marginBottom: 16 }}>🏠</div>
              <div className="about-visual-text">
                CB Immobilier<br />
                <span style={{ fontWeight: 400, fontSize: 16, opacity: 0.8 }}>Votre partenaire immobilier</span>
              </div>
            </div>
          </div>
          <div className="about-text">
            <div className="section-tag" style={{ marginBottom: 12 }}>À propos</div>
            <h2>Une agence à taille humaine, des résultats à la hauteur</h2>
            <p>
              Fondée en 2015, CB Immobilier est une agence immobilière indépendante spécialisée dans
              la vente et la location de biens résidentiels et commerciaux au Maroc.
            </p>
            <p>
              Notre approche repose sur une connaissance approfondie du marché local, une écoute
              attentive de vos besoins et un accompagnement personnalisé de A à Z. Que vous soyez
              vendeur, acheteur, bailleur ou locataire, nous avons la solution adaptée.
            </p>
            <div className="about-values">
              {values.map(v => (
                <div key={v.title} className="about-value">
                  <div className="about-value-icon">{v.icon}</div>
                  <div>
                    <h4>{v.title}</h4>
                    <p>{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Contact ───────────────────────────────────────────────
function Contact() {
  const EMPTY = { nom: '', email: '', telephone: '', sujet: '', message: '' };
  const [form, setForm]       = useState(EMPTY);
  const [status, setStatus]   = useState('idle'); // idle | sending | success | error
  const [errMsg, setErrMsg]   = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrMsg('');
    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur serveur');
      }
      setStatus('success');
      setForm(EMPTY);
    } catch (err) {
      setStatus('error');
      setErrMsg(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    }
  };

  const contactItems = [
    { icon: <Phone size={20} />, label: 'Téléphone', value: '+212 6 00 00 00 00', href: 'tel:+212600000000' },
    { icon: <Mail size={20} />, label: 'Email', value: 'chouaibbimmobilier@gmail.com', href: 'mailto:chouaibbimmobilier@gmail.com' },
    { icon: <MapPin size={20} />, label: 'Adresse', value: 'Casablanca, Maroc', href: null },
    { icon: <Clock size={20} />, label: 'Horaires', value: 'Lun – Sam : 9h – 18h', href: null },
  ];

  return (
    <section id="contact" className="section section-soft">
      <div className="container">
        <div className="section-header">
          <div className="section-tag">Contact</div>
          <h2 className="section-title">Parlons de votre projet</h2>
          <p className="section-subtitle">Notre équipe vous répond sous 24h. Tous vos messages sont traités avec attention.</p>
        </div>
        <div className="contact-grid">
          <div className="contact-info">
            <h3>Nous sommes à votre écoute</h3>
            <p>
              Que vous ayez un projet de vente, d'achat ou de location, n'hésitez pas à nous
              contacter. Un conseiller dédié prendra en charge votre demande.
            </p>
            <div className="contact-items">
              {contactItems.map(item => (
                <div key={item.label} className="contact-item">
                  <div className="contact-item-icon">{item.icon}</div>
                  <div className="contact-item-body">
                    <strong>{item.label}</strong>
                    {item.href
                      ? <a href={item.href}><span>{item.value}</span></a>
                      : <span>{item.value}</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="contact-form-card">
            <h3>Envoyer un message</h3>
            {status === 'success' && (
              <div className="form-success">
                <CheckCircle size={16} style={{ display: 'inline', marginRight: 6 }} />
                Message envoyé ! Nous vous répondrons sous 24h.
              </div>
            )}
            {status === 'error' && (
              <div className="form-error-msg">{errMsg}</div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nom complet <span>*</span></label>
                  <input className="form-input" type="text" required placeholder="Mohammed Alami" value={form.nom} onChange={set('nom')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email <span>*</span></label>
                  <input className="form-input" type="email" required placeholder="votre@email.com" value={form.email} onChange={set('email')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input className="form-input" type="tel" placeholder="+212 6 00 00 00 00" value={form.telephone} onChange={set('telephone')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Sujet</label>
                  <select className="form-select" value={form.sujet} onChange={set('sujet')}>
                    <option value="">Choisir un sujet…</option>
                    <option>Achat immobilier</option>
                    <option>Vente de bien</option>
                    <option>Location</option>
                    <option>Estimation gratuite</option>
                    <option>Gestion locative</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Message <span>*</span></label>
                  <textarea className="form-textarea" required placeholder="Décrivez votre projet ou posez votre question…" value={form.message} onChange={set('message')} />
                </div>
              </div>
              <button type="submit" className="form-submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Envoi en cours…' : <><Send size={16} /> Envoyer le message</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────
function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div className="footer-logo-mark"><span>CB</span></div>
            <span className="footer-logo-name">CB Immobilier</span>
          </div>
          <p>Votre agence immobilière de confiance au Maroc. Vente, location et gestion de patrimoine.</p>
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
        <p>© {year} CB Immobilier. Tous droits réservés.</p>
        <div className="footer-social">
          <a href="#" aria-label="Facebook">f</a>
          <a href="#" aria-label="Instagram">in</a>
          <a href="#" aria-label="WhatsApp">w</a>
        </div>
      </div>
    </footer>
  );
}

// ── App ───────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <FeaturedBiens />
        <Services />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
