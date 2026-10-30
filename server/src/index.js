import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.js';
import loyaltyRoutes from './routes/loyalty.js';
import adminMenuRoutes from './routes/adminMenu.js';
import adminAuthRoutes from './routes/adminAuth.js';
import superAdminRoutes from './routes/superAdmin.js';
import { adminActivityLogger } from './middleware/activityLogger.js';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import branchRoutes from './routes/branches.js';
import adminBranchRoutes from './routes/adminBranches.js';
import uploadRoutes from './routes/upload.js';
import deliveryZoneRoutes from './routes/deliveryZones.js';
import collectionRoutes from './routes/collections.js';
import adminCollectionRoutes from './routes/adminCollections.js';
import adminPromoRoutes from './routes/adminPromos.js';
import promoRoutes from './routes/promos.js';
import paymentRoutes from './routes/payments.js';

import { apiLimiter } from './middleware/rateLimit.js';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'CLIENT_ORIGIN'];
for (const key of REQUIRED) {
  if (!process.env[key] || process.env[key].startsWith('PLACEHOLDER')) {
    console.error(`❌ Missing or placeholder env: ${key}`);
    process.exit(1);
  }
}

const app = express();
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProd ? undefined : false,
}));

const allowedOrigins = process.env.CLIENT_ORIGIN.split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '100kb' }));
app.use('/uploads', express.static('public/uploads'));
app.use(cookieParser());
app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => res.json({ ok: true, env: process.env.NODE_ENV }));
app.use('/api/admin', adminActivityLogger);
app.use('/api/super', adminActivityLogger, superAdminRoutes);
app.use('/api/loyalty/admin', adminActivityLogger);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/auth',   authRoutes);
app.use('/api',        menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/admin/branches', adminBranchRoutes);
app.use('/api/admin',  adminMenuRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/delivery-zones', deliveryZoneRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/admin/collections', adminCollectionRoutes);
app.use('/api/admin/promos', adminPromoRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/v1', paymentRoutes);   // /api/v1/mpesa/stkpush, /api/v1/mpesa/callback, /api/v1/mpesa/status/:id

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  if (isProd) {
    res.status(err.status || 500).json({ error: 'Something went wrong' });
  } else {
    res.status(err.status || 500).json({ error: err.message, stack: err.stack });
  }
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Mongo connected');
    const server = app.listen(PORT, () =>
      console.log(`🚀 API on http://localhost:${PORT} [${process.env.NODE_ENV}]`));

    const shutdown = () => {
      console.log('\nShutting down…');
      server.close(() => mongoose.disconnect().then(() => process.exit(0)));
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })
  .catch(err => { console.error('Mongo error:', err); process.exit(1); });
