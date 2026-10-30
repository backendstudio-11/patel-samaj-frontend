import React, { useState } from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { Text, FAB, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

import { themeColors } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { SearchBar } from '../../components/SearchBar';
import { ReusableCard } from '../../components/ReusableCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { PaginationControl } from '../../components/PaginationControl';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { RootStackParamList } from '../../navigation/types';
import { expenseApi } from '../../api/services/expenseApi';
import { formatCurrency, formatDate } from '../../utils/format';
import { useDebounce } from '../../hooks/useDebounce';
import { Expense, PageResponse } from '../../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const ExpenseListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  // Fetch Expenses via expenseApi with debounced search
  const { data: pageData, isLoading, refetch } = useQuery<PageResponse<Expense>>({
    queryKey: ['expenses', debouncedSearch, page, pageSize],
    queryFn: () => expenseApi.getExpenses({ search: debouncedSearch, page, size: pageSize }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setDeleteId(null);
    },
    onError: () => {
      setDeleteId(null);
    },
  });

  const expenses = pageData?.content || [];
  const totalPages = pageData?.totalPages || 1;
  const totalElements = pageData?.totalElements || expenses.length;

  const handleSearchChange = (text: string) => {
    setSearch(text);
    setPage(0);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteId && isAdmin) {
      deleteMutation.mutate(deleteId);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Expenses"
        rightActionIcon="chart-donut"
        onRightAction={() => navigation.navigate('ExpenseSummary')}
      />

      <View style={styles.searchSection}>
        <SearchBar
          placeholder="Search expenses by category or description..."
          value={search}
          onChangeText={handleSearchChange}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => String(item.expenseId)}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[themeColors.primary]} />
          }
          renderItem={({ item }) => (
            <ReusableCard
              onPress={() => navigation.navigate('ExpenseDetails', { id: String(item.expenseId) })}
              accentColor={themeColors.error}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium" style={styles.title}>
                    {item.description || 'Expense'}
                  </Text>
                  <Text style={styles.categoryLabel}>{item.category || 'Uncategorized'}</Text>
                </View>
                <Text style={styles.amount}>
                  - {formatCurrency(item.amount)}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.dateLabel}>Date: {formatDate(item.expenseDate)}</Text>
              </View>

              {isAdmin && (
                <View style={styles.cardActions}>
                  <IconButton
                    icon="pencil-outline"
                    size={20}
                    iconColor={themeColors.secondary}
                    onPress={() => navigation.navigate('ExpenseForm', { id: String(item.expenseId) })}
                  />
                  <IconButton
                    icon="delete-outline"
                    size={20}
                    iconColor={themeColors.error}
                    onPress={() => setDeleteId(String(item.expenseId))}
                  />
                </View>
              )}
            </ReusableCard>
          )}
          ListFooterComponent={
            expenses.length > 0 ? (
              <PaginationControl
                page={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(0);
                }}
              />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="cash-remove"
              title="No Expenses Found"
              description={search ? "No records matched your search." : "No expense outflow recorded yet."}
              actionLabel={isAdmin ? "Add Expense" : undefined}
              onAction={isAdmin ? () => navigation.navigate('ExpenseForm') : undefined}
            />
          }
        />
      )}

      {isAdmin && (
        <FAB
          icon="plus"
          label="Add Expense"
          style={[styles.fab, { backgroundColor: themeColors.primary }]}
          color="#FFFFFF"
          onPress={() => navigation.navigate('ExpenseForm')}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={!!deleteId}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
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
  searchSection: {
    padding: 12,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  listContainer: {
    paddingVertical: 12,
    paddingBottom: 88,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: themeColors.text,
  },
  categoryLabel: {
    fontSize: 12,
    color: themeColors.textMuted,
    marginTop: 2,
  },
  amount: {
    fontWeight: 'bold',
    color: themeColors.error,
    fontSize: 16,
  },
  cardFooter: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
    paddingTop: 6,
  },
  dateLabel: {
    fontSize: 12,
    color: themeColors.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    marginRight: -8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 70,
  },
});

export default ExpenseListScreen;
