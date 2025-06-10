import React, { useState } from 'react';
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
  Platform
} from 'react-native';
import { databases, ID } from '@/lib/appwrite';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'expo-router';

const DATABASE_ID = '68478188000863f4f39f';
const COLLECTION_ID = '6847c4830011d384a4d9';

const ProfilePage = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    email: '',
    yearOfStudy: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    department: '',
    email: '',
    yearOfStudy: ''
  });

  const [uploading, setUploading] = useState(false);

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
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) validateField(name, value);
  };

  const handleBlur = (name) => {
    validateField(name, formData[name]);
  };

  const handleSave = async () => {
  // Validate all fields before submitting
  const isValid = Object.keys(formData).every(key => validateField(key, formData[key]));

  if (!isValid) {
    Alert.alert('Validation Error', 'Please fix all errors before submitting');
    return;
  }

  if (!user?.$id) {
    Alert.alert('Error', 'Authentication required. Please login again.');
    return;
  }

  setUploading(true);

  try {
    const newDocument = {
      name: formData.name,
      department: formData.department,
      email: formData.email,
      yearOfStudy: parseInt(formData.yearOfStudy, 10),
    };

    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      newDocument
    );

    Alert.alert('Success', 'Profile saved successfully!');

    // Reset form
    setFormData({
      name: '',
      department: '',
      email: '',
      yearOfStudy: '',
    });

    // ✅ Navigate AFTER alert
    router.replace('/(tabs)/found');

  } catch (error) {
    console.error('Full error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      response: error.response,
    });

    let errorMessage = error.message;
    if (error.response?.message?.includes('required')) {
      errorMessage = 'Missing required fields. Check your collection attributes.';
    }

    Alert.alert('Save Failed', errorMessage);
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
          <Text style={styles.heading}>Complete Your Profile</Text>

          {/* Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
              onBlur={() => handleBlur('name')}
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
              onBlur={() => handleBlur('department')}
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
              onBlur={() => handleBlur('email')}
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
              onBlur={() => handleBlur('yearOfStudy')}
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
              <Text style={styles.saveButtonText} >Save Profile</Text>
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
