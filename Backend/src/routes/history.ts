import { Router } from 'express';
import { saveHistory, getHistory } from '../controllers/historyController';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Middleware to validate history data - less strict about drugInfo
const validateHistoryData = (req: Request, res: Response, next: NextFunction) => {
    const { lines, drugInfo } = req.body;
    
    // Only lines array is required
    if (!lines || !Array.isArray(lines)) {
        return res.status(400).json({
            message: 'Lines must be an array'
        });
    }
    
    // drugInfo itself is optional, but if provided it should be an object
    if (drugInfo !== undefined && typeof drugInfo !== 'object') {
        return res.status(400).json({
            message: 'Drug info must be an object if provided'
        });
    }
    
    // If drugInfo is provided, check that route is an array if present
    if (drugInfo && drugInfo.route !== undefined && !Array.isArray(drugInfo.route)) {
        return res.status(400).json({
            message: 'Route must be an array'
        });
    }
    
    next();
};

// All history routes require authentication
router.use(requireAuth);

// POST /api/history - Save medication history
router.post('/', validateHistoryData, saveHistory);

// GET /api/history - Get user's medication history
router.get('/', getHistory);

export default router;