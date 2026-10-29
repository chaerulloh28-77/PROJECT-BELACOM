import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleGetCloudSync, handlePostCloudSync, handleGetSyncStatus } from './api/cloud-sync.js';
import { handleLoginNotify } from './api/audit-notify.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Body parser with 25mb limit for PDF Base64 attachments
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Routes: Multi-Device Real-Time Cloud Sync
  app.get('/api/sync/data', handleGetCloudSync);
  app.post('/api/sync/data', handlePostCloudSync);
  app.get('/api/sync/status', handleGetSyncStatus);

  // API Route: Security Audit & Email Notification Dispatcher
  app.post('/api/audit-notify', handleLoginNotify);
  app.get('/api/audit-notify', handleLoginNotify);
  app.post('/api/audit/login-notify', handleLoginNotify);
  app.get('/api/audit/login-notify', handleLoginNotify);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Controlling Project Belacom API',
      timestamp: new Date().toISOString()
    });
  });

  // In production, serve dist folder. In development, mount Vite middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Belacom Server] Berjalan pada http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Belacom Server] Gagal memulai server:', err);
  process.exit(1);
});
