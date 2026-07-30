import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, ShoppingBag, Home, MapPin,
  UserSearch, User, CalendarClock, TrendingUp, Receipt, Shuffle, FolderOpen, BarChart2, UserCog,
  Menu, X,
} from 'lucide-react';
import logo from '../assets/cb_immobilier_logo.jpeg';

// Satellite view (data=!3m2!1e3), zoomed to city level
const EL_JADIDA_MAPS_URL = 'https://www.google.com/maps/place/El+Jadida/@33.2334454,-8.5448642,11879m/data=!3m2!1e3!4b1!4m6!3m5!1s0xda91dc1b421fe47:0x307cf87fb6b01a1f!8m2!3d33.2347178!4d-8.5027492!16zL20vMDNodjly?entry=ttu&g_ep=EgoyMDI2MDcxMi4wIKXMDSoASAFQAw%3D%3D';

const sections = [
  {
    label: null,
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Tableau de Bord', exact: true },
    ],
  },
  {
    label: null,
    items: [
      { to: EL_JADIDA_MAPS_URL, icon: MapPin, label: 'Carte', external: true },
    ],
  },
  {
    label: 'Biens',
    items: [
      { to: '/biens/vente',    icon: ShoppingBag, label: 'À Vendre' },
      { to: '/biens/location', icon: Home,        label: 'À Louer'  },
    ],
  },
  {
    label: 'Clients',
    items: [
      { to: '/clients',     icon: Users,      label: 'Tous les clients' },
      { to: '/acheteurs',   icon: UserSearch, label: 'Acheteurs'        },
      { to: '/locataires',  icon: User,       label: 'Locataires'       },
      { to: '/vendeurs',    icon: Building2,  label: 'Vendeurs'         },
      { to: '/bailleurs',   icon: Home,       label: 'Bailleurs'        },
    ],
  },
  {
    label: 'Activité',
    items: [
      { to: '/matching',     icon: Shuffle,       label: 'Matching'     },
      { to: '/visites',      icon: CalendarClock, label: 'Visites'      },
      { to: '/offres',       icon: TrendingUp,    label: 'Offres'       },
      { to: '/transactions', icon: Receipt,       label: 'Factures' },
      { to: '/documents',    icon: FolderOpen,    label: 'Documents'    },
      { to: '/finances',     icon: BarChart2,     label: 'Finances'     },
    ],
  },
  {
    label: 'Équipe',
    items: [
      { to: '/agents', icon: UserCog, label: 'Agents' },
    ],
  },
];

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close the drawer automatically whenever the route changes
  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const navContent = (
    <>
      <div className="sidebar-header">
        <img src={logo} alt="CB Immobilier" className="sidebar-logo-img" />
        <div className="sidebar-brand">
          <span className="sidebar-brand-name">CB Immobilier</span>
          <span className="sidebar-brand-sub">Gestion Immobilière</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <span className="sidebar-section-label">{section.label}</span>
            )}
            {section.items.map(({ to, icon: Icon, label, exact, external }) => (
              external ? (
                <a key={to} href={to} target="_blank" rel="noreferrer" className="sidebar-link">
                  <Icon className="sidebar-link-icon" size={17} />
                  {label}
                </a>
              ) : (
                <NavLink
                  key={to}
                  to={to}
                  end={!!exact}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                  <Icon className="sidebar-link-icon" size={17} />
                  {label}
                </NavLink>
              )
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-agent">
          <div className="sidebar-agent-avatar">CB</div>
          <div className="sidebar-agent-info">
            <div className="sidebar-agent-name">CB Immobilier</div>
            <div className="sidebar-agent-role">Agent Immobilier</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="mobile-topbar">
        <button className="mobile-topbar-menu-btn" onClick={() => setIsOpen(true)} title="Menu" aria-label="Ouvrir le menu">
          <Menu size={20} />
        </button>
        <img src={logo} alt="" className="mobile-topbar-logo" />
        <span className="mobile-topbar-name">CB Immobilier</span>
      </div>

      <div className={`sidebar-overlay${isOpen ? ' open' : ''}`} onClick={() => setIsOpen(false)} />

      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        <button className="mobile-topbar-menu-btn sidebar-close-btn" onClick={() => setIsOpen(false)} title="Fermer" aria-label="Fermer le menu">
          <X size={18} />
        </button>
        {navContent}
      </aside>
    </>
  );
}

export default Sidebar;
