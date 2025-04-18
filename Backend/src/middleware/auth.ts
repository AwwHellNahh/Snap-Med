import { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';

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

        // Verify session exists
        const response = await fetch(`${process.env.APPWRITE_ENDPOINT}/account/sessions/${sessionId}`, {
            method: 'GET',
            headers: {
                'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID || '',
                'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
            }
        });
        
        if (!response.ok) {
            // Clear cookies if session is invalid
            res.clearCookie('userId', { path: '/' });
            res.clearCookie('sessionId', { path: '/' });
            
            return res.status(401).json({
                message: 'Invalid or expired authentication'
            });
        }
        
        // Authentication is valid, attach user data to request
        req.user = {
            userId,
            sessionId
        };
        
        next();
    } catch (error) {
        console.error('Authentication Middleware Error:', error);
        return res.status(500).json({
            message: 'Authentication failed'
        });
    }
};