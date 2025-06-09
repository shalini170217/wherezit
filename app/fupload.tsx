import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { databases, ID } from '../lib/appwrite';

const DATABASE_ID = '68466603000fa3396bcc';
const COLLECTION_ID = '6846660d0031b741c502';

export default function UploadForm() {
  const [description, setDescription] = useState('');
  const [fileId, setFileId] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
    })();
  }, []);

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) setDate(selectedDate);
  };

  const onChangeTime = (event, selectedTime) => {
    setShowTimePicker(false);
    if (event.type === 'dismissed') return;
    if (selectedTime) setTime(selectedTime);
  };

  const handleSubmit = async () => {
    if (!description || !fileId || !latitude || !longitude) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const lat = parseFloat(latitude);
    const long = parseFloat(longitude);
    if (isNaN(lat) || isNaN(long)) {
      Alert.alert('Error', 'Invalid coordinates');
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
          latitude: lat,
          longitude: long,
          date: date.toISOString().split('T')[0],       // "YYYY-MM-DD"
          time: time.toTimeString().split(' ')[0],       // "HH:mm:ss"
        }
      );
      Alert.alert('Success', 'Document created with ID: ' + res.$id);
      setDescription('');
      setFileId('');
      setDate(new Date());
      setTime(new Date());
    } catch (error) {
      console.error('Error creating document:', error);
      Alert.alert('Error', 'Failed to create document');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Description:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter description"
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>File ID:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter file ID"
        value={fileId}
        onChangeText={setFileId}
      />

      <Text style={styles.label}>Latitude:</Text>
      <TextInput style={styles.input} value={latitude} editable={false} />

      <Text style={styles.label}>Longitude:</Text>
      <TextInput style={styles.input} value={longitude} editable={false} />

      <Text style={styles.label}>Date:</Text>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={styles.input}
      >
        <Text>{date.toISOString().split('T')[0]}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      <Text style={styles.label}>Time:</Text>
      <TouchableOpacity
        onPress={() => setShowTimePicker(true)}
        style={styles.input}
      >
        <Text>{time.toTimeString().split(' ')[0]}</Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={onChangeTime}
        />
      )}

      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  label: { fontWeight: '600', marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
});
