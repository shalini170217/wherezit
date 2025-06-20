import React, { useLayoutEffect, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { databases, storage } from '@/lib/appwrite';
import { Query, ID } from 'react-native-appwrite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { queryGemini } from '@/lib/geminiMatcher'; // Import Gemini function

const screenWidth = Dimensions.get('window').width;
const CARD_MARGIN = 12;
const CARD_WIDTH = (screenWidth - CARD_MARGIN * 4) / 2;

const DATABASE_ID = '68478188000863f4f39f';
const COLLECTION_ID = '68497c5500165f632eef'; // Lost Items
const BUCKET_ID = '684782760015fa4dfa11';
const PROFILE_COLLECTION_ID = '6847c4830011d384a4d9';
const CHATS_COLLECTION_ID = '6848f6f10000d8b57f09';
const COMMON_COLLECTION_ID = '684bd4eb001f3369c6f6';
const NOTIFICATIONS_COLLECTION_ID = '684be54c003a6abfd26a'; // Notifications collection

const LostScreen = () => {
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
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Lost Items</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity onPress={signOut} style={{ backgroundColor: '#72d3fc', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: 'black', fontWeight: 'bold' }}>Sign Out</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <Image source={require('../../assets/images/blue1.png')} style={{ width: 32, height: 32, borderRadius: 16, marginLeft: 8 }} />
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
      const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
      const fetchedItems = response.documents;
      setItems(fetchedItems);

      const urls = {};
      for (const item of fetchedItems) {
        if (item.fileId) {
          urls[item.$id] = storage.getFileView(BUCKET_ID, item.fileId).toString();
        }
      }
      setImageUrls(urls);

      const profileMap = {};
      const uniqueUserIds = [...new Set(fetchedItems.map((i) => i.userId).filter(Boolean))];
      for (const userId of uniqueUserIds) {
        const profileRes = await databases.listDocuments(DATABASE_ID, PROFILE_COLLECTION_ID, [
          Query.equal('userId', userId),
        ]);
        if (profileRes.documents.length > 0) {
          const profile = profileRes.documents[0];
          profileMap[userId] = {
            name: profile.name || 'Anonymous',
            email: profile.email || 'No email',
            avatar: profile.avatar || null,
          };
        }
      }
      setProfiles(profileMap);
    } catch (error) {
      console.error('Fetch Error:', error);
      Alert.alert('Error', 'Failed to fetch items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNewMessages = async () => {
    try {
      const res = await databases.listDocuments(DATABASE_ID, CHATS_COLLECTION_ID, [
        Query.equal('receiverId', user?.$id),
      ]);
      setHasNewMessages(res.documents.length > 0);
    } catch (error) {
      console.error('Message Fetch Error:', error);
    }
  };

  const addToCommonCollection = async (description, itemId) => {
    if (!user?.$id) {
      Alert.alert('Error', 'You must be logged in to perform this action');
      return;
    }

    try {
      await databases.createDocument(
        DATABASE_ID,
        COMMON_COLLECTION_ID,
        ID.unique(),
        {
          description,
          itemId,
          userId: user.$id,
          type: 'lost',
          createdAt: new Date().toISOString(),
        }
      );

      Alert.alert('Success', 'Item added to common collection');
      fetchItems(); // Refresh the list
    } catch (error) {
      console.error('Detailed error:', error);
      Alert.alert('Error', `Failed to add: ${error.message}`);
    }
  };

  const saveNotification = async (lostItemId, message) => {
    try {
      await databases.createDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, ID.unique(), {
        userId: user?.$id,
        matchType: 'Gemini Match',
        lostItemId,
        foundItemId: '',
        message,
        timestamp: new Date().toISOString(),
        read: false,
      });
      console.log('✅ Gemini response saved to Notifications');
    } catch (error) {
      console.error('❗ Error saving notification:', error);
    }
  };

  const handleGeminiPress = async () => {
  setLoading(true);
  try {
    // 1. Fetch all items from common collection
    const commonItems = await databases.listDocuments(
      DATABASE_ID,
      COMMON_COLLECTION_ID
    );
    
    // 2. Separate lost and found items
    const lostItems = commonItems.documents
      .filter(item => item.type === 'lost')
      .map(item => ({
        id: item.$id,
        description: item.description,
        userId: item.userId,
        createdAt: item.createdAt
      }));
    
    const foundItems = commonItems.documents
      .filter(item => item.type === 'found')
      .map(item => ({
        id: item.$id,
        description: item.description,
        userId: item.userId,
        createdAt: item.createdAt
      }));

    if (lostItems.length === 0 || foundItems.length === 0) {
      Alert.alert(
        'Not Enough Data', 
        `Need both lost and found items for matching.\n\nLost items: ${lostItems.length}\nFound items: ${foundItems.length}`
      );
      return;
    }

    // 3. Prepare structured data for Gemini
    const prompt = `Analyze these lost and found items to find potential matches based on their descriptions:

    LOST ITEMS (${lostItems.length}):
    ${lostItems.map((item, i) => `
    ${i+1}. [ID: ${item.id}]
    - Description: ${item.description}
    - Reported by user: ${item.userId}
    - Date: ${item.createdAt}`).join('\n')}

    FOUND ITEMS (${foundItems.length}):
    ${foundItems.map((item, i) => `
    ${i+1}. [ID: ${item.id}]
    - Description: ${item.description}
    - Reported by user: ${item.userId}
    - Date: ${item.createdAt}`).join('\n')}

    Provide your analysis with:
    1. Similarity percentage (0-100%) for each potential match
    2. Confidence level (Low/Medium/High)
    3. Specific matching details (color, location, time proximity, etc.)
    4. Recommended next steps

    Format your response with clear section headers.`;

    // 4. Query Gemini API
    const geminiResponse = await queryGemini(prompt);
    
    // 5. Save results to notifications
    await saveNotification('', `Gemini Matching Report:\n\n${geminiResponse}`);

    Alert.alert(
      'Matching Complete',
      'Potential matches analyzed. Check notifications for details.',
      [
        {
          text: 'View Results',
          onPress: () => router.push('/inbox')
        }
      ]
    );

  } catch (error) {
    console.error('Gemini Analysis Error:', error);
    Alert.alert('Error', 'Failed to analyze items. Please try again.');
  } finally {
    setLoading(false);
  }
};
  const handleUploadPress = () => router.push({ pathname: '/lupload', params: { callback: 'refreshLostScreen' } });

  const handleStartChat = (item) => {
    if (!item.userId || item.userId === user?.$id) return;
    const recipientProfile = profiles[item.userId] || { name: 'Anonymous', email: 'No email' };
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
    const userProfile = profiles[item.userId] || { name: 'Anonymous', email: 'No email', avatar: null };

    return (
      <View style={styles.card}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>Lost</Text>
        </View>

        <TouchableOpacity onPress={() => addToCommonCollection(item.description, item.$id)} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>

        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.noImage]}>
            <Ionicons name="image-outline" size={28} color="#999" />
            <Text style={{ color: '#999', marginTop: 4, fontSize: 12 }}>No Image</Text>
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description || 'No description'}
          </Text>
          <Text style={styles.cardDetail}>📅 {item.date?.slice(0, 10)} ⏰ {item.time}</Text>
          <Text style={styles.cardDetail}>
            📍 Lat: {Number(item.latitude).toFixed(2)}, Long: {Number(item.longitude).toFixed(2)}
          </Text>

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
              <TouchableOpacity style={styles.chatButton} onPress={() => handleStartChat(item)}>
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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.geminiButton} onPress={handleGeminiPress}>
        <Ionicons name="sparkles-outline" size={20} color="black" style={{ marginRight: 6 }} />
        <Text style={styles.geminiButtonText}>Gemini Match</Text>
      </TouchableOpacity>

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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#72d3fc" />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderCard}
          keyExtractor={(item) => item.$id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
          ListEmptyComponent={
            <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>
              {searchText ? 'No matching items found' : 'No lost items found'}
            </Text>
          }
          refreshing={loading}
          onRefresh={fetchItems}
        />
      )}

      <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPress}>
        <Ionicons name="cloud-upload-outline" size={20} color="black" style={{ marginRight: 8 }} />
        <Text style={styles.uploadButtonText}>Upload Lost Item</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.inboxButton, { top: insets.top + 60 }]}
        onPress={() => {
          setHasNewMessages(false);
          router.push('/inbox');
        }}
      >
        <Ionicons name="mail" size={22} color="black" />
        {hasNewMessages && <View style={styles.notificationDot} />}
      </TouchableOpacity>
    </View>
  );
};

export default LostScreen;

// Keep your styles as they are; no need to repeat here unless you want modifications.


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#26314a',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  geminiButton: {
    flexDirection: 'row',
    backgroundColor: '#f9c74f',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 8,
    alignSelf: 'center',
    elevation: 4,
  },
  geminiButtonText: {
    color: 'black',
    fontSize: 14,
    fontWeight: 'bold',
  },
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
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    color: 'black',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  notificationDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
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
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0eaff',
  },
  cardContent: {
    padding: 8,
    gap: 6,
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
  tag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  tagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  refreshButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#22c55e',
    borderRadius: 16,
    padding: 6,
    zIndex: 10,
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
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  chatButton: {
    backgroundColor: '#00affa',
    padding: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
});
