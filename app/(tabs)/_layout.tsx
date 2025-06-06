import { View } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const TabsLayout = () => {
  return (
    <Tabs 
   screenOptions={{
    tabBarShowLabel: false,
    tabBarStyle: {
      backgroundColor: 'black', // 🔵 Change this to your desired color
      borderTopWidth: 0, // Optional: removes the top border
      elevation: 0,      // Optional: removes shadow on Android
    },
  }}
    >
      <Tabs.Screen
        name="found"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <View
              className={`mt-2 pt-[4px] px-12 py-2 ${focused ? 'bg-[#72d3fc]' : 'bg-transparent'} rounded-full`}
            >
              <MaterialIcons
                name="tag"
                size={size}
                color={focused ? "black" : color} // ✅ black icon on focus
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen 
        name="leaderboard"
        options={{ headerShown: false,tabBarIcon: ({ focused, color, size }) => (
            <View
              className={`mt-2 pt-[4px] px-12 py-2 ${focused ? 'bg-[#00affa]' : 'bg-transparent'} rounded-full`}
            >
              <MaterialIcons
                name="leaderboard"
                size={size}
                color={focused ? "black" : color} // ✅ black icon on focus
              />
            </View>
          ), }}
      />

      <Tabs.Screen 
        name="lost"
        options={{ headerShown: false ,tabBarIcon: ({ focused, color, size }) => (
            <View
              className={`mt-2 pt-[4px] px-12 py-2 ${focused ? 'bg-[#72d3fc]' : 'bg-transparent'} rounded-full`}
            >
              <MaterialIcons
                name="search"
                size={size}
                color={focused ? "black" : color} // ✅ black icon on focus
              />
            </View>
          ),}}
      />
    </Tabs>
  );
};

export default TabsLayout;
