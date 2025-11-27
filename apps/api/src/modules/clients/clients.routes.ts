import { Router, Request, Response, NextFunction } from 'express';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  searchClients,
} from './clients.service';
import { verifyToken, UserPayload } from '../auth/auth.service';
import { exportClientsToExcel } from '../../shared/utils/excel-export';

const router = Router();

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

// Middleware function extractUser that gets token from Authorization header, verifies it, and attaches decoded user to req.user
const extractUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Authorization header is missing',
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token || token.trim() === '') {
      res.status(401).json({
        success: false,
        message: 'Token is missing',
      });
      return;
    }

    // Verify token and attach decoded user to req.user
    const decoded = verifyToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

// Apply extractUser middleware to all routes
router.use(extractUser);

/**
 * GET /api/clients
 * List all clients or search clients
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Get firmId from req.user.firmId
    if (!req.user?.firmId) {
      res.status(401).json({
        success: false,
        message: 'Firm ID not found',
      });
      return;
    }

    const firmId = req.user.firmId;

    // If query param 'search' exists, call searchClients, else call getAllClients
    const searchQuery = req.query.search as string | undefined;

    let clients;
    if (searchQuery && searchQuery.trim() !== '') {
      clients = await searchClients(firmId, searchQuery);
    } else {
      clients = await getAllClients(firmId);
    }

    // Return { success: true, data: clients }
    res.status(200).json({
      success: true,
      data: clients,
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get clients',
    });
  }
});

/**
 * GET /api/clients/export
 * Export all clients to Excel
 */
router.get('/export', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.firmId) {
      res.status(401).json({
        success: false,
        message: 'Firm ID not found',
      });
      return;
    }

    const firmId = req.user.firmId;

    // Get all clients for the firm
    const clients = await getAllClients(firmId);

    // Export to Excel
    const buffer = await exportClientsToExcel(clients);

    // Set headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="clients.xlsx"');

    // Send buffer
    res.send(buffer);
  } catch (error) {
    console.error('Export clients error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to export clients',
    });
  }
});

/**
 * GET /api/clients/:id
 * Get single client by id
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Client ID is required',
      });
      return;
    }

    if (!req.user?.firmId) {
      res.status(401).json({
        success: false,
        message: 'Firm ID not found',
      });
      return;
    }

    const firmId = req.user.firmId;

    // Call getClientById with id param and firmId
    const client = await getClientById(id, firmId);

    // Return 404 if not found
    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }

    // Return { success: true, data: client }
    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get client',
    });
  }
});

/**
 * POST /api/clients
 * Create new client
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.firmId) {
      res.status(401).json({
        success: false,
        message: 'Firm ID not found',
      });
      return;
    }

    const firmId = req.user.firmId;

    // Get data from req.body
    const data = req.body;

    // Call createClient with firmId and data
    const client = await createClient(firmId, data);

    // Return 201 with { success: true, data: client }
    res.status(201).json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create client',
    });
  }
});

/**
 * PUT /api/clients/:id
 * Update client
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Client ID is required',
      });
      return;
    }

    if (!req.user?.firmId) {
      res.status(401).json({
        success: false,
        message: 'Firm ID not found',
      });
      return;
    }

    const firmId = req.user.firmId;

    // Call updateClient with id, firmId, and req.body
    const client = await updateClient(id, firmId, req.body);

    // Return { success: true, data: client }
    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error('Update client error:', error);
    
    if (error instanceof Error && error.message === 'Client not found') {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update client',
    });
  }
});

/**
 * DELETE /api/clients/:id
 * Delete client
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Client ID is required',
      });
      return;
    }

    if (!req.user?.firmId) {
      res.status(401).json({
        success: false,
        message: 'Firm ID not found',
      });
      return;
    }

    const firmId = req.user.firmId;

    // Call deleteClient with id and firmId
    const result = await deleteClient(id, firmId);

    // Check if any client was deleted
    if (result.count === 0) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }

    // Return { success: true, message: "Client deleted" }
    res.status(200).json({
      success: true,
      message: 'Client deleted',
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete client',
    });
  }
});

export default router;
