import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB, { getDbStatus } from './config/db.js';
import { seedDatabase } from './utils/seedData.js';
import { startSlaEscalationScheduler } from './services/slaService.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import officerRoutes from './routes/officerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load server/.env to ensure variables are available regardless of launch CWD
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = new Set((process.env.CORS_ORIGINS || '')
  .split(',').map((origin) => origin.trim()).filter(Boolean));
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:5173');
}
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(Object.assign(new Error('Origin is not allowed.'), { status: 403 }));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}));
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb', parameterLimit: 100 }));

// Static uploads folder
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check intentionally returns only non-sensitive service/database state.
app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  const isHealthy = dbStatus.connected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: 'Civic360 AI Backend Service',
    database: {
      connected: dbStatus.connected,
    },
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Civic360 AI REST API',
    documentation: '/api/health',
    version: '1.0.0',
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Request failed:', err.message);
  const statusCode = err.status || (err.type === 'entity.too.large' ? 413 : res.statusCode === 200 ? 500 : res.statusCode);
  res.status(statusCode).json({
    success: false,
    message: statusCode === 413 ? 'Request body is too large.' : statusCode === 403 ? 'Request origin is not allowed.' : 'Request could not be completed.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Start Server strictly AFTER database connection succeeds
const startServer = async () => {
  try {
    console.log('🔄 Initializing database connection...');
    await connectDB();

    // The seeder checks all collections and only runs automatically on an empty database.
    try {
      await seedDatabase();
    } catch (seedErr) {
      console.warn('⚠️ Demo seeding failed safely; existing data was not cleared:', seedErr.message);
    }

    // Start listening on configured port
    app.listen(PORT, () => {
      startSlaEscalationScheduler();
      const dbInfo = getDbStatus();
      console.log(`===============================================`);
      console.log(`🚀 Civic360 AI Server running on port ${PORT}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🗄️ Database:     ${dbInfo.connected ? 'connected' : 'disconnected'}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error(`❌ Fatal: Database connection failed. Express server will NOT start.`);
    process.exit(1);
  }
};

startServer();

export default app;
