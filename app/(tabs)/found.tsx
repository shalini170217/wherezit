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
import { Query } from 'react-native-appwrite';
const screenWidth = Dimensions.get('window').width;
const CARD_MARGIN = 12;
const CARD_WIDTH = (screenWidth - CARD_MARGIN * 4) / 2;

const DATABASE_ID = '68478188000863f4f39f';
const COLLECTION_ID = '6847818f00228538908c'; // Found Items
const BUCKET_ID = '684782760015fa4dfa11';
const PROFILE_COLLECTION_ID = '6847c4830011d384a4d9'; // Profile Collection

const FoundScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { signOut, user } = useAuth();

  const [searchText, setSearchText] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState({});
  const [profiles, setProfiles] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);

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
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch items
        const itemsResponse = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
        const fetchedItems = itemsResponse.documents;
        setItems(fetchedItems);
        console.log('Fetched items:', fetchedItems);

        // Fetch images
        const urls = {};
        for (const item of fetchedItems) {
          if (item.fileId) {
            try {
              const fileView = storage.getFileView(BUCKET_ID, item.fileId);
              urls[item.$id] = fileView.toString();

              // Verify the URL works
              const response = await fetch(urls[item.$id]);
              if (!response.ok) {
                console.warn(`Image not found for fileId: ${item.fileId}`);
                delete urls[item.$id];
              }
            } catch (error) {
              console.error('Error generating URL for file', item.fileId, ':', error);
            }
          }
        }
        setImageUrls(urls);

        // Fetch profiles for all unique user IDs
        setProfileLoading(true);
        const profileMap = {};
        const uniqueUserIds = [...new Set(fetchedItems.map((item) => item.userId).filter(Boolean))];
        console.log('Unique user IDs to fetch profiles for:', uniqueUserIds);

        for (const userId of uniqueUserIds) {
          try {
            const profileResponse = await databases.listDocuments(
              DATABASE_ID,
              PROFILE_COLLECTION_ID,
              [Query.equal('userId', userId)]
            );

            console.log(`Profile response for ${userId}:`, profileResponse);

            if (profileResponse.documents.length > 0) {
              const profile = profileResponse.documents[0];
              profileMap[userId] = {
                name: profile.name || 'Anonymous',
                email: profile.email || 'No email',
                avatar: profile.avatar || null,
              };
            } else {
              console.warn(`No profile found for userId: ${userId}`);
              profileMap[userId] = {
                name: 'Anonymous',
                email: 'No email',
                avatar: null,
              };
            }
          } catch (error) {
            console.error(`Error fetching profile for userId ${userId}:`, error);
            profileMap[userId] = {
              name: 'Error loading',
              email: 'Error loading',
              avatar: null,
            };
          }
        }
        setProfiles(profileMap);
        console.log('Profile map:', profileMap);
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setLoading(false);
        setProfileLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUploadPress = () => {
    router.push('/fupload');
  };

  const renderCard = ({ item }) => {
    const imageUrl = imageUrls[item.$id];
    const userProfile = profiles[item.userId] || {
      name: 'Loading...',
      email: 'Loading...',
      avatar: null,
    };

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
          
          <View style={styles.userInfoContainer}>
            {userProfile.avatar ? (
              <Image
                source={{ uri: userProfile.avatar }}
                style={styles.userAvatar}
              />
            ) : (
              <View style={[styles.userAvatar, styles.defaultAvatar]}>
                <Ionicons name="person" size={16} color="#fff" />
              </View>
            )}
            <View style={styles.userTextInfo}>
              <Text style={styles.userName}>{userProfile.name}</Text>
              <Text style={styles.userEmail}>{userProfile.email}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const filteredItems = items.filter((item) =>
    (item.description ?? '').toLowerCase().includes(searchText.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#72d3fc" />
        <Text style={styles.loadingText}>Loading items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredItems}
        renderItem={renderCard}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={{ paddingBottom: 100 }}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPress}>
        <Ionicons name="cloud-upload-outline" size={20} color="black" style={{ marginRight: 8 }} />
        <Text style={styles.uploadButtonText}>Upload an Item</Text>
      </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#26314a',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
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
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  defaultAvatar: {
    backgroundColor: '#72d3fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userTextInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 10,
    color: '#666',
  },
});