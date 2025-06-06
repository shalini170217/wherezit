import {Account,Client,Databases} from 'react-native-appwrite';

const client =new Client().setEndpoint("https://fra.cloud.appwrite.io/v1").setProject("683f2dd30032e43eb1cb").setPlatform("co.abc.landf");


export const account =new Account(client);