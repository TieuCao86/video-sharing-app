# Màn hình Camera (S05) - Hướng dẫn sử dụng

## ✅ Đã hoàn thành

Màn hình Camera để quay video đã được implement đầy đủ theo thiết kế giao diện.

### Tính năng chính:

1. **Camera View toàn màn hình**
   - Tự động request quyền Camera, Microphone, Media Library
   - Hiển thị thông báo nếu chưa có quyền

2. **Top Bar (Thanh trên)**
   - ❌ Nút Close: Đóng màn hình camera và quay về trang chủ
   - 🎵 Nút "Add audio": Chọn nhạc nền cho video
   - ⏱️ Recording Timer: Hiển thị thời gian đang quay (chỉ hiện khi đang quay)

3. **Right Menu (Menu bên phải)**
   - 🔄 **Flip**: Lật camera trước/sau
   - 🎨 **Filter**: Áp dụng bộ lọc màu (sẽ implement sau)
   - ⏲️ **Timer**: Hẹn giờ quay video
   - ⚡ **Flash**: Bật/tắt đèn flash

4. **Bottom Controls (Điều khiển dưới)**
   - 😊 **Effect**: Hiệu ứng (bên trái)
   - 🔴 **Record Button**: Nút quay chính giữa
     - Nhấn để bắt đầu quay
     - Nhấn lại để dừng
     - Tự động chuyển hình từ tròn → vuông khi đang quay
   - 📁 **Upload**: Chọn video từ thư viện

### Giới hạn kỹ thuật:
- ⏱️ Thời lượng video tối đa: **180 giây (3 phút)**
- 📦 Dung lượng tối đa: **100 MB** (theo spec)
- 📹 Định dạng hỗ trợ: MP4, MOV

### File đã tạo:
```
src/
├── screens/
│   └── camera/
│       ├── CameraScreen.tsx       # Màn hình chính
│       └── index.ts               # Export
├── components/
│   └── RecordingTimer.tsx         # Component timer khi quay
└── types/
    └── navigation.ts              # TypeScript types
```

### Cách test:

1. **Chạy app:**
   ```bash
   npm start
   # hoặc
   npx expo start
   ```

2. **Mở trên thiết bị:**
   - Scan QR code bằng Expo Go app
   - Hoặc nhấn `a` cho Android / `i` cho iOS

3. **Test Camera:**
   - Nhấn nút **"+"** ở giữa bottom navigation
   - Màn hình Camera sẽ mở ra
   - Cho phép quyền Camera khi được hỏi
   - Test các nút: Flip, Flash, Record, Upload

### Next Steps:

Các màn hình tiếp theo cần implement:
- [ ] **S06**: Add Filter - Áp dụng bộ lọc màu
- [ ] **S07**: Add Audio - Chọn nhạc nền
- [ ] **S08**: Post Video - Đăng video với metadata

---

**Note:** Dev server đang chạy tại http://localhost:8081
