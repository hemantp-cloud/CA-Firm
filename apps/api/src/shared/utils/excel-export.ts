import ExcelJS from 'exceljs';

// Type for client export - matches actual Prisma Client fields
interface ClientExport {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  pan: string | null;
  gstin: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface Service {
  id: string;
  title: string;
  status: string;
  dueDate: Date | null;
  feeAmount: number | null;
  client?: { name: string };
  serviceType?: { name: string };
  createdAt: Date;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  service?: { title: string };
  assignedTo?: { name: string };
  createdAt: Date;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  client?: { name: string };
  totalAmount: number;
  status: string;
  dueDate: Date | null;
  createdAt: Date;
}

/**
 * Export clients to Excel
 */
export async function exportClientsToExcel(clients: ClientExport[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Clients');

  // Define columns
  worksheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'PAN', key: 'pan', width: 15 },
    { header: 'GSTIN', key: 'gstin', width: 20 },
    { header: 'Address', key: 'address', width: 40 },
    { header: 'City', key: 'city', width: 20 },
    { header: 'State', key: 'state', width: 20 },
    { header: 'Pincode', key: 'pincode', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Created Date', key: 'createdDate', width: 20 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows
  clients.forEach((client) => {
    worksheet.addRow({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      pan: client.pan || '',
      gstin: client.gstin || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      pincode: client.pincode || '',
      status: client.isActive ? 'Active' : 'Inactive',
      createdDate: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '',
    });
  });

  // Auto-width columns
  worksheet.columns.forEach((column) => {
    if (column.width) {
      column.width = Math.max(column.width || 10, 10);
    }
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Export services to Excel
 */
export async function exportServicesToExcel(services: Service[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Services');

  // Define columns
  worksheet.columns = [
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Client', key: 'client', width: 30 },
    { header: 'Service Type', key: 'serviceType', width: 25 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
    { header: 'Fee Amount', key: 'feeAmount', width: 15 },
    { header: 'Created Date', key: 'createdDate', width: 20 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows
  services.forEach((service) => {
    worksheet.addRow({
      title: service.title,
      client: service.client?.name || '',
      serviceType: service.serviceType?.name || '',
      status: service.status,
      dueDate: service.dueDate ? new Date(service.dueDate).toLocaleDateString() : '',
      feeAmount: service.feeAmount ? `₹${service.feeAmount.toLocaleString()}` : '',
      createdDate: service.createdAt ? new Date(service.createdAt).toLocaleDateString() : '',
    });
  });

  // Auto-width columns
  worksheet.columns.forEach((column) => {
    if (column.width) {
      column.width = Math.max(column.width || 10, 10);
    }
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Export tasks to Excel
 */
export async function exportTasksToExcel(tasks: Task[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tasks');

  // Define columns
  worksheet.columns = [
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Service', key: 'service', width: 30 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Assigned To', key: 'assignedTo', width: 20 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
    { header: 'Created Date', key: 'createdDate', width: 20 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows
  tasks.forEach((task) => {
    worksheet.addRow({
      title: task.title,
      service: task.service?.title || '',
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo?.name || 'Unassigned',
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
      createdDate: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '',
    });
  });

  // Auto-width columns
  worksheet.columns.forEach((column) => {
    if (column.width) {
      column.width = Math.max(column.width || 10, 10);
    }
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Export invoices to Excel
 */
export async function exportInvoicesToExcel(invoices: Invoice[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Invoices');

  // Define columns
  worksheet.columns = [
    { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
    { header: 'Client', key: 'client', width: 30 },
    { header: 'Total Amount', key: 'totalAmount', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
    { header: 'Created Date', key: 'createdDate', width: 20 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows
  invoices.forEach((invoice) => {
    worksheet.addRow({
      invoiceNumber: invoice.invoiceNumber,
      client: invoice.client?.name || '',
      totalAmount: `₹${invoice.totalAmount.toLocaleString()}`,
      status: invoice.status,
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '',
      createdDate: invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : '',
    });
  });

  // Auto-width columns
  worksheet.columns.forEach((column) => {
    if (column.width) {
      column.width = Math.max(column.width || 10, 10);
    }
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Generic function to generate Excel from array of objects
 */
export async function generateExcel(
  data: Record<string, any>[],
  sheetName: string = 'Sheet1'
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length === 0) {
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // Get headers from first object
  if (!data[0]) {
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
  const headers = Object.keys(data[0]);

  // Define columns
  worksheet.columns = headers.map((header) => ({
    header: header,
    key: header,
    width: 20,
  }));

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows
  data.forEach((row) => {
    worksheet.addRow(row);
  });

  // Auto-width columns
  worksheet.columns.forEach((column) => {
    if (column.width) {
      column.width = Math.max(column.width || 10, 10);
    }
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
