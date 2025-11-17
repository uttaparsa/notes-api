import React, { useContext } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { ModalContext } from '../_layout';
import { useNoteList } from '../../hooks/useNoteList';
import NoteList from '../../components/NoteList';
import MessageInput from '../../components/MessageInput';
import { colors, typography, spacing, commonStyles } from '../../styles/theme';

export default function HomePage() {
  const { setShowModal, setModalTitle } = useContext(ModalContext);
  
  const listSlug = 'All';
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
  } = useNoteList(listSlug);

  return (
    <View style={styles.container}>
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
      <MessageInput onSend={addNewNote} listSlug={listSlug} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
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
