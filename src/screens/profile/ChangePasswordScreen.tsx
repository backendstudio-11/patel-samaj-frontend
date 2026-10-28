import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, HelperText, Button } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';

import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { themeColors } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { FormActionButtons } from '../../components/FormActionButtons';
import { showGlobalToast } from '../../context/ToastContext';
import { userApi } from '../../api/services/userApi';
import { ChangePasswordDTO } from '../../types';

export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  const [secureOld, setSecureOld] = useState(true);
  const [secureNew, setSecureNew] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

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
      return await userApi.changePassword(payload);
    },
    onSuccess: () => {
      reset();
      navigation.goBack();
    },
  });

  const onSubmit = (data: any) => {
    if (!isAdmin) {
      showGlobalToast({ message: 'Only Admin users can change password.', type: 'error' });
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

            <FormActionButtons
              onSubmit={handleSubmit(onSubmit)}
              onCancel={() => navigation.goBack()}
              submitLabel="RESET PASSWORD"
              loading={changePassMutation.isPending}
              disabled={changePassMutation.isPending}
            />
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
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    borderWidth: Platform.OS === 'web' ? 1 : 0.5,
    borderColor: themeColors.border,
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
});

export default ChangePasswordScreen;
