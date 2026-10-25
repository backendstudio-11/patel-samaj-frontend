import React, { useEffect} from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, HelperText, Button } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';

import { themeColors } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RootState } from '../../store';
import { updateProfile } from '../../store/authSlice';
import apiClient from '../../api/client';
import { User, UserProfileDTO } from '../../types';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const storeUser = useSelector((state: RootState) => state.auth.user);

  // Fetch current user profile (UserProfileDTO)
  const { data: profile } = useQuery<UserProfileDTO>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/user');
        const data = res.data;
        if (!data) return { fullName: storeUser?.fullName || '', mobileNumber: storeUser?.mobileNumber || '', email: storeUser?.email || '' };
        return {
          fullName: data.fullName || storeUser?.fullName || '',
          mobileNumber: data.mobileNumber || data.mobile || data.phone || storeUser?.mobileNumber || '',
          email: data.email || data.emailAddress || storeUser?.email || '',
        };
      } catch {
        return {
          fullName: storeUser?.fullName || '',
          mobileNumber: storeUser?.mobileNumber || '',
          email: storeUser?.email || '',
        };
      }
    },
  });

  const activeProfile = profile || {
    fullName: storeUser?.fullName || '',
    mobileNumber: storeUser?.mobileNumber || '',
    email: storeUser?.email || '',
  };

  const { control, handleSubmit, reset, formState: { errors } } = useForm<UserProfileDTO>({
    defaultValues: {
      fullName: activeProfile.fullName,
      email: activeProfile.email || '',
      mobileNumber: activeProfile.mobileNumber,
    },
  });

  useEffect(() => {
    if (activeProfile) {
      reset({
        fullName: activeProfile.fullName,
        email: activeProfile.email || '',
        mobileNumber: activeProfile.mobileNumber,
      });
    }
  }, [profile, storeUser]);

  const updateProfileMutation = useMutation({
    mutationFn: async (formData: UserProfileDTO) => {
      // UserProfileDTO exact structure
      const payload: UserProfileDTO = {
        fullName: formData.fullName,
        mobileNumber: formData.mobileNumber,
        email: formData.email || '',
      };
      
      let resData: any;
      try {
        resData = (await apiClient.put('/user/profile', payload)).data;
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.response?.status === 405) {
          try {
            resData = (await apiClient.post('/profile', payload)).data;
          } catch {
            resData = (await apiClient.put('/user/profile', payload)).data;
          }
        } else {
          throw err;
        }
      }

      const updatedUser: User = {
        userId: Number(resData?.userId || resData?.id || storeUser?.userId || 1),
        fullName: resData?.fullName || resData?.name || formData.fullName,
        email: resData?.email !== undefined ? resData.email : formData.email,
        mobileNumber: resData?.mobileNumber || resData?.mobile || formData.mobileNumber,
        isActive: resData?.isActive !== undefined ? resData.isActive : true,
      };
      return updatedUser;
    },
    onSuccess: (updatedUser: User) => {
      dispatch(updateProfile(updatedUser));
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      navigation.goBack();
    },
  });

  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  const onSubmit = (formData: UserProfileDTO) => {
    if (!isAdmin) {
      alert('Only Admin users can edit profile information.');
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Edit Profile" showBack={true} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            <Controller
              control={control}
              name="fullName"
              rules={{ required: 'Full name cannot be empty' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Full Name"
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    error={!!errors.fullName}
                    style={styles.input}
                    left={<TextInput.Icon icon="account" />}
                  />
                  {errors.fullName && (
                    <HelperText type="error" visible={true}>
                      {errors.fullName.message}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="email"
              rules={{
                pattern: { value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, message: 'Please provide a valid email address' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Email Address"
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    error={!!errors.email}
                    style={styles.input}
                    left={<TextInput.Icon icon="email" />}
                  />
                  {errors.email && (
                    <HelperText type="error" visible={true}>
                      {errors.email.message}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="mobileNumber"
              rules={{
                required: 'Mobile number is required',
                pattern: { value: /^[0-9]{10}$/, message: 'Mobile number must be exactly 10 digits' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Mobile Number"
                    mode="outlined"
                    keyboardType="numeric"
                    maxLength={10}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    error={!!errors.mobileNumber}
                    style={styles.input}
                    left={<TextInput.Icon icon="phone" />}
                  />
                  {errors.mobileNumber && (
                    <HelperText type="error" visible={true}>
                      {errors.mobileNumber.message}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                textColor={themeColors.textMuted}
                style={{ borderRadius: 8, height: 48, justifyContent: 'center', borderColor: themeColors.border, paddingHorizontal: 16, minWidth: 120 }}
                disabled={updateProfileMutation.isPending}
              >
                CANCEL
              </Button>
              <PrimaryButton
                onPress={handleSubmit(onSubmit)}
                loading={updateProfileMutation.isPending}
                style={{ marginVertical: 0, minWidth: 140 }}
              >
                SAVE CHANGES
              </PrimaryButton>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  saveBtn: {
    marginTop: 16,
  },
});

export default EditProfileScreen;
