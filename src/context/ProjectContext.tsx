import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  DailyReportItem, 
  BASTItem, 
  InvoiceItem, 
  PenagihanItem, 
  FakturPajakItem,
  ActiveTab,
  FilterState,
  UserProfile,
  SystemUser,
  TeamItem
} from '../types';
import { 
  INITIAL_DAILY_REPORTS, 
  INITIAL_BAST_LIST, 
  INITIAL_INVOICE_LIST, 
  INITIAL_PENAGIHAN_LIST,
  INITIAL_FAKTUR_PAJAK_LIST
} from '../data/mockData';
import { ToastMessage, ToastContainer } from '../components/Toast';
import { cloudSyncService, SyncConnectionStatus } from '../services/cloudSyncService';

export interface DrilldownFilter {
  title: string;
  category: 
    | 'wo' 
    | 'project' 
    | 'statusWo' 
    | 'statusProject' 
    | 'bast' 
    | 'invoice' 
    | 'penagihan' 
    | 'statusPenagihan'
    | 'area' 
    | 'team'
    | 'cancel' 
    | 'timeline' 
    | 'finishDate' 
    | 'monthRelease' 
    | 'woType';
  value: string;
}

interface ProjectContextType {
  // Auth & Profile
  isLoggedIn: boolean;
  currentUserEmail: string;
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updatePassword: (currentPass: string, newPass: string) => { success: boolean; message: string };
  systemUsers: SystemUser[];
  addSystemUser: (user: Omit<SystemUser, 'id' | 'createdAt'>) => void;
  updateSystemUser: (id: string, user: Partial<SystemUser>) => void;
  deleteSystemUser: (id: string) => void;

  teams: TeamItem[];
  addTeam: (team: Omit<TeamItem, 'id' | 'createdAt'>) => void;
  updateTeam: (id: string, team: Partial<TeamItem>) => void;
  deleteTeam: (id: string) => void;
  login: (email: string, pass: string) => boolean;
  logout: () => void;

  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  dashboardView: 'total-wo' | 'bast' | 'tagihan';
  setDashboardView: (view: 'total-wo' | 'bast' | 'tagihan') => void;

  // Auto-save & Multi-Device Cloud Sync Status
  autoSaveStatus: 'saved' | 'saving' | 'idle';
  lastSavedTime: string;
  syncStatus: SyncConnectionStatus;
  lastCloudSyncTime: string;
  triggerManualSync: () => Promise<void>;

  // Data
  dailyReports: DailyReportItem[];
  bastList: BASTItem[];
  invoices: InvoiceItem[];
  penagihanList: PenagihanItem[];
  fakturPajakList: FakturPajakItem[];

  // Toast Notifications
  toasts: ToastMessage[];
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  dismissToast: (id: string) => void;

  // CRUD Daily Report
  addDailyReport: (item: Omit<DailyReportItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDailyReport: (id: string, item: Partial<DailyReportItem>) => void;
  deleteDailyReport: (id: string) => void;

  // CRUD BAST
  addBAST: (item: Omit<BASTItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBAST: (id: string, item: Partial<BASTItem>) => void;
  deleteBAST: (id: string) => void;

  // CRUD Invoice
  addInvoice: (item: Omit<InvoiceItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInvoice: (id: string, item: Partial<InvoiceItem>) => void;
  deleteInvoice: (id: string) => void;

  // CRUD Faktur Pajak
  addFakturPajak: (item: Omit<FakturPajakItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFakturPajak: (id: string, item: Partial<FakturPajakItem>) => void;
  deleteFakturPajak: (id: string) => void;

  // CRUD Penagihan
  addPenagihan: (item: Omit<PenagihanItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePenagihan: (id: string, item: Partial<PenagihanItem>) => void;
  deletePenagihan: (id: string) => void;

  // Global Search & Filters
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;

  // Drilldown Modal
  drilldownFilter: DrilldownFilter | null;
  setDrilldownFilter: (filter: DrilldownFilter | null) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
}

const STORAGE_KEYS = {
  AUTH: 'belacom_auth',
  DAILY_REPORTS: 'belacom_daily_reports_v2',
  BAST: 'belacom_bast_list_v2',
  INVOICE: 'belacom_invoice_list_v2',
  FAKTUR_PAJAK: 'belacom_faktur_pajak_list_v1',
  PENAGIHAN: 'belacom_penagihan_list_v2',
  USER_PROFILE: 'belacom_user_profile_v1',
  PASSWORD: 'belacom_password_v1',
  SYSTEM_USERS: 'belacom_system_users_v1',
  TEAMS: 'belacom_teams_list_v1',
  TOMBSTONES: 'belacom_tombstones_v1'
};

const DEFAULT_TEAMS: TeamItem[] = [
  { id: 'TEAM-01', teamName: 'ABR 01', picLeader: 'Budi Lapangan', helpers: ['Andi', 'Rian'], phone: '081234567890', area: 'Jabo 1', createdAt: '2026-01-15' },
  { id: 'TEAM-02', teamName: 'ABR 02', picLeader: 'Joko Teknik', helpers: ['Doni'], phone: '081398765432', area: 'Jabo 1', createdAt: '2026-01-16' },
  { id: 'TEAM-03', teamName: 'ABR 03', picLeader: 'Irwan Setiawan', helpers: ['Yoga', 'Fajar'], phone: '081211223344', area: 'Jabo 1', createdAt: '2026-01-18' },
  { id: 'TEAM-04', teamName: 'ABR 04', picLeader: 'Dedi Sugiarto', helpers: ['Hendra'], phone: '085677889900', area: 'Jabo 2', createdAt: '2026-01-20' },
  { id: 'TEAM-05', teamName: 'ABR 05', picLeader: 'Ahmad Fauzi', helpers: ['Zaki', 'Bayu'], phone: '087855443322', area: 'Jabo 2', createdAt: '2026-01-22' },
  { id: 'TEAM-06', teamName: 'ABR 06', picLeader: 'Slamet Riyadi', helpers: ['Agus'], phone: '081900112233', area: 'Jabo 3', createdAt: '2026-01-25' }
];

const DEFAULT_USER_PROFILE: UserProfile = {
  username: 'belacom',
  fullName: 'Admin Belacom',
  email: 'belacom@belacom.co.id',
  role: 'Super Admin',
  updatedAt: new Date().toISOString()
};

const DEFAULT_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'usr-1',
    username: 'belacom',
    fullName: 'Admin Belacom',
    email: 'belacom@belacom.co.id',
    role: 'Super Admin',
    area: 'Semua Area (HQ)',
    status: 'Aktif',
    lastLogin: 'Hari ini, 10:45 WIB',
    createdAt: '2026-01-10'
  }
];

/**
 * Safe LocalStorage Helpers to prevent crashes in private browsing or disabled cookies
 */
export function safeGetLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return defaultValue;
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    const parsed = JSON.parse(item);
    return parsed !== null && parsed !== undefined ? parsed : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

export function safeSetLocalStorage(key: string, value: any): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  } catch (e) {
    // ignore quota/security error silently
  }
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
    } catch {
      return false;
    }
  });
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    try {
      return localStorage.getItem('belacom_user_email') || 'belacom@belacom.co.id';
    } catch {
      return 'belacom@belacom.co.id';
    }
  });

  // Tombstone Tracking for Anti-Reappearance of Deleted Data
  const [tombstones, setTombstones] = useState<string[]>(() => {
    return safeGetLocalStorage<string[]>(STORAGE_KEYS.TOMBSTONES, []);
  });

  const addTombstoneIds = useCallback((ids: string[]) => {
    if (!ids || ids.length === 0) return;
    setTombstones(prev => {
      const set = new Set([...prev, ...ids]);
      const updated = Array.from(set);
      safeSetLocalStorage(STORAGE_KEYS.TOMBSTONES, updated);
      return updated;
    });
  }, []);

  // User Profile with localStorage persistence
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const local = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed.username !== 'belacom') {
          parsed.username = 'belacom';
          parsed.fullName = 'Admin Belacom';
          parsed.email = 'belacom@belacom.co.id';
        }
        return parsed;
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_USER_PROFILE;
  });

  // System Users List with localStorage persistence & Tombstone filtering
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    const tombstoneSet = new Set(
      (() => {
        try {
          const l = localStorage.getItem(STORAGE_KEYS.TOMBSTONES);
          return l ? JSON.parse(l) : [];
        } catch (e) {
          return [];
        }
      })()
    );

    const local = localStorage.getItem(STORAGE_KEYS.SYSTEM_USERS);
    let list: SystemUser[] = DEFAULT_SYSTEM_USERS;
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed.filter((u: SystemUser) => !['usr-2', 'usr-3', 'usr-4', 'usr-5'].includes(u.id));
        }
      } catch (e) {
        // fallback
      }
    }
    list = list.map((u: SystemUser) => {
      if (u.id === 'usr-1') {
        return { ...u, username: 'belacom', fullName: 'Admin Belacom', email: 'belacom@belacom.co.id' };
      }
      return u;
    });
    return list.filter(u => !tombstoneSet.has(u.id));
  });

  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [dashboardView, setDashboardView] = useState<'total-wo' | 'bast' | 'tagihan'>('total-wo');

  // Auto-save State
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>(
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Cloud Sync State
  const [syncStatus, setSyncStatus] = useState<SyncConnectionStatus>(cloudSyncService.getStatus());
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string>(cloudSyncService.getLastSyncTime());
  const isReceivingRemote = useRef(false);
  const isCloudReady = useRef(false);

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);

    // Auto dismiss after 3.5s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Datasets with Tombstone Anti-Reappearance Filter
  const getStoredTombstoneSet = (): Set<string> => {
    try {
      const l = localStorage.getItem(STORAGE_KEYS.TOMBSTONES);
      return new Set(l ? JSON.parse(l) : []);
    } catch (e) {
      return new Set();
    }
  };

  const [teams, setTeams] = useState<TeamItem[]>(() => {
    const tombstonesSet = getStoredTombstoneSet();
    const list = safeGetLocalStorage<TeamItem[]>(STORAGE_KEYS.TEAMS, DEFAULT_TEAMS);
    return list.filter(t => !tombstonesSet.has(t.id));
  });

  const [dailyReports, setDailyReports] = useState<DailyReportItem[]>(() => {
    const tombstonesSet = getStoredTombstoneSet();
    const list = safeGetLocalStorage<DailyReportItem[]>(STORAGE_KEYS.DAILY_REPORTS, INITIAL_DAILY_REPORTS);
    return list.filter(r => !tombstonesSet.has(r.id) && !tombstonesSet.has(r.woNumber));
  });

  const [bastList, setBastList] = useState<BASTItem[]>(() => {
    const tombstonesSet = getStoredTombstoneSet();
    const list = safeGetLocalStorage<BASTItem[]>(STORAGE_KEYS.BAST, INITIAL_BAST_LIST);
    const filtered = list.filter(b => !tombstonesSet.has(b.id) && !tombstonesSet.has(b.woNumber));
    if (filtered.length > 0) {
      return filtered;
    }
    return INITIAL_BAST_LIST.filter(b => !tombstonesSet.has(b.id) && !tombstonesSet.has(b.woNumber));
  });

  const [invoices, setInvoices] = useState<InvoiceItem[]>(() => {
    const tombstonesSet = getStoredTombstoneSet();
    const list = safeGetLocalStorage<InvoiceItem[]>(STORAGE_KEYS.INVOICE, INITIAL_INVOICE_LIST);
    return list.filter(i => !tombstonesSet.has(i.id) && !tombstonesSet.has(i.woNumber));
  });

  const [penagihanList, setPenagihanList] = useState<PenagihanItem[]>(() => {
    const tombstonesSet = getStoredTombstoneSet();
    const list = safeGetLocalStorage<PenagihanItem[]>(STORAGE_KEYS.PENAGIHAN, INITIAL_PENAGIHAN_LIST);
    return list.filter(p => !tombstonesSet.has(p.id) && !tombstonesSet.has(p.woNumber));
  });

  const [fakturPajakList, setFakturPajakList] = useState<FakturPajakItem[]>(() => {
    const tombstonesSet = getStoredTombstoneSet();
    const local = localStorage.getItem(STORAGE_KEYS.FAKTUR_PAJAK);
    let list: FakturPajakItem[] = INITIAL_FAKTUR_PAJAK_LIST;
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return list.filter(f => !tombstonesSet.has(f.id) && !tombstonesSet.has(f.nsfp));
  });

  // Global Filters
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    assignmentFilter: 'ALL',
    statusFilter: 'ALL',
    teamFilter: 'ALL',
    dateRangeStart: '',
    dateRangeEnd: ''
  });

  const resetFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      assignmentFilter: 'ALL',
      statusFilter: 'ALL',
      teamFilter: 'ALL',
      dateRangeStart: '',
      dateRangeEnd: ''
    });
  }, []);

  // Drilldown Filter Modal
  const [drilldownFilter, setDrilldownFilter] = useState<DrilldownFilter | null>(null);

  // Time-Travel History (Undo / Redo for Typing/Editing Only)
  interface ProjectStateSnapshot {
    dailyReports: DailyReportItem[];
    bastList: BASTItem[];
    invoices: InvoiceItem[];
    penagihanList: PenagihanItem[];
    fakturPajakList: FakturPajakItem[];
    teams: TeamItem[];
  }

  const [past, setPast] = useState<ProjectStateSnapshot[]>([]);
  const [future, setFuture] = useState<ProjectStateSnapshot[]>([]);

  const recordSnapshot = useCallback(() => {
    const currentSnapshot: ProjectStateSnapshot = {
      dailyReports: [...dailyReports],
      bastList: [...bastList],
      invoices: [...invoices],
      penagihanList: [...penagihanList],
      fakturPajakList: [...fakturPajakList],
      teams: [...teams]
    };
    setPast(prev => [...prev.slice(-25), currentSnapshot]);
    setFuture([]);
  }, [dailyReports, bastList, invoices, penagihanList, fakturPajakList, teams]);

  // Purge deleted items from past & future history so Undo can NEVER restore deleted records
  const purgeHistoryForDeleted = useCallback((deletedIds: string[], deletedWoNumbers: string[] = []) => {
    const idSet = new Set(deletedIds);
    const woSet = new Set(deletedWoNumbers);

    const cleanSnapshot = (snap: ProjectStateSnapshot): ProjectStateSnapshot => ({
      dailyReports: snap.dailyReports.filter(r => !idSet.has(r.id) && !woSet.has(r.woNumber)),
      bastList: snap.bastList.filter(b => !idSet.has(b.id) && !woSet.has(b.woNumber)),
      invoices: snap.invoices.filter(i => !idSet.has(i.id) && !woSet.has(i.woNumber)),
      penagihanList: snap.penagihanList.filter(p => !idSet.has(p.id) && !woSet.has(p.woNumber)),
      fakturPajakList: (snap.fakturPajakList || []).filter(f => !idSet.has(f.id) && !idSet.has(f.nsfp)),
      teams: snap.teams.filter(t => !idSet.has(t.id))
    });

    setPast(prev => prev.map(cleanSnapshot));
    setFuture(prev => prev.map(cleanSnapshot));
  }, []);

  const undo = useCallback(() => {
    if (past.length === 0) {
      showToast('info', 'Undo Tidak Tersedia', 'Belum ada riwayat editan teks yang bisa dibatalkan.');
      return;
    }
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const currentSnapshot: ProjectStateSnapshot = {
      dailyReports: [...dailyReports],
      bastList: [...bastList],
      invoices: [...invoices],
      penagihanList: [...penagihanList],
      fakturPajakList: [...fakturPajakList],
      teams: [...teams]
    };

    setPast(newPast);
    setFuture(prev => [currentSnapshot, ...prev]);

    // Ensure undo respects tombstones
    const tombstoneSet = new Set(tombstones);
    setDailyReports(previous.dailyReports.filter(r => !tombstoneSet.has(r.id) && !tombstoneSet.has(r.woNumber)));
    setBastList(previous.bastList.filter(b => !tombstoneSet.has(b.id) && !tombstoneSet.has(b.woNumber)));
    setInvoices(previous.invoices.filter(i => !tombstoneSet.has(i.id) && !tombstoneSet.has(i.woNumber)));
    setPenagihanList(previous.penagihanList.filter(p => !tombstoneSet.has(p.id) && !tombstoneSet.has(p.woNumber)));
    setFakturPajakList((previous.fakturPajakList || []).filter(f => !tombstoneSet.has(f.id) && !tombstoneSet.has(f.nsfp)));
    setTeams((previous.teams || []).filter(t => !tombstoneSet.has(t.id)));

    showToast('success', 'Undo Berhasil', '↩️ Edit teks berhasil dibatalkan (Undo)');
  }, [past, dailyReports, bastList, invoices, penagihanList, fakturPajakList, teams, tombstones, showToast]);

  const redo = useCallback(() => {
    if (future.length === 0) {
      showToast('info', 'Redo Tidak Tersedia', 'Tidak ada editan teks untuk dipulihkan.');
      return;
    }
    const next = future[0];
    const newFuture = future.slice(1);
    const currentSnapshot: ProjectStateSnapshot = {
      dailyReports: [...dailyReports],
      bastList: [...bastList],
      invoices: [...invoices],
      penagihanList: [...penagihanList],
      fakturPajakList: [...fakturPajakList],
      teams: [...teams]
    };

    setPast(prev => [...prev, currentSnapshot]);
    setFuture(newFuture);

    // Ensure redo respects tombstones
    const tombstoneSet = new Set(tombstones);
    setDailyReports(next.dailyReports.filter(r => !tombstoneSet.has(r.id) && !tombstoneSet.has(r.woNumber)));
    setBastList(next.bastList.filter(b => !tombstoneSet.has(b.id) && !tombstoneSet.has(b.woNumber)));
    setInvoices(next.invoices.filter(i => !tombstoneSet.has(i.id) && !tombstoneSet.has(i.woNumber)));
    setPenagihanList(next.penagihanList.filter(p => !tombstoneSet.has(p.id) && !tombstoneSet.has(p.woNumber)));
    setFakturPajakList((next.fakturPajakList || []).filter(f => !tombstoneSet.has(f.id) && !tombstoneSet.has(f.nsfp)));
    setTeams((next.teams || []).filter(t => !tombstoneSet.has(t.id)));

    showToast('success', 'Redo Berhasil', '↪️ Edit teks berhasil dipulihkan (Redo)');
  }, [future, dailyReports, bastList, invoices, penagihanList, fakturPajakList, teams, tombstones, showToast]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName);
      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Trigger Real-time Auto-save with debouncing & indicator + Cloud Sync Push
  const triggerAutoSave = useCallback(() => {
    setAutoSaveStatus('saving');
    const timer = setTimeout(() => {
      safeSetLocalStorage(STORAGE_KEYS.TOMBSTONES, tombstones);
      safeSetLocalStorage(STORAGE_KEYS.TEAMS, teams);
      safeSetLocalStorage(STORAGE_KEYS.DAILY_REPORTS, dailyReports);
      safeSetLocalStorage(STORAGE_KEYS.BAST, bastList);
      safeSetLocalStorage(STORAGE_KEYS.INVOICE, invoices);
      safeSetLocalStorage(STORAGE_KEYS.FAKTUR_PAJAK, fakturPajakList);
      safeSetLocalStorage(STORAGE_KEYS.PENAGIHAN, penagihanList);
      safeSetLocalStorage(STORAGE_KEYS.USER_PROFILE, userProfile);
      safeSetLocalStorage(STORAGE_KEYS.SYSTEM_USERS, systemUsers);

      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(now);
      setAutoSaveStatus('saved');

      // Two-way Push to Cloud (Multi-device Realtime Sync)
      if (!isReceivingRemote.current && isCloudReady.current) {
        cloudSyncService.pushToCloud({
          dailyReports,
          bastList,
          invoices,
          penagihanList,
          userProfile,
          systemUsers,
          teams
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [tombstones, teams, dailyReports, bastList, invoices, penagihanList, fakturPajakList, userProfile, systemUsers]);

  useEffect(() => {
    triggerAutoSave();
  }, [tombstones, teams, dailyReports, bastList, invoices, penagihanList, fakturPajakList, userProfile, systemUsers, triggerAutoSave]);

  // Cloud Sync Listener with Tombstone Protection
  useEffect(() => {
    const unsubStatus = cloudSyncService.onStatusChange((status, time) => {
      setSyncStatus(status);
      setLastCloudSyncTime(time);
    });

    const unsubRemote = cloudSyncService.onRemoteData((remoteData) => {
      try {
        isReceivingRemote.current = true;
        const tsSet = new Set(tombstones);

        const teamsArr = remoteData?.teams ?? [];
        if (Array.isArray(teamsArr)) {
          const filtered = teamsArr.filter(t => !tsSet.has(t.id));
          setTeams(filtered);
          localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(filtered));
        }
        const drArr = remoteData?.dailyReports ?? [];
        if (Array.isArray(drArr)) {
          const filtered = drArr.filter(r => !tsSet.has(r.id) && !tsSet.has(r.woNumber));
          setDailyReports(filtered);
          localStorage.setItem(STORAGE_KEYS.DAILY_REPORTS, JSON.stringify(filtered));
        }
        const bastArr = remoteData?.bastList ?? [];
        if (Array.isArray(bastArr)) {
          const filtered = bastArr.filter(b => !tsSet.has(b.id) && !tsSet.has(b.woNumber));
          setBastList(filtered);
          localStorage.setItem(STORAGE_KEYS.BAST, JSON.stringify(filtered));
        }
        const invArr = remoteData?.invoices ?? [];
        if (Array.isArray(invArr)) {
          const filtered = invArr.filter(i => !tsSet.has(i.id) && !tsSet.has(i.woNumber));
          setInvoices(filtered);
          localStorage.setItem(STORAGE_KEYS.INVOICE, JSON.stringify(filtered));
        }
        const pngArr = remoteData?.penagihanList ?? [];
        if (Array.isArray(pngArr)) {
          const filtered = pngArr.filter(p => !tsSet.has(p.id) && !tsSet.has(p.woNumber));
          setPenagihanList(filtered);
          localStorage.setItem(STORAGE_KEYS.PENAGIHAN, JSON.stringify(filtered));
        }
        if (remoteData?.userProfile) {
          setUserProfile(remoteData.userProfile);
          localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(remoteData.userProfile));
        }
        const sysArr = remoteData?.systemUsers ?? [];
        if (Array.isArray(sysArr)) {
          const filtered = sysArr.filter(u => !tsSet.has(u.id));
          setSystemUsers(filtered);
          localStorage.setItem(STORAGE_KEYS.SYSTEM_USERS, JSON.stringify(filtered));
        }
      } catch (err) {
        console.warn('[ProjectContext] unsubRemote error:', err);
      } finally {
        setTimeout(() => {
          isReceivingRemote.current = false;
        }, 600);
      }
    });

    try {
      cloudSyncService.pullFromCloud().then(hasData => {
        if (!hasData) {
          cloudSyncService.pushToCloud({
            dailyReports,
            bastList,
            invoices,
            penagihanList,
            userProfile,
            systemUsers,
            teams
          }, true);
        }
      }).catch(err => {
        console.warn('[ProjectContext] initial pull error:', err);
      }).finally(() => {
        isCloudReady.current = true;
      });
    } catch (e) {
      isCloudReady.current = true;
    }

    return () => {
      unsubStatus();
      unsubRemote();
    };
  }, [tombstones]);

  const triggerManualSync = useCallback(async () => {
    setAutoSaveStatus('saving');
    await cloudSyncService.pullFromCloud();
    cloudSyncService.pushToCloud({
      dailyReports,
      bastList,
      invoices,
      penagihanList,
      userProfile,
      systemUsers,
      teams
    }, true);
    setAutoSaveStatus('saved');
    showToast('success', 'Sinkronisasi Cloud Berhasil', 'Data lokal kini telah disinkronkan dengan Cloud.');
  }, [dailyReports, bastList, invoices, penagihanList, userProfile, systemUsers, teams, showToast]);

  // Profile & Password Methods
  const updateUserProfile = useCallback((profileUpdates: Partial<UserProfile>) => {
    setUserProfile(prev => {
      const updated: UserProfile = {
        ...prev,
        ...profileUpdates,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
      if (profileUpdates.email) {
        setCurrentUserEmail(profileUpdates.email);
        localStorage.setItem('belacom_user_email', profileUpdates.email);
      }
      return updated;
    });
    showToast('success', 'Profil Berhasil Disimpan', 'Data profil akun telah tersimpan secara permanen.');
  }, [showToast]);

  const updatePassword = useCallback((currentPass: string, newPass: string): { success: boolean; message: string } => {
    const activePassword = localStorage.getItem(STORAGE_KEYS.PASSWORD) || 'belacom123';
    if (currentPass !== activePassword && currentPass !== 'belacom123') {
      showToast('error', 'Password Saat Ini Salah', 'Password saat ini yang Anda masukkan tidak sesuai.');
      return { success: false, message: 'Password saat ini tidak sesuai.' };
    }
    if (!newPass || newPass.trim().length < 6) {
      showToast('error', 'Password Kurang Panjang', 'Password baru minimal harus 6 karakter.');
      return { success: false, message: 'Password baru minimal 6 karakter.' };
    }
    localStorage.setItem(STORAGE_KEYS.PASSWORD, newPass);
    showToast('success', 'Password Diperbarui', 'Password baru Anda telah aktif dan tersimpan.');
    return { success: true, message: 'Password berhasil diperbarui.' };
  }, [showToast]);

  const addSystemUser = useCallback((user: Omit<SystemUser, 'id' | 'createdAt'>) => {
    const newUser: SystemUser = {
      ...user,
      id: 'usr-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setSystemUsers(prev => {
      const updated = [newUser, ...prev];
      localStorage.setItem(STORAGE_KEYS.SYSTEM_USERS, JSON.stringify(updated));
      return updated;
    });
    showToast('success', 'Pengguna Ditambahkan', `Pengguna ${user.fullName} (${user.role}) berhasil ditambahkan.`);
  }, [showToast]);

  const updateSystemUser = useCallback((id: string, userUpdates: Partial<SystemUser>) => {
    setSystemUsers(prev => {
      const updated = prev.map(u => u.id === id ? { ...u, ...userUpdates } : u);
      localStorage.setItem(STORAGE_KEYS.SYSTEM_USERS, JSON.stringify(updated));
      return updated;
    });
    showToast('success', 'Pengguna Diperbarui', 'Data pengguna berhasil diperbarui.');
  }, [showToast]);

  const deleteSystemUser = useCallback((id: string) => {
    addTombstoneIds([id]);
    setSystemUsers(prev => {
      const target = prev.find(u => u.id === id);
      const updated = prev.filter(u => u.id !== id);
      localStorage.setItem(STORAGE_KEYS.SYSTEM_USERS, JSON.stringify(updated));
      if (target) {
        showToast('info', 'Pengguna Dihapus Permanen', `Akun ${target.fullName} telah dihapus permanen dari sistem.`);
      }
      return updated;
    });
  }, [addTombstoneIds, showToast]);

  // Team CRUD Methods
  const addTeam = useCallback((team: Omit<TeamItem, 'id' | 'createdAt'>) => {
    recordSnapshot();
    const newTeam: TeamItem = {
      ...team,
      id: 'TEAM-' + Math.floor(100 + Math.random() * 900),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTeams(prev => {
      const updated = [newTeam, ...prev];
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(updated));
      return updated;
    });
    showToast('success', 'Team Ditambahkan', `Team ${team.teamName} (${team.picLeader}) berhasil ditambahkan!`);
  }, [recordSnapshot, showToast]);

  const updateTeam = useCallback((id: string, teamUpdates: Partial<TeamItem>) => {
    recordSnapshot();
    setTeams(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...teamUpdates } : t);
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(updated));
      return updated;
    });
    showToast('success', 'Team Diperbarui', `Data team berhasil diperbarui.`);
  }, [recordSnapshot, showToast]);

  const deleteTeam = useCallback((id: string) => {
    addTombstoneIds([id]);
    purgeHistoryForDeleted([id]);
    setTeams(prev => {
      const target = prev.find(t => t.id === id);
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(updated));
      if (target) {
        showToast('info', 'Team Dihapus Permanen', `Team ${target.teamName} telah dihapus permanen dari sistem.`);
      }
      return updated;
    });
  }, [addTombstoneIds, purgeHistoryForDeleted, showToast]);

  // Strict Restricted Auth Method
  const login = (emailOrUser: string, pass: string): boolean => {
    const activePassword = localStorage.getItem(STORAGE_KEYS.PASSWORD) || 'belacom123';
    const cleanInput = emailOrUser.trim().toLowerCase();
    const cleanPass = pass.trim();

    const isUserValid = cleanInput === 'belacom' || cleanInput === 'belacom@belacom.co.id' || cleanInput === 'admin';
    const isPassValid = cleanPass === 'belacom123' || cleanPass === activePassword;

    if (isUserValid && isPassValid) {
      setIsLoggedIn(true);
      setPast([]);
      setFuture([]);
      const userEmailToSet = 'belacom@belacom.co.id';
      setCurrentUserEmail(userEmailToSet);
      localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      localStorage.setItem('belacom_user_email', userEmailToSet);
      setActiveTab('overview');
      showToast('success', 'Berhasil Masuk', `Selamat datang kembali, Admin Belacom`);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUserEmail('');
    setPast([]);
    setFuture([]);
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem('belacom_user_email');
    showToast('info', 'Sesi Berakhir', 'Anda telah keluar dari sistem.');
  };

  // CRUD Daily Report with Automatic Billing Package Sync & Tombstone Tracking
  const addDailyReport = (item: Omit<DailyReportItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    recordSnapshot();
    const now = new Date().toISOString();
    const newId = 'DR-' + Math.floor(100 + Math.random() * 900);
    const newRecord: DailyReportItem = {
      ...item,
      id: newId,
      createdAt: now,
      updatedAt: now
    };

    setDailyReports(prev => [newRecord, ...prev]);

    // Automatically create corresponding billing package
    const defaultNominal = 15000000 + Math.floor(Math.random() * 35000000);
    const newPenagihan: PenagihanItem = {
      id: 'PNG-' + Math.floor(500 + Math.random() * 900),
      billingCode: 'INV-BEL-2026-' + Math.floor(100 + Math.random() * 900),
      woNumber: newRecord.woNumber,
      statusPenagihan: newRecord.statusWo === 'Done' ? 'Disetujui' : 'Draft',
      dailyReportWorkType: newRecord.workType,
      dailyReportReleaseDate: newRecord.releaseDate,
      dailyReportStartDate: newRecord.startDate,
      dailyReportFinishDate: newRecord.finishDate,
      dailyReportDurationDays: newRecord.durationDays,
      dailyReportEstimatedDistanceMeters: newRecord.estimatedDistanceMeters,
      dailyReportTotalDistanceMeters: newRecord.totalDistanceMeters,
      totalNominalRupiah: defaultNominal,
      remarks: newRecord.remarks,
      createdAt: now,
      updatedAt: now
    };

    setPenagihanList(prev => [newPenagihan, ...prev]);
    showToast('success', 'Daily Report & Tagihan Dibuat', `WO No. ${newRecord.woNumber} dan paket penagihan otomatis ditambahkan!`);
  };

  const updateDailyReport = (id: string, item: Partial<DailyReportItem>) => {
    recordSnapshot();
    const now = new Date().toISOString();
    setDailyReports(prev => prev.map(r => {
      if (r.id === id) {
        const updated = { ...r, ...item, updatedAt: now };
        if (item.statusWo === 'Done') {
          setPenagihanList(pList => pList.map(p => p.woNumber === updated.woNumber ? { ...p, statusPenagihan: 'Disetujui', updatedAt: now } : p));
        }
        return updated;
      }
      return r;
    }));
    showToast('success', 'Daily Report Diperbarui', `Perubahan data ID: ${id} tersimpan otomatis.`);
  };

  const deleteDailyReport = (id: string) => {
    const target = dailyReports.find(r => r.id === id);
    const woNum = target?.woNumber;

    // Collect linked item IDs
    const linkedBastIds = bastList.filter(b => woNum && b.woNumber === woNum).map(b => b.id);
    const linkedInvoiceIds = invoices.filter(i => woNum && i.woNumber === woNum).map(i => i.id);
    const linkedPenagihanIds = penagihanList.filter(p => woNum && p.woNumber === woNum).map(p => p.id);

    const allDeletedIds = [id, ...linkedBastIds, ...linkedInvoiceIds, ...linkedPenagihanIds];
    const allDeletedWos = woNum ? [woNum] : [];

    addTombstoneIds([...allDeletedIds, ...allDeletedWos]);
    purgeHistoryForDeleted(allDeletedIds, allDeletedWos);

    setDailyReports(prev => prev.filter(r => r.id !== id));
    if (woNum) {
      setPenagihanList(prev => prev.filter(p => p.woNumber !== woNum));
      setBastList(prev => prev.filter(b => b.woNumber !== woNum));
      setInvoices(prev => prev.filter(i => i.woNumber !== woNum));
    }
    showToast('error', 'Daily Report Dihapus Permanen', `Data WO ${woNum || id} beserta tagihan terkait telah dihapus permanen.`);
  };

  // CRUD BAST
  const addBAST = (item: Omit<BASTItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    recordSnapshot();
    const now = new Date().toISOString();
    const newRecord: BASTItem = {
      ...item,
      id: 'BAST-' + Math.floor(200 + Math.random() * 900),
      createdAt: now,
      updatedAt: now
    };
    setBastList(prev => [newRecord, ...prev]);
    showToast('success', 'Dokumen BAST Dibuat', `BAST untuk WO ${newRecord.woNumber} berhasil dibuat!`);
  };

  const updateBAST = (id: string, item: Partial<BASTItem>) => {
    recordSnapshot();
    const now = new Date().toISOString();
    setBastList(prev => prev.map(b => b.id === id ? { ...b, ...item, updatedAt: now } : b));
    showToast('success', 'Dokumen BAST Diperbarui', `Perubahan BAST ID: ${id} tersimpan otomatis.`);
  };

  const deleteBAST = (id: string) => {
    addTombstoneIds([id]);
    purgeHistoryForDeleted([id]);
    setBastList(prev => prev.filter(b => b.id !== id));
    showToast('error', 'Dokumen BAST Dihapus Permanen', `Dokumen BAST ${id} telah dihapus permanen.`);
  };

  // CRUD Invoice
  const addInvoice = (item: Omit<InvoiceItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    recordSnapshot();
    const now = new Date().toISOString();
    const newRecord: InvoiceItem = {
      ...item,
      id: 'INV-' + Math.floor(300 + Math.random() * 900),
      createdAt: now,
      updatedAt: now
    };
    setInvoices(prev => [newRecord, ...prev]);
    showToast('success', 'Invoice Diterbitkan', `No Invoice: ${newRecord.invoiceNumber} berhasil dibuat!`);
  };

  const updateInvoice = (id: string, item: Partial<InvoiceItem>) => {
    recordSnapshot();
    const now = new Date().toISOString();
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...item, updatedAt: now } : inv));
    showToast('success', 'Invoice Diperbarui', `Perubahan Invoice ID: ${id} tersimpan otomatis.`);
  };

  const deleteInvoice = (id: string) => {
    addTombstoneIds([id]);
    purgeHistoryForDeleted([id]);
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    showToast('error', 'Invoice Dihapus Permanen', `Invoice ID: ${id} telah dihapus permanen.`);
  };

  // CRUD Faktur Pajak
  const addFakturPajak = (item: Omit<FakturPajakItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    recordSnapshot();
    const now = new Date().toISOString();
    const newRecord: FakturPajakItem = {
      ...item,
      id: 'FP-' + Math.floor(1000 + Math.random() * 9000),
      createdAt: now,
      updatedAt: now
    };
    setFakturPajakList(prev => [newRecord, ...prev]);
    showToast('success', 'Faktur Pajak Dibuat', `NSFP: ${newRecord.nsfp} berhasil dibuat dan disimpan.`);
  };

  const updateFakturPajak = (id: string, item: Partial<FakturPajakItem>) => {
    recordSnapshot();
    const now = new Date().toISOString();
    setFakturPajakList(prev => prev.map(f => f.id === id ? { ...f, ...item, updatedAt: now } : f));
    showToast('success', 'Faktur Pajak Diperbarui', `Faktur Pajak ID: ${id} tersimpan otomatis.`);
  };

  const deleteFakturPajak = (id: string) => {
    addTombstoneIds([id]);
    purgeHistoryForDeleted([id]);
    setFakturPajakList(prev => prev.filter(f => f.id !== id));
    showToast('error', 'Faktur Pajak Dihapus', `Faktur Pajak ID: ${id} telah dihapus permanen.`);
  };

  // CRUD Penagihan
  const addPenagihan = (item: Omit<PenagihanItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    recordSnapshot();
    const now = new Date().toISOString();
    const newRecord: PenagihanItem = {
      ...item,
      id: 'PNG-' + Math.floor(500 + Math.random() * 900),
      createdAt: now,
      updatedAt: now
    };
    setPenagihanList(prev => [newRecord, ...prev]);
    showToast('success', 'Paket Penagihan Dibuat', `Kode Penagihan: ${newRecord.billingCode} tersimpan!`);
  };

  const updatePenagihan = (id: string, item: Partial<PenagihanItem>) => {
    recordSnapshot();
    const now = new Date().toISOString();
    setPenagihanList(prev => prev.map(p => p.id === id ? { ...p, ...item, updatedAt: now } : p));
    showToast('success', 'Paket Penagihan Diperbarui', `Checklist berkas penagihan ID: ${id} diperbarui.`);
  };

  const deletePenagihan = (id: string) => {
    addTombstoneIds([id]);
    purgeHistoryForDeleted([id]);
    setPenagihanList(prev => prev.filter(p => p.id !== id));
    showToast('error', 'Paket Penagihan Dihapus Permanen', `Paket penagihan ID: ${id} telah dihapus permanen.`);
  };

  return (
    <ProjectContext.Provider
      value={{
        isLoggedIn,
        currentUserEmail,
        userProfile,
        updateUserProfile,
        updatePassword,
        systemUsers,
        addSystemUser,
        updateSystemUser,
        deleteSystemUser,
        teams,
        addTeam,
        updateTeam,
        deleteTeam,
        login,
        logout,
        activeTab,
        setActiveTab,
        dashboardView,
        setDashboardView,
        autoSaveStatus,
        lastSavedTime,
        syncStatus,
        lastCloudSyncTime,
        triggerManualSync,
        dailyReports,
        bastList,
        invoices,
        fakturPajakList,
        penagihanList,
        toasts,
        showToast,
        dismissToast,
        addDailyReport,
        updateDailyReport,
        deleteDailyReport,
        addBAST,
        updateBAST,
        deleteBAST,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addFakturPajak,
        updateFakturPajak,
        deleteFakturPajak,
        addPenagihan,
        updatePenagihan,
        deletePenagihan,
        filters,
        setFilters,
        resetFilters,
        drilldownFilter,
        setDrilldownFilter,
        undo,
        redo,
        canUndo,
        canRedo,
        undoCount: past.length,
        redoCount: future.length
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};
