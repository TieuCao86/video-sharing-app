import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BottomTabNavigator } from './BottomTabNavigator';
import { ReelDetailScreen } from '../screens/reel/ReelDetailScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="MainTabs"
          component={BottomTabNavigator}
        />

        <Stack.Screen
          name="ReelDetail"
          component={ReelDetailScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};