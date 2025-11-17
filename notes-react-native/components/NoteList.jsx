// This component is now deprecated for the home page but kept for compatibility
import React from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Text, 
  TouchableOpacity 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import NoteCard from './notecard/NoteCard';
import { colors, typography, spacing, commonStyles } from '../styles/theme';

// Utility function to format date for display
const formatDateDisplay = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  if (formatDate(date) === formatDate(today)) {
    return 'Today';
  } else if (formatDate(date) === formatDate(yesterday)) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
};

export default function NoteList({ 
  flatListData,
  isBusy,
  isLoadingMore,
  isRefreshing,
  newNoteId,
  showDatePicker,
  selectedDate,
  onRefresh,
  onLoadMore,
  onDeleteNote,
  onDatePress,
  onDateChange,
}) {
  const renderItem = ({ item }) => {
    if (item.type === 'date') {
      return (
        <TouchableOpacity
          style={styles.dateHeader}
          onPress={onDatePress}
          activeOpacity={0.7}
        >
          <Text style={styles.dateHeaderText}>{formatDateDisplay(item.date)}</Text>
          <Text style={styles.dateHeaderIcon}>📅</Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <NoteCard
        note={item.data}
        onDelete={onDeleteNote}
        isNew={newNoteId === item.data.id}
      />
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.buttonPrimary} />
      </View>
    );
  };

  if (isBusy) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.buttonPrimary} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={flatListData}
        renderItem={renderItem}
        keyExtractor={(item, index) => 
          item.type === 'date' ? `date-${item.date}` : `note-${item.data.id}`
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
      />
      
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
  },
  dateHeader: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  dateHeaderText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  dateHeaderIcon: {
    fontSize: typography.fontSize.base,
  },
  loadingContainer: {
    ...commonStyles.loadingContainer,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
