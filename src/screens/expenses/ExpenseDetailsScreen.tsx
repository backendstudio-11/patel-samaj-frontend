import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { themeColors } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { showGlobalToast } from '../../context/ToastContext';
import { RootStackParamList } from '../../navigation/types';
import { expenseApi } from '../../api/services/expenseApi';
import { formatCurrency, formatFullDate } from '../../utils/format';
import { Expense } from '../../types';

type RoutePropType = RouteProp<RootStackParamList, 'ExpenseDetails'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

export const ExpenseDetailsScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const { id } = route.params;

  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const { data: expense, isLoading, isError } = useQuery<Expense>({
    queryKey: ['expense', id],
    queryFn: () => expenseApi.getExpenseById(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => expenseApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setDeleteVisible(false);
      navigation.goBack();
    },
    onError: () => {
      setDeleteVisible(false);
    },
  });

  const handleDelete = () => {
    if (!isAdmin) {
      showGlobalToast({ message: 'Only Admin users can delete expense records.', type: 'error' });
      return;
    }
    deleteMutation.mutate();
  };

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
          <View style={styles.btnRow}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('ExpenseForm', { id: String(expense.expenseId) })}
              buttonColor={themeColors.primary}
              icon="pencil"
              style={styles.btn}
            >
              Edit Expense
            </Button>
            <Button
              mode="outlined"
              onPress={() => setDeleteVisible(true)}
              textColor={themeColors.error}
              icon="delete"
              style={[styles.btn, { borderColor: themeColors.error }]}
            >
              Delete Expense
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={deleteVisible}
        title="Delete Expense"
        message={`Are you sure you want to delete this expense of ${formatCurrency(expense.amount)}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteVisible(false)}
        loading={deleteMutation.isPending}
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
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  btn: {
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    minWidth: 130,
    flex: 1,
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
