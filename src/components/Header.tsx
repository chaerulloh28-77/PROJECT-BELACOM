import React from 'react';
import { 
  CheckCircle2, 
  RotateCw, 
  Search, 
  User, 
  LogOut, 
  RefreshCw,
  Activity,
  Radio,
  ShieldCheck,
  X,
  Cloud,
  WifiOff,
  Undo2,
  Redo2
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';

export const Header: React.FC = () => {
  const { 
    currentUserEmail, 
    userProfile,
    setActiveTab,
    logout, 
    autoSaveStatus, 
    lastSavedTime,
    syncStatus,
    lastCloudSyncTime,
    triggerManualSync,
    filters,
    setFilters,
    undo,
    redo,
    canUndo,
    canRedo,
    undoCount,
    redoCount
  } = useProjectContext();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 py-3 flex items-center justify-between gap-4 select-none">
      
      {/* Left Title & Status */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/50 border border-cyan-400/30 group cursor-pointer hover:scale-105 active:scale-95 transition-all">
            <Radio className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base lg:text-lg font-black tracking-wider text-white uppercase flex items-center gap-2 font-mono">
                PROJECT BELACOM
              </h1>
            </div>
          </div>
        </div>

        {/* Multi-Device Cloud Sync Connection Indicator */}
        <button
          onClick={triggerManualSync}
          className="hidden xl:flex items-center gap-2 px-3 py-1 bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 rounded-full text-xs font-mono shadow-sm transition-all cursor-pointer group active:scale-95"
          title={`Multi-Device Real-Time Cloud Sync • Terakhir selaras: ${lastCloudSyncTime || lastSavedTime} • Klik untuk sinkronisasi paksa`}
        >
          {syncStatus === 'syncing' || autoSaveStatus === 'saving' ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              <Cloud className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
              <span className="text-cyan-300 font-medium">Cloud Sync: Menyinkronkan...</span>
            </>
          ) : syncStatus === 'offline' ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-amber-300 font-medium">Cloud Sync: Offline</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
              </span>
              <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-emerald-300 font-medium">Cloud Sync: Terhubung</span>
            </>
          )}
        </button>
      </div>

      {/* Middle: Search & Undo / Redo Time-Travel Toolbar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <div className="flex-1 hidden md:block">
          <div className="relative group/search">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within/search:text-cyan-400 transition-colors" />
            <input
              type="text"
              placeholder="Cari WO, PIC, area, tim, atau nomor surat..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-xs text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-8 py-2 outline-none transition-all duration-200 focus:ring-1 focus:ring-cyan-500/50 shadow-inner"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Undo & Redo Buttons */}
        <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl p-1 gap-1.5 shrink-0 shadow-md">
          <button
            onClick={undo}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono font-bold transition-all duration-200 ${
              canUndo 
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border border-cyan-300/60 shadow-md shadow-cyan-500/30 hover:scale-105 active:scale-95 cursor-pointer' 
                : 'bg-slate-900 text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 cursor-pointer'
            }`}
            title="Batal / Undo (Ctrl+Z)"
          >
            <Undo2 className={`w-4 h-4 ${canUndo ? 'text-cyan-200 animate-pulse' : 'text-slate-400'}`} />
            <span>Undo</span>
            {undoCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-cyan-950 text-cyan-200 rounded-full text-[10px] font-extrabold border border-cyan-400/50">
                {undoCount}
              </span>
            )}
          </button>
          
          <div className="w-[1px] h-5 bg-slate-700"></div>
          
          <button
            onClick={redo}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono font-bold transition-all duration-200 ${
              canRedo 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-300/60 shadow-md shadow-blue-500/30 hover:scale-105 active:scale-95 cursor-pointer' 
                : 'bg-slate-900 text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200 cursor-pointer'
            }`}
            title="Ulangi / Redo (Ctrl+Y)"
          >
            <Redo2 className={`w-4 h-4 ${canRedo ? 'text-blue-200 animate-pulse' : 'text-slate-400'}`} />
            <span>Redo</span>
            {redoCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-blue-950 text-blue-200 rounded-full text-[10px] font-extrabold border border-blue-400/50">
                {redoCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* User Info & Logout */}
        <div className="flex items-center gap-2 pl-2">
          <button
            onClick={() => setActiveTab('user-settings')}
            className="flex items-center gap-2 text-left p-1 rounded-xl hover:bg-slate-800/60 transition-colors group cursor-pointer"
            title="Buka Menu Setting"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md border border-cyan-400/20 group-hover:scale-105 transition-transform">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate max-w-[140px]" title={userProfile?.fullName || currentUserEmail || 'Administrator'}>
                {userProfile?.fullName || currentUserEmail || 'Administrator'}
              </p>
              <p className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                <Activity className="w-2.5 h-2.5 inline animate-pulse text-emerald-400" /> {userProfile?.role || 'Super Admin'}
              </p>
            </div>
          </button>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-150 cursor-pointer ml-1 active:scale-95"
            title="Keluar / Logout"
          >
            <LogOut className="w-4 h-4 hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

    </header>
  );
};
