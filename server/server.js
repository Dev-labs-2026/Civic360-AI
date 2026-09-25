import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB, { getDbStatus } from './config/db.js';
import Complaint from './models/Complaint.js';
import { seedDatabase } from './utils/seedData.js';

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
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads folder
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint - reports comprehensive database status
app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  const isHealthy = dbStatus.connected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: 'Civic360 AI Backend Service',
    database: {
      connected: dbStatus.connected,
      status: dbStatus.status,
      type: dbStatus.type,
      host: dbStatus.host,
      name: dbStatus.name,
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
    database: getDbStatus().type,
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
  console.error('Unhandled Server Error:', err.message);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Start Server strictly AFTER database connection succeeds
const startServer = async () => {
  try {
    console.log('🔄 Initializing database connection...');
    await connectDB();

    // Check if initial seed is needed (e.g. fresh database without complaints)
    try {
      const complaintCount = await Complaint.countDocuments();
      if (complaintCount === 0) {
        console.log('ℹ️ Empty database detected. Seeding initial demo complaints...');
        await seedDatabase();
      }
    } catch (seedErr) {
      console.warn('⚠️ Seed check skipped:', seedErr.message);
    }

    // Start listening on configured port
    app.listen(PORT, () => {
      const dbInfo = getDbStatus();
      console.log(`===============================================`);
      console.log(`🚀 Civic360 AI Server running on port ${PORT}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🗄️ Database:     ${dbInfo.type} (${dbInfo.host || 'active'})`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error(`❌ Fatal: Database connection failed. Express server will NOT start.`);
    console.error(`   Reason: ${error.message}`);
    process.exit(1);
  }
};

startServer();

export default app;
