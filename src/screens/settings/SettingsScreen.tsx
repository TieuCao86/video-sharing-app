import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { CustomButton } from '../../components/buttons/CustomButton';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleLogoutPress = () => {
    // Show custom modal dialog (works across Web, iOS, Android, and testing environments)
    setShowLogoutConfirm(true);

    // Also trigger native Alert for platforms that expect Alert.alert
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setShowLogoutConfirm(false),
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: handleConfirmLogout,
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* List of 3 Settings Items */}
      <View style={styles.listContainer}>
        {/* Item 1: My Drafts -> S21 */}
        <TouchableOpacity
          style={styles.itemRow}
          onPress={() => navigation.navigate('Drafts')}
          activeOpacity={0.7}
        >
          <View style={styles.itemLeft}>
            <View style={styles.iconWrapper}>
              <Ionicons
                name="document-text-outline"
                size={22}
                color={colors.text}
              />
            </View>
            <Text style={styles.itemTitle}>My Drafts</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Item 2: Change Password -> S17 */}
        <TouchableOpacity
          style={styles.itemRow}
          onPress={() => navigation.navigate('ChangePassword')}
          activeOpacity={0.7}
        >
          <View style={styles.itemLeft}>
            <View style={styles.iconWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={colors.text}
              />
            </View>
            <Text style={styles.itemTitle}>Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Item 3: Log Out -> Confirmation dialog per FR04 */}
        <TouchableOpacity
          style={[styles.itemRow, styles.lastItemRow]}
          onPress={handleLogoutPress}
          activeOpacity={0.7}
        >
          <View style={styles.itemLeft}>
            <View style={[styles.iconWrapper, styles.logoutIconWrapper]}>
              <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
            </View>
            <Text style={[styles.itemTitle, styles.logoutText]}>Log Out</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* Logout Confirmation Dialog Modal (FR04) */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowLogoutConfirm(false)}>
          <View style={styles.dialogOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dialogCard}>
                <View style={styles.dialogIconCircle}>
                  <Ionicons name="log-out" size={32} color="#FF3B30" />
                </View>
                <Text style={styles.dialogTitle}>Log Out</Text>
                <Text style={styles.dialogMessage}>
                  Are you sure you want to log out?
                </Text>
                <View style={styles.dialogButtonRow}>
                  <CustomButton
                    title="Cancel"
                    variant="muted-outline"
                    onPress={() => setShowLogoutConfirm(false)}
                    style={styles.dialogCancelButton}
                    textStyle={styles.dialogCancelText}
                  />
                  <CustomButton
                    title="Log Out"
                    variant="danger"
                    onPress={handleConfirmLogout}
                    style={styles.dialogConfirmButton}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  lastItemRow: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  logoutIconWrapper: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  itemTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  dialogIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  dialogButtonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  dialogCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    backgroundColor: 'transparent',
  },
  dialogCancelText: {
    color: '#666666',
    fontWeight: '600',
  },
  dialogConfirmButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
  },
});

