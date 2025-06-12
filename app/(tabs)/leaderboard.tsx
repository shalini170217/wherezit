import { StyleSheet, Text, View, ImageBackground, FlatList, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { databases } from '@/lib/appwrite';
import { Query } from 'react-native-appwrite';

export const options = {
  headerShown: false,
};

const DATABASE_ID = '68478188000863f4f39f';
const SCORES_COLLECTION_ID = '684a45b5000b6e6c8f0a';

const medals = ['🥇', '🥈', '🥉'];

const LeaderboardScreen = () => {
  const [topScores, setTopScores] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTopScores();
  }, []);

  const fetchTopScores = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(DATABASE_ID, SCORES_COLLECTION_ID, [
        Query.orderDesc('score'),
        Query.limit(100), // Fetch more to ensure unique filtering works
      ]);

      // ✅ Filter to only keep highest score per userId
      const uniqueUsersMap = new Map();

      for (const doc of response.documents) {
        if (!uniqueUsersMap.has(doc.userId)) {
          uniqueUsersMap.set(doc.userId, doc); // First (highest) score for this userId
        }
      }

      const uniqueTopScores = Array.from(uniqueUsersMap.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 3); // ✅ Take top 3 users only

      setTopScores(uniqueTopScores);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <Text style={styles.medal}>{medals[index] || '🏅'}</Text>
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.matches}>Matches: {item.matches}</Text>
      </View>
      <Text style={styles.score}>{item.score} pts</Text>
    </View>
  );

  return (
    <ImageBackground
      source={require('../../assets/images/flappy.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        {loading ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <FlatList
            data={topScores}
            keyExtractor={(item) => item.$id}
            renderItem={renderItem}
            contentContainerStyle={{ marginTop: 20 }}
          />
        )}
      </View>
    </ImageBackground>
  );
};

export default LeaderboardScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#ffffffcc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    width: 320,
  },
  medal: {
    fontSize: 26,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  matches: {
    fontSize: 14,
    color: '#666',
  },
  score: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});
