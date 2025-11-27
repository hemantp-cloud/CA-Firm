import prisma from './prisma';

export enum LOG_ACTION {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  DOWNLOAD = 'DOWNLOAD',
  UPLOAD = 'UPLOAD',
  SEND = 'SEND',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export enum LOG_ENTITY {
  USER = 'User',
  CLIENT = 'Client',
  SERVICE = 'Service',
  TASK = 'Task',
  DOCUMENT = 'Document',
  INVOICE = 'Invoice',
  PAYMENT = 'Payment',
  SETTING = 'Setting',
}

interface LogActivityParams {
  firmId: string;
  userId?: string | null;
  action: LOG_ACTION;
  entity: LOG_ENTITY;
  entityId?: string | null;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log activity to ActivityLog table
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const data: any = {
      firmId: params.firmId,
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entity,
      entityId: params.entityId ?? null,
      details: params.metadata ? (params.metadata as any) : null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    };
    
    await (prisma as any).activityLog.create({
      data,
    });
  } catch (error) {
    // Log error but don't throw - activity logging should not break main functionality
    console.error('Failed to log activity:', error);
  }
}

/**
 * Helper function to log user-related activities
 */
export async function logUserActivity(
  firmId: string,
  userId: string | null | undefined,
  action: LOG_ACTION,
  targetUserId: string,
  targetUserName: string,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const params: LogActivityParams = {
    firmId,
    userId: userId ?? null,
    action,
    entity: LOG_ENTITY.USER,
    entityId: targetUserId,
    description: `${action} user: ${targetUserName}`,
  };
  if (metadata) params.metadata = metadata;
  if (ipAddress) params.ipAddress = ipAddress;
  if (userAgent) params.userAgent = userAgent;
  await logActivity(params);
}

/**
 * Helper function to log client-related activities
 */
export async function logClientActivity(
  firmId: string,
  userId: string | null | undefined,
  action: LOG_ACTION,
  clientId: string,
  clientName: string,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const params: LogActivityParams = {
    firmId,
    userId: userId ?? null,
    action,
    entity: LOG_ENTITY.CLIENT,
    entityId: clientId,
    description: `${action} client: ${clientName}`,
  };
  if (metadata) params.metadata = metadata;
  if (ipAddress) params.ipAddress = ipAddress;
  if (userAgent) params.userAgent = userAgent;
  await logActivity(params);
}

/**
 * Helper function to log service-related activities
 */
export async function logServiceActivity(
  firmId: string,
  userId: string | null | undefined,
  action: LOG_ACTION,
  serviceId: string,
  serviceTitle: string,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const params: LogActivityParams = {
    firmId,
    userId: userId ?? null,
    action,
    entity: LOG_ENTITY.SERVICE,
    entityId: serviceId,
    description: `${action} service: ${serviceTitle}`,
  };
  if (metadata) params.metadata = metadata;
  if (ipAddress) params.ipAddress = ipAddress;
  if (userAgent) params.userAgent = userAgent;
  await logActivity(params);
}

/**
 * Helper function to log document-related activities
 */
export async function logDocumentActivity(
  firmId: string,
  userId: string | null | undefined,
  action: LOG_ACTION,
  documentId: string,
  fileName: string,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const params: LogActivityParams = {
    firmId,
    userId: userId ?? null,
    action,
    entity: LOG_ENTITY.DOCUMENT,
    entityId: documentId,
    description: `${action} document: ${fileName}`,
  };
  if (metadata) params.metadata = metadata;
  if (ipAddress) params.ipAddress = ipAddress;
  if (userAgent) params.userAgent = userAgent;
  await logActivity(params);
}

/**
 * Helper function to log invoice-related activities
 */
export async function logInvoiceActivity(
  firmId: string,
  userId: string | null | undefined,
  action: LOG_ACTION,
  invoiceId: string,
  invoiceNumber: string,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const params: LogActivityParams = {
    firmId,
    userId: userId ?? null,
    action,
    entity: LOG_ENTITY.INVOICE,
    entityId: invoiceId,
    description: `${action} invoice: ${invoiceNumber}`,
  };
  if (metadata) params.metadata = metadata;
  if (ipAddress) params.ipAddress = ipAddress;
  if (userAgent) params.userAgent = userAgent;
  await logActivity(params);
}

/**
 * Helper function to log payment-related activities
 */
export async function logPaymentActivity(
  firmId: string,
  userId: string | null | undefined,
  action: LOG_ACTION,
  paymentId: string,
  invoiceId: string,
  amount: number,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const params: LogActivityParams = {
    firmId,
    userId: userId ?? null,
    action,
    entity: LOG_ENTITY.PAYMENT,
    entityId: paymentId,
    description: `${action} payment: ₹${amount} for invoice ${invoiceId}`,
    metadata: {
      ...metadata,
      amount,
      invoiceId,
    },
  };
  if (ipAddress) params.ipAddress = ipAddress;
  if (userAgent) params.userAgent = userAgent;
  await logActivity(params);
}

/**
 * Helper function to log login/logout activities
 */
export async function logAuthActivity(
  firmId: string,
  userId: string | null | undefined,
  action: LOG_ACTION.LOGIN | LOG_ACTION.LOGOUT,
  email: string,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const params: LogActivityParams = {
    firmId,
    userId: userId ?? null,
    action,
    entity: LOG_ENTITY.USER,
    entityId: userId ?? null,
    description: `${action} by ${email}`,
    metadata: {
      ...metadata,
      email,
    },
  };
  if (ipAddress) params.ipAddress = ipAddress;
  if (userAgent) params.userAgent = userAgent;
  await logActivity(params);
}
