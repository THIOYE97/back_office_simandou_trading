import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { KycListPage } from './pages/KycListPage';
import { KycDetailPage } from './pages/KycDetailPage';
import { OffersPage } from './pages/OffersPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { TransactionDetailPage } from './pages/TransactionDetailPage';
import { ReactNode } from 'react';

function Protected({ children }: { children: ReactNode }) {
  const { authed } = useAuth();
  if (!authed) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/kyc" element={<Protected><KycListPage /></Protected>} />
          <Route path="/kyc/:clientId" element={<Protected><KycDetailPage /></Protected>} />
          <Route path="/offres" element={<Protected><OffersPage /></Protected>} />
          <Route path="/transactions" element={<Protected><TransactionsPage /></Protected>} />
          <Route path="/transactions/:id" element={<Protected><TransactionDetailPage /></Protected>} />
          <Route path="*" element={<Navigate to="/kyc" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
