import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { themeColors } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { RootStackParamList } from '../../navigation/types';
import apiClient from '../../api/client';
import { formatCurrency, formatFullDate } from '../../utils/format';
import { Expense } from '../../types';

type RoutePropType = RouteProp<RootStackParamList, 'ExpenseDetails'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

export const ExpenseDetailsScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavigationProp>();
  const { id } = route.params;
  const [refreshing, setRefreshing] = React.useState(false);

  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  const { data: expense, isLoading, isError } = useQuery<Expense>({
    queryKey: ['expense', id],
    queryFn: async () => {
      const res = await apiClient.get(`/expenses/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader title="Expense Details" showBack={true} onBack={() => navigation.goBack()} />
        <LoadingSpinner />
      </View>
    );
  }

  if (isError || !expense) {
    return (
      <View style={styles.errorContainer}>
        <AppHeader title="Expense Details" showBack={true} onBack={() => navigation.goBack()} />
        <View style={styles.errorContent}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={themeColors.error} />
          <Text style={{ marginTop: 12 }}>Error fetching expense details</Text>
          <Button mode="outlined" style={{ marginTop: 16 }} onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Expense Details"
        showBack={true}
        onBack={() => navigation.goBack()}
        rightActionIcon={isAdmin ? "pencil" : undefined}
        onRightAction={isAdmin ? () => navigation.navigate('ExpenseForm', { id: String(expense.expenseId) }) : undefined}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <MaterialCommunityIcons name="cash-remove" size={40} color="#FFFFFF" />
              </View>
              <Text variant="headlineSmall" style={styles.title}>
                {expense.description || 'Expense'}
              </Text>
              <Text variant="titleMedium" style={styles.amount}>
                - {formatCurrency(expense.amount)}
              </Text>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Category</Text>
                <Text style={styles.val}>{expense.category || 'Uncategorized'}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.label}>Transaction Date</Text>
                <Text style={styles.val}>{formatFullDate(expense.expenseDate)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                <Text style={[styles.label, { marginBottom: 6 }]}>Description</Text>
                <Text style={[styles.remarksText, !expense.description && styles.italic]}>
                  {expense.description || 'No description provided.'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {isAdmin && (
          <Button
            mode="contained"
            onPress={() => navigation.navigate('ExpenseForm', { id: String(expense.expenseId) })}
            buttonColor={themeColors.primary}
            icon="pencil"
            style={styles.editBtn}
          >
            Edit Expense details
          </Button>
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
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 3,
    marginBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: themeColors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: themeColors.text,
    textAlign: 'center',
  },
  amount: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  detailsGrid: {
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    color: themeColors.textMuted,
  },
  val: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.text,
  },
  remarksText: {
    fontSize: 14,
    color: themeColors.text,
    lineHeight: 20,
  },
  italic: {
    fontStyle: 'italic',
    color: themeColors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: themeColors.border,
  },
  editBtn: {
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 24,
    minWidth: 180,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ExpenseDetailsScreen;
