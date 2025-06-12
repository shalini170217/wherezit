import { StyleSheet, Text, View, ImageBackground } from 'react-native';
import React from 'react';

export const options = {
  headerShown: false,  // 👈 hides the header in expo-router
};

const leaderboardScreen = () => {
  return (
    <ImageBackground
      source={require('../../assets/images/flappy.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Leaderboard</Text>
      </View>
    </ImageBackground>
  );
};

export default leaderboardScreen;

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
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
});
