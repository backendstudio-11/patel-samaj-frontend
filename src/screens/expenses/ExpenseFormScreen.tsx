import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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
import { Expense } from '../../types';

type RoutePropType = RouteProp<RootStackParamList, 'ExpenseForm'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

export const ExpenseFormScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const editId = route.params?.id;

  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  const [loadingInitial, setLoadingInitial] = useState(false);

  const { control, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      description: '',
      amount: '',
      expenseDate: new Date(),
      category: '',
    },
  });

  // Load existing expense info if editing
  useEffect(() => {
    if (editId) {
      const fetchExpense = async () => {
        setLoadingInitial(true);
        try {
          const res = await apiClient.get(`/expenses/${editId}`);
          const expense: Expense = res.data;
          reset({
            description: expense.description || '',
            amount: expense.amount.toString(),
            expenseDate: new Date(expense.expenseDate),
            category: expense.category || '',
          });
        } catch (err) {
          // Handle error loading
        } finally {
          setLoadingInitial(false);
        }
      };
      fetchExpense();
    }
  }, [editId]);

  // Mutation to create/update
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...(editId ? { expenseId: parseInt(editId, 10) } : {}),
        amount: parseFloat(data.amount),
        expenseDate: data.expenseDate.toISOString().split('T')[0],
        category: data.category || '',
        description: data.description,
      };
      const response = await apiClient.post('/expenses', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      if (editId) {
        queryClient.invalidateQueries({ queryKey: ['expense', editId] });
      }
      navigation.goBack();
    },
  });

  const onSubmit = (data: any) => {
    if (!isAdmin) {
      alert('Only Admin users can add or edit expense records.');
      return;
    }
    saveMutation.mutate(data);
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title={editId ? 'Edit Expense' : 'Log Expense'}
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
              name="description"
              rules={{ required: 'Description is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Description"
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    error={!!errors.description}
                    style={styles.input}
                  />
                  {errors.description && (
                    <HelperText type="error" visible={true}>
                      {errors.description.message}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="amount"
              rules={{
                required: 'Amount is required',
                validate: (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0 || 'Enter a valid positive amount',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Amount Charged (₹)"
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
              name="category"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Category (e.g. Maintenance, Utilities, Salaries)"
                    mode="outlined"
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

            <Controller
              control={control}
              name="expenseDate"
              render={({ field: { onChange, value } }) => (
                <DatePicker
                  date={value}
                  onChange={onChange}
                  label="Expense Date"
                />
              )}
            />



            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                textColor={themeColors.textMuted}
                style={{ borderRadius: 8, height: 48, justifyContent: 'center', borderColor: themeColors.border, paddingHorizontal: 16, minWidth: 120 }}
                disabled={saveMutation.isPending || loadingInitial}
              >
                CANCEL
              </Button>
              <PrimaryButton
                onPress={handleSubmit(onSubmit)}
                loading={saveMutation.isPending || loadingInitial}
                style={{ marginVertical: 0, minWidth: 140 }}
              >
                {editId ? 'UPDATE TRANSACTION' : 'SAVE TRANSACTION'}
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

export default ExpenseFormScreen;
