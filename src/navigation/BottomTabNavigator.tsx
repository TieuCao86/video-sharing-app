import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

import { HomeScreen } from '../screens/home/HomeScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { NotificationScreen } from '../screens/notification';
import { useAuthStore } from '../store/useAuthStore';
import { LoginRequiredModal } from '../components/auth/LoginRequiredModal';

const Tab = createBottomTabNavigator();

const DummyScreen = ({ name }: { name: string }) => (
  <SafeAreaView
    style={{
      flex: 1,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Text style={{ color: '#fff', fontSize: 18 }}>{name} Screen</Text>
  </SafeAreaView>
);

const CreateVideoScreen = () => <DummyScreen name="Create Video" />;
const FriendsScreen = () => <DummyScreen name="Friends" />;

export const BottomTabNavigator = () => {
  const { isLoggedIn, showLoginModal } = useAuthStore();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#000000',
            borderTopWidth: 0.5,
            borderTopColor: '#222222',
            height: 52 + bottomInset,
            paddingBottom: bottomInset,
            paddingTop: 6,
          },
          tabBarActiveTintColor: '#FF2442',
          tabBarInactiveTintColor: '#888888',
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        {/* 1. Trang chủ (Home) */}
        <Tab.Screen
          name="HomeTab"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />

        {/* 2. Tìm kiếm (Search) */}
        <Tab.Screen
          name="SearchTab"
          component={SearchScreen}
          options={{
            tabBarLabel: 'Search',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search-outline" size={size} color={color} />
            ),
          }}
        />

        {/* 3. Nút đăng bài / quay video ở giữa (+) */}
        <Tab.Screen
          name="CreateTab"
          component={CreateVideoScreen}
          options={{
            tabBarLabel: () => null,
            tabBarIcon: () => (
              <View style={styles.createButtonContainer}>
                <Ionicons name="add" size={24} color="#000" />
              </View>
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              if (!isLoggedIn) {
                showLoginModal();
              } else {
                navigation.navigate('Camera');
              }
            },
          })}
        />

        {/* 4. Friends Tab (S20: auth-required feature) */}
        <Tab.Screen
          name="FriendsTab"
          component={FriendsScreen}
          options={{
            tabBarLabel: 'Friends',
            tabBarItemStyle: { display: 'none' },
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              if (!isLoggedIn) {
                e.preventDefault();
                showLoginModal();
              }
            },
          })}
        />

        {/* 4. THÔNG BÁO (Notifications) */}
        <Tab.Screen
          name="NotificationsTab"
          component={NotificationScreen}
          options={{
            tabBarLabel: 'Notification',
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="notifications-outline"
                size={size}
                color={color}
              />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              if (!isLoggedIn) {
                e.preventDefault();
                showLoginModal();
              }
            },
          })}
        />

        {/* 5. Trang cá nhân (My Profile) */}
        <Tab.Screen
          name="ProfileTab"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'My profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              if (!isLoggedIn) {
                e.preventDefault();
                showLoginModal();
              }
            },
          })}
        />
      </Tab.Navigator>

      <LoginRequiredModal />
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  createButtonContainer: {
    width: 42,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
});
