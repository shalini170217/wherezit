import { View, TouchableOpacity, Image, Text } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '@/lib/auth-context';

const TabsLayout = () => {
  const { signOut, user } = useAuth();

  const headerRightComponent = () => (
    <View className="flex-row items-center gap-4 pr-4">
      {/* Sign Out Button */}
      <TouchableOpacity
        onPress={signOut}
        accessibilityLabel="Sign Out"
        className="bg-[#72d3fc] rounded-full px-6 py-2"
      >
        <Text className="text-black font-semibold">Sign Out</Text>
      </TouchableOpacity>

      {/* User Profile Pic */}
      <TouchableOpacity onPress={() => {}}>
        <Image
          source={{
            uri: user?.photo ?? 'https://i.pravatar.cc/300',
          }}
          className="w-8 h-8 rounded-full"
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
        },
        headerStyle: {
          backgroundColor: 'transparent',
          shadowColor: 'transparent',
          shadowOpacity: 0,
          elevation: 0,
          borderBottomWidth: 0,
        },
        headerTitle: '',
        headerRight: headerRightComponent,
      }}
    >
      <Tabs.Screen
        name="found"
        options={{
          headerShown: true,
          tabBarIcon: ({ focused, color, size }) => (
            <View
              className={`mt-2 pt-1 px-12 py-2 rounded-full ${
                focused ? 'bg-[#00affa]' : 'bg-transparent'
              }`}
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
          headerShown: true,
          tabBarIcon: ({ focused, color, size }) => (
            <View
              className={`mt-2 pt-1 px-12 py-2 rounded-full ${
                focused ? 'bg-[#00affa]' : 'bg-transparent'
              }`}
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
          tabBarIcon: ({ focused, color, size }) => (
            <View
              className={`mt-2 pt-1 px-12 py-2 rounded-full ${
                focused ? 'bg-[#00affa]' : 'bg-transparent'
              }`}
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