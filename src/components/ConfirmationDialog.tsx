import React from 'react';
import { StyleSheet, Platform, View, StyleProp, ViewStyle } from 'react-native';
import { Portal, Dialog, Button, Paragraph, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { themeColors } from '../theme';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  icon?: string;
  confirmColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  icon,
  confirmColor = themeColors.error,
  style,
}) => {
  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onCancel}
        style={[styles.dialog, style]}
      >
        <View style={styles.headerContainer}>
          {icon && (
            <View style={[styles.iconBadge, { backgroundColor: `${confirmColor}15` }]}>
              <MaterialCommunityIcons name={icon as any} size={24} color={confirmColor} />
            </View>
          )}
          <Dialog.Title style={styles.title}>
            {title}
          </Dialog.Title>
        </View>

        <Dialog.Content style={styles.content}>
          <Paragraph style={styles.message}>{message}</Paragraph>
        </Dialog.Content>

        <Dialog.Actions style={styles.actions}>
          <Button
            mode="text"
            onPress={onCancel}
            textColor={themeColors.textMuted}
            disabled={loading}
            style={styles.cancelButton}
          >
            {cancelLabel}
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            loading={loading}
            disabled={loading}
            buttonColor={confirmColor}
            textColor="#FFFFFF"
            style={styles.confirmButton}
          >
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: themeColors.surface,
    borderRadius: 16,
    maxWidth: 420,
    width: '90%',
    alignSelf: 'center',
    borderWidth: Platform.OS === 'web' ? 1 : 0.5,
    borderColor: themeColors.border,
    elevation: 8,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: themeColors.text,
    paddingHorizontal: 0,
    marginHorizontal: 0,
    marginVertical: 0,
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  message: {
    color: themeColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    borderRadius: 8,
  },
  confirmButton: {
    borderRadius: 8,
    paddingHorizontal: 8,
  },
});

export default ConfirmationDialog;
