import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  ShieldCheck, 
  ReceiptText, 
  RadioTower, 
  WalletCards,
  ChevronDown,
  CreditCard,
  PieChart,
  UserCog,
  Cloud,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    dailyReports, 
    bastList, 
    invoices, 
    rfsList, 
    penagihanList,
    syncStatus,
    lastCloudSyncTime,
    triggerManualSync
  } = useProjectContext();

  const [isTagihanExpanded, setIsTagihanExpanded] = useState(true);

  const isTagihanActive = 
    activeTab === 'dashboard-tagihan' ||
    activeTab === 'rfs' ||
    activeTab === 'bast' ||
    activeTab === 'invoice' ||
    activeTab === 'penagihan';

  const totalTagihanItems = penagihanList.length + invoices.length + bastList.length + rfsList.length;

  return (
    <aside className="w-full lg:w-64 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 shrink-0 select-none">
      <div className="p-3 lg:p-4">
        
        {/* Mobile horizontal scroll / Desktop vertical stack */}
        <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          
          {/* 1. Dashboard WO */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl font-medium text-xs lg:text-sm transition-all duration-200 select-none cursor-pointer whitespace-nowrap lg:whitespace-normal group active:scale-95 relative overflow-hidden ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-cyan-600 via-cyan-700 to-blue-700 text-white shadow-lg shadow-cyan-950/60 font-bold border border-cyan-400/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            {activeTab === 'overview' && (
              <div className="absolute left-0 top-1 bottom-1 w-1 bg-white rounded-r-full shadow-glow"></div>
            )}
            <div className="flex items-center gap-3">
              <div className={`p-1 rounded-lg transition-transform duration-200 group-hover:scale-110 ${
                activeTab === 'overview' ? 'text-white' : 'text-cyan-400 group-hover:text-white'
              }`}>
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className="tracking-wide">Dashboard WO</span>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
              activeTab === 'overview' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-950/80 text-slate-400 border border-slate-800'
            }`}>
              {dailyReports.length}
            </span>
          </button>

          {/* 2. Daily Report (as positioned in image right below Dashboard WO) */}
          <button
            onClick={() => setActiveTab('daily-report')}
            className={`flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl font-medium text-xs lg:text-sm transition-all duration-200 select-none cursor-pointer whitespace-nowrap lg:whitespace-normal group active:scale-95 relative overflow-hidden ${
              activeTab === 'daily-report'
                ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg shadow-blue-950/60 font-bold border border-blue-400/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            {activeTab === 'daily-report' && (
              <div className="absolute left-0 top-1 bottom-1 w-1 bg-white rounded-r-full shadow-glow"></div>
            )}
            <div className="flex items-center gap-3">
              <div className={`p-1 rounded-lg transition-transform duration-200 group-hover:scale-110 ${
                activeTab === 'daily-report' ? 'text-white' : 'text-blue-400 group-hover:text-white'
              }`}>
                <ClipboardList className="w-5 h-5" />
              </div>
              <span className="tracking-wide">Daily Report</span>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
              activeTab === 'daily-report' ? 'bg-white/20 text-white' : 'bg-slate-950/80 text-slate-400 border border-slate-800'
            }`}>
              {dailyReports.length}
            </span>
          </button>

          {/* 3. Dashboard Tagihan (Sub-items: Ringkasan Analytics, BAST, Invoice, RFS, Paket Penagihan) */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                setActiveTab('dashboard-tagihan');
                setIsTagihanExpanded(prev => !prev);
              }}
              className={`flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl font-medium text-xs lg:text-sm transition-all duration-200 select-none cursor-pointer whitespace-nowrap lg:whitespace-normal group active:scale-95 relative overflow-hidden ${
                isTagihanActive
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-700 text-white shadow-lg shadow-emerald-950/60 font-bold border border-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              {isTagihanActive && (
                <div className="absolute left-0 top-1 bottom-1 w-1 bg-white rounded-r-full shadow-glow"></div>
              )}
              <div className="flex items-center gap-3">
                <div className={`p-1 rounded-lg transition-transform duration-200 group-hover:scale-110 ${
                  isTagihanActive ? 'text-white' : 'text-emerald-400 group-hover:text-white'
                }`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="tracking-wide">Dashboard Tagihan</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                  isTagihanActive ? 'bg-white/20 text-white' : 'bg-slate-950/80 text-emerald-400 border border-slate-800'
                }`}>
                  {totalTagihanItems}
                </span>
                <ChevronDown className={`w-4 h-4 hidden lg:block transition-transform duration-200 ${
                  isTagihanExpanded ? 'rotate-180' : ''
                }`} />
              </div>
            </button>

            {/* Sub-menu Navigation matching image */}
            {isTagihanExpanded && (
              <div className="hidden lg:flex flex-col gap-1 pl-4 pt-1 border-l-2 border-slate-800/80 ml-5 my-0.5">
                
                {/* 1. Sub-item: Ringkasan Analytics */}
                <button
                  onClick={() => setActiveTab('dashboard-tagihan')}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'dashboard-tagihan'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <PieChart className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ringkasan Analytics</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    Overview
                  </span>
                </button>

                {/* 2. Sub-item: BAST */}
                <button
                  onClick={() => setActiveTab('bast')}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'bast'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>BAST</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                    {bastList.length}
                  </span>
                </button>

                {/* 3. Sub-item: Invoice */}
                <button
                  onClick={() => setActiveTab('invoice')}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'invoice'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ReceiptText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Invoice</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-amber-400 border border-slate-800">
                    {invoices.length}
                  </span>
                </button>

                {/* 4. Sub-item: RFS */}
                <button
                  onClick={() => setActiveTab('rfs')}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'rfs'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <RadioTower className="w-3.5 h-3.5 text-blue-400" />
                    <span>RFS</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-blue-400 border border-slate-800">
                    {rfsList.length}
                  </span>
                </button>

                {/* 5. Sub-item: Paket Penagihan */}
                <button
                  onClick={() => setActiveTab('penagihan')}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'penagihan'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <WalletCards className="w-3.5 h-3.5 text-purple-400" />
                    <span>Paket Penagihan</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-purple-400 border border-slate-800">
                    {penagihanList.length}
                  </span>
                </button>

              </div>
            )}
          </div>

          {/* 4. Menu Setting (Pengaturan Pengguna & Akses Sistem) */}
          <button
            onClick={() => setActiveTab('user-settings')}
            className={`flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl font-medium text-xs lg:text-sm transition-all duration-200 select-none cursor-pointer whitespace-nowrap lg:whitespace-normal group active:scale-95 relative overflow-hidden ${
              activeTab === 'user-settings'
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 text-white shadow-lg shadow-indigo-950/60 font-bold border border-indigo-400/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            {activeTab === 'user-settings' && (
              <div className="absolute left-0 top-1 bottom-1 w-1 bg-white rounded-r-full shadow-glow"></div>
            )}
            <div className="flex items-center gap-3">
              <div className={`p-1 rounded-lg transition-transform duration-200 group-hover:scale-110 ${
                activeTab === 'user-settings' ? 'text-white' : 'text-indigo-400 group-hover:text-white'
              }`}>
                <UserCog className="w-5 h-5" />
              </div>
              <span className="tracking-wide">Menu Setting</span>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold ${
              activeTab === 'user-settings' ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/30' : 'bg-slate-950/80 text-slate-400 border border-slate-800'
            }`}>
              Setting
            </span>
          </button>

        </nav>

        {/* Multi-Device Cloud Sync Status Card */}
        <div className="hidden lg:block mt-6 pt-4 border-t border-slate-800/80">
          <div 
            onClick={triggerManualSync}
            className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl hover:border-slate-700 transition-all cursor-pointer group shadow-inner"
            title="Sinkronisasi Multi-Perangkat (Laptop, HP, Tablet) • Klik untuk sinkronkan sekarang"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    syncStatus === 'offline' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    syncStatus === 'offline' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></span>
                </span>
                <span className="text-[11px] font-bold text-slate-200">
                  {syncStatus === 'offline' ? 'Cloud Sync: Offline' : 'Cloud Sync: Terhubung'}
                </span>
              </div>
              <Cloud className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                syncStatus === 'offline' ? 'text-amber-400' : 'text-emerald-400'
              }`} />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="text-slate-500">Multi-Device Sync</span>
              <span className="text-cyan-400 group-hover:underline flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5 group-hover:rotate-180 transition-transform" />
                {lastCloudSyncTime}
              </span>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
};
