import { Client, Account, Databases, Users } from 'node-appwrite';
import fetch from 'node-fetch';

console.log('Appwrite Endpoint:', process.env.APPWRITE_ENDPOINT);
console.log('Appwrite Project ID:', process.env.APPWRITE_PROJECT_ID);
console.log('Appwrite API Key:', process.env.APPWRITE_API_KEY ? '***set***' : '***missing***');

// Initialize the client with proper configuration
const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

const account = new Account(client);
const database = new Databases(client);
const users = new Users(client);

// Helper function for direct REST API calls to Appwrite
export const appwriteApi = {
    getUser: async (userId: string) => {
        try {
            const response = await fetch(`${process.env.APPWRITE_ENDPOINT}/users/${userId}`, {
                method: 'GET',
                headers: {
                    'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID!,
                    'X-Appwrite-Key': process.env.APPWRITE_API_KEY!
                }
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error(`Failed to fetch user (${response.status}):`, errorData);
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('Direct Appwrite API error:', error);
            return null;
        }
    },
    
    // Simplified listDocuments method to avoid query syntax issues
    listDocuments: async (databaseId: string, collectionId: string, userId: string) => {
        try {
            // Call the document list endpoint WITHOUT complex queries
            // First get all documents, then filter client-side
            const url = `${process.env.APPWRITE_ENDPOINT}/databases/${databaseId}/collections/${collectionId}/documents`;
            
            console.log('Making simplified API call to:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID!,
                    'X-Appwrite-Key': process.env.APPWRITE_API_KEY!
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    errorData = errorText;
                }
                console.error(`Failed to list documents (${response.status}):`, errorData);
                return { documents: [] };
            }

            const result = await response.json();
            
            // Filter results client-side to match the userId
            if (result.documents && Array.isArray(result.documents)) {
                // Define document interface
                interface AppwriteDocument {
                    userId: string;
                    createdAt?: string;
                    [key: string]: any;
                }
                
                // Filter documents by userId with proper typing
                result.documents = result.documents.filter((doc: AppwriteDocument) => doc.userId === userId);
                
                // Sort by createdAt in descending order
                result.documents.sort((a: AppwriteDocument, b: AppwriteDocument) => {
                    const dateA: number = new Date(a.createdAt || 0).getTime();
                    const dateB: number = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA; // descending order
                });
                
                // Limit to 100 items
                if (result.documents.length > 100) {
                    result.documents = result.documents.slice(0, 100);
                }
            }
            
            console.log(`Successfully retrieved ${result.documents?.length || 0} documents after filtering`);
            return result;
        } catch (error) {
            console.error('Direct Appwrite API error in listDocuments:', error);
            return { documents: [] };
        }
    }
};

// Export the services directly without modifying them
export { client, account, database, users };