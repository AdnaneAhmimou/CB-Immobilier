import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, ShoppingBag, Home,
  UserSearch, User, CalendarClock, TrendingUp, Receipt, Shuffle, FolderOpen, BarChart2, UserCog,
} from 'lucide-react';
import logo from '../assets/cb_immobilier_logo.jpeg';

const sections = [
  {
    label: null,
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Tableau de Bord', exact: true },
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
      { to: '/transactions', icon: Receipt,       label: 'Transactions' },
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

  return (
    <aside className="sidebar">
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
            {section.items.map(({ to, icon: Icon, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={!!exact}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <Icon className="sidebar-link-icon" size={17} />
                {label}
              </NavLink>
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
    </aside>
  );
}

export default Sidebar;
