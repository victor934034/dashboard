import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/Layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Estoque from '@/pages/Estoque';
import CRM from '@/pages/CRM';
import Pedidos from '@/pages/Pedidos';
import Campanhas from '@/pages/Campanhas';
import Login from '@/pages/Login';
import Config from '@/pages/Config';
import History from '@/pages/History';

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/estoque" element={<Estoque />} />
                  <Route path="/crm" element={<CRM />} />
                  <Route path="/pedidos" element={<Pedidos />} />
                  <Route path="/campanhas" element={<Campanhas />} />
                  <Route path="/config" element={<Config />} />
                  <Route path="/history" element={<History />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
