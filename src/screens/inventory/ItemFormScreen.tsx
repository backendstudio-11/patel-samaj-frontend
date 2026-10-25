import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Text, TextInput, HelperText, Button } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { themeColors } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RootStackParamList } from '../../navigation/types';
import apiClient from '../../api/client';
import { Item } from '../../types';

type RoutePropType = RouteProp<RootStackParamList, 'ItemForm'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

export const ItemFormScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const editId = route.params?.id;

  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  const [loadingInitial, setLoadingInitial] = useState(false);

  const { control, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      price: '',
      description: '',
      isAvailable: true,
    },
  });

  // Load existing item details if editing
  useEffect(() => {
    if (editId) {
      const fetchItem = async () => {
        setLoadingInitial(true);
        try {
          const res = await apiClient.get(`/items/${editId}`);
          const item: Item = res.data;
          reset({
            name: item.itemName,
            price: item.currentPrice.toString(),
            description: item.description || '',
            isAvailable: item.isAvailable,
          });
        } catch (err) {
          // Handle error loading
        } finally {
          setLoadingInitial(false);
        }
      };
      fetchItem();
    }
  }, [editId]);

  // Mutation to create/update
  const saveItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...(editId ? { itemId: parseInt(editId, 10) } : {}),
        itemName: data.name,
        currentPrice: parseFloat(data.price),
        description: data.description,
        isAvailable: data.isAvailable,
      };
      const response = await apiClient.post('/items', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      if (editId) {
        queryClient.invalidateQueries({ queryKey: ['item', editId] });
      }
      navigation.goBack();
    },
  });

  const onSubmit = (data: any) => {
    if (!isAdmin) {
      alert('Only Admin users can add or edit inventory items.');
      return;
    }
    saveItemMutation.mutate(data);
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title={editId ? 'Edit Inventory Item' : 'Add Inventory Item'}
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
              name="name"
              rules={{ required: 'Item name is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Item Name"
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    error={!!errors.name}
                    style={styles.input}
                  />
                  {errors.name && (
                    <HelperText type="error" visible={true}>
                      {errors.name.message}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="price"
              rules={{
                required: 'Rental rate is required',
                validate: (v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0 || 'Enter valid price rate',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Rental Rate Price (₹ / day)"
                    keyboardType="numeric"
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    error={!!errors.price}
                    style={styles.input}
                    left={<TextInput.Affix text="₹ " />}
                  />
                  {errors.price && (
                    <HelperText type="error" visible={true}>
                      {errors.price.message}
                    </HelperText>
                  )}
                </View>
              )}
            />

             <View style={[styles.row, { alignItems: 'center', marginVertical: 12, justifyContent: 'space-between' }]}>
               <Text style={{ color: themeColors.text, fontSize: 16 }}>Available for Booking</Text>
               <Controller
                 control={control}
                 name="isAvailable"
                 render={({ field: { value, onChange } }) => (
                   <Switch
                     value={value}
                     onValueChange={onChange}
                     trackColor={{ true: themeColors.primary }}
                   />
                 )}
               />
             </View>

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Description / Specifications (Optional)"
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
                disabled={saveItemMutation.isPending || loadingInitial}
              >
                CANCEL
              </Button>
              <PrimaryButton
                onPress={handleSubmit(onSubmit)}
                loading={saveItemMutation.isPending || loadingInitial}
                style={{ marginVertical: 0, minWidth: 140 }}
              >
                {editId ? 'UPDATE ITEM' : 'SAVE ITEM'}
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
  row: {
    flexDirection: 'row',
  },
  saveBtn: {
    marginTop: 16,
  },
});

export default ItemFormScreen;
