import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import clientsRoutes from './modules/clients/clients.routes';
import servicesRoutes from './modules/services/services.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
import documentsRoutes from './modules/documents/documents.routes';
import documentViewRoutes from './modules/documents/documents.view.routes';
import adminDocumentsRoutes from './modules/documents/documents.admin.routes';
import caDocumentsRoutes from './modules/documents/documents.ca.routes';
import invoicesRoutes from './modules/invoices/invoices.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import activityRoutes from './modules/activity/activity.routes';
import activityLogRoutes from './modules/activity-log/activity-log.routes';
import adminRoutes from './modules/admin/admin.routes';
import caRoutes from './modules/ca/ca.routes';
import clientRoutes from './modules/client/client.routes';


// Configure environment variables
dotenv.config();

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Chealth',
  });
});
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'CA Firm API is running dcbehfvjefh',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/documents', documentViewRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminDocumentsRoutes);
app.use('/api/ca', caRoutes);
app.use('/api/ca', caDocumentsRoutes);
app.use('/api/client', clientRoutes);


export default app;
