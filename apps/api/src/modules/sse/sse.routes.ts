import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import sseService from './sse.service';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * SSE endpoint for real-time updates
 * GET /api/events/stream
 */
router.get('/stream', authenticate, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const firmId = req.user?.firmId;

    if (!userId || !role || !firmId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Generate unique client ID
    const clientId = uuidv4();

    // Add client to SSE service
    sseService.addClient({
        id: clientId,
        userId,
        role,
        firmId,
        response: res,
    });

    // Send initial connection message
    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ clientId, message: 'Connected to SSE' })}\n\n`);

    // Handle client disconnect
    req.on('close', () => {
        sseService.removeClient(clientId);
    });
});

export default router;
