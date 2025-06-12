import { View, TouchableOpacity, Image, Text } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '@/lib/auth-context';

const TabsLayout = () => {
  const { signOut, user } = useAuth();

  const headerRightComponent = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 12 }}>
      <TouchableOpacity
        onPress={signOut}
        style={{ backgroundColor: '#72d3fc', borderRadius: 50, paddingHorizontal: 16, paddingVertical: 6 }}
      >
        <Text style={{ color: 'black', fontWeight: 'bold' }}>Sign Out</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => {}}>
        <Image
          source={{ uri: user?.photo ?? 'https://i.pravatar.cc/300' }}
          style={{ width: 32, height: 32, borderRadius: 16 }}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: '#1c2330',
          height: 70,
        },
        headerStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
        },
        headerTitle: '',
        headerRight: headerRightComponent,
      }}
    >
      <Tabs.Screen
        name="found"
        options={{
          headerShown: true, // or false if you don’t want header here
          tabBarIcon: ({ focused, size }) => (
            <View
              style={{
                marginTop: 8,
                paddingHorizontal: 24,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: focused ? '#00affa' : 'transparent',
              }}
            >
              <MaterialIcons
                name="tag"
                size={size}
                color={focused ? 'black' : '#aaa'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          headerShown: false, // 👈 if you want NO header for leaderboard screen
          tabBarIcon: ({ focused, size }) => (
            <View
              style={{
                marginTop: 8,
                paddingHorizontal: 24,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: focused ? '#00affa' : 'transparent',
              }}
            >
              <MaterialIcons
                name="leaderboard"
                size={size}
                color={focused ? 'black' : '#aaa'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="lost"
        options={{
          headerShown: true,
          tabBarIcon: ({ focused, size }) => (
            <View
              style={{
                marginTop: 8,
                paddingHorizontal: 24,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: focused ? '#00affa' : 'transparent',
              }}
            >
              <MaterialIcons
                name="search"
                size={size}
                color={focused ? 'black' : '#aaa'}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
