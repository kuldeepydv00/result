import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Charts } from './pages/Charts';
import { Search } from './pages/Search';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import './i18n'; // Force i18n initialization

// Admin route protector (redirects unauthorized users back to home)
const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { adminToken } = useAppStore();
  return adminToken ? <>{children}</> : <Navigate to="/" replace />;
};

export const App: React.FC = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-4 sm:px-6">
        {/* Navigation Header */}
        <Header />

        {/* Content Viewport */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/search" element={<Search />} />
            
            {/* Administrative Login Form Path */}
            <Route path="/admain-kuldeep-login" element={<Login />} />
            
            {/* Admin console */}
            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              }
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Informational Footer */}
        <Footer />
      </div>
    </Router>
  );
};

export default App;
