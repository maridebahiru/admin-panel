import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './utils/api';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Views
import Login from './views/Login';
import Overview from './views/Overview';
import Announcements from './views/Announcements';
import Categories from './views/Categories';
import Mezmurs from './views/Mezmurs';
import Settings from './views/Settings';

// Inner Protected Layout to wrap administrative views
const ProtectedLayout = ({ settings, refreshSettings }) => {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-300 border-t-navy-800" />
          <p className="text-xs text-slate-400 font-medium">Restoring admin session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Workspace Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Dynamic header branding */}
        <Header 
          choirName={settings?.choir_name} 
          logoUrl={settings?.logo_url} 
          toggleSidebar={toggleSidebar} 
        />
        
        {/* Content canvas */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const AppContent = () => {
  const [settings, setSettings] = useState(null);

  const refreshSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (err) {
      console.warn('Silent warning: Failed to fetch branding settings.', err.message);
    }
  };

  useEffect(() => {
    // Initial fetch of settings.
    // If not authenticated, the route will intercept, which is fine.
    refreshSettings();
  }, []);

  return (
    <BrowserRouter>
      {/* Toast Alert stack */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3500,
          style: {
            background: '#292858',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500'
          },
          success: {
            iconTheme: {
              primary: '#ffffff',
              secondary: '#292858'
            }
          }
        }}
      />
      
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedLayout settings={settings} refreshSettings={refreshSettings} />}>
          <Route path="/" element={<Overview settings={settings} />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/mezmurs" element={<Mezmurs />} />
          <Route path="/settings" element={<Settings settings={settings} refreshSettings={refreshSettings} />} />
        </Route>

        {/* Fallback to root overview */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
