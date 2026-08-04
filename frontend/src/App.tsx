import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PersistentDialer } from './components/PersistentDialer';
import { DashboardPage } from './pages/DashboardPage';
import { ContactsPage } from './pages/ContactsPage';
import { DealsPage } from './pages/DealsPage';
import { CallsPage } from './pages/CallsPage';
import { MessagesPage } from './pages/MessagesPage';
import { TeamPage } from './pages/TeamPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export const AppContent: React.FC = () => {
  const [isDialerOpen, setIsDialerOpen] = useState(false);

  return (
    <Routes>
      {/* Routes Publiques (Auth) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Routes Protégées sous le Layout CRM */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="flex min-h-screen bg-slate-950 text-slate-100">
              <Sidebar />

              <div className="flex-1 flex flex-col min-w-0">
                <Header
                  isDialerOpen={isDialerOpen}
                  onToggleDialer={() => setIsDialerOpen((prev) => !prev)}
                />

                <main className="flex-1 p-6 overflow-y-auto">
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/contacts" element={<ContactsPage />} />
                    <Route path="/deals" element={<DealsPage />} />
                    <Route path="/calls" element={<CallsPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/team" element={<TeamPage />} />
                  </Routes>
                </main>
              </div>

              <PersistentDialer
                isOpen={isDialerOpen}
                onClose={() => setIsDialerOpen(false)}
              />
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
