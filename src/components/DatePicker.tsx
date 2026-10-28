import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, Modal, Text } from 'react-native';
import { TextInput } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { themeColors } from '../theme';

interface DatePickerProps {
  date: Date | string | null | undefined;
  onChange: (date: Date) => void;
  label?: string;
  minimumDate?: Date;
}

// Safe date constructor centered at Noon local time to prevent UTC -1 day shift
const createSafeDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

// Formats Date as DD-MM-YYYY string for Android & Text Inputs
const formatDMY = (d: Date): string => {
  if (!(d instanceof Date) || isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Formats Date as YYYY-MM-DD for HTML5 native <input type="date">
const formatYMD = (d: Date): string => {
  if (!(d instanceof Date) || isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parses typed date strings (DD-MM-YYYY, DD/MM/YYYY, or YYYY-MM-DD)
const parseDateString = (str: string): Date | null => {
  if (!str) return null;
  const s = str.trim();

  // DD-MM-YYYY or DD/MM/YYYY
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(s)) {
    const parts = s.split(/[\/\-]/).map(Number);
    const d = parts[0];
    const m = parts[1];
    const y = parts[2];
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
      const dateObj = createSafeDate(y, m, d);
      if (!isNaN(dateObj.getTime()) && dateObj.getDate() === d) return dateObj;
    }
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
      const dateObj = createSafeDate(y, m, d);
      if (!isNaN(dateObj.getTime()) && dateObj.getDate() === d) return dateObj;
    }
  }

  return null;
};

export const DatePicker: React.FC<DatePickerProps> = ({
  date,
  onChange,
  label = 'Select Date',
  minimumDate,
}) => {
  const [show, setShow] = useState(false);
  const webInputRef = useRef<HTMLInputElement | null>(null);

  // Derived valid Date object
  const validDate = useMemo(() => {
    if (date instanceof Date && !isNaN(date.getTime())) {
      return createSafeDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
    }
    if (typeof date === 'string' && date.trim()) {
      const parsed = parseDateString(date);
      if (parsed) return parsed;
      const raw = new Date(date);
      if (!isNaN(raw.getTime())) {
        return createSafeDate(raw.getFullYear(), raw.getMonth() + 1, raw.getDate());
      }
    }
    return new Date();
  }, [date]);

  const [inputText, setInputText] = useState<string>(() => formatDMY(validDate));
  const [tempDate, setTempDate] = useState<Date>(validDate);

  // Sync inputText if external date prop changes
  useEffect(() => {
    const formattedExternal = formatDMY(validDate);
    const parsedCurrent = parseDateString(inputText);
    if (!parsedCurrent || formatDMY(parsedCurrent) !== formattedExternal) {
      setInputText(formattedExternal);
    }
  }, [validDate]);

  const handleTextChange = (text: string) => {
    setInputText(text);
    const parsed = parseDateString(text);
    if (parsed) {
      onChange(parsed);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'set' && selectedDate) {
        const safe = createSafeDate(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          selectedDate.getDate()
        );
        setInputText(formatDMY(safe));
        onChange(safe);
      }
    } else {
      // iOS
      if (selectedDate) {
        const safe = createSafeDate(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          selectedDate.getDate()
        );
        setTempDate(safe);
      }
    }
  };

  const closeIOSPicker = () => {
    setShow(false);
    setInputText(formatDMY(tempDate));
    onChange(tempDate);
  };

  const openPicker = () => {
    if (Platform.OS === 'web') {
      if (webInputRef.current) {
        try {
          if (typeof (webInputRef.current as any).showPicker === 'function') {
            (webInputRef.current as any).showPicker();
          } else {
            webInputRef.current.click();
          }
        } catch {
          webInputRef.current.click();
        }
      }
    } else {
      setTempDate(validDate);
      setShow(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          label={label}
          value={inputText}
          onChangeText={handleTextChange}
          placeholder="DD-MM-YYYY"
          mode="outlined"
          right={
            <TextInput.Icon
              icon="calendar"
              onPress={openPicker}
              forceTextInputFocus={false}
            />
          }
          outlineColor={themeColors.border}
          activeOutlineColor={themeColors.primary}
          style={styles.input}
          editable={true}
        />

        {/* Web Native DatePicker Overlay */}
        {Platform.OS === 'web' && (
          <input
            type="date"
            ref={webInputRef}
            value={formatYMD(validDate)}
            min={minimumDate ? formatYMD(minimumDate) : undefined}
            onChange={(e) => {
              if (e.target.value) {
                const [y, m, d] = e.target.value.split('-').map(Number);
                if (y && m && d) {
                  const safe = createSafeDate(y, m, d);
                  setInputText(formatDMY(safe));
                  onChange(safe);
                }
              }
            }}
            onClick={(e) => {
              try {
                if (typeof (e.target as any).showPicker === 'function') {
                  (e.target as any).showPicker();
                }
              } catch (err) {}
            }}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 44,
              height: 44,
              opacity: 0,
              cursor: 'pointer',
              zIndex: 20,
            }}
          />
        )}
      </View>

      {/* Android Native Picker (DD-MM-YYYY format) */}
      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={validDate}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          onChange={handleDateChange}
        />
      )}

      {/* iOS Native Modal Spinner Picker */}
      {Platform.OS === 'ios' && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={show}
          onRequestClose={() => setShow(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closeIOSPicker}>
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                minimumDate={minimumDate}
                onChange={handleDateChange}
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelText: {
    color: themeColors.textMuted,
    fontSize: 16,
  },
  doneText: {
    color: themeColors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  iosPicker: {
    backgroundColor: '#FFFFFF',
    height: 250,
  },
});

export default DatePicker;
