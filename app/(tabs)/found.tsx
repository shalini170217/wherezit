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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

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
              source={require('../../assets/images/blue1.png')}
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
        const itemsResponse = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
        const fetchedItems = itemsResponse.documents;
        setItems(fetchedItems);

        const urls = {};
        for (const item of fetchedItems) {
          if (item.fileId) {
            try {
              const fileView = storage.getFileView(BUCKET_ID, item.fileId);
              urls[item.$id] = fileView.toString();
            } catch (error) {
              console.error('Error generating URL for file', item.fileId, ':', error);
            }
          }
        }
        setImageUrls(urls);

        setProfileLoading(true);
        const profileMap = {};
        const uniqueUserIds = [...new Set(fetchedItems.map((item) => item.userId).filter(Boolean))];

        for (const userId of uniqueUserIds) {
          try {
            const profileResponse = await databases.listDocuments(
              DATABASE_ID,
              PROFILE_COLLECTION_ID,
              [Query.equal('userId', userId)]
            );
            if (profileResponse.documents.length > 0) {
              const profile = profileResponse.documents[0];
              profileMap[userId] = {
                name: profile.name || 'Anonymous',
                email: profile.email || 'No email',
                avatar: profile.avatar || null,
              };
            } else {
              profileMap[userId] = {
                name: 'Anonymous',
                email: 'No email',
                avatar: null,
              };
            }
          } catch (error) {
            console.error('Error fetching profile for user', userId, ':', error);
            profileMap[userId] = {
              name: 'Error loading',
              email: 'Error loading',
              avatar: null,
            };
          }
        }
        setProfiles(profileMap);
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

  const handleStartChat = (item) => {
    if (!item.userId || item.userId === user?.$id) {
      console.log("Cannot chat with yourself or invalid user");
      return;
    }
    
    const recipientProfile = profiles[item.userId] || {
      name: 'Anonymous',
      email: 'No email',
    };

    router.push({
      pathname: '/chat',
      params: {
        recipientId: item.userId,
        recipientName: recipientProfile.name,
      },
    });
  };

  const renderCard = ({ item }) => {
    const imageUrl = imageUrls[item.$id];
    const userProfile = profiles[item.userId] || {
      name: 'Anonymous',
      email: 'No email',
      avatar: null,
    };

    return (
      <View style={styles.card}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
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
              <Image source={{ uri: userProfile.avatar }} style={styles.userAvatar} />
            ) : (
              <View style={[styles.userAvatar, styles.defaultAvatar]}>
                <Ionicons name="person" size={16} color="#fff" />
              </View>
            )}
            <View style={styles.userTextInfo}>
              <Text style={styles.userName}>{userProfile.name}</Text>
              <Text style={styles.userEmail}>{userProfile.email}</Text>
            </View>
            {item.userId !== user?.$id && (
              <TouchableOpacity 
                style={styles.plusButton} 
                onPress={() => handleStartChat(item)}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
              </TouchableOpacity>
            )}
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

      <TouchableOpacity
        style={[styles.inboxButton, { top: insets.top + 60 }]}
        onPress={() => router.push("/inbox")}
      >
        <Ionicons name="notifications" size={22} color="black" />
      </TouchableOpacity>
    </View>
  );
};

export default FoundScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#26314a', paddingHorizontal: 12, paddingTop: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
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
  inboxButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#f9c74f',
    borderRadius: 22,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    zIndex: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', paddingRight: 10, gap: 8 },
  signOutBtn: { backgroundColor: '#72d3fc', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  signOutText: { color: 'black', fontWeight: 'bold' },
  avatar: { width: 32, height: 32, borderRadius: 16, marginLeft: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#26314a' },
  loadingText: { color: '#fff', marginTop: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#fff', fontSize: 16 },
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
  uploadButtonText: { color: 'black', fontSize: 16, fontWeight: 'bold' },
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
  cardImage: { width: '100%', height: 180 },
  noImage: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0eaff' },
  cardContent: { padding: 10, gap: 4 },
  cardDescription: { fontSize: 14, fontWeight: '600', color: '#222' },
  cardDetail: { fontSize: 12, color: '#666' },
  userInfoContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  userAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  defaultAvatar: { backgroundColor: '#72d3fc', justifyContent: 'center', alignItems: 'center' },
  userTextInfo: { flex: 1 },
  userName: { fontSize: 12, fontWeight: '600', color: '#333' },
  userEmail: { fontSize: 10, color: '#666' },
  plusButton: { backgroundColor: '#00affa', padding: 6, borderRadius: 20, marginLeft: 8 },
});
