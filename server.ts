import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmailHandler } from './api/send-email.js';
import { handleGetCloudSync, handlePostCloudSync, handleGetSyncStatus } from './api/cloud-sync.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Body parser with 25mb limit for PDF Base64 attachments
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Route: Send Email with Attachments via Resend
  app.post('/api/send-email', (req, res) => {
    sendEmailHandler(req, res);
  });

  // API Routes: Multi-Device Real-Time Cloud Sync
  app.get('/api/sync/data', handleGetCloudSync);
  app.post('/api/sync/data', handlePostCloudSync);
  app.get('/api/sync/status', handleGetSyncStatus);

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
      server: { middlewareMode: true },
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
