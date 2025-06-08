import { Account, Client, Databases, Storage, ID, ReactNativeFile } from 'react-native-appwrite';

// Initialize Appwrite Client
const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1') // Your Appwrite endpoint
  .setProject('68428d43002d217fe9bb') // Your Project ID
  .setPlatform('com.abc.wherezit'); // Your App Bundle ID

// Services
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Constants
const DATABASE_ID = '6845a382001b78af96f9';
const COLLECTION_ID = '6845a39c00320b7db71a';
const BUCKET_ID = '6845a6ea0038889d0a3d';

// Types
interface FoundItemDocument {
  $id?: string;
  userId: string;
  imageId: string;
  description: string;
  location: string;
  address: string;
  date: string;
  time: string;
  status: 'found' | 'claimed' | 'archived';
  $createdAt?: string;
}

// Helpers
const createFoundItem = async (item: Omit<FoundItemDocument, '$id' | '$createdAt'>) => {
  return await databases.createDocument<FoundItemDocument>(
    DATABASE_ID,
    COLLECTION_ID,
    ID.unique(),
    item
  );
};

const uploadImage = async (fileUri: string) => {
  const file = new ReactNativeFile({
    uri: fileUri,
    name: `found_${Date.now()}.jpg`,
    type: 'image/jpeg',
  });

  return await storage.createFile(BUCKET_ID, ID.unique(), file);
};

export {
  client,
  account,
  databases,
  storage,
  createFoundItem,
  uploadImage,
  DATABASE_ID,
  COLLECTION_ID,
  BUCKET_ID,
};

export type { FoundItemDocument };
