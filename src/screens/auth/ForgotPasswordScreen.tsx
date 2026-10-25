import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Text, TextInput, Snackbar, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { themeColors } from '../../theme';
import { PrimaryButton } from '../../components/PrimaryButton';
import { AppHeader } from '../../components/AppHeader';
import apiClient from '../../api/client';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await apiClient.post('/auth/forgot-password', {
        email: data.email,
      });
      setSuccessMsg('If that email exists, a new password has been sent.');
    } catch (err: any) {
      // Per prompt requirement, even if there's a failure (e.g. user not found),
      // we can handle it gracefully. However, standard response is showing the user message or fallback.
      setErrorMsg(err.userMessage || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarDismiss = () => {
    if (successMsg) {
      setSuccessMsg(null);
      navigation.navigate('Login');
    } else {
      setErrorMsg(null);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Forgot Password" showBack={true} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.infoSection}>
            <Text variant="bodyLarge" style={styles.infoText}>
              Please enter your registered email address. We will verify it and send a new generated password if it exists in the system.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Email address is required',
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: 'Enter a valid email address',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Email Address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    mode="outlined"
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    error={!!errors.email}
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

            <PrimaryButton
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={styles.submitBtn}
            >
              RESET PASSWORD
            </PrimaryButton>
          </View>

          <Snackbar
            visible={!!successMsg || !!errorMsg}
            onDismiss={handleSnackbarDismiss}
            duration={4000}
            action={{
              label: 'OK',
              onPress: handleSnackbarDismiss,
            }}
            style={successMsg ? styles.successSnackbar : styles.errorSnackbar}
          >
            {successMsg || errorMsg}
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  infoSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  infoText: {
    color: themeColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: {
    backgroundColor: themeColors.surface,
    padding: 24,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  submitBtn: {
    marginTop: 8,
  },
  successSnackbar: {
    backgroundColor: themeColors.success,
  },
  errorSnackbar: {
    backgroundColor: themeColors.error,
  },
});

export default ForgotPasswordScreen;
