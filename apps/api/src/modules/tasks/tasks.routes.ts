import { Router, Request, Response, NextFunction } from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTasksGroupedByStatus,
} from './tasks.service';
import { verifyToken, UserPayload } from '../auth/auth.service';

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

// Apply extractUser to all routes
router.use(extractUser);

/**
 * GET /api/tasks
 * Get all tasks for the firm, optionally filtered by serviceId
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.firmId) {
      res.status(401).json({
        success: false,
        message: 'Firm ID not found',
      });
      return;
    }

    const firmId = req.user.firmId;
    const serviceId = req.query.serviceId as string | undefined;

    // Call getAllTasks with firmId and optional serviceId query param
    const tasks = await getAllTasks(firmId, serviceId);

    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get tasks',
    });
  }
});

/**
 * GET /api/tasks/kanban
 * Get tasks grouped by status for Kanban view
 */
router.get('/kanban', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.firmId) {
      res.status(401).json({
        success: false,
        message: 'Firm ID not found',
      });
      return;
    }

    const firmId = req.user.firmId;

    // Call getTasksGroupedByStatus(firmId), return grouped data
    const groupedTasks = await getTasksGroupedByStatus(firmId);

    res.status(200).json({
      success: true,
      data: groupedTasks,
    });
  } catch (error) {
    console.error('Get tasks by status error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get tasks by status',
    });
  }
});

/**
 * GET /api/tasks/:id
 * Get single task by id
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Task ID is required',
      });
      return;
    }

    // Call getTaskById
    const task = await getTaskById(id);

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get task',
    });
  }
});

/**
 * POST /api/tasks
 * Create new task
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Call createTask with req.body, return 201
    const task = await createTask(req.body);

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create task',
    });
  }
});

/**
 * PUT /api/tasks/:id
 * Update task
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Task ID is required',
      });
      return;
    }

    // Call updateTask
    const task = await updateTask(id, req.body);

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update task',
    });
  }
});

/**
 * PATCH /api/tasks/:id/status
 * Update task status only
 */
router.patch('/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Task ID is required',
      });
      return;
    }

    if (!status) {
      res.status(400).json({
        success: false,
        message: 'Status is required',
      });
      return;
    }

    // Call updateTaskStatus with req.body.status
    const task = await updateTaskStatus(id, status);

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update task status',
    });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete task
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Task ID is required',
      });
      return;
    }

    // Call deleteTask
    await deleteTask(id);

    res.status(200).json({
      success: true,
      message: 'Task deleted',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete task',
    });
  }
});

export default router;

