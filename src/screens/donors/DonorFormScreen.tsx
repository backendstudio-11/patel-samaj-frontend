import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, HelperText, Button } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { themeColors } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { DatePicker } from '../../components/DatePicker';
import { RootStackParamList } from '../../navigation/types';
import apiClient from '../../api/client';
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
          const res = await apiClient.get(`/donors/${editId}`);
          const donor: Donor = res.data;
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

  // Mutation to add/update donor
  const saveDonorMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...(editId ? { donorId: parseInt(editId, 10) } : {}),
        fullName: data.fullName,
        amount: parseFloat(data.amount),
        donationDate: data.donationDate.toISOString(),
        remarks: data.remarks,
      };
      const response = await apiClient.post('/donors', payload);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate queries to trigger refresh
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      if (editId) {
        queryClient.invalidateQueries({ queryKey: ['donor', editId] });
      }
      
      Alert.alert(
        'Success',
        `Successfully saved donor: ${data.fullName}`,
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.userMessage || 'Failed to save donor. Please try again.');
    },
  });

  const onSubmit = (data: any) => {
    if (!isAdmin) {
      Alert.alert('Permission Denied', 'Only Admin users can add or edit donor details.');
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
                validate: (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0 || 'Enter a valid positive amount',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Donation Amount (₹)"
                    keyboardType="numeric"
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={onChange}
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

            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                textColor={themeColors.textMuted}
                style={{ borderRadius: 8, height: 48, justifyContent: 'center', borderColor: themeColors.border, paddingHorizontal: 16, minWidth: 120 }}
                disabled={saveDonorMutation.isPending || loadingInitial}
              >
                CANCEL
              </Button>
              <PrimaryButton
                onPress={handleSubmit(onSubmit)}
                loading={saveDonorMutation.isPending || loadingInitial}
                style={{ marginVertical: 0, minWidth: 140 }}
              >
                {editId ? 'UPDATE DONOR' : 'SAVE DONOR'}
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

export default DonorFormScreen;
