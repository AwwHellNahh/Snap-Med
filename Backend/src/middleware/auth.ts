import { Request, Response, NextFunction } from 'express';
import { users, appwriteApi } from '../services/appwrite';

// Define a type for requests with user data
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        sessionId: string;
    };
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { userId, sessionId } = req.cookies;

        if (!userId || !sessionId) {
            return res.status(401).json({
                message: 'Authentication required'
            });
        }

        // Verify user exists using the direct API method
        try {
            console.log('Authentication middleware - attempting to fetch user with ID:', userId);
            
            const userResult = await appwriteApi.getUser(userId);
            
            if (!userResult || !userResult.$id) {
                console.log('User not found in authentication middleware');
                res.clearCookie('userId', { path: '/' });
                res.clearCookie('sessionId', { path: '/' });
                
                return res.status(401).json({
                    message: 'Invalid user authentication'
                });
            }
            
            // Authentication is valid, attach user data to request
            req.user = {
                userId,
                sessionId
            };
            
            next();
        } catch (error) {
            console.error('User verification error in middleware:', error);
            res.clearCookie('userId', { path: '/' });
            res.clearCookie('sessionId', { path: '/' });
            
            return res.status(401).json({
                message: 'Invalid authentication',
                error: process.env.NODE_ENV === 'development' ? 
                    (error instanceof Error ? error.message : String(error)) : undefined
            });
        }
    } catch (error) {
        console.error('Authentication Middleware Error:', error);
        return res.status(500).json({
            message: 'Authentication failed'
        });
    }
};