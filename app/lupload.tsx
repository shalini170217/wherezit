import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { databases, storage, ID } from '../lib/appwrite';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { SafeAreaView } from 'react-native-safe-area-context';

const DATABASE_ID = '68478188000863f4f39f';
const COLLECTION_ID = '68497c5500165f632eef'; // LOST items collection
const BUCKET_ID = '684782760015fa4dfa11';

export default function LostUploadForm() {
  const router = useRouter();
  const { user } = useAuth();

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
      console.error('Image upload error:', error);
      Alert.alert('Error', 'Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type !== 'dismissed' && selectedDate) setDate(selectedDate);
  };

  const onChangeTime = (event, selectedTime) => {
    setShowTimePicker(false);
    if (event.type !== 'dismissed' && selectedTime) setTime(selectedTime);
  };

  const handleSubmit = async () => {
    if (!description || !imageUri) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (!user || !user.$id) {
      Alert.alert('Authentication Error', 'Please login again');
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
      await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        description,
        fileId: uploadedFileId,
        latitude: lat,
        longitude: long,
        date: date.toISOString().split('T')[0],
        time: time.toTimeString().split(' ')[0],
        userId: user.$id,
      });

      setDescription('');
      setImageUri(null);
      setDate(new Date());
      setTime(new Date());

      router.replace('/(tabs)/lost');
    } catch (error) {
      console.error('Document creation error:', error);
      Alert.alert('Error', 'Failed to create lost item record');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/prof.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Ionicons name="alert-circle-outline" size={28} color="#fff" />
            <Text style={styles.headerText}>Upload Lost Item</Text>
          </View>

          <Text style={styles.label}>Description:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter description of lost item"
            placeholderTextColor="#ccc"
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
            <Text style={styles.textInsideInput}>
              {date.toISOString().split('T')[0]}
            </Text>
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
            <Text style={styles.textInsideInput}>
              {time.toTimeString().split(' ')[0]}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display="default"
              onChange={onChangeTime}
            />
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitButton, isUploading && { opacity: 0.5 }]}
            disabled={isUploading}
          >
            <Text style={styles.submitButtonText}>
              {isUploading ? 'Uploading...' : 'Submit'}
            </Text>
          </TouchableOpacity>

          {isUploading && <ActivityIndicator size="large" color="#fff" />}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  label: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    color: '#fff',
  },
  textInsideInput: {
    color: '#fff',
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 8,
    height: 200,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 8,
  },
  imagePlaceholder: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
