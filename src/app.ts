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
import { AppError } from './shared/utils/AppError';
import storageRoutes from './modules/storage/storage.routes';

const app: Application = express();
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for development; customise for production!
}));
app.use(cors());
app.use(express.json());

// Static Files (public folder)
app.use(express.static(path.join(__dirname, '../public')));

// Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Health Check (Old home page)
app.get('/api-status', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'MVP is running!',
    version: '1.0.0',
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
    documentation: '/docs'
  });
});

// Routes
app.use('/l', analyticsRoutes);
app.use('/api/v1/dealers', dealerRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);
app.use('/api/v1/storage', storageRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// Error Handler

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Default error values
  let statusCode = 500;
  let message = 'Something went wrong';

  // If it is an operational error we threw (AppError)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Log error details to console only in development (Security)
  if (process.env.NODE_ENV === 'development') {
    console.error('💥 Error 💥', err);
  }

  // Return a clean JSON response to the client
  res.status(statusCode).json({
    status: statusCode.toString().startsWith('4') ? 'fail' : 'error',
    message: message,
    // Show stack trace only in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;