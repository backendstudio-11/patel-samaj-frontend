import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Badge, Banner, Snackbar } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { themeColors, shadows } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { RootStackParamList } from '../../navigation/types';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/format';
import { Event, EventStatus } from '../../types';

type RoutePropType = RouteProp<RootStackParamList, 'EventDetails'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

export const EventDetailsScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const { id } = route.params;

  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  const [closeDialogVisible, setCloseDialogVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: event, isLoading, isError, refetch } = useQuery<Event>({
    queryKey: ['event', id],
    queryFn: async () => {
      const res = await apiClient.get(`/events/${id}`);
      return res.data;
    },
  });

  // Close Event Mutation
  const closeEventMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.put(`/events/close/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      setCloseDialogVisible(false);
      setSuccessMsg('Event closed successfully');
    },
    onError: (err: any) => {
      setErrorMsg(err.userMessage || 'Failed to close event');
      setCloseDialogVisible(false);
    }
  });

  // Status Change Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatusId: number) => {
      if (!event) throw new Error('Event not loaded');
      const payload = {
        ...event,
        statusId: newStatusId,
      };
      const response = await apiClient.put('/events', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      setStatusDialogVisible(false);
      setSuccessMsg('Status updated successfully');
    },
    onError: (err: any) => {
      setErrorMsg(err.userMessage || 'Failed to update status');
      setStatusDialogVisible(false);
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCloseEvent = () => {
    closeEventMutation.mutate();
  };

  const confirmStatusChange = (statusId: number) => {
    setPendingStatusId(statusId);
    setStatusDialogVisible(true);
  };

  const handleStatusChangeConfirm = () => {
    if (pendingStatusId) {
      updateStatusMutation.mutate(pendingStatusId);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader title="Event Details" showBack={true} onBack={() => navigation.goBack()} />
        <LoadingSpinner />
      </View>
    );
  }

  if (isError || !event) {
    return (
      <View style={styles.errorView}>
        <AppHeader title="Event Details" showBack={true} onBack={() => navigation.goBack()} />
        <View style={styles.errorContent}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={themeColors.error} />
          <Text style={{ marginTop: 12 }}>Error fetching event details</Text>
          <Button mode="outlined" style={{ marginTop: 16 }} onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  const isClosed = event.isClosed === true || event.statusId === EventStatus.CLOSED;
  const isCancelled = event.statusId === EventStatus.REJECTED || (event.statusId as any) === 5;
  const paid = event.paidAmount || 0;
  const total = event.totalAmount || 0;
  const remainingAmount = total - paid;

  let paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' = 'UNPAID';
  if (paid >= total && total > 0) {
    paymentStatus = 'PAID';
  } else if (paid > 0) {
    paymentStatus = 'PARTIAL';
  }

  const statusText = isCancelled ? 'REJECTED' : isClosed ? 'CLOSED' : event.statusId === EventStatus.APPROVED ? 'APPROVED' : event.statusId === EventStatus.IN_PROGRESS ? 'IN_PROGRESS' : 'PENDING';

  return (
    <View style={styles.container}>
      <AppHeader
        title="Event Details"
        showBack={true}
        onBack={() => navigation.goBack()}
        rightActionIcon={!isClosed && !isCancelled ? 'pencil' : undefined}
        onRightAction={!isClosed && !isCancelled ? () => navigation.navigate('EventForm', { id: String(event.eventId) }) : undefined}
      />

      {/* Banner for LOCKED state */}
      {isClosed && (
        <Banner
          visible={true}
          actions={[]}
          icon={({ size }) => <MaterialCommunityIcons name="lock" size={size} color={themeColors.error} />}
          style={styles.lockedBanner}
        >
          <Text style={styles.lockedBannerText}>
            LOCKED: This bill has been finalized and cannot be modified.
          </Text>
        </Banner>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[themeColors.primary]} />
        }
      >
        {/* Core Header Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View>
                <Text variant="headlineSmall" style={styles.eventType}>
                  {event.eventType}
                </Text>
                <Text style={styles.eventDate}>
                  Date: {event.endDate ? `${formatDate(event.startDate)} to ${formatDate(event.endDate)}` : formatDate(event.startDate)}
                </Text>
              </View>
              {isClosed ? (
                <Badge style={styles.lockedBadge}>LOCKED</Badge>
              ) : isCancelled ? (
                <Badge style={[styles.statusBadge, { backgroundColor: themeColors.error }]}>CANCELLED</Badge>
              ) : (
                <Badge style={[styles.statusBadge, { backgroundColor: themeColors.primary }]}>
                  {statusText}
                </Badge>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Family Details */}
        <Card style={styles.card}>
          <Card.Title
            title="Family Contact Details"
            left={(props) => <MaterialCommunityIcons {...props} name="account-group" size={24} color={themeColors.secondary} />}
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Family Head</Text>
              <Text style={styles.infoValue}>{event.familyHeadName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact Number</Text>
              <Text style={styles.infoValue}>{event.contactNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{event.email || 'N/A'}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Selected Items / Snapshot Prices */}
        <Card style={styles.card}>
          <Card.Title
            title="Selected Items & Snapshot Pricing"
            left={(props) => <MaterialCommunityIcons {...props} name="package-variant-closed" size={24} color={themeColors.secondary} />}
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            {event.items && event.items.length > 0 ? (
              event.items.map((item, index) => (
                <View key={item.itemId || index} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.itemName}</Text>
                    <Text style={styles.itemSnapshot}>
                      Qty: {item.quantity} x {formatCurrency(item.priceAtBooking)}
                    </Text>
                  </View>
                  <Text style={styles.itemSubtotal}>
                    {formatCurrency(item.quantity * item.priceAtBooking)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyItemsText}>No items requested for this event booking.</Text>
            )}
          </Card.Content>
        </Card>

        {/* Bill Summary */}
        <Card style={styles.card}>
          <Card.Title
            title="Payment & Bill Summary"
            left={(props) => <MaterialCommunityIcons {...props} name="receipt" size={24} color={themeColors.secondary} />}
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Total Booking Charge</Text>
              <Text style={styles.billingVal}>{formatCurrency(event.totalAmount)}</Text>
            </View>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Paid Amount</Text>
              <Text style={[styles.billingVal, { color: themeColors.success }]}>
                {formatCurrency(paid)}
              </Text>
            </View>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Outstanding Balance</Text>
              <Text style={[styles.billingVal, { color: remainingAmount > 0 ? themeColors.error : themeColors.text }]}>
                {formatCurrency(remainingAmount)}
              </Text>
            </View>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Payment Status</Text>
              <Text style={[styles.billingVal, { fontWeight: 'bold' }]}>
                {paymentStatus}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        {!isClosed && !isCancelled && (
          <View style={styles.actionContainer}>
            {event.statusId === EventStatus.PENDING && isAdmin && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Button
                  mode="contained"
                  onPress={() => confirmStatusChange(EventStatus.APPROVED)}
                  buttonColor={themeColors.success}
                  icon="check-circle-outline"
                  style={{ paddingHorizontal: 16 }}
                  disabled={updateStatusMutation.isPending || closeEventMutation.isPending}
                >
                  APPROVE EVENT
                </Button>
                <Button
                  mode="contained"
                  onPress={() => confirmStatusChange(EventStatus.REJECTED)}
                  buttonColor={themeColors.error}
                  icon="close-circle-outline"
                  style={{ paddingHorizontal: 16 }}
                  disabled={updateStatusMutation.isPending || closeEventMutation.isPending}
                >
                  REJECT EVENT
                </Button>
              </View>
            )}
            {event.statusId === EventStatus.APPROVED && (
              <Button
                mode="contained"
                onPress={() => confirmStatusChange(EventStatus.IN_PROGRESS)}
                buttonColor={themeColors.primary}
                icon="play-circle-outline"
                style={styles.actionBtn}
                disabled={updateStatusMutation.isPending || closeEventMutation.isPending}
              >
                MARK IN PROGRESS
              </Button>
            )}
            {isAdmin && event.statusId === EventStatus.IN_PROGRESS && (
              <Button
                mode="contained"
                onPress={() => setCloseDialogVisible(true)}
                buttonColor={themeColors.error}
                icon="lock-outline"
                style={styles.actionBtn}
                disabled={updateStatusMutation.isPending || closeEventMutation.isPending}
              >
                CLOSE & LOCK EVENT
              </Button>
            )}
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('EventForm', { id: String(event.eventId) })}
              style={styles.editBtn}
              textColor={themeColors.secondary}
              disabled={updateStatusMutation.isPending || closeEventMutation.isPending}
            >
              EDIT BOOKING
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Confirmation for Closing Billing */}
      <ConfirmationDialog
        visible={closeDialogVisible}
        title="Close Event Billing"
        message="Are you sure you want to close and lock this event booking? Once closed, items selection and billing totals will be locked permanently and cannot be modified."
        confirmLabel="Close Event"
        cancelLabel="Keep Open"
        onConfirm={handleCloseEvent}
        onCancel={() => setCloseDialogVisible(false)}
        loading={closeEventMutation.isPending}
      />

      <ConfirmationDialog
        visible={statusDialogVisible}
        title="Change Event Status"
        message={`Are you sure you want to change the status to ${pendingStatusId === 2 ? 'APPROVED' : pendingStatusId === 4 ? 'CANCELLED' : 'IN PROGRESS'}?`}
        confirmLabel="Update Status"
        cancelLabel="Cancel"
        onConfirm={handleStatusChangeConfirm}
        onCancel={() => setStatusDialogVisible(false)}
        loading={updateStatusMutation.isPending}
      />

      <Snackbar
        visible={!!successMsg}
        onDismiss={() => setSuccessMsg(null)}
        duration={3000}
        style={{ backgroundColor: themeColors.success }}
      >
        {successMsg}
      </Snackbar>

      <Snackbar
        visible={!!errorMsg}
        onDismiss={() => setErrorMsg(null)}
        duration={4000}
        style={{ backgroundColor: themeColors.error }}
        action={{ label: 'Close', onPress: () => setErrorMsg(null) }}
      >
        {errorMsg}
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
    paddingBottom: 40,
  },
  lockedBanner: {
    backgroundColor: '#FEE2E2',
  },
  lockedBannerText: {
    color: themeColors.error,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    ...shadows.soft,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: themeColors.text,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventType: {
    fontWeight: 'bold',
    color: themeColors.text,
  },
  eventDate: {
    color: themeColors.textMuted,
    marginTop: 4,
  },
  statusBadge: {
    color: '#FFFFFF',
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  lockedBadge: {
    backgroundColor: themeColors.error,
    color: '#FFFFFF',
    paddingHorizontal: 8,
    borderRadius: 4,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  infoLabel: {
    color: themeColors.textMuted,
    fontSize: 14,
  },
  infoValue: {
    fontWeight: '500',
    color: themeColors.text,
    fontSize: 14,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  itemName: {
    fontWeight: '500',
    color: themeColors.text,
  },
  itemSnapshot: {
    color: themeColors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  itemSubtotal: {
    fontWeight: '600',
    color: themeColors.text,
  },
  emptyItemsText: {
    color: themeColors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  billingLabel: {
    color: themeColors.text,
    fontSize: 14,
  },
  billingVal: {
    fontSize: 14,
    fontWeight: '500',
    color: themeColors.text,
  },
  actionContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  actionBtn: {
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'center',
    paddingHorizontal: 20,
    minWidth: 180,
  },
  editBtn: {
    borderRadius: 8,
    borderColor: themeColors.secondary,
    alignSelf: 'center',
    paddingHorizontal: 20,
    minWidth: 180,
  },
  errorView: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EventDetailsScreen;
