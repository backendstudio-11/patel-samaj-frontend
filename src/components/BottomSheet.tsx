import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Searchbar, Button, IconButton, Checkbox } from 'react-native-paper';
import { themeColors } from '../theme';

interface ItemOption {
  id: string;
  name: string;
  price: number;
  availableQty?: number;
}

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: ItemOption[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  singleSelect?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  items,
  selectedIds,
  onSelect,
  singleSelect = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelected, setTempSelected] = useState<string[]>(selectedIds);

  React.useEffect(() => {
    if (visible) {
      setTempSelected(selectedIds);
      setSearchQuery('');
    }
  }, [visible, selectedIds]);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = (id: string) => {
    if (singleSelect) {
      setTempSelected([id]);
    } else {
      if (tempSelected.includes(id)) {
        setTempSelected(tempSelected.filter((item) => item !== id));
      } else {
        setTempSelected([...tempSelected, id]);
      }
    }
  };

  const handleApply = () => {
    onSelect(tempSelected);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <SafeAreaView style={styles.safeContainer}>
            <View style={styles.header}>
              <Text variant="titleMedium" style={styles.headerTitle}>
                {title}
              </Text>
              <IconButton icon="close" size={24} onPress={onClose} iconColor={themeColors.text} />
            </View>

            <Searchbar
              placeholder="Search items..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
            />

            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = tempSelected.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.listItem, isSelected && styles.listItemActive]}
                    onPress={() => handleToggle(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemInfo}>
                      <Text variant="bodyLarge" style={styles.itemName}>
                        {item.name}
                      </Text>
                      <Text variant="bodyMedium" style={styles.itemPrice}>
                        ₹{item.price.toFixed(2)}
                        {item.availableQty !== undefined && ` • Avail: ${item.availableQty}`}
                      </Text>
                    </View>
                    <Checkbox
                      status={isSelected ? 'checked' : 'unchecked'}
                      color={themeColors.primary}
                      onPress={() => handleToggle(item.id)}
                    />
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyView}>
                  <Text style={styles.emptyText}>No items found</Text>
                </View>
              }
            />

            <View style={styles.footer}>
              <Button
                mode="contained"
                onPress={handleApply}
                buttonColor={themeColors.primary}
                style={styles.applyButton}
              >
                Apply Selected ({tempSelected.length})
              </Button>
            </View>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(30, 41, 59, 0.4)', // Overlay blend using secondary navy tone
  },
  sheetContainer: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  safeContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: themeColors.text,
  },
  searchBar: {
    margin: 12,
    backgroundColor: themeColors.background,
    elevation: 0,
    borderWidth: 1,
    borderColor: themeColors.border,
    height: 40,
    alignItems: 'center',
  },
  searchInput: {
    fontSize: 14,
    minHeight: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  listItemActive: {
    backgroundColor: themeColors.saffronLight,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: '500',
    color: themeColors.text,
  },
  itemPrice: {
    color: themeColors.textMuted,
    marginTop: 4,
  },
  emptyView: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: themeColors.textMuted,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
    backgroundColor: themeColors.surface,
  },
  applyButton: {
    borderRadius: 8,
  },
});

export default BottomSheet;
