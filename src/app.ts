import express, {Application, Request, Response, NextFunction} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { version } from 'os';
import { time } from 'console';
import path from 'path';

import dealerRoutes from './modules/dealers/dealers.routes';
import authRoutes from './modules/auth/auth.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

// app initialization
const app: Application = express(); 

// middlewares
app.use(helmet()); // automatically secures HTTP headers
app.use(cors()); // browser security
app.use(express.json()); // parse JSON request bodies

// basic health check route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'MVP is running!',
    version: '1.0.0',
    env: process.env.NODE_ENV,
    time: new Date().toISOString()
  });
});

// route directions 
app.use ('/l', analyticsRoutes);
app.use('/api/v1/dealers', dealerRoutes);
app.use('/api/v1/auth', authRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  console.warn(`404 Route ${req.method} ${req.originalUrl} not found.`);
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  })
});

// global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler caught an error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

export default app;