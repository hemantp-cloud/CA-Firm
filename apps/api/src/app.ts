import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import clientsRoutes from './modules/clients/clients.routes';
import superAdminRoutes from './modules/super-admin/super-admin.routes';
import superAdminDocumentsRoutes from './modules/super-admin/super-admin.documents.routes';
import servicesRoutes from './modules/services/services.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
// Document routes
import documentsRoutes from './modules/documents/documents.routes';
// import documentViewRoutes from './modules/documents/documents.view.routes';
import adminDocumentsRoutes from './modules/documents/documents.admin.routes';
// import caDocumentsRoutes from './modules/documents/documents.ca.routes';
import invoicesRoutes from './modules/invoices/invoices.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import activityRoutes from './modules/activity/activity.routes';
import activityLogRoutes from './modules/activity-log/activity-log.routes';
import adminRoutes from './modules/admin/admin.routes';
import projectManagerRoutes from './modules/project-manager/project-manager.routes';
import projectManagerDocumentsRoutes from './modules/project-manager/project-manager.documents.routes';
import clientRoutes from './modules/client/client.routes';
import clientDocumentsRoutes from './modules/client/client.documents.routes';
import teamMemberRoutes from './modules/team-member/team-member.routes';
import teamMemberDocumentsRoutes from './modules/team-member/team-member.documents.routes';

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
    message: 'API Health OK',
  });
});
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'CA Firm Management API is running',
  });
});

// Routes - All Core Routes Enabled
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/super-admin', superAdminDocumentsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/project-manager', projectManagerRoutes);
app.use('/api/project-manager', projectManagerDocumentsRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/client', clientDocumentsRoutes);
app.use('/api/team-member', teamMemberRoutes);
app.use('/api/team-member', teamMemberDocumentsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/activity-logs', activityLogRoutes);

// Document routes
app.use('/api/documents', documentsRoutes);
// app.use('/api/documents', documentViewRoutes);
app.use('/api/admin', adminDocumentsRoutes);
// app.use('/api/ca', caDocumentsRoutes);


export default app;


