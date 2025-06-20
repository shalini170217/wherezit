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
  ImageBackground,
  Alert,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { databases, storage, ID } from '@/lib/appwrite';
import { Query } from 'react-native-appwrite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;
const CARD_MARGIN = 12;
const CARD_WIDTH = (screenWidth - CARD_MARGIN * 4) / 2;

const DATABASE_ID = '68478188000863f4f39f';
const COLLECTION_ID = '6847818f00228538908c'; // Found Items
const BUCKET_ID = '684782760015fa4dfa11';
const PROFILE_COLLECTION_ID = '6847c4830011d384a4d9';
const CHATS_COLLECTION_ID = '6848f6f10000d8b57f09';
const SCORES_COLLECTION_ID = '684a45b5000b6e6c8f0a';
const COMMON_COLLECTION_ID = '684bd4eb001f3369c6f6'; // Common Collection

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
  const [hasNewMessages, setHasNewMessages] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <ImageBackground
          source={require('../../assets/images/light.jpg')}
          style={{ width: '100%', height: 70, justifyContent: 'flex-end' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Found Items</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity onPress={signOut} style={{ backgroundColor: '#72d3fc', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: 'black', fontWeight: 'bold' }}>Sign Out</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <Image
                  source={require('../../assets/images/blue1.png')}
                  style={{ width: 32, height: 32, borderRadius: 16, marginLeft: 8 }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      ),
    });
  }, [navigation, signOut, user]);

  useEffect(() => {
    fetchItems();
    fetchNewMessages();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const itemsResponse = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
      const fetchedItems = itemsResponse.documents;
      setItems(fetchedItems);

      const urls = {};
      for (const item of fetchedItems) {
        if (item.fileId) {
          const fileView = storage.getFileView(BUCKET_ID, item.fileId);
          urls[item.$id] = fileView.toString();
        }
      }
      setImageUrls(urls);

      const profileMap = {};
      const uniqueUserIds = [...new Set(fetchedItems.map((item) => item.userId).filter(Boolean))];
      for (const userId of uniqueUserIds) {
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
        }
      }
      setProfiles(profileMap);
    } catch (error) {
      console.error('Error in fetchItems:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNewMessages = async () => {
    try {
      const messagesResponse = await databases.listDocuments(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        [Query.equal('receiverId', user?.$id)]
      );
      if (messagesResponse.documents.length > 0) {
        setHasNewMessages(true);
      }
    } catch (error) {
      console.error('Error fetching new messages:', error);
    }
  };

  const addToCommonCollection = async (description, itemId) => {
    try {
      await databases.createDocument(DATABASE_ID, COMMON_COLLECTION_ID, ID.unique(), {
        description,
        itemId,
        userId: user?.$id,
        type: 'found',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error adding to common collection:', error);
    }
  };

  const handleUploadPress = () => {
    router.push('/fupload');
  };

  const handleStartChat = (item) => {
    if (!item.userId || item.userId === user?.$id) return;
    const recipientProfile = profiles[item.userId] || { name: 'Anonymous', email: 'No email' };
    router.push({ pathname: '/chat', params: { recipientId: item.userId, recipientName: recipientProfile.name } });
  };

  const handleDeleteItem = (itemId, fileId, itemUserId, itemUsername) => {
    Alert.alert(
      'Confirm Deletion',
      'Was this item found and returned to the owner?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Found & Returned',
          onPress: async () => {
            try {
              const scoreQuery = [Query.equal('userId', itemUserId)];
              const existingScoreDoc = await databases.listDocuments(DATABASE_ID, SCORES_COLLECTION_ID, scoreQuery);
              const now = new Date().toISOString();

              if (existingScoreDoc.documents.length > 0) {
                const doc = existingScoreDoc.documents[0];
                await databases.updateDocument(DATABASE_ID, SCORES_COLLECTION_ID, doc.$id, {
                  score: doc.score + 10,
                  matches: doc.matches + 1,
                  lastUpdated: now,
                });
              } else {
                await databases.createDocument(DATABASE_ID, SCORES_COLLECTION_ID, ID.unique(), {
                  userId: itemUserId,
                  username: itemUsername,
                  score: 10,
                  matches: 1,
                  lastUpdated: now,
                });
              }

              await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, itemId);
              if (fileId) {
                await storage.deleteFile(BUCKET_ID, fileId);
              }
              setItems(prevItems => prevItems.filter(item => item.$id !== itemId));
              Alert.alert('Success', 'Item marked as returned and deleted successfully!');
            } catch (error) {
              console.error('Error updating score & deleting:', error);
              Alert.alert('Error', 'Failed to update score or delete the item.');
            }
          },
        },
        {
          text: 'Just Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, itemId);
              if (fileId) {
                await storage.deleteFile(BUCKET_ID, fileId);
              }
              setItems(prevItems => prevItems.filter(item => item.$id !== itemId));
              Alert.alert('Deleted', 'Item deleted successfully.');
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete the item.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderCard = ({ item }) => {
    const imageUrl = imageUrls[item.$id];
    const userProfile = profiles[item.userId] || { name: 'Anonymous', email: 'No email', avatar: null };

    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => addToCommonCollection(item.description, item.$id)}
          style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#00affa', borderRadius: 8, padding: 4, zIndex: 1 }}
        >
          <Ionicons name="sync-outline" size={16} color="white" />
        </TouchableOpacity>

        <View>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImage, styles.noImage]}>
              <Text style={{ color: '#888' }}>No Image</Text>
            </View>
          )}
          <View style={styles.foundTag}>
            <Text style={styles.foundTagText}>Found</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardDescription} numberOfLines={2}>{item.description || 'No description'}</Text>
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
            </View>
            {item.userId !== user?.$id && (
              <TouchableOpacity style={styles.plusButton} onPress={() => handleStartChat(item)}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {item.userId === user?.$id && (
            <TouchableOpacity
              style={{
                marginTop: 6,
                backgroundColor: '#f94144',
                paddingVertical: 6,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={() => handleDeleteItem(item.$id, item.fileId, item.userId, userProfile.name)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const filteredItems = items.filter((item) =>
    (item.description ?? '').toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          placeholder="Search by description..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
          style={styles.searchBar}
        />
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderCard}
        keyExtractor={(item) => item.$id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
        ListEmptyComponent={
          !loading && (
            <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>No items found</Text>
          )
        }
      />

      <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPress}>
        <Ionicons name="cloud-upload-outline" size={20} color="black" style={{ marginRight: 8 }} />
        <Text style={styles.uploadButtonText}>Upload an Item</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.inboxButton, { top: insets.top + 60 }]}
        onPress={() => {
          setHasNewMessages(false);
          router.push('/inbox');
        }}
      >
        <Ionicons name="notifications" size={22} color="black" />
        {hasNewMessages && <View style={styles.notificationDot} />}
      </TouchableOpacity>
    </View>
  );
};

export default FoundScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#26314a', paddingHorizontal: 12, paddingTop: 8 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: 'black',
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchBar: { flex: 1, color: 'black', fontSize: 16 },
  inboxButton: { position: 'absolute', right: 20, backgroundColor: '#f9c74f', borderRadius: 22, width: 42, height: 42, justifyContent: 'center', alignItems: 'center', elevation: 6, zIndex: 10 },
  notificationDot: { position: 'absolute', top: 5, right: 5, width: 10, height: 10, borderRadius: 5, backgroundColor: 'red' },
  uploadButton: { flexDirection: 'row', backgroundColor: '#72d3fc', borderRadius: 25, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', position: 'absolute', bottom: 20, alignSelf: 'center', elevation: 5 },
  uploadButtonText: { color: 'black', fontSize: 16, fontWeight: 'bold' },
  card: { width: CARD_WIDTH, backgroundColor: '#f5f5f5', borderRadius: 12, overflow: 'hidden', marginBottom: 16, marginHorizontal: CARD_MARGIN / 2, shadowColor: '#c8c9cc', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  cardImage: { width: '100%', height: 160 },
  noImage: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0eaff' },
  cardContent: { padding: 6, gap: 4 },
  cardDescription: { fontSize: 13, fontWeight: '600', color: '#222' },
  cardDetail: { fontSize: 11, color: '#666' },
  userInfoContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  userAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  defaultAvatar: { backgroundColor: '#72d3fc', justifyContent: 'center', alignItems: 'center' },
  userTextInfo: { flex: 1 },
  userName: { fontSize: 11, fontWeight: '600', color: '#333' },


  plusButton: { backgroundColor: '#00affa', padding: 6, borderRadius: 20, marginLeft: 8 },
  foundTag: { position: 'absolute', top: 8, left: 8, backgroundColor: 'green', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  foundTagText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
});
