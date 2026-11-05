# 8ThreadsTV - Video Sharing App

Ứng dụng chia sẻ video ngắn được xây dựng bằng React Native Expo.

## 🎬 Màn hình đã hoàn thành

### ✅ Camera Screen (S05)
- Quay video trực tiếp từ camera
- Lật camera trước/sau
- Bật/tắt flash
- Timer hiển thị thời gian quay
- Chọn video từ thư viện
- Thời lượng tối đa: 3 phút

![Camera Interface](https://via.placeholder.com/300x600?text=Camera+Screen)

## 🚀 Cách chạy project

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Chạy development server
```bash
npm start
```

### 3. Mở trên thiết bị
- **Android**: Nhấn `a` hoặc scan QR code bằng Expo Go
- **iOS**: Nhấn `i` hoặc scan QR code bằng Expo Go
- **Web**: Nhấn `w` (một số tính năng camera không hoạt động trên web)

## 📱 Test Camera Screen

1. Mở app
2. Nhấn nút **"+"** ở giữa bottom navigation
3. Cho phép quyền Camera và Microphone
4. Test các tính năng:
   - ✅ Quay video (nhấn nút đỏ)
   - ✅ Lật camera (nút Flip)
   - ✅ Bật flash (nút Flash)
   - ✅ Upload video (nút Upload)
   - ✅ Đóng màn hình (nút X)

## 🛠️ Tech Stack

- **Frontend**: React Native 0.88.1
- **Framework**: Expo ~58.0
- **Navigation**: React Navigation 7
- **Camera**: expo-camera
- **Media**: expo-media-library, expo-av
- **Language**: TypeScript

## 📦 Main Dependencies

```json
{
  "expo": "~58.0.21",
  "react-native": "0.88.1",
  "expo-camera": "latest",
  "expo-media-library": "latest",
  "expo-av": "latest",
  "expo-image-picker": "latest",
  "@react-navigation/native": "^7.5.1",
  "@react-navigation/bottom-tabs": "^7.21.0",
  "@react-navigation/native-stack": "^7.21.0"
}
```

## 📂 Project Structure

```
src/
├── screens/
│   ├── camera/
│   │   ├── CameraScreen.tsx    # Màn hình quay video
│   │   └── index.ts
│   ├── home/
│   ├── profile/
│   ├── reel/
│   └── search/
├── navigation/
│   ├── AppNavigator.tsx        # Root navigator
│   └── BottomTabNavigator.tsx  # Bottom tabs
├── components/
│   └── RecordingTimer.tsx      # Timer component
└── types/
    └── navigation.ts           # TypeScript types
```

## 🎯 Next Features

- [ ] Add Filter Screen (S06) - Bộ lọc màu
- [ ] Add Audio Screen (S07) - Chọn nhạc nền
- [ ] Post Video Screen (S08) - Đăng video
- [ ] Video Player - Phát video toàn màn hình
- [ ] Authentication - Đăng ký/Đăng nhập

## 📝 Notes

- Camera chỉ hoạt động trên thiết bị thật hoặc emulator có camera
- iOS Simulator không có camera thật, có thể gặp lỗi
- Android Emulator cần enable camera trong AVD settings

## 🐛 Known Issues

- Không có issues hiện tại

## 📄 License

MIT
