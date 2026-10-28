import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Button, Badge } from 'react-native-paper';
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
import { RootStackParamList } from '../../navigation/types';
import { inventoryApi } from '../../api/services/inventoryApi';
import { formatCurrency } from '../../utils/format';
import { Item } from '../../types';

type RoutePropType = RouteProp<RootStackParamList, 'ItemDetails'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

export const ItemDetailsScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const { id } = route.params;

  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  const [deleteVisible, setDeleteVisible] = useState(false);

  const { data: item, isLoading, isError, refetch } = useQuery<Item>({
    queryKey: ['item', id],
    queryFn: () => inventoryApi.getItemById(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => inventoryApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setDeleteVisible(false);
      navigation.goBack();
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader title="Item Details" showBack={true} onBack={() => navigation.goBack()} />
        <LoadingSpinner />
      </View>
    );
  }

  if (isError || !item) {
    return (
      <View style={styles.errorContainer}>
        <AppHeader title="Item Details" showBack={true} onBack={() => navigation.goBack()} />
        <View style={styles.errorContent}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={themeColors.error} />
          <Text style={{ marginTop: 12 }}>Error fetching item details</Text>
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
        title="Item Details"
        showBack={true}
        onBack={() => navigation.goBack()}
        rightActionIcon={isAdmin ? "pencil" : undefined}
        onRightAction={isAdmin ? () => navigation.navigate('ItemForm', { id: String(item.itemId) }) : undefined}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <MaterialCommunityIcons name="package-variant-closed" size={40} color="#FFFFFF" />
              </View>
              <Text variant="headlineSmall" style={styles.itemName}>
                {item.itemName}
              </Text>
              <Text variant="titleMedium" style={[styles.priceText, { color: themeColors.primary }]}>
                {formatCurrency(item.currentPrice)} / unit
              </Text>
            </View>

            <View style={styles.detailsGrid}>
              {item.description && (
                <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                  <Text style={[styles.label, { marginBottom: 6 }]}>Description</Text>
                  <Text style={styles.descriptionText}>{item.description}</Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {isAdmin && (
          <View style={styles.btnRow}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('ItemForm', { id: String(item.itemId) })}
              buttonColor={themeColors.primary}
              icon="pencil"
              style={styles.btn}
            >
              Edit Item
            </Button>

            <Button
              mode="outlined"
              onPress={() => setDeleteVisible(true)}
              textColor={themeColors.error}
              icon="delete"
              style={[styles.btn, { borderColor: themeColors.error }]}
            >
              Delete Item
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={deleteVisible}
        title="Delete Item"
        message="Are you sure you want to delete this inventory item? Deleted items will no longer be available for future bookings."
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
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: themeColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemName: {
    fontWeight: 'bold',
    color: themeColors.text,
    textAlign: 'center',
  },
  priceText: {
    fontWeight: 'bold',
    marginTop: 6,
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
  statusBadge: {
    fontWeight: 'bold',
    fontSize: 11,
    borderRadius: 6,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: themeColors.text,
    lineHeight: 20,
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

export default ItemDetailsScreen;
