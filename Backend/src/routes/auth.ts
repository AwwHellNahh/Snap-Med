import { Router } from 'express';
import { register, login, logout, checkSession } from '../controllers/authController';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

const router = Router();

// Validation middleware
const validateAuth = (req: Request, res: Response, next: NextFunction) => {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !/^\+?[\d\s-]+$/.test(phoneNumber)) {
        return res.status(400).json({
            message: 'Invalid phone number format'
        });
    }
    if (!password || password.length < 8) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters long'
        });
    }
    next();
};

router.post('/register', validateAuth, register);
router.post('/login', validateAuth, login);
router.post('/logout', logout);
router.get('/session', checkSession);

// Example of a protected route with fixed types
router.get('/protected', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    return res.json({ 
        message: 'This is a protected route',
        user: req.user
    });
});

export default router;