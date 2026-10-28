import React from 'react';
import { ProjectProvider, useProjectContext } from './context/ProjectContext';
import { LoginPage } from './pages/LoginPage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { DashboardTagihanPage } from './pages/DashboardTagihanPage';
import { DailyReportPage } from './pages/DailyReportPage';
import { BASTPage } from './pages/BASTPage';
import { InvoicePage } from './pages/InvoicePage';
import { FakturPajakPage } from './pages/FakturPajakPage';
import { PenagihanPage } from './pages/PenagihanPage';
import { UserSettingsPage } from './pages/UserSettingsPage';

const MainApp: React.FC = () => {
  const { isLoggedIn, activeTab } = useProjectContext();

  if (!isLoggedIn) {
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
      case 'invoice':
        return <InvoicePage />;
      case 'faktur-pajak':
        return <FakturPajakPage />;
      case 'penagihan':
        return <PenagihanPage />;
      case 'user-settings':
        return <UserSettingsPage />;
      default:
        return <DashboardOverviewPage />;
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
    <ProjectProvider>
      <MainApp />
    </ProjectProvider>
  );
}
