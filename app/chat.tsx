import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ImageBackground,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { databases, ID } from '@/lib/appwrite';
import { useAuth } from '@/lib/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { Query } from 'react-native-appwrite';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const DATABASE_ID = '68478188000863f4f39f';
const CHATS_COLLECTION_ID = '6848f6f10000d8b57f09';

const ChatScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { recipientId, recipientName } = params;
  const { user } = useAuth();
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMessages = async () => {
    if (!user?.$id || !recipientId) return;

    setLoading(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        [
          Query.or([
            Query.and([
              Query.equal('senderId', user.$id),
              Query.equal('receiverId', recipientId),
            ]),
            Query.and([
              Query.equal('senderId', recipientId),
              Query.equal('receiverId', user.$id),
            ]),
          ]),
          Query.orderAsc('timestamp'),
        ]
      );
      setMessages(response.documents);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      Alert.alert('Error', 'Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !user?.$id || !recipientId) return;

    setSending(true);
    try {
      await databases.createDocument(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        ID.unique(),
        {
          senderId: user.$id,
          receiverId: recipientId,
          message: input.trim(),
          timestamp: new Date().toISOString(),
        }
      );
      setInput('');
      await fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const canDeleteMessage = (message) => {
    const isSender = message.senderId === user?.$id;
    const messageTime = new Date(message.timestamp);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return isSender && messageTime > fiveMinutesAgo;
  };

  const deleteMessage = async (messageId) => {
    setDeleting(true);
    try {
      await databases.deleteDocument(DATABASE_ID, CHATS_COLLECTION_ID, messageId);
      await fetchMessages();
    } catch (error) {
      console.error('Failed to delete message:', error);
      Alert.alert('Error', 'Failed to delete message. Please try again.');
    } finally {
      setDeleting(false);
      setSelectedMessageId(null);
    }
  };

  const confirmDelete = (message) => {
    if (!canDeleteMessage(message)) {
      Alert.alert(
        'Cannot Delete',
        'You can only delete your own messages within 5 minutes of sending.'
      );
      return;
    }

    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMessage(message.$id),
        },
      ]
    );
  };

  useEffect(() => {
    fetchMessages();
  }, [recipientId]);

  const renderMessage = ({ item }) => {
    const isSent = item.senderId === user?.$id;
    const showDelete = selectedMessageId === item.$id && isSent;

    return (
      <TouchableOpacity
        onLongPress={() => setSelectedMessageId(item.$id)}
        activeOpacity={0.8}
        style={[styles.messageRow, isSent ? styles.sentRow : styles.receivedRow]}
      >
        {!isSent && (
          <Image
            source={{
              uri: `https://ui-avatars.com/api/?name=${recipientName}&background=3a4a5c&color=fff&size=64`,
            }}
            style={styles.avatar}
          />
        )}
        <View style={[styles.message, isSent ? styles.sent : styles.received]}>
          <Text style={styles.messageText}>{item.message}</Text>
          <View style={styles.messageFooter}>
            <Text style={styles.time}>
              {new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {isSent && (
              <Ionicons
                name={item.$id === selectedMessageId ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.$id === selectedMessageId ? '#4e9ef7' : 'rgba(255,255,255,0.5)'}
                style={styles.readReceipt}
              />
            )}
          </View>
        </View>
        {showDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => confirmDelete(item)}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="trash" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ImageBackground
          source={require('@/assets/images/chatbg.jpg')}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.overlay} />

          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Image
              source={{
                uri: `https://ui-avatars.com/api/?name=${recipientName}&background=4e9ef7&color=fff&size=128`,
              }}
              style={styles.avatarSmall}
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerName}>{recipientName}</Text>
              <Text style={styles.headerStatus}>Online</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#72d3fc" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.$id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesContainer}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.emptyText}>No messages yet</Text>
                  <Text style={styles.emptySubText}>Start the conversation!</Text>
                </View>
              }
            />
          )}

          <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              value={input}
              onChangeText={setInput}
              editable={!sending}
              multiline
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || sending) && styles.disabledButton]}
              onPress={sendMessage}
              disabled={!input.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
    backgroundColor: 'rgba(29, 47, 71, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 10,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  headerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerStatus: {
    color: '#72d3fc',
    fontSize: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sentRow: {
    justifyContent: 'flex-end',
  },
  receivedRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: '#ccc',
  },
  message: {
    maxWidth: '75%',
    borderRadius: 18,
    padding: 12,
  },
  sent: {
    backgroundColor: '#4e9ef7',
    borderBottomRightRadius: 4,
  },
  received: {
    backgroundColor: '#3a4a5c',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  time: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginRight: 4,
  },
  readReceipt: {
    marginLeft: 2,
  },
  deleteButton: {
    marginLeft: 8,
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(29, 47, 71, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#333',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#000',
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#4e9ef7',
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  emptySubText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
});

export default ChatScreen;
