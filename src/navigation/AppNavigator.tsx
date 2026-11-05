import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BottomTabNavigator } from './BottomTabNavigator';
import { ReelDetailScreen } from '../screens/reel/ReelDetailScreen';
import { CameraScreen } from '../screens/camera';
import { VideoListScreen } from '../screens/video-list';
import { AudioListScreen } from '../screens/audio/AudioListScreen';

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

        <Stack.Screen
          name="VideoList"
          component={VideoListScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />

        <Stack.Screen
          name="AudioList"
          component={AudioListScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />

        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};