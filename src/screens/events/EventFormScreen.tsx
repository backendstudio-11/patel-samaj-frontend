import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, HelperText, Card, Button, IconButton } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { themeColors } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { DatePicker } from '../../components/DatePicker';
import { BottomSheet } from '../../components/BottomSheet';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { FormActionButtons } from '../../components/FormActionButtons';
import { showGlobalToast } from '../../context/ToastContext';
import { RootStackParamList } from '../../navigation/types';
import { inventoryApi } from '../../api/services/inventoryApi';
import { eventApi } from '../../api/services/eventApi';
import { formatCurrency } from '../../utils/format';
import { Item, EventStatus, Event } from '../../types';

type RoutePropType = RouteProp<RootStackParamList, 'EventForm'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

interface SelectedItemState {
  itemId: number;
  name: string;
  quantity: number;
  price: number;
}

export const EventFormScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const editId = route.params?.id;

  const [selectedItems, setSelectedItems] = useState<SelectedItemState[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [closeDialogVisible, setCloseDialogVisible] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [originalStatusId, setOriginalStatusId] = useState<number | null>(null);
  const [originalIsClosed, setOriginalIsClosed] = useState<boolean | null>(null);

  // Fetch Available Inventory Items
  const { data: inventoryItems = [] } = useQuery<Item[]>({
    queryKey: ['items'],
    queryFn: () => inventoryApi.getItems(),
  });

  // Current Date (Today) used as default and minimum date to disable past dates
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { control, handleSubmit, setValue, reset, getValues, watch, formState: { errors } } = useForm({
    defaultValues: {
      familyHeadName: '',
      contactNumber: '',
      email: '',
      eventType: '',
      startDate: new Date(),
      endDate: new Date(),
      remarks: '',
      paidAmount: '0',
    },
  });

  const watchedStartDate = watch('startDate');

  // Calculate live total amount
  const liveTotalAmount = selectedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

  // Load existing event data if editing
  useEffect(() => {
    if (editId) {
      const fetchEvent = async () => {
        setLoadingInitial(true);
        try {
          const event: Event = await eventApi.getEventById(editId);

          const stDate = event.startDate ? new Date(event.startDate) : new Date();
          const enDate = event.endDate ? new Date(event.endDate) : stDate;

          reset({
            familyHeadName: event.familyHeadName,
            contactNumber: event.contactNumber,
            email: event.email || '',
            eventType: event.eventType,
            startDate: stDate,
            endDate: enDate,
            remarks: event.remarks || '',
            paidAmount: (event.paidAmount || 0).toString(),
          });

          setOriginalStatusId(event.statusId);
          setOriginalIsClosed(event.isClosed);

          // Restore selected items
          const mappedItems = event.items.map((i) => ({
            itemId: i.itemId,
            name: i.itemName,
            quantity: i.quantity,
            price: i.priceAtBooking,
          }));
          setSelectedItems(mappedItems);
        } catch (err) {
          // Handle error loading
        } finally {
          setLoadingInitial(false);
        }
      };
      fetchEvent();
    }
  }, [editId]);

  // Mutation to create/update
  const saveEventMutation = useMutation({
    mutationFn: async (formData: any) => {
      const payload = {
        ...(editId ? { eventId: parseInt(editId, 10) } : {}),
        familyHeadName: formData.familyHeadName,
        contactNumber: formData.contactNumber,
        email: formData.email,
        eventType: formData.eventType,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate ? formData.endDate.toISOString() : null,
        remarks: formData.remarks,
        paidAmount: parseInt(formData.paidAmount || '0', 10) || 0,
        totalAmount: liveTotalAmount,
        items: selectedItems.map((item) => ({
          itemId: item.itemId,
          itemName: item.name,
          quantity: item.quantity,
          priceAtBooking: item.price,
        })),
        isClosed: editId ? originalIsClosed : false,
        statusId: editId ? originalStatusId : EventStatus.PENDING,
      };

      if (editId) {
        // PUT for editing
        return await eventApi.updateEvent(payload);
      } else {
        // POST for creation
        return await eventApi.createEvent(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      if (editId) {
        queryClient.invalidateQueries({ queryKey: ['event', editId] });
      }
      navigation.goBack();
    },
  });

  // Close Event Mutation for Admin
  const closeEventMutation = useMutation({
    mutationFn: async () => {
      if (!editId) return;
      return await eventApi.closeEvent(editId);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      if (editId) {
        queryClient.invalidateQueries({ queryKey: ['event', editId] });
      }
      setCloseDialogVisible(false);
      navigation.goBack();
    },
  });

  // Update Status Mutation for Admin (e.g. Approve Event)
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatusId: number) => {
      if (!editId) return;
      return await eventApi.updateEvent({
        eventId: parseInt(editId, 10),
        statusId: newStatusId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', editId] });
      navigation.goBack();
    },
  });

  const onSubmit = (data: any) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const startStr = new Date(data.startDate).toISOString().split('T')[0];

    // User cannot select past date before today
    if (!editId && startStr < todayStr) {
      showGlobalToast({
        message: 'Event start date cannot be in the past.',
        type: 'error',
      });
      return;
    }

    const endStr = new Date(data.endDate || data.startDate).toISOString().split('T')[0];

    if (endStr < startStr) {
      showGlobalToast({
        message: 'End date must be greater than or equal to start date.',
        type: 'error',
      });
      return;
    }

    saveEventMutation.mutate(data);
  };

  const handleItemsSelected = (ids: string[]) => {
    const newSelection = ids.map((idStr) => {
      const id = parseInt(idStr, 10);
      const existing = selectedItems.find((s) => s.itemId === id);
      if (existing) return existing;

      const invItem = inventoryItems.find((i) => i.itemId === id);
      return {
        itemId: id,
        name: invItem?.itemName || 'Unknown Item',
        quantity: 1,
        price: invItem?.currentPrice || 0,
      };
    });
    setSelectedItems(newSelection);
  };

  const updateQuantity = (itemId: number, amount: number) => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId) {
          const newQty = Math.max(1, item.quantity + amount);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const setDirectQuantity = (itemId: number, text: string) => {
    const sanitized = text.replace(/[^0-9]/g, '');
    let finalQty = parseInt(sanitized, 10);
    if (isNaN(finalQty) || finalQty < 1) {
      finalQty = 1;
    }
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId) {
          return { ...item, quantity: finalQty };
        }
        return item;
      })
    );
  };

  const removeItem = (itemId: number) => {
    setSelectedItems((prev) => prev.filter((item) => item.itemId !== itemId));
  };

  const selectedIds = selectedItems.map((i) => String(i.itemId));
  // Prepare list items for BottomSheet selection
  const selectorOptions = inventoryItems.map((i) => ({
    id: String(i.itemId),
    name: i.itemName,
    price: i.currentPrice,
    availableQty: undefined,
  }));

  return (
    <View style={styles.container}>
      <AppHeader
        title={editId ? 'Update Booking' : 'Book Event'}
        showBack={true}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            <Text variant="titleMedium" style={styles.sectionHeader}>
              Family Head Information
            </Text>

            <Controller
              control={control}
              name="familyHeadName"
              rules={{ required: 'Family head name is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Family Head Name"
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    error={!!errors.familyHeadName}
                    style={styles.input}
                  />
                  {errors.familyHeadName && (
                    <HelperText type="error" visible={true}>
                      {errors.familyHeadName.message}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="contactNumber"
              rules={{
                required: 'Contact number is required',
                pattern: { value: /^[0-9]{10}$/, message: 'Enter valid 10-digit mobile number' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Contact Number"
                    keyboardType="numeric"
                    maxLength={10}
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    error={!!errors.contactNumber}
                    style={styles.input}
                    left={<TextInput.Icon icon="phone" />}
                  />
                  {errors.contactNumber && (
                    <HelperText type="error" visible={true}>
                      {errors.contactNumber.message}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="email"
              rules={{
                pattern: { value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, message: 'Enter a valid email' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Email Address (Optional)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    mode="outlined"
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

            <Text variant="titleMedium" style={[styles.sectionHeader, { marginTop: 12 }]}>
              Booking Specifics
            </Text>

            <Controller
              control={control}
              name="eventType"
              rules={{ required: 'Event type is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Event Type (e.g. Wedding, Meeting)"
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    error={!!errors.eventType}
                    style={styles.input}
                  />
                  {errors.eventType && (
                    <HelperText type="error" visible={true}>
                      {errors.eventType.message}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="startDate"
              render={({ field: { onChange, value } }) => (
                <DatePicker
                  date={value}
                  minimumDate={value ? new Date(value) : today}
                  onChange={(selectedDate: Date) => {
                    onChange(selectedDate);
                    const currentEnd = getValues('endDate');
                    if (!currentEnd || new Date(currentEnd) < selectedDate) {
                      setValue('endDate', selectedDate);
                    }
                  }}
                  label="Start Date"
                />
              )}
            />

            <Controller
              control={control}
              name="endDate"
              render={({ field: { onChange, value } }) => (
                <DatePicker
                  date={value || watchedStartDate || today}
                  minimumDate={watchedStartDate ? new Date(watchedStartDate) : (value ? new Date(value) : today)}
                  onChange={onChange}
                  label="End Date"
                />
              )}
            />

            {/* Equipment Items List */}
            <View style={styles.itemsHeaderRow}>
              <Text variant="titleMedium" style={styles.itemsSectionTitle}>
                Selected Items ({selectedItems.length})
              </Text>
              <Button
                mode="text"
                onPress={() => setModalVisible(true)}
                textColor={themeColors.primary}
                icon="plus"
              >
                Select Items
              </Button>
            </View>

            {selectedItems.map((item) => (
              <View key={item.itemId} style={styles.selectedItemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemNameText}>{item.name}</Text>
                  <Text style={styles.itemPriceText}>₹{Math.round(item.price)} / unit</Text>
                </View>
                <View style={styles.qtyContainer}>
                  <IconButton
                    icon="minus"
                    size={18}
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.itemId, -1)}
                  />
                  <TextInput
                    value={String(item.quantity || '')}
                    onChangeText={(text) => setDirectQuantity(item.itemId, text)}
                    keyboardType="numeric"
                    dense={true}
                    mode="outlined"
                    outlineColor={themeColors.border}
                    activeOutlineColor={themeColors.primary}
                    style={styles.qtyInput}
                  />
                  <IconButton
                    icon="plus"
                    size={18}
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.itemId, 1)}
                  />
                </View>
                <IconButton
                  icon="delete-outline"
                  iconColor={themeColors.error}
                  size={20}
                  onPress={() => removeItem(item.itemId)}
                />
              </View>
            ))}

            {selectedItems.length === 0 && (
              <Text style={styles.emptyItemsText}>No equipment items selected yet.</Text>
            )}

            {/* Live Financial Summaries */}
            <View style={styles.billSummarySection}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontWeight: 'bold' }]}>Total Bill</Text>
                <Text style={[styles.summaryValue, { fontWeight: 'bold', color: themeColors.primary }]}>
                  {formatCurrency(liveTotalAmount)}
                </Text>
              </View>
            </View>

            <Controller
              control={control}
              name="remarks"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputContainer, { marginTop: 12 }]}>
                  <TextInput
                    label="Remarks / Special Requests (Optional)"
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
              submitLabel={editId ? 'UPDATE BOOKING' : 'CREATE BOOKING'}
              loading={saveEventMutation.isPending || loadingInitial}
              disabled={saveEventMutation.isPending || loadingInitial}
            />

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Equipment Selector Modal */}
      <BottomSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Select Rental Items"
        items={selectorOptions}
        selectedIds={selectedIds}
        onSelect={handleItemsSelected}
      />

      {/* Confirmation Dialog for Closing Billing */}
      <ConfirmationDialog
        visible={closeDialogVisible}
        title="Close Event Billing"
        message="Are you sure you want to close and lock this event booking? Once closed, billing totals will be locked permanently, the PDF invoice will be saved in cache, and opened for WhatsApp sharing."
        confirmLabel="Close & Share Bill"
        cancelLabel="Keep Open"
        onConfirm={() => closeEventMutation.mutate()}
        onCancel={() => setCloseDialogVisible(false)}
        loading={closeEventMutation.isPending}
      />
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
    flexGrow: 1,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    elevation: 2,
  },
  sectionHeader: {
    fontWeight: 'bold',
    color: themeColors.secondary,
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    paddingBottom: 4,
  },
  itemsSectionTitle: {
    fontWeight: 'bold',
    color: themeColors.secondary,
  },
  selectedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  itemNameText: {
    fontSize: 14,
    fontWeight: '500',
    color: themeColors.text,
  },
  itemPriceText: {
    fontSize: 12,
    color: themeColors.textMuted,
    marginTop: 2,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: 2,
  },
  qtyBtn: {
    margin: 0,
  },
  qtyInput: {
    width: 64,
    height: 38,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 2,
  },
  emptyItemsText: {
    textAlign: 'center',
    color: themeColors.textMuted,
    fontStyle: 'italic',
    padding: 16,
  },
  billSummarySection: {
    backgroundColor: themeColors.navyLight,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    color: themeColors.text,
    fontSize: 14,
  },
  summaryValue: {
    color: themeColors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: themeColors.border,
    marginVertical: 10,
  },
  saveBtn: {
    marginTop: 16,
  },
});

export default EventFormScreen;
