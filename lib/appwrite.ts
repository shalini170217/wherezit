import {Account,Client,Databases} from 'react-native-appwrite';

const client =new Client().setEndpoint("https://fra.cloud.appwrite.io/v1").setProject("68428d43002d217fe9bb").setPlatform("com.abc.wherezit");


export const account =new Account(client);