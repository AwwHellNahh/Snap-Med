import { Router } from 'express';
import { saveHistory, getHistory } from '../controllers/historyController';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Middleware to validate history data
const validateHistoryData = (req: Request, res: Response, next: NextFunction) => {
    const { lines, drugInfo } = req.body;
    
    if (!lines || !Array.isArray(lines)) {
        return res.status(400).json({
            message: 'Lines must be an array'
        });
    }
    
    if (!drugInfo || typeof drugInfo !== 'object') {
        return res.status(400).json({
            message: 'Drug info must be an object'
        });
    }
    
    // Check required drug info fields
    const requiredFields = ['generic_name', 'dosage_form', 'product_type', 'route'];
    const missingFields = requiredFields.filter(field => !drugInfo[field]);
    
    if (missingFields.length > 0) {
        return res.status(400).json({
            message: `Missing required drug info fields: ${missingFields.join(', ')}`
        });
    }
    
    // Validate route is an array
    if (!Array.isArray(drugInfo.route)) {
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