
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { BottomTabNavigator } from './BottomTabNavigator';
import { ReelDetailScreen } from '../screens/reel/ReelDetailScreen';
import { CameraScreen } from '../screens/camera';
import { VideoListScreen } from '../screens/video-list';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        {/* Login */}
        <Stack.Screen name="Login">
          {({ navigation }) => (
            <LoginScreen
              onLogin={() => navigation.replace('MainTabs')}
              onNavigateToRegister={() => navigation.navigate('SignUp')}
            />
          )}
        </Stack.Screen>

        {/* Sign Up */}
        <Stack.Screen name="SignUp">
          {({ navigation }) => (
            <SignUpScreen
              onSignUp={() => navigation.replace('Login')}
              onNavigateToLogin={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>

        {/* Main */}
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
