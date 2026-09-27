import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AuthProvider from './auth/AuthProvider';
import RequireAuth from './auth/RequireAuth';
import Login from './pages/Login';
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

// The signed-in shell. Nothing inside it renders until RequireAuth is satisfied.
function AppLayout() {
  return (
    <RequireAuth>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </RequireAuth>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />

            <Route path="/biens"          element={<Navigate to="/biens/vente" replace />} />
            <Route path="/biens/vente"    element={<Biens defaultTab="vente" />} />
            <Route path="/biens/location" element={<Biens defaultTab="location" />} />

            <Route path="/clients"    element={<Clients filter="All"       />} />
            <Route path="/acheteurs"  element={<Clients filter="Acheteur"  />} />
            <Route path="/locataires" element={<Clients filter="Locataire" />} />
            <Route path="/vendeurs"   element={<Clients filter="Vendeur"   />} />
            <Route path="/bailleurs"  element={<Clients filter="Bailleur"  />} />

            <Route path="/matching"      element={<Matching />}      />
            <Route path="/documents"     element={<Documents />}     />
            <Route path="/finances"      element={<Finances />}      />
            <Route path="/agents"        element={<Agents />}        />
            <Route path="/visites"       element={<Visites />}       />
            <Route path="/offres"        element={<Offres />}        />
            <Route path="/transactions"  element={<Transactions />}  />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
