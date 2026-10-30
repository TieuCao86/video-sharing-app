import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

// Import các màn hình tương ứng (bạn có thể tạo các file màn hình tạm thời nếu chưa có)
import { HomeScreen } from '../screens/home/HomeScreen';
// Các màn hình khác bạn sẽ trỏ tới file tương ứng của mình:
// import { SearchScreen } from '../screens/search/SearchScreen';
// import { CreateVideoScreen } from '../screens/create-video/CreateVideoScreen';
// import { FriendsScreen } from '../screens/friends/FriendsScreen';
// import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

// Màn hình tạm cho các tab chưa code chi tiết
import { Text, SafeAreaView } from 'react-native';
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
        tabBarActiveTintColor: '#FF2442', // Màu hồng chủ đạo khi được chọn
        tabBarInactiveTintColor: '#888888', // Màu xám khi không chọn
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
        component={() => <DummyScreen name="Search" />}
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
          tabBarLabel: () => null, // Không hiển thị chữ cho nút giữa
          tabBarIcon: () => (
            <View style={styles.createButtonContainer}>
              <Ionicons name="add" size={24} color="#000" />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // Xử lý chuyển hướng sang màn hình quay video/mở modal quay phim tại đây[cite: 8]
            console.log('Open Create Video Modal');
          },
        })}
      />

      {/* 4. Bạn bè (Friends) */}
      <Tab.Screen
        name="FriendsTab"
        component={() => <DummyScreen name="Friends" />}
        options={{
          tabBarLabel: 'Friends',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 5. Trang cá nhân (My Profile)[cite: 12] */}
      <Tab.Screen
        name="ProfileTab"
        component={() => <DummyScreen name="My Profile" />}
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