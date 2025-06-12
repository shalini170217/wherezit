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

  const getTabIcon = (name) => ({ focused }) => (
    <View
      style={{
        marginTop: 8,
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: focused ? '#00affa' : 'rgba(0,175,250,0.2)',
      }}
    >
      <MaterialIcons
        name={name}
        size={22}
        color={focused ? 'black' : '#aaa'}
      />
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
          height: 80,
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
          headerShown: true,
          tabBarIcon: getTabIcon('tag'),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          headerShown: false,
          tabBarIcon: getTabIcon('leaderboard'),
        }}
      />
      <Tabs.Screen
        name="lost"
        options={{
          headerShown: true,
          tabBarIcon: getTabIcon('search'),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
