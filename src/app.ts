import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

import * as swaggerDocument from './docs/swagger.json';

import dealerRoutes from './modules/dealers/dealers.routes';
import authRoutes from './modules/auth/auth.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import ordersRoutes from './modules/orders/orders.routes';
import appointmentsRoutes from './modules/appointments/appointments.routes';

const app: Application = express();
app.use(helmet({
  contentSecurityPolicy: false, // Geliştirme için devre dışı bırakıldı, üretimde özelleştirilmeli !!!!
}));
app.use(cors());
app.use(express.json());

// Statik Dosyalar (public klasörü)
app.use(express.static(path.join(__dirname, '../public')));

// Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Durum Kontrolü (Eski ana sayfa)
app.get('/api-status', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'MVP is running!',
    version: '1.0.0',
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
    documentation: '/docs'
  });
});

// Rotalar
app.use('/l', analyticsRoutes);
app.use('/api/v1/dealers', dealerRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Kritik Hata]:', err.stack);
  const statusCode = (err as any).statusCode || 500;

  const message = (statusCode === 500 && process.env.NODE_ENV !== 'development')
    ? 'An unexpected error occurred'
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal Server Error' : 'Error',
    message
  });
});

export default app;