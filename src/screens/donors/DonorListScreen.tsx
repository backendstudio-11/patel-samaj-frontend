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
import { donorApi } from '../../api/services/donorApi';
import { formatCurrency, formatDate } from '../../utils/format';
import { useDebounce } from '../../hooks/useDebounce';
import { Donor, PageResponse } from '../../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const DonorListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  // Query Donors via donorApi with debounced search
  const { data: pageData, isLoading, refetch } = useQuery<PageResponse<Donor>>({
    queryKey: ['donors', debouncedSearch, page, pageSize],
    queryFn: () => donorApi.getDonors({ search: debouncedSearch, page, size: pageSize }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => donorApi.deleteDonor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      setDeleteId(null);
    },
    onError: () => {
      setDeleteId(null);
    },
  });

  const donors = pageData?.content || [];
  const totalPages = pageData?.totalPages || 1;
  const totalElements = pageData?.totalElements || donors.length;

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
      <AppHeader title="Donors" />

      <View style={styles.searchSection}>
        <SearchBar
          placeholder="Search donors by name..."
          value={search}
          onChangeText={handleSearchChange}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={donors}
          keyExtractor={(item) => String(item.donorId)}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[themeColors.primary]} />
          }
          renderItem={({ item }) => (
            <ReusableCard
              onPress={() => navigation.navigate('DonorDetails', { id: String(item.donorId) })}
              accentColor={themeColors.primary}
            >
              <View style={styles.cardHeader}>
                <Text variant="titleMedium" style={styles.donorName}>
                  {item.fullName}
                </Text>
                <Text variant="titleMedium" style={styles.donorAmount}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text variant="bodyMedium" style={styles.dateLabel}>
                  Donated on: {formatDate(item.donationDate)}
                </Text>
                {item.remarks !== null && item.remarks !== undefined && item.remarks.trim() !== '' ? (
                  <Text variant="bodySmall" style={styles.remarksLabel} numberOfLines={1}>
                    {`"${item.remarks}"`}
                  </Text>
                ) : null}
              </View>

              {isAdmin && (
                <View style={styles.cardActions}>
                  <IconButton
                    icon="pencil-outline"
                    size={20}
                    iconColor={themeColors.secondary}
                    onPress={() => navigation.navigate('DonorForm', { id: String(item.donorId) })}
                  />
                  <IconButton
                    icon="delete-outline"
                    size={20}
                    iconColor={themeColors.error}
                    onPress={() => setDeleteId(String(item.donorId))}
                  />
                </View>
              )}
            </ReusableCard>
          )}
          ListFooterComponent={
            donors.length > 0 ? (
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
              icon="hand-heart-outline"
              title="No Donors Found"
              description={search ? "No donors matched your search criteria." : "There are currently no donors registered."}
              actionLabel={isAdmin ? "Add First Donor" : undefined}
              onAction={isAdmin ? () => navigation.navigate('DonorForm') : undefined}
            />
          }
        />
      )}

      {isAdmin && (
        <FAB
          icon="plus"
          label="Add Donor"
          style={[styles.fab, { backgroundColor: themeColors.primary }]}
          color="#FFFFFF"
          onPress={() => navigation.navigate('DonorForm')}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={!!deleteId}
        title="Delete Donor"
        message="Are you sure you want to delete this donor record? This action cannot be undone."
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
    marginBottom: 8,
  },
  donorName: {
    fontWeight: 'bold',
    color: themeColors.text,
    flex: 1,
    marginRight: 8,
  },
  donorAmount: {
    fontWeight: 'bold',
    color: themeColors.success,
  },
  cardFooter: {
    marginTop: 4,
  },
  dateLabel: {
    color: themeColors.textMuted,
  },
  remarksLabel: {
    color: themeColors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
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

export default DonorListScreen;
