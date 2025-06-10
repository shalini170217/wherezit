import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { databases, ID } from '@/lib/appwrite';
import { Query } from 'react-native-appwrite';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'expo-router';

const DATABASE_ID = '68478188000863f4f39f';
const COLLECTION_ID = '6847c4830011d384a4d9';

const ProfilePage = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [profileId, setProfileId] = useState(null); // For storing existing document ID
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    email: '',
    yearOfStudy: '',
  });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user?.$id) {
      fetchProfile(user.$id);
    }
  }, [user]);

  const fetchProfile = async (userId) => {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal('userId', userId),
      ]);
      if (response.total > 0) {
        const doc = response.documents[0];
        setProfileId(doc.$id);
        setFormData({
          name: doc.name || '',
          department: doc.department || '',
          email: doc.email || '',
          yearOfStudy: doc.yearOfStudy?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to fetch profile');
    }
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value.trim()) error = 'Name is required';
        else if (!/^[a-zA-Z\s]*$/.test(value)) error = 'Name should only contain letters';
        break;
      case 'department':
        if (!value.trim()) error = 'Department is required';
        break;
      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Please enter a valid email';
        break;
      case 'yearOfStudy':
        if (!value.trim()) error = 'Year of study is required';
        else if (!/^[1-4]$/.test(value)) error = 'Please enter a valid year (1-4)';
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) validateField(name, value);
  };

  const handleSave = async () => {
    const isValid = Object.keys(formData).every((key) =>
      validateField(key, formData[key])
    );

    if (!isValid) {
      Alert.alert('Validation Error', 'Please fix all errors before submitting');
      return;
    }

    if (!user?.$id) {
      Alert.alert('Error', 'Authentication required. Please login again.');
      return;
    }

    setUploading(true);

    const newDocument = {
      userId: user.$id, // ⬅️ Save the user ID here!
      name: formData.name,
      department: formData.department,
      email: formData.email,
      yearOfStudy: parseInt(formData.yearOfStudy, 10),
    };

    try {
      if (profileId) {
        // Profile exists → update it
        await databases.updateDocument(DATABASE_ID, COLLECTION_ID, profileId, newDocument);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        // Profile does not exist → create it
        const response = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          ID.unique(),
          newDocument
        );
        setProfileId(response.$id);
        Alert.alert('Success', 'Profile created successfully!');
      }

      router.replace('/(tabs)/found');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Something went wrong.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.heading}>
            {profileId ? 'Update Your Profile' : 'Complete Your Profile'}
          </Text>

          {/* Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
              style={[styles.input, errors.name && styles.inputError]}
              placeholderTextColor="#999"
              returnKeyType="next"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Department Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Department <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              placeholder="Enter your department"
              value={formData.department}
              onChangeText={(text) => handleChange('department', text)}
              style={[styles.input, errors.department && styles.inputError]}
              placeholderTextColor="#999"
              returnKeyType="next"
            />
            {errors.department && <Text style={styles.errorText}>{errors.department}</Text>}
          </View>

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              College Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              placeholder="Enter your college email"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              style={[styles.input, errors.email && styles.inputError]}
              keyboardType="email-address"
              placeholderTextColor="#999"
              autoCapitalize="none"
              returnKeyType="next"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Year of Study Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Year of Study <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              placeholder="Enter your year (1-4)"
              value={formData.yearOfStudy}
              onChangeText={(text) => handleChange('yearOfStudy', text)}
              style={[styles.input, errors.yearOfStudy && styles.inputError]}
              keyboardType="number-pad"
              placeholderTextColor="#999"
              maxLength={1}
            />
            {errors.yearOfStudy && <Text style={styles.errorText}>{errors.yearOfStudy}</Text>}
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>
                {profileId ? 'Update Profile' : 'Save Profile'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#1e293b',
  },
  container: {
    flex: 1,
    padding: 24,
    paddingBottom: 40,
  },
  heading: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 28,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#f1f5f9',
    fontSize: 16,
    marginBottom: 6,
  },
  required: {
    color: '#f87171',
  },
  input: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    color: '#0f172a',
  },
  inputError: {
    borderColor: '#f87171',
    borderWidth: 1,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfilePage;
