import React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { themeColors } from '../theme';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  style?: StyleProp<ViewStyle>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value,
  onChangeText,
  style,
}) => {
  return (
    <Searchbar
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      iconColor={themeColors.textMuted}
      placeholderTextColor={themeColors.textMuted}
      style={[styles.searchBar, style]}
      inputStyle={styles.input}
    />
  );
};

const styles = StyleSheet.create({
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: themeColors.border,
    elevation: 0,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    color: themeColors.text,
    minHeight: 0, // fixes vertical centering on iOS
  },
});

export default SearchBar;
