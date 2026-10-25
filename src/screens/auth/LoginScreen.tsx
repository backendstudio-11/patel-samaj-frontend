import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Text, TextInput, Checkbox, Snackbar, HelperText, Button } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { themeColors } from '../../theme';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RootState } from '../../store';
import { setCredentials, setRememberedMobile } from '../../store/authSlice';
import apiClient from '../../api/client';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const DEMO_MOBILE = process.env.EXPO_PUBLIC_DEMO_MOBILE || '9999999999';
const DEMO_PASSWORD = process.env.EXPO_PUBLIC_DEMO_PASSWORD || '76426707';

export const LoginScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();
  const rememberedMobile = useSelector((state: RootState) => state.auth.rememberedMobile);

  const [secureText, setSecureText] = useState(true);
  const [rememberMe, setRememberMe] = useState(!!rememberedMobile);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      mobileNumber: '',
      password: '',
    },
  });

  useEffect(() => {
    if (rememberedMobile) {
      setValue('mobileNumber', rememberedMobile);
    }
  }, [rememberedMobile]);

  const performLogin = async (data: { mobileNumber: string; password: string }) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // API call to authenticate
      const response = await apiClient.post('/auth/login', {
        mobileNumber: data.mobileNumber,
        password: data.password,
      });

      let token = '';
      if (typeof response.data === 'string') {
        token = response.data;
      } else if (response.data && typeof response.data === 'object') {
        token = response.data.token || response.data.accessToken || response.data.jwtToken || response.data.jwt;
      }

      if (!token) {
        throw new Error('Authentication failed: JWT Token is missing in server response.');
      }

      // Store JWT Token in AsyncStorage
      await AsyncStorage.setItem('jwt_token', token);

      // Save initial token into Redux so interceptor picks up Bearer token
      dispatch(setCredentials({ token, user: null as any, isAdmin: false }));

      let fetchedUser = {
        userId: 1,
        fullName: 'Patel Samaj',
        email: '',
        mobileNumber: data.mobileNumber,
        isActive: true,
        roleName: '',
      };

      let computedIsAdmin = false;

      try {
        const userRes = await apiClient.get('/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const uData = userRes.data;
        if (uData && typeof uData === 'object') {
          const roleName = uData.roleName || uData.role || (Array.isArray(uData.roles) ? uData.roles[0] : uData.roles) || '';

          fetchedUser = {
            userId: Number(uData.userId || uData.id || 1),
            fullName: uData.fullName || fetchedUser.fullName,
            email: uData.email || '',
            mobileNumber: uData.mobileNumber || data.mobileNumber,
            isActive: uData.isActive !== undefined ? uData.isActive : true,
            roleName: typeof roleName === 'string' ? roleName : String(roleName),
          };

          // Set isAdmin flag based on response value (isAdmin property or roleName === 'ADMIN')
          if (uData.isAdmin !== undefined) {
            computedIsAdmin = Boolean(uData.isAdmin);
          } else if (roleName) {
            const roleUpper = String(roleName).toUpperCase().trim();
            computedIsAdmin = (roleUpper === 'ADMIN');
          }
        }
      } catch (e) {
        // Fallback user details if /user endpoint fails
      }

      // 4. Save User Credentials & Role details in Redux
      dispatch(setCredentials({ token, user: fetchedUser, isAdmin: computedIsAdmin }));

      // Manage Remember Login
      if (rememberMe) {
        dispatch(setRememberedMobile(data.mobileNumber));
      } else {
        dispatch(setRememberedMobile(null));
      }

      // Navigate to Dashboard
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (err: any) {
      setErrorMsg(err.userMessage || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: any) => performLogin(data);

  const handleDemoBypass = async () => {
    await performLogin({
      mobileNumber: DEMO_MOBILE,
      password: DEMO_PASSWORD,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>LPS</Text>
          </View>
          <Text variant="headlineMedium" style={styles.appName}>
            Leuva Patel Samaj
          </Text>
          <Text variant="titleMedium" style={styles.tagline}>
            Management System
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text variant="titleLarge" style={styles.formTitle}>
            Admin Login
          </Text>

          <Controller
            control={control}
            name="mobileNumber"
            rules={{
              required: 'Mobile number is required',
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'Enter a valid 10-digit mobile number',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  label="Mobile Number"
                  keyboardType="numeric"
                  maxLength={10}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  mode="outlined"
                  outlineColor={themeColors.border}
                  activeOutlineColor={themeColors.primary}
                  error={!!errors.mobileNumber}
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
            name="password"
            rules={{
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  label="Password"
                  secureTextEntry={secureText}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  mode="outlined"
                  outlineColor={themeColors.border}
                  activeOutlineColor={themeColors.primary}
                  error={!!errors.password}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={secureText ? 'eye-off' : 'eye'}
                      onPress={() => setSecureText(!secureText)}
                    />
                  }
                />
                {errors.password && (
                  <HelperText type="error" visible={true}>
                    {errors.password.message}
                  </HelperText>
                )}
              </View>
            )}
          />

          <View style={styles.row}>
            <View style={styles.checkboxContainer}>
              <Checkbox
                status={rememberMe ? 'checked' : 'unchecked'}
                onPress={() => setRememberMe(!rememberMe)}
                color={themeColors.primary}
              />
              <Text variant="bodyMedium" style={styles.checkboxLabel}>
                Remember Login
              </Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <PrimaryButton
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.loginBtn}
          >
            LOGIN
          </PrimaryButton>

          <Button
            mode="outlined"
            onPress={handleDemoBypass}
            textColor={themeColors.secondary}
            style={styles.demoBtn}
          >
            EXPLORE DEMO ACCOUNT
          </Button>
        </View>

        <Snackbar
          visible={!!errorMsg}
          onDismiss={() => setErrorMsg(null)}
          action={{
            label: 'Close',
            onPress: () => setErrorMsg(null),
          }}
          style={styles.errorSnackbar}
        >
          {errorMsg}
        </Snackbar>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: themeColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 28,
  },
  appName: {
    fontWeight: 'bold',
    color: themeColors.secondary,
  },
  tagline: {
    color: themeColors.textMuted,
    marginTop: 4,
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
  formTitle: {
    fontWeight: 'bold',
    color: themeColors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    color: themeColors.text,
    marginLeft: 4,
  },
  forgotText: {
    color: themeColors.primary,
    fontWeight: 'bold',
  },
  loginBtn: {
    marginTop: 16,
  },
  errorSnackbar: {
    backgroundColor: themeColors.error,
  },
  demoBtn: {
    marginTop: 12,
    borderColor: themeColors.secondary,
  },
});

import { TouchableOpacity } from 'react-native-gesture-handler';

export default LoginScreen;
