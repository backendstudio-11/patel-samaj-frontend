import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Text, TextInput, HelperText, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { themeColors } from '../../theme';
import { PrimaryButton } from '../../components/PrimaryButton';
import { AppHeader } from '../../components/AppHeader';
import { authApi } from '../../api/services/authApi';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: { email: string }) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1000);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Forgot Password" showBack={true} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centerWrapper}>
            <View style={styles.formCard}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="lock-reset" size={40} color={themeColors.primary} />
              </View>

              <Text variant="headlineSmall" style={styles.formTitle}>
                Reset Password
              </Text>
              <Text variant="bodyMedium" style={styles.infoText}>
                Enter your registered email address. We will verify and send a newly generated password to your inbox.
              </Text>

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
                      left={<TextInput.Icon icon="email" color={themeColors.textMuted} />}
                      style={styles.textInput}
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

              <Button
                mode="text"
                icon="arrow-left"
                onPress={() => navigation.navigate('Login')}
                textColor={themeColors.textMuted}
                style={styles.backBtn}
                labelStyle={styles.backBtnLabel}
              >
                Back to Login
              </Button>
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  centerWrapper: {
    width: '100%',
    maxWidth: 450,
    alignSelf: 'center',
  },
  formCard: {
    backgroundColor: themeColors.surface,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderRadius: 20,
    borderWidth: Platform.OS === 'web' ? 1 : 0.5,
    borderColor: themeColors.border,
    elevation: 4,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    alignItems: 'stretch',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: themeColors.saffronLight,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  formTitle: {
    fontWeight: '800',
    color: themeColors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  infoText: {
    color: themeColors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: themeColors.surface,
  },
  submitBtn: {
    marginTop: 8,
    width: '100%',
    alignSelf: 'stretch',
  },
  backBtn: {
    marginTop: 12,
    alignSelf: 'center',
  },
  backBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
