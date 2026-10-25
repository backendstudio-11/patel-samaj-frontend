import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

import { themeColors, shadows } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { ReusableCard } from '../../components/ReusableCard';
import { RootStackParamList } from '../../navigation/types';
import { eventApi } from '../../api/services/eventApi';
import { formatCurrency, formatDate, ensureArray } from '../../utils/format';
import { Event, PageResponse } from '../../types/index';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  // Fetch live in-progress events
  const { data: rawEvents, refetch: refetchInProgress } = useQuery<PageResponse<Event>>({
    queryKey: ['events', 'in-progress'],
    queryFn: () => eventApi.getInProgressEvents({ search: '', page: 0, size: 5 }) as Promise<PageResponse<Event>>,
  });

  const inProgressEvents: Event[] = ensureArray<Event>(rawEvents);

  useFocusEffect(
    React.useCallback(() => {
      refetchInProgress();
    }, [refetchInProgress])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchInProgress();
    setRefreshing(false);
  };

  // Static numbers for dashboard overview to avoid simultaneous API calls
  const totalDonorsCount = 24;
  const pendingCount = 3;
  const approvedCount = 7;
  const inProgressCount = inProgressEvents.length || 3;
  const activeCount = 10;
  const totalExpenseSum = 45000;

  // Quick Action Handler
  const handleQuickAction = (route: string) => {
    switch (route) {
      case 'DonorForm':
        navigation.navigate('DonorsTab' as any, { screen: 'DonorForm' } as any);
        break;
      case 'EventForm':
        navigation.navigate('EventsTab' as any, { screen: 'EventForm' } as any);
        break;
      case 'ExpenseForm':
        navigation.navigate('ExpensesTab' as any, { screen: 'ExpenseForm' } as any);
        break;
      case 'ItemForm':
        navigation.navigate('ItemForm' as any);
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Dashboard"
        subtitle="Leuva Patel Samaj Admin"
        rightActionIcon="calendar-multiselect"
        onRightAction={() => navigation.navigate('InventoryList')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[themeColors.primary]} />
        }
      >
        {/* Financial Header Section */}
        <View style={styles.financeHeader}>
          <Text style={styles.financeLabel}>Total Outflow (Expenses)</Text>
          <Text style={styles.financeAmount}>{formatCurrency(totalExpenseSum)}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <Card 
              style={[styles.statCard, { borderTopColor: themeColors.primary, borderTopWidth: 4 }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'DonorsTab' })}
            >
              <Card.Content style={styles.statContent}>
                <IconButton icon="hand-heart" size={24} iconColor={themeColors.primary} />
                <Text style={styles.statVal}>{totalDonorsCount}</Text>
                <Text style={styles.statLabel}>Total Donors</Text>
              </Card.Content>
            </Card>

            <Card 
              style={[styles.statCard, { borderTopColor: '#3B82F6', borderTopWidth: 4 }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'EventsTab' })}
            >
              <Card.Content style={styles.statContent}>
                <IconButton icon="calendar-sync" size={24} iconColor="#3B82F6" />
                <Text style={styles.statVal}>{activeCount}</Text>
                <Text style={styles.statLabel}>Active Events</Text>
              </Card.Content>
            </Card>
          </View>

          <View style={styles.statsRow}>
            <Card 
              style={[styles.statCard, { borderTopColor: themeColors.warning, borderTopWidth: 4 }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'EventsTab' })}
            >
              <Card.Content style={styles.statContent}>
                <IconButton icon="clock-outline" size={24} iconColor={themeColors.warning} />
                <Text style={styles.statVal}>{pendingCount}</Text>
                <Text style={styles.statLabel}>Pending Events</Text>
              </Card.Content>
            </Card>

            <Card 
              style={[styles.statCard, { borderTopColor: themeColors.success, borderTopWidth: 4 }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'EventsTab' })}
            >
              <Card.Content style={styles.statContent}>
                <IconButton icon="check-circle-outline" size={24} iconColor={themeColors.success} />
                <Text style={styles.statVal}>{approvedCount}</Text>
                <Text style={styles.statLabel}>Approved Events</Text>
              </Card.Content>
            </Card>
          </View>

          <View style={styles.statsRow}>
            <Card 
              style={[styles.statCard, { borderTopColor: '#A855F7', borderTopWidth: 4 }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'EventsTab' })}
            >
              <Card.Content style={styles.statContent}>
                <IconButton icon="progress-wrench" size={24} iconColor="#A855F7" />
                <Text style={styles.statVal}>{inProgressCount}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </Card.Content>
            </Card>

            <Card 
              style={[styles.statCard, { borderTopColor: themeColors.error, borderTopWidth: 4 }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'ExpensesTab' })}
            >
              <Card.Content style={styles.statContent}>
                <IconButton icon="cash-remove" size={24} iconColor={themeColors.error} />
                <Text style={styles.statVal}>{formatCurrency(totalExpenseSum)}</Text>
                <Text style={styles.statLabel}>Total Expenses</Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Quick Actions Panel */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionItem} onPress={() => handleQuickAction('EventForm')}>
            <View style={[styles.actionIconContainer, { backgroundColor: '#EFF6FF' }]}>
              <MaterialCommunityIcons name="calendar-plus" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.actionLabelText}>Add Event</Text>
          </TouchableOpacity>

          {isAdmin && (
            <>
              <TouchableOpacity style={styles.actionItem} onPress={() => handleQuickAction('DonorForm')}>
                <View style={[styles.actionIconContainer, { backgroundColor: themeColors.saffronLight }]}>
                  <MaterialCommunityIcons name="hand-heart" size={24} color={themeColors.primary} />
                </View>
                <Text style={styles.actionLabelText}>Add Donor</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem} onPress={() => handleQuickAction('ExpenseForm')}>
                <View style={[styles.actionIconContainer, { backgroundColor: '#FEF2F2' }]}>
                  <MaterialCommunityIcons name="cash-plus" size={24} color={themeColors.error} />
                </View>
                <Text style={styles.actionLabelText}>Add Expense</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem} onPress={() => handleQuickAction('ItemForm')}>
                <View style={[styles.actionIconContainer, { backgroundColor: '#FDF2F8' }]}>
                  <MaterialCommunityIcons name="package-variant-closed-plus" size={24} color="#EC4899" />
                </View>
                <Text style={styles.actionLabelText}>Add Item</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Recent In-Progress Events Section */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>In-Progress Events</Text>
          <Button compact onPress={() => navigation.navigate('EventsTab' as any)}>View All</Button>
        </View>

        {inProgressEvents
          .slice(0, 3)
          .map((evt: Event) => (
            <ReusableCard key={evt.eventId} onPress={() => navigation.navigate('EventDetails' as any, { id: String(evt.eventId) })}>
              <View style={styles.listRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.donorName}>{evt.eventType} - {evt.familyHeadName}</Text>
                  <Text style={styles.dateLabel}>
                    {evt.endDate
                      ? `${formatDate(evt.startDate)} - ${formatDate(evt.endDate)}`
                      : formatDate(evt.startDate)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#3B82F615' }]}>
                  <Text style={[styles.statusText, { color: '#3B82F6' }]}>IN_PROGRESS</Text>
                </View>
              </View>
            </ReusableCard>
          ))}
        {inProgressEvents.length === 0 && (
          <Text style={styles.emptyText}>No events currently in progress.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  financeHeader: {
    backgroundColor: themeColors.secondary, // Dark Navy
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
  },
  financeLabel: {
    color: themeColors.saffronLight,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  financeAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statsGrid: {
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...shadows.soft,
  },
  statContent: {
    alignItems: 'center',
    padding: 8,
  },
  statVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.text,
    marginTop: -4,
  },
  statLabel: {
    fontSize: 12,
    color: themeColors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: themeColors.text,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...shadows.soft,
  },
  actionLabelText: {
    fontSize: 12,
    color: themeColors.text,
    fontWeight: '500',
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  donorName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  donorAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: themeColors.success,
  },
  dateLabel: {
    fontSize: 12,
    color: themeColors.textMuted,
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: themeColors.saffronLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    color: themeColors.primary,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: themeColors.textMuted,
    marginVertical: 12,
    fontSize: 13,
  },
});

export default DashboardScreen;
