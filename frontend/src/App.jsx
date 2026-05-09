import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Biens from './pages/Biens';
import Visites from './pages/Visites';
import Offres from './pages/Offres';
import Transactions from './pages/Transactions';
import Matching from './pages/Matching';
import Documents from './pages/Documents';
import Finances from './pages/Finances';
import Agents from './pages/Agents';

function PrivateRoute({ element }) {
  return localStorage.getItem('token') ? element : <Navigate to="/login" replace />;
}

function App() {
  const auth = !!localStorage.getItem('token');

  return (
    <BrowserRouter>
      <div className={auth ? 'app-container' : ''}>
        {auth && <Sidebar />}
        <div className={auth ? 'main-content' : ''}>
          <Routes>
            {/* Public */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Dashboard */}
            <Route path="/" element={<PrivateRoute element={<Dashboard />} />} />

            {/* Biens — split by transaction type */}
            <Route path="/biens"          element={<Navigate to="/biens/vente" replace />} />
            <Route path="/biens/vente"    element={<PrivateRoute element={<Biens defaultTab="vente" />} />} />
            <Route path="/biens/location" element={<PrivateRoute element={<Biens defaultTab="location" />} />} />

            {/* Clients — filtrable par type */}
            <Route path="/clients"    element={<PrivateRoute element={<Clients filter="All"       />} />} />
            <Route path="/acheteurs"  element={<PrivateRoute element={<Clients filter="Acheteur"  />} />} />
            <Route path="/locataires" element={<PrivateRoute element={<Clients filter="Locataire" />} />} />
            <Route path="/vendeurs"   element={<PrivateRoute element={<Clients filter="Vendeur"   />} />} />
            <Route path="/bailleurs"  element={<PrivateRoute element={<Clients filter="Bailleur"  />} />} />

            {/* Matching */}
            <Route path="/matching"   element={<PrivateRoute element={<Matching />}   />} />
            <Route path="/documents"  element={<PrivateRoute element={<Documents />}  />} />
            <Route path="/finances"   element={<PrivateRoute element={<Finances />}   />} />
            <Route path="/agents"     element={<PrivateRoute element={<Agents />}     />} />

            {/* Activité */}
            <Route path="/visites"      element={<PrivateRoute element={<Visites />}      />} />
            <Route path="/offres"       element={<PrivateRoute element={<Offres />}       />} />
            <Route path="/transactions" element={<PrivateRoute element={<Transactions />} />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
