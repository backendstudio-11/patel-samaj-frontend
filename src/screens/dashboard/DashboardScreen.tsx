import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
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
import { formatDate, ensureArray } from '../../utils/format';
import { Event, PageResponse } from '../../types/index';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  const today = new Date();
  const [viewDate, setViewDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));

  const { data: rawEvents, refetch: refetchInProgress } = useQuery<PageResponse<Event>>({
    queryKey: ['events', 'in-progress'],
    queryFn: () => eventApi.getInProgressEvents({ search: '', page: 0, size: 50 }) as Promise<PageResponse<Event>>,
  });

  const { data: calendarCountsData, refetch: refetchCalendarCounts } = useQuery({
    queryKey: ['events', 'calendar-counts'],
    queryFn: () => eventApi.getCalendarCounts(),
  });

  const inProgressEvents: Event[] = ensureArray<Event>(rawEvents);

  useFocusEffect(
    React.useCallback(() => {
      refetchInProgress();
      refetchCalendarCounts();
    }, [refetchInProgress, refetchCalendarCounts])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchInProgress(), refetchCalendarCounts()]);
    setRefreshing(false);
  };

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

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const handlePrevMonth = () => {
    if (!isCurrentMonth) {
      setViewDate(new Date(year, month - 1, 1));
    }
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const eventCountsByDate: { [dateStr: string]: number } = {};
  inProgressEvents.forEach((evt) => {
    if (!evt.startDate) return;
    const startStr = new Date(evt.startDate).toISOString().split('T')[0];
    const endStr = evt.endDate ? new Date(evt.endDate).toISOString().split('T')[0] : startStr;

    let curr = new Date(startStr);
    const end = new Date(endStr);
    while (curr <= end) {
      const key = curr.toISOString().split('T')[0];
      eventCountsByDate[key] = (eventCountsByDate[key] || 0) + 1;
      curr.setDate(curr.getDate() + 1);
    }
  });

  const isDateBooked = (dateStr: string): boolean => {
    if (!dateStr) return false;

    if (calendarCountsData) {
      if (Array.isArray(calendarCountsData)) {
        if (calendarCountsData.includes(dateStr)) return true;
      } else if (typeof calendarCountsData === 'object') {
        const val = (calendarCountsData as any)[dateStr];
        if (typeof val === 'number' && val > 0) return true;
        if (typeof val === 'boolean' && val) return true;
      }
    }

    return (eventCountsByDate[dateStr] || 0) > 0;
  };

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysGrid: Array<{ day: number | null; dateStr: string | null; isToday: boolean; isPast: boolean }> = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    daysGrid.push({ day: null, dateStr: null, isToday: false, isPast: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dObj = new Date(year, month, d);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isTd = dObj.toDateString() === today.toDateString();
    const isPst = dObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    daysGrid.push({ day: d, dateStr, isToday: isTd, isPast: isPst });
  }

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
        <Card style={styles.calendarCard}>
          <Card.Content style={{ padding: 12 }}>
            <View style={styles.calendarHeaderRow}>
              <TouchableOpacity onPress={handlePrevMonth} disabled={isCurrentMonth} style={{ padding: 4 }}>
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={28}
                  color={isCurrentMonth ? themeColors.border : themeColors.primary}
                />
              </TouchableOpacity>
              <Text style={styles.monthTitleText}>{monthName}</Text>
              <TouchableOpacity onPress={handleNextMonth} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="chevron-right" size={28} color={themeColors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdaysRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((wd) => (
                <Text key={wd} style={styles.weekdayLabel}>{wd}</Text>
              ))}
            </View>

            <View style={styles.daysGridContainer}>
              {daysGrid.map((item, idx) => {
                if (!item.day || !item.dateStr) {
                  return <View key={`blank-${idx}`} style={styles.dayCell} />;
                }

                const isBooked = isDateBooked(item.dateStr);

                return (
                  <View
                    key={item.dateStr}
                    style={[
                      styles.dayCell,
                      isBooked && styles.bookedDayCell,
                      item.isToday && styles.todayCell,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        isBooked && styles.bookedDayNumberText,
                        item.isToday && styles.todayNumberText,
                        item.isPast && !item.isToday && !isBooked && { color: themeColors.textMuted },
                      ]}
                    >
                      {item.day}
                    </Text>
                    {isBooked && <View style={styles.bookedDot} />}
                  </View>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        {isAdmin && (
          <>
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
            </View>
          </>
        )}

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
  calendarCard: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    ...shadows.soft,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  monthTitleText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: themeColors.secondary,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: themeColors.textMuted,
  },
  daysGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: themeColors.primary,
  },
  bookedDayCell: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: themeColors.primary,
  },
  dayNumberText: {
    fontSize: 13,
    fontWeight: '500',
    color: themeColors.text,
  },
  todayNumberText: {
    fontWeight: 'bold',
    color: themeColors.primary,
  },
  bookedDayNumberText: {
    fontWeight: 'bold',
    color: themeColors.primary,
  },
  bookedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: themeColors.primary,
    marginTop: 2,
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
