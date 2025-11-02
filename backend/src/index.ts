import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRoutes from './routes/upload';
import processRoutes from './routes/process';
import downloadRoutes from './routes/download';
import cleanupService from './services/cleanupService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '52428800', 10); // 50MB default

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api', processRoutes);
app.use('/api/download', downloadRoutes);

// Admin endpoint (protected by secret)
app.get('/admin/stats', (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET || 'change-me';
  const providedSecret = req.headers['x-admin-secret'];

  if (providedSecret !== adminSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  const status = (err as { status?: number })?.status || 500;
  const message = (err instanceof Error ? err.message : 'Internal server error');
  res.status(status).json({
    error: message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Max file size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Start cleanup service
  const cleanupInterval = parseInt(process.env.CLEANUP_INTERVAL || '7200000', 10); // 2 hours default
  cleanupService.start(cleanupInterval);
  console.log(`Cleanup service started (interval: ${cleanupInterval}ms)`);
});

export default app;

