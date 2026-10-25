import React, { useState } from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { Text, Switch, FAB, Badge } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { themeColors } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { SearchBar } from '../../components/SearchBar';
import { ReusableCard } from '../../components/ReusableCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { PaginationControl } from '../../components/PaginationControl';
import { RootStackParamList } from '../../navigation/types';
import { userApi } from '../../api/services/userApi';
import { useDebounce } from '../../hooks/useDebounce';
import { UserDTO, PageResponse } from '../../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const AdminListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch admins via userApi with debounced search
  const { data: rawData, isLoading, refetch } = useQuery<UserDTO[] | PageResponse<UserDTO>>({
    queryKey: ['admins', debouncedSearch, page, pageSize],
    queryFn: () => userApi.getAllUsers({ search: debouncedSearch, page, size: pageSize }),
  });

  const adminsData: UserDTO[] = Array.isArray(rawData) ? rawData : (rawData?.content || []);
  const totalPages = (rawData as PageResponse<UserDTO>)?.totalPages || 1;
  const totalElements = (rawData as PageResponse<UserDTO>)?.totalElements || adminsData.length;

  const admins = adminsData.map((item: any) => ({
    userId: item.userId || item.id || 0,
    fullName: item.fullName || item.name || '',
    mobileNumber: item.mobileNumber || item.phone || '',
    isActive: item.isActive !== undefined ? item.isActive : (item.active !== undefined ? item.active : true),
  }));

  // Toggle Admin Status Mutation
  const toggleMutation = useMutation({
    mutationFn: (userId: number) => userApi.toggleUserStatus(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });

  const handleSearchChange = (text: string) => {
    setSearch(text);
    setPage(0);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleToggleStatus = (userId: number) => {
    toggleMutation.mutate(userId);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Admin Management" showBack={true} onBack={() => navigation.goBack()} />

      <View style={styles.searchSection}>
        <SearchBar
          placeholder="Search admins by name..."
          value={search}
          onChangeText={handleSearchChange}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={admins}
          keyExtractor={(item) => String(item.userId)}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[themeColors.primary]} />
          }
          renderItem={({ item }) => (
            <ReusableCard accentColor={themeColors.secondary}>
              <View style={styles.row}>
                <View style={styles.infoCol}>
                  <Text variant="titleMedium" style={styles.name}>
                    {item.fullName}
                  </Text>
                  <Text style={styles.mobile}>{item.mobileNumber}</Text>
                  
                  <View style={styles.badgeRow}>
                    <Badge
                      style={[
                        styles.statusBadge,
                        { backgroundColor: item.isActive ? '#DCFCE7' : '#FEE2E2',
                          color: item.isActive ? themeColors.success : themeColors.error }
                      ]}
                    >
                      {item.isActive ? 'ENABLED' : 'DISABLED'}
                    </Badge>
                  </View>
                </View>

                <View style={styles.switchCol}>
                  <Text style={styles.switchLabel}>Access</Text>
                  <Switch
                    value={item.isActive}
                    onValueChange={() => handleToggleStatus(item.userId)}
                    color={themeColors.primary}
                    disabled={toggleMutation.isPending}
                  />
                </View>
              </View>
            </ReusableCard>
          )}
          ListFooterComponent={
            admins.length > 0 ? (
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
              icon="account-group"
              title="No Admins Found"
              description={search ? "No admin profile matched your search." : "There are no other admin profiles in the system."}
              actionLabel="Invite Admin"
              onAction={() => navigation.navigate('InviteAdmin')}
            />
          }
        />
      )}

      <FAB
        icon="account-plus"
        label="Invite Admin"
        style={[styles.fab, { backgroundColor: themeColors.primary }]}
        color="#FFFFFF"
        onPress={() => navigation.navigate('InviteAdmin')}
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    marginRight: 16,
  },
  name: {
    fontWeight: 'bold',
    color: themeColors.text,
  },
  mobile: {
    color: themeColors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
  },
  switchCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchLabel: {
    fontSize: 11,
    color: themeColors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 70,
  },
});

export default AdminListScreen;
