import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Menu, Button, IconButton } from 'react-native-paper';
import { themeColors } from '../theme';

export interface PaginationControlProps {
  page: number;
  totalPages: number;
  totalElements?: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  pageSizeOptions?: number[];
}

export const PaginationControl: React.FC<PaginationControlProps> = ({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20],
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const effectiveTotalPages = Math.max(1, totalPages);
  const isFirstPage = page === 0;
  const isLastPage = page + 1 >= effectiveTotalPages;

  const startItem = totalElements === 0 ? 0 : page * pageSize + 1;
  const endItem = totalElements !== undefined ? Math.min((page + 1) * pageSize, totalElements) : (page + 1) * pageSize;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.innerContainer}>
          {/* Top Row: Item Count & Dropdown Menu for Page Size */}
          <View style={styles.topRow}>
            <Text style={styles.countText}>
              {totalElements !== undefined
                ? `Showing ${startItem}-${endItem} of ${totalElements}`
                : `Showing items ${startItem}-${endItem}`}
            </Text>

            <View style={styles.pageSizeContainer}>
              <Text style={styles.label}>Items per page:</Text>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => setMenuVisible(true)}
                    icon="chevron-down"
                    contentStyle={styles.dropdownButtonContent}
                    labelStyle={styles.dropdownButtonLabel}
                    style={styles.dropdownButton}
                  >
                    {pageSize}
                  </Button>
                }
              >
                {pageSizeOptions.map((opt) => (
                  <Menu.Item
                    key={opt}
                    onPress={() => {
                      onPageSizeChange(opt);
                      setMenuVisible(false);
                    }}
                    title={`${opt} items`}
                    leadingIcon={opt === pageSize ? 'check' : undefined}
                  />
                ))}
              </Menu>
            </View>
          </View>

          {/* Bottom Row: 5 Navigation Controls (First, Prev, Current Page, Next, Last) */}
          <View style={styles.navigationRow}>
            {/* Direct First Page */}
            <IconButton
              icon="chevron-double-left"
              mode="contained-tonal"
              size={18}
              disabled={isFirstPage}
              onPress={() => onPageChange(0)}
              iconColor={themeColors.primary}
              style={styles.iconBtn}
            />

            {/* Previous Page */}
            <IconButton
              icon="chevron-left"
              mode="contained-tonal"
              size={18}
              disabled={isFirstPage}
              onPress={() => onPageChange(page - 1)}
              iconColor={themeColors.primary}
              style={styles.iconBtn}
            />

            {/* Current Page Number Display */}
            <View style={styles.pageBadge}>
              <Text style={styles.pageNumberText}>
                Page {page + 1} of {effectiveTotalPages}
              </Text>
            </View>

            {/* Next Page */}
            <IconButton
              icon="chevron-right"
              mode="contained-tonal"
              size={18}
              disabled={isLastPage}
              onPress={() => onPageChange(page + 1)}
              iconColor={themeColors.primary}
              style={styles.iconBtn}
            />

            {/* Direct Last Page */}
            <IconButton
              icon="chevron-double-right"
              mode="contained-tonal"
              size={18}
              disabled={isLastPage}
              onPress={() => onPageChange(effectiveTotalPages - 1)}
              iconColor={themeColors.primary}
              style={styles.iconBtn}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: themeColors.surface,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
    marginVertical: 8,
    borderRadius: 12,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
  },
  innerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '500',
    color: themeColors.textMuted,
  },
  pageSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: themeColors.textMuted,
    marginRight: 6,
    fontWeight: '500',
  },
  dropdownButton: {
    borderColor: themeColors.border,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
  },
  dropdownButtonContent: {
    flexDirection: 'row-reverse',
    height: 32,
    paddingHorizontal: 4,
  },
  dropdownButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: themeColors.text,
    marginHorizontal: 4,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    marginHorizontal: 3,
    marginVertical: 0,
  },
  pageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: themeColors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: themeColors.border,
    marginHorizontal: 6,
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: themeColors.text,
  },
});
