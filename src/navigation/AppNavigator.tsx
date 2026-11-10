import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { BottomTabNavigator } from './BottomTabNavigator';
import { ReelDetailScreen } from '../screens/reel/ReelDetailScreen';
import { CameraScreen } from '../screens/camera';
import { VideoListScreen } from '../screens/video-list';
import { AudioListScreen } from '../screens/audio/AudioListScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ChangePasswordScreen } from '../screens/settings/ChangePasswordScreen';
import { DraftsScreen } from '../screens/drafts/DraftsScreen';
import { authStore } from '../store/useAuthStore';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{ headerShown: false }}
      >
        {/* Main Tabs (S01 Home, S02 Search...) */}
        <Stack.Screen
          name="MainTabs"
          component={BottomTabNavigator}
        />

        {/* Login (S12) */}
        <Stack.Screen name="Login">
          {({ navigation }) => (
            <LoginScreen
              onLogin={() => {
                authStore.login();
                navigation.replace('MainTabs');
              }}
              onNavigateToRegister={() => navigation.navigate('SignUp')}
            />
          )}
        </Stack.Screen>

        {/* Alias for S12 */}
        <Stack.Screen name="S12">
          {({ navigation }) => (
            <LoginScreen
              onLogin={() => {
                authStore.login();
                navigation.replace('MainTabs');
              }}
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

        {/* S15 - Edit Profile */}
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="S15"
          component={EditProfileScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />

        {/* S16 - Settings */}
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="S16"
          component={SettingsScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />

        {/* S17 - Change Password */}
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="S17"
          component={ChangePasswordScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />

        {/* S21 - My Drafts */}
        <Stack.Screen
          name="Drafts"
          component={DraftsScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="S21"
          component={DraftsScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
