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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { databases, ID } from '@/lib/appwrite';
import { useAuth } from '@/lib/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { Query } from 'react-native-appwrite';

const DATABASE_ID = '68478188000863f4f39f';
const CHATS_COLLECTION_ID = '6848f6f10000d8b57f09';

const ChatScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { recipientId, recipientName } = params;
  const { user } = useAuth();
  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

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
              Query.equal('receiverId', recipientId)
            ]),
            Query.and([
              Query.equal('senderId', recipientId),
              Query.equal('receiverId', user.$id)
            ]),
          ]),
          Query.orderAsc('timestamp'),
        ]
      );
      
      setMessages(response.documents);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
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
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [recipientId]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ImageBackground
        source={require('@/assets/images/chatbg.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        {/* Header with avatar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Image
            source={{ uri: `https://ui-avatars.com/api/?name=${recipientName}&background=4e9ef7&color=fff&size=128` }}
            style={styles.avatarSmall}
          />

          <Text style={styles.headerText}>{recipientName}</Text>
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
            renderItem={({ item }) => {
              const isSent = item.senderId === user?.$id;
              return (
                <View style={[styles.messageRow, isSent ? styles.sentRow : styles.receivedRow]}>
                  {!isSent && (
                    <Image
                      source={{ uri: `https://ui-avatars.com/api/?name=${recipientName}&background=3a4a5c&color=fff&size=64` }}
                      style={styles.avatar}
                    />
                  )}

                  <View style={[styles.message, isSent ? styles.sent : styles.received]}>
                    <Text style={styles.messageText}>{item.message}</Text>
                    <Text style={styles.time}>
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            }}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>No messages yet</Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={input}
            onChangeText={setInput}
            editable={!sending}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(29, 47, 71, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 10,
    backgroundColor: '#ccc',
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    padding: 15,
    paddingBottom: 70,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
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
    maxWidth: '80%',
    borderRadius: 15,
    padding: 12,
  },
  sent: {
    alignSelf: 'flex-end',
    backgroundColor: '#4e9ef7',
    borderBottomRightRadius: 2,
  },
  received: {
    alignSelf: 'flex-start',
    backgroundColor: '#3a4a5c',
    borderBottomLeftRadius: 2,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  time: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'rgba(29, 47, 71, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#333',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#000',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#4e9ef7',
    width: 42,
    height: 42,
    borderRadius: 21,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
  },
});

export default ChatScreen;
