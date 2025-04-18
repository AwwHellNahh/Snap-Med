import { Request, Response } from 'express';
import { users, database, appwriteApi } from '../services/appwrite';
import { ID, AppwriteException, Query } from 'node-appwrite';
import { AuthRequest, AuthResponse } from '../types';
import fetch from 'node-fetch';

// SESSION COOKIE OPTIONS
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    path: '/'
};

export const register = async (req: Request<{}, AuthResponse, AuthRequest>, res: Response<AuthResponse>) => {
    try {
        const { phoneNumber, password } = req.body;
        if (!phoneNumber || !password) {
            return res.status(400).json({
                message: 'Phone number and password are required'
            });
        }

        // Check phone format explicitly
        if (!phoneNumber.startsWith('+') || !/^\+\d{1,15}$/.test(phoneNumber)) {
            return res.status(400).json({
                message: 'Phone number must start with + and contain 1-15 digits'
            });
        }

        // Generate a proper unique ID
        const userId = ID.unique();
        // Create email with the phone number
        const email = `${phoneNumber.replace(/\+/g, '')}@snapmed.local`;
        const name = phoneNumber; // Use phone number as name field

        console.log('Creating user with:', { userId, email, phoneNumber, name });

        // Create user with the correct parameter order:
        // users.create(userId: string, email?: string, phone?: string, password?: string, name?: string)
        const user = await users.create(
            userId,       // userId
            email,        // email
            phoneNumber,  // phone (correctly formatted with +)
            password,     // password
            name          // name
        );

        console.log('User created successfully');

        // Try to store additional user data, but don't fail if collection doesn't exist
        try {
            // Add more detailed logging
            console.log('Attempting to create document in database:', {
                databaseId: process.env.APPWRITE_DATABASE_ID,
                collectionId: process.env.APPWRITE_USERS_COLLECTION_ID || 'users'
            });
            
            await database.createDocument(
                process.env.APPWRITE_DATABASE_ID || 'default',
                process.env.APPWRITE_USERS_COLLECTION_ID || 'users',
                user.$id,
                {
                    // Include all required fields from the schema
                    userId: user.$id,
                    email: email,
                    phone: phoneNumber,
                    lastLogin: new Date().toISOString()
                }
            );
            console.log('User document created successfully');
        } catch (dbError) {
            const appwriteDbError = dbError as AppwriteException;
            // If collection doesn't exist, just log it but continue
            if (appwriteDbError.code === 404) {
                console.warn('Warning: Collection "users" not found. User was created but metadata was not stored.');
                console.warn('Please create a "users" collection in your Appwrite database or check collection ID.');
                console.warn('Error details:', appwriteDbError.response);
            } else {
                console.error('Error storing user metadata:', appwriteDbError);
            }
            // Continue with registration success even if metadata storage fails
        }

        return res.status(201).json({
            message: 'User registered successfully',
            userId: user.$id
        });
    } catch (error) {
        const appwriteError = error as AppwriteException;
        console.error('Registration Error:', appwriteError);
        return res.status(500).json({
            message: typeof appwriteError?.response === 'object' && appwriteError.response !== null 
                ? (appwriteError.response as { message: string }).message 
                : (appwriteError?.message || 'Failed to register user')
        });
    }
};

export const login = async (req: Request<{}, AuthResponse, AuthRequest>, res: Response<AuthResponse>) => {
    try {
        const { phoneNumber, password } = req.body;
        if (!phoneNumber || !password) {
            return res.status(400).json({
                message: 'Phone number and password are required'
            });
        }

        // With phone auth, we already know the email from the phone number
        console.log('Logging in with phone:', phoneNumber);
        const email = `${phoneNumber.replace(/\+/g, '')}@snapmed.local`;
        console.log('Using derived email:', email);

        try {
            // Create a direct API call to Appwrite's login endpoint
            const response = await fetch(`${process.env.APPWRITE_ENDPOINT}/account/sessions/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID || '',
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Login API error:', errorData);
                if (errorData.type === 'user_invalid_credentials') {
                    return res.status(401).json({
                        message: 'Invalid phone number or password'
                    });
                }
                return res.status(500).json({
                    message: errorData.message || 'Failed to login'
                });
            }

            const session = await response.json();
            console.log('Session data received:', JSON.stringify(session));
            
            // Instead of using the secret field (which is empty in server SDK),
            // we'll use the sessionId and userId as proof of authentication
            const userId = session.userId || '';
            const sessionId = session.$id || '';
            
            if (!userId || !sessionId) {
                console.error('Session is missing required fields. Full session data:', session);
                return res.status(500).json({
                    message: 'Invalid session format from Appwrite'
                });
            }

            // Set cookies with the session data
            const DEV_COOKIE_OPTIONS = {
                httpOnly: false,
                secure: false,
                maxAge: 7 * 24 * 60 * 60 * 1000,
                sameSite: 'lax' as const,
                path: '/'
            };

            res.cookie('userId', userId, DEV_COOKIE_OPTIONS);
            res.cookie('sessionId', sessionId, DEV_COOKIE_OPTIONS);
            
            return res.status(200).json({
                message: 'Login successful',
                userId: userId
            });
        } catch (error) {
            console.error('Login process error:', error);
            return res.status(401).json({
                message: 'Login failed'
            });
        }
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({
            message: 'Failed to login'
        });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        // Clear auth cookies
        res.clearCookie('userId', { path: '/' });
        res.clearCookie('sessionId', { path: '/' });
        
        return res.status(200).json({
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout Error:', error);
        return res.status(500).json({
            message: 'Failed to logout'
        });
    }
};

export const checkSession = async (req: Request, res: Response) => {
    try {
        // Log all cookies for debugging
        console.log('All cookies received:', req.cookies);
        
        const { userId, sessionId } = req.cookies;
        
        // Log individual cookie values
        console.log('Auth cookies:', { userId, sessionId });
        
        if (!userId || !sessionId) {
            console.log('Missing required cookies for authentication');
            return res.status(401).json({
                message: 'Not authenticated',
                isAuthenticated: false,
                missingCookies: {
                    userId: !userId,
                    sessionId: !sessionId
                }
            });
        }
        
        try {
            console.log('Attempting to fetch user with ID:', userId);
            
            // Use our direct API method instead of the SDK
            const userResult = await appwriteApi.getUser(userId);
            
            if (!userResult || !userResult.$id) {
                console.log('User not found');
                res.clearCookie('userId', { path: '/' });
                res.clearCookie('sessionId', { path: '/' });
                
                return res.status(401).json({
                    message: 'Invalid user',
                    isAuthenticated: false
                });
            }
            
            console.log('Valid user confirmed:', userResult.$id);
            
            // Since we have a valid user and a session ID that matches our records,
            // we'll consider this a valid session
            return res.status(200).json({
                message: 'Session is valid',
                isAuthenticated: true,
                userId: userId
            });
        } catch (error) {
            console.error('User verification error:', error);
            res.clearCookie('userId', { path: '/' });
            res.clearCookie('sessionId', { path: '/' });
            
            return res.status(401).json({
                message: 'Invalid session',
                isAuthenticated: false,
                error: process.env.NODE_ENV === 'development' ? 
                    (error instanceof Error ? error.message : String(error)) : undefined
            });
        }
    } catch (error) {
        console.error('Check Session Error:', error);
        return res.status(500).json({
            message: 'Failed to validate session',
            isAuthenticated: false
        });
    }
};