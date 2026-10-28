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
import { donorApi } from '../../api/services/donorApi';
import { formatCurrency, formatFullDate } from '../../utils/format';
import { Donor } from '../../types';

type RoutePropType = RouteProp<RootStackParamList, 'DonorDetails'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

export const DonorDetailsScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const { id } = route.params;

  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const { data: donor, isLoading, isError } = useQuery<Donor>({
    queryKey: ['donor', id],
    queryFn: () => donorApi.getDonorById(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => donorApi.deleteDonor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      setDeleteVisible(false);
      navigation.goBack();
    },
    onError: () => {
      setDeleteVisible(false);
    },
  });

  const handleDelete = () => {
    if (!isAdmin) {
      showGlobalToast({ message: 'Only Admin users can delete donor records.', type: 'error' });
      return;
    }
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader title="Donor Details" showBack={true} onBack={() => navigation.goBack()} />
        <LoadingSpinner />
      </View>
    );
  }

  if (isError || !donor) {
    return (
      <View style={{ flex: 1, backgroundColor: themeColors.background }}>
        <AppHeader title="Donor Details" showBack={true} onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={themeColors.error} />
          <Text style={styles.errorText}>Error loading donor details.</Text>
          <Button onPress={() => navigation.goBack()} mode="outlined" style={styles.backBtn}>
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Donor Details"
        showBack={true}
        onBack={() => navigation.goBack()}
        rightActionIcon={isAdmin ? "pencil" : undefined}
        onRightAction={isAdmin ? () => navigation.navigate('DonorForm', { id: String(donor.donorId) }) : undefined}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <MaterialCommunityIcons name="hand-heart" size={40} color="#FFFFFF" />
              </View>
              <Text variant="headlineSmall" style={styles.name}>
                {donor.fullName}
              </Text>
              <Text variant="titleMedium" style={styles.amount}>
                {formatCurrency(donor.amount)}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="calendar" size={20} color={themeColors.textMuted} style={styles.icon} />
                <View>
                  <Text style={styles.detailLabel}>Donation Date</Text>
                  <Text style={styles.detailValue}>{formatFullDate(donor.donationDate)}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="text-box-outline" size={20} color={themeColors.textMuted} style={styles.icon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Remarks</Text>
                  <Text style={[styles.detailValue, !donor.remarks && styles.italic]}>
                    {donor.remarks || 'No remarks provided.'}
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {isAdmin && (
          <View style={styles.btnRow}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('DonorForm', { id: String(donor.donorId) })}
              buttonColor={themeColors.primary}
              icon="pencil"
              style={styles.btn}
            >
              Edit Donor
            </Button>
            <Button
              mode="outlined"
              onPress={() => setDeleteVisible(true)}
              textColor={themeColors.error}
              icon="delete"
              style={[styles.btn, { borderColor: themeColors.error }]}
            >
              Delete Donor
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={deleteVisible}
        title="Delete Donor"
        message={`Are you sure you want to delete donor "${donor.fullName}"? This action cannot be undone.`}
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
    backgroundColor: themeColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontWeight: 'bold',
    color: themeColors.text,
    textAlign: 'center',
  },
  amount: {
    fontWeight: 'bold',
    color: themeColors.success,
    marginTop: 8,
  },
  detailSection: {
    paddingTop: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  icon: {
    marginRight: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: themeColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: themeColors.text,
    marginTop: 2,
    fontWeight: '500',
  },
  italic: {
    fontStyle: 'italic',
    color: themeColors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: themeColors.border,
    marginVertical: 4,
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    color: themeColors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 24,
    borderColor: themeColors.primary,
  },
});

export default DonorDetailsScreen;
