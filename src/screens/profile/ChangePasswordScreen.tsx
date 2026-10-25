import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, HelperText, Snackbar, Button } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';

import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { themeColors } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import apiClient from '../../api/client';
import { ChangePasswordDTO } from '../../types';

export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  const [secureOld, setSecureOld] = useState(true);
  const [secureNew, setSecureNew] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPasswordVal = watch('newPassword');

  const changePassMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload: ChangePasswordDTO = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      };
      const response = await apiClient.post('/user/change-password', payload);
      return response.data;
    },
    onSuccess: () => {
      setToastError(false);
      setToastMsg('Password changed successfully.');
      reset();
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    },
    onError: (err: any) => {
      setToastError(true);
      setToastMsg(err.userMessage || 'Failed to change password. Make sure current password is correct.');
    },
  });

  const onSubmit = (data: any) => {
    if (!isAdmin) {
      setToastError(true);
      setToastMsg('Only Admin users can change password.');
      return;
    }
    changePassMutation.mutate(data);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Change Password" showBack={true} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            <Controller
              control={control}
              name="currentPassword"
              rules={{ required: 'Current password is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Current Password"
                    secureTextEntry={secureOld}
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    error={!!errors.currentPassword}
                    style={styles.input}
                    left={<TextInput.Icon icon="lock" />}
                    right={
                      <TextInput.Icon
                        icon={secureOld ? 'eye-off' : 'eye'}
                        onPress={() => setSecureOld(!secureOld)}
                      />
                    }
                  />
                  {errors.currentPassword && (
                    <HelperText type="error" visible={true}>
                      {errors.currentPassword.message}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="newPassword"
              rules={{
                required: 'New password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="New Password"
                    secureTextEntry={secureNew}
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    error={!!errors.newPassword}
                    style={styles.input}
                    left={<TextInput.Icon icon="lock-reset" />}
                    right={
                      <TextInput.Icon
                        icon={secureNew ? 'eye-off' : 'eye'}
                        onPress={() => setSecureNew(!secureNew)}
                      />
                    }
                  />
                  {errors.newPassword && (
                    <HelperText type="error" visible={true}>
                      {errors.newPassword.message}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: 'Confirm password is required',
                validate: (value) => value === newPasswordVal || 'Passwords do not match',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Confirm New Password"
                    secureTextEntry={secureConfirm}
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    error={!!errors.confirmPassword}
                    style={styles.input}
                    left={<TextInput.Icon icon="lock-check" />}
                    right={
                      <TextInput.Icon
                        icon={secureConfirm ? 'eye-off' : 'eye'}
                        onPress={() => setSecureConfirm(!secureConfirm)}
                      />
                    }
                  />
                  {errors.confirmPassword && (
                    <HelperText type="error" visible={true}>
                      {errors.confirmPassword.message}
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
                disabled={changePassMutation.isPending}
              >
                CANCEL
              </Button>
              <PrimaryButton
                onPress={handleSubmit(onSubmit)}
                loading={changePassMutation.isPending}
                style={{ marginVertical: 0, minWidth: 140 }}
              >
                RESET PASSWORD
              </PrimaryButton>
            </View>
          </View>

          <Snackbar
            visible={!!toastMsg}
            onDismiss={() => setToastMsg(null)}
            style={toastError ? styles.errorSnackbar : styles.successSnackbar}
            duration={2500}
          >
            {toastMsg}
          </Snackbar>
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
  errorSnackbar: {
    backgroundColor: themeColors.error,
  },
  successSnackbar: {
    backgroundColor: themeColors.success,
  },
});

export default ChangePasswordScreen;
