import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { databases, storage, ID } from '@/lib/appwrite';
import { Query, Permission, Role } from 'appwrite';

const DATABASE_ID = '68478188000863f4f39f';
const COLLECTION_ID = '68497c5500165f632eef'; // Found Items collection
const BUCKET_ID = '684782760015fa4dfa11';
const SCORES_COLLECTION_ID = '684a45b5000b6e6c8f0a';
const PROFILES_COLLECTION_ID = '6847c4830011d384a4d9'; // Profiles collection

const FoundAndDeleteScreen = () => {
  const { itemId, fileId } = useLocalSearchParams();
  const router = useRouter();

  const [finderName, setFinderName] = useState('');
  const [points, setPoints] = useState('');

  const handleConfirm = async () => {
    const normalizedName = finderName.trim();

    if (!normalizedName || !points || isNaN(points) || Number(points) <= 0) {
      return Alert.alert('Error', 'Please enter valid details.');
    }

    try {
      // ✅ Step 1: Get Finder's Profile
      const profileResult = await databases.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('name', normalizedName)]
      );

      console.log('Queried Profile Result:', profileResult);

      if (profileResult.total === 0) {
        return Alert.alert('Error', `No profile found for "${normalizedName}". Please check capitalization and spelling.`);
      }

      const finderProfile = profileResult.documents[0];

      // ✅ Step 2: Create Score Entry with Permissions
      await databases.createDocument(
        DATABASE_ID,
        SCORES_COLLECTION_ID,
        ID.unique(),
        {
          userId: finderProfile.userId,
          username: finderProfile.name,
          score: Number(points),
          matches: 1,
          lastUpdated: new Date().toISOString(),
        },
        [
          Permission.read(Role.any()),    // ✅ Allow anyone to read (for testing)
          Permission.write(Role.any()),   // ✅ Allow anyone to write (for testing)
          // ⚠️ Recommended for production:
          // Permission.read(Role.user(finderProfile.userId)),
          // Permission.write(Role.user(finderProfile.userId)),
        ]
      );

      // ✅ Step 3: Delete the Found Item Document
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, itemId);

      // ✅ Step 4: Delete the associated file if exists
      if (fileId) await storage.deleteFile(BUCKET_ID, fileId);

      Alert.alert('Success', `Deleted item. ${points} points awarded to ${normalizedName}`);
      router.back();
    } catch (err) {
      console.error('Error during confirm process:', err);
      Alert.alert('Error', 'Something went wrong. Check console for details.');
    }
  };

  return (
    <ImageBackground
      source={require('@/assets/images/rewards.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.heading}>Reward the Finder</Text>
        <TextInput
          placeholder="Finder's Name"
          style={styles.input}
          value={finderName}
          onChangeText={setFinderName}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Points to Give"
          style={styles.input}
          keyboardType="numeric"
          value={points}
          onChangeText={setPoints}
        />
        <TouchableOpacity style={styles.button} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Confirm and Delete</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

export default FoundAndDeleteScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    width: '100%',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#72d3fc',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});