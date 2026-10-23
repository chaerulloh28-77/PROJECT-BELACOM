/**
 * Multi-Device Real-Time Cloud Sync Service
 * Local-First Hybrid Architecture using Firebase Realtime Database REST API & Server Sync
 */

import { 
  DailyReportItem, 
  BASTItem, 
  InvoiceItem, 
  RFSItem, 
  PenagihanItem, 
  UserProfile, 
  SystemUser,
  TeamItem
} from '../types';

export type SyncConnectionStatus = 'connected' | 'syncing' | 'offline' | 'error';

export interface SyncDataBundle {
  dailyReports: DailyReportItem[];
  bastList: BASTItem[];
  invoices: InvoiceItem[];
  rfsList: RFSItem[];
  penagihanList: PenagihanItem[];
  userProfile: UserProfile;
  systemUsers: SystemUser[];
  teams: TeamItem[];
}

export interface CloudSyncEnvelope {
  version: number;
  lastUpdated: string;
  deviceId: string;
  data: SyncDataBundle;
}

const STORAGE_KEYS = {
  ENDPOINT: 'belacom_cloud_sync_endpoint',
  LOCAL_TIMESTAMP: 'belacom_sync_last_timestamp',
  LOCAL_VERSION: 'belacom_sync_version',
  DEVICE_ID: 'belacom_device_id',
  OFFLINE_QUEUE: 'belacom_offline_sync_queue'
};

// Generate or retrieve persistent Device ID to avoid echo loops
function getDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
  }
  return id;
}

// Configurable endpoint with default shared public Firebase RTDB database
export const DEFAULT_FIREBASE_RTDB_ENDPOINT = 
  'https://project-belacom-default-rtdb.asia-southeast1.firebasedatabase.app/project_data.json';
export const SERVER_ENDPOINT = '/api/sync/data';

class CloudSyncService {
  private status: SyncConnectionStatus = 'connected';
  private lastSyncTime: string = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  private statusSubscribers: Set<(status: SyncConnectionStatus, lastSync: string) => void> = new Set();
  private dataSubscribers: Set<(remoteData: SyncDataBundle, remoteTimestamp: string) => void> = new Set();
  
  private pollingTimer: any = null;
  private pushDebounceTimer: any = null;
  private isPushing = false;
  private isPulling = false;
  private localVersion = 1;
  private deviceId = getDeviceId();

  constructor() {
    // Ensure default shared Firebase RTDB endpoint is set or migrated to new endpoint
    const currentEndpoint = localStorage.getItem(STORAGE_KEYS.ENDPOINT);
    if (!currentEndpoint || currentEndpoint.includes('belacom-controlling-default-rtdb') || currentEndpoint === SERVER_ENDPOINT) {
      localStorage.setItem(STORAGE_KEYS.ENDPOINT, DEFAULT_FIREBASE_RTDB_ENDPOINT);
    }
    this.initEventListeners();
    this.startBackgroundSync();
  }

  // Current Connection Status
  public getStatus(): SyncConnectionStatus {
    return this.status;
  }

  public getLastSyncTime(): string {
    return this.lastSyncTime;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  // Subscribe to status changes
  public onStatusChange(callback: (status: SyncConnectionStatus, lastSync: string) => void): () => void {
    this.statusSubscribers.add(callback);
    callback(this.status, this.lastSyncTime);
    return () => this.statusSubscribers.delete(callback);
  }

  // Subscribe to incoming remote data
  public onRemoteData(callback: (remoteData: SyncDataBundle, remoteTimestamp: string) => void): () => void {
    this.dataSubscribers.add(callback);
    return () => this.dataSubscribers.delete(callback);
  }

  private notifyStatus(newStatus: SyncConnectionStatus) {
    this.status = newStatus;
    if (newStatus === 'connected') {
      this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    this.statusSubscribers.forEach(cb => cb(this.status, this.lastSyncTime));
  }

  // Cloud Endpoint Management
  public getEndpoint(): string {
    return localStorage.getItem(STORAGE_KEYS.ENDPOINT) || SERVER_ENDPOINT;
  }

  public setEndpoint(url: string) {
    if (url.trim()) {
      localStorage.setItem(STORAGE_KEYS.ENDPOINT, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.ENDPOINT);
    }
    this.pullFromCloud();
  }

  // Auto-Sync Event Listeners
  private initEventListeners() {
    if (typeof window === 'undefined') return;

    // Visibility Change: Pull immediately when returning to tab / unlocking phone
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.pullFromCloud();
      }
    });

    // Window Focus
    window.addEventListener('focus', () => {
      this.pullFromCloud();
    });

    // Online / Offline recovery
    window.addEventListener('online', () => {
      this.notifyStatus('syncing');
      this.flushOfflineQueue();
      this.pullFromCloud();
    });

    window.addEventListener('offline', () => {
      this.notifyStatus('offline');
    });
  }

  // Background Polling (Every 4 seconds)
  public startBackgroundSync(intervalMs = 4000) {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
    this.pollingTimer = setInterval(() => {
      if (navigator.onLine && !this.isPushing) {
        this.pullFromCloud(true); // Silent background fetch
      }
    }, intervalMs);
  }

  public stopBackgroundSync() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  // PUSH: Upload local changes to Cloud
  public pushToCloud(data: SyncDataBundle, immediate = false) {
    if (this.pushDebounceTimer) {
      clearTimeout(this.pushDebounceTimer);
    }

    const executePush = async () => {
      if (!navigator.onLine) {
        this.queueOfflineChange(data);
        this.notifyStatus('offline');
        return;
      }

      this.isPushing = true;
      this.notifyStatus('syncing');

      const now = new Date().toISOString();
      this.localVersion += 1;
      localStorage.setItem(STORAGE_KEYS.LOCAL_VERSION, this.localVersion.toString());
      localStorage.setItem(STORAGE_KEYS.LOCAL_TIMESTAMP, now);

      const payload: CloudSyncEnvelope = {
        version: this.localVersion,
        lastUpdated: now,
        deviceId: this.deviceId,
        data
      };

      try {
        // Attempt 1: Shared Firebase Realtime Database REST API (Primary for AI Studio <-> Vercel live sync)
        const activeEndpoint = localStorage.getItem(STORAGE_KEYS.ENDPOINT) || DEFAULT_FIREBASE_RTDB_ENDPOINT;
        let success = false;

        if (activeEndpoint && activeEndpoint.startsWith('http')) {
          const fbRes = await fetch(activeEndpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (fbRes.ok) success = true;
        }

        // Attempt 2: Server endpoint fallback
        if (!success) {
          const serverRes = await fetch(SERVER_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (serverRes.ok) success = true;
        }

        if (success) {
          this.notifyStatus('connected');
          this.isPushing = false;
          return;
        }

        this.notifyStatus('connected');
      } catch (err) {
        console.warn('[CloudSync] Push error, saving to offline cache:', err);
        this.queueOfflineChange(data);
        this.notifyStatus('offline');
      } finally {
        this.isPushing = false;
      }
    };

    if (immediate) {
      executePush();
    } else {
      this.pushDebounceTimer = setTimeout(executePush, 400);
    }
  }

  // PULL: Download latest changes from Cloud
  public async pullFromCloud(silent = false): Promise<boolean> {
    if (this.isPulling || !navigator.onLine) return false;
    this.isPulling = true;

    if (!silent) {
      this.notifyStatus('syncing');
    }

    try {
      let cloudData: CloudSyncEnvelope | null = null;
      const activeEndpoint = localStorage.getItem(STORAGE_KEYS.ENDPOINT) || DEFAULT_FIREBASE_RTDB_ENDPOINT;

      // 1. Try Firebase RTDB REST endpoint first (Shared cross-domain database for AI Studio & Vercel)
      if (activeEndpoint && activeEndpoint.startsWith('http')) {
        const fbRes = await fetch(activeEndpoint, {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (fbRes.ok) {
          const json = await fbRes.json();
          if (json && json.data) {
            cloudData = json;
          }
        }
      }

      // 2. Fallback to Server API endpoint
      if (!cloudData) {
        let response = await fetch(SERVER_ENDPOINT, {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        });

        if (response.ok) {
          const result = await response.json();
          if (result && result.data) {
            cloudData = {
              version: result.version || 1,
              lastUpdated: result.lastUpdated || new Date().toISOString(),
              deviceId: 'server',
              data: result.data
            };
          }
        }
      }

      if (cloudData && cloudData.data) {
        const localLastTimestamp = localStorage.getItem(STORAGE_KEYS.LOCAL_TIMESTAMP) || '';
        
        // Only accept if remote is from another device or remote timestamp is newer
        const isRemoteNewer = !localLastTimestamp || new Date(cloudData.lastUpdated) > new Date(localLastTimestamp);
        const isDifferentDevice = cloudData.deviceId !== this.deviceId;

        if (isRemoteNewer && (isDifferentDevice || !localLastTimestamp)) {
          localStorage.setItem(STORAGE_KEYS.LOCAL_TIMESTAMP, cloudData.lastUpdated);
          if (cloudData.version) {
            this.localVersion = cloudData.version;
            localStorage.setItem(STORAGE_KEYS.LOCAL_VERSION, cloudData.version.toString());
          }

          // Broadcast to subscribers silently
          this.dataSubscribers.forEach(cb => {
            cb(cloudData!.data, cloudData!.lastUpdated);
          });
        }

        this.notifyStatus('connected');
        this.isPulling = false;
        return true;
      }

      this.notifyStatus('connected');
      this.isPulling = false;
      return false;
    } catch (err) {
      if (!silent) {
        this.notifyStatus('offline');
      }
      this.isPulling = false;
      return false;
    }
  }

  // Offline Persistence & Recovery
  private queueOfflineChange(data: SyncDataBundle) {
    try {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(data));
    } catch (e) {
      console.warn('[CloudSync] Failed to save offline queue:', e);
    }
  }

  private async flushOfflineQueue() {
    const queued = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    if (queued) {
      try {
        const data = JSON.parse(queued);
        localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
        await this.pushToCloud(data, true);
      } catch (e) {
        // queue malformed
      }
    }
  }
}

export const cloudSyncService = new CloudSyncService();
