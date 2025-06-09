import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text } from 'react-native';
import { databases, ID } from '../lib/appwrite';

const DATABASE_ID = '68466603000fa3396bcc';
const COLLECTION_ID = '6846660d0031b741c502';

export default function UploadForm() {
  // Form states
  const [description, setDescription] = useState('');
  const [fileId, setFileId] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [dateTime, setDateTime] = useState('');

  const handleSubmit = async () => {
    // Basic validation
    if (!description || !fileId || !latitude || !longitude || !dateTime) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    // Convert lat/long to numbers
    const latNum = parseFloat(latitude);
    const longNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(longNum)) {
      Alert.alert('Error', 'Latitude and Longitude must be valid numbers');
      return;
    }

    try {
      const res = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          description,
          fileId,
          latitude: latNum,
          longitude: longNum,
          dateTime, // Appwrite expects ISO8601 datetime string - so user should input like "2025-06-09T10:00:00Z"
        }
      );
      Alert.alert('Success', 'Document created with ID: ' + res.$id);
      // Clear form
      setDescription('');
      setFileId('');
      setLatitude('');
      setLongitude('');
      setDateTime('');
    } catch (error) {
      console.error('Create doc error:', error);
      Alert.alert('Error', 'Failed to create document');
    }
  };

  return (
    <View style={styles.container}>
      <Text>Description:</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter description"
      />

      <Text>File ID:</Text>
      <TextInput
        style={styles.input}
        value={fileId}
        onChangeText={setFileId}
        placeholder="Enter file ID"
      />

      <Text>Latitude:</Text>
      <TextInput
        style={styles.input}
        value={latitude}
        onChangeText={setLatitude}
        placeholder="Enter latitude"
        keyboardType="numeric"
      />

      <Text>Longitude:</Text>
      <TextInput
        style={styles.input}
        value={longitude}
        onChangeText={setLongitude}
        placeholder="Enter longitude"
        keyboardType="numeric"
      />

      <Text>Date & Time (ISO format):</Text>
      <TextInput
        style={styles.input}
        value={dateTime}
        onChangeText={setDateTime}
        placeholder="YYYY-MM-DDTHH:mm:ssZ"
      />

      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    marginBottom: 15,
    padding: 8,
    borderRadius: 4,
  },
});
