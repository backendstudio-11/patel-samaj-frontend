import React from 'react';
import { Portal, Dialog, Button, Paragraph } from 'react-native-paper';
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
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel} style={{ borderRadius: 12 }}>
        <Dialog.Title style={{ fontWeight: 'bold', color: themeColors.text }}>
          {title}
        </Dialog.Title>
        <Dialog.Content>
          <Paragraph style={{ color: themeColors.textMuted }}>{message}</Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onCancel} textColor={themeColors.textMuted} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            onPress={onConfirm}
            loading={loading}
            disabled={loading}
            textColor={themeColors.error}
          >
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default ConfirmationDialog;
