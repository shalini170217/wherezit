import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { storage, databases, DATABASE_ID, COLLECTION_ID, BUCKET_ID } from '@/lib/appwrite';
import { ID, ReactNativeFile } from 'react-native-appwrite';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const uploadFoundScreen = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    image: null,
    description: '',
    location: null,
    address: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setForm({ ...form, image: result.assets[0] });
    }
  };

  const getLocation = async () => {
    setLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync(location.coords);

      setForm({
        ...form,
        location: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
        address: `${address[0]?.name}, ${address[0]?.city}, ${address[0]?.country}`,
      });
    } catch {
      Alert.alert('Error', 'Could not fetch location');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.image || !form.description || !form.location) {
      Alert.alert('Error', 'Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      const imageFile = new ReactNativeFile({
        uri: form.image.uri,
        name: `found_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });

      const file = await storage.createFile(BUCKET_ID, ID.unique(), imageFile);

      await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        userId: user.$id,
        imageId: file.$id,
        description: form.description,
        location: JSON.stringify(form.location),
        address: form.address,
        date: form.date,
        time: form.time,
        status: 'found',
      });

      Alert.alert('Success', 'Found item uploaded!');
      router.replace('/found');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to upload item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold mb-4">Report Found Item</Text>

        {/* Image Picker */}
        <TouchableOpacity onPress={pickImage} className="border-2 border-dashed border-gray-300 rounded-lg p-8 items-center justify-center mb-4">
          {form.image ? (
            <Image source={{ uri: form.image.uri }} className="w-full h-48 rounded-lg" />
          ) : (
            <View className="items-center">
              <Ionicons name="camera" size={24} color="gray" />
              <Text className="text-gray-500 mt-2">Tap to upload image</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Description */}
        <TextInput
          placeholder="Describe the item..."
          multiline
          numberOfLines={4}
          className="bg-white p-3 rounded-lg border border-gray-200 mb-4"
          value={form.description}
          onChangeText={(text) => setForm({ ...form, description: text })}
        />

        {/* Location */}
        <TouchableOpacity
          onPress={getLocation}
          disabled={loading}
          className="bg-white p-3 rounded-lg border border-gray-200 flex-row items-center mb-2"
        >
          <Ionicons name="location" size={20} color="#3b82f6" />
          <Text className="ml-2 flex-1">{form.address || 'Tap to get location'}</Text>
          {loading && <ActivityIndicator size="small" color="#3b82f6" />}
        </TouchableOpacity>

        {form.location && (
          <Text className="text-xs text-gray-500 mb-4">
            Coords: {form.location.lat.toFixed(4)}, {form.location.lng.toFixed(4)}
          </Text>
        )}

        {/* Date/Time */}
        <View className="flex-row mb-4">
          <TextInput
            className="flex-1 bg-white p-3 rounded-lg border border-gray-200 mr-2"
            value={form.date}
            onChangeText={(text) => setForm({ ...form, date: text })}
          />
          <TextInput
            className="flex-1 bg-white p-3 rounded-lg border border-gray-200"
            value={form.time}
            onChangeText={(text) => setForm({ ...form, time: text })}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          className="bg-blue-500 p-4 rounded-lg items-center"
          disabled={loading}
          onPress={handleSubmit}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Submit</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default uploadFoundScreen;
