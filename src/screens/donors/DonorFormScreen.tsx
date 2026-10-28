import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, HelperText, Button } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useRoute, useNavigation, RouteProp, StackActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { themeColors } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { DatePicker } from '../../components/DatePicker';
import { FormActionButtons } from '../../components/FormActionButtons';
import { showGlobalToast } from '../../context/ToastContext';
import { RootStackParamList } from '../../navigation/types';
import { donorApi } from '../../api/services/donorApi';
import { Donor } from '../../types';

type RoutePropType = RouteProp<RootStackParamList, 'DonorForm'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

export const DonorFormScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const editId = route.params?.id;

  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  const [loadingInitial, setLoadingInitial] = useState(false);

  const { control, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      fullName: '',
      amount: '',
      donationDate: new Date(),
      remarks: '',
    },
  });

  // Load existing donor data if editing
  useEffect(() => {
    if (editId) {
      const fetchDonor = async () => {
        setLoadingInitial(true);
        try {
          const donor: Donor = await donorApi.getDonorById(editId);
          reset({
            fullName: donor.fullName,
            amount: donor.amount.toString(),
            donationDate: new Date(donor.donationDate),
            remarks: donor.remarks || '',
          });
        } catch (err) {
          // Handle err
        } finally {
          setLoadingInitial(false);
        }
      };
      fetchDonor();
    }
  }, [editId]);

  const handleSuccessNavigation = () => {
    if (editId) {
      // If editing from details screen, pop 2 screens back (to the second last page / donor list)
      const navState = navigation.getState();
      const currentIndex = navState?.index ?? 0;
      if (currentIndex >= 2) {
        navigation.dispatch(StackActions.pop(2));
      } else if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('DonorList' as any);
      }
    } else {
      navigation.goBack();
    }
  };

  // Mutation to add/update donor
  const saveDonorMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...(editId ? { donorId: parseInt(editId, 10) } : {}),
        fullName: data.fullName,
        amount: parseInt(data.amount, 10) || 0,
        donationDate: data.donationDate.toISOString(),
        remarks: data.remarks,
      };
      return await donorApi.createDonor(payload);
    },
    onSuccess: () => {
      // Invalidate queries to trigger refresh
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      if (editId) {
        queryClient.invalidateQueries({ queryKey: ['donor', editId] });
      }
      
      // Instantly redirect to second last page on edit, or previous page on add
      handleSuccessNavigation();
    },
  });

  const onSubmit = (data: any) => {
    if (!isAdmin) {
      showGlobalToast({ message: 'Only Admin users can add or edit donor details.', type: 'error' });
      return;
    }
    saveDonorMutation.mutate(data);
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title={editId ? 'Edit Donor' : 'Add Donor'}
        showBack={true}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            <Controller
              control={control}
              name="fullName"
              rules={{ required: 'Donor name is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Donor Name"
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    error={!!errors.fullName}
                    style={styles.input}
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
              name="amount"
              rules={{
                required: 'Donation amount is required',
                pattern: { value: /^[0-9]+$/, message: 'Amount must be a whole number (in Rupees)' },
                validate: (v) => (!isNaN(parseInt(v, 10)) && parseInt(v, 10) > 0) || 'Enter a valid positive amount',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Donation Amount (₹)"
                    keyboardType="number-pad"
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={(val) => onChange(val.replace(/[^0-9]/g, ''))}
                    value={value}
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    error={!!errors.amount}
                    style={styles.input}
                    left={<TextInput.Affix text="₹ " />}
                  />
                  {errors.amount && (
                    <HelperText type="error" visible={true}>
                      {errors.amount.message}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="donationDate"
              render={({ field: { onChange, value } }) => (
                <DatePicker
                  date={value}
                  onChange={onChange}
                  label="Donation Date"
                />
              )}
            />

            <Controller
              control={control}
              name="remarks"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Remarks (Optional)"
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    style={styles.input}
                  />
                </View>
              )}
            />

            <FormActionButtons
              onSubmit={handleSubmit(onSubmit)}
              onCancel={() => navigation.goBack()}
              submitLabel={editId ? 'UPDATE DONOR' : 'SAVE DONOR'}
              loading={saveDonorMutation.isPending || loadingInitial}
              disabled={saveDonorMutation.isPending || loadingInitial}
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
    width: '100%',
    alignSelf: 'center',
    borderWidth: Platform.OS === 'web' ? 1 : 0.5,
    borderColor: themeColors.border,
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

export default DonorFormScreen;
