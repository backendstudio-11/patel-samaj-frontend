import React from 'react';
import { StyleSheet, View, useWindowDimensions, StyleProp, ViewStyle } from 'react-native';
import { Button } from 'react-native-paper';
import { themeColors } from '../theme';
import { PrimaryButton } from './PrimaryButton';

export interface FormActionButtonsProps {
  onCancel?: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  submitColor?: string;
  submitIcon?: string;
  cancelIcon?: string;
  showCancel?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const FormActionButtons: React.FC<FormActionButtonsProps> = ({
  onCancel,
  onSubmit,
  submitLabel = 'SAVE',
  cancelLabel = 'CANCEL',
  loading = false,
  disabled = false,
  submitColor = themeColors.primary,
  submitIcon,
  cancelIcon,
  showCancel = true,
  style,
}) => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 480;

  if (isSmallScreen) {
    return (
      <View style={[styles.columnContainer, style]}>
        {/* On small screen: Save / Submit button is placed ABOVE Cancel button */}
        <PrimaryButton
          onPress={onSubmit}
          loading={loading}
          disabled={disabled || loading}
          color={submitColor}
          icon={submitIcon}
          style={styles.fullWidthSubmitBtn}
        >
          {submitLabel}
        </PrimaryButton>

        {showCancel && onCancel && (
          <Button
            mode="outlined"
            onPress={onCancel}
            textColor={themeColors.textMuted}
            icon={cancelIcon}
            style={styles.fullWidthCancelBtn}
            contentStyle={styles.btnContent}
            disabled={loading || disabled}
          >
            {cancelLabel}
          </Button>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.rowContainer, style]}>
      {/* On large screen: Cancel is on left and Save / Submit is on right */}
      {showCancel && onCancel && (
        <Button
          mode="outlined"
          onPress={onCancel}
          textColor={themeColors.textMuted}
          icon={cancelIcon}
          style={styles.rowCancelBtn}
          contentStyle={styles.btnContent}
          disabled={loading || disabled}
        >
          {cancelLabel}
        </Button>
      )}

      <PrimaryButton
        onPress={onSubmit}
        loading={loading}
        disabled={disabled || loading}
        color={submitColor}
        icon={submitIcon}
        style={styles.rowSubmitBtn}
      >
        {submitLabel}
      </PrimaryButton>
    </View>
  );
};

const styles = StyleSheet.create({
  columnContainer: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },
  rowContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },
  fullWidthSubmitBtn: {
    alignSelf: 'center',
    marginVertical: 0,
    paddingHorizontal: 24,
  },
  fullWidthCancelBtn: {
    alignSelf: 'center',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    borderColor: themeColors.border,
    paddingHorizontal: 24,
  },
  rowSubmitBtn: {
    marginVertical: 0,
    paddingHorizontal: 24,
  },
  rowCancelBtn: {
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    borderColor: themeColors.border,
    paddingHorizontal: 24,
  },
  btnContent: {
    height: 48,
  },
});

export default FormActionButtons;
