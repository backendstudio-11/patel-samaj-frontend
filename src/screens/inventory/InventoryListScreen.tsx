import React, { useState } from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { Text, Banner, FAB, Badge, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { themeColors, shadows } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { SearchBar } from '../../components/SearchBar';
import { ReusableCard } from '../../components/ReusableCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { RootStackParamList } from '../../navigation/types';
import { inventoryApi } from '../../api/services/inventoryApi';
import { formatCurrency } from '../../utils/format';
import { Item } from '../../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const InventoryListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  // Fetch Items Query
  const { data: items = [], isLoading, refetch } = useQuery<Item[]>({
    queryKey: ['items'],
    queryFn: () => inventoryApi.getItems(),
  });

  // Soft Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setDeleteId(null);
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const filteredItems = items.filter((item) =>
    item.itemName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Inventory" showBack={true} onBack={() => navigation.goBack()} />

      {/* Pricing Snapshot Important Warning Banner */}
      <Banner
        visible={bannerVisible}
        actions={[
          {
            label: 'Dismiss',
            onPress: () => setBannerVisible(false),
            textColor: themeColors.primary,
          },
        ]}
        icon={({ size }) => <MaterialCommunityIcons name="information" size={size} color={themeColors.warning} />}
        style={styles.banner}
      >
        <Text style={styles.bannerText}>
          Price updates only affect future bookings. Existing bookings retain snapshot pricing.
        </Text>
      </Banner>

      <View style={styles.searchSection}>
        <SearchBar
          placeholder="Search items by name..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.itemId)}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[themeColors.primary]} />
          }
          renderItem={({ item }) => {
            return (
              <ReusableCard
                onPress={() => navigation.navigate('ItemDetails', { id: String(item.itemId) })}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={styles.itemName}>
                      {item.itemName}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.priceText}>Rental: {formatCurrency(item.currentPrice)} / unit</Text>
                  {item.description ? (
                    <Text style={styles.stockText} numberOfLines={1}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.cardActions}>
                  {isAdmin && (
                    <>
                      <IconButton
                        icon="pencil-outline"
                        size={20}
                        iconColor={themeColors.secondary}
                        onPress={() => navigation.navigate('ItemForm', { id: String(item.itemId) })}
                      />
                      <IconButton
                        icon="delete-outline"
                        size={20}
                        iconColor={themeColors.error}
                        onPress={() => setDeleteId(String(item.itemId))}
                      />
                    </>
                  )}
                </View>
              </ReusableCard>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="package-variant-closed"
              title="No Items Found"
              description={search ? "No items match your search criteria." : "There are currently no items registered in the inventory."}
              actionLabel={isAdmin ? "Add First Item" : undefined}
              onAction={isAdmin ? () => navigation.navigate('ItemForm') : undefined}
            />
          }
        />
      )}

      {isAdmin && (
        <FAB
          icon="plus"
          label="Add Item"
          style={[styles.fab, { backgroundColor: themeColors.primary }]}
          color="#FFFFFF"
          onPress={() => navigation.navigate('ItemForm')}
        />
      )}

      {/* Soft Delete Dialog */}
      <ConfirmationDialog
        visible={!!deleteId}
        title="Delete Item"
        message="Are you sure you want to delete this item? Deleted items will no longer be available for future bookings. Existing event bookings will not be affected."
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
  banner: {
    backgroundColor: '#FEF3C7', // Amber 100
  },
  bannerText: {
    color: '#92400E', // Amber 800
    fontWeight: 'bold',
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontWeight: 'bold',
    color: themeColors.text,
  },
  categoryLabel: {
    color: themeColors.textMuted,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  statusBadge: {
    fontWeight: 'bold',
    paddingHorizontal: 8,
    borderRadius: 6,
    height: 24,
    fontSize: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    marginVertical: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '500',
    color: themeColors.text,
  },
  stockText: {
    fontSize: 13,
    color: themeColors.textMuted,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -8,
    marginRight: -8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 16,
  },
});

export default InventoryListScreen;
