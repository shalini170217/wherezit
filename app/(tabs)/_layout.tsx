import { View, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '@/lib/auth-context'; // Your auth-context import

const TabsLayout = () => {
  const { signOut, user } = useAuth();

  const headerRightComponent = () => (
    <View className="flex-row items-center gap-4 pr-4">
      {/* Sign Out Button */}
      <TouchableOpacity onPress={signOut} accessibilityLabel="Sign Out">
        <MaterialIcons name="logout" size={24} color="white" />
      </TouchableOpacity>

      {/* User Profile Pic */}
      <TouchableOpacity onPress={() => { /* Optional: navigate to profile page */ }}>
        <Image
          source={{
            uri: user?.photo ?? 'https://i.pravatar.cc/300', // fallback avatar
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
          backgroundColor: 'black',
          borderTopWidth: 0,
          elevation: 0,
        },
        headerStyle: {
          backgroundColor: 'black',
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
              className={`mt-2 pt-[4px] px-12 py-2 ${
                focused ? 'bg-[#72d3fc]' : 'bg-transparent'
              } rounded-full`}
            >
              <MaterialIcons
                name="tag"
                size={size}
                color={focused ? 'black' : color}
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
              className={`mt-2 pt-[4px] px-12 py-2 ${
                focused ? 'bg-[#00affa]' : 'bg-transparent'
              } rounded-full`}
            >
              <MaterialIcons
                name="leaderboard"
                size={size}
                color={focused ? 'black' : color}
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
              className={`mt-2 pt-[4px] px-12 py-2 ${
                focused ? 'bg-[#72d3fc]' : 'bg-transparent'
              } rounded-full`}
            >
              <MaterialIcons
                name="search"
                size={size}
                color={focused ? 'black' : color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
