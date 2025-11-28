import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import { startMQTTBroker } from './config/mqtt.js';
import authRoutes from './routes/authRoutes.js';
import kitRoutes from './routes/kitRoutes.js';
import pompeRoutes from './routes/pompeRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import sensorRoutes from './routes/sensorRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MQTT_ENABLED = process.env.MQTT_ENABLED !== 'false';

connectDB();

if (MQTT_ENABLED) {
  startMQTTBroker();
}

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ALLOWED_ORIGINS || '*' }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard' }
});

app.use('/api/', limiter);

app.get('/', (req, res) => {
  res.json({
    name: 'AGRO BOOST API',
    version: '1.0.0',
    mqtt: {
      enabled: MQTT_ENABLED,
      port: process.env.MQTT_PORT || 1883
    },
    endpoints: {
      auth: '/api/auth',
      kits: '/api/kits',
      pompes: '/api/pompes',
      schedules: '/api/schedules',
      sensors: '/api/sensors',
      notifications: '/api/notifications'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/kits', kitRoutes);
app.use('/api/pompes', pompeRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, res) => res.status(404).json({ error: 'Endpoint non trouvé' }));

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur interne' });
});

app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚜 AGRO BOOST Backend API');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🌐 REST API: http://localhost:${PORT}`);
  console.log(`📡 MQTT Broker: ${MQTT_ENABLED ? `localhost:${process.env.MQTT_PORT || 1883}` : 'Disabled'}`);
  console.log(`📊 Mode: ${process.env.APP_MODE || 'production'}`);
  console.log(`💾 MongoDB: ${process.env.MONGODB_URI ? 'Configured ✓' : 'Not configured ✗'}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📡 API Endpoints:');
  console.log('   POST   /api/auth/login');
  console.log('   POST   /api/auth/register');
  console.log('   GET    /api/kits');
  console.log('   GET    /api/kits/:kitId');
  console.log('   POST   /api/pompes/:kitId/control');
  console.log('   POST   /api/schedules/:kitId');
  console.log('   PUT    /api/schedules/:kitId/:scheduleIndex');
  console.log('   DELETE /api/schedules/:kitId/:scheduleIndex');
  console.log('   GET    /api/sensors/:kitId?period=24h');
  console.log('   GET    /api/sensors/:kitId/latest');
  console.log('   GET    /api/sensors/:kitId/type?type=humidity&period=24h');
  console.log('   POST   /api/sensors/log');
  console.log('   GET    /api/notifications');
  console.log('   PATCH  /api/notifications/:notifId/read');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

export default app;
