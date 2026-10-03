import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import clientRoutes from './routes/client.routes';
import projectRoutes from './routes/project.routes';
import paymentRoutes from './routes/payment.routes';
import leadRoutes from './routes/lead.routes';
import eventRoutes from './routes/event.routes';
import financeRoutes from './routes/finance.routes';

const app = express();

// Security and utility middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = [config.frontendOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'];
      if (allowed.includes(origin) || origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint (PRD Non-Functional Requirement)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Infynux Business OS API',
    uptime: process.uptime(),
  });
});

// API Routes (Mounted under /api/v1 as per PRD Section 9)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/finance', financeRoutes);

// Centralized Error Handler
app.use(errorHandler);

// In production, serve the compiled Vite frontend from client/dist if present
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA fallback for React client-side routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Infynux Business OS API running on port ${PORT} [${config.nodeEnv}]`);
  console.log(`📡 Endpoints active under http://localhost:${PORT}/api/v1`);
});

export default app;
