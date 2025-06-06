import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'

const tabsLayout = () => {
  return (
    <Tabs>
        <Tabs.Screen 
        name='found'
        options={{
            headerShown:false,
        }}
        />
        <Tabs.Screen 
        name='leaderboard'
        options={{
            headerShown:false,
        }}
        />
        <Tabs.Screen 
        name='lost'
        options={{
            headerShown:false,
        }}
        />
    </Tabs>
  )
}

export default tabsLayout