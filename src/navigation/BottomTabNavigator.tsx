import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Text, SafeAreaView } from 'react-native';

import { HomeScreen } from '../screens/home/HomeScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { NotificationScreen } from '../screens/notification';

const Tab = createBottomTabNavigator();

const DummyScreen = ({ name }: { name: string }) => (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: '#fff', fontSize: 18 }}>{name} Screen</Text>
  </SafeAreaView>
);

export const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
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
        component={() => <DummyScreen name="Create Video" />}
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
            // Navigate to Camera screen
            navigation.navigate('Camera');
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
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
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
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000',
    borderTopWidth: 0.5,
    borderTopColor: '#222222',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
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
    marginTop: 4,
  },
});
