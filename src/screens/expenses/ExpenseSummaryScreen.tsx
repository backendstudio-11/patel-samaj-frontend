import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { themeColors, shadows } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { expenseApi } from '../../api/services/expenseApi';
import { formatCurrency } from '../../utils/format';
import { Expense } from '../../types';

export const ExpenseSummaryScreen: React.FC = () => {
  const navigation = useNavigation();

  // Queries
  const { data: expenses = [], isLoading: loadingExpenses } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await expenseApi.getExpenses({ search: '', page: 0, size: 100 });
      return (res as any)?.content || res || [];
    },
  });

  if (loadingExpenses) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader title="Financial Summary" showBack={true} onBack={() => navigation.goBack()} />
        <LoadingSpinner />
      </View>
    );
  }

  // Calc Statistics
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const totalSum = expenses.reduce((s, e) => s + e.amount, 0);

  // Today Outflow
  const todayExpenses = expenses.filter((e) => {
    const dStr = new Date(e.expenseDate).toISOString().split('T')[0];
    return dStr === todayStr;
  });
  const todaySum = todayExpenses.reduce((s, e) => s + e.amount, 0);

  // Monthly Outflow
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthlyExpenses = expenses.filter((e) => {
    const d = new Date(e.expenseDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthlySum = monthlyExpenses.reduce((s, e) => s + e.amount, 0);

  const categoriesMap: { [key: string]: number } = {};
  expenses.forEach((e) => {
    const cat = e.category || 'Uncategorized';
    categoriesMap[cat] = (categoriesMap[cat] || 0) + e.amount;
  });

  const categoryList = Object.keys(categoriesMap).map((cat) => ({
    name: cat,
    amount: categoriesMap[cat],
    percentage: totalSum > 0 ? (categoriesMap[cat] / totalSum) * 100 : 0,
  })).sort((a, b) => b.amount - a.amount);

  // Category Chart Color mapping
  const chartColors = ['#F97316', '#1E293B', '#3B82F6', '#22C55E', '#EC4899', '#A855F7', '#64748B'];

  return (
    <View style={styles.container}>
      <AppHeader title="Financial Summary" showBack={true} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* KPI Cards */}
        <View style={styles.kpiContainer}>
          <Card style={[styles.kpiCard, { borderLeftColor: themeColors.primary, borderLeftWidth: 4 }]}>
            <Card.Content style={styles.kpiContent}>
              <Text style={styles.kpiLabel}>Today's Expense</Text>
              <Text style={styles.kpiValue}>{formatCurrency(todaySum)}</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.kpiCard, { borderLeftColor: '#3B82F6', borderLeftWidth: 4 }]}>
            <Card.Content style={styles.kpiContent}>
              <Text style={styles.kpiLabel}>This Month</Text>
              <Text style={[styles.kpiValue, { color: '#3B82F6' }]}>{formatCurrency(monthlySum)}</Text>
            </Card.Content>
          </Card>
        </View>

        <Card style={[styles.kpiCardFull, { borderLeftColor: themeColors.secondary, borderLeftWidth: 4 }]}>
          <Card.Content>
            <Text style={styles.kpiLabel}>All-Time Outflow</Text>
            <Text style={[styles.kpiValueLarge, { color: themeColors.secondary }]}>
              {formatCurrency(totalSum)}
            </Text>
          </Card.Content>
        </Card>

        {/* Expense Category Breakdown with progress bars */}
        <Card style={styles.sectionCard}>
          <Card.Title
            title="Expenses by Category"
            left={(props) => <MaterialCommunityIcons {...props} name="chart-pie" size={24} color={themeColors.primary} />}
            titleStyle={styles.cardHeaderTitle}
          />
          <Card.Content>
            {categoryList.map((item, index) => {
              const color = chartColors[index % chartColors.length];
              return (
                <View key={item.name} style={styles.categoryRow}>
                  <View style={styles.catLabelRow}>
                    <View style={[styles.colorIndicator, { backgroundColor: color }]} />
                    <Text style={styles.catName}>{item.name}</Text>
                    <Text style={styles.catAmt}>{formatCurrency(item.amount)}</Text>
                  </View>
                  {/* Custom Svg styled percent bar */}
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${item.percentage}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={styles.catPercent}>{item.percentage.toFixed(1)}% of total</Text>
                </View>
              );
            })}
            {categoryList.length === 0 && (
              <Text style={styles.emptyText}>No category distribution records found.</Text>
            )}
          </Card.Content>
        </Card>
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
    padding: 16,
    paddingBottom: 40,
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpiCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    ...shadows.soft,
  },
  kpiCardFull: {
    marginVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    ...shadows.soft,
  },
  kpiContent: {
    padding: 12,
  },
  kpiLabel: {
    fontSize: 12,
    color: themeColors.textMuted,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.primary,
    marginTop: 6,
  },
  kpiValueLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    ...shadows.soft,
  },
  cardHeaderTitle: {
    fontWeight: 'bold',
    color: themeColors.text,
  },
  categoryRow: {
    marginBottom: 16,
  },
  catLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  catName: {
    flex: 1,
    fontWeight: '500',
    color: themeColors.text,
  },
  catAmt: {
    fontWeight: '600',
    color: themeColors.text,
  },
  progressContainer: {
    height: 8,
    backgroundColor: themeColors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  catPercent: {
    fontSize: 11,
    color: themeColors.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: themeColors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 16,
  },
});

export default ExpenseSummaryScreen;
