import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { databases } from '@/lib/appwrite';
import { Query } from 'react-native-appwrite';

const DATABASE_ID = '68478188000863f4f39f';
const CHATS_COLLECTION_ID = '6848f6f10000d8b57f09';
const PROFILE_COLLECTION_ID = '6847c4830011d384a4d9';
const NOTIFICATIONS_COLLECTION_ID = '684be54c003a6abfd26a';

const InboxScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [senderProfiles, setSenderProfiles] = useState({});
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user?.$id) {
      fetchInbox();
      fetchNotifications();
    }
  }, [user]);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        [Query.equal('receiverId', user.$id), Query.orderDesc('timestamp')]
      );

      setChats(response.documents);

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

  const fetchNotifications = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        [Query.equal('userId', user.$id), Query.orderDesc('timestamp')]
      );
      setNotifications(response.documents);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleChatOpen = (senderId) => {
    const senderProfile = senderProfiles[senderId] || { name: 'Anonymous', email: 'No email' };
    router.push({
      pathname: '/chat',
      params: {
        recipientId: senderId,
        recipientName: senderProfile.name,
      },
    });
  };

  const handleDeleteNotification = (notificationId) => {
    Alert.alert('Delete Notification', 'Are you sure you want to remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await databases.deleteDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, notificationId);
            setNotifications(prev => prev.filter(n => n.$id !== notificationId));
          } catch (error) {
            console.error('Error deleting notification:', error);
            Alert.alert('Error', 'Failed to delete notification.');
          }
        },
      },
    ]);
  };

  const renderChatItem = ({ item }) => {
    const sender = senderProfiles[item.senderId] || { name: 'Anonymous', email: 'No email' };

    return (
      <View style={styles.notificationCard}>
        <TouchableOpacity
          onPress={() => handleChatOpen(item.senderId)}
          style={{ flex: 1, marginRight: 8 }}
        >
          <Text style={styles.senderName}>{sender.name}</Text>
          <Text style={styles.senderEmail}>{sender.email}</Text>
          <Text style={styles.messagePreview}>
            You have a new message from {sender.name}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDeleteNotification(item.$id)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash" size={20} color="#ff4d4d" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderNotificationItem = ({ item }) => (
    <View style={styles.notificationCard}>
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={styles.notificationType}>{item.matchType || 'Notification'}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => handleDeleteNotification(item.$id)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash" size={20} color="#ff4d4d" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground
      source={require('@/assets/images/road.jpg')}
      resizeMode="cover"
      style={styles.bg}
    >
      <SafeAreaView style={styles.container}>
        {/* ✅ Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Inbox</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#72d3fc" />
            <Text style={{ color: '#fff', marginTop: 10 }}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.$id}
            renderItem={renderChatItem}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No chats in inbox.</Text>
              </View>
            }
          />
        )}

        {/* 🔔 Notifications Section */}
        <View style={styles.notificationsHeader}>
          <Text style={styles.notificationsHeaderText}>Notifications</Text>
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.$id}
          renderItem={renderNotificationItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No notifications found.</Text>
            </View>
          }
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

export default InboxScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationsHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  notificationsHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
  },
  notificationCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  senderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  senderEmail: {
    fontSize: 12,
    color: '#555',
  },
  messagePreview: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  notificationType: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#777',
    marginTop: 4,
  },
  deleteButton: {
    padding: 4,
  },
});
