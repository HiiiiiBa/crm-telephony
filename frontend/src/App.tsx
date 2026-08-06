import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CallProvider } from './contexts/CallContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CallBar } from './components/dialer/CallBar';
import { PersistentDialer } from './components/PersistentDialer';
import { DashboardPage } from './pages/DashboardPage';
import { ContactsPage } from './pages/ContactsPage';
import { ContactDetailPage } from './pages/ContactDetailPage';
import { DealsPage } from './pages/DealsPage';
import { DealDetailPage } from './pages/DealDetailPage';
import { DialerPage } from './pages/DialerPage';
import { CallsPage } from './pages/CallsPage';
import { MessagesPage } from './pages/MessagesPage';
import { TeamPage } from './pages/TeamPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export const AppContent: React.FC = () => {
  const [isDialerOpen, setIsDialerOpen] = useState(false);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <CallProvider>
              <div className="flex min-h-screen bg-slate-950 text-slate-100">
                <Sidebar />

                <div className="flex-1 flex flex-col min-w-0">
                  <Header
                    isDialerOpen={isDialerOpen}
                    onToggleDialer={() => setIsDialerOpen(prev => !prev)}
                  />
                  <CallBar />

                  <main className="flex-1 p-6 overflow-y-auto">
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/contacts" element={<ContactsPage />} />
                      <Route path="/contacts/:id" element={<ContactDetailPage />} />
                      <Route path="/deals" element={<DealsPage />} />
                      <Route path="/deals/:id" element={<DealDetailPage />} />
                      <Route path="/dialer" element={<DialerPage />} />
                      <Route path="/calls" element={<CallsPage />} />
                      <Route path="/messages" element={<MessagesPage />} />
                      <Route
                        path="/team"
                        element={
                          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                            <TeamPage />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </main>
                </div>

                <PersistentDialer isOpen={isDialerOpen} onClose={() => setIsDialerOpen(false)} />
              </div>
            </CallProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export const App: React.FC = () => (
  <Router>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </Router>
);

export default App;
