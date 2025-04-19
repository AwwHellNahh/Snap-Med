import { Response } from 'express';
import { database, appwriteApi } from '../services/appwrite';
import { ID, AppwriteException } from 'node-appwrite';
import { AuthenticatedRequest } from '../middleware/auth';
import { MedicationHistory, HistoryRequest, HistoryResponse, HistoriesResponse } from '../types';

// Save medication history to the database
export const saveHistory = async (req: AuthenticatedRequest, res: Response<HistoryResponse>): Promise<Response<HistoryResponse>> => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                message: 'User not authenticated'
            });
        }

        const userId = req.user.userId;
        const { lines, drugInfo }: HistoryRequest = req.body;
        
        // Validate request data - lines array is required
        if (!lines || !Array.isArray(lines) || lines.length === 0) {
            return res.status(400).json({
                message: 'Invalid medication data: lines array is required'
            });
        }

        // Create a document structure with required fields only
        const historyData: any = {
            userId,
            createdAt: new Date().toISOString()
        };

        // Add medicationData only if we have valid data to store
        try {
            if (lines && (drugInfo || Object.keys(drugInfo || {}).length > 0)) {
                historyData.medicationData = JSON.stringify({
                    lines,
                    drugInfo: drugInfo || {}
                });
            } else {
                // If drugInfo is missing, still save the lines
                historyData.medicationData = JSON.stringify({ lines });
            }
        } catch (e) {
            console.error('Error stringifying medication data:', e);
            // Provide a fallback if JSON stringify fails
            historyData.medicationData = JSON.stringify({ lines });
        }

        try {
            console.log('Creating history document with data:', {
                databaseId: process.env.APPWRITE_DATABASE_ID,
                collectionId: process.env.APPWRITE_HISTORY_COLLECTION_ID
            });
            
            const historyDoc = await database.createDocument(
                process.env.APPWRITE_DATABASE_ID || 'default',
                process.env.APPWRITE_HISTORY_COLLECTION_ID || 'medication_history',
                ID.unique(),
                historyData
            );

            return res.status(201).json({
                message: 'Medication history saved successfully',
                historyId: historyDoc.$id
            });
        } catch (dbError) {
            const appwriteDbError = dbError as AppwriteException;
            console.error('Error creating history document:', appwriteDbError);
            
            if (appwriteDbError.response) {
                console.error('Appwrite error response:', appwriteDbError.response);
            }
            
            // If collection doesn't exist, provide helpful error
            if (appwriteDbError.code === 404) {
                console.warn('Collection "medication_history" not found. Please create the collection in Appwrite.');
            }
            
            throw dbError; // Re-throw for the outer catch block
        }
    } catch (error) {
        console.error('Save History Error:', error);
        return res.status(500).json({
            message: 'Failed to save medication history'
        });
    }
};

// Get medication history for the current user
export const getHistory = async (req: AuthenticatedRequest, res: Response<HistoriesResponse>): Promise<Response<HistoriesResponse>> => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                message: 'User not authenticated',
                histories: []
            });
        }

        const userId = req.user.userId;
        
        try {
            console.log('Fetching history documents for user:', userId);
            
            // Use our direct API method instead of the SDK's listDocuments
            const result = await appwriteApi.listDocuments(
                process.env.APPWRITE_DATABASE_ID || 'default',
                process.env.APPWRITE_HISTORY_COLLECTION_ID || 'medication_history',
                userId
            );

            if (!result || !result.documents) {
                console.warn('No documents found or response format unexpected');
                return res.status(200).json({
                    message: 'No medication history available',
                    histories: []
                });
            }

            // Map the database documents to the expected format
            interface DocumentFromDB {
                $id: string;
                userId: string;
                medicationData?: string; // Now optional
                createdAt?: string;
            }

            interface ParsedMedicationData {
                lines: any[];
                drugInfo?: {
                    generic_name?: string;
                    dosage_form?: string;
                    product_type?: string;
                    route?: string[];
                };
            }

            const histories: MedicationHistory[] = result.documents.map((doc: DocumentFromDB) => {
                // Parse the stored JSON string back into an object
                let medicationData: ParsedMedicationData = { 
                    lines: [], 
                    drugInfo: { 
                        generic_name: '', 
                        dosage_form: '', 
                        product_type: '', 
                        route: [] 
                    } 
                };
                
                try {
                    if (doc.medicationData) {
                        medicationData = JSON.parse(doc.medicationData);
                    }
                } catch (e) {
                    console.warn('Error parsing medicationData JSON:', e);
                }
                
                return {
                    id: doc.$id,
                    userId: doc.userId,
                    lines: medicationData.lines || [],
                    drugInfo: medicationData.drugInfo || {
                        generic_name: '',
                        dosage_form: '',
                        product_type: '',
                        route: []
                    },
                    createdAt: doc.createdAt || new Date().toISOString()
                };
            });

            return res.status(200).json({
                message: 'Medication history retrieved successfully',
                histories
            });
        } catch (error) {
            console.error('Error fetching history documents:', error);
            
            // Return empty list on error
            return res.status(200).json({
                message: 'Error retrieving medication history',
                histories: []
            });
        }
    } catch (error) {
        console.error('Get History Error:', error);
        return res.status(500).json({
            message: 'Failed to retrieve medication history',
            histories: []
        });
    }
};