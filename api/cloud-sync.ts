import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const SYNC_FILE_PATH = path.resolve(process.cwd(), 'cloud_sync_db.json');

// In-memory cache for ultra-fast response
let syncCache: {
  version: number;
  lastUpdated: string;
  data: any;
} = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  data: null
};

// Initialize from file if exists
try {
  if (fs.existsSync(SYNC_FILE_PATH)) {
    const raw = fs.readFileSync(SYNC_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.data) {
      syncCache = parsed;
    }
  }
} catch (err) {
  console.warn('[CloudSync Server] Initializing fresh sync database:', err);
}

export function handleGetCloudSync(req: Request, res: Response) {
  res.json({
    success: true,
    version: syncCache.version,
    lastUpdated: syncCache.lastUpdated,
    data: syncCache.data
  });
}

export function handlePostCloudSync(req: Request, res: Response) {
  try {
    const { data, timestamp } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, message: 'Data payload is required' });
    }

    syncCache.version += 1;
    syncCache.lastUpdated = timestamp || new Date().toISOString();
    syncCache.data = data;

    // Asynchronously persist to file
    fs.writeFile(SYNC_FILE_PATH, JSON.stringify(syncCache, null, 2), (err) => {
      if (err) {
        console.error('[CloudSync Server] Error persisting sync file:', err);
      }
    });

    res.json({
      success: true,
      version: syncCache.version,
      lastUpdated: syncCache.lastUpdated
    });
  } catch (error: any) {
    console.error('[CloudSync Server] Error in handlePostCloudSync:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
}

export function handleGetSyncStatus(req: Request, res: Response) {
  res.json({
    status: 'connected',
    provider: 'Firebase RTDB + Local-First Server Sync',
    version: syncCache.version,
    lastUpdated: syncCache.lastUpdated,
    timestamp: new Date().toISOString()
  });
}
