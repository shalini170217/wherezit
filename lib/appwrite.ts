import { Account, Client, Databases, Storage, ID } from 'react-native-appwrite';

// Create Appwrite client
export const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68428d43002d217fe9bb')
  .setPlatform('com.abc.wherezit');

// Create instances
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Export ID and other instances if needed elsewhere
export { ID };
