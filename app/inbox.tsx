import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { databases } from '@/lib/appwrite';
import { Query } from 'react-native-appwrite';

const DATABASE_ID = '68478188000863f4f39f';
const CHATS_COLLECTION_ID = '6848f6f10000d8b57f09'; // Your chats collection ID
const PROFILE_COLLECTION_ID = '6847c4830011d384a4d9'; // Your profile collection ID

const InboxScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [senderProfiles, setSenderProfiles] = useState({});

  useEffect(() => {
    if (user?.$id) {
      fetchInbox();
    }
  }, [user]);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      // Fetch all chats where receiverId == current user
      const response = await databases.listDocuments(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        [Query.equal('receiverId', user.$id), Query.orderDesc('timestamp')]
      );

      setChats(response.documents);

      // Get unique senderIds to fetch profiles
      const uniqueSenderIds = [...new Set(response.documents.map(msg => msg.senderId))];

      const profileMap = {};

      for (const senderId of uniqueSenderIds) {
        const profileResponse = await databases.listDocuments(
          DATABASE_ID,
          PROFILE_COLLECTION_ID,
          [Query.equal('userId', senderId)]
        );

        if (profileResponse.documents.length > 0) {
          const profile = profileResponse.documents[0];
          profileMap[senderId] = {
            name: profile.name || 'Anonymous',
            email: profile.email || 'No email',
          };
        } else {
          profileMap[senderId] = {
            name: 'Anonymous',
            email: 'No email',
          };
        }
      }

      setSenderProfiles(profileMap);
    } catch (error) {
      console.error('Error fetching inbox:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatOpen = (senderId) => {
    const senderProfile = senderProfiles[senderId] || {
      name: 'Anonymous',
      email: 'No email',
    };

    router.push({
      pathname: '/chat',
      params: {
        recipientId: senderId,
        recipientName: senderProfile.name,
      },
    });
  };

  const renderItem = ({ item }) => {
    const sender = senderProfiles[item.senderId] || {
      name: 'Anonymous',
      email: 'No email',
    };

    return (
      <TouchableOpacity
        style={styles.notificationCard}
        onPress={() => handleChatOpen(item.senderId)}
      >
        <Text style={styles.senderName}>{sender.name}</Text>
        <Text style={styles.senderEmail}>{sender.email}</Text>
        <Text numberOfLines={1} style={styles.messagePreview}>
          {item.message}
        </Text>
        <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#72d3fc" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading Inbox...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.$id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages in inbox.</Text>
          </View>
        }
      />
    </View>
  );
};

export default InboxScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#26314a', padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#26314a' },
  emptyContainer: { marginTop: 50, alignItems: 'center' },
  emptyText: { color: '#fff', fontSize: 16 },
  notificationCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 4,
  },
  senderName: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  senderEmail: { fontSize: 12, color: '#555' },
  messagePreview: { fontSize: 14, color: '#333', marginTop: 4 },
  timestamp: { fontSize: 10, color: '#777', marginTop: 2 },
});
