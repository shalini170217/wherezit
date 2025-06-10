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
const CARD_MARGIN = 12;
const CARD_WIDTH = (screenWidth - CARD_MARGIN * 4) / 2;

const DATABASE_ID = '68478188000863f4f39f';
const COLLECTION_ID = '6847818f00228538908c';
const BUCKET_ID = '684782760015fa4dfa11';

const FoundScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { signOut, user } = useAuth();

  const [searchText, setSearchText] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState({});

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerRow}>
          <TextInput
            placeholder="Search by description..."
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
          <TouchableOpacity onPress={() => router.push('/profile')}>
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

  useEffect(() => {
    const fetchImageUrls = async () => {
      const urls = {};
      for (const item of items) {
        if (item.fileId) {
          try {
            const fileView = storage.getFileView(BUCKET_ID, item.fileId);
            urls[item.$id] = fileView.toString();

            const response = await fetch(urls[item.$id]);
            if (!response.ok) {
              delete urls[item.$id];
            }
          } catch (error) {
            console.error('Error generating URL for file', item.fileId, ':', error);
          }
        }
      }
      setImageUrls(urls);
    };

    if (items.length > 0) {
      fetchImageUrls();
    }
  }, [items]);

  const handleUploadPress = () => {
    router.push('/fupload');
  };

  const renderCard = ({ item }) => {
    const imageUrl = imageUrls[item.$id];

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
        <View style={styles.cardContent}>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description || 'No description'}
          </Text>
          <Text style={styles.cardDetail}>📅 {item.date?.slice(0, 10)}</Text>
          <Text style={styles.cardDetail}>⏰ {item.time}</Text>
          <Text style={styles.cardDetail}>📍 Lat: {item.latitude}</Text>
          <Text style={styles.cardDetail}>📍 Long: {item.longitude}</Text>
        </View>
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
            contentContainerStyle={{ paddingBottom: 100 }}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
          />

          <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPress}>
            <Ionicons name="cloud-upload-outline" size={20} color="black" style={{ marginRight: 8 }} />
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
    backgroundColor: '#26314a',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    color: 'black',
    borderWidth: 2,
    borderColor: 'black',
    width: 340,
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
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    elevation: 5,
  },
  uploadButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    marginHorizontal: CARD_MARGIN / 2,
    shadowColor: '#c8c9cc',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0eaff',
  },
  cardContent: {
    padding: 10,
    gap: 4,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  cardDetail: {
    fontSize: 12,
    color: '#666',
  },
});
