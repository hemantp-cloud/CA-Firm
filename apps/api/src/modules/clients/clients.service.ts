import prisma from '../../shared/utils/prisma';

// TypeScript types matching Prisma Client model
export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  pan?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  commission?: number;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  pan?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  commission?: number;
  isActive?: boolean;
  notes?: string;
}

/**
 * Get all clients for a firm, ordered by createdAt desc
 */
export async function getAllClients(firmId: string) {
  return await prisma.client.findMany({
    where: {
      firmId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get client by id and firmId
 */
export async function getClientById(id: string, firmId: string) {
  return await prisma.client.findFirst({
    where: {
      id,
      firmId,
    },
  });
}

/**
 * Create a new client
 */
export async function createClient(firmId: string, data: CreateClientData) {
  const createData: any = {
    firmId,
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    pan: data.pan || null,
    gstin: data.gstin || null,
    address: data.address || null,
    isActive: data.isActive !== undefined ? data.isActive : true,
    notes: data.notes || null,
  };

  // Add optional fields if they exist in schema
  if (data.city !== undefined) {
    createData.city = data.city || null;
  }
  if (data.state !== undefined) {
    createData.state = data.state || null;
  }
  if (data.pincode !== undefined) {
    createData.pincode = data.pincode || null;
  }
  if (data.commission !== undefined) {
    createData.commission = data.commission || null;
  }

  return await prisma.client.create({
    data: createData,
  });
}

/**
 * Update client by id and firmId
 */
export async function updateClient(
  id: string,
  firmId: string,
  data: UpdateClientData
) {
  // First verify the client exists and belongs to the firm
  const client = await prisma.client.findFirst({
    where: {
      id,
      firmId,
    },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  // Prepare update data
  const updateData: any = {};
  
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.email !== undefined) {
    updateData.email = data.email || null;
  }
  if (data.phone !== undefined) {
    updateData.phone = data.phone || null;
  }
  if (data.pan !== undefined) {
    updateData.pan = data.pan || null;
  }
  if (data.gstin !== undefined) {
    updateData.gstin = data.gstin || null;
  }
  if (data.address !== undefined) {
    updateData.address = data.address || null;
  }
  if (data.city !== undefined) {
    updateData.city = data.city || null;
  }
  if (data.state !== undefined) {
    updateData.state = data.state || null;
  }
  if (data.pincode !== undefined) {
    updateData.pincode = data.pincode || null;
  }
  if (data.commission !== undefined) {
    updateData.commission = data.commission || null;
  }
  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes || null;
  }

  return await prisma.client.update({
    where: {
      id,
    },
    data: updateData,
  });
}

/**
 * Delete client by id and firmId
 */
export async function deleteClient(id: string, firmId: string) {
  return await prisma.client.deleteMany({
    where: {
      id,
      firmId,
    },
  });
}

/**
 * Search clients by name, email, or phone (case insensitive)
 */
export async function searchClients(firmId: string, query: string) {
  return await prisma.client.findMany({
    where: {
      firmId,
      OR: [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
