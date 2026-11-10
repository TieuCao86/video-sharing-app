import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { OTPScreen } from '../screens/auth/OTPScreen';
import { BottomTabNavigator } from './BottomTabNavigator';
import { ReelDetailScreen } from '../screens/reel/ReelDetailScreen';
import { CameraScreen } from '../screens/camera';
import { VideoListScreen } from '../screens/video-list';
import { AudioListScreen } from '../screens/audio/AudioListScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ChangePasswordScreen } from '../screens/settings/ChangePasswordScreen';
import { DraftsScreen } from '../screens/drafts/DraftsScreen';
import { DraftViewerScreen } from '../screens/drafts/DraftViewerScreen';
import { useAuthStore } from '../store/useAuthStore';
import { checkSession } from '../services/authService';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  // Khôi phục session khi khởi động app
  useEffect(() => {
    checkSession();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{ headerShown: false }}
      >
        {/* Main Tabs (S01 Home, S02 Search, Notifications, Profile) */}
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />

        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="S14" component={OTPScreen} />

        {/* Video Player */}
        <Stack.Screen name="ReelDetail" component={ReelDetailScreen} />

        {/* Video List & Topics */}
        <Stack.Screen
          name="VideoList"
          component={VideoListScreen}
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />

        {/* Audio List */}
        <Stack.Screen
          name="AudioList"
          component={AudioListScreen}
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />

        {/* Camera / Record Video */}
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />

        {/* S15 - Edit Profile */}
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="S15"
          component={EditProfileScreen}
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />

        {/* S16 - Settings */}
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="S16"
          component={SettingsScreen}
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />

        {/* S17 - Change Password */}
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="S17"
          component={ChangePasswordScreen}
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />

        {/* S21 - My Drafts */}
        <Stack.Screen
          name="Drafts"
          component={DraftsScreen}
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="S21"
          component={DraftsScreen}
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />

        {/* Draft Viewer (TikTok-style full screen) */}
        <Stack.Screen
          name="DraftViewer"
          component={DraftViewerScreen}
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
