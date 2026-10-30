import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, List, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { themeColors, shadows } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { logoutAction } from '../../store/authSlice';
import { clearStoredToken } from '../../utils/tokenManager';
import { RootState } from '../../store';
import { RootStackParamList } from '../../navigation/types';
import { userApi } from '../../api/services/userApi';
import { authApi, performLogout } from '../../api/services/authApi';
import { User, UserProfileDTO } from '../../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const storeUser = useSelector((state: RootState) => state.auth.user);

  // Fetch Fresh User Profile Data (UserProfileDTO: fullName, mobileNumber, email)
  const { data: userProfile, isLoading } = useQuery<UserProfileDTO>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      try {
        const data = await userApi.getUserProfile();
        if (!data) return { fullName: storeUser?.fullName || 'Administrator', mobileNumber: storeUser?.mobileNumber || '', email: storeUser?.email || '' };
        return {
          fullName: data.fullName || storeUser?.fullName || 'Administrator',
          mobileNumber: (data as any).mobileNumber || (data as any).mobile || (data as any).phone || storeUser?.mobileNumber || '',
          email: data.email || (data as any).emailAddress || storeUser?.email || '',
        };
      } catch {
        return {
          fullName: storeUser?.fullName || 'Administrator',
          mobileNumber: storeUser?.mobileNumber || '',
          email: storeUser?.email || '',
        };
      }
    },
  });

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await performLogout(dispatch);
    } finally {
      setLogoutLoading(false);
      setLogoutVisible(false);
    }
  };

  const goToAdminLogin = async () => {
    await performLogout(dispatch);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' as any }],
    });
  };

  if (isLoading && !storeUser) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader title="My Profile" />
        <LoadingSpinner />
      </View>
    );
  }

  const activeProfile = userProfile || {
    fullName: storeUser?.fullName || 'Administrator',
    mobileNumber: storeUser?.mobileNumber || '',
    email: storeUser?.email || '',
  };

  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  return (
    <View style={styles.container}>
      <AppHeader title="My Profile" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="account" size={54} color="#FFFFFF" />
            </View>
            <Text variant="headlineSmall" style={styles.name}>
              {activeProfile.fullName}
            </Text>
            {isAdmin && !!activeProfile.email && (
              <Text variant="bodyMedium" style={styles.email}>
                {activeProfile.email}
              </Text>
            )}
            {isAdmin && !!activeProfile.mobileNumber && (
              <Text variant="bodyLarge" style={styles.mobile}>
                {activeProfile.mobileNumber}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Options List */}
        <Card style={styles.optionsCard}>
          <Card.Content style={{ padding: 0 }}>
            <List.Section style={{ marginVertical: 0 }}>
              {isAdmin ? (
                <>
                  <List.Item
                    title="Edit Profile"
                    description="Update name, mobile, and email settings"
                    left={(props) => <List.Icon {...props} icon="account-edit-outline" color={themeColors.secondary} />}
                    right={(props) => <List.Icon {...props} icon="chevron-right" />}
                    onPress={() => navigation.navigate('EditProfile')}
                    style={styles.listItem}
                  />
                  
                  <View style={styles.divider} />

                  <List.Item
                    title="Change Password"
                    description="Reset admin dashboard login password"
                    left={(props) => <List.Icon {...props} icon="lock-reset" color={themeColors.secondary} />}
                    right={(props) => <List.Icon {...props} icon="chevron-right" />}
                    onPress={() => navigation.navigate('ChangePassword')}
                    style={styles.listItem}
                  />

                  <View style={styles.divider} />

                  <List.Item
                    title="Invite New Admin"
                    description="Send invite to register a new administrator"
                    left={(props) => <List.Icon {...props} icon="account-plus-outline" color={themeColors.primary} />}
                    right={(props) => <List.Icon {...props} icon="chevron-right" />}
                    onPress={() => navigation.navigate('InviteAdmin')}
                    style={styles.listItem}
                  />

                  <View style={styles.divider} />

                  <List.Item
                    title="Manage Admins"
                    description="View and manage administrator accounts"
                    left={(props) => <List.Icon {...props} icon="account-group-outline" color={themeColors.secondary} />}
                    right={(props) => <List.Icon {...props} icon="chevron-right" />}
                    onPress={() => navigation.navigate('AdminList')}
                    style={styles.listItem}
                  />
                </>
              ) : (
                <List.Item
                  title="Go to Admin Login"
                  description="Log in to an Admin account to unlock management features"
                  left={(props) => <List.Icon {...props} icon="shield-account" color={themeColors.primary} />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={goToAdminLogin}
                  style={styles.listItem}
                />
              )}
            </List.Section>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          buttonColor={themeColors.error}
          onPress={() => setLogoutVisible(true)}
          style={styles.logoutBtn}
          icon="logout"
          contentStyle={{ height: 48 }}
        >
          LOGOUT
        </Button>
      </ScrollView>

      {/* Logout Confirmation */}
      <ConfirmationDialog
        visible={logoutVisible}
        title="Confirm Logout"
        message="Are you sure you want to log out from the Leuva Patel Samaj Admin Management System?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        icon="logout"
        onConfirm={handleLogout}
        onCancel={() => setLogoutVisible(false)}
        loading={logoutLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    ...shadows.soft,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: themeColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontWeight: 'bold',
    color: themeColors.text,
  },
  email: {
    color: themeColors.textMuted,
    marginTop: 2,
  },
  mobile: {
    color: themeColors.textMuted,
    marginTop: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  roleBadge: {
    backgroundColor: themeColors.saffronLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  roleText: {
    color: themeColors.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  optionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 24,
    ...shadows.soft,
  },
  listItem: {
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: themeColors.border,
  },
  logoutBtn: {
    borderRadius: 8,
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 16,
    paddingHorizontal: 24,
    minWidth: 160,
  },
});

export default ProfileScreen;
