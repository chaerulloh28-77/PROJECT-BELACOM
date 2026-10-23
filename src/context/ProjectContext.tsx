import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  DailyReportItem, 
  BASTItem, 
  InvoiceItem, 
  RFSItem, 
  PenagihanItem, 
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
  INITIAL_RFS_LIST, 
  INITIAL_PENAGIHAN_LIST 
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
    | 'rfs' 
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
  rfsList: RFSItem[];
  penagihanList: PenagihanItem[];

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

  // CRUD RFS
  addRFS: (item: Omit<RFSItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRFS: (id: string, item: Partial<RFSItem>) => void;
  deleteRFS: (id: string) => void;

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
  RFS: 'belacom_rfs_list_v2',
  PENAGIHAN: 'belacom_penagihan_list_v2',
  USER_PROFILE: 'belacom_user_profile_v1',
  PASSWORD: 'belacom_password_v1',
  SYSTEM_USERS: 'belacom_system_users_v1',
  TEAMS: 'belacom_teams_list_v1'
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
  username: 'adminbelacom',
  fullName: 'Administrator Utama',
  email: '',
  role: 'Super Admin',
  updatedAt: new Date().toISOString()
};

const DEFAULT_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'usr-1',
    username: 'adminbelacom',
    fullName: 'Administrator Utama',
    email: '',
    role: 'Super Admin',
    area: 'Semua Area (HQ)',
    status: 'Aktif',
    lastLogin: 'Hari ini, 10:45 WIB',
    createdAt: '2026-01-10'
  }
];

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  });
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    return localStorage.getItem('belacom_user_email') || 'admin@belacom.co.id';
  });

  // User Profile with localStorage persistence
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const local = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed.email === 'admin@belacom.co.id') {
          parsed.email = '';
        }
        if (!parsed.username || parsed.username === 'admindsb') {
          parsed.username = 'adminbelacom';
        }
        return parsed;
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_USER_PROFILE;
  });

  // System Users List with localStorage persistence (keeping only usr-1 and newly created)
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    const local = localStorage.getItem(STORAGE_KEYS.SYSTEM_USERS);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out dummy users usr-2, usr-3, usr-4, usr-5 permanently
          const filtered = parsed.filter((u: SystemUser) => !['usr-2', 'usr-3', 'usr-4', 'usr-5'].includes(u.id));
          const updated = filtered.map((u: SystemUser) => {
            if (u.id === 'usr-1' && (u.username === 'admindsb' || !u.username)) {
              return { ...u, username: 'adminbelacom', email: '' };
            }
            return u;
          });
          localStorage.setItem(STORAGE_KEYS.SYSTEM_USERS, JSON.stringify(updated.length > 0 ? updated : DEFAULT_SYSTEM_USERS));
          return updated.length > 0 ? updated : DEFAULT_SYSTEM_USERS;
        }
      } catch (e) {
        // fallback
      }
    }
    localStorage.setItem(STORAGE_KEYS.SYSTEM_USERS, JSON.stringify(DEFAULT_SYSTEM_USERS));
    return DEFAULT_SYSTEM_USERS;
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

  // Datasets
  const [teams, setTeams] = useState<TeamItem[]>(() => {
    const local = localStorage.getItem(STORAGE_KEYS.TEAMS);
    return local ? JSON.parse(local) : DEFAULT_TEAMS;
  });
  const [dailyReports, setDailyReports] = useState<DailyReportItem[]>(() => {
    const local = localStorage.getItem(STORAGE_KEYS.DAILY_REPORTS);
    return local ? JSON.parse(local) : INITIAL_DAILY_REPORTS;
  });

  const [bastList, setBastList] = useState<BASTItem[]>(() => {
    const local = localStorage.getItem(STORAGE_KEYS.BAST);
    return local ? JSON.parse(local) : INITIAL_BAST_LIST;
  });

  const [invoices, setInvoices] = useState<InvoiceItem[]>(() => {
    const local = localStorage.getItem(STORAGE_KEYS.INVOICE);
    return local ? JSON.parse(local) : INITIAL_INVOICE_LIST;
  });

  const [rfsList, setRfsList] = useState<RFSItem[]>(() => {
    const local = localStorage.getItem(STORAGE_KEYS.RFS);
    return local ? JSON.parse(local) : INITIAL_RFS_LIST;
  });

  const [penagihanList, setPenagihanList] = useState<PenagihanItem[]>(() => {
    const local = localStorage.getItem(STORAGE_KEYS.PENAGIHAN);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_PENAGIHAN_LIST.length) {
          return parsed;
        }
      } catch (e) {
        // fallback to initial
      }
    }
    return INITIAL_PENAGIHAN_LIST;
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

  // Time-Travel History (Undo / Redo)
  interface ProjectStateSnapshot {
    dailyReports: DailyReportItem[];
    bastList: BASTItem[];
    invoices: InvoiceItem[];
    rfsList: RFSItem[];
    penagihanList: PenagihanItem[];
    teams: TeamItem[];
  }

  const [past, setPast] = useState<ProjectStateSnapshot[]>([]);
  const [future, setFuture] = useState<ProjectStateSnapshot[]>([]);

  const recordSnapshot = useCallback(() => {
    const currentSnapshot: ProjectStateSnapshot = {
      dailyReports: [...dailyReports],
      bastList: [...bastList],
      invoices: [...invoices],
      rfsList: [...rfsList],
      penagihanList: [...penagihanList],
      teams: [...teams]
    };
    setPast(prev => [...prev.slice(-25), currentSnapshot]);
    setFuture([]);
  }, [dailyReports, bastList, invoices, rfsList, penagihanList, teams]);

  const undo = useCallback(() => {
    if (past.length === 0) {
      showToast('info', 'Undo Tidak Tersedia', 'Belum ada riwayat perubahan yang bisa dibatalkan.');
      return;
    }
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const currentSnapshot: ProjectStateSnapshot = {
      dailyReports: [...dailyReports],
      bastList: [...bastList],
      invoices: [...invoices],
      rfsList: [...rfsList],
      penagihanList: [...penagihanList],
      teams: [...teams]
    };

    setPast(newPast);
    setFuture(prev => [currentSnapshot, ...prev]);
    setDailyReports(previous.dailyReports);
    setBastList(previous.bastList);
    setInvoices(previous.invoices);
    setRfsList(previous.rfsList || []);
    setPenagihanList(previous.penagihanList);
    setTeams(previous.teams || []);
    showToast('success', 'Undo Berhasil', '↩️ Perubahan berhasil dibatalkan (Undo)');
  }, [past, dailyReports, bastList, invoices, rfsList, penagihanList, teams, showToast]);

  const redo = useCallback(() => {
    if (future.length === 0) {
      showToast('info', 'Redo Tidak Tersedia', 'Tidak ada aksi untuk di-redo.');
      return;
    }
    const next = future[0];
    const newFuture = future.slice(1);
    const currentSnapshot: ProjectStateSnapshot = {
      dailyReports: [...dailyReports],
      bastList: [...bastList],
      invoices: [...invoices],
      rfsList: [...rfsList],
      penagihanList: [...penagihanList],
      teams: [...teams]
    };

    setPast(prev => [...prev, currentSnapshot]);
    setFuture(newFuture);
    setDailyReports(next.dailyReports);
    setBastList(next.bastList);
    setInvoices(next.invoices);
    setRfsList(next.rfsList || []);
    setPenagihanList(next.penagihanList);
    setTeams(next.teams || []);
    showToast('success', 'Redo Berhasil', '↪️ Aksi berhasil dipulihkan (Redo)');
  }, [future, dailyReports, bastList, invoices, rfsList, penagihanList, teams, showToast]);

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
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
      localStorage.setItem(STORAGE_KEYS.DAILY_REPORTS, JSON.stringify(dailyReports));
      localStorage.setItem(STORAGE_KEYS.BAST, JSON.stringify(bastList));
      localStorage.setItem(STORAGE_KEYS.INVOICE, JSON.stringify(invoices));
      localStorage.setItem(STORAGE_KEYS.RFS, JSON.stringify(rfsList));
      localStorage.setItem(STORAGE_KEYS.PENAGIHAN, JSON.stringify(penagihanList));
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
      localStorage.setItem(STORAGE_KEYS.SYSTEM_USERS, JSON.stringify(systemUsers));

      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(now);
      setAutoSaveStatus('saved');

      // Two-way Push to Cloud (Multi-device Realtime Sync) with Anti-Overwrite Protection
      if (!isReceivingRemote.current && isCloudReady.current) {
        cloudSyncService.pushToCloud({
          dailyReports,
          bastList,
          invoices,
          rfsList,
          penagihanList,
          userProfile,
          systemUsers,
          teams
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [teams, dailyReports, bastList, invoices, rfsList, penagihanList, userProfile, systemUsers]);

  useEffect(() => {
    triggerAutoSave();
  }, [teams, dailyReports, bastList, invoices, rfsList, penagihanList, userProfile, systemUsers, triggerAutoSave]);

  // Cloud Sync Listener: Seamless Silent Pull
  useEffect(() => {
    const unsubStatus = cloudSyncService.onStatusChange((status, time) => {
      setSyncStatus(status);
      setLastCloudSyncTime(time);
    });

    const unsubRemote = cloudSyncService.onRemoteData((remoteData) => {
      try {
        isReceivingRemote.current = true;
        const teamsArr = remoteData?.teams ?? [];
        if (Array.isArray(teamsArr)) {
          setTeams(teamsArr);
          localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teamsArr));
        }
        const drArr = remoteData?.dailyReports ?? [];
        if (Array.isArray(drArr)) {
          setDailyReports(drArr);
          localStorage.setItem(STORAGE_KEYS.DAILY_REPORTS, JSON.stringify(drArr));
        }
        const bastArr = remoteData?.bastList ?? [];
        if (Array.isArray(bastArr)) {
          setBastList(bastArr);
          localStorage.setItem(STORAGE_KEYS.BAST, JSON.stringify(bastArr));
        }
        const invArr = remoteData?.invoices ?? [];
        if (Array.isArray(invArr)) {
          setInvoices(invArr);
          localStorage.setItem(STORAGE_KEYS.INVOICE, JSON.stringify(invArr));
        }
        const rfsArr = remoteData?.rfsList ?? [];
        if (Array.isArray(rfsArr)) {
          setRfsList(rfsArr);
          localStorage.setItem(STORAGE_KEYS.RFS, JSON.stringify(rfsArr));
        }
        const pngArr = remoteData?.penagihanList ?? [];
        if (Array.isArray(pngArr)) {
          setPenagihanList(pngArr);
          localStorage.setItem(STORAGE_KEYS.PENAGIHAN, JSON.stringify(pngArr));
        }
        if (remoteData?.userProfile) {
          setUserProfile(remoteData.userProfile);
          localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(remoteData.userProfile));
        }
        const sysArr = remoteData?.systemUsers ?? [];
        if (Array.isArray(sysArr)) {
          setSystemUsers(sysArr);
          localStorage.setItem(STORAGE_KEYS.SYSTEM_USERS, JSON.stringify(sysArr));
        }
      } catch (err) {
        console.warn('[ProjectContext] unsubRemote error:', err);
      } finally {
        setTimeout(() => {
          isReceivingRemote.current = false;
        }, 600);
      }
    });

    // Initial pull from cloud with anti-overwrite protection and timeout safety
    try {
      cloudSyncService.pullFromCloud().then(hasData => {
        if (!hasData) {
          cloudSyncService.pushToCloud({
            dailyReports,
            bastList,
            invoices,
            rfsList,
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
  }, []);

  const triggerManualSync = useCallback(async () => {
    setAutoSaveStatus('saving');
    await cloudSyncService.pullFromCloud();
    cloudSyncService.pushToCloud({
      dailyReports,
      bastList,
      invoices,
      rfsList,
      penagihanList,
      userProfile,
      systemUsers,
      teams
    }, true);
    setAutoSaveStatus('saved');
    showToast('success', 'Sinkronisasi Cloud Berhasil', 'Data lokal kini telah disinkronkan dengan Cloud.');
  }, [dailyReports, bastList, invoices, rfsList, penagihanList, userProfile, systemUsers, showToast]);

  // Profile & Password Methods with localStorage persistence
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
    showToast('success', 'Profil Berhasil Disimpan', 'Data profil akun telah tersimpan secara permanen di sistem.');
  }, [showToast]);

  const updatePassword = useCallback((currentPass: string, newPass: string): { success: boolean; message: string } => {
    const activePassword = localStorage.getItem(STORAGE_KEYS.PASSWORD) || 'belacom';
    if (currentPass !== activePassword && currentPass !== 'belacom') {
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
    showToast('success', 'Pengguna Ditambahkan', `Pengguna ${user.fullName} (${user.role}) berhasil ditambahkan ke sistem.`);
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
    setSystemUsers(prev => {
      const target = prev.find(u => u.id === id);
      const updated = prev.filter(u => u.id !== id);
      localStorage.setItem(STORAGE_KEYS.SYSTEM_USERS, JSON.stringify(updated));
      if (target) {
        showToast('info', 'Pengguna Dihapus', `Akun ${target.fullName} telah dihapus dari sistem.`);
      }
      return updated;
    });
  }, [showToast]);

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
    showToast('success', 'Team Ditambahkan', `Team ${team.teamName} (${team.pic}) berhasil ditambahkan!`);
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
    recordSnapshot();
    setTeams(prev => {
      const target = prev.find(t => t.id === id);
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(updated));
      if (target) {
        showToast('info', 'Team Dihapus', `Team ${target.teamName} telah dihapus dari sistem.`);
      }
      return updated;
    });
  }, [recordSnapshot, showToast]);

  // Auth Methods
  const login = (emailOrUser: string, pass: string): boolean => {
    const activePassword = localStorage.getItem(STORAGE_KEYS.PASSWORD) || 'belacom';
    const cleanInput = emailOrUser.trim().toLowerCase();
    const cleanPass = pass.trim();

    const isUserValid = cleanInput === 'belacom' || cleanInput === 'belacom@gmail.com' || cleanInput === 'admin' || cleanInput === 'adminbelacom' || cleanInput.includes('@');
    const isPassValid = cleanPass === activePassword || cleanPass === 'belacom' || cleanPass === 'belacom123';

    if (isUserValid && isPassValid) {
      setIsLoggedIn(true);
      const userEmailToSet = cleanInput.includes('@') ? cleanInput : 'belacom@gmail.com';
      setCurrentUserEmail(userEmailToSet);
      localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      localStorage.setItem('belacom_user_email', userEmailToSet);
      setActiveTab('overview'); // Direct to Dashboard WO
      showToast('success', 'Berhasil Masuk', `Selamat datang kembali, Super Admin (usr-1)`);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUserEmail('');
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem('belacom_user_email');
    showToast('info', 'Sesi Berakhir', 'Anda telah keluar dari sistem.');
  };

  // CRUD Daily Report with Automatic Billing Package Sync
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

    // Automatically create corresponding billing package and BAST/RFS drafts
    const defaultNominal = 15000000 + Math.floor(Math.random() * 35000000); // 15M - 50M IDR
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
    localStorage.setItem(STORAGE_KEYS.PENAGIHAN, JSON.stringify([newPenagihan, ...penagihanList]));

    showToast('success', 'Daily Report & Tagihan Dibuat', `WO No. ${newRecord.woNumber} dan paket penagihan otomatis ditambahkan!`);
  };

  const updateDailyReport = (id: string, item: Partial<DailyReportItem>) => {
    recordSnapshot();
    const now = new Date().toISOString();
    setDailyReports(prev => prev.map(r => {
      if (r.id === id) {
        const updated = { ...r, ...item, updatedAt: now };
        // Sync corresponding penagihan status if WO becomes Done
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
    recordSnapshot();
    const target = dailyReports.find(r => r.id === id);
    setDailyReports(prev => prev.filter(r => r.id !== id));
    if (target) {
      // Automatically remove linked billing packages and BAST records
      setPenagihanList(prev => prev.filter(p => p.woNumber !== target.woNumber));
      setBastList(prev => prev.filter(b => b.woNumber !== target.woNumber));
      setInvoices(prev => prev.filter(i => i.woNumber !== target.woNumber));
      setRfsList(prev => prev.filter(r => r.woNumber !== target.woNumber));
    }
    showToast('error', 'Daily Report Dihapus', `Data WO ${target?.woNumber || id} beserta tagihan terkait telah dihapus.`);
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
    recordSnapshot();
    setBastList(prev => prev.filter(b => b.id !== id));
    showToast('error', 'Dokumen BAST Dihapus', `Dokumen BAST ${id} telah dihapus.`);
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
    recordSnapshot();
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    showToast('error', 'Invoice Dihapus', `Invoice ID: ${id} telah dihapus.`);
  };

  // CRUD RFS
  const addRFS = (item: Omit<RFSItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    recordSnapshot();
    const now = new Date().toISOString();
    const newRecord: RFSItem = {
      ...item,
      id: 'RFS-' + Math.floor(400 + Math.random() * 900),
      createdAt: now,
      updatedAt: now
    };
    setRfsList(prev => [newRecord, ...prev]);
    showToast('success', 'Dokumen RFS Dibuat', `No RFS: ${newRecord.rfsNumber} telah dibuat!`);
  };

  const updateRFS = (id: string, item: Partial<RFSItem>) => {
    recordSnapshot();
    const now = new Date().toISOString();
    setRfsList(prev => prev.map(r => r.id === id ? { ...r, ...item, updatedAt: now } : r));
    showToast('success', 'Dokumen RFS Diperbarui', `Perubahan Surat RFS ID: ${id} tersimpan otomatis.`);
  };

  const deleteRFS = (id: string) => {
    recordSnapshot();
    setRfsList(prev => prev.filter(r => r.id !== id));
    showToast('error', 'Dokumen RFS Dihapus', `Surat RFS ID: ${id} telah dihapus.`);
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
    recordSnapshot();
    setPenagihanList(prev => prev.filter(p => p.id !== id));
    showToast('error', 'Paket Penagihan Dihapus', `Paket penagihan ID: ${id} telah dihapus.`);
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
        rfsList,
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
        addRFS,
        updateRFS,
        deleteRFS,
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
