import React from 'react';
import { View, Text, StyleSheet, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useNoteList } from '../../hooks/useNoteList';
import NoteList from '../../components/NoteList';
import MessageInput from '../../components/MessageInput';
import { colors, typography, spacing, shadows, commonStyles } from '../../styles/theme';

export default function ListSlugPage() {
  const { slug } = useLocalSearchParams();
  
  const {
    flatListData,
    isBusy,
    isLoadingMore,
    isRefreshing,
    showHidden,
    setShowHidden,
    newNoteId,
    showDatePicker,
    selectedDate,
    onRefresh,
    loadMore,
    deleteNote,
    addNewNote,
    handleDatePress,
    handleDateChange,
  } = useNoteList(slug);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* List Title */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{slug}</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Show Hidden</Text>
          <Switch
            value={showHidden}
            onValueChange={setShowHidden}
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={showHidden ? '#007AFF' : '#F3F4F6'}
          />
        </View>
      </View>

      {/* Notes List */}
      <NoteList
        flatListData={flatListData}
        isBusy={isBusy}
        isLoadingMore={isLoadingMore}
        isRefreshing={isRefreshing}
        newNoteId={newNoteId}
        showDatePicker={showDatePicker}
        selectedDate={selectedDate}
        onRefresh={onRefresh}
        onLoadMore={loadMore}
        onDeleteNote={deleteNote}
        onDatePress={handleDatePress}
        onDateChange={handleDateChange}
      />

      {/* Message Input FAB */}
      <MessageInput onSend={addNewNote} listSlug={slug} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
  },
  headerContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.tight,
  },
  filtersContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
});
