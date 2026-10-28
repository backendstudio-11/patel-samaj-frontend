import React, { useState, useEffect } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Checkbox, HelperText, Button } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { themeColors } from '../../theme';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RootState } from '../../store';
import { setCredentials, setRememberedMobile } from '../../store/authSlice';
import { setStoredToken } from '../../utils/tokenManager';
import { authApi } from '../../api/services/authApi';
import { userApi } from '../../api/services/userApi';
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    try {
      // API call to authenticate
      const loginData = await authApi.login({
        mobileNumber: data.mobileNumber,
        password: data.password,
      });

      let token = '';
      if (typeof loginData === 'string') {
        token = loginData;
      } else if (loginData && typeof loginData === 'object') {
        token = loginData.token || loginData.accessToken || loginData.jwtToken || loginData.jwt;
      }

      if (!token) {
        throw new Error('Authentication failed: JWT Token is missing in server response.');
      }

      // Store JWT Token in AsyncStorage
      await setStoredToken(token);

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
        const uData: any = await userApi.getUserProfile();
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
    } catch {
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
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerWrapper}>
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

          <View style={styles.formCard}>
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
                    placeholder="Enter 10-digit mobile"
                    keyboardType="numeric"
                    maxLength={10}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    mode="outlined"
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    error={!!errors.mobileNumber}
                    left={<TextInput.Icon icon="phone" color={themeColors.textMuted} />}
                    style={styles.textInput}
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
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Password"
                    placeholder="Enter your password"
                    secureTextEntry={secureText}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    mode="outlined"
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    error={!!errors.password}
                    left={<TextInput.Icon icon="lock" color={themeColors.textMuted} />}
                    right={
                      <TextInput.Icon
                        icon={secureText ? 'eye-off' : 'eye'}
                        onPress={() => setSecureText(!secureText)}
                      />
                    }
                    style={styles.textInput}
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

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
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
              contentStyle={styles.demoBtnContent}
            >
              GUEST MODE
            </Button>
          </View>
        </View>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  centerWrapper: {
    width: '100%',
    maxWidth: 450,
    alignSelf: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: themeColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    elevation: 6,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 28,
    letterSpacing: 1,
  },
  appName: {
    fontWeight: '800',
    color: themeColors.secondary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  tagline: {
    color: themeColors.textMuted,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: themeColors.surface,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 20,
    borderWidth: Platform.OS === 'web' ? 1 : 0.5,
    borderColor: themeColors.border,
    elevation: 4,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  formTitle: {
    fontWeight: '800',
    color: themeColors.text,
    textAlign: 'center',
  },
  formSubtitle: {
    color: themeColors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: themeColors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    color: themeColors.text,
    marginLeft: 2,
    fontSize: 14,
  },
  forgotText: {
    color: themeColors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  loginBtn: {
    marginTop: 12,
    width: '100%',
    alignSelf: 'stretch',
  },
  demoBtn: {
    marginTop: 12,
    borderColor: themeColors.border,
    borderRadius: 8,
    width: '100%',
    alignSelf: 'stretch',
  },
  demoBtnContent: {
    height: 46,
  },
});

export default LoginScreen;
