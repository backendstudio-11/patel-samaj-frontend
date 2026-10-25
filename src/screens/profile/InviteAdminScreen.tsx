import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, HelperText, Snackbar, Button } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { themeColors } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import apiClient, { extractErrorMessage } from '../../api/client';
import { UserProfileDTO } from '../../types';

export const InviteAdminScreen: React.FC = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastError, setToastError] = useState<boolean>(false);

  const { control, handleSubmit, formState: { errors } } = useForm<UserProfileDTO>({
    defaultValues: {
      fullName: '',
      email: '',
      mobileNumber: '',
    },
  });

  const inviteAdminMutation = useMutation({
    mutationFn: async (data: UserProfileDTO) => {
      const payload: UserProfileDTO = {
        fullName: data.fullName,
        mobileNumber: data.mobileNumber,
        email: data.email || '',
      };
      const response = await apiClient.post('/user/inviteAdmin', payload);
      return response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      const successMessage = typeof data === 'string' && data.trim()
        ? data
        : (data?.message || 'Admin invitation sent successfully!');
      setToastError(false);
      setToastMsg(successMessage);
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    },
    onError: (err: any) => {
      const errorMessage = err?.userMessage || extractErrorMessage(err);
      setToastError(true);
      setToastMsg(errorMessage);
    },
  });

  const onSubmit = (data: UserProfileDTO) => {
    setToastMsg(null);
    inviteAdminMutation.mutate(data);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Invite Administrator" showBack={true} onBack={() => navigation.goBack()} />

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
                    label="Admin Full Name"
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

            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                textColor={themeColors.textMuted}
                style={{ borderRadius: 8, height: 48, justifyContent: 'center', borderColor: themeColors.border, paddingHorizontal: 16, minWidth: 120 }}
                disabled={inviteAdminMutation.isPending}
              >
                CANCEL
              </Button>
              <PrimaryButton
                onPress={handleSubmit(onSubmit)}
                loading={inviteAdminMutation.isPending}
                style={{ marginVertical: 0, minWidth: 140 }}
              >
                SEND INVITATION
              </PrimaryButton>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!toastMsg}
        onDismiss={() => setToastMsg(null)}
        duration={4000}
        style={{ backgroundColor: toastError ? themeColors.error : themeColors.success }}
        action={{
          label: 'OK',
          onPress: () => setToastMsg(null),
        }}
      >
        {toastMsg}
      </Snackbar>
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
    marginTop: 20,
  },
});

export default InviteAdminScreen;
