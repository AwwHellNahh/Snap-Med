import { Client, Account, Databases, Users } from 'node-appwrite';

console.log('Appwrite Endpoint:', process.env.APPWRITE_ENDPOINT);
console.log('Appwrite Project ID:', process.env.APPWRITE_PROJECT_ID);
console.log('Appwrite API Key:', process.env.APPWRITE_API_KEY ? '***set***' : '***missing***');

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

const account = new Account(client);
const database = new Databases(client);
const users = new Users(client);

export { client, account, database, users };