import React, { useLayoutEffect, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { databases, storage } from '@/lib/appwrite';

const screenWidth = Dimensions.get('window').width;

const DATABASE_ID = '68466603000fa3396bcc';
const COLLECTION_ID = '6846660d0031b741c502';
const BUCKET_ID = '684666ed00167611657f';

const FoundScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { signOut, user } = useAuth();

  const [searchText, setSearchText] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState({}); // To store authenticated URLs

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerRow}>
          <TextInput
            placeholder="Search..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
            style={styles.searchBar}
          />
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Image
              source={require('../../assets/images/blue.png')}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, signOut, user, searchText]);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
        setItems(response.documents);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Fetch authenticated file view URLs for each item with fileId
  useEffect(() => {
    const fetchImageUrls = async () => {
      const urls = {};
      for (const item of items) {
        if (item.fileId) {
          try {
            // This uses the SDK to get the file view URL (auth required)
            const url = await storage.getFilePreview(BUCKET_ID, item.fileId, 300, 300);
            urls[item.$id] = url;
          } catch (error) {
            console.error('Error getting file preview URL:', error);
          }
        }
      }
      setImageUrls(urls);
    };

    if (items.length > 0) {
      fetchImageUrls();

      // Debug log a sample URL
      console.log(
        'Sample image preview URL:',
        `${storage.endpoint}/storage/buckets/${BUCKET_ID}/files/${items[0].fileId}/preview?project=${storage.project}&width=300`
      );
    }
  }, [items]);

  const handleUploadPress = () => {
    router.push('/fupload');
  };

  const renderCard = ({ item }) => {
    // Try to get URL from authenticated URLs fetched above
    let imageUrl = imageUrls[item.$id] ?? null;

    // Fallback: construct public preview URL manually (works only if public read access is set)
    if (!imageUrl && item.fileId) {
      imageUrl = `${storage.endpoint}/storage/buckets/${BUCKET_ID}/files/${item.fileId}/preview?project=${storage.project}&width=300`;
    }

    return (
      <View style={styles.card}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cardImage, styles.noImage]}>
            <Text style={{ color: '#888' }}>No Image</Text>
          </View>
        )}
        <Text style={styles.cardDescription}>
          {item.description ?? 'No description'}
        </Text>
      </View>
    );
  };

  const filteredItems = items.filter(item =>
    (item.description ?? '').toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <>
          <FlatList
            data={filteredItems}
            renderItem={renderCard}
            keyExtractor={(item) => item.$id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
          <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPress}>
            <Ionicons
              name="cloud-upload-outline"
              size={20}
              color="black"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.uploadButtonText}>Upload an Item</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default FoundScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    color: 'black',
    borderWidth: 2,
    borderColor: 'black',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    gap: 8,
  },
  signOutBtn: {
    backgroundColor: '#72d3fc',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  signOutText: {
    color: 'black',
    fontWeight: 'bold',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#72d3fc',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'absolute',
    bottom: 20,
  },
  uploadButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    width: (screenWidth - 48) / 2,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f0f0f0', // helps verify visibility
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ddd',
  },
  cardDescription: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});
