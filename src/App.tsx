import React, { useEffect } from 'react';
import { ProjectProvider, useProjectContext } from './context/ProjectContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { DailyReportPage } from './pages/DailyReportPage';
import { BASTPage } from './pages/BASTPage';
import { PenagihanPage } from './pages/PenagihanPage';
import { UserSettingsPage } from './pages/UserSettingsPage';
import { initAnonymousAuth } from './services/firebase';

const MainApp: React.FC = () => {
  const { isLoggedIn: isProjectLoggedIn, activeTab } = useProjectContext();
  const { isAuthenticated: isAuthAuthenticated } = useAuth();

  useEffect(() => {
    // Initialize anonymous Firebase Auth on load so Realtime Database connection is authenticated
    initAnonymousAuth().catch(() => {});
  }, []);

  const isUserAuthenticated = isAuthAuthenticated || isProjectLoggedIn;

  if (!isUserAuthenticated) {
    return <LoginPage />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverviewPage />;
      case 'dashboard-tagihan':
        return <DashboardOverviewPage initialSubTab="financial" />;
      case 'daily-report':
        return <DailyReportPage />;
      case 'bast':
        return <BASTPage />;
      case 'penagihan':
        return <PenagihanPage />;
      case 'user-settings':
        return <UserSettingsPage />;
      default:
        return <DailyReportPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      <Header />
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <MainApp />
      </ProjectProvider>
    </AuthProvider>
  );
}
