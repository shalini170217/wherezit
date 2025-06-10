import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { databases, storage, ID } from '../lib/appwrite';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const DATABASE_ID = '68478188000863f4f39f';
const COLLECTION_ID = '6847818f00228538908c';
const BUCKET_ID = '684782760015fa4dfa11';

export default function UploadForm() {
  const router = useRouter();

  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image first');
      return null;
    }

    setIsUploading(true);
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const file = await storage.createFile(BUCKET_ID, ID.unique(), blob);
      return file.$id;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

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
    if (!description || !imageUri) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const uploadedFileId = await uploadImage();
    if (!uploadedFileId) return;

    const lat = parseFloat(latitude);
    const long = parseFloat(longitude);
    if (isNaN(lat) || isNaN(long)) {
      Alert.alert('Error', 'Invalid coordinates');
      return;
    }

    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          description,
          fileId: uploadedFileId,
          latitude: lat,
          longitude: long,
          date: date.toISOString().split('T')[0],
          time: time.toTimeString().split(' ')[0],
        }
      );

      // Reset form
      setDescription('');
      setImageUri(null);
      setDate(new Date());
      setTime(new Date());
      
      // Navigate back to found items tab
      router.replace('/(tabs)/found');
      
    } catch (error) {
      console.error('Error creating document:', error);
      Alert.alert('Error', 'Failed to create document');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Ionicons name="cloud-upload-outline" size={25} color="#000" />
        <Text style={styles.titleText}>Upload Found Items</Text>
      </View>

      <Text style={styles.label}>Description:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter description"
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Image:</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text style={styles.imagePlaceholder}>Tap to select an image</Text>
        )}
      </TouchableOpacity>

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

      <Button
        title={isUploading ? 'Uploading...' : 'Submit'}
        onPress={handleSubmit}
        disabled={isUploading}
      />

      {isUploading && <ActivityIndicator style={styles.loader} size="large" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleText: { fontSize: 15, fontWeight: 'bold', marginLeft: 8 },
  label: { fontWeight: '600', marginBottom: 2 },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    height: 200,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  imagePlaceholder: {
    color: '#888',
  },
  loader: {
    marginTop: 20,
  },
});