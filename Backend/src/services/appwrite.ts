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
    }
};

// Export the services directly without modifying them
export { client, account, database, users };